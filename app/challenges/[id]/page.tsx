"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

const FIXITFASTER_URL = "https://dd-tse-fix-it-faster.vercel.app";
const SUBMIT_SCRIPT_URL = "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/submit-from-codespace.sh";

/** 셸에서 안전하게 쓰기 위해 이름 이스케이프 (쌍따옴표 안) */
function shellEscapeName(name: string): string {
  return name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** 제출 명령. participantName 있으면 PARTICIPANT_NAME= 넣어서 ~/.fixitfaster-participant 덮어씀(공용 Codespace에서 이름 섞임 방지). */
function submitCommand(
  challengeId: string,
  elapsedSeconds?: number,
  participantName?: string | null
): string {
  const base = typeof window !== "undefined" ? window.location.origin : FIXITFASTER_URL;
  const namePart =
    participantName?.trim()
      ? ` PARTICIPANT_NAME="${shellEscapeName(participantName.trim())}"`
      : "";
  const baseCmd = `curl -sL "${SUBMIT_SCRIPT_URL}" -o /tmp/submit.sh && FIXITFASTER_URL="${base}" CHALLENGE_ID="${challengeId}"${namePart} bash /tmp/submit.sh`;
  if (elapsedSeconds != null && elapsedSeconds >= 0) return `${baseCmd} ${elapsedSeconds}`;
  return baseCmd;
}

function SubmitCommandBlock({
  challengeId,
  locale,
  elapsedSeconds,
  participantName,
  onCopyClick,
}: {
  challengeId: string;
  locale: string;
  elapsedSeconds: number;
  participantName: string | null;
  onCopyClick: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const baseCmd = submitCommand(challengeId, undefined, participantName);

  const copy = useCallback(() => {
    onCopyClick();
    const cmdWithTime = submitCommand(challengeId, elapsedSeconds, participantName);
    const doCopy = (text: string) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cmdWithTime).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        () => doCopy(cmdWithTime)
      );
    } else {
      doCopy(cmdWithTime);
    }
  }, [challengeId, elapsedSeconds, participantName, onCopyClick]);

  const selectAll = useCallback(() => {
    if (preRef.current) {
      const range = document.createRange();
      range.selectNodeContents(preRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2">
      <p className="text-xs text-white">
        {participantName?.trim()
          ? (locale === "ko"
              ? `제출 시 이름이 \"${participantName.trim()}\"로 고정됩니다 (공용 환경에서 다른 사람 이름으로 섞이는 것 방지).`
              : `Submissions will use the name \"${participantName.trim()}\" (avoids mix-up on shared Codespace).`)
          : locale === "ko"
            ? "제출은 Codespace 터미널에서만 가능합니다. 아래 명령을 실행하면 아티팩트 전송 + 제출이 한 번에 됩니다. 이름은 ~/.fixitfaster-participant 에서 자동 사용. 같은 환경을 쓰면 URL에 ?participantName=내이름 을 넣어 주세요."
            : "Submit only from the Codespace terminal. Name is read from ~/.fixitfaster-participant. On shared env, open this page with ?participantName=YourName in the URL."}
      </p>
      <div className="flex items-center gap-2">
        <pre
          ref={preRef}
          role="button"
          tabIndex={0}
          onClick={selectAll}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectAll(); } }}
          className="flex-1 p-3 rounded bg-black/30 border border-[var(--border)] text-xs overflow-x-auto text-white font-mono whitespace-pre-wrap break-all cursor-text select-text"
          aria-label={locale === "ko" ? "클릭하면 전체 선택, Cmd+C로 복사" : "Click to select all, then Cmd+C to copy"}
        >
          <code>{baseCmd}</code>
        </pre>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); copy(); }}
          className="shrink-0 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-white hover:bg-white/10"
        >
          {copied ? (locale === "ko" ? "복사됨" : "Copied") : (locale === "ko" ? "복사" : "Copy")}
        </button>
      </div>
    </div>
  );
}

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

/** 선택: 솔루션(원인/해결) 작성 후 제출 → 0~20점 추가 채점 */
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
        setResult({ ok: false, error: data.error || (res.status === 404 ? (locale === "ko" ? "먼저 터미널에서 제출해 주세요." : "Submit from the terminal first.") : "Failed") });
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
        {locale === "ko" ? "선택: 솔루션 작성 (0~20점 추가)" : "Optional: Add solution (0–20 pts)"}
      </h3>
      {scoreGuide && (
        <p className="text-xs text-[var(--accent)]">{scoreGuide}</p>
      )}
      <p className="text-xs text-zinc-400">
        {locale === "ko"
          ? "터미널로 제출한 뒤, 원인·해결을 적어 보내면 AI가 채점해 최대 20점을 더해 줍니다. 이름이 URL/입력에 있어야 합니다."
          : "After submitting from the terminal, add cause and resolution here for up to 20 extra points."}
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
      {!participantName?.trim() && (
        <p className="text-xs text-amber-400">
          {locale === "ko" ? "위에서 제출 이름을 입력하거나 URL에 ?participantName=이름 을 넣어 주세요." : "Set your name above or in the URL (?participantName=...)."}
        </p>
      )}
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
  }, [participantNameFromUrl]);

  const tick = useCallback(() => setElapsed((s) => s + 1), []);

  useEffect(() => {
    fetch(`/api/challenges/${id}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setChallenge)
      .finally(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    if (started && !timerStopped) {
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [started, timerStopped, tick]);

  const handleStart = () => setStarted(true);

  const stopTimerOnCopy = useCallback(() => {
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
                {locale === "ko" ? "제출할 때 사용할 이름 (URL에 없으면 여기 입력, 복사 명령에 포함됨):" : "Your name for submission (included in copy command if not in URL):"}
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
              {locale === "ko" ? `제출 이름: ${participantNameFromUrl} (URL 기준, 복사 명령에 포함됨)` : `Submitting as: ${participantNameFromUrl}`}
            </p>
          )}
          <p className="text-sm text-zinc-400">
            {locale === "ko"
              ? "복사 버튼을 누르면 타이머가 멈추고, 그 시점의 시간(초)이 명령 맨 뒤에 자동으로 들어갑니다. 터미널에 붙여넣기만 하면 됩니다."
              : "Click Copy to stop the timer and copy the command with that time (seconds) at the end. Just paste in the terminal."}
          </p>
          <SubmitCommandBlock
            challengeId={id}
            locale={locale}
            elapsedSeconds={elapsed}
            participantName={participantName}
            onCopyClick={stopTimerOnCopy}
          />
          <p className="text-sm text-zinc-500">
            {locale === "ko" ? "실행이 끝나면 리더보드에서 점수를 확인하세요." : "When done, check your score on the leaderboard."}
            {" "}
            <a href="/leaderboard" className="text-[var(--accent)] hover:underline">/leaderboard</a>
          </p>

          <SolutionForm
            challengeId={id}
            participantName={participantName}
            locale={locale}
            scoreGuide={challenge.scoreGuide}
          />
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
