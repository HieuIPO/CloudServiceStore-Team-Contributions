import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = relative => fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");
const detailRoute = read("src/app/news/[slug]/page.tsx");
const detailClient = read("src/components/news-detail-client.tsx");

test("News detail resolves its public article on the server before rendering the client view", () => {
  assert.match(detailRoute, /getPublicNewsDetail\(slug, samplePreview\)/);
  assert.match(detailRoute, /if \(!article\) notFound\(\)/);
  assert.match(detailRoute, /<NewsDetailClient article=\{article\} samplePreview=\{samplePreview\}/);
  assert.match(detailClient, /NewsDetailClient\(\{ article, samplePreview = false \}/);
  assert.doesNotMatch(detailClient, /newsApi\.articleBySlug|useEffect/);
});
