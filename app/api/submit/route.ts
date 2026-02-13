import { NextResponse } from "next/server";
import { addSubmission, updateSubmission } from "@/lib/store";
import { getAndConsumeArtifacts } from "@/lib/artifacts-store";
import { gradeSubmission } from "@/lib/gemini-grade";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      challengeId,
      participantName,
      solution,
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

    const text = typeof solution === "string" && solution.trim() !== ""
      ? solution.trim()
      : "";
    const cause = typeof causeSummary === "string" ? causeSummary : text;
    const step = typeof steps === "string" ? steps : text;

    const participantNameTrimmed = String(participantName).trim();
    const submission = addSubmission({
      challengeId: String(challengeId),
      participantName: participantNameTrimmed,
      causeSummary: cause || text,
      steps: step || text,
      docLinks: String(docLinks ?? ""),
      elapsedSeconds: Math.floor(Number(elapsedSeconds)),
    });

    const artifacts = await getAndConsumeArtifacts(submission.challengeId, participantNameTrimmed);

    if (artifacts?.trim()) {
      const sample = artifacts.slice(0, 200).replace(/\n/g, " ");
      console.log("[submit] Artifacts present challengeId=%s name=%s len=%d sample=%s", submission.challengeId, participantNameTrimmed, artifacts.length, sample);
    }

    // 채점은 Codespace에서 보낸 artifacts가 있을 때만 수행
    if (!artifacts || !artifacts.trim()) {
      console.log("[submit] No artifacts — grading skipped (Codespace-only) lookupKey=%s:%s", submission.challengeId, participantNameTrimmed);
      return NextResponse.json({
        ...submission,
        _gradingSkipped: true,
        _gradingHint:
          "채점을 받으려면 Codespace 터미널에서 artifacts 스크립트를 먼저 실행한 뒤, 같은 이름으로 제출해 주세요. (랩 → Codespaces 문서 참고)",
        _gradingReason: "no_artifacts",
      });
    }

    const grade = await gradeSubmission(
      submission.challengeId,
      submission.causeSummary,
      submission.steps,
      artifacts
    );
    if (grade.success) {
      updateSubmission(submission.id, { score: grade.score });
      submission.score = grade.score;
      console.log("[submit] Grading ok challengeId=%s score=%s", submission.challengeId, grade.score);
      return NextResponse.json(submission);
    }
    console.warn("[submit] Grading skipped challengeId=%s reason=%s", submission.challengeId, grade.reason);
    const hintByReason: Record<string, string> = {
      no_key: "GEMINI_API_KEY를 .env.local 또는 Vercel 환경변수에 설정하면 채점이 가능합니다.",
      no_ref: "해당 챌린지의 참조 답변이 없어 채점을 건너뜁니다.",
      quota:
        "Gemini API 무료 한도를 초과했습니다. 결제/플랜 확인: https://ai.google.dev/gemini-api",
      api_error: "Gemini API 오류로 채점을 건너뜁니다. 서버 로그를 확인하세요.",
    };
    return NextResponse.json({
      ...submission,
      _gradingSkipped: true,
      _gradingHint: hintByReason[grade.reason] ?? grade.reason,
      _gradingReason: grade.reason,
    });
  } catch (e) {
    console.error("[submit] Error:", e instanceof Error ? e.message : String(e), e instanceof Error ? e.stack : "");
    return NextResponse.json(
      { error: "Invalid request", _debug: process.env.NODE_ENV === "development" ? String(e) : undefined },
      { status: 400 }
    );
  }
}
