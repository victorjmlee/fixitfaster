"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

const FIXITFASTER_URL = "https://dd-tse-fix-it-faster.vercel.app";
const SUBMIT_SCRIPT_URL = "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/submit-from-codespace.sh";

/** 제출 명령 (Codespace 터미널에서만). ELAPSED_SECONDS 생략 시 스크립트가 물어봄. */
function submitCommand(challengeId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : FIXITFASTER_URL;
  return `curl -sL "${SUBMIT_SCRIPT_URL}" -o /tmp/submit.sh && FIXITFASTER_URL="${base}" CHALLENGE_ID="${challengeId}" bash /tmp/submit.sh`;
}

function SubmitCommandBlock({ challengeId, locale }: { challengeId: string; locale: string }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const cmd = submitCommand(challengeId);

  const copy = useCallback(() => {
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
      navigator.clipboard.writeText(cmd).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        () => doCopy(cmd)
      );
    } else {
      doCopy(cmd);
    }
  }, [cmd]);

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
        {locale === "ko"
          ? "제출은 Codespace 터미널에서만 가능합니다. 아래 명령을 실행하면 아티팩트 전송 + 제출이 한 번에 됩니다. 이름은 ~/.fixitfaster-participant 에서 자동 사용."
          : "Submit only from the Codespace terminal. Run the command below to send artifacts and submit in one step. Name is read from ~/.fixitfaster-participant."}
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
          <code>{cmd}</code>
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

export default function ChallengePage() {
  const { t, locale } = useLocale();
  const params = useParams();
  const id = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => setElapsed((s) => s + 1), []);

  useEffect(() => {
    fetch(`/api/challenges/${id}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setChallenge)
      .finally(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [started, tick]);

  const handleStart = () => setStarted(true);

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
          <span className="text-sm text-zinc-500">{t("challenge.elapsed")}</span>
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
          <p className="text-sm text-zinc-400">
            {locale === "ko" ? "걸린 시간(초)은 스크립트 실행 시 물어봅니다. 입력하거나 명령에 ELAPSED_SECONDS=300 형태로 넣으세요." : "Elapsed seconds: script will prompt, or add ELAPSED_SECONDS=300 to the command."}
          </p>
          <SubmitCommandBlock challengeId={id} locale={locale} />
          <p className="text-sm text-zinc-500">
            {locale === "ko" ? "실행이 끝나면 리더보드에서 점수를 확인하세요." : "When done, check your score on the leaderboard."}
            {" "}
            <a href="/leaderboard" className="text-[var(--accent)] hover:underline">/leaderboard</a>
          </p>
        </div>
      )}
    </div>
  );
}
