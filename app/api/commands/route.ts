import { NextResponse } from "next/server";

/**
 * Command queue for Codespace remote execution.
 * Browser queues commands → stored in KV → artifact-server polls & executes → reports back.
 *
 * KV key: `cmd:{codespaceId}` → JSON array of CommandEntry
 */

type CommandEntry = {
  id: string;
  command: string;
  status: "pending" | "running" | "done" | "error";
  output?: string;
  payload?: Record<string, string>;
  queuedAt: number;
  doneAt?: number;
};

const ALLOWED_COMMANDS: Record<string, string> = {
  "agent-restart": "docker compose --env-file .env.local restart agent",
  "rebuild": "docker compose --env-file .env.local up -d --build",
  "agent-status": "docker exec fixitfaster-agent agent status 2>&1 | head -80",
  "force-push": "_internal",
  "setup": "_internal",
};

const TTL_SEC = 600; // 10 minutes

async function getKv() {
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const { createClient } = await import("@vercel/kv");
  return createClient({ url, token });
}

function kvKey(codespaceId: string) {
  return `cmd:${codespaceId.trim()}`;
}

/** POST: Queue a command */
export async function POST(req: Request) {
  try {
    const { codespaceId, command, payload } = await req.json();
    if (!codespaceId?.trim() || !command?.trim()) {
      return NextResponse.json({ error: "codespaceId and command required" }, { status: 400 });
    }
    if (!ALLOWED_COMMANDS[command]) {
      return NextResponse.json({ error: `Unknown command: ${command}. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(", ")}` }, { status: 400 });
    }

    const kv = await getKv();
    if (!kv) {
      return NextResponse.json({ error: "KV not configured" }, { status: 503 });
    }

    const k = kvKey(codespaceId);
    const existing: CommandEntry[] = (await kv.get<CommandEntry[]>(k)) ?? [];
    const entry: CommandEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      command,
      status: "pending",
      ...(command === "setup" && payload ? { payload } : {}),
      queuedAt: Date.now(),
    };
    existing.push(entry);
    await kv.set(k, JSON.stringify(existing), { ex: TTL_SEC });

    return NextResponse.json({ ok: true, commandId: entry.id, shell: ALLOWED_COMMANDS[command] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** GET: Poll pending commands (artifact-server calls this) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codespaceId = searchParams.get("codespaceId")?.trim();
  if (!codespaceId) {
    return NextResponse.json({ commands: [] });
  }

  const kv = await getKv();
  if (!kv) return NextResponse.json({ commands: [] });

  const k = kvKey(codespaceId);
  const entries: CommandEntry[] = (await kv.get<CommandEntry[]>(k)) ?? [];
  const pending = entries.filter((e) => e.status === "pending");

  return NextResponse.json({
    commands: pending.map((e) => ({
      id: e.id,
      command: e.command,
      shell: ALLOWED_COMMANDS[e.command] || e.command,
      ...(e.payload ? { payload: e.payload } : {}),
    })),
    all: entries,
  });
}

/** PATCH: Update command status (artifact-server reports back) */
export async function PATCH(req: Request) {
  try {
    const { codespaceId, commandId, status, output } = await req.json();
    if (!codespaceId?.trim() || !commandId?.trim()) {
      return NextResponse.json({ error: "codespaceId and commandId required" }, { status: 400 });
    }

    const kv = await getKv();
    if (!kv) return NextResponse.json({ error: "KV not configured" }, { status: 503 });

    const k = kvKey(codespaceId);
    const entries: CommandEntry[] = (await kv.get<CommandEntry[]>(k)) ?? [];
    const entry = entries.find((e) => e.id === commandId);
    if (!entry) return NextResponse.json({ error: "Command not found" }, { status: 404 });

    entry.status = status || "done";
    entry.output = typeof output === "string" ? output.slice(0, 5000) : "";
    entry.doneAt = Date.now();
    await kv.set(k, JSON.stringify(entries), { ex: TTL_SEC });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
