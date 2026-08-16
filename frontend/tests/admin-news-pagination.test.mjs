import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/admin-news-client.tsx"),
  "utf8"
);

test("admin news list uses server pagination for article results", () => {
  assert.match(source, /const NEWS_PAGE_SIZE = 10/);
  assert.match(source, /SimplePagination/);
  assert.match(source, /page: (articlePage|requestedPage)/);
  assert.match(source, /pageSize: NEWS_PAGE_SIZE/);
  assert.match(source, /setArticleTotalPages\(artRes\.totalPages\)/);
  assert.match(source, /onPageChange=\{setArticlePage\}/);
});
