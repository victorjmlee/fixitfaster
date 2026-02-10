import { NextResponse } from "next/server";
import { addSubmission } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      challengeId,
      participantName,
      causeSummary,
      steps,
      docLinks,
      elapsedSeconds,
    } = body;

    if (
      !challengeId ||
      !participantName?.trim() ||
      typeof elapsedSeconds !== "number" ||
      elapsedSeconds < 0
    ) {
      return NextResponse.json(
        { error: "challengeId, participantName, and elapsedSeconds (number) are required." },
        { status: 400 }
      );
    }

    const submission = addSubmission({
      challengeId: String(challengeId),
      participantName: String(participantName).trim(),
      causeSummary: String(causeSummary ?? ""),
      steps: String(steps ?? ""),
      docLinks: String(docLinks ?? ""),
      elapsedSeconds: Math.floor(Number(elapsedSeconds)),
    });

    return NextResponse.json(submission);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
