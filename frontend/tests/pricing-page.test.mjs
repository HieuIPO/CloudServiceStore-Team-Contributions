import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readOptional = async (path) => {
  try { return await readFile(new URL(path, import.meta.url), "utf8"); }
  catch { return ""; }
};

const pageSource = await readFile(new URL("../src/app/pricing/page.tsx", import.meta.url), "utf8");
const apiSource = await readOptional("../src/lib/api.ts");
const pricingSource = await readOptional("../src/components/public-pricing-page.tsx");
const cardSource = await readOptional("../src/components/pricing-plan-card.tsx");
const adminPromotionSource = await readOptional("../src/components/admin-promotions-client.tsx");
const orderPageSource = await readOptional("../src/app/order/page.tsx");
const orderSource = await readOptional("../src/components/order-request-client.tsx");
const comparisonSource = await readOptional("../src/components/pricing-comparison-table.tsx");
const promotionSource = await readOptional("../src/components/pricing-promotion-banner.tsx");
const detailSource = await readOptional("../src/components/service-plan-detail-client.tsx");
const dataSource = await readOptional("../src/lib/pricing-data.ts");
const visualSource = `${pricingSource}\n${cardSource}\n${comparisonSource}\n${promotionSource}`;

test("pricing route uses the dedicated public pricing page", () => {
  assert.match(pageSource, /PublicPricingPage/);
  assert.match(pageSource, /SiteHeader/);
});

test("pricing mockup exposes the billing, promotion, plan and CTA contracts", () => {
  for (const contract of [
    "Bảng giá dịch vụ",
    "Theo tháng",
    "Theo năm",
    "VPS Start 2",
    "VPS Business 4",
    "Cloud Server Pro 8",
    "Cloud Server Enterprise",
    "Đặt hàng ngay",
    "Liên hệ tư vấn",
    "setBillingCycle",
  ]) {
    assert.ok(visualSource.includes(contract) || dataSource.includes(contract), `Expected pricing source to include ${contract}`);
  }
});

test("pricing promotion banner uses the active promotion API and hides without an active offer", () => {
  assert.match(apiSource, /export const promotionApi/);
  assert.match(pricingSource, /promotionApi\.all\(true\)/);
  assert.match(pricingSource, /getActivePromotion/);
  assert.match(pricingSource, /promotion\.endsAt/);
  assert.match(pricingSource, /promotion && countdown/);
  assert.match(promotionSource, /promotion\.name/);
  assert.match(promotionSource, /promotion\.discountValue/);
  assert.match(promotionSource, /promotion\.endsAt/);
  assert.doesNotMatch(pricingSource, /savings="[^"]*20%/);
});

test("public pricing only renders the promotion selected for the banner", () => {
  assert.match(pricingSource, /promotionResult\.items\.filter\(promotion => promotion\.showOnPublicBanner\)/);
  assert.match(apiSource, /showOnPublicBanner/);
});

test("pricing comparison keeps the required specification rows", () => {
  for (const contract of ["CPU", "RAM", "SSD/NVMe", "Băng thông", "IP riêng", "Backup", "Hỗ trợ kỹ thuật"]) {
    assert.ok(comparisonSource.includes(contract) || dataSource.includes(contract), `Expected pricing comparison to include ${contract}`);
  }
});

test("pricing comparison keeps plan values readable while swiping on mobile", () => {
  assert.match(comparisonSource, /<colgroup>/);
  assert.match(comparisonSource, /Math\.max\(68, labelColumnWidthRem \+ plans\.length \* planColumnWidthRem\)/);
  assert.match(comparisonSource, /labelColumnWidthRem = 12/);
  assert.match(comparisonSource, /planColumnWidthRem = 10/);
  assert.match(comparisonSource, /pricing-comparison-table__value/);
  assert.match(comparisonSource, /break-words/);
  assert.match(comparisonSource, /pricing-comparison-cards/);
  assert.match(comparisonSource, /xl:hidden/);
  assert.match(comparisonSource, /pricing-comparison-scroll[^\"]*hidden[^\"]*xl:block/);
  assert.match(comparisonSource, /grid-cols-\[minmax\(0,1fr\)_minmax\(5\.5rem,auto\)\]/);
});

test("pricing preview is local-only and includes the reference annual prices", () => {
  assert.match(pricingSource, /URLSearchParams/);
  assert.match(pricingSource, /preview/);
  for (const contract of ["2390000", "5990000", "10790000", "samplePricingPlans"]) {
    assert.ok(dataSource.includes(contract) || pricingSource.includes(contract), `Expected sample pricing contract ${contract}`);
  }
});

test("pricing links preserve the selected billing cycle for each plan", () => {
  assert.match(cardSource, /billingCycle/);
  assert.match(cardSource, /\/order\?plan=/);
  assert.match(cardSource, /cycle=/);
});

test("pricing cards display the price for the selected billing cycle", () => {
  for (const contract of [
    "const selectedPrice = billingCycle === 12 ? plan.annual : plan.monthly;",
    "const cycleLabel = billingCycle === 12 ? \"/năm\" : \"/tháng\";",
    "selectedPrice.current",
    "billingCycle === 12 && selectedPrice.original",
  ]) {
    assert.ok(cardSource.includes(contract), `Expected selected-cycle pricing to include ${contract}`);
  }
});

test("public pricing ignores price versions outside their effective window", () => {
  for (const contract of [
    "now = Date.now()",
    "Date.parse(price.effectiveFrom) <= now",
    "!price.effectiveTo || Date.parse(price.effectiveTo) > now",
  ]) {
    assert.ok(dataSource.includes(contract), `Expected effective price filtering to include ${contract}`);
  }
});

test("order flow carries the selected cycle and uses the configured price version", () => {
  for (const contract of [
    'const { plan, cycle, preview } = await searchParams;',
    "initialBillingCycle",
    "getActivePlanPrice",
    "const selectedPrice = getActivePlanPrice",
    "selectedDetail.activePromotions",
    "pricing.hasPrice",
  ]) {
    assert.ok(orderPageSource.includes(contract) || orderSource.includes(contract), `Expected order pricing integration to include ${contract}`);
  }
  assert.ok(!orderSource.includes("const discountRate = form.billingCycle === 12 ? .2"), "Order UI must not hard-code the annual discount");
});

test("order pricing treats a null promotion as no discount and hides the empty promotion row", () => {
  assert.match(orderSource, /typeof selectedPlan\.promotionalMonthlyPrice === "number"/);
  assert.match(orderSource, /pricing\.discount > 0/);
});

test("order form keeps service and plan selection explicit", () => {
  assert.match(orderSource, /const initialPlan = samplePlans\.find\(item => item\.slug === initialPlanSlug\);/);
  assert.match(orderSource, /const planOptions = category \? \(categoryPlans\.length \? categoryPlans : plans\) : \[\];/);
  assert.match(orderSource, /updateForm\("servicePlanId", ""\)/);
  assert.match(orderSource, /<option value="">/);
  assert.match(orderSource, /if \(!selectedPlan\)/);
});

test("admin promotion form exposes an explicit billing-cycle scope", () => {
  assert.match(apiSource, /billingCycle/);
  assert.match(adminPromotionSource, /billingCycle/);
  assert.match(adminPromotionSource, /servicePlanIds/);
});

test("pricing calculations filter promotions by the selected billing cycle", () => {
  assert.match(dataSource, /promotionAppliesToCycle/);
  assert.match(dataSource, /getBestPromotion\(baseMonthly, activePromotions, 1\)/);
  assert.match(dataSource, /getBestPromotion\(baseAnnual, activePromotions, 12\)/);
});

test("promotion banner explains the selected cycle and selected-plan scope", () => {
  assert.match(promotionSource, /billingCycle/);
  assert.match(promotionSource, /servicePlanIds/);
  assert.match(pricingSource, /billingCycle/);
});

test("service detail highlights the selected promotion and carries the cycle to checkout", () => {
  assert.match(detailSource, /bestPromotion/);
  assert.match(detailSource, /Đang áp dụng/);
  assert.match(detailSource, /cycle=/);
});
