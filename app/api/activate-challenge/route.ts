import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const AGENT_DIR = path.join(ROOT, "fixitfaster-agent");
const CHALLENGES_DIR = path.join(ROOT, "challenges");
const DRAFTS_DIR = path.join(CHALLENGES_DIR, "_drafts");
const REFERENCE_ANSWERS_FILE = path.join(ROOT, "lib", "reference-answers.ts");
const CHALLENGES_LIB_FILE = path.join(ROOT, "lib", "challenges.ts");
const COMPOSE_FILE = path.join(AGENT_DIR, "docker-compose.yml");

export type ActivateStep = {
  step: string;
  status: "ok" | "error" | "skipped";
  detail?: string;
};

type DockerComposePatch = {
  service: string;
  description: string;
  envAdd?: [string, string][];
  envRemove?: string[];
  newService?: string | null;
};

type ReferenceAnswer = {
  rootCause: string;
  resolution: string;
  expectedChange: string;
  solutionRubric?: string;
  artifactCheck: string[][];
  artifactCheckFull?: string[][];
  artifactScore: number;
  scoreGuide: { ko: string; en: string };
};

type DraftMeta = {
  referenceAnswer: ReferenceAnswer;
  dockerComposePatch: DockerComposePatch;
};

// ─── docker-compose.yml 패치 ────────────────────────────────────────────────

function applyDockerComposePatch(patch: DockerComposePatch): void {
  let compose = fs.readFileSync(COMPOSE_FILE, "utf-8");

  if (patch.envAdd?.length) {
    // 서비스 섹션 찾아서 environment 블록 마지막에 추가
    const serviceRegex = new RegExp(`(  ${patch.service}:[\\s\\S]*?environment:[\\s\\S]*?)(\\n\\n|\\n    [a-z])`, "m");
    const match = compose.match(serviceRegex);
    if (!match) throw new Error(`서비스 '${patch.service}'의 environment 섹션을 찾지 못했어요`);

    // environment 블록의 마지막 - 항목 찾기
    const envBlockStart = compose.indexOf(`  ${patch.service}:`);
    const envBlockContent = compose.slice(envBlockStart);
    const envStart = envBlockContent.indexOf("    environment:");
    if (envStart === -1) throw new Error(`${patch.service}에 environment 섹션 없음`);

    // environment: 블록 내 마지막 - 항목의 줄 끝 위치 찾기
    const envSection = envBlockContent.slice(envStart);
    const lines = envSection.split("\n");
    let lastEnvLineIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith("- ")) lastEnvLineIdx = i;
      else if (lines[i].trim() !== "" && !lines[i].trimStart().startsWith("-")) break;
    }
    if (lastEnvLineIdx === -1) throw new Error("environment 항목을 찾지 못했어요");

    const insertAfterLine = lines.slice(0, lastEnvLineIdx + 1).join("\n");
    const restLines = lines.slice(lastEnvLineIdx + 1).join("\n");
    const newEnvLines = patch.envAdd.map(([k, v]) => `      - ${k}=${v}`).join("\n");

    const newEnvSection = insertAfterLine + "\n" + newEnvLines + "\n" + restLines;
    compose = compose.slice(0, envBlockStart + envStart) + newEnvSection + compose.slice(envBlockStart + envStart + envSection.length);
  }

  if (patch.envRemove?.length) {
    for (const key of patch.envRemove) {
      compose = compose.replace(new RegExp(`\\n\\s+- ${key}=[^\\n]*`, "g"), "");
    }
  }

  if (patch.newService) {
    compose = compose.trimEnd() + "\n\n" + patch.newService + "\n";
  }

  fs.writeFileSync(COMPOSE_FILE, compose, "utf-8");
}

// ─── reference-answers.ts 업데이트 ─────────────────────────────────────────

function generateRefAnswerEntry(slug: string, ref: ReferenceAnswer): string {
  const ac = JSON.stringify(ref.artifactCheck, null, 2)
    .split("\n").map((l, i) => i === 0 ? l : "    " + l).join("\n");
  // Normalize: Gemini sometimes returns string[] instead of string[][]
  const normalizedAcf = ref.artifactCheckFull?.map((item) =>
    Array.isArray(item) ? item : [item]
  );
  const acf = normalizedAcf
    ? JSON.stringify(normalizedAcf, null, 2)
        .split("\n").map((l, i) => i === 0 ? l : "    " + l).join("\n")
    : null;

  return `  "${slug}": {
    rootCause: ${JSON.stringify(ref.rootCause)},
    resolution: ${JSON.stringify(ref.resolution)},
    expectedChange: ${JSON.stringify(ref.expectedChange)},${ref.solutionRubric ? `\n    solutionRubric: ${JSON.stringify(ref.solutionRubric)},` : ""}
    artifactCheck: ${ac},${acf ? `\n    artifactCheckFull: ${acf},` : ""}
    artifactScore: ${ref.artifactScore},
    scoreGuide: {
      ko: ${JSON.stringify(ref.scoreGuide.ko)},
      en: ${JSON.stringify(ref.scoreGuide.en)},
    },
  },`;
}

function appendReferenceAnswer(slug: string, ref: ReferenceAnswer): boolean {
  let src = fs.readFileSync(REFERENCE_ANSWERS_FILE, "utf-8");
  if (src.includes(`"${slug}"`)) return false; // already exists, skip

  const entry = generateRefAnswerEntry(slug, ref);
  // 마지막 `};` 직전에 삽입
  const insertAt = src.lastIndexOf("};");
  if (insertAt === -1) throw new Error("reference-answers.ts 형식이 예상과 달라요");
  src = src.slice(0, insertAt) + entry + "\n" + src.slice(insertAt);
  fs.writeFileSync(REFERENCE_ANSWERS_FILE, src, "utf-8");
  return true;
}

// ─── challenges.ts CHALLENGE_ORDER 업데이트 ─────────────────────────────────

function appendChallengeOrder(slug: string): boolean {
  let src = fs.readFileSync(CHALLENGES_LIB_FILE, "utf-8");
  if (src.includes(`"${slug}"`)) return false; // already exists, skip

  // 배열의 마지막 항목 뒤에 추가
  src = src.replace(/(CHALLENGE_ORDER\s*=\s*\[[\s\S]*?)(])/,
    (_, arr, closing) => arr.trimEnd() + `,\n  "${slug}",\n${closing}`);
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
    // "nothing to commit" is not a real error — skip it
    const msg = e instanceof Error ? e.message : String(e);
    if (cmd.startsWith("git commit") && msg.includes("nothing to commit")) return "";
    throw e;
  }
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  const steps: ActivateStep[] = [];

  const mdDraftPath = path.join(DRAFTS_DIR, `${slug}.md`);
  const metaPath = path.join(DRAFTS_DIR, `${slug}.meta.json`);
  const mdFinalPath = path.join(CHALLENGES_DIR, `${slug}.md`);

  try {
    // 1. draft 파일 확인
    if (!fs.existsSync(mdDraftPath) || !fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "Draft 파일이 없어요. 먼저 챌린지를 생성하세요." }, { status: 404 });
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as DraftMeta;
    steps.push({ step: "Draft 파일 확인", status: "ok" });

    // 2. docker-compose.yml 패치
    try {
      applyDockerComposePatch(meta.dockerComposePatch);
      steps.push({ step: "docker-compose.yml에 broken config 추가", status: "ok", detail: meta.dockerComposePatch.description });
    } catch (e) {
      steps.push({ step: "docker-compose.yml 패치", status: "error", detail: String(e) });
      throw e;
    }

    // 3. reference-answers.ts 업데이트
    try {
      const added = appendReferenceAnswer(slug, meta.referenceAnswer);
      steps.push({ step: "reference-answers.ts 업데이트", status: "ok", detail: added ? undefined : "이미 존재, skip" });
    } catch (e) {
      steps.push({ step: "reference-answers.ts 업데이트", status: "error", detail: String(e) });
      throw e;
    }

    // 4. challenges.ts CHALLENGE_ORDER 업데이트
    try {
      const added = appendChallengeOrder(slug);
      steps.push({ step: "CHALLENGE_ORDER 추가", status: "ok", detail: added ? undefined : "이미 존재, skip" });
    } catch (e) {
      steps.push({ step: "CHALLENGE_ORDER 추가", status: "error", detail: String(e) });
      throw e;
    }

    // 5. challenge 파일 이동
    fs.copyFileSync(mdDraftPath, mdFinalPath);
    steps.push({ step: `challenges/${slug}.md 생성`, status: "ok" });

    // 6. fixitfaster-agent git commit + push
    try {
      git("git add docker-compose.yml", AGENT_DIR);
      git(`git commit -m "feat: add broken config for ${slug}"`, AGENT_DIR);
      git("git push origin main", AGENT_DIR);
      steps.push({ step: "fixitfaster-agent git push", status: "ok" });
    } catch (e) {
      steps.push({ step: "fixitfaster-agent git push", status: "error", detail: String(e) });
      throw e;
    }

    // 7. fixitfaster git commit + push
    try {
      git(`git add challenges/${slug}.md lib/reference-answers.ts lib/challenges.ts`, ROOT);
      git(`git commit -m "feat: add challenge ${slug}"`, ROOT);
      git("git push origin main", ROOT);
      steps.push({ step: "fixitfaster git push → Vercel 재배포", status: "ok" });
    } catch (e) {
      steps.push({ step: "fixitfaster git push", status: "error", detail: String(e) });
      throw e;
    }

    // 8. draft 정리
    fs.unlinkSync(mdDraftPath);
    fs.unlinkSync(metaPath);
    steps.push({ step: "Draft 파일 정리", status: "ok" });

    return NextResponse.json({ ok: true, steps });

  } catch (e) {
    return NextResponse.json({ ok: false, steps, error: String(e) }, { status: 500 });
  }
}
