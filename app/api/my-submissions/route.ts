import { NextResponse } from "next/server";
import { getSubmissionChallengeIdsByParticipant, getScoresByParticipant } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const participantName = searchParams.get("participantName")?.trim();
  if (!participantName) {
    return NextResponse.json({ challengeIds: [], scores: {} });
  }
  const challengeIds = await getSubmissionChallengeIdsByParticipant(participantName);
  const scores = await getScoresByParticipant(participantName);
  return NextResponse.json({ challengeIds, scores });
}
