"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/app/LocaleContext";

const REPO_URL = "https://github.com/CrystalBellSound/fixitfaster-agent.git";
const LAB_DIR = "~/datadog-fix-it-faster";
const DEFAULT_LAB_URL = "http://localhost:3001";
const CODESPACES_URL = "https://codespaces.new/CrystalBellSound/fixitfaster-agent";

function escapeShell(key: string): string {
  return key.replace(/'/g, "'\"'\"'");
}

export default function LabPage() {
  const { locale } = useLocale();
  const [labApiUrl, setLabApiUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<{ term: import("@xterm/xterm").Terminal; fit: () => void; ws: WebSocket } | null>(null);

  useEffect(() => {
    const url =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LAB_API_URL) ||
      (typeof window !== "undefined" && window.location?.hostname === "localhost" ? DEFAULT_LAB_URL : null);
    setLabApiUrl(url || null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKey.trim() || !appKey.trim()) {
        setError(locale === "ko" ? "API Key와 App Key를 입력하세요." : "Please enter API Key and App Key.");
        return;
      }
      setError(null);

      if (labApiUrl) {
        setLoading(true);
        try {
          const res = await fetch(`${labApiUrl}/api/session/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: apiKey.trim(), appKey: appKey.trim() }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.error || (locale === "ko" ? "세션 시작 실패" : "Failed to start session"));
            setShowCommands(true);
            return;
          }
          setSessionId(data.sessionId);
        } catch (err) {
          setError(locale === "ko" ? "랩 서버에 연결할 수 없습니다." : "Cannot connect to lab server.");
          setShowCommands(true);
        } finally {
          setLoading(false);
        }
      } else {
        setShowCommands(true);
      }
    },
    [apiKey, appKey, labApiUrl, locale]
  );

  useEffect(() => {
    if (!sessionId || !labApiUrl || !terminalRef.current) return;

    let mounted = true;
    const wsUrl = `${labApiUrl.replace(/^https/, "wss").replace(/^http/, "ws")}/ws?sessionId=${sessionId}`;
    const ws = new WebSocket(wsUrl);

    const connect = async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (!mounted || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        theme: { background: "#0f0f0f", foreground: "#e4e4e7" },
        fontSize: 14,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      ws.binaryType = "arraybuffer";
      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") term.write(ev.data);
        else term.write(new Uint8Array(ev.data as ArrayBuffer));
      };
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });

      terminalInstanceRef.current = { term, fit: () => fitAddon.fit(), ws };
    };

    ws.onopen = connect;
    ws.onerror = () => {
      if (mounted) setError(locale === "ko" ? "터미널 연결 실패" : "Terminal connection failed");
    };
    ws.onclose = () => {
      terminalInstanceRef.current = null;
    };

    return () => {
      mounted = false;
      if (terminalInstanceRef.current) {
        try {
          terminalInstanceRef.current.term.dispose();
          terminalInstanceRef.current.ws.close();
        } catch (_) {}
        terminalInstanceRef.current = null;
      }
    };
  }, [sessionId, labApiUrl, locale]);

  useEffect(() => {
    const onResize = () => terminalInstanceRef.current?.fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const commands = showCommands || sessionId
    ? `mkdir -p ${LAB_DIR} && cd ${LAB_DIR}
git clone ${REPO_URL} .
echo 'DATADOG_API_KEY=${escapeShell(apiKey.trim())}' > .env.local
echo 'DATADOG_APP_KEY=${escapeShell(appKey.trim())}' >> .env.local
npm run up:full
`
    : "";

  const copyToClipboard = useCallback(() => {
    if (!commands) return;
    navigator.clipboard.writeText(commands).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [commands]);

  const backToForm = useCallback(() => {
    setShowCommands(false);
    setSessionId(null);
    setError(null);
  }, []);

  const localCommands = `mkdir -p ${LAB_DIR} && cd ${LAB_DIR}
git clone ${REPO_URL} .
echo 'DATADOG_API_KEY=${escapeShell(apiKey.trim())}' > .env.local
echo 'DATADOG_APP_KEY=${escapeShell(appKey.trim())}' >> .env.local
npm run up:full
`;

  if (sessionId) {
    return (
      <div className="max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold">
          {locale === "ko" ? "랩 터미널" : "Lab terminal"}
        </h1>
        <p className="text-[var(--muted)] text-sm">
          {locale === "ko"
            ? "웹에서 명령이 실행됩니다. 끝난 뒤 로컬에 ~/datadog-fix-it-faster 를 만들려면 아래 명령어를 복사해 내 터미널에서 실행하세요."
            : "Commands run in the browser. To create ~/datadog-fix-it-faster on your machine, copy and run the commands below in your terminal."}
        </p>
        <div
          ref={terminalRef}
          className="min-h-[400px] rounded-lg border border-[var(--border)] bg-[#0f0f0f] p-2"
        />
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">
            {locale === "ko" ? "로컬에서 실행할 명령어 (이걸 실행하면 ~/datadog-fix-it-faster 생성)" : "Commands for local terminal (run these to create ~/datadog-fix-it-faster)"}
          </p>
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all rounded bg-[var(--bg)] p-3">
            {localCommands}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(localCommands).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => {})}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            {copied ? (locale === "ko" ? "복사됨" : "Copied") : (locale === "ko" ? "클립보드에 복사" : "Copy to clipboard")}
          </button>
        </div>
        <button
          type="button"
          onClick={backToForm}
          className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white"
        >
          {locale === "ko" ? "키 다시 입력" : "Change keys"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">
        {locale === "ko" ? "랩 시작" : "Start lab"}
      </h1>
      <p className="text-[var(--muted)] text-sm">
        {labApiUrl
          ? locale === "ko"
            ? "API Key와 App Key를 입력하면 웹에서 자동으로 설정을 실행합니다. 끝나면 터미널을 열고 안내된 디렉터리로 이동하세요."
            : "Enter your API Key and App Key to run setup in the browser. When done, open your terminal and go to the directory shown."
          : locale === "ko"
            ? "API Key와 App Key를 입력한 뒤, 아래 명령어를 복사해서 내 터미널에서 실행하세요. 모든 작업은 디렉터리 datadog-fix-it-faster에서 이루어집니다."
            : "Enter your API Key and App Key, then copy the commands below and run them in your terminal. Everything runs in the datadog-fix-it-faster directory."}
      </p>

      <a
        href={CODESPACES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-left transition hover:bg-[var(--accent)]/20"
      >
        <span className="text-2xl" aria-hidden>⚡</span>
        <div>
          <span className="font-semibold text-[var(--accent)]">
            {locale === "ko" ? "GitHub Codespaces에서 열기" : "Open in GitHub Codespaces"}
          </span>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {locale === "ko"
              ? "브라우저에서 랩 환경 실행 → 터미널에서 .env.local 만들고 npm run up:full"
              : "Run lab in browser → create .env.local and npm run up:full in terminal"}
          </p>
        </div>
      </a>

      {!showCommands ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Datadog API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key"
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder:text-zinc-500"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Datadog App Key</label>
            <input
              type="password"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Your App key"
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder:text-zinc-500"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-amber-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[var(--accent)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? locale === "ko"
                ? "연결 중..."
                : "Connecting..."
              : labApiUrl
                ? locale === "ko"
                  ? "웹에서 실행"
                  : "Run in browser"
                : locale === "ko"
                  ? "명령어 보기"
                  : "Show commands"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            {locale === "ko"
              ? "터미널을 열고 아래를 복사한 뒤 붙여넣어 실행하세요. 경로: " + LAB_DIR
              : "Open your terminal, copy and paste the block below. Path: " + LAB_DIR}
          </p>
          <pre className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm overflow-x-auto whitespace-pre-wrap break-all">
            {commands}
          </pre>
          <button
            type="button"
            onClick={copyToClipboard}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
          >
            {copied ? (locale === "ko" ? "복사됨" : "Copied") : (locale === "ko" ? "클립보드에 복사" : "Copy to clipboard")}
          </button>
          <button
            type="button"
            onClick={backToForm}
            className="ml-2 rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white"
          >
            {locale === "ko" ? "다시 입력" : "Change keys"}
          </button>
        </div>
      )}
    </div>
  );
}
