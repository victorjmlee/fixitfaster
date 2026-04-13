import { NextResponse } from "next/server";
import { getSubmissionChallengeIdsByParticipant, getScoresByParticipant } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const participantName = searchParams.get("participantName")?.trim();
  if (!participantName) {
    return NextResponse.json({ challengeIds: [], scores: {} });
  }
  const challengeIds = getSubmissionChallengeIdsByParticipant(participantName);
  const scores = getScoresByParticipant(participantName);
  return NextResponse.json({ challengeIds, scores });
}
