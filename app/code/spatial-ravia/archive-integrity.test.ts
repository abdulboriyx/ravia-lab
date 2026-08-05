import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { archiveEntries } from "../../../data/archive.ts";

const routeAliases: Record<string, string[]> = {
  "/chapterbio/": [
    "app/chapterbio/page.tsx",
    "public/chapterbio/index.html",
    "public/chapterbio/assets/index-DPg_OcaF.js",
    "public/chapterbio/assets/index-Jp-0-yMw.css"
  ]
};

test("available archive links point to implemented internal routes", () => {
  for (const entry of archiveEntries) {
    if (!entry.href) {
      assert.equal(
        entry.status,
        "planned",
        `${entry.title} has no href and must be explicitly marked planned.`
      );
      continue;
    }

    assert.ok(entry.href.startsWith("/"), `${entry.title} must use an internal absolute path.`);
    const expectedFiles = routeAliases[entry.href] ?? [routeFileForHref(entry.href)];

    for (const expectedFile of expectedFiles) {
      assert.ok(
        existsSync(join(process.cwd(), expectedFile)),
        `${entry.title} links to ${entry.href}, but ${expectedFile} does not exist.`
      );
    }
  }
});

test("planned archive entries are not clickable placeholders", () => {
  const planned = archiveEntries.filter((entry) => entry.status === "planned");

  assert.ok(planned.length > 0, "The test should cover planned archive entries.");
  for (const entry of planned) {
    assert.equal(entry.href, undefined, `${entry.title} must not expose a missing route href.`);
  }
});

function routeFileForHref(href: string) {
  const path = href.replace(/^\/|\/$/g, "");
  return path ? `app/${path}/page.tsx` : "app/page.tsx";
}
