import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("mobile footer stacks its sections instead of keeping desktop columns", async () => {
  const css = await readSource("../src/app/globals.css");

  assert.match(
    css,
    /@media \(max-width: 639px\) \{[\s\S]*?\.site-footer__grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/
  );
});

test("mobile public menu stays inside the viewport and keeps account actions in flow", async () => {
  const header = await readSource("../src/components/site-header.tsx");
  const actions = await readSource("../src/components/customer-header-actions.tsx");
  const css = await readSource("../src/app/globals.css");

  assert.match(header, /site-mobile-menu/);
  assert.match(header, /site-mobile-menu__panel/);
  assert.match(header, /CustomerHeaderActions mobile/);
  assert.match(actions, /menuClass = mobile/);
  assert.match(actions, /static/);
  assert.match(css, /\.site-mobile-menu__panel/);
  assert.match(css, /width:\s*min\(20rem, calc\(100vw - 2rem\)\)/);
  assert.match(css, /max-height:\s*calc\(100dvh - 5rem\)/);
});

test("mobile menu uses a scalable chevron instead of a text arrow glyph", async () => {
  const header = await readSource("../src/components/site-header.tsx");
  const css = await readSource("../src/app/globals.css");

  assert.doesNotMatch(header, /⌄/);
  assert.match(header, /<svg aria-hidden="true" className="site-mobile-menu__trigger-arrow/);
  assert.match(header, /group-open:rotate-180/);
  assert.match(css, /\.site-mobile-menu__trigger-arrow\s*\{[\s\S]*?width:\s*1rem[\s\S]*?height:\s*1rem/);
});

test("tablet widths keep navigation available through the compact menu", async () => {
  const header = await readSource("../src/components/site-header.tsx");

  assert.match(header, /className="hidden items-center gap-1 text-\[15px\] font-bold text-slate-900 xl:flex"/);
  assert.match(header, /className="hidden items-center gap-3 xl:flex"/);
  assert.match(header, /className="site-mobile-menu group relative xl:hidden"/);
});
