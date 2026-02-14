"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "./LocaleContext";

function HeaderContent({ challengesHref }: { challengesHref: string }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          Fix It Faster
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-6 text-sm text-white">
            <Link href="/" className="hover:text-white">
              {t("nav.start")}
            </Link>
            <Link href={challengesHref} className="hover:text-white">
              {t("nav.challenges")}
            </Link>
            <Link href="/leaderboard" className="hover:text-white">
              {t("nav.leaderboard")}
            </Link>
          </nav>
          <span className="text-white">|</span>
          <div className="flex rounded border border-[var(--border)] p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setLocale("ko")}
              className={`rounded px-2.5 py-1 ${locale === "ko" ? "bg-[var(--accent)] text-[var(--bg)]" : "text-white hover:text-white"}`}
              aria-pressed={locale === "ko"}
            >
              KOR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded px-2.5 py-1 ${locale === "en" ? "bg-[var(--accent)] text-[var(--bg)]" : "text-white hover:text-white"}`}
              aria-pressed={locale === "en"}
            >
              ENG
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const PARTICIPANT_NAME_SESSION_KEY = "fixitfaster-participant-name";

function HeaderWithSearchParams() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("participantName")?.trim();
  const [sessionName, setSessionName] = useState<string | null>(null);

  useEffect(() => {
    if (fromUrl) {
      try {
        sessionStorage.setItem(PARTICIPANT_NAME_SESSION_KEY, fromUrl);
      } catch {
        /* ignore */
      }
    }
    try {
      setSessionName(sessionStorage.getItem(PARTICIPANT_NAME_SESSION_KEY)?.trim() || null);
    } catch {
      setSessionName(null);
    }
  }, [fromUrl]);

  const participantName = fromUrl || sessionName;
  const challengesHref = participantName
    ? `/challenges?participantName=${encodeURIComponent(participantName)}`
    : "/challenges";
  return <HeaderContent challengesHref={challengesHref} />;
}

export default function Header() {
  return (
    <Suspense fallback={<HeaderContent challengesHref="/challenges" />}>
      <HeaderWithSearchParams />
    </Suspense>
  );
}
