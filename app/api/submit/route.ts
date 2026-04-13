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
    const submission = await addSubmission({
      challengeId: String(challengeId),
      participantName: participantNameTrimmed,
      causeSummary: cause || text,
      steps: step || text,
      docLinks: String(docLinks ?? ""),
      elapsedSeconds: Math.floor(Number(elapsedSeconds)),
    });

    // Artifacts from Redis (auto-pushed by Codespace every 15s)
    const inlineArtifacts = typeof body.artifacts === "string" ? body.artifacts.trim() : "";
    const codespaceId = typeof body.codespaceId === "string" ? body.codespaceId.trim() : null;
    let artifacts = inlineArtifacts || await getAndConsumeArtifacts(submission.challengeId, participantNameTrimmed, codespaceId);

    // If no artifacts yet, trigger force-push via command queue and poll
    if ((!artifacts || !artifacts.trim()) && codespaceId) {
      try {
        await fetch(new URL("/api/commands", req.url).origin + "/api/commands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codespaceId, command: "force-push" }),
        });
      } catch {}
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        artifacts = await getAndConsumeArtifacts(submission.challengeId, participantNameTrimmed, codespaceId);
        if (artifacts?.trim()) break;
      }
    }

    if (artifacts?.trim()) {
      const sample = artifacts.slice(0, 200).replace(/\n/g, " ");
      console.log("[submit] Artifacts present challengeId=%s name=%s len=%d sample=%s", submission.challengeId, participantNameTrimmed, artifacts.length, sample);
    }

    // 채점은 Codespace에서 보낸 artifacts가 있을 때만 수행
    if (!artifacts || !artifacts.trim()) {
      const reason = codespaceId ? "no_artifacts" : "no_codespace";
      console.log("[submit] No artifacts — grading skipped reason=%s challengeId=%s name=%s codespaceId=%s", reason, submission.challengeId, participantNameTrimmed, codespaceId ?? "(none)");
      return NextResponse.json({
        ...submission,
        _gradingSkipped: true,
        _gradingReason: reason,
      });
    }

    const grade = await gradeSubmission(
      submission.challengeId,
      submission.causeSummary,
      submission.steps,
      artifacts
    );
    if (grade.success) {
      await updateSubmission(submission.id, { score: grade.score, artifactScore: grade.artifactScore });
      submission.score = grade.score;
      console.log("[submit] Grading ok challengeId=%s score=%s artifact=%s", submission.challengeId, grade.score, grade.artifactScore);
      return NextResponse.json({ ...submission, artifactScore: grade.artifactScore });
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
