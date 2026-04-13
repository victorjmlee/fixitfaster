import { NextResponse } from "next/server";

async function getKv() {
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const { createClient } = await import("@vercel/kv");
  return createClient({ url, token });
}

/** POST: Home page stores participant name before launching Codespace */
export async function POST(req: Request) {
  try {
    const { participantName, token } = await req.json();
    if (!participantName?.trim() || !token?.trim()) {
      return NextResponse.json({ error: "participantName and token required" }, { status: 400 });
    }
    const kv = await getKv();
    if (!kv) return NextResponse.json({ error: "KV not configured" }, { status: 503 });

    await kv.set(`setup:${token.trim()}`, JSON.stringify({ participantName: participantName.trim() }), { ex: 7200 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** GET: Challenges page resolves participant name from setup token */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const kv = await getKv();
  if (!kv) return NextResponse.json({ error: "KV not configured" }, { status: 503 });

  const raw = await kv.get<string>(`setup:${token}`);
  if (!raw) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json({ participantName: data.participantName });
  } catch {
    return NextResponse.json({ error: "invalid data" }, { status: 500 });
  }
}
