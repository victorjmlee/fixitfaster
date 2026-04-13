"use client";

import { useState } from "react";
import { useLocale } from "@/app/LocaleContext";

const CODESPACE_REPO = "victorjmlee/fixitfaster-agent";

export default function HomePage() {
  const { locale } = useLocale();
  const [launched, setLaunched] = useState(false);

  const launch = () => {
    window.open(`https://codespaces.new/${CODESPACE_REPO}`, "_blank");
    setLaunched(true);
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
        {!launched ? (
          <>
            <p className="text-sm text-zinc-300 text-center">
              {locale === "ko"
                ? "GitHub Codespace에서 Datadog 환경을 실행하고 트러블슈팅 챌린지를 풀어보세요."
                : "Launch a GitHub Codespace to run a Datadog environment and solve troubleshooting challenges."}
            </p>
            <button
              type="button"
              onClick={launch}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--bg)] hover:opacity-90"
            >
              {locale === "ko" ? "Codespace 시작하기" : "Launch Codespace"}
            </button>
          </>
        ) : (
          <div className="animate-slide-up space-y-3">
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)] text-center">
              {locale === "ko"
                ? "Codespace가 새 탭에서 열렸습니다. Codespace 내 브라우저에서 이름과 API Key를 설정하세요."
                : "Codespace opened in a new tab. Set up your name and API keys in the Codespace browser."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
