"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-xs font-bold text-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400 text-xs font-bold text-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-xs font-bold text-white">
        3
      </span>
    );
  return <span className="text-zinc-500">{rank}</span>;
}

export default function LeaderboardPage() {
  const { t, locale } = useLocale();
  const [challenges, setChallenges] = useState<ChallengeMeta[]>([]);
  const [list, setList] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashedNames, setFlashedNames] = useState<Set<string>>(new Set());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const prevScoresRef = useRef<Record<string, number>>({});
  const myName = typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("name")?.trim()
      || sessionStorage.getItem("fixitfaster-participant-name")?.trim()
      || "")
    : "";

  const fetchData = useCallback(async () => {
    try {
      const [challengeList, leaderboardData] = await Promise.all([
        fetch("/api/challenges").then((r) => r.json()),
        fetch("/api/leaderboard").then((r) => r.json()),
      ]);
      setChallenges(Array.isArray(challengeList) ? challengeList : []);
      const rows: LeaderboardRow[] = Array.isArray(leaderboardData) ? leaderboardData : [];
      setList(rows);

      // Detect score changes for flash animation
      const newScores: Record<string, number> = {};
      const changed = new Set<string>();
      for (const row of rows) {
        newScores[row.participantName] = row.totalScore;
        const prev = prevScoresRef.current[row.participantName];
        if (prev !== undefined && prev !== row.totalScore) {
          changed.add(row.participantName);
        }
      }
      prevScoresRef.current = newScores;
      if (changed.size > 0) {
        setFlashedNames(changed);
        setTimeout(() => setFlashedNames(new Set()), 1500);
      }
      setSecondsAgo(0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

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
        <span className="text-xs text-zinc-600">
          {locale === "ko" ? `${secondsAgo}초 전 갱신` : `Updated ${secondsAgo}s ago`}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-500">
          {t("leaderboard.noSubmissions")}{" "}
          <Link href="/" className="text-[var(--accent)] hover:underline">{t("leaderboard.backToHome")}</Link>.
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
              {list.map((row, i) => {
                const isMe = myName && row.participantName.trim() === myName;
                const isFlashed = flashedNames.has(row.participantName);
                return (
                  <tr
                    key={row.participantName}
                    className={`border-b border-[var(--border)] last:border-0 transition-colors ${
                      isFlashed ? "animate-row-flash" : ""
                    } ${isMe ? "border-l-4 border-l-[var(--accent)] bg-[var(--accent)]/5" : ""}`}
                  >
                    <td className="p-3"><RankBadge rank={i + 1} /></td>
                    <td className="p-3 font-medium text-white">
                      {row.participantName}
                      {isMe && <span className="ml-2 text-xs text-[var(--accent)]">You</span>}
                    </td>
                    {challenges.map((c) => (
                      <td key={c.id} className="p-3 font-mono text-zinc-400">
                        {row.scoresByChallenge[c.id] !== undefined ? row.scoresByChallenge[c.id] : "—"}
                      </td>
                    ))}
                    <td className="p-3 font-mono font-semibold text-[var(--accent)]">{row.totalScore}</td>
                    <td className="p-3 font-mono text-[var(--accent)]">{formatTime(row.totalTime)}</td>
                    <td className="p-3 text-zinc-500">{new Date(row.lastSubmittedAt).toLocaleString("en-US")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
