import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { ActivateStep } from "@/app/api/activate-challenge/route";

const ROOT = process.cwd();
const AGENT_DIR = path.join(ROOT, "fixitfaster-agent");
const CHALLENGES_DIR = path.join(ROOT, "challenges");
const PATCHES_DIR = path.join(CHALLENGES_DIR, "_patches");
const REFERENCE_ANSWERS_FILE = path.join(ROOT, "lib", "reference-answers.ts");
const CHALLENGES_LIB_FILE = path.join(ROOT, "lib", "challenges.ts");
const COMPOSE_FILE = path.join(AGENT_DIR, "docker-compose.yml");

type DockerComposePatch = {
  service: string;
  envAdd?: [string, string][];
  envRemove?: string[];
  newService?: string | null;
};

// ─── docker-compose.yml 롤백 ────────────────────────────────────────────────

function revertDockerComposePatch(patch: DockerComposePatch): void {
  let compose = fs.readFileSync(COMPOSE_FILE, "utf-8");

  // envAdd로 추가된 env var들 제거
  if (patch.envAdd?.length) {
    for (const [key] of patch.envAdd) {
      compose = compose.replace(new RegExp(`\\n\\s+- ${key}=[^\\n]*`, "g"), "");
    }
  }

  // envRemove로 제거됐던 env var들은 원래 복원 불가 (원본값 모름) — skip

  // newService로 추가된 서비스 제거
  if (patch.newService) {
    const serviceBlock = patch.newService.trim();
    const firstLine = serviceBlock.split("\n")[0].trim();
    // 서비스 이름 추출 (예: "  my-service:")
    const serviceMatch = firstLine.match(/^\s*(\S+):/);
    if (serviceMatch) {
      const serviceName = serviceMatch[1];
      const serviceRegex = new RegExp(
        `\\n\\n  ${serviceName}:[\\s\\S]*?(?=\\n\\n  \\S|$)`,
        "m"
      );
      compose = compose.replace(serviceRegex, "");
    }
  }

  fs.writeFileSync(COMPOSE_FILE, compose, "utf-8");
}

// ─── reference-answers.ts에서 slug 제거 ────────────────────────────────────

function removeReferenceAnswer(slug: string): boolean {
  let src = fs.readFileSync(REFERENCE_ANSWERS_FILE, "utf-8");
  if (!src.includes(`"${slug}"`)) return false;

  // slug 엔트리 블록 제거: `  "slug": {` ~ `  },` (다음 엔트리 전까지)
  const entryRegex = new RegExp(
    `\\n  "${slug}":\\s*\\{[\\s\\S]*?\\n  \\},`,
    "m"
  );
  src = src.replace(entryRegex, "");
  fs.writeFileSync(REFERENCE_ANSWERS_FILE, src, "utf-8");
  return true;
}

// ─── challenges.ts CHALLENGE_ORDER에서 slug 제거 ────────────────────────────

function removeChallengeOrder(slug: string): boolean {
  let src = fs.readFileSync(CHALLENGES_LIB_FILE, "utf-8");
  if (!src.includes(`"${slug}"`)) return false;

  src = src.replace(new RegExp(`\\n\\s+"${slug}",?`, "g"), "");
  fs.writeFileSync(CHALLENGES_LIB_FILE, src, "utf-8");
  return true;
}

// ─── git 헬퍼 ────────────────────────────────────────────────────────────────

function git(cmd: string, cwd: string): string {
  const safeCmd = cmd.startsWith("git commit")
    ? cmd.replace("git commit", "git -c commit.gpgsign=false -c core.hookspath= commit")
    : cmd;
  try {
    return execSync(safeCmd, { cwd, encoding: "utf-8", timeout: 30_000 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (cmd.startsWith("git commit") && msg.includes("nothing to commit")) return "";
    throw e;
  }
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  const steps: ActivateStep[] = [];

  const mdPath = path.join(CHALLENGES_DIR, `${slug}.md`);
  const patchPath = path.join(PATCHES_DIR, `${slug}.json`);

  try {
    // 1. patch 파일 확인
    if (!fs.existsSync(patchPath)) {
      return NextResponse.json(
        { error: `${slug}의 patch 정보가 없어요 (challenges/_patches/${slug}.json). 수동으로 docker-compose.yml을 확인하세요.` },
        { status: 404 }
      );
    }
    const patch = JSON.parse(fs.readFileSync(patchPath, "utf-8")) as DockerComposePatch;
    steps.push({ step: "Patch 파일 확인", status: "ok" });

    // 2. docker-compose.yml 롤백
    try {
      revertDockerComposePatch(patch);
      steps.push({ step: "docker-compose.yml에서 broken config 제거", status: "ok" });
    } catch (e) {
      steps.push({ step: "docker-compose.yml 롤백", status: "error", detail: String(e) });
      throw e;
    }

    // 3. fixitfaster-agent git commit + push
    try {
      git("git add docker-compose.yml", AGENT_DIR);
      git(`git commit -m "revert: remove broken config for ${slug}"`, AGENT_DIR);
      git("git push origin main", AGENT_DIR);
      steps.push({ step: "fixitfaster-agent git push", status: "ok" });
    } catch (e) {
      steps.push({ step: "fixitfaster-agent git push", status: "error", detail: String(e) });
      throw e;
    }

    // 4. reference-answers.ts에서 제거
    try {
      const removed = removeReferenceAnswer(slug);
      steps.push({ step: "reference-answers.ts 제거", status: "ok", detail: removed ? undefined : "없음, skip" });
    } catch (e) {
      steps.push({ step: "reference-answers.ts 제거", status: "error", detail: String(e) });
      throw e;
    }

    // 5. CHALLENGE_ORDER에서 제거
    try {
      const removed = removeChallengeOrder(slug);
      steps.push({ step: "CHALLENGE_ORDER 제거", status: "ok", detail: removed ? undefined : "없음, skip" });
    } catch (e) {
      steps.push({ step: "CHALLENGE_ORDER 제거", status: "error", detail: String(e) });
      throw e;
    }

    // 6. challenge 파일 + patch 파일 삭제
    if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
    fs.unlinkSync(patchPath);
    steps.push({ step: `challenges/${slug}.md + patch 파일 삭제`, status: "ok" });

    // 7. fixitfaster git commit + push
    try {
      git(`git add lib/reference-answers.ts lib/challenges.ts`, ROOT);
      git(`git rm --cached -f challenges/${slug}.md challenges/_patches/${slug}.json 2>/dev/null || true`, ROOT);
      git(`git add -u challenges/${slug}.md challenges/_patches/${slug}.json`, ROOT);
      git(`git commit -m "revert: remove challenge ${slug}"`, ROOT);
      git("git push origin main", ROOT);
      steps.push({ step: "fixitfaster git push → Vercel 재배포", status: "ok" });
    } catch (e) {
      steps.push({ step: "fixitfaster git push", status: "error", detail: String(e) });
      throw e;
    }

    return NextResponse.json({ ok: true, steps });

  } catch (e) {
    return NextResponse.json({ ok: false, steps, error: String(e) }, { status: 500 });
  }
}
