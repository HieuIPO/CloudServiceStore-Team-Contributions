import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = relative => fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");
const server = read("src/lib/news-server.ts");
const route = read("src/app/news/page.tsx");
const view = read("src/components/news-public.tsx");

test("public News parses route query and sends search/category/page to the server contract", () => {
  assert.match(server, /export const NEWS_PAGE_SIZE = 10/);
  assert.match(server, /getPublicNewsQuery/);
  assert.match(server, /articleQuery\.set\("search", query\.search\)/);
  assert.match(server, /articleQuery\.set\("categoryId", query\.categoryId\)/);
  assert.match(server, /\/api\/v1\/news-articles\?\$\{articleQuery\}/);
  assert.match(route, /const query = getPublicNewsQuery\(await searchParams\)/);
  assert.match(route, /const data = await getPublicNewsPage\(query\)/);
  const queryIndex = route.indexOf("getPublicNewsQuery(await searchParams)");
  const pageIndex = route.indexOf("getPublicNewsPage(query)");
  const returnIndex = route.indexOf("return <");
  assert.ok(queryIndex >= 0 && queryIndex < pageIndex && pageIndex < returnIndex, "News list must fetch SSR data before returning its UI");
});

test("public News rendering no longer loads 100 articles and filters them in the browser", () => {
  assert.doesNotMatch(view, /"use client"/);
  assert.doesNotMatch(view, /useEffect|useMemo|useState|newsApi\.publicArticles/);
  assert.doesNotMatch(view, /pageSize: 100/);
  assert.match(view, /method="get"/);
  assert.match(view, /getNewsHref/);
  assert.match(view, /<Pagination query=\{query\} result=\{articles\}/);
});

test("News SSR does not convert an unavailable API into an empty page or a false 404", () => {
  assert.match(server, /class NewsApiError/);
  assert.match(server, /await Promise\.all\(\[/);
  assert.doesNotMatch(server, /Promise\.allSettled/);
  assert.match(server, /if \(error instanceof NewsApiError && error\.status === 404\) return null;/);
});
