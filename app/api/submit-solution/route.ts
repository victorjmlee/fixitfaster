import { NextResponse } from "next/server";
import {
  getLatestSubmissionByParticipantAndChallenge,
  updateSubmission,
} from "@/lib/store";
import { gradeSolutionOnly } from "@/lib/gemini-grade";

/** 기존 제출에 솔루션(원인/해결) 추가 + 솔루션 0~20점 채점 후 합산 반영 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId, participantName, causeSummary, steps } = body;

    if (!challengeId || !participantName?.trim()) {
      return NextResponse.json(
        { error: "challengeId and participantName are required." },
        { status: 400 }
      );
    }

    const name = String(participantName).trim();
    const submission = getLatestSubmissionByParticipantAndChallenge(name, String(challengeId));
    if (!submission) {
      return NextResponse.json(
        { error: "No submission found for this participant and challenge. Submit from the terminal first." },
        { status: 404 }
      );
    }

    const cause = typeof causeSummary === "string" ? causeSummary.trim() : "";
    const step = typeof steps === "string" ? steps.trim() : "";
    if (!cause && !step) {
      return NextResponse.json(
        { error: "causeSummary or steps is required." },
        { status: 400 }
      );
    }

    const grade = await gradeSolutionOnly(submission.challengeId, cause, step);
    if (!grade.success) {
      return NextResponse.json(
        {
          error: "Grading failed",
          _gradingReason: grade.reason,
        },
        { status: 200 }
      );
    }

    const currentScore = submission.score ?? 0;
    const newScore = Math.min(100, currentScore + grade.score);
    updateSubmission(submission.id, {
      causeSummary: cause || submission.causeSummary,
      steps: step || submission.steps,
      score: newScore,
    });

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      previousScore: currentScore,
      solutionPoints: grade.score,
      newScore,
    });
  } catch (e) {
    console.error("[submit-solution] Error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
