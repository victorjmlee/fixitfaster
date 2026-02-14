"use client";

import Link from "next/link";
import { useLocale } from "@/app/LocaleContext";

const REPO_URL = "https://github.com/CrystalBellSound/fixitfaster-agent.git";
const CODESPACES_URL = "https://codespaces.new/CrystalBellSound/fixitfaster-agent";

export default function HomePage() {
  const { locale, t } = useLocale();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white border-b border-[var(--border)] pb-2">
          Fix It Faster – Agent & Demos
        </h1>
        {locale === "en" ? (
          <p className="mt-2 text-white">
            Datadog Agent + demo containers for the <strong className="text-white">Fix It Faster</strong> hands-on. Use the agent repo to run the agent and scenario demos in Codespaces.
          </p>
        ) : (
          <p className="mt-2 text-white">
            <strong className="text-white">Fix It Faster</strong> 핸즈온용 Datadog Agent와 데모 컨테이너입니다. Codespaces에서 에이전트와 시나리오 데모를 실행할 수 있습니다.
          </p>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-2">
          {locale === "en" ? "Quick start" : "빠른 시작"}
        </h2>
        <p className="text-white text-sm mb-2">
          {locale === "en" ? "Start in the browser (recommended):" : "브라우저에서 시작 (권장):"}
        </p>
        <p>
          <a href={CODESPACES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-[var(--accent)] font-medium hover:bg-[var(--accent)]/20">
            <span aria-hidden>⚡</span>
            {locale === "en" ? "Open in GitHub Codespaces (Lab)" : "랩 – GitHub Codespaces에서 열기"}
          </a>
        </p>
        <p className="mt-6 text-white text-sm font-medium">
          {locale === "en" ? "In Codespace, do the following:" : "Codespace에서 할 일:"}
        </p>
        <ol className="mt-2 text-white text-sm list-decimal pl-5 space-y-2">
          <li>
            {locale === "en"
              ? "First time only: set API Key and App Key, then start the lab. Name is optional (set on the challenge page when you submit). Run (replace YOUR_KEY):"
              : "최초 1회: API Key, App Key 넣고 랩 실행. 이름은 생략 가능 (제출 시 챌린지 페이지에서 입력). 아래 한 줄 실행 (YOUR_KEY만 바꿔서):"}
            <pre className="mt-1.5 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs overflow-x-auto text-white">
              <code>{`echo 'DATADOG_API_KEY=YOUR_KEY' > .env.local && echo 'DATADOG_APP_KEY=YOUR_KEY' >> .env.local && npm run up:full`}</code>
            </pre>
            {locale === "en" ? (
              <p className="mt-1 text-zinc-400 text-xs">Optional: <code className="bg-[var(--card)] px-1 rounded">echo &apos;YourName&apos; &gt; ~/.fixitfaster-participant</code> if you run submit without copying the command from the challenge page.</p>
            ) : (
              <p className="mt-1 text-zinc-400 text-xs">선택: 챌린지 페이지에서 복사한 명령 대신 직접 제출할 때만 <code className="bg-[var(--card)] px-1 rounded">echo &apos;내이름&apos; &gt; ~/.fixitfaster-participant</code> 추가.</p>
            )}
          </li>
          <li>
            {locale === "en"
              ? "Before submitting: run the artifacts script in Codespace. Name is read from the file you set at first run. Then submit with the same name on Vercel."
              : "제출 전: Codespace 터미널에서 아래 명령 실행. 이름은 최초 1회에 저장한 값을 씁니다. 이어서 Vercel에서 같은 이름으로 제출."}
            <pre className="mt-1.5 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs overflow-x-auto text-white">
              <code>{`curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/collect-and-send-artifacts.sh" -o /tmp/send-artifacts.sh && FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app" CHALLENGE_ID="scenario-apm" bash /tmp/send-artifacts.sh`}</code>
            </pre>
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
