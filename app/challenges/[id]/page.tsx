"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

const PARTICIPANT_NAME_KEY = "fixitfaster-participant-name";
const FIXITFASTER_URL = "https://dd-tse-fix-it-faster.vercel.app";
const ARTIFACTS_SCRIPT_URL = "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/collect-and-send-artifacts.sh";

/** 명령어: 이름은 Codespace에서 ~/.fixitfaster-participant 에 저장된 값 사용. */
function artifactsCommand(challengeId: string): string {
  return `curl -sL "${ARTIFACTS_SCRIPT_URL}" -o /tmp/send-artifacts.sh && FIXITFASTER_URL="${FIXITFASTER_URL}" CHALLENGE_ID="${challengeId}" bash /tmp/send-artifacts.sh`;
}

function ArtifactsCommandBlock({ challengeId, locale }: { challengeId: string; locale: string }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const cmd = artifactsCommand(challengeId);

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
          ? "채점은 Codespace에서 보낸 결과만 사용합니다. 제출 전에 Codespace 터미널에서 아래 명령을 실행하세요 (이름은 최초 1회 설정 시 저장해 두면 자동 사용). 아래 영역 클릭 후 Cmd+C(복사) 또는 복사 버튼을 누르세요."
          : "Grading uses only results sent from Codespace. Before submitting, run the command below in the Codespace terminal. Click the command to select, then Cmd+C or use Copy button."}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [showArtifactsStep, setShowArtifactsStep] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [causeSummary, setCauseSummary] = useState("");
  const [steps, setSteps] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => setElapsed((s) => s + 1), []);

  useEffect(() => {
    fetch(`/api/challenges/${id}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setChallenge)
      .finally(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    try {
      const fromUrl = typeof window !== "undefined" ? searchParams.get("participantName")?.trim() : "";
      if (fromUrl) {
        setSavedName(fromUrl);
        localStorage.setItem(PARTICIPANT_NAME_KEY, fromUrl);
      } else {
        const name = typeof window !== "undefined" ? localStorage.getItem(PARTICIPANT_NAME_KEY) ?? "" : "";
        setSavedName(name);
      }
    } catch {
      setSavedName("");
    }
  }, [searchParams]);

  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [started, tick]);

  const handleStart = () => setStarted(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const participantName = savedName.trim();
    const solution = causeSummary.trim() || steps.trim() ? `${causeSummary.trim()}\n\n${steps.trim()}`.trim() : "";

    if (!participantName) {
      alert(t("challenge.pleaseEnterName"));
      return;
    }
    try {
      localStorage.setItem(PARTICIPANT_NAME_KEY, participantName);
    } catch {
      /* ignore */
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: id,
          participantName,
          solution,
          causeSummary: causeSummary.trim(),
          steps: steps.trim(),
          elapsedSeconds: elapsed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitOk(true);
        if (data._gradingSkipped && data._gradingHint) {
          alert(data._gradingHint);
        }
        setTimeout(() => router.push("/challenges"), 500);
      } else {
        const data = await res.json();
        alert(data.error || t("challenge.submissionFailed"));
      }
    } catch {
      alert(t("challenge.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-base font-semibold text-white">{t("challenge.submit")}</h2>
          {challenge.scoreGuide ? (
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
              {challenge.scoreGuide}
            </div>
          ) : null}
          {!savedName ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <label className="text-sm text-zinc-400">{locale === "ko" ? "이름 (최초 1회):" : "Name (first time):"}</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-white placeholder-zinc-600 w-40"
                placeholder={t("challenge.namePlaceholder")}
              />
              <button
                type="button"
                onClick={() => {
                  const n = nameInput.trim();
                  if (n) {
                    try {
                      localStorage.setItem(PARTICIPANT_NAME_KEY, n);
                      setSavedName(n);
                    } catch {}
                  }
                }}
                className="rounded border border-[var(--border)] bg-[var(--accent)]/20 px-3 py-1.5 text-sm text-white hover:bg-[var(--accent)]/30"
              >
                {locale === "ko" ? "저장" : "Save"}
              </button>
            </div>
          ) : null}
          <ArtifactsCommandBlock challengeId={id} locale={locale} />
          <p className="text-sm text-zinc-400">{t("challenge.optionalSolutionHint")}</p>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">{t("challenge.causeLabel")}</label>
            <textarea
              value={causeSummary}
              onChange={(e) => setCauseSummary(e.target.value)}
              placeholder={locale === "ko" ? "원인을 한두 줄로 요약 (선택)" : "Brief cause (optional)"}
              rows={2}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600 w-full resize-y"
            />
            <label className="text-sm text-zinc-400">{t("challenge.stepsLabel")}</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={locale === "ko" ? "해결 방법 요약 (선택)" : "Brief resolution (optional)"}
              rows={2}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600 w-full resize-y"
            />
          </div>
          <div className="flex flex-col gap-2">
            {showArtifactsStep ? (
              <>
                <p className="text-sm text-white/90">
                  {locale === "ko"
                    ? "터미널에서 위 명령을 실행한 뒤 아래 버튼을 눌러 제출하세요."
                    : "Run the command above in the terminal, then click below to submit."}
                </p>
                <button
                  type="submit"
                  disabled={submitting || submitOk}
                  className="rounded-lg bg-[var(--accent)] px-5 py-2 font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50 w-fit"
                >
                  {submitOk ? t("challenge.submittedGoingToChallenges") : submitting ? t("challenge.submitting") : (locale === "ko" ? "실행했으면 제출하기" : "Submit (after running command)")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowArtifactsStep(true)}
                disabled={submitting || submitOk || !savedName}
                className="rounded-lg bg-[var(--accent)] px-5 py-2 font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50 w-fit"
              >
                {`${t("challenge.submit")} (${formatTime(elapsed)})`}
              </button>
            )}
            <span className="text-sm text-zinc-500">{t("challenge.elapsedRecorded")}</span>
          </div>
        </form>
      )}
    </div>
  );
}
