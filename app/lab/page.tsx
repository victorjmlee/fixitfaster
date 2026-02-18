"use client";

import { useCallback, useState } from "react";
import { useLocale } from "@/app/LocaleContext";

const REPO_URL = "https://github.com/victorjmlee/fixitfaster-agent.git";
const LAB_DIR = "~/datadog-fix-it-faster";
const CODESPACES_URL = "https://codespaces.new/victorjmlee/fixitfaster-agent";
const VERCEL_URL = "https://dd-tse-fix-it-faster.vercel.app";

const LOCAL_COMMANDS = `mkdir -p ${LAB_DIR} && cd ${LAB_DIR}
git clone ${REPO_URL} .
echo 'DATADOG_API_KEY=YOUR_API_KEY' > .env.local
echo 'DATADOG_APP_KEY=YOUR_APP_KEY' >> .env.local
npm run up:full
`;

export default function LabPage() {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(LOCAL_COMMANDS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">
        {locale === "ko" ? "랩 (Codespaces)" : "Lab (Codespaces)"}
      </h1>
      <p className="text-[var(--muted)] text-sm">
        {locale === "ko"
          ? "랩 환경은 GitHub Codespaces에서 실행합니다. Codespace 터미널에서 .env.local 만들고 npm run up:full 실행 후, 제출은 이 앱(Vercel)에서 하세요."
          : "Run the lab in GitHub Codespaces. In the Codespace terminal, create .env.local and run npm run up:full. Submit answers on this app (Vercel)."}
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
        <p className="text-sm font-medium text-white">
          {locale === "ko" ? "Codespace에서 이 앱(Vercel) 열기" : "Open this app (Vercel) from Codespace"}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {locale === "ko"
            ? "챌린지 제출·리더보드는 이 앱에서 합니다. Codespace 안에서 링크를 클릭하거나 주소창에 입력하세요."
            : "Submit challenges and view the leaderboard on this app. In Codespace, click the link or paste the URL in a browser."}
        </p>
        <a
          href={VERCEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/30"
        >
          {VERCEL_URL}
        </a>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-base font-semibold text-white">
          {locale === "ko" ? "로컬에서 실행할 때 명령어" : "Commands when running locally"}
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {locale === "ko" ? "Codespaces 대신 로컬 터미널에서 할 때 아래를 복사해 YOUR_API_KEY, YOUR_APP_KEY 를 바꿔 실행하세요." : "If running locally instead of Codespaces, copy below and replace YOUR_API_KEY, YOUR_APP_KEY."}
        </p>
        <pre className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm overflow-x-auto whitespace-pre-wrap break-all">
          {LOCAL_COMMANDS}
        </pre>
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
        >
          {copied ? (locale === "ko" ? "복사됨" : "Copied") : (locale === "ko" ? "클립보드에 복사" : "Copy to clipboard")}
        </button>
      </section>
    </div>
  );
}
