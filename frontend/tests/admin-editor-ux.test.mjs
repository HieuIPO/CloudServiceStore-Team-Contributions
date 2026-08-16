import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readOptional = async (path) => {
  try { return await readFile(new URL(path, import.meta.url), "utf8"); }
  catch { return ""; }
};

const statusFormattersSource = await readOptional("../src/lib/status-formatters.ts");
const dialogSource = await readOptional("../src/components/admin/admin-dialog.tsx");
const ordersSource = await readOptional("../src/components/admin-orders-client.tsx");
const landingSource = await readOptional("../src/components/admin-landing-client.tsx");
const affiliatesSource = await readOptional("../src/components/admin-affiliates-client.tsx");
const catalogSource = await readOptional("../src/components/admin-catalog-client.tsx");
const pricingSource = await readOptional("../src/components/admin-pricing-client.tsx");
const promotionsSource = await readOptional("../src/components/admin-promotions-client.tsx");
const newsSource = await readOptional("../src/components/admin-news-client.tsx");
const exportsSource = await readOptional("../src/components/admin-exports-client.tsx");
const auditLogsSource = await readOptional("../src/components/admin-audit-logs-client.tsx");
const workspaceSource = await readOptional("../src/components/admin/editor-workspace-client.tsx");
const adminCssSource = await readOptional("../src/app/admin/admin.css");
const adminShellSource = await readOptional("../src/components/admin/admin-shell.tsx");
const adminNavSource = await readOptional("../src/components/admin/admin-nav.ts");
const apiSource = await readOptional("../src/lib/api.ts");
const apiProxySource = await readOptional("../src/app/api/[...path]/route.ts");
const directoryBuildPropsSource = await readOptional("../../Directory.Build.props");
const infrastructureProjectSource = await readOptional("../../src/CloudServiceStore.Infrastructure/CloudServiceStore.Infrastructure.csproj");

test("status-formatters provides labels, color groups, and final status flags for Order and Affiliate", () => {
  for (const contract of [
    "getOrderStatusPresentation",
    "getAffiliateStatusPresentation",
    "isFinal",
    "Chờ duyệt",
    "Đã duyệt",
    "Đã hủy",
    "Từ chối",
  ]) {
    assert.ok(statusFormattersSource.includes(contract), `Expected status-formatters to include ${contract}`);
  }
});

test("AdminDialog primitive provides native dialog accessibility and focus restoration", () => {
  for (const contract of [
    "<dialog",
    'role="dialog"',
    'aria-modal="true"',
    "showModal",
    "activeElement",
    "focus",
    "isSubmitting",
  ]) {
    assert.ok(dialogSource.includes(contract), `Expected AdminDialog to include ${contract}`);
  }
});

test("Admin and Editor pages provide responsive mobile card views", () => {
  for (const source of [ordersSource, affiliatesSource, catalogSource, promotionsSource]) {
    assert.ok(source.includes("block md:hidden"), "Expected page to include mobile card view block md:hidden");
    assert.ok(source.includes("hidden md:block"), "Expected page to include desktop table view hidden md:block");
  }
  assert.ok(workspaceSource.includes("block lg:hidden"), "Workspace should use cards through tablet widths");
  assert.ok(workspaceSource.includes("hidden lg:block"), "Workspace table should start at the desktop breakpoint");
});

test("Workspace rows and detail panes contain long demo content", () => {
  for (const contract of [
    "admin-workspace-table",
    "admin-workspace-type-badge",
    "admin-detail-panel",
    "admin-detail-header-copy",
    "admin-detail-title",
    "admin-detail-value",
  ]) {
    assert.ok(workspaceSource.includes(contract), `Expected workspace UI to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("min-width: 57rem"), "Workspace table needs stable readable columns");
  assert.ok(adminCssSource.includes("overflow-wrap: anywhere"), "Detail panes must wrap unbroken demo content");
});

test("Workspace detail sheet keeps filters separate and gives contact email a full row", () => {
  for (const contract of [
    "editor-workspace-detail-backdrop",
    "editor-workspace-detail-sheet",
    "editor-workspace-with-detail",
    "admin-detail-email",
    "sm:col-span-2",
  ]) {
    assert.ok(workspaceSource.includes(contract), `Expected Workspace detail layout to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("@media (max-width: 1279px)"), "Workspace detail should become a sheet below xl");
  assert.ok(adminCssSource.includes("overflow-wrap: break-word"), "Email text needs a readable fallback wrap rule");
});

test("Workspace sort control stays inside the filter area instead of opening a native popup", () => {
  for (const contract of [
    "editor-workspace-sort-control",
    "editor-workspace-sort-trigger",
    "editor-workspace-sort-options",
    'aria-haspopup="listbox"',
    'role="listbox"',
    'role="option"',
  ]) {
    assert.ok(workspaceSource.includes(contract), `Expected Workspace sort control to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("position: absolute"), "Sort options should be positioned inside their control");
  assert.ok(adminCssSource.includes("right: 0"), "Sort options should not extend beyond the filter control");
});

test("Affiliate table constrains long names without pushing contact columns off-screen", () => {
  for (const contract of [
    "admin-affiliate-table",
    "admin-affiliate-name",
    "admin-affiliate-email",
    "title={item.fullName}",
  ]) {
    assert.ok(affiliatesSource.includes(contract), `Expected Affiliate table to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("table-layout: fixed"), "Affiliate table must use a fixed layout");
  assert.ok(adminCssSource.includes("min-width: 100%"), "Affiliate table must stay inside its responsive container");
});

test("Excel export notice explains audit tracking without exposing an internal event name", () => {
  assert.match(exportsSource, /Mỗi lần xuất file Excel sẽ được ghi nhận trong <strong>Audit Log<\/strong>/);
  assert.match(exportsSource, /người thực hiện, thời gian và số lượng bản ghi/);
  assert.doesNotMatch(exportsSource, /Orders\.Exported/);
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    'className="admin-toast admin-toast-success"',
    'role="status"',
    'aria-label="Đóng thông báo"',
  ]) {
    assert.ok(exportsSource.includes(contract), `Expected Excel export to use the shared success toast: ${contract}`);
  }
  assert.doesNotMatch(exportsSource, /p-3 bg-emerald-50 border border-emerald-200/);
});

test("Audit log presents Vietnamese labels while keeping technical codes available", () => {
  for (const contract of [
    'title="Nhật ký hoạt động hệ thống"',
    'placeholder="Tìm hành động, đối tượng hoặc email..."',
    'Tất cả đối tượng dữ liệu',
    "Đối tượng dữ liệu",
    "Tự động gia hạn phiên đăng nhập",
    "Xuất danh sách yêu cầu dịch vụ ra Excel",
    "Dữ liệu trước thao tác",
    "Dữ liệu sau thao tác",
  ]) {
    assert.ok(auditLogsSource.includes(contract), `Expected Audit Log Vietnamese label: ${contract}`);
  }
  assert.doesNotMatch(auditLogsSource, /Hành động \(Action\)|Đối tượng \(Entity\)|IP Address|Old Values|New Values/);
});

test("Order status actions use an auto-closing toast instead of a full-width notice", () => {
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    "admin-toast admin-toast-success",
    'role="status"',
    'aria-label="Đóng thông báo"',
  ]) {
    assert.ok(ordersSource.includes(contract), `Expected Orders status feedback to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("position: fixed"), "Admin toast should stay visible above the page content");
});

test("Landing editor uses an auto-closing toast for successful saves", () => {
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    "admin-toast admin-toast-success",
    'role="status"',
    'aria-label="Đóng thông báo"',
  ]) {
    assert.ok(landingSource.includes(contract), `Expected Landing editor feedback to include ${contract}`);
  }
});

test("Landing testimonial order conflicts explain the automatic shift", () => {
  for (const contract of [
    "const hasOrderConflict = testimonials.some",
    "displayOrder === testForm.displayOrder",
    "các đánh giá phía sau đã được dời xuống",
  ]) {
    assert.ok(landingSource.includes(contract), `Expected Landing editor order feedback to include ${contract}`);
  }
});

test("Landing testimonial list paginates larger collections", () => {
  for (const contract of [
    "const TESTIMONIAL_PAGE_SIZE = 10;",
    "const [testimonialPage, setTestimonialPage] = useState(1);",
    "const testimonialPageCount = Math.max(1, Math.ceil(testimonials.length / TESTIMONIAL_PAGE_SIZE));",
    "const visibleTestimonials = testimonials.slice(",
    "<SimplePagination",
  ]) {
    assert.ok(landingSource.includes(contract), `Expected testimonial pagination to include ${contract}`);
  }
  assert.match(landingSource, /testimonialPageCount > 1/);
});

test("Landing partner logo list paginates larger collections", () => {
  for (const contract of [
    "const LOGO_PAGE_SIZE = 10;",
    "const [logoPage, setLogoPage] = useState(1);",
    "const logoPageCount = Math.max(1, Math.ceil(logos.length / LOGO_PAGE_SIZE));",
    "const visibleLogos = logos.slice(",
    "visibleLogos.map",
    "<SimplePagination",
  ]) {
    assert.ok(landingSource.includes(contract), `Expected logo pagination to include ${contract}`);
  }
  assert.match(landingSource, /logoPageCount > 1/);
});

test("Landing partner logo order conflicts explain the automatic shift", () => {
  for (const contract of [
    "const hasLogoOrderConflict = logos.some",
    "displayOrder === logoForm.displayOrder",
    "const logoOrderConflictNotice",
  ]) {
    assert.ok(landingSource.includes(contract), `Expected logo order feedback to include ${contract}`);
  }
});

test("Landing delete actions use the AdminDialog confirmation mockup", () => {
  for (const contract of [
    'import { AdminDialog } from "./admin/admin-dialog";',
    'setDeleteTarget({ type: "testimonial", item: t })',
    'setDeleteTarget({ type: "logo", item: l })',
    "handleConfirmDelete",
    "<AdminDialog",
    "isOpen={!!deleteTarget}",
  ]) {
    assert.ok(landingSource.includes(contract), `Expected Landing delete confirmation to include ${contract}`);
  }
  assert.equal(landingSource.includes("confirm(`Bạn có chắc muốn xóa đánh giá"), false);
});

test("testimonial and logo display orders are non-negative and testimonial order is visible in the Admin list", () => {
  assert.match(landingSource, /type="number"\s+min=\{0\}\s+step=\{1\}/);
  assert.match(landingSource, /Math\.max\(0, Number\(e\.target\.value\)\)/);
  assert.match(landingSource, /Thứ tự: \{t\.displayOrder\}/);
  assert.equal(landingSource.match(/min=\{0\}/g)?.length, 2);
  assert.equal(landingSource.match(/step=\{1\}/g)?.length, 2);
  assert.equal(landingSource.match(/Math\.max\(0, Number\(e\.target\.value\)\)/g)?.length, 2);
});

test("Catalog table constrains long plan names and summaries", () => {
  for (const contract of [
    "admin-catalog-table",
    "admin-catalog-plan-name",
    "admin-catalog-plan-summary",
    "title={plan.name}",
    "title={plan.summary}",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected Catalog table to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("min-width: 48rem"), "Catalog table needs stable action columns");
  assert.ok(adminCssSource.includes("text-overflow: ellipsis"), "Catalog content must be shortened inside its cells");
});

test("Orders keep long plan names from pushing price and status columns away", () => {
  for (const contract of [
    "admin-orders-table",
    "admin-order-plan-cell",
    "admin-order-plan-name",
    "admin-order-status-cell",
    "admin-orders-plan-select",
    "title={item.planName}",
  ]) {
    assert.ok(ordersSource.includes(contract), `Expected Orders table to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("table-layout: fixed"), "Orders table must use a fixed layout");
  assert.ok(adminCssSource.includes("min-width: 54rem"), "Orders table needs stable readable columns");
  assert.ok(adminCssSource.includes(".admin-order-plan-name"), "Long order plan names need a constrained display rule");
});

test("Pricing and promotion controls keep long plan labels inside their controls", () => {
  for (const contract of [
    "compactPlanOptionLabel",
    "admin-pricing-plan-select",
    "admin-pricing-table",
    "admin-pricing-status-cell",
  ]) {
    assert.ok(pricingSource.includes(contract), `Expected pricing UI to include ${contract}`);
  }
  for (const contract of [
    "admin-promotion-plan-name",
    "admin-promotion-plan-category",
    "admin-qr-plan-name",
    "title={p.name}",
    "title={plan.name}",
  ]) {
    assert.ok(promotionsSource.includes(contract), `Expected promotion UI to include ${contract}`);
  }
  assert.ok(adminCssSource.includes(".admin-pricing-table"), "Pricing history needs a stable table layout");
  assert.ok(adminCssSource.includes(".admin-qr-plan-name"), "QR plan names need constrained display");
});

test("Promotion discount input accepts whole percentage and VND values", () => {
  assert.ok(promotionsSource.includes('min={1}'), "Discount values must start at one");
  assert.ok(promotionsSource.includes('step={1}'), "Discount values must use whole-number steps");
});

test("Admin can choose one promotion for the public banner", () => {
  for (const contract of [
    "showOnPublicBanner",
    "Hiển thị trên banner công khai",
    "handleSetPublicBanner",
    "Chỉ một chương trình",
  ]) {
    assert.ok(promotionsSource.includes(contract), `Expected banner selector to include ${contract}`);
  }
});

test("Promotion feedback uses the shared toast and QR plans paginate", () => {
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    'className="admin-toast admin-toast-success"',
    'className="admin-toast admin-toast-error"',
    'aria-label="Đóng thông báo"',
    "const QR_PAGE_SIZE = 6;",
    "const [qrPage, setQrPage] = useState(1);",
    "const visibleQrPlans = plans.slice(",
    "<SimplePagination",
    "page={safeQrPage}",
  ]) {
    assert.ok(promotionsSource.includes(contract), `Expected promotions UI to include ${contract}`);
  }
});

test("Promotion list paginates and exposes schedule and applied plans", () => {
  for (const contract of [
    "const PROMOTION_PAGE_SIZE = 10;",
    "const [promotionPage, setPromotionPage] = useState(1);",
    "const promotionPageCount = Math.max(1, Math.ceil(promotions.length / PROMOTION_PAGE_SIZE));",
    "const visiblePromotions = promotions.slice(",
    "page={safePromotionPage}",
    "Thời gian áp dụng",
    "formatPromotionDateTime",
    "Xem gói áp dụng",
    "const [planTarget, setPlanTarget] = useState<Promotion | null>(null);",
    "isOpen={!!planTarget}",
    "planTarget.servicePlanIds.map",
  ]) {
    assert.ok(promotionsSource.includes(contract), `Expected promotion list to include ${contract}`);
  }
  assert.match(promotionsSource, /promotionPageCount > 1/);
});

test("Promotion deletion uses an in-app confirmation dialog", () => {
  for (const contract of [
    "const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);",
    "const handleConfirmDelete = async () => {",
    "isOpen={!!deleteTarget}",
    "onClick={() => void handleConfirmDelete()}",
  ]) {
    assert.ok(promotionsSource.includes(contract), `Expected promotion deletion to include ${contract}`);
  }
  assert.ok(!promotionsSource.includes("confirm("), "Promotion deletion must not use the browser confirm dialog");
});

test("Pricing history paginates larger collections", () => {
  for (const contract of [
    "const PRICE_PAGE_SIZE = 10;",
    "const [pricePage, setPricePage] = useState(1);",
    "const pricePageCount = Math.max(1, Math.ceil((planDetail?.prices.length ?? 0) / PRICE_PAGE_SIZE));",
    "const visiblePrices = planDetail?.prices.slice(",
    "visiblePrices.map",
    "<SimplePagination",
  ]) {
    assert.ok(pricingSource.includes(contract), `Expected pricing history pagination to include ${contract}`);
  }
  assert.match(pricingSource, /pricePageCount > 1/);
});

test("Pricing feedback uses the shared auto-closing admin toast", () => {
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    'className="admin-toast admin-toast-success"',
    'role="status"',
    'aria-label="Đóng thông báo"',
  ]) {
    assert.ok(pricingSource.includes(contract), `Expected pricing feedback to include ${contract}`);
  }
});

test("Pricing history distinguishes current, upcoming, and ended versions", () => {
  for (const contract of [
    "Date.parse(price.effectiveFrom)",
    "Date.parse(price.effectiveTo)",
    "Sắp áp dụng",
    "Đã kết thúc",
    "getPricePresentation(p)",
  ]) {
    assert.ok(pricingSource.includes(contract), `Expected pricing status logic to include ${contract}`);
  }
});

test("Shared status labels stay on one line in narrow tables", () => {
  assert.ok(adminCssSource.includes(".admin-status-dot"), "StatusDot needs a shared layout rule");
  assert.ok(adminCssSource.includes("text-overflow: ellipsis"), "Narrow status labels need an ellipsis fallback");
  assert.ok(adminCssSource.includes("white-space: nowrap"), "Status labels must not wrap onto multiple lines");
});

test("Touch targets meet minimum 44px height requirement in admin styles and components", () => {
  assert.ok(adminCssSource.includes("min-h: 44px") || adminCssSource.includes("min-height: 44px"), "Expected admin.css to enforce 44px min-height");
  assert.ok(adminShellSource.includes("min-h-[44px]"), "Expected AdminShell controls to include min-h-[44px]");
  assert.ok(adminCssSource.includes(".admin-app button"), "Expected the 44px rule to cover every admin button");
  assert.ok(!workspaceSource.includes("sm:min-h-0"), "Workspace controls must not opt out of the 44px target at desktop breakpoints");
  assert.ok(workspaceSource.includes('className="admin-input pl-8 pr-2.5"'), "Workspace search must use the shared accessible input style");
});

test("Mobile promotion content can shrink and wrap long plan names", () => {
  assert.ok(promotionsSource.includes("min-w-0 flex-1"), "Promotion plan text needs a shrinkable flex child");
  assert.ok(promotionsSource.includes("admin-promotion-plan-name"), "Promotion plan names need a constrained display rule");
  assert.ok(promotionsSource.includes("shrink-0 whitespace-nowrap"), "QR action must remain visible without forcing horizontal overflow");
});

test("News table keeps long titles and slugs readable without horizontal overflow", () => {
  for (const contract of [
    "admin-news-table",
    "admin-news-article-copy",
    "admin-news-article-title",
    "admin-news-article-slug",
    "data-full-text={article.title}",
    "data-full-text={`/news/${article.slug}`}",
  ]) {
    assert.ok(newsSource.includes(contract), `Expected news UI to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("table-layout: fixed"), "News table must constrain content to its columns");
  assert.ok(adminCssSource.includes("overflow-wrap: anywhere"), "Long unbroken article content must be allowed to wrap");
  assert.ok(adminCssSource.includes("word-break: break-all"), "Pathological unbroken titles must stay inside the cell");
  assert.ok(adminCssSource.includes("-webkit-line-clamp: 2"), "Article titles should be limited to two lines");
});

test("News row actions stay aligned when publish labels have different lengths", () => {
  for (const contract of [
    "admin-news-actions",
    "admin-news-action-icon",
    "admin-news-publish-action",
  ]) {
    assert.ok(newsSource.includes(contract), `Expected News actions to include ${contract}`);
  }
  assert.ok(adminCssSource.includes("grid-template-columns: 44px 6.5rem 44px"), "News actions need fixed icon and button tracks");
  assert.ok(adminCssSource.includes("white-space: nowrap"), "Publish labels must stay on one line inside the fixed action track");
});

test("Shared session refresh is timeout-bound without sharing a caller AbortSignal", () => {
  assert.ok(apiSource.includes("waitForRefresh"), "Refresh callers should be cancellable independently");
  assert.ok(apiSource.includes("signal: timeoutController.signal"), "Refresh network request must use its own timeout signal");
  assert.ok(!apiSource.includes("AbortSignal.any"), "A caller signal must not be combined into the shared refresh request");
});

test("Data requests are bounded and Workspace cancels stale requests", () => {
  assert.ok(apiSource.includes("API_REQUEST_TIMEOUT_MS"), "Normal API requests must have a timeout");
  assert.ok(apiSource.includes("createTimedRequestSignal"), "Normal API requests must use a cancellable timeout signal");
  assert.ok(workspaceSource.includes("workspaceRequestControllerRef.current?.abort()"), "Workspace must cancel the previous request before refetching");
  assert.ok(workspaceSource.includes("requestController.signal"), "Workspace API calls must receive the request signal");
});

test("Browser API requests stay same-origin and use the Next proxy across Docker", () => {
  assert.ok(apiSource.includes("typeof window === \"undefined\" ? configuredApiBaseUrl : \"\""), "Browser API requests must stay on the frontend origin");
  assert.ok(apiSource.includes("configuredApiBaseUrl"), "Server-side API configuration must remain available");
  assert.ok(apiProxySource.includes("serverApiBaseUrl"), "Next must proxy browser API requests to the server-side API");
  assert.ok(apiProxySource.includes('headers.set("origin", frontendOrigin)'), "The API proxy must preserve the trusted frontend origin");
});

test("Workspace query controls update URL state without triggering an RSC navigation", () => {
  assert.ok(workspaceSource.includes("window.history.pushState"), "Workspace filters should use client-side URL state");
  assert.ok(!workspaceSource.includes("router.push(`/admin/workspace?"), "Workspace query changes must not request a new RSC payload");
});

test("Admin route guard denies unknown routes by default", () => {
  assert.ok(adminNavSource.includes('return normalizedPath === "/admin" || normalizedPath === "/admin/"'), "Unknown admin routes must not be allowed implicitly");
  assert.ok(adminNavSource.includes('searchParams.get("tab") === "program"'), "Affiliate program tab must remain Admin-only");
});

test("Backend projects retain the repository .NET 10 baseline", () => {
  assert.ok(directoryBuildPropsSource.includes("<TargetFramework>net10.0</TargetFramework>"), "Directory.Build.props must target net10.0");
  assert.ok(infrastructureProjectSource.includes('Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.10"'), "EF Core SQL Server must remain on the .NET 10 package line");
});

test("Password change modal enforces accessibility binding with htmlFor, id, aria-describedby and policy id", () => {
  for (const contract of [
    'htmlFor="current-password-input"',
    'id="current-password-input"',
    'htmlFor="new-password-input"',
    'id="new-password-input"',
    'htmlFor="confirm-password-input"',
    'id="confirm-password-input"',
    'id="password-policy-desc"',
    "aria-describedby",
    "aria-invalid",
  ]) {
    assert.ok(adminShellSource.includes(contract), `Expected password form in AdminShell to include ${contract}`);
  }
});
