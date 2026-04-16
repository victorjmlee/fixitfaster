import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { listChallenges } from "@/lib/challenges";

const PATCHES_DIR = path.join(process.cwd(), "challenges", "_patches");

export type DeployedChallenge = {
  slug: string;
  title: string;
  difficulty: string;
  hasPatch: boolean;
};

export async function GET() {
  const active = listChallenges();

  const challenges: DeployedChallenge[] = active.map((c) => ({
    slug: c.id,
    title: c.title,
    difficulty: c.difficulty,
    hasPatch: fs.existsSync(path.join(PATCHES_DIR, `${c.id}.json`)),
  }));

  return NextResponse.json({ challenges });
}
