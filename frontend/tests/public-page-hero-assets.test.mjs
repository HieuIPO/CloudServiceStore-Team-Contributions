import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

const [orderSource, newsSource, customersSource, pricingSource, servicesSource] = await Promise.all([
  readSource("../src/components/order-request-client.tsx"),
  readSource("../src/components/news-public.tsx"),
  readSource("../src/app/customers/page.tsx"),
  readSource("../src/components/public-pricing-page.tsx"),
  readSource("../src/components/public-service-catalog.tsx"),
]);

test("public page heroes use the approved page-specific artwork mapping", () => {
  const heroAssets = [
    [orderSource, "/assets/page-heroes/order-hero.png"],
    [newsSource, "/assets/page-heroes/news-hero.png"],
    [customersSource, "/assets/page-heroes/customers-hero.png"],
    [pricingSource, "/assets/page-heroes/pricing-hero.png"],
    [servicesSource, "/assets/page-heroes/services-hero.png"],
  ];

  for (const [source, asset] of heroAssets) {
    assert.ok(source.includes(`bg-[url('${asset}')]`) || source.includes(`bg-[url(${asset})]`), `Expected hero to use ${asset}`);
  }
});

test("customer CTA uses the approved support artwork instead of the legacy SVG", () => {
  assert.ok(
    customersSource.includes("bg-[url('/assets/page-heroes/order-hero.png')]"),
    "Expected the customer CTA to use the support artwork background",
  );
  assert.doesNotMatch(customersSource, /CustomerCtaArt/);
});
