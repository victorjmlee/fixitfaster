"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLocale } from "@/app/LocaleContext";
import { seedFromParams, updateSession } from "@/lib/session";

const CODESPACE_REPO = "victorjmlee/fixitfaster-agent";
const SETUP_DONE_KEY = "fixitfaster-setup-done";

function SetupForm({
  codespaceId,
  locale,
  onComplete,
}: {
  codespaceId: string;
  locale: string;
  onComplete: (name: string) => void;
}) {
  const [nameInput, setNameInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [copied, setCopied] = useState(false);

  const ready = nameInput.trim() && apiKey.trim() && appKey.trim();

  const command = ready
    ? `echo 'DATADOG_API_KEY=${apiKey.trim()}' > .env.local && echo 'DATADOG_APP_KEY=${appKey.trim()}' >> .env.local && npm run up:full`
    : "";

  const showCommand = useCallback(() => {
    if (!ready) return;
    updateSession({ participantName: nameInput.trim() });
    try { sessionStorage.setItem(SETUP_DONE_KEY, "true"); } catch {}
    setCopied(true);
  }, [ready, nameInput]);

  const goToChallenges = useCallback(() => {
    onComplete(nameInput.trim());
  }, [nameInput, onComplete]);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {locale === "ko" ? "환경 설정" : "Environment Setup"}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          {locale === "ko"
            ? "이름과 Datadog API Key를 입력하세요."
            : "Enter your name and Datadog API keys."}
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">{locale === "ko" ? "이름" : "Your name"}</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={locale === "ko" ? "예: Jongmin" : "e.g. Aaron"}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Datadog API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="32-character hex"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Datadog App Key</label>
          <input
            type="password"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            placeholder="40-character hex"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-mono"
          />
        </div>
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-300">
            {locale === "ko" ? "API Key 찾는 방법" : "How to find your keys"}
          </summary>
          <ol className="mt-2 ml-4 list-decimal space-y-1">
            <li><a href="https://app.datadoghq.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">app.datadoghq.com</a> {locale === "ko" ? "로그인" : "→ Log in"}</li>
            <li>{locale === "ko" ? "좌측 하단 계정 아이콘 → Organization Settings" : "Bottom-left account icon → Organization Settings"}</li>
            <li>{locale === "ko" ? "API Keys 탭 → 키 복사" : "API Keys tab → Copy key"}</li>
            <li>{locale === "ko" ? "Application Keys 탭 → 키 복사" : "Application Keys tab → Copy key"}</li>
          </ol>
        </details>
      </div>

      {!copied ? (
        <button
          type="button"
          disabled={!ready}
          onClick={showCommand}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50 hover:opacity-90"
        >
          {locale === "ko" ? "설정 명령어 생성" : "Generate Setup Command"}
        </button>
      ) : (
        <div className="animate-slide-up space-y-3">
          <p className="text-xs text-zinc-400">
            {locale === "ko"
              ? "아래 명령어를 전체 선택(Ctrl+A → Ctrl+C)한 뒤 오른쪽 터미널에 붙여넣기 하세요."
              : "Select all below (Ctrl+A → Ctrl+C), then paste in the terminal."}
          </p>
          <pre
            className="p-3 rounded bg-black/50 border border-[var(--border)] text-xs font-mono text-green-300 whitespace-pre-wrap break-all cursor-text select-all overflow-x-auto"
            onClick={(e) => {
              const range = document.createRange();
              range.selectNodeContents(e.currentTarget);
              window.getSelection()?.removeAllRanges();
              window.getSelection()?.addRange(range);
            }}
          >
            {command}
          </pre>
          <button
            type="button"
            onClick={goToChallenges}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            {locale === "ko" ? "챌린지 시작 →" : "Go to Challenges →"}
          </button>
        </div>
      )}
    </div>
  );
}

function LaunchView({ locale }: { locale: string }) {
  const [launched, setLaunched] = useState(false);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      {!launched ? (
        <>
          <p className="text-sm text-zinc-300 text-center">
            {locale === "ko"
              ? "GitHub Codespace에서 Datadog 환경을 실행하고 트러블슈팅 챌린지를 풀어보세요."
              : "Launch a GitHub Codespace to run a Datadog environment and solve troubleshooting challenges."}
          </p>
          <button
            type="button"
            onClick={() => { window.open(`https://codespaces.new/${CODESPACE_REPO}`, "_blank"); setLaunched(true); }}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            {locale === "ko" ? "Codespace 시작하기" : "Launch Codespace"}
          </button>
        </>
      ) : (
        <div className="animate-slide-up rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)] text-center">
          {locale === "ko"
            ? "Codespace가 새 탭에서 열렸습니다. Codespace 내 브라우저에서 환경을 설정하세요."
            : "Codespace opened in a new tab. Set up the environment inside the Codespace browser."}
        </div>
      )}
    </div>
  );
}

function HomePageContent() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = seedFromParams(searchParams);
  const codespaceId = searchParams.get("codespace")?.trim() || session.codespaceId || null;

  useEffect(() => { seedFromParams(searchParams); }, [searchParams]);

  useEffect(() => {
    if (!codespaceId) return;
    try {
      if (sessionStorage.getItem(SETUP_DONE_KEY) === "true") {
        const s = JSON.parse(sessionStorage.getItem("fixitfaster-session") || "{}");
        const params = new URLSearchParams();
        if (s.participantName) params.set("participantName", s.participantName);
        if (codespaceId) params.set("codespace", codespaceId);
        router.replace(`/challenges?${params.toString()}`);
      }
    } catch {}
  }, [codespaceId, router]);

  const handleSetupComplete = useCallback((name: string) => {
    const params = new URLSearchParams();
    params.set("participantName", name);
    if (codespaceId) params.set("codespace", codespaceId);
    router.push(`/challenges?${params.toString()}`);
  }, [codespaceId, router]);

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Fix It Faster</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          {locale === "ko"
            ? "Datadog 트러블슈팅 챌린지"
            : "Datadog troubleshooting challenges"}
        </p>
      </div>

      {codespaceId ? (
        <SetupForm codespaceId={codespaceId} locale={locale} onComplete={handleSetupComplete} />
      ) : (
        <LaunchView locale={locale} />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><span className="text-zinc-500">Loading...</span></div>}>
      <HomePageContent />
    </Suspense>
  );
}
