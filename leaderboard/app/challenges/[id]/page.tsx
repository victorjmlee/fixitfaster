"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

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
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => setElapsed((s) => s + 1), []);

  useEffect(() => {
    fetch(`/api/challenges/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setChallenge)
      .finally(() => setLoading(false));
  }, [id]);

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
    const causeSummary = (form.elements.namedItem("causeSummary") as HTMLTextAreaElement)?.value ?? "";
    const steps = (form.elements.namedItem("steps") as HTMLTextAreaElement)?.value ?? "";
    const docLinks = (form.elements.namedItem("docLinks") as HTMLTextAreaElement)?.value ?? "";

    if (!participantName) {
      alert("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: id,
          participantName,
          causeSummary,
          steps,
          docLinks,
          elapsedSeconds: elapsed,
        }),
      });
      if (res.ok) {
        setSubmitOk(true);
        setTimeout(() => router.push("/leaderboard"), 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Submission failed");
      }
    } catch {
      alert("An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !challenge) {
    return (
      <div className="flex justify-center py-16">
        <span className="text-zinc-500">{loading ? "Loading..." : "Challenge not found."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{challenge.title}</h1>
        <p className="text-sm text-zinc-500">
          {challenge.difficulty} · {challenge.estimatedMinutes} · {challenge.products}
        </p>
      </div>

      {!started ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-zinc-400">Read the challenge, then start to run the timer.</p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-4 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--bg)] hover:opacity-90"
          >
            Start
          </button>
        </div>
      ) : (
        <div className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <span className="font-mono text-lg text-[var(--accent)]">{formatTime(elapsed)}</span>
          <span className="text-sm text-zinc-500">Elapsed</span>
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">Symptom summary</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.symptomSummary || "-"}</div>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">Steps to reproduce / What to observe</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.steps || "-"}</div>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-2 text-base font-semibold text-white">Allowed resources</h2>
          <div className="whitespace-pre-wrap text-zinc-300 text-sm">{challenge.allowedResources || "-"}</div>
        </section>
        {challenge.helpfulCommands ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="mb-2 text-base font-semibold text-white">Helpful Commands</h2>
            <div className="whitespace-pre-wrap font-mono text-zinc-300 text-sm">{challenge.helpfulCommands}</div>
          </section>
        ) : null}
      </div>

      {started && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-base font-semibold text-white">Submit</h2>
          <div>
            <label className="block text-sm text-zinc-400">Name (required)</label>
            <input
              name="participantName"
              type="text"
              required
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Root cause summary</label>
            <textarea
              name="causeSummary"
              rows={3}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder="Summarize the root cause in a short paragraph..."
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Resolution steps</label>
            <textarea
              name="steps"
              rows={4}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder="1. ...&#10;2. ..."
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Documentation / links used</label>
            <textarea
              name="docLinks"
              rows={2}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600"
              placeholder="docs.datadoghq.com/..."
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || submitOk}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50"
            >
              {submitOk ? "Submitted → Going to leaderboard" : submitting ? "Submitting..." : `Submit (${formatTime(elapsed)})`}
            </button>
            <span className="text-sm text-zinc-500">Elapsed time will be recorded.</span>
          </div>
        </form>
      )}
    </div>
  );
}
