import { NextResponse } from "next/server";
import {
  getLatestSubmissionByParticipantAndChallenge,
  updateSubmission,
  addSubmission,
} from "@/lib/store";
import { gradeSolutionOnly } from "@/lib/gemini-grade";
import { REFERENCE_ANSWERS } from "@/lib/reference-answers";

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
    const cid = String(challengeId);
    let submission = getLatestSubmissionByParticipantAndChallenge(name, cid);

    // 솔루션 전용 시나리오(보너스)는 터미널 제출 없이도 제출 가능 — 자동 생성
    if (!submission) {
      const ref = REFERENCE_ANSWERS[cid];
      const isSolutionOnly = ref && (!ref.artifactCheck || ref.artifactCheck.length === 0);
      if (!isSolutionOnly) {
        return NextResponse.json(
          { error: "No submission found for this participant and challenge. Submit from the terminal first." },
          { status: 404 }
        );
      }
      submission = addSubmission({
        challengeId: cid,
        participantName: name,
        causeSummary: "",
        steps: "",
        docLinks: "",
        elapsedSeconds: 0,
        score: 0,
        artifactScore: 0,
      });
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

    const baseScore = submission.artifactScore ?? submission.score ?? 0;
    const newScore = Math.min(100, baseScore + grade.score);
    updateSubmission(submission.id, {
      causeSummary: cause || submission.causeSummary,
      steps: step || submission.steps,
      score: newScore,
    });

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      previousScore: submission.score ?? 0,
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
