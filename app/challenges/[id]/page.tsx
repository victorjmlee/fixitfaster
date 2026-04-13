"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

const CODESPACE_URL_KEY = "fixitfaster_codespace_url";

type Challenge = {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: string;
  products: string;
  symptomSummary: string;
  environment: string;
  steps: string;
  allowedResources: string;
  helpfulCommands: string;
  /** 시나리오별 점수 안내 (결과 50점 + 솔루션 20점 = 만점 70점 등) */
  scoreGuide?: string;
  artifactScore?: number;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 메인 제출 폼: Codespace에서 아티팩트 수집 + 제출을 한 번에 */
function SubmitForm({
  challengeId,
  locale,
  elapsed,
  participantName,
  onSubmit,
}: {
  challengeId: string;
  locale: string;
  elapsed: number;
  participantName: string | null;
  onSubmit: () => void;
}) {
  const [codespaceUrl, setCodespaceUrl] = useState("");
  const [causeSummary, setCauseSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score?: number; _gradingSkipped?: boolean; _gradingHint?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { setCodespaceUrl(sessionStorage.getItem(CODESPACE_URL_KEY) || ""); } catch {}
  }, []);
  useEffect(() => {
    try { if (codespaceUrl) sessionStorage.setItem(CODESPACE_URL_KEY, codespaceUrl); } catch {}
  }, [codespaceUrl]);

  const canSubmit = !!participantName?.trim() && !!codespaceUrl.trim() && !submitting && !result;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const baseUrl = codespaceUrl.trim().replace(/\/$/, "");
      let artifacts = "";
      try {
        const artifactRes = await fetch(`${baseUrl}/artifacts`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!artifactRes.ok) throw new Error("status " + artifactRes.status);
        const data = await artifactRes.json();
        artifacts = data.artifacts || "";
      } catch {
        setError(
          locale === "ko"
            ? "Codespace에 연결할 수 없습니다. URL을 확인하고, Codespace PORTS 탭에서 4000번 포트가 Public인지 확인하세요."
            : "Cannot reach Codespace. Check the URL and make sure port 4000 is set to Public in the PORTS tab."
        );
        setSubmitting(false);
        return;
      }

      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          participantName: participantName!.trim(),
          artifacts,
          causeSummary: causeSummary.trim(),
          steps: steps.trim(),
          elapsedSeconds: elapsed,
        }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok) {
        setResult(submitData);
        onSubmit();
      } else {
        setError(submitData.error || "Submit failed");
      }
    } catch {
      setError("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1">
        <label className="text-xs text-zinc-400">
          Codespace Artifact Server URL
        </label>
        <input
          type="url"
          value={codespaceUrl}
          onChange={(e) => setCodespaceUrl(e.target.value)}
          placeholder="https://xxx-4000.app.github.dev"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 w-full font-mono"
        />
        <p className="text-xs text-zinc-500">
          {locale === "ko"
            ? "Codespace PORTS 탭 → 4000번 포트 주소를 붙여넣기 (Visibility: Public 필수)"
            : "Paste port 4000 address from Codespace PORTS tab (Visibility must be Public)"}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3 space-y-2">
        <p className="text-xs text-zinc-400">
          {locale === "ko"
            ? "선택: 원인/해결을 작성하면 추가 점수를 받을 수 있습니다."
            : "Optional: Write cause/resolution for bonus points."}
        </p>
        <div className="grid gap-2">
          <textarea
            value={causeSummary}
            onChange={(e) => setCauseSummary(e.target.value)}
            placeholder={locale === "ko" ? "원인 요약" : "Cause summary"}
            rows={2}
            className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-full resize-y"
          />
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={locale === "ko" ? "해결 단계" : "Resolution steps"}
            rows={2}
            className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-full resize-y"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50 hover:opacity-90"
      >
        {submitting
          ? (locale === "ko" ? "제출 중…" : "Submitting…")
          : (locale === "ko" ? "제출하기" : "Submit")}
      </button>

      {result && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
          {result.score != null
            ? (locale === "ko" ? `채점 완료: ${result.score}점` : `Score: ${result.score}`)
            : (locale === "ko" ? "제출됨 (채점 보류)" : "Submitted (grading pending)")}
          {result._gradingHint && (
            <p className="text-xs mt-1 text-zinc-400">{result._gradingHint}</p>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-amber-400">{error}</p>
      )}
    </div>
  );
}

/** 솔루션(원인/해결) 추가 제출 (기존 제출에 보너스 점수 추가) */
function SolutionForm({
  challengeId,
  participantName,
  locale,
  scoreGuide,
  isSolutionOnly,
}: {
  challengeId: string;
  participantName: string | null;
  locale: string;
  scoreGuide?: string;
  isSolutionOnly?: boolean;
}) {
  const [causeSummary, setCauseSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; newScore?: number; solutionPoints?: number; error?: string } | null>(null);

  const canSubmit = (causeSummary.trim() || steps.trim()) && participantName?.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/submit-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          participantName: participantName!.trim(),
          causeSummary: causeSummary.trim(),
          steps: steps.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({ ok: true, newScore: data.newScore, solutionPoints: data.solutionPoints });
      } else {
        setResult({ ok: false, error: data.error || (res.status === 404 ? (locale === "ko" ? "먼저 제출해 주세요." : "Submit first.") : "Failed") });
      }
    } catch {
      setResult({ ok: false, error: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">
        {isSolutionOnly
          ? (locale === "ko" ? "솔루션 작성 (보너스 채점)" : "Submit solution (bonus)")
          : (locale === "ko" ? "솔루션 추가 제출 (0~20점 추가)" : "Add solution (0–20 bonus pts)")}
      </h3>
      {scoreGuide && (
        <p className="text-xs text-[var(--accent)]">{scoreGuide}</p>
      )}
      <p className="text-xs text-zinc-400">
        {isSolutionOnly
          ? (locale === "ko"
              ? "원인과 해결 방법을 적어 보내면 AI가 채점합니다."
              : "Write the cause and resolution below. AI will grade your answer.")
          : (locale === "ko"
              ? "제출 후 원인·해결을 적어 보내면 AI가 채점해 최대 20점을 더해 줍니다."
              : "After submitting, add cause and resolution here for up to 20 extra points.")}
      </p>
      <div className="grid gap-2">
        <label className="text-xs text-zinc-400">
          {locale === "ko" ? "원인 요약" : "Cause summary"}
        </label>
        <textarea
          value={causeSummary}
          onChange={(e) => setCauseSummary(e.target.value)}
          placeholder={locale === "ko" ? "원인을 간단히" : "Brief cause"}
          rows={2}
          className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-full resize-y"
        />
        <label className="text-xs text-zinc-400">
          {locale === "ko" ? "해결 단계" : "Resolution steps"}
        </label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={locale === "ko" ? "수정한 내용·단계" : "What you changed / steps"}
          rows={3}
          className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-full resize-y"
        />
      </div>
      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={submit}
        className="rounded border border-[var(--accent)] bg-[var(--accent)]/20 px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-50 hover:bg-[var(--accent)]/30"
      >
        {loading ? (locale === "ko" ? "채점 중…" : "Grading…") : (locale === "ko" ? "솔루션 제출 (채점)" : "Submit solution (grade)")}
      </button>
      {result && (
        <p className={`text-sm ${result.ok ? "text-[var(--accent)]" : "text-amber-400"}`}>
          {result.ok
            ? (locale === "ko" ? `반영됨: 솔루션 +${result.solutionPoints}점 → 총 ${result.newScore}점` : `Done: +${result.solutionPoints} pts → total ${result.newScore}`)
            : result.error}
        </p>
      )}
    </div>
  );
}

function ChallengePageContent() {
  const { t, locale } = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challenges, setChallenges] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [timerStopped, setTimerStopped] = useState(false);
  // 참가자 이름: URL에서만 사용 (localStorage 사용 안 함 → 공용 브라우저에서 Aaron/이종민 섞임 방지)
  const participantNameFromUrl = searchParams.get("participantName")?.trim() ?? null;
  const [participantNameLocal, setParticipantNameLocal] = useState(participantNameFromUrl ?? "");
  const participantName = participantNameFromUrl ?? (participantNameLocal.trim() || null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setParticipantNameLocal(participantNameFromUrl ?? "");
    if (participantNameFromUrl) {
      try { sessionStorage.setItem("fixitfaster-participant-name", participantNameFromUrl); } catch { /* ignore */ }
    }
  }, [participantNameFromUrl]);

  const tick = useCallback(() => setElapsed((s) => s + 1), []);

  useEffect(() => {
    fetch(`/api/challenges/${id}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setChallenge)
      .finally(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => (r.ok ? r.json() : []))
      .then(setChallenges);
  }, []);

  useEffect(() => {
    if (started && !timerStopped) {
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [started, timerStopped, tick]);

  const handleStart = () => setStarted(true);

  const stopTimer = useCallback(() => {
    setTimerStopped(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  if (loading || !challenge) {
    return (
      <div className="flex justify-center py-16">
        <span className="text-zinc-500">{loading ? t("challenge.loading") : t("challenge.notFound")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          {t(`scenario.${challenge.id}`).startsWith("scenario.") ? challenge.title : t(`scenario.${challenge.id}`)}
        </h1>
        <p className="text-sm text-zinc-500">
          {challenge.difficulty} · {challenge.estimatedMinutes} · {challenge.products}
        </p>
      </div>

      {!started ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-zinc-400">{t("challenge.readThenStart")}</p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-4 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--bg)] hover:opacity-90"
          >
            {t("challenge.start")}
          </button>
        </div>
      ) : (
        <div className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <span className="font-mono text-lg text-[var(--accent)]">{formatTime(elapsed)}</span>
          <span className="text-sm text-zinc-500">
            {timerStopped ? (locale === "ko" ? "기록된 시간" : "Recorded time") : t("challenge.elapsed")}
          </span>
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">{t("challenge.symptomSummary")}</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.symptomSummary || "-"}</div>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">{t("challenge.stepsToReproduce")}</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.steps || "-"}</div>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">{t("challenge.allowedResources")}</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.allowedResources || "-"}</div>
        </section>
        {challenge.helpfulCommands ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="mb-2 text-base font-semibold text-white">{t("challenge.helpfulCommands")}</h2>
            <div className="whitespace-pre-wrap font-mono text-zinc-300 text-sm">{challenge.helpfulCommands}</div>
          </section>
        ) : null}
      </div>

      {started && (
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-base font-semibold text-white">{t("challenge.submit")}</h2>
          {challenge.scoreGuide ? (
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
              {challenge.scoreGuide}
            </div>
          ) : null}
          {!participantNameFromUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-zinc-400">
                {locale === "ko" ? "제출할 때 사용할 이름 (URL에 없으면 여기 입력):" : "Your name for submission (if not in URL, enter here):"}
              </label>
              <input
                type="text"
                value={participantNameLocal}
                onChange={(e) => setParticipantNameLocal(e.target.value)}
                placeholder={locale === "ko" ? "예: Aaron" : "e.g. Aaron"}
                className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 w-40"
              />
            </div>
          )}
          {participantNameFromUrl && (
            <p className="text-sm text-[var(--accent)]">
              {locale === "ko" ? `제출 이름: ${participantNameFromUrl}` : `Submitting as: ${participantNameFromUrl}`}
            </p>
          )}
          {challenge.artifactScore !== 0 && (
            <SubmitForm
              challengeId={id}
              locale={locale}
              elapsed={elapsed}
              participantName={participantName}
              onSubmit={stopTimer}
            />
          )}
          <p className="text-sm text-zinc-500">
            {locale === "ko" ? "채점 후 리더보드에서 점수를 확인하세요." : "Check your score on the leaderboard after grading."}
            {" "}
            <a href="/leaderboard" className="text-[var(--accent)] hover:underline">/leaderboard</a>
          </p>

          <SolutionForm
            challengeId={id}
            participantName={participantName}
            locale={locale}
            scoreGuide={challenge.scoreGuide}
            isSolutionOnly={challenge.artifactScore === 0}
          />
        </div>
      )}

      {challenges.length > 0 && (() => {
        const idx = challenges.findIndex((c) => c.id === id);
        const nextChallenge = idx >= 0 && idx < challenges.length - 1 ? challenges[idx + 1] : null;
        const nameParam = participantName ? `?participantName=${encodeURIComponent(participantName)}` : "";
        return (
          <div className="flex gap-6 pt-2">
            {nextChallenge ? (
              <Link href={`/challenges/${nextChallenge.id}${nameParam}`} className="text-[var(--accent)] hover:underline">
                {locale === "ko" ? `다음 시나리오 →` : `Next scenario →`}
              </Link>
            ) : (
              <Link href="/challenges" className="text-[var(--accent)] hover:underline">
                {locale === "ko" ? `← 챌린지 목록으로` : `← Back to Challenges`}
              </Link>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function ChallengePageFallback() {
  const { t } = useLocale();
  return (
    <div className="flex justify-center py-16">
      <span className="text-zinc-500">{t("challenge.loading")}</span>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<ChallengePageFallback />}>
      <ChallengePageContent />
    </Suspense>
  );
}
