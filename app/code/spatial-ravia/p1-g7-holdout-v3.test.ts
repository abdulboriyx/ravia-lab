import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { entityIds, phenomenonIds, mechanismIds, stateIds, intentActs } from "./foundation-semantic-vocabulary.ts";
import { p1G7HoldoutV3, type P1G7Expected, type P1G7Field, type P1G7HoldoutCase, type P1G7Requirement } from "./p1-g7-holdout-v3.sealed.ts";
import { p1G7HoldoutV3Manifest } from "./p1-g7-holdout-v3.ts";
import { p1AdversarialCorpus } from "./p1-adversarial-corpus.ts";
import { p1K2aGeneralizationCorpus } from "./p1-k2a-generalization-corpus.ts";
import { p1K3bGeneralizationCorpus } from "./p1-k3b-generalization-corpus.ts";
import { p1G6HoldoutV2 } from "./p1-g6-holdout-v2.sealed.ts";

const entities = new Set(entityIds); const phenomena = new Set(phenomenonIds); const mechanisms = new Set(mechanismIds); const states = new Set(stateIds); const acts = new Set(intentActs);
const categories = new Set(Object.keys(p1G7HoldoutV3Manifest.categories)); const domains = new Set(["DNA", "RNA", "CROSS_DOMAIN"]); const difficulties = new Set(["MEDIUM", "HARD", "ADVERSARIAL"]);
const requirements = new Set<P1G7Requirement>(["REQUIRED", "OPTIONAL", "ALLOWED_ALTERNATIVE", "UNREPRESENTABLE_IN_F1"]);

const skeleton = (text: string) => text.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(?:dna|rna|polymer|strand|duplex|helix|transcript|message|chain|molecule|polymerase|enzyme|sugar|base)\b/g, "ENTITY").replace(/\s+/g, " ");
const tokens = (text: string) => new Set(text.toLocaleLowerCase().split(/[^a-z0-9′]+/).filter((token) => token.length > 3));
const overlap = (a: string, b: string) => { const aa = tokens(a); const bb = tokens(b); const common = [...aa].filter((token) => bb.has(token)); return common.length < 3 ? 0 : common.length / Math.max(1, Math.min(aa.size, bb.size)); };
const priorPrompts = [
  ...p1AdversarialCorpus.map(({ rawPrompt }) => rawPrompt),
  ...p1K2aGeneralizationCorpus.map(({ prompt }) => prompt),
  ...p1K3bGeneralizationCorpus.map(({ prompt }) => prompt),
  ...p1G6HoldoutV2.map(({ prompt }) => prompt),
];

function validateField<T>(field: P1G7Field<T> | undefined, path: string, values?: Set<unknown>): string[] {
  if (!field) return [];
  const issues: string[] = [];
  if (!requirements.has(field.requirement)) issues.push(`${path}: invalid requirement`);
  if (field.requirement === "REQUIRED" && field.value === undefined) issues.push(`${path}: required value missing`);
  if (field.requirement === "ALLOWED_ALTERNATIVE" && (!field.alternatives || field.alternatives.length < 2)) issues.push(`${path}: alternatives missing`);
  if (field.requirement === "UNREPRESENTABLE_IN_F1" && (field.value !== undefined || field.alternatives !== undefined)) issues.push(`${path}: unrepresentable field carries a value`);
  const candidates = field.value !== undefined ? [field.value] : field.alternatives ?? [];
  if (values) for (const candidate of candidates.flat()) if (!values.has(candidate)) issues.push(`${path}: invalid vocabulary value ${String(candidate)}`);
  return issues;
}

function validateCase(entry: P1G7HoldoutCase, index: number): string[] {
  const issues: string[] = []; const e = entry.expected;
  if (!/^h3-(?:lex|ent|amb|mech|comp|act|claim|dir|local|cross|valid|multi)-\d{3}$/.test(entry.id)) issues.push(`${index}: invalid ID`);
  if (!entry.prompt.trim() || entry.prompt.length < 25) issues.push(`${index}: weak prompt`);
  if (!categories.has(entry.category) || !domains.has(entry.domain) || !difficulties.has(entry.difficulty)) issues.push(`${index}: invalid partition metadata`);
  issues.push(...validateField(e.acts, `${entry.id}.acts`, acts));
  issues.push(...validateField(e.entities, `${entry.id}.entities`, entities));
  issues.push(...validateField(e.phenomena, `${entry.id}.phenomena`, phenomena));
  issues.push(...validateField(e.mechanisms, `${entry.id}.mechanisms`, mechanisms));
  issues.push(...validateField(e.states, `${entry.id}.states`, states));
  issues.push(...validateField(e.biochemicalDirection, `${entry.id}.biochemicalDirection`));
  issues.push(...validateField(e.screenDirection, `${entry.id}.screenDirection`));
  issues.push(...validateField(e.claims, `${entry.id}.claims`));
  issues.push(...validateField(e.clarification, `${entry.id}.clarification`));
  issues.push(...validateField(e.misconceptionOutcome, `${entry.id}.misconceptionOutcome`));
  issues.push(...validateField(e.multiIntentInvariants, `${entry.id}.multiIntentInvariants`));
  if (e.claims?.value) for (const claim of e.claims.value) if (!claim.rawText.trim() || !["neutral", "suspected", "validated", "corrected"].includes(claim.status)) issues.push(`${entry.id}.claims: malformed claim`);
  if (e.unrepresentable?.some(({ field, reason }) => !field.trim() || !reason.trim())) issues.push(`${entry.id}: malformed F1 limitation marker`);
  return issues;
}

test("P1-G7 holdout v3 is sealed, balanced, and structurally valid", () => {
  assert.equal(p1G7HoldoutV3.length, 48);
  assert.equal(new Set(p1G7HoldoutV3.map(({ id }) => id)).size, 48);
  assert.deepEqual(p1G7HoldoutV3.flatMap(validateCase), []);
  for (const [category, count] of Object.entries(p1G7HoldoutV3Manifest.categories)) assert.equal(p1G7HoldoutV3.filter((entry) => entry.category === category).length, count, category);
  for (const [difficulty, count] of Object.entries(p1G7HoldoutV3Manifest.difficulty)) assert.equal(p1G7HoldoutV3.filter((entry) => entry.difficulty === difficulty).length, count, difficulty);
  for (const [domain, count] of Object.entries(p1G7HoldoutV3Manifest.domains)) assert.equal(p1G7HoldoutV3.filter((entry) => entry.domain === domain).length, count, domain);
});

test("P1-G7 has no duplicate templates or suspicious within-corpus reuse", () => {
  const skeletons = p1G7HoldoutV3.map(({ prompt }) => skeleton(prompt));
  assert.equal(new Set(skeletons).size, skeletons.length);
  for (let i = 0; i < p1G7HoldoutV3.length; i++) for (let j = i + 1; j < p1G7HoldoutV3.length; j++) assert.ok(overlap(p1G7HoldoutV3[i]!.prompt, p1G7HoldoutV3[j]!.prompt) < 0.86, `${p1G7HoldoutV3[i]!.id}/${p1G7HoldoutV3[j]!.id}`);
});

test("P1-G7 leakage audit covers prior development and retired corpora", () => {
  const priorSkeletons = new Set(priorPrompts.map(skeleton));
  for (const entry of p1G7HoldoutV3) {
    assert.equal(priorPrompts.some((prompt) => prompt.toLocaleLowerCase() === entry.prompt.toLocaleLowerCase()), false, `${entry.id}: exact overlap`);
    assert.equal(priorSkeletons.has(skeleton(entry.prompt)), false, `${entry.id}: structural template overlap`);
    for (const prior of priorPrompts) assert.ok(overlap(entry.prompt, prior) < 0.9, `${entry.id}: suspicious token overlap`);
  }
});

test("P1-G7 does not execute semantic evaluation and the normal runner cannot open it", async () => {
  const [benchmark, sealed, manifest] = await Promise.all([
    readFile(new URL("./p1-adversarial-benchmark.ts", import.meta.url), "utf8"),
    readFile(new URL("./p1-g7-holdout-v3.sealed.ts", import.meta.url), "utf8"),
    readFile(new URL("./p1-g7-holdout-v3.ts", import.meta.url), "utf8"),
  ]);
  assert.equal(benchmark.includes("p1-g7-holdout-v3"), false);
  assert.equal(sealed.includes("compilePromptIngress"), false);
  assert.equal(manifest.includes("p1-g7-holdout-v3.sealed"), false);
});

test("P1-G7 manifest hash is deterministic over the sealed corpus", () => {
  const canonical = JSON.stringify(p1G7HoldoutV3);
  const digest = `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
  assert.equal(p1G7HoldoutV3Manifest.manifestHash, digest);
});
