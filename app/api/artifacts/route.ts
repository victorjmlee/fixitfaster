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

    const text = typeof artifacts === "string" ? artifacts : String(artifacts ?? "");
    saveArtifacts(String(challengeId), String(participantName).trim(), text);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[artifacts] Error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
