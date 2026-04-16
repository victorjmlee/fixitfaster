import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CHALLENGES_DIR = path.join(ROOT, "challenges");
const PATCHES_DIR = path.join(CHALLENGES_DIR, "_patches");
const CHALLENGES_LIB_FILE = path.join(ROOT, "lib", "challenges.ts");

export type DeployedChallenge = {
  slug: string;
  title: string;
  hasPatch: boolean;
  inChallengeOrder: boolean;
};

export async function GET() {
  const files = fs.readdirSync(CHALLENGES_DIR).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  );

  const challengesSrc = fs.readFileSync(CHALLENGES_LIB_FILE, "utf-8");

  const challenges: DeployedChallenge[] = files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const mdPath = path.join(CHALLENGES_DIR, f);
    const firstLine = fs.readFileSync(mdPath, "utf-8").split("\n")[0];
    const title = firstLine.replace(/^#\s*Scenario:\s*/i, "").trim() || slug;
    const hasPatch = fs.existsSync(path.join(PATCHES_DIR, `${slug}.json`));
    const inChallengeOrder = challengesSrc.includes(`"${slug}"`);
    return { slug, title, hasPatch, inChallengeOrder };
  });

  return NextResponse.json({ challenges });
}
