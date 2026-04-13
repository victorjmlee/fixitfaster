"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/LocaleContext";

const CODESPACE_REPO = "victorjmlee/fixitfaster-agent";

export default function StartPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [launched, setLaunched] = useState(false);

  const canLaunch = name.trim() && apiKey.trim() && appKey.trim();

  const launch = () => {
    if (!canLaunch) return;
    const params = new URLSearchParams();
    params.set("env[DATADOG_API_KEY]", apiKey.trim());
    params.set("env[DATADOG_APP_KEY]", appKey.trim());
    const url = `https://codespaces.new/${CODESPACE_REPO}?${params.toString()}`;

    try { sessionStorage.setItem("fixitfaster-participant-name", name.trim()); } catch {}

    window.open(url, "_blank");
    setLaunched(true);
  };

  const goToChallenges = () => {
    router.push(`/challenges?participantName=${encodeURIComponent(name.trim())}`);
  };

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

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">
            {locale === "ko" ? "이름" : "Your name"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            placeholder="Organization Settings → API Keys"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Datadog App Key</label>
          <input
            type="password"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            placeholder="Organization Settings → Application Keys"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-mono"
          />
        </div>

        {!launched ? (
          <button
            type="button"
            disabled={!canLaunch}
            onClick={launch}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50 hover:opacity-90"
          >
            {locale === "ko" ? "Codespace 시작하기" : "Launch Codespace"}
          </button>
        ) : (
          <div className="animate-slide-up space-y-3">
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)] text-center">
              {locale === "ko"
                ? "Codespace가 새 탭에서 열렸습니다. 설정이 자동으로 완료되면 아래 버튼을 눌러주세요."
                : "Codespace opened in a new tab. Once setup completes, click below."}
            </div>
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

      <p className="text-center text-xs text-zinc-600">
        {locale === "ko"
          ? "API Key는 Codespace 환경변수로만 사용되며 서버에 저장되지 않습니다."
          : "Keys are passed as Codespace secrets only. Not stored on our servers."}
      </p>
    </div>
  );
}
