import { NextResponse } from "next/server";
import { getChallenge, type ChallengeLocale } from "@/lib/challenges";
import { REFERENCE_ANSWERS } from "@/lib/reference-answers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") === "ko" ? "ko" : "en") as ChallengeLocale;
  const challenge = getChallenge(id, locale);
  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ref = REFERENCE_ANSWERS[id];
  const scoreGuide = ref?.scoreGuide ? ref.scoreGuide[locale] ?? ref.scoreGuide.ko : undefined;
  const artifactScore = ref?.artifactScore;
  return NextResponse.json({
    ...challenge,
    scoreGuide,
    artifactScore,
  });
}
