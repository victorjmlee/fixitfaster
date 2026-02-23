"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/app/LocaleContext";

const CODESPACES_URL = "https://codespaces.new/victorjmlee/fixitfaster-agent";

export default function HomePage() {
  const { locale } = useLocale();
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    try { setIsEmbedded(window.self !== window.top); } catch { setIsEmbedded(true); }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white border-b border-[var(--border)] pb-2">
          Fix It Faster
        </h1>
        <p className="mt-2 text-white">
          {locale === "en"
            ? "Datadog troubleshooting challenges and leaderboard. Solve issues in Codespace and submit."
            : "Datadog 트러블슈팅 챌린지와 리더보드입니다. Codespace에서 문제를 해결하고 제출하세요."}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-2">
          {locale === "en" ? "Quick start" : "빠른 시작"}
        </h2>

        <ol className="text-white text-sm list-decimal pl-5 space-y-4">
          {!isEmbedded && (
            <li>
              <strong>{locale === "en" ? "Open Codespace" : "Codespace 열기"}</strong>
              <p className="mt-1">
                <a href={CODESPACES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-[var(--accent)] font-medium hover:bg-[var(--accent)]/20">
                  <span aria-hidden>⚡</span>
                  {locale === "en" ? "Open in GitHub Codespaces" : "GitHub Codespaces에서 열기"}
                </a>
              </p>
            </li>
          )}
          {!isEmbedded && (
            <li>
              <strong>{locale === "en" ? "Wait for setup to finish" : "설정 완료 대기"}</strong>
              <p className="mt-1 text-zinc-400">
                {locale === "en"
                  ? "Codespace will pull Docker images and build containers automatically. This may take a few minutes. Wait until the terminal shows \"Done\" and the Simple Browser panel opens on the right side."
                  : "Codespace가 Docker 이미지를 받고 컨테이너를 자동으로 빌드합니다. 몇 분 걸릴 수 있습니다. 터미널에 \"Done\"이 표시되고 오른쪽에 Simple Browser 패널이 열릴 때까지 기다려 주세요."}
              </p>
              <p className="mt-1 text-zinc-400">
                {locale === "en"
                  ? "If a popup asks to open Simple Browser or allow a port, click Allow / Open."
                  : "Simple Browser를 열거나 포트를 허용하라는 팝업이 나오면 Allow / Open을 눌러 주세요."}
              </p>
            </li>
          )}
          <li>
            <strong>{locale === "en" ? "Set API keys and start" : "API Key 설정 후 시작"}</strong>
            <p className="mt-1 text-zinc-400">
              {locale === "en"
                ? "First time only — replace YOUR_KEY with your actual Datadog API and App keys:"
                : "최초 1회 — YOUR_KEY를 실제 Datadog API Key, App Key로 바꿔서 실행:"}
            </p>
            <pre className="mt-1.5 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs overflow-x-auto text-white">
              <code>{`echo 'DATADOG_API_KEY=YOUR_KEY' > .env.local && echo 'DATADOG_APP_KEY=YOUR_KEY' >> .env.local && npm run up:full`}</code>
            </pre>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "How to play" : "진행 방법"}
        </h2>
        <ol className="text-white text-sm list-decimal pl-5 space-y-3">
          <li>
            <strong>{locale === "en" ? "Set your name" : "이름 설정"}</strong>
            {" — "}
            {locale === "en"
              ? "Enter your name on the Challenges page before starting. Your submissions and scores will be tracked under this name."
              : "챌린지 페이지에서 시작 전에 이름을 입력하세요. 제출과 점수가 이 이름으로 기록됩니다."}
          </li>
          <li>
            <strong>{locale === "en" ? "Solve" : "풀기"}</strong>
            {" — "}
            {locale === "en"
              ? "Pick a scenario in Codespace and fix the issue."
              : "Codespace에서 시나리오를 고르고 원인을 찾아 수정합니다."}
          </li>
          <li>
            <strong>{locale === "en" ? "Submit" : "제출"}</strong>
            {" — "}
            {locale === "en"
              ? "Run the submit command in the Codespace terminal. Artifacts + submission in one step. Optionally, write your root cause and resolution for up to 20 bonus pts (AI-graded)."
              : "Codespace 터미널에서 제출 명령을 실행하면 아티팩트 전송 + 제출이 한 번에 끝납니다. 선택으로 원인과 해결 방법을 작성하면 최대 20점 추가 (AI 채점)."}
          </li>
          <li>
            <strong>{locale === "en" ? "Leaderboard" : "리더보드"}</strong>
            {" — "}
            {locale === "en"
              ? "Check your score and ranking on the leaderboard."
              : "리더보드에서 점수와 순위를 확인하세요."}
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "Scoring" : "채점·점수 안내"}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Scenario" : "시나리오"}</th>
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Result score" : "결과 점수"}</th>
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Max (result + solution)" : "만점 (결과 + 솔루션)"}</th>
              </tr>
            </thead>
            <tbody className="text-white">
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3">{locale === "en" ? "Infra (Hostname)" : "인프라 (호스트명)"}</td><td className="p-3">50</td><td className="p-3">70</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3">Autodiscovery</td><td className="p-3">60</td><td className="p-3">80</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3">APM</td><td className="p-3">80</td><td className="p-3">100</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3">Correlation</td><td className="p-3">50</td><td className="p-3">70</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3">{locale === "en" ? "Custom metrics" : "커스텀 메트릭"}</td><td className="p-3">80</td><td className="p-3">100</td></tr>
              <tr className="hover:bg-white/5"><td className="p-3">{locale === "en" ? "Log timezone (Bonus)" : "로그 타임존 (보너스)"}</td><td className="p-3">—</td><td className="p-3">20</td></tr>
            </tbody>
          </table>
        </div>
        <ul className="text-white text-sm mt-3 space-y-1.5 list-disc pl-5">
          <li>
            <strong>{locale === "en" ? "Solution (optional):" : "솔루션 (선택):"}</strong>{" "}
            {locale === "en"
              ? "Write cause and resolution for 0–20 pts (AI-graded)."
              : "원인/해결을 작성하면 AI가 0~20점으로 채점합니다."}
          </li>
          <li>
            <strong>{locale === "en" ? "Bonus (Log timezone):" : "보너스 (로그 타임존):"}</strong>{" "}
            {locale === "en"
              ? "Fixed in the Datadog UI. Solution only — up to 20 pts."
              : "Datadog UI에서 파이프라인을 수정하는 시나리오입니다. 솔루션 작성만으로 최대 20점."}
          </li>
          <li>
            <strong>{locale === "en" ? "Total:" : "총점:"}</strong>{" "}
            {locale === "en"
              ? "Result + Solution (capped at 100). Ties ranked by shorter time."
              : "결과 + 솔루션 (최대 100점). 동점이면 소요 시간이 짧은 사람이 위."}
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "Commands" : "명령어"}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Command" : "명령어"}</th>
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Description" : "설명"}</th>
              </tr>
            </thead>
            <tbody className="text-white">
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run up</code></td><td className="p-3">{locale === "en" ? "Start Agent + all demo containers (builds if needed)" : "Agent + 모든 데모 컨테이너 시작 (필요 시 빌드)"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run down</code></td><td className="p-3">{locale === "en" ? "Stop and remove all containers" : "모든 컨테이너 중지 및 제거"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run agent:restart</code></td><td className="p-3">{locale === "en" ? "Restart only the Agent container" : "Agent 컨테이너만 재시작"}</td></tr>
              <tr className="hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run up:full</code></td><td className="p-3">{locale === "en" ? "Start + run log pipeline setup in Datadog" : "시작 + Datadog 로그 파이프라인 설정 실행"}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "Containers" : "컨테이너"}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Container" : "컨테이너"}</th>
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Image / Build" : "이미지 / 빌드"}</th>
                <th className="text-left p-3 text-white font-semibold">{locale === "en" ? "Description" : "설명"}</th>
              </tr>
            </thead>
            <tbody className="text-white">
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-agent</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">datadog/agent:7</code></td><td className="p-3">{locale === "en" ? "Datadog Agent: APM (8126), Logs, DogStatsD (8125), container discovery. Mounts conf.d/nginx.d/autoconf.yaml for Autodiscovery." : "Datadog Agent: APM(8126), Logs, DogStatsD(8125), 컨테이너 디스커버리. Autodiscovery용 conf.d/nginx.d/autoconf.yaml 마운트."}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-trace-demo</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">./trace-demo</code></td><td className="p-3">{locale === "en" ? "Sends APM spans every 5s (APM scenario)." : "5초마다 APM 스팬 전송 (APM 시나리오)."}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-log-demo</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">./log-demo</code></td><td className="p-3">{locale === "en" ? "Logs with Asia/Seoul timestamps every 5s (log timezone / pipeline scenario)." : "5초마다 Asia/Seoul 타임스탬프 로그 (로그 타임존/파이프라인 시나리오)."}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-correlation-demo</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">./correlation-demo</code></td><td className="p-3">{locale === "en" ? "Node.js + dd-trace; Trace–Log correlation (labels: com.datadoghq.ad.logs)." : "Node.js + dd-trace. Trace–Log correlation (labels: com.datadoghq.ad.logs)."}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-metrics-demo</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">./metrics-demo</code></td><td className="p-3">{locale === "en" ? "DogStatsD custom metrics every 5s (custom metrics scenario)." : "5초마다 DogStatsD 커스텀 메트릭 (커스텀 메트릭 시나리오)."}</td></tr>
              <tr className="hover:bg-white/5"><td className="p-3 font-medium text-white">fixitfaster-ad-demo-nginx</td><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">nginx:alpine</code></td><td className="p-3">{locale === "en" ? "Nginx for Autodiscovery; Agent nginx check via conf.d/nginx.d/autoconf.yaml (ad_identifiers). Serves /nginx_status." : "Autodiscovery용 Nginx. Agent가 conf.d/nginx.d/autoconf.yaml(ad_identifiers)로 nginx 체크. /nginx_status 제공."}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex gap-6 pt-4">
        {isEmbedded && (
          <Link href="/challenges" className="text-[var(--accent)] hover:underline">
            → {locale === "en" ? "Go to Challenges" : "챌린지로 가기"}
          </Link>
        )}
        <Link href="/leaderboard" className="text-[var(--accent)] hover:underline">
          → {locale === "en" ? "Go to Leaderboard" : "리더보드로 가기"}
        </Link>
      </div>
    </div>
  );
}
