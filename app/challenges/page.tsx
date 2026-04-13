"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/app/LocaleContext";
import { seedFromParams, getSession } from "@/lib/session";

type ChallengeMeta = {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: string;
  products: string;
};

function ChallengesListContent() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session] = useState(() => seedFromParams(searchParams));
  const participantNameFromUrl = searchParams.get("participantName")?.trim() ?? "";
  const codespaceId = session.codespaceId ?? searchParams.get("codespace")?.trim() ?? null;
  const [challenges, setChallenges] = useState<ChallengeMeta[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(participantNameFromUrl || session.participantName || "");

  // Restore name from session if not in URL
  useEffect(() => {
    if (participantNameFromUrl) return;
    const s = getSession();
    if (s.participantName) {
      router.replace(`/challenges?participantName=${encodeURIComponent(s.participantName)}${s.codespaceId ? `&codespace=${encodeURIComponent(s.codespaceId)}` : ""}`);
    }
  }, [participantNameFromUrl, router]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    fetch("/api/challenges", { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((list) => setChallenges(Array.isArray(list) ? list : []))
      .catch((e) => setError(e?.message || "Failed to load challenges."))
      .finally(() => {
        clearTimeout(t);
        setLoading(false);
      });
  }, []);

  // 제출함 표시: URL의 participantName만 사용 (localStorage 사용 안 함 → 공용 브라우저에서 이름 섞임 방지)
  useEffect(() => {
    const name = participantNameFromUrl;
    if (!name) {
      setCompletedIds(new Set());
      return;
    }
    fetch(`/api/my-submissions?participantName=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data) => {
        setCompletedIds(new Set(Array.isArray(data.challengeIds) ? data.challengeIds : []));
        setScores(data.scores || {});
      })
      .catch(() => { setCompletedIds(new Set()); setScores({}); });
  }, [participantNameFromUrl]);

  if (loading && !error) {
    return (
      <div className="flex justify-center py-16">
        <span className="text-zinc-500">{t("home.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 text-center">
        <p className="font-medium text-amber-200">{error}</p>
        <p className="mt-2 text-sm text-zinc-500">{t("home.errorHint")}</p>
      </div>
    );
  }

  const applyName = () => {
    const name = nameInput.trim();
    if (name) {
      try { sessionStorage.setItem("fixitfaster-participant-name", name); } catch { /* ignore */ }
      router.push(`/challenges?participantName=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("home.title")}</h1>
        <p className="text-zinc-400 text-sm">{t("home.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-sm text-zinc-300 mb-2">
              {locale === "ko"
                ? "이름을 입력하면 제출과 점수가 해당 이름으로 기록됩니다."
                : "Enter your name to track your submissions and scores."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyName()}
                placeholder={locale === "ko" ? "내 이름 (예: Aaron)" : "Your name (e.g. Aaron)"}
                className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 w-48"
              />
              <button
                type="button"
                onClick={applyName}
                className="rounded border border-[var(--accent)] bg-[var(--accent)]/20 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/30"
              >
                {locale === "ko" ? "확인" : "Set name"}
              </button>
            </div>
            {participantNameFromUrl && (
              <p className="mt-2 text-xs text-[var(--accent)]">
                {locale === "ko" ? `현재: ${participantNameFromUrl} (제출함·제출 이름 모두 이 이름 기준)` : `Current: ${participantNameFromUrl}`}
              </p>
            )}
          </div>

          {participantNameFromUrl && challenges.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{locale === "ko" ? "진행률" : "Progress"}</span>
                <span>{completedIds.size}/{challenges.length}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                  style={{ width: `${(completedIds.size / challenges.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {challenges.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-500">
              {t("home.noChallenges")}
            </div>
          ) : (
            <ul className="grid gap-4">
              {challenges.map((c) => {
                const completed = completedIds.has(c.id);
                return (
                  <li key={c.id}>
                    <Link
                      href={(() => {
                        const p = new URLSearchParams();
                        if (participantNameFromUrl) p.set("participantName", participantNameFromUrl);
                        if (codespaceId) p.set("codespace", codespaceId);
                        const qs = p.toString();
                        return `/challenges/${c.id}${qs ? `?${qs}` : ""}`;
                      })()}
                      className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-200 hover:border-[var(--accent-dim)] hover:translate-x-1 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {completed && scores[c.id] != null ? (
                            <span className={`shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                              scores[c.id] >= 86 ? "bg-[var(--accent)]/20 text-[var(--accent)]" :
                              scores[c.id] >= 60 ? "bg-green-500/20 text-green-400" :
                              scores[c.id] >= 31 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-zinc-500/20 text-zinc-400"
                            }`}>
                              {scores[c.id]}
                            </span>
                          ) : completed ? (
                            <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs">✓</span>
                          ) : (
                            <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)]" />
                          )}
                          <div className="min-w-0">
                            <h2 className="font-semibold text-white">
                              {t(`scenario.${c.id}`).startsWith("scenario.") ? c.title : t(`scenario.${c.id}`)}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                              {c.difficulty} · {c.estimatedMinutes} · {c.products}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[var(--accent)]">{t("home.start")} →</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/50 p-4 text-sm text-zinc-500">
            <strong className="text-zinc-400">{t("home.resources")}</strong>{" "}
            <a href="https://docs.datadoghq.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              {t("home.docDocs")}
            </a>
            {" · "}
            <a href="https://docs.datadoghq.com/agent/troubleshooting/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              {t("home.agentTroubleshooting")}
            </a>
          </div>
    </div>
  );
}

function ChallengesListFallback() {
  const { t } = useLocale();
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("home.title")}</h1>
        <p className="text-zinc-400 text-sm">{t("home.subtitle")}</p>
      </div>
      <div className="flex justify-center py-16">
        <span className="text-zinc-500">{t("home.loading")}</span>
      </div>
    </div>
  );
}

export default function ChallengesListPage() {
  return (
    <Suspense fallback={<ChallengesListFallback />}>
      <ChallengesListContent />
    </Suspense>
  );
}
