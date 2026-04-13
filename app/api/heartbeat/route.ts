import { NextResponse } from "next/server";

const HB_TTL = 45; // 3x the 15s push interval

async function getKv() {
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const { createClient } = await import("@vercel/kv");
  return createClient({ url, token });
}

/** POST: artifact-server calls this every push cycle */
export async function POST(req: Request) {
  try {
    const { codespaceId } = await req.json();
    if (!codespaceId?.trim()) {
      return NextResponse.json({ error: "codespaceId required" }, { status: 400 });
    }
    const kv = await getKv();
    if (!kv) return NextResponse.json({ error: "KV not configured" }, { status: 503 });

    await kv.set(`hb:${codespaceId.trim()}`, Date.now(), { ex: HB_TTL });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** GET: browser checks connection status */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codespaceId = searchParams.get("codespaceId")?.trim();
  if (!codespaceId) {
    return NextResponse.json({ connected: false });
  }

  const kv = await getKv();
  if (!kv) return NextResponse.json({ connected: false });

  const ts = await kv.get<number>(`hb:${codespaceId}`);
  if (!ts) return NextResponse.json({ connected: false, lastSeen: null });

  const age = Date.now() - ts;
  return NextResponse.json({
    connected: age < HB_TTL * 1000,
    age,
    lastSeen: ts,
  });
}
