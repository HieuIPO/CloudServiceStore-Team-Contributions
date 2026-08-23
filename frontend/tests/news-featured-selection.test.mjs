import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.cwd(), "src");

test("news API exposes a dedicated featured selection action", () => {
  const apiSource = fs.readFileSync(path.join(sourceRoot, "lib/api.ts"), "utf8");

  assert.match(apiSource, /setFeaturedArticle:/);
  assert.match(apiSource, /news-articles\/\$\{id\}\/featured/);
  assert.match(apiSource, /isFeatured/);
});

test("admin news UI lets an editor select the featured article", () => {
  const adminSource = fs.readFileSync(path.join(sourceRoot, "components/admin-news-client.tsx"), "utf8");
  const publicSource = fs.readFileSync(path.join(sourceRoot, "components/news-public.tsx"), "utf8");

  assert.match(adminSource, /handleToggleFeatured/);
  assert.match(adminSource, /Chọn làm bài nổi bật/);
  assert.match(publicSource, /articles\.items\.find\(article => article\.isFeatured\)/);
});
