import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");
const catalogSource = await readSource("../src/components/admin-catalog-client.tsx");
const apiSource = await readSource("../src/lib/api.ts");

test("admin catalog requests one server-paged plan collection", () => {
  for (const contract of [
    "const PLAN_PAGE_SIZE = 10;",
    "const [planPage, setPlanPage] = useState(1);",
    "catalogApi.adminPlans(null, requestedPage, PLAN_PAGE_SIZE, true)",
    "planResult.totalPages",
    "<SimplePagination",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected catalog pagination contract: ${contract}`);
  }
  assert.match(apiSource, /adminPlans:\s*\(isActive: boolean \| null = true, page = 1, pageSize = 100, includeInactive = false\)/);
  assert.match(apiSource, /isActive === null/);
  assert.match(apiSource, /includeInactive \?/);
});

test("admin catalog feedback uses compact success and error toasts", () => {
  for (const contract of [
    "window.setTimeout(() => setNotice(null), 4000)",
    "admin-toast admin-toast-success",
    "admin-toast admin-toast-error",
    "Thao tác không thành công",
    'role="alert"',
    'aria-label="Đóng thông báo"',
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected catalog feedback contract: ${contract}`);
  }
  assert.equal(catalogSource.includes("<ErrorState message={error}"), false);
});

test("duplicate plan slugs explain the conflict next to the slug field", () => {
  for (const contract of [
    "const [planSlugError, setPlanSlugError] = useState<string | null>(null);",
    "err.status === 409",
    "setPlanSlugError(duplicateSlugMessage)",
    "aria-invalid={Boolean(planSlugError)}",
    "Slug này đã tồn tại",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected duplicate slug contract: ${contract}`);
  }
});

test("duplicate category slugs explain the conflict next to the slug field", () => {
  for (const contract of [
    "const [categorySlugError, setCategorySlugError] = useState<string | null>(null);",
    "Slug này đã tồn tại. Vui lòng chọn slug khác cho danh mục.",
    "setCategorySlugError(duplicateCategorySlugMessage)",
    "aria-invalid={Boolean(categorySlugError)}",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected duplicate category slug contract: ${contract}`);
  }
});

test("feature rows keep key and display-name fields readable", () => {
  for (const contract of [
    "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_6rem_2.75rem]",
    "Mã tính năng",
    "Tên hiển thị",
    "aria-label={`Feature key ${idx + 1}`}"
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected feature layout contract: ${contract}`);
  }
  assert.equal(catalogSource.includes("text-xs flex-1"), false, "Feature inputs must not collapse through flex sizing");
});

test("category delete conflicts explain that service plans must be handled first", () => {
  for (const contract of [
    "err.status === 409 && /service plan/i.test(err.message)",
    "Không thể xóa danh mục vì vẫn còn gói dịch vụ",
    "setNotice(null);",
    "setError(categoryDeleteMessage);",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected category delete feedback contract: ${contract}`);
  }
});

test("catalog delete actions use the custom confirmation dialog", () => {
  for (const contract of [
    "type DeleteTarget =",
    'setDeleteTarget({ type: "category", item: cat });',
    'setDeleteTarget({ type: "plan", item: plan });',
    "const handleConfirmDelete = async () => {",
    "isOpen={!!deleteTarget}",
    "admin-button-danger admin-button-sm",
  ]) {
    assert.ok(catalogSource.includes(contract), `Expected custom delete dialog contract: ${contract}`);
  }
  assert.equal(catalogSource.includes("confirm("), false, "Catalog must not use the native browser confirm dialog");
  assert.equal(catalogSource.includes("alert("), false, "Catalog must not use the native browser alert dialog");
});
