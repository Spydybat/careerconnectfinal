import { DOMAIN_SKILLS, SOFT_SKILLS, TECHNOLOGIES } from "@/data-platform/reference/taxonomy";

/**
 * Sprint 11 — canonical skill normalisation.
 *
 * The model may name a skill any way it likes ("react.js", "Postgres", "K8s").
 * Nothing from the model is allowed to become a skill in the application; every
 * AI-extracted skill is mapped onto the canonical taxonomy first, and anything
 * that cannot be mapped is returned as unmatched for human review.
 */

export type CanonicalSkill = {
  id: string;
  name: string;
  category: string;
};

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CANONICAL_SKILLS: CanonicalSkill[] = [
  ...TECHNOLOGIES.map(([name, category]) => ({ id: slug(name), name, category })),
  ...SOFT_SKILLS.map((name) => ({ id: slug(name), name, category: "Soft Skill" })),
  ...DOMAIN_SKILLS.map((name) => ({ id: slug(name), name, category: "Domain" })),
];

/** Common vendor/shorthand spellings mapped onto canonical ids. */
const ALIASES: Record<string, string> = {
  reactjs: "react",
  "react-js": "react",
  nextjs: "next-js",
  node: "node-js",
  nodejs: "node-js",
  "node-js": "node-js",
  js: "javascript",
  ts: "typescript",
  postgres: "postgresql",
  psql: "postgresql",
  k8s: "kubernetes",
  gcp: "google-cloud",
  "amazon-web-services": "aws",
  "ms-azure": "azure",
  golang: "go",
  "c-sharp": "c",
  csharp: "c",
  sklearn: "scikit-learn",
  "scikit-learn": "scikit-learn",
  tf: "tensorflow",
  "power-bi": "power-bi",
  "structured-query-language": "sql",
  "unit-testing": "test-automation",
  "problem-solving": "problem-solving",
  communication_skills: "communication",
};

const BY_ID = new Map(CANONICAL_SKILLS.map((skill) => [skill.id, skill]));

export type SkillNormalisation = {
  matched: { input: string; skill: CanonicalSkill }[];
  unmatched: string[];
};

/** Maps one raw skill string to a canonical skill, or null when unknown. */
export function normaliseSkill(raw: string): CanonicalSkill | null {
  const cleaned = raw.trim();
  if (!cleaned || cleaned.length > 80) return null;

  const key = slug(cleaned);
  if (!key) return null;

  const direct = BY_ID.get(key);
  if (direct) return direct;

  const aliased = ALIASES[key] ?? ALIASES[cleaned.toLowerCase()];
  if (aliased) return BY_ID.get(aliased) ?? null;

  // Tolerate trailing qualifiers such as "react (advanced)" or "aws cloud".
  const head = key.split("-")[0]!;
  const partial = CANONICAL_SKILLS.find(
    (skill) =>
      skill.id === head || skill.id.startsWith(`${key}-`) || key.startsWith(`${skill.id}-`),
  );
  return partial ?? null;
}

/** Normalises a list of AI-extracted skills; never invents new taxonomy rows. */
export function normaliseSkills(raw: readonly string[]): SkillNormalisation {
  const matched: SkillNormalisation["matched"] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const skill = normaliseSkill(item);
    if (!skill) {
      const label = item.trim().slice(0, 80);
      if (label && !unmatched.includes(label)) unmatched.push(label);
      continue;
    }
    if (seen.has(skill.id)) continue;
    seen.add(skill.id);
    matched.push({ input: item, skill });
  }

  return { matched, unmatched };
}

export type SkillGapRow = {
  canonicalSkillId: string;
  skillName: string;
  importance: number;
  currentLevel: number;
  targetLevel: number;
  currentSkill: string;
  requiredSkill: string;
  gap: number;
  priority: "high" | "medium" | "low";
  recommendation: string;
};

/**
 * Deterministic gap maths over canonical skills. The model never computes
 * gaps or priorities — it only writes prose around these rows.
 */
export function buildSkillGapRows(
  current: readonly { name: string; proficiency: number }[],
  required: readonly { name: string; importance: number }[],
): SkillGapRow[] {
  const have = new Map<string, number>();
  for (const skill of current) {
    const canonical = normaliseSkill(skill.name);
    if (!canonical) continue;
    have.set(canonical.id, Math.max(have.get(canonical.id) ?? 0, skill.proficiency));
  }

  const rows: SkillGapRow[] = [];
  for (const req of required) {
    const canonical = normaliseSkill(req.name);
    if (!canonical) continue;
    const level = have.get(canonical.id) ?? 0;
    const target = Math.min(5, Math.max(3, req.importance));
    const gap = Math.max(0, target - level);
    if (gap === 0) continue;
    rows.push({
      canonicalSkillId: canonical.id,
      skillName: canonical.name,
      importance: req.importance,
      currentLevel: level,
      targetLevel: target,
      currentSkill: level > 0 ? `${canonical.name} (level ${level}/5)` : "Not recorded",
      requiredSkill: `${canonical.name} (level ${target}/5)`,
      gap,
      priority: req.importance >= 4 ? "high" : req.importance >= 3 ? "medium" : "low",
      recommendation:
        level === 0
          ? `Start ${canonical.name} with a guided project and record it on your profile.`
          : `Deepen ${canonical.name} with a portfolio artefact that shows level ${target} work.`,
    });
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return rows.sort((a, b) => order[a.priority] - order[b.priority] || b.gap - a.gap);
}
