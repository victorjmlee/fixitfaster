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
  service?: string;
  envAdd?: [string, string][];
  envRemove?: string[];
  newService?: string | null;
  configFiles?: { path: string; content: string }[];
};

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

// ─── docker-compose.yml 롤백 (patch 파일 방식) ──────────────────────────────

function revertByPatch(patch: DockerComposePatch): void {
  let compose = fs.readFileSync(COMPOSE_FILE, "utf-8");

  if (patch.envAdd?.length) {
    for (const [key] of patch.envAdd) {
      compose = compose.replace(new RegExp(`\\n\\s+- ${key}=[^\\n]*`, "g"), "");
    }
  }

  if (patch.newService) {
    const firstLine = patch.newService.trim().split("\n")[0].trim();
    const serviceMatch = firstLine.match(/^\s*(\S+):/);
    if (serviceMatch) {
      const serviceName = serviceMatch[1];
      compose = compose.replace(
        new RegExp(`\\n\\n  ${serviceName}:[\\s\\S]*?(?=\\n\\n  \\S|$)`, "m"),
        ""
      );
    }
  }

  fs.writeFileSync(COMPOSE_FILE, compose, "utf-8");

  // configFiles 삭제
  if (patch.configFiles?.length) {
    for (const { path: relPath } of patch.configFiles) {
      const absPath = path.join(AGENT_DIR, relPath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }
  }
}

// ─── docker-compose.yml 롤백 (git show 파싱 방식) ──────────────────────────

/** Returns true if compose was modified, false if no commit found (skip). */
function revertByGit(slug: string): boolean {
  // 정확한 slug 매칭 — 끝이 slug로 끝나는 라인만 (substring 방지)
  const log = execSync("git log --oneline --all", { cwd: AGENT_DIR, encoding: "utf-8" });
  const line = log.split("\n").find((l) =>
    new RegExp(`add broken config for ${slug}$`).test(l.trim())
  );
  if (!line) return false; // 커밋 없음 → skip

  const hash = line.trim().split(" ")[0];
  const diff = execSync(`git show ${hash} -- docker-compose.yml`, {
    cwd: AGENT_DIR,
    encoding: "utf-8",
  });

  const diffLines = diff.split("\n");

  // 커밋에서 추가된 env var (+라인) → 현재 compose에서 제거
  const addedKeys = diffLines
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s+/, "").split("=")[0]);

  // 커밋에서 제거된 env var (-라인) → 현재 compose에 다시 추가
  const removedLines = diffLines
    .filter((l) => l.startsWith("-") && !l.startsWith("---"))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.startsWith("- "));

  if (!addedKeys.length && !removedLines.length) return false;

  let compose = fs.readFileSync(COMPOSE_FILE, "utf-8");

  // 추가됐던 것 제거
  for (const key of addedKeys) {
    compose = compose.replace(new RegExp(`\\n\\s+- ${key}=[^\\n]*`, "g"), "");
  }

  // 제거됐던 것 복원: environment 블록 마지막 항목 뒤에 삽입
  if (removedLines.length) {
    const insertLines = removedLines.map((l) => `      ${l}`).join("\n");
    // environment: 블록의 마지막 - 항목 뒤에 삽입
    compose = compose.replace(/(    environment:[\s\S]*?)((\n    [a-z]|\n\n))/, (_, envBlock, after) => {
      return envBlock.trimEnd() + "\n" + insertLines + after;
    });
  }

  fs.writeFileSync(COMPOSE_FILE, compose, "utf-8");
  return true;
}

// ─── reference-answers.ts에서 slug 제거 ────────────────────────────────────

function removeReferenceAnswer(slug: string): boolean {
  let src = fs.readFileSync(REFERENCE_ANSWERS_FILE, "utf-8");
  if (!src.includes(`"${slug}"`)) return false;

  const entryRegex = new RegExp(`\\n  "${slug}":\\s*\\{[\\s\\S]*?\\n  \\},`, "m");
  src = src.replace(entryRegex, "");
  fs.writeFileSync(REFERENCE_ANSWERS_FILE, src, "utf-8");
  return true;
}

// ─── challenges.ts CHALLENGE_ORDER에서 slug 제거 ────────────────────────────

function removeChallengeOrder(slug: string): boolean {
  let src = fs.readFileSync(CHALLENGES_LIB_FILE, "utf-8");
  if (!src.includes(`"${slug}"`)) return false;

  // 해당 줄 전체 제거 후 이중 쉼표 정리
  src = src.replace(new RegExp(`\\n[ \\t]*"${slug}",?`, "g"), "");
  src = src.replace(/,(\s*,)+/g, ","); // 이중 쉼표 → 단일 쉼표
  fs.writeFileSync(CHALLENGES_LIB_FILE, src, "utf-8");
  return true;
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  const steps: ActivateStep[] = [];

  const mdPath = path.join(CHALLENGES_DIR, `${slug}.md`);
  const patchPath = path.join(PATCHES_DIR, `${slug}.json`);
  const hasPatch = fs.existsSync(patchPath);

  try {
    // 1. docker-compose.yml 롤백 (patch 파일 or git show 파싱 fallback)
    let composeReverted = false;
    try {
      if (hasPatch) {
        const patch = JSON.parse(fs.readFileSync(patchPath, "utf-8")) as DockerComposePatch;
        revertByPatch(patch);
        composeReverted = true;
        steps.push({ step: "docker-compose.yml 롤백 (patch 파일)", status: "ok" });
      } else {
        composeReverted = revertByGit(slug);
        steps.push({
          step: "docker-compose.yml 롤백",
          status: "ok",
          detail: composeReverted ? "git show 파싱" : "대응 커밋 없음, skip",
        });
      }
    } catch (e) {
      steps.push({ step: "docker-compose.yml 롤백", status: "error", detail: String(e) });
      throw e;
    }

    // 2. fixitfaster-agent git commit + push (변경이 있을 때만)
    if (composeReverted) {
      try {
        git("git add docker-compose.yml", AGENT_DIR);
        git(`git commit -m "revert: remove broken config for ${slug}"`, AGENT_DIR);
        git("git push origin main", AGENT_DIR);
        steps.push({ step: "fixitfaster-agent git push", status: "ok" });
      } catch (e) {
        steps.push({ step: "fixitfaster-agent git push", status: "error", detail: String(e) });
        throw e;
      }
    }

    // 3. reference-answers.ts에서 제거
    try {
      const removed = removeReferenceAnswer(slug);
      steps.push({ step: "reference-answers.ts 제거", status: "ok", detail: removed ? undefined : "없음, skip" });
    } catch (e) {
      steps.push({ step: "reference-answers.ts 제거", status: "error", detail: String(e) });
      throw e;
    }

    // 4. CHALLENGE_ORDER에서 제거
    try {
      const removed = removeChallengeOrder(slug);
      steps.push({ step: "CHALLENGE_ORDER 제거", status: "ok", detail: removed ? undefined : "없음, skip" });
    } catch (e) {
      steps.push({ step: "CHALLENGE_ORDER 제거", status: "error", detail: String(e) });
      throw e;
    }

    // 5. challenge 파일 + patch 파일 삭제
    if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
    if (hasPatch) fs.unlinkSync(patchPath);
    steps.push({ step: `challenges/${slug}.md 삭제`, status: "ok" });

    // 6. fixitfaster git commit + push
    try {
      git("git add lib/reference-answers.ts lib/challenges.ts", ROOT);
      git(`git add -u challenges/${slug}.md`, ROOT);
      if (hasPatch) git(`git add -u challenges/_patches/${slug}.json`, ROOT);
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
