"use client";

import { useState, useEffect } from "react";
import type { DeployedChallenge } from "@/app/api/list-challenges/route";
import type { ActivateStep } from "@/app/api/activate-challenge/route";

export default function AdminPage() {
  const [challenges, setChallenges] = useState<DeployedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, ActivateStep[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/list-challenges");
    const data = await res.json();
    setChallenges(data.challenges ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (slug: string) => {
    if (!confirm(`"${slug}" 챌린지를 삭제하고 docker-compose.yml 설정을 되돌릴까요?`)) return;
    setDeactivating(slug);
    setErrors((e) => ({ ...e, [slug]: "" }));
    setSteps((s) => ({ ...s, [slug]: [] }));
    try {
      const res = await fetch("/api/deactivate-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setSteps((s) => ({ ...s, [slug]: data.steps ?? [] }));
      if (data.ok) {
        setDone((d) => new Set(Array.from(d).concat(slug)));
        setChallenges((c) => c.filter((ch) => ch.slug !== slug));
      } else {
        setErrors((e) => ({ ...e, [slug]: data.error ?? "오류 발생" }));
      }
    } catch (e) {
      setErrors((er) => ({ ...er, [slug]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Challenge Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">배포된 챌린지 관리 — 삭제 시 docker-compose.yml 설정도 함께 롤백됩니다.</p>
      </div>

      {loading && <p className="text-zinc-400 text-sm animate-pulse">로딩 중...</p>}

      {!loading && (
        <div className="space-y-3">
          {challenges.length === 0 && (
            <p className="text-zinc-500 text-sm">배포된 챌린지가 없습니다.</p>
          )}
          {challenges.map((ch) => (
            <div key={ch.slug} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white text-sm">{ch.title}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{ch.slug}{ch.difficulty ? ` · ${ch.difficulty}` : ""}</p>
                  {!ch.hasPatch && (
                    <p className="text-xs text-zinc-500 mt-0.5">git revert 방식</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeactivate(ch.slug)}
                  disabled={deactivating === ch.slug || done.has(ch.slug)}
                  className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium transition ${
                    done.has(ch.slug)
                      ? "bg-zinc-700 text-zinc-500 cursor-default"
                      : deactivating === ch.slug
                      ? "bg-red-500/10 text-red-400 border border-red-500/30 cursor-default"
                      : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                  }`}
                >
                  {done.has(ch.slug) ? "삭제됨" : deactivating === ch.slug ? "처리 중..." : "삭제"}
                </button>
              </div>

              {steps[ch.slug]?.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-[var(--border)]">
                  {steps[ch.slug].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={s.status === "ok" ? "text-green-400" : s.status === "error" ? "text-red-400" : "text-zinc-500"}>
                        {s.status === "ok" ? "✓" : s.status === "error" ? "✗" : "–"}
                      </span>
                      <span className="text-zinc-300">{s.step}</span>
                      {s.detail && <span className="text-zinc-500 truncate">{s.detail}</span>}
                    </div>
                  ))}
                  {errors[ch.slug] && (
                    <p className="text-xs text-red-400 pt-1">오류: {errors[ch.slug]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
