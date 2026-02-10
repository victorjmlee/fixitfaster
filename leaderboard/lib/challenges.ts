import fs from "fs";
import path from "path";

export type ChallengeMeta = {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: string;
  products: string;
};

export type Challenge = ChallengeMeta & {
  body: string;
  symptomSummary: string;
  environment: string;
  steps: string;
  allowedResources: string;
};

const CHALLENGES_DIR = path.join(process.cwd(), "challenges");

function extractSection(content: string, title: string): string {
  const regex = new RegExp(`## ${title}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const m = content.match(regex);
  return m ? m[1].trim() : "";
}

function parseChallenge(id: string, raw: string): Challenge {
  const body = raw;
  const titleMatch = raw.match(/^#\s+(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : id;
  const metaBlock = raw.match(/\*\*Difficulty:\*\*\s*(.+?)(?:\n|$)/i);
  const difficulty = metaBlock ? metaBlock[1].trim() : "";
  const estMatch = raw.match(/\*\*Estimated time:\*\*\s*(.+?)(?:\n|$)/i);
  const estimatedMinutes = estMatch ? estMatch[1].trim() : "";
  const prodMatch = raw.match(/\*\*Related Datadog products:\*\*\s*(.+?)(?:\n|$)/i);
  const products = prodMatch ? prodMatch[1].trim() : "";
  const symptomSummary = extractSection(raw, "Symptom summary");
  const environment = extractSection(raw, "Environment");
  const steps = extractSection(raw, "Steps to reproduce / What to observe");
  const allowedResources = extractSection(raw, "Allowed resources");
  return {
    id,
    title,
    difficulty,
    estimatedMinutes,
    products,
    body,
    symptomSummary,
    environment,
    steps,
    allowedResources,
  };
}

export function listChallenges(): ChallengeMeta[] {
  if (!fs.existsSync(CHALLENGES_DIR)) return [];
  let files: string[];
  try {
    if (!fs.existsSync(CHALLENGES_DIR)) return [];
    files = fs.readdirSync(CHALLENGES_DIR);
  } catch {
    return [];
  }
  const list: ChallengeMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    const id = f.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(CHALLENGES_DIR, f), "utf-8");
      const c = parseChallenge(id, raw);
      list.push({
        id: c.id,
        title: c.title,
        difficulty: c.difficulty,
        estimatedMinutes: c.estimatedMinutes,
        products: c.products,
      });
    } catch {
      // skip invalid
    }
  }
  return list;
}

export function getChallenge(id: string): Challenge | null {
  const safeId = path.basename(id).replace(/\.md$/, "");
  const filePath = path.join(CHALLENGES_DIR, `${safeId}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return parseChallenge(safeId, raw);
}
