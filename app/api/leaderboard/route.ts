import { NextResponse } from "next/server";
import { getLeaderboard, getLeaderboardAggregated } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challengeId = searchParams.get("challengeId") || undefined;
  // 기본: 참가자별 합산 등수. challengeId 있으면 해당 챌린지 제출 목록.
  const list = challengeId ? await getLeaderboard(challengeId) : await getLeaderboardAggregated();
  return NextResponse.json(list);
}
