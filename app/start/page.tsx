"use client";

import Link from "next/link";
import { useLocale } from "@/app/LocaleContext";

const LEADERBOARD_URL = "https://dd-tse-fix-it-faster.vercel.app/";
const REPO_URL = "https://github.com/CrystalBellSound/fixitfaster-agent.git";

export default function StartPage() {
  const { locale, t } = useLocale();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white border-b border-[var(--border)] pb-2">
          Fix It Faster – Agent & Demos
        </h1>
        {locale === "en" ? (
          <p className="mt-2 text-[var(--muted)]">
            Datadog Agent + demo containers for the <strong className="text-[var(--text)]">Fix It Faster</strong> hands-on. Use the agent repo to run the agent and scenario demos locally.
          </p>
        ) : (
          <p className="mt-2 text-[var(--muted)]">
            <strong className="text-[var(--text)]">Fix It Faster</strong> 핸즈온용 Datadog Agent와 데모 컨테이너입니다. 에이전트 저장소로 에이전트와 시나리오 데모를 로컬에서 실행할 수 있습니다.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="font-medium text-white">
          {locale === "en" ? "Leaderboard / challenges:" : "리더보드 / 챌린지:"}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {locale === "en"
            ? "Submit your solutions at the Fix It Faster leaderboard (this app):"
            : "정답은 Fix It Faster 리더보드(이 앱)에서 제출하세요:"}
        </p>
        <Link href="/" className="mt-2 inline-block text-[var(--accent)] hover:underline">
          {LEADERBOARD_URL}
        </Link>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--accent)] hover:underline">{locale === "en" ? "Challenges" : "챌린지"}</Link>
          {" · "}
          <Link href="/leaderboard" className="text-[var(--accent)] hover:underline">{t("nav.leaderboard")}</Link>
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-2">
          {locale === "en" ? "Quick start" : "빠른 시작"}
        </h2>
        <p className="text-[var(--muted)] text-sm">
          {locale === "en" ? "1. Clone the repo:" : "1. 저장소 클론:"}
        </p>
        <pre className="mt-2 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm overflow-x-auto">
          <code>{`git clone ${REPO_URL}\ncd fixitfaster-agent`}</code>
        </pre>
        <p className="mt-4 text-[var(--muted)] text-sm">
          {locale === "en"
            ? "2. Copy .env.example to .env.local and set:"
            : "2. .env.example을 .env.local로 복사한 뒤 설정:"}
        </p>
        <ul className="mt-1 text-[var(--muted)] text-sm list-disc pl-5 space-y-0.5">
          <li><code className="bg-[var(--card)] border border-[var(--border)] rounded px-1.5 py-0.5">DATADOG_API_KEY</code> ({locale === "en" ? "required" : "필수"})</li>
          <li><code className="bg-[var(--card)] border border-[var(--border)] rounded px-1.5 py-0.5">DATADOG_APP_KEY</code> ({locale === "en" ? "required for log pipeline setup" : "로그 파이프라인 설정 시 필수"})</li>
        </ul>
        <p className="mt-4 text-[var(--muted)] text-sm">
          {locale === "en"
            ? "3. Start the agent and all demos (including log pipeline setup):"
            : "3. 에이전트와 모든 데모(로그 파이프라인 설정 포함) 실행:"}
        </p>
        <pre className="mt-2 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm">
          <code>npm run up:full</code>
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mt-8 mb-3">
          {locale === "en" ? "Commands" : "명령어"}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-3 text-[var(--muted)] font-semibold">{locale === "en" ? "Command" : "명령어"}</th>
                <th className="text-left p-3 text-[var(--muted)] font-semibold">{locale === "en" ? "Description" : "설명"}</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run up</code></td><td className="p-3">{locale === "en" ? "Start Agent + all demo containers" : "Agent + 모든 데모 컨테이너 시작"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run down</code></td><td className="p-3">{locale === "en" ? "Stop and remove all containers" : "모든 컨테이너 중지 및 제거"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run up:full</code></td><td className="p-3">{locale === "en" ? "Start Agent + all demos + run log pipeline setup" : "Agent + 모든 데모 + 로그 파이프라인 설정 실행"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run agent:up</code></td><td className="p-3">{locale === "en" ? "Start only the Agent container" : "Agent 컨테이너만 시작"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run agent:down</code></td><td className="p-3">{locale === "en" ? "Stop only the Agent container" : "Agent 컨테이너만 중지"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run agent:restart</code></td><td className="p-3">{locale === "en" ? "Stop and start only the Agent container" : "Agent 컨테이너만 재시작"}</td></tr>
              <tr className="border-b border-[var(--border)] hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run logs</code></td><td className="p-3">{locale === "en" ? "Stream Agent logs (follow)" : "Agent 로그 스트리밍 (follow)"}</td></tr>
              <tr className="hover:bg-white/5"><td className="p-3"><code className="bg-[var(--card)] px-1.5 py-0.5 rounded">npm run pipeline:setup</code></td><td className="p-3">{locale === "en" ? "Create/update log-demo pipeline in Datadog (requires APP key in .env.local)" : "Datadog에 log-demo 파이프라인 생성/갱신 (.env.local의 APP key 필요)"}</td></tr>
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
                <th className="text-left p-3 text-[var(--muted)] font-semibold">{locale === "en" ? "Container" : "컨테이너"}</th>
                <th className="text-left p-3 text-[var(--muted)] font-semibold">{locale === "en" ? "Image / Build" : "이미지 / 빌드"}</th>
                <th className="text-left p-3 text-[var(--muted)] font-semibold">{locale === "en" ? "Description" : "설명"}</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted)]">
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
        <Link href="/" className="text-[var(--accent)] hover:underline">
          → {locale === "en" ? "Go to Challenges" : "챌린지로 가기"}
        </Link>
      </p>
    </div>
  );
}
