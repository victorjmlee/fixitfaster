"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/app/LocaleContext";

const PARTICIPANT_NAME_KEY = "fixitfaster-participant-name";

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
  const id = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [savedName, setSavedName] = useState("");
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
      const name = typeof window !== "undefined" ? localStorage.getItem(PARTICIPANT_NAME_KEY) ?? "" : "";
      setSavedName(name);
    } catch {
      setSavedName("");
    }
  }, []);

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
    const participantName = (form.elements.namedItem("participantName") as HTMLInputElement)?.value?.trim();
    const solution = (form.elements.namedItem("solution") as HTMLTextAreaElement)?.value?.trim() ?? "";

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
          <div>
            <label className="block text-sm text-zinc-400">{t("challenge.nameLabel")}</label>
            <input
              name="participantName"
              type="text"
              required
              defaultValue={savedName}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder={t("challenge.namePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">{t("challenge.solutionLabel")}</label>
            <textarea
              name="solution"
              rows={6}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder={t("challenge.solutionPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || submitOk}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50"
            >
              {submitOk ? t("challenge.submittedGoingToChallenges") : submitting ? t("challenge.submitting") : `${t("challenge.submit")} (${formatTime(elapsed)})`}
            </button>
            <span className="text-sm text-zinc-500">{t("challenge.elapsedRecorded")}</span>
          </div>
        </form>
      )}
    </div>
  );
}
