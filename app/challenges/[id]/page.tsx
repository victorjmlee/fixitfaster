"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

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

/** 메인 제출 폼: artifact(자동 push) + 솔루션(선택) 통합 */
function SubmitForm({
  challengeId,
  locale,
  elapsed,
  participantName,
  codespaceId,
  scoreGuide,
  onSubmit,
}: {
  challengeId: string;
  locale: string;
  elapsed: number;
  participantName: string | null;
  codespaceId: string | null;
  scoreGuide?: string;
  onSubmit: () => void;
}) {
  const [causeSummary, setCauseSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score?: number; _gradingSkipped?: boolean; _gradingHint?: string; _gradingReason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!participantName?.trim() && !submitting && !result;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          participantName: participantName!.trim(),
          codespaceId: codespaceId || undefined,
          causeSummary: causeSummary.trim(),
          steps: steps.trim(),
          elapsedSeconds: elapsed,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onSubmit();
      } else {
        setError(data.error || "Submit failed");
      }
    } catch {
      setError("Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {scoreGuide && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
          {scoreGuide}
        </div>
      )}

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

/** 솔루션 전용 시나리오(보너스) 제출 폼 */
function SolutionForm({
  challengeId,
  participantName,
  locale,
  scoreGuide,
}: {
  challengeId: string;
  participantName: string | null;
  locale: string;
  scoreGuide?: string;
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
        setResult({ ok: false, error: data.error || "Failed" });
      }
    } catch {
      setResult({ ok: false, error: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {scoreGuide && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
          {scoreGuide}
        </div>
      )}
      <p className="text-xs text-zinc-400">
        {locale === "ko"
          ? "원인과 해결 방법을 적어 보내면 AI가 채점합니다."
          : "Write the cause and resolution below. AI will grade your answer."}
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
          rows={3}
          className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-full resize-y"
        />
      </div>
      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={submit}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50 hover:opacity-90"
      >
        {loading ? (locale === "ko" ? "채점 중…" : "Grading…") : (locale === "ko" ? "제출하기" : "Submit")}
      </button>
      {result && (
        <p className={`text-sm ${result.ok ? "text-[var(--accent)]" : "text-amber-400"}`}>
          {result.ok
            ? (locale === "ko" ? `채점 완료: ${result.solutionPoints}점` : `Score: ${result.solutionPoints}`)
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
  const codespaceId = searchParams.get("codespace")?.trim() ?? null;
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
          {!participantNameFromUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-zinc-400">
                {locale === "ko" ? "이름:" : "Name:"}
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
          {challenge.artifactScore !== 0 ? (
            <SubmitForm
              challengeId={id}
              locale={locale}
              elapsed={elapsed}
              participantName={participantName}
              codespaceId={codespaceId}
              scoreGuide={challenge.scoreGuide}
              onSubmit={stopTimer}
            />
          ) : (
            <SolutionForm
              challengeId={id}
              participantName={participantName}
              locale={locale}
              scoreGuide={challenge.scoreGuide}
            />
          )}
          <p className="text-sm text-zinc-500">
            {locale === "ko" ? "리더보드에서 점수를 확인하세요." : "Check your score on the leaderboard."}
            {" "}
            <a href="/leaderboard" className="text-[var(--accent)] hover:underline">/leaderboard</a>
          </p>
        </div>
      )}

      {challenges.length > 0 && (() => {
        const idx = challenges.findIndex((c) => c.id === id);
        const nextChallenge = idx >= 0 && idx < challenges.length - 1 ? challenges[idx + 1] : null;
        const params = new URLSearchParams();
        if (participantName) params.set("participantName", participantName);
        if (codespaceId) params.set("codespace", codespaceId);
        const qs = params.toString() ? `?${params.toString()}` : "";
        return (
          <div className="flex gap-6 pt-2">
            {nextChallenge ? (
              <Link href={`/challenges/${nextChallenge.id}${qs}`} className="text-[var(--accent)] hover:underline">
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
