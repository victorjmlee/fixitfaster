"use client";

import Link from "next/link";
import { useLocale } from "@/app/LocaleContext";

const CODESPACES_URL = "https://codespaces.new/CrystalBellSound/fixitfaster-agent";

export default function HomePage() {
  const { locale } = useLocale();

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
        <p className="text-white text-sm mb-2">
          {locale === "en" ? "Open the lab in Codespace:" : "Codespace에서 랩 열기:"}
        </p>
        <p>
          <a href={CODESPACES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-[var(--accent)] font-medium hover:bg-[var(--accent)]/20">
            <span aria-hidden>⚡</span>
            {locale === "en" ? "Open in GitHub Codespaces" : "GitHub Codespaces에서 열기"}
          </a>
        </p>
        <p className="mt-4 text-white text-sm font-medium">
          {locale === "en" ? "First time only — set API keys and start (replace YOUR_KEY):" : "최초 1회 — API Key 넣고 시작 (YOUR_KEY만 바꿔서):"}
        </p>
        <pre className="mt-1.5 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs overflow-x-auto text-white">
          <code>{`echo 'DATADOG_API_KEY=YOUR_KEY' > .env.local && echo 'DATADOG_APP_KEY=YOUR_KEY' >> .env.local && npm run up:full`}</code>
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "How to play" : "진행 방법"}
        </h2>
        <ol className="text-white text-sm list-decimal pl-5 space-y-3">
          <li>
            <strong>{locale === "en" ? "Solve" : "풀기"}</strong>
            {" — "}
            {locale === "en"
              ? "Pick a scenario on the challenge page, start the timer, and fix the issue in Codespace."
              : "챌린지 페이지에서 시나리오를 고르고 타이머를 시작한 뒤, Codespace에서 원인을 찾고 수정합니다."}
          </li>
          <li>
            <strong>{locale === "en" ? "Submit" : "제출"}</strong>
            {" — "}
            {locale === "en"
              ? "Click Copy on the challenge page (timer stops), then paste in the Codespace terminal. Artifacts + submission in one step."
              : "챌린지 페이지에서 복사 버튼을 누르면 타이머가 멈추고, Codespace 터미널에 붙여넣기만 하면 아티팩트 전송 + 제출이 한 번에 끝납니다."}
          </li>
          <li>
            <strong>{locale === "en" ? "Solution (optional)" : "솔루션 (선택)"}</strong>
            {" — "}
            {locale === "en"
              ? "Write cause and resolution on the same page for up to 20 extra points (AI-graded)."
              : "같은 페이지에서 원인과 해결 방법을 작성하면 AI가 추가 채점합니다 (최대 20점)."}
          </li>
        </ol>
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

      <p className="pt-4">
        <Link href="/challenges" className="text-[var(--accent)] hover:underline">
          → {locale === "en" ? "Go to Challenges" : "챌린지로 가기"}
        </Link>
      </p>
    </div>
  );
}
