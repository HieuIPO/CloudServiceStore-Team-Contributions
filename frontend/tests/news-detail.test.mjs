import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(new URL("../src/components/news-detail-client.tsx", import.meta.url), "utf8");
const globalsSource = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const thumbnailSource = await readFile(new URL("../src/lib/news-thumbnail.ts", import.meta.url), "utf8");

test("public article titles wrap long unbroken content inside the article column", () => {
  assert.ok(detailSource.includes("news-detail-title"), "Article h1 must use the long-title layout class");
  assert.ok(detailSource.includes("min-w-0 max-w-full"), "Article h1 must be allowed to shrink with the grid column");
  assert.ok(globalsSource.includes(".news-detail-title"), "Global news title styles must be defined");
  assert.ok(globalsSource.includes("overflow-wrap: anywhere"), "Unbroken article titles must be allowed to wrap");
  assert.ok(globalsSource.includes("word-break: break-word"), "Long article titles need a word-breaking fallback");
  assert.ok(detailSource.includes('key={`${tag}-${index}`}'), "Repeated article tags must have stable unique keys");
});

test("Visual-QA article thumbnails use real cloud imagery instead of a stretched window icon", () => {
  assert.ok(thumbnailSource.includes('endsWith("/window.svg")'), "The seeded placeholder thumbnail must be recognized");
  assert.ok(thumbnailSource.includes("/hero/hero-cloud-01.webp"), "News cards need a local image fallback");
  assert.ok(detailSource.includes("resolveNewsThumbnail"), "Article detail images must use the same fallback");
});
