"use client";

import { useState, useEffect } from "react";
import type { ScenarioCandidate, ZendeskInsightsData } from "@/app/api/zendesk-insights/route";
import type { GeneratedChallenge } from "@/app/api/generate-challenge/route";
import type { ActivateStep } from "@/app/api/activate-challenge/route";

const DIFFICULTY_COLOR = {
  Easy: "text-green-400 border-green-400/30 bg-green-400/10",
  Medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Hard: "text-red-400 border-red-400/30 bg-red-400/10",
};

// ─── Generated Challenge Modal ──────────────────────────────────────────────

function GeneratedModal({
  result,
  onClose,
}: {
  result: GeneratedChallenge;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"md" | "ref" | "docker">("md");
  const [deploying, setDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<ActivateStep[] | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployed, setDeployed] = useState(false);

  const tabs = [
    { key: "md", label: "챌린지 MD" },
    { key: "ref", label: "정답지" },
    { key: "docker", label: "docker-compose 패치" },
  ] as const;

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    setDeploySteps(null);
    try {
      const res = await fetch("/api/activate-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: result.slug }),
      });
      const data = await res.json();
      setDeploySteps(data.steps ?? []);
      if (data.ok) setDeployed(true);
      else setDeployError(data.error ?? "배포 실패");
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-white">{result.slug}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              challenges/_drafts/ 저장됨 — 검토 후 배포하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!deployed && (
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  deploying
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-default"
                    : "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90"
                }`}
              >
                {deploying ? "배포 중..." : "배포"}
              </button>
            )}
            {deployed && (
              <span className="text-sm text-green-400 font-medium">배포 완료 ✓</span>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none ml-2">✕</button>
          </div>
        </div>

        {/* Deploy progress */}
        {(deploySteps || deploying) && (
          <div className="px-5 py-3 border-b border-[var(--border)] bg-black/20 space-y-1.5">
            {deploying && !deploySteps && (
              <p className="text-xs text-yellow-400 animate-pulse">배포 진행 중...</p>
            )}
            {deploySteps?.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={
                  s.status === "ok" ? "text-green-400" :
                  s.status === "error" ? "text-red-400" : "text-zinc-500"
                }>
                  {s.status === "ok" ? "✓" : s.status === "error" ? "✗" : "–"}
                </span>
                <span className="text-zinc-300">{s.step}</span>
                {s.detail && <span className="text-zinc-500 truncate max-w-xs">{s.detail}</span>}
              </div>
            ))}
            {deployError && (
              <p className="text-xs text-red-400 pt-1">오류: {deployError}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm transition ${
                tab === t.key
                  ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {tab === "md" && (
            <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
              {result.challengeMarkdown}
            </pre>
          )}
          {tab === "ref" && (
            <div className="space-y-3 text-sm">
              <Row label="rootCause" value={result.referenceAnswer.rootCause} />
              <Row label="resolution" value={result.referenceAnswer.resolution} />
              <Row label="expectedChange" value={result.referenceAnswer.expectedChange} />
              <Row label="artifactScore" value={String(result.referenceAnswer.artifactScore)} />
              <Row label="scoreGuide (ko)" value={result.referenceAnswer.scoreGuide.ko} />
              <div>
                <span className="text-zinc-400 font-mono text-xs">artifactCheck</span>
                <pre className="mt-1 p-2 rounded bg-black/40 text-xs text-green-300 font-mono">
                  {JSON.stringify(result.referenceAnswer.artifactCheck, null, 2)}
                </pre>
              </div>
              {result.referenceAnswer.artifactCheckFull && (
                <div>
                  <span className="text-zinc-400 font-mono text-xs">artifactCheckFull</span>
                  <pre className="mt-1 p-2 rounded bg-black/40 text-xs text-green-300 font-mono">
                    {JSON.stringify(result.referenceAnswer.artifactCheckFull, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          {tab === "docker" && (
            <div className="space-y-3 text-sm">
              <Row label="서비스" value={result.dockerComposePatch.service} />
              <Row label="설명" value={result.dockerComposePatch.description} />
              {result.dockerComposePatch.envAdd && result.dockerComposePatch.envAdd.length > 0 && (
                <div>
                  <span className="text-zinc-400 font-mono text-xs">추가할 환경변수 (broken 값)</span>
                  <pre className="mt-1 p-2 rounded bg-black/40 text-xs text-yellow-300 font-mono">
                    {result.dockerComposePatch.envAdd.map(([k, v]) => `${k}=${v}`).join("\n")}
                  </pre>
                </div>
              )}
              {result.dockerComposePatch.envRemove && result.dockerComposePatch.envRemove.length > 0 && (
                <div>
                  <span className="text-zinc-400 font-mono text-xs">제거할 환경변수</span>
                  <pre className="mt-1 p-2 rounded bg-black/40 text-xs text-red-300 font-mono">
                    {result.dockerComposePatch.envRemove.join("\n")}
                  </pre>
                </div>
              )}
              {result.dockerComposePatch.newService && (
                <div>
                  <span className="text-zinc-400 font-mono text-xs">새 서비스</span>
                  <pre className="mt-1 p-2 rounded bg-black/40 text-xs text-blue-300 font-mono">
                    {result.dockerComposePatch.newService}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-400 font-mono text-xs">{label}</span>
      <p className="text-zinc-200 mt-0.5">{value}</p>
    </div>
  );
}

// ─── Candidate Card ──────────────────────────────────────────────────────────

function CandidateCard({ candidate }: { candidate: ScenarioCandidate }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diffClass = DIFFICULTY_COLOR[candidate.difficulty] ?? DIFFICULTY_COLOR.Medium;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setGenerated(data as GeneratedChallenge);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {generated && <GeneratedModal result={generated} onClose={() => setGenerated(null)} />}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-white leading-tight">{candidate.title}</h3>
          <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${diffClass}`}>
            {candidate.difficulty}
          </span>
        </div>

        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
          {candidate.products}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-zinc-400 font-medium">증상: </span>
            <span className="text-zinc-300">{candidate.symptomSummary}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium">원인: </span>
            <span className="text-zinc-300">{candidate.likelyRootCause}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-medium">해결: </span>
            <span className="text-zinc-300">{candidate.suggestedFix}</span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">오류: {error}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-zinc-600 truncate max-w-[55%]">
            출처:{" "}
            {candidate.sourceTicketUrl ? (
              <a href={candidate.sourceTicketUrl} target="_blank" rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline">
                {candidate.sourceTicketTitle}
              </a>
            ) : (
              <span>{candidate.sourceTicketTitle}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              generating
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-default"
                : "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90"
            }`}
          >
            {generating ? "생성 중..." : "챌린지 생성"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZendeskInsightsPage() {
  const [data, setData] = useState<ZendeskInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/zendesk-insights", { cache: "no-store" });
      const json = await res.json() as ZendeskInsightsData & { analyzing?: boolean };
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Unknown error");
      setAnalyzing(!!json.analyzing);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/zendesk-insights", { method: "POST" });
      const json = await res.json();
      if (!res.ok && res.status !== 409) throw new Error(json.error ?? "Unknown error");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAnalyzing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  useEffect(() => {
    if (!analyzing) return;
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [analyzing]);

  const hasData = data && data.candidates.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zendesk Insights</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Zendesk 티켓 분석 → 시나리오 후보 → 챌린지 자동 생성
          </p>
        </div>
        <button
          type="button"
          onClick={analyzing ? fetchStatus : startAnalysis}
          disabled={loading}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
            analyzing
              ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 cursor-default"
              : "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90"
          }`}
        >
          {analyzing ? "검색 중..." : loading ? "로딩..." : "새로 뽑기"}
        </button>
      </div>

      {data?.analyzedAt && (
        <div className="text-xs text-zinc-500 flex flex-wrap gap-4">
          <span>분석: {new Date(data.analyzedAt).toLocaleString("ko-KR")}</span>
          <span>티켓 {data.ticketsAnalyzed}개 분석</span>
        </div>
      )}

      {(loading || analyzing) && (
        <div className="text-center py-12 text-zinc-400 text-sm animate-pulse">
          {analyzing ? "Glean으로 Zendesk 티켓 검색 중... (1~3분)" : "로딩 중..."}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          오류: {error}
        </div>
      )}

      {!loading && !analyzing && !error && !hasData && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center space-y-3">
          <p className="text-zinc-300 font-medium">아직 분석 결과가 없습니다</p>
          <p className="text-sm text-zinc-500">
            위의 <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">새로 뽑기</span>를 눌러주세요.
          </p>
        </div>
      )}

      {!loading && !analyzing && hasData && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">
            시나리오 후보 <span className="text-white font-medium">{data.candidates.length}개</span>
            {" — 카드에서 "}
            <span className="text-[var(--accent)]">챌린지 생성</span>을 누르면 MD + 정답지 + docker-compose 패치가 자동으로 만들어집니다.
          </div>
          {data.candidates.map((c, i) => (
            <CandidateCard key={i} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}
