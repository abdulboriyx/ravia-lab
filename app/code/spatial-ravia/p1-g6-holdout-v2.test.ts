import { strict as assert } from "node:assert";
import test from "node:test";
import { entityIds, phenomenonIds, mechanismIds, stateIds, intentActs, detailLevels } from "./foundation-semantic-vocabulary.ts";
import { p1G6HoldoutV2, type P1G6HoldoutCase } from "./p1-g6-holdout-v2.sealed.ts";
import { p1G6HoldoutV2Manifest } from "./p1-g6-holdout-v2.ts";
import { p1AdversarialCorpus } from "./p1-adversarial-corpus.ts";
import { p1K2aGeneralizationCorpus } from "./p1-k2a-generalization-corpus.ts";

const entities = new Set(entityIds); const phenomena = new Set(phenomenonIds); const mechanisms = new Set(mechanismIds); const states = new Set(stateIds); const acts = new Set(intentActs);
const allowedDomains = new Set(["DNA", "RNA", "CROSS_DOMAIN"]); const allowedDifficulty = new Set(["MEDIUM", "HARD", "ADVERSARIAL"]);
const skeleton = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(dna|rna|polymer|strand|duplex|helix|transcript|message|chain)\b/g, "ENTITY").replace(/\s+/g, " ");
const tokens = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9′]+/).filter((token) => token.length > 3));
const overlap = (a: string, b: string) => { const aa = tokens(a); const bb = tokens(b); const common = [...aa].filter((token) => bb.has(token)); return common.length < 3 ? 0 : common.length / Math.max(1, Math.min(aa.size, bb.size)); };

function validateCase(entry: P1G6HoldoutCase, index: number): string[] {
  const issues: string[] = []; const expected = entry.expected;
  if (!/^h2[a-h]-\d{3}$/.test(entry.id)) issues.push(`${index}: invalid ID`);
  if (!entry.prompt.trim()) issues.push(`${index}: empty prompt`);
  if (!allowedDomains.has(entry.domain) || !allowedDifficulty.has(entry.difficulty)) issues.push(`${index}: invalid partition metadata`);
  if (!entry.category) issues.push(`${index}: missing category`);
  if (!expected.acts.length || expected.acts.some((value) => !acts.has(value))) issues.push(`${index}: invalid acts`);
  if (expected.entities.some((value) => !entities.has(value))) issues.push(`${index}: invalid entity`);
  if (expected.phenomena.some((value) => !phenomena.has(value))) issues.push(`${index}: invalid phenomenon`);
  if (expected.mechanisms.some((value) => !mechanisms.has(value))) issues.push(`${index}: invalid mechanism`);
  if (expected.states?.some((value) => !states.has(value))) issues.push(`${index}: invalid state`);
  if (expected.multiIntentInvariants && expected.multiIntentInvariants.preserveActs.length < 2) issues.push(`${index}: malformed multi-intent invariant`);
  if (expected.claims?.some(({ rawText, status }) => !rawText.trim() || !["neutral", "suspected", "validated", "corrected"].includes(status))) issues.push(`${index}: malformed claim`);
  return issues;
}

test("P1-G6 holdout v2 has independent sealed structure", () => {
  assert.equal(p1G6HoldoutV2.length, 35);
  assert.equal(new Set(p1G6HoldoutV2.map(({ id }) => id)).size, 35);
  assert.deepEqual(p1G6HoldoutV2.flatMap(validateCase), []);
  assert.equal(p1G6HoldoutV2Manifest.sealed, true);
  assert.equal(p1G6HoldoutV2Manifest.caseCount, p1G6HoldoutV2.length);
  assert.equal(p1G6HoldoutV2Manifest.normalDevelopmentRunner.includes("refuses"), true);
});

test("P1-G6 category and difficulty balance are frozen", () => {
  const categories = Object.groupBy(p1G6HoldoutV2, ({ category }) => category);
  for (const [category, count] of Object.entries(p1G6HoldoutV2Manifest.categories) as [keyof typeof p1G6HoldoutV2Manifest.categories, number][]) assert.equal(categories[category]?.length, count, category);
  const difficulties = Object.groupBy(p1G6HoldoutV2, ({ difficulty }) => difficulty);
  for (const [difficulty, count] of Object.entries(p1G6HoldoutV2Manifest.difficulty) as [keyof typeof p1G6HoldoutV2Manifest.difficulty, number][]) assert.equal(difficulties[difficulty]?.length, count, difficulty);
});

test("P1-G6 has no duplicate structural templates or suspicious phrase reuse", () => {
  const skeletons = p1G6HoldoutV2.map(({ prompt }) => skeleton(prompt));
  assert.equal(new Set(skeletons).size, skeletons.length);
  for (let i = 0; i < p1G6HoldoutV2.length; i++) for (let j = i + 1; j < p1G6HoldoutV2.length; j++) assert.ok(overlap(p1G6HoldoutV2[i]!.prompt, p1G6HoldoutV2[j]!.prompt) < 0.8, `${p1G6HoldoutV2[i]!.id}/${p1G6HoldoutV2[j]!.id}`);
});

test("P1-G6 leakage audit finds no exact, skeleton, or high-token-overlap prior case", () => {
  const prior = [...p1AdversarialCorpus.map(({ rawPrompt }) => rawPrompt), ...p1K2aGeneralizationCorpus.map(({ prompt }) => prompt)];
  for (const entry of p1G6HoldoutV2) {
    for (const oldPrompt of prior) {
      assert.notEqual(entry.prompt.toLowerCase(), oldPrompt.toLowerCase(), `${entry.id}: exact overlap`);
      assert.notEqual(skeleton(entry.prompt), skeleton(oldPrompt), `${entry.id}: skeleton overlap`);
      assert.ok(overlap(entry.prompt, oldPrompt) < 0.82, `${entry.id}: high token overlap`);
    }
  }
});

test("normal development corpus has no holdout-v2 import or execution path", async () => {
  const source = await import("node:fs/promises");
  const benchmark = await source.readFile(new URL("./p1-adversarial-benchmark.ts", import.meta.url), "utf8");
  assert.equal(benchmark.includes("holdout-v2"), false);
});
