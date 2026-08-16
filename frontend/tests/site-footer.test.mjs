import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("public footer uses shared branding and real public navigation routes", async () => {
  const source = await readSource("../src/components/site-footer.tsx");

  for (const contract of [
    "SiteFooter",
    "BrandLogo",
    "Điều hướng",
    "Hỗ trợ",
    "Kết nối với chúng tôi",
    "Câu hỏi thường gặp",
    "site-footer__surface",
  ]) {
    assert.match(source, new RegExp(contract.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
  }

  assert.match(source, /href: "\/services"/);
  assert.match(source, /href: "\/order"/);
  assert.doesNotMatch(source, /href: "#"/);
});

test("public routes render the footer while admin remains outside its scope", async () => {
  const routeSources = await Promise.all([
    readSource("../src/app/page.tsx"),
    readSource("../src/app/about/page.tsx"),
    readSource("../src/app/customers/page.tsx"),
    readSource("../src/app/affiliate/page.tsx"),
    readSource("../src/app/news/page.tsx"),
    readSource("../src/app/news/[slug]/page.tsx"),
    readSource("../src/app/order/page.tsx"),
    readSource("../src/app/pricing/page.tsx"),
    readSource("../src/app/services/page.tsx"),
    readSource("../src/app/services/[slug]/page.tsx"),
  ]);

  for (const source of routeSources) assert.match(source, /SiteFooter/);
});

test("footer protects long content and keeps mobile groups keyboard accessible", async () => {
  const css = await readSource("../src/app/globals.css");
  const source = await readSource("../src/components/site-footer.tsx");

  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /min-height:\s*2\.75rem/);
  assert.match(source, /<details className="site-footer__section site-footer__section--mobile">/);
  assert.match(source, /<summary>/);
});

test("footer follows the reference card density across responsive breakpoints", async () => {
  const css = await readSource("../src/app/globals.css");
  const source = await readSource("../src/components/site-footer.tsx");

  assert.doesNotMatch(source, /label: "Khách hàng"/);
  assert.match(source, /site-footer__section--desktop/);
  assert.match(source, /site-footer__section--mobile/);
  assert.match(css, /padding-inline:\s*clamp\(1rem, 3vw, 2rem\)/);
  assert.match(css, /\.site-footer__link \{[\s\S]*?min-height:\s*2\.25rem/);
  assert.match(css, /@media \(min-width: 1024px\) and \(max-width: 1199px\)/);
  assert.match(css, /-webkit-line-clamp:\s*5/);
});
