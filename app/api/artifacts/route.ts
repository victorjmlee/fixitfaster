import { NextResponse } from "next/server";
import { saveArtifacts } from "@/lib/artifacts-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId, participantName, artifacts } = body;

    if (!challengeId || !participantName?.trim()) {
      return NextResponse.json(
        { error: "challengeId and participantName are required." },
        { status: 400 }
      );
    }

    const cid = String(challengeId);
    const name = String(participantName).trim();
    const text = typeof artifacts === "string" ? artifacts : String(artifacts ?? "");
    await saveArtifacts(cid, name, text);
    console.log("[artifacts] Saved key=%s:%s len=%d", cid, name, text.length);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[artifacts] Error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
