import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("the shared brand component exposes the approved logo asset and variants", async () => {
  const source = await readSource("../src/components/brand-logo.tsx");
  const styles = await readSource("../src/app/globals.css");
  const brandingSource = `${source}\n${styles}`;

  assert.match(brandingSource, /\/branding\/cloud-service-store-logo\.png/);
  assert.match(source, /variant\?: "mark" \| "full"/);
  assert.match(source, /brand-logo--mark/);
  assert.match(source, /brand-logo--full/);
});

test("the public mark logo has the slightly larger header size", async () => {
  const styles = await readSource("../src/app/globals.css");

  assert.match(
    styles,
    /\.brand-logo__mark-media\s*\{[\s\S]*?width:\s*2\.75rem;[\s\S]*?height:\s*2\.75rem;[\s\S]*?flex:\s*0 0 2\.75rem;/
  );
  assert.match(
    styles,
    /@media\s*\(max-width:\s*767px\)[\s\S]*?\.brand-logo__mark-media\s*\{[\s\S]*?width:\s*2\.5rem;[\s\S]*?height:\s*2\.5rem;[\s\S]*?flex-basis:\s*2\.5rem;/
  );
});

test("the approved logo asset exists in the public branding directory", async () => {
  await access(new URL("../public/branding/cloud-service-store-logo.png", import.meta.url));
});

test("social metadata points to the approved logo asset", async () => {
  const source = await readSource("../src/app/layout.tsx");

  assert.equal((source.match(/\/branding\/cloud-service-store-logo\.png/g) ?? []).length, 2);
  assert.doesNotMatch(source, /images:\s*\[?\{?\s*url:\s*["']\/og\.png/);
});

test("public navigation and brand surfaces use shared branding", async () => {
  const [header, services, login, admin, banner] = await Promise.all([
    readSource("../src/components/site-header.tsx"),
    readSource("../src/app/services/page.tsx"),
    readSource("../src/app/login/page.tsx"),
    readSource("../src/components/admin/admin-shell.tsx"),
    readSource("../src/components/public-page-banner.tsx"),
  ]);

  assert.match(header, /BrandLogo/);
  assert.match(header, /aria-current="page"/);
  assert.match(services, /SiteHeader/);
  assert.match(login, /AccountAuthForm/);
  assert.match(admin, /BrandLogo/);
  assert.match(banner, /text-base/);
  assert.doesNotMatch(banner, /text-\[\.68rem\]/);
});

test("reference navigation keeps the readable public actions", async () => {
  const source = await readSource("../src/components/site-header.tsx");

  for (const contract of ["Hỗ trợ", "Đăng nhập", "Điều hướng chính", "Điều hướng trên di động"]) {
    assert.match(source, new RegExp(contract));
  }
});
