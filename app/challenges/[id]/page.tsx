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

function scoreMessage(score: number, locale: string): string {
  if (locale === "ko") {
    if (score >= 86) return "완벽해요!";
    if (score >= 61) return "잘했어요!";
    if (score >= 31) return "거의 다 왔어요!";
    return "다시 도전!";
  }
  if (score >= 86) return "Perfect!";
  if (score >= 61) return "Nice work!";
  if (score >= 31) return "Getting there!";
  return "Keep trying!";
}

function ScoreReveal({ score, locale }: { score: number; locale: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * score));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  return (
    <div className={`animate-score-pop text-center py-3 ${score >= 80 ? "score-glow rounded-lg" : ""}`}>
      <p className="font-mono text-4xl font-bold text-[var(--accent)]">{display}</p>
      <p className="text-sm text-zinc-400 mt-1">{scoreMessage(score, locale)}</p>
    </div>
  );
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
  const [result, setResult] = useState<{ score?: number; _gradingSkipped?: boolean; _gradingReason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!participantName?.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

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
          ? (<><span className="animate-spinner mr-2" />{locale === "ko" ? "채점 중…" : "Grading…"}</>)
          : result
            ? (locale === "ko" ? "다시 제출하기" : "Re-submit")
            : (locale === "ko" ? "제출하기" : "Submit")}
      </button>

      {result && (
        <div className="animate-slide-up rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-[var(--accent)]">
          {result.score != null ? (
            <>
              <ScoreReveal score={result.score} locale={locale} />
              {!(causeSummary.trim() || steps.trim()) && (
                <p className="text-xs text-center text-zinc-400 mt-2">
                  {locale === "ko"
                    ? "원인과 해결 방법을 작성하고 다시 제출하면 추가 점수를 받을 수 있습니다."
                    : "Write cause and resolution above, then re-submit for bonus points."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-center">
              {locale === "ko"
                ? "제출 완료 — 리더보드에서 결과를 확인하세요."
                : "Submitted — check the leaderboard for results."}
            </p>
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
  onSubmit,
}: {
  challengeId: string;
  participantName: string | null;
  locale: string;
  scoreGuide?: string;
  onSubmit?: () => void;
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
        onSubmit?.();
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
            {locale === "ko" ? "타이머 시작" : "Start Timer"}
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            {locale === "ko" ? "클릭하면 타이머가 바로 시작됩니다." : "Timer starts immediately on click."}
          </p>
        </div>
      ) : (
        <div className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${timerStopped ? "bg-[var(--accent)]" : "bg-green-400 animate-pulse-dot"}`} />
            <span className="font-mono text-lg text-[var(--accent)]">{formatTime(elapsed)}</span>
            {challenges.length > 1 && (
              <span className="text-xs text-zinc-600">
                {Math.max(1, challenges.findIndex((c) => c.id === id) + 1)}/{challenges.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              {timerStopped ? (locale === "ko" ? "기록된 시간" : "Recorded time") : t("challenge.elapsed")}
            </span>
            <a href="#submit-section" className="text-xs text-[var(--accent)] hover:underline">
              {locale === "ko" ? "제출 ↓" : "Submit ↓"}
            </a>
          </div>
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
        <div id="submit-section" className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
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
              onSubmit={stopTimer}
            />
          )}
          {timerStopped && challenges.length > 0 && (() => {
            const idx = challenges.findIndex((c) => c.id === id);
            const nextChallenge = idx >= 0 && idx < challenges.length - 1 ? challenges[idx + 1] : null;
            const navParams = new URLSearchParams();
            if (participantName) navParams.set("participantName", participantName);
            if (codespaceId) navParams.set("codespace", codespaceId);
            const qs = navParams.toString() ? `?${navParams.toString()}` : "";
            return (
              <div className="animate-slide-up">
                {nextChallenge ? (
                  <Link
                    href={`/challenges/${nextChallenge.id}${qs}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--accent-dim)] transition-all duration-200"
                  >
                    <div>
                      <p className="text-xs text-zinc-500">{locale === "ko" ? "다음 시나리오" : "Next scenario"}</p>
                      <p className="text-sm font-medium text-white">{nextChallenge.title}</p>
                    </div>
                    <span className="text-[var(--accent)] text-lg">→</span>
                  </Link>
                ) : (
                  <Link
                    href={`/leaderboard${participantName ? `?name=${encodeURIComponent(participantName)}` : ""}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 hover:bg-[var(--accent)]/10 transition-all duration-200"
                  >
                    <div>
                      <p className="text-xs text-[var(--accent)]">{locale === "ko" ? "모든 시나리오 완료!" : "All scenarios complete!"}</p>
                      <p className="text-sm font-medium text-white">{locale === "ko" ? "리더보드 확인하기" : "Check the leaderboard"}</p>
                    </div>
                    <span className="text-[var(--accent)] text-lg">→</span>
                  </Link>
                )}
              </div>
            );
          })()}

          <p className="text-sm text-zinc-500">
            <a href="/leaderboard" className="text-[var(--accent)] hover:underline">
              {locale === "ko" ? "리더보드" : "Leaderboard"}
            </a>
            {" · "}
            <Link href="/challenges" className="text-zinc-400 hover:text-zinc-300">
              {locale === "ko" ? "챌린지 목록" : "All challenges"}
            </Link>
          </p>
        </div>
      )}
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
