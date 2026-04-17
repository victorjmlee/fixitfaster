"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleContext";

export default function Header() {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    try { setIsEmbedded(window.self !== window.top); } catch { setIsEmbedded(true); }
    setIsLocalhost(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);

  const linkClass = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return isActive
      ? "text-[var(--accent)] border-b-2 border-[var(--accent)] pb-0.5"
      : "text-zinc-400 hover:text-white";
  };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          Fix It Faster
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-6 text-sm">
            <Link href="/" className={linkClass("/")}>
              {t("nav.start")}
            </Link>
            {isEmbedded && (
              <Link href="/challenges" className={linkClass("/challenges")}>
                {t("nav.challenges")}
              </Link>
            )}
            <Link href="/leaderboard" className={linkClass("/leaderboard")}>
              {t("nav.leaderboard")}
            </Link>
            {isLocalhost && (
              <Link href="/zendesk-insights" className={linkClass("/zendesk-insights")}>
                Insights
              </Link>
            )}
            {isLocalhost && (
              <Link href="/admin" className={linkClass("/admin")}>
                Admin
              </Link>
            )}
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
