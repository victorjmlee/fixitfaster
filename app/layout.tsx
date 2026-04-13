import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "./LocaleContext";
import Header from "./Header";

export const metadata: Metadata = {
  title: "Fix It Faster - Leaderboard",
  description: "Datadog troubleshooting competition",
  icons: {
    icon: "https://www.datadoghq.com/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LocaleProvider>
          <Header />
          <main className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
