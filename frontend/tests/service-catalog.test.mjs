import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readOptional = async (path) => {
  try { return await readFile(new URL(path, import.meta.url), "utf8"); }
  catch { return ""; }
};

const servicePageSource = await readFile(new URL("../src/app/services/page.tsx", import.meta.url), "utf8");
const detailSource = await readOptional("../src/components/service-plan-detail-client.tsx");
const catalogSource = await readOptional("../src/components/public-service-catalog.tsx");
const cardSource = await readOptional("../src/components/service-plan-card.tsx");
const artSource = await readOptional("../src/components/service-catalog-art.tsx");
const sampleSource = await readOptional("../src/lib/service-catalog-sample.ts");
const headerSource = await readOptional("../src/components/site-header.tsx");
const visualSource = `${catalogSource}\n${cardSource}\n${artSource}`;

test("Services route uses the dedicated public service catalog", () => {
  assert.match(servicePageSource, /PublicServiceCatalog/);
});

test("public service catalog exposes the required browse and conversion states", () => {
  for (const contract of [
    "Tất cả dịch vụ",
    "Tìm kiếm dịch vụ",
    "Sắp xếp",
    "Xem chi tiết",
    "Đăng ký ngay",
    'role="alert"',
    "Không có gói phù hợp",
  ]) {
    assert.match(visualSource, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("service catalog matches the bright reference composition", () => {
  for (const contract of [
    "service-hero",
    "service-hero-art",
    "service-plan-grid",
    "Phổ biến nhất",
    "service-feature-list",
    "Tư vấn cấu hình",
    "catalogApi.plan",
  ]) {
    assert.match(visualSource, new RegExp(contract.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }
});

test("service route uses the reference navigation treatment", () => {
  assert.match(servicePageSource, /SiteHeader/);
  for (const contract of ["BrandLogo", "Đăng nhập", "Hỗ trợ", "aria-current=\"page\""]) {
    assert.match(headerSource, new RegExp(contract.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }
});

test("service page keeps the reference density and desktop control row", () => {
  for (const contract of ["service-shell", "max-w-none", "lg:px-20", "lg:flex-row", "min-h-[22rem]", "viewBox=\"0 0 760 180\""]) {
    assert.ok(visualSource.includes(contract), `Expected service catalog source to include ${contract}`);
  }
});

test("service plan CTAs keep their labels readable at narrow card widths", () => {
  for (const contract of [
    "grid gap-2 pt-3 sm:grid-cols-2",
    "min-w-0 whitespace-nowrap",
    "text-xs",
    "sm:px-3",
    "sm:text-sm",
  ]) {
    assert.ok(cardSource.includes(contract), `Expected service CTA layout to include ${contract}`);
  }
});

test("service hero and CTA keep the approved compact reference proportions", () => {
  for (const contract of [
    "lg:h-[13.875rem]",
    'data-hero-server="primary"',
    'data-hero-server="secondary"',
  ]) {
    assert.ok(visualSource.includes(contract), `Expected compact reference contract ${contract}`);
  }
});

test("service catalog supports an explicit sample-data preview without seeding the API", () => {
  assert.match(catalogSource, /URLSearchParams/);
  assert.match(catalogSource, /"preview"/);
  assert.match(catalogSource, /"sample"/);
  assert.match(catalogSource, /samplePlans/);
  assert.match(catalogSource, /Đang xem dữ liệu mẫu/);
  for (const contract of ["VPS Business 4", "Hosting Pro", "Anti-DDoS Basic", "samplePlanDetails"]) {
    assert.ok(sampleSource.includes(contract), `Expected sample catalog source to include ${contract}`);
  }
});

test("initial catalog loading is deferred from the effect body", () => {
  assert.match(catalogSource, /window\.setTimeout/);
});

test("service plan detail loads the live slug and supports monthly and yearly pricing", () => {
  for (const contract of [
    "catalogApi.planBySlug(slug)",
    "const [billingCycle, setBillingCycle] = useState<1 | 12>(1)",
    "billingCycle === 1",
    "billingCycle === 12",
    "Theo tháng",
    "Theo năm",
    "plan.prices",
    "service-plan-detail-shell",
    "lg:sticky",
  ]) {
    assert.ok(detailSource.includes(contract), `Expected service detail contract: ${contract}`);
  }
});

test("service plan detail keeps conversion, QR and accessible state contracts", () => {
  for (const contract of [
    "href={`/order?plan=${plan.slug}&cycle=${billingCycle}`}",
    "plan.qrCodePath",
    'aria-pressed={billingCycle === 1}',
    'aria-pressed={billingCycle === 12}',
    'role="alert"',
    "Không tìm thấy gói dịch vụ",
  ]) {
    assert.ok(detailSource.includes(contract), `Expected service detail UX contract: ${contract}`);
  }
});
