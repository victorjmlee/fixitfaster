"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/app/LocaleContext";

type ChallengeMeta = { id: string; title: string };

type LeaderboardRow = {
  participantName: string;
  totalScore: number;
  totalTime: number;
  submissionCount: number;
  lastSubmittedAt: string;
  scoresByChallenge: Record<string, number>;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function shortLabel(id: string): string {
  return id.replace(/^scenario-/, "");
}

export default function LeaderboardPage() {
  const { t } = useLocale();
  const [challenges, setChallenges] = useState<ChallengeMeta[]>([]);
  const [list, setList] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/challenges").then((r) => r.json()), fetch("/api/leaderboard").then((r) => r.json())])
      .then(([challengeList, leaderboardData]) => {
        setChallenges(Array.isArray(challengeList) ? challengeList : []);
        setList(Array.isArray(leaderboardData) ? leaderboardData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    if (!confirm(t("leaderboard.confirmReset"))) return;
    await fetch("/api/reset-leaderboard", { method: "POST" });
    setList([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="text-zinc-500">{t("leaderboard.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
          <p className="mt-1 text-zinc-400 text-sm">{t("leaderboard.subtitle")}</p>
        </div>
        {list.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-zinc-400 hover:bg-[var(--card)] hover:text-white"
          >
            {t("leaderboard.reset")}
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-500">
          {t("leaderboard.noSubmissions")}{" "}
          <Link href="/challenges" className="text-[var(--accent)] hover:underline">{t("leaderboard.startFromChallenges")}</Link>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-zinc-500">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">{t("leaderboard.participant")}</th>
                {challenges.map((c) => {
                  const colName = t(`scenario.${c.id}`).startsWith("scenario.") ? shortLabel(c.id) : t(`scenario.${c.id}`);
                  return (
                    <th key={c.id} className="p-3 font-medium whitespace-nowrap" title={c.title}>
                      {colName}
                    </th>
                  );
                })}
                <th className="p-3 font-medium text-[var(--accent)]">{t("leaderboard.total")}</th>
                <th className="p-3 font-medium">{t("leaderboard.totalTime")}</th>
                <th className="p-3 font-medium">{t("leaderboard.lastSubmitted")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => (
                <tr key={row.participantName} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 text-zinc-500">{i + 1}</td>
                  <td className="p-3 font-medium text-white">{row.participantName}</td>
                  {challenges.map((c) => (
                    <td key={c.id} className="p-3 font-mono text-zinc-400">
                      {row.scoresByChallenge[c.id] !== undefined ? row.scoresByChallenge[c.id] : "-"}
                    </td>
                  ))}
                  <td className="p-3 font-mono font-semibold text-[var(--accent)]">{row.totalScore}</td>
                  <td className="p-3 font-mono text-[var(--accent)]">{formatTime(row.totalTime)}</td>
                  <td className="p-3 text-zinc-500">{new Date(row.lastSubmittedAt).toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
