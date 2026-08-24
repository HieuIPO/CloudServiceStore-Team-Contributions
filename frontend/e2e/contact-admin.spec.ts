import { expect, test, type Page } from "@playwright/test";

const contactId = "11111111-2222-3333-4444-555555555555";
const admin = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  email: "admin.e2e@example.test",
  fullName: "Contact Administrator",
  roles: ["Admin"],
};
const editor = { ...admin, id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff", email: "editor.e2e@example.test", roles: ["Editor"] };
const customer = { ...admin, id: "cccccccc-dddd-eeee-ffff-000000000000", email: "customer.e2e@example.test", roles: ["Customer"] };

const contactListItem = {
  id: contactId,
  fullName: "Nguyen Phuoc Duy",
  email: "duy.contact@example.test",
  phoneNumber: "0901234567",
  companyName: "CloudServiceStore QA",
  subject: "Tu van ha tang Cloud",
  status: 1,
  createdAt: "2026-08-23T00:00:00Z",
};

function detail(status = 1, allowedTransitions = [2, 4, 5]) {
  return {
    ...contactListItem,
    message: "Toi can tu van giai phap Cloud cho doanh nghiep.",
    status,
    resolutionNote: null,
    resolvedBy: null,
    resolvedAt: null,
    updatedAt: null,
    statusHistory: [{
      id: "99999999-aaaa-bbbb-cccc-dddddddddddd",
      fromStatus: 1,
      toStatus: status,
      note: null,
      changedBy: admin.id,
      createdAt: "2026-08-23T00:00:00Z",
    }],
    allowedTransitions,
  };
}

async function mockLogin(page: Page, user: typeof admin) {
  const session = {
    accessToken: `${user.roles[0].toLowerCase()}-e2e-access-token`,
    accessTokenExpiresAt: "2026-08-24T00:00:00Z",
    user,
  };
  await page.route("**/api/v1/auth/refresh", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
  });
  await page.route("**/api/v1/auth/login", async route => {
    expect(route.request().method()).toBe("POST");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(session),
    });
  });

  await page.goto("/login?returnTo=%2Fadmin%2Fcontact-requests");
  await page.getByLabel("Email").fill(user.email);
  await page.locator("#account-password").fill("LocalDev#Admin2026!");
  await page.locator("form button[type='submit']").click();
}

async function mockContactAdminApi(page: Page, options: { customerForbidden?: boolean } = {}) {
  await page.route("**/api/v1/contact-requests**", async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (options.customerForbidden) {
      await route.fulfill({
        status: 403,
        contentType: "application/problem+json",
        body: JSON.stringify({ title: "Forbidden", detail: "Customer is not allowed to manage contact requests." }),
      });
      return;
    }

    expect(request.headers().authorization).toMatch(/^Bearer (admin|editor)-e2e-access-token$/);
    if (request.method() === "GET" && url.pathname.endsWith(`/contact-requests/${contactId}`)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail()) });
      return;
    }

    if (request.method() === "POST" && url.pathname.endsWith(`/contact-requests/${contactId}/status`)) {
      expect(request.postDataJSON()).toEqual({ status: 2, note: "Da lien he qua E2E." });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail(2, [3, 4, 5])) });
      return;
    }

    expect(request.method()).toBe("GET");
    expect(url.searchParams.get("pageSize")).toBe("12");
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    if (search) expect(search).toBe("Duy");
    if (status) expect(status).toBe("2");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [contactListItem],
        totalCount: 25,
        page: pageNumber,
        pageSize: 12,
        totalPages: 3,
      }),
    });
  });
}

test("Admin can log in, search, filter and paginate Contact requests", async ({ page }) => {
  await mockLogin(page, admin);
  await mockContactAdminApi(page);

  await expect(page).toHaveURL(/\/admin\/contact-requests/);
  await expect(page.getByRole("heading", { name: "Yêu cầu liên hệ" })).toBeVisible();
  await expect(page.getByText("Nguyen Phuoc Duy")).toBeVisible();
  await expect(page.getByText("Trang 1 / 3")).toBeVisible();

  await page.getByLabel("Tìm kiếm yêu cầu").fill("Duy");
  await page.getByRole("button", { name: "Lọc kết quả" }).click();
  await page.getByLabel("Lọc theo trạng thái").selectOption("2");
  await expect(page.getByText("Trang 1 / 3")).toBeVisible();

  await page.getByRole("button", { name: "Sau" }).click();
  await expect(page.getByText("Trang 2 / 3")).toBeVisible();
});

test("Editor can inspect a Contact detail and update an allowed status transition", async ({ page }) => {
  await mockLogin(page, editor);
  await mockContactAdminApi(page);

  await expect(page).toHaveURL(/\/admin\/contact-requests/);
  await page.getByText("Nguyen Phuoc Duy").click();
  await expect(page.getByText("Chi tiết yêu cầu")).toBeVisible();
  await expect(page.getByText("Toi can tu van giai phap Cloud cho doanh nghiep.")).toBeVisible();

  await page.getByPlaceholder("Bắt buộc khi từ chối hoặc huỷ...").fill("Da lien he qua E2E.");
  await page.getByRole("button", { name: "Chuyển thành Đã liên hệ" }).click();
  await expect(page.getByRole("status")).toContainText("Đã cập nhật trạng thái thành “Đã liên hệ”.");
});

test("Customer is redirected away from the admin Contact route and receives API 403", async ({ page }) => {
  await mockLogin(page, customer);
  await mockContactAdminApi(page, { customerForbidden: true });
  await page.route("**/api/v1/account/orders**", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }),
    });
  });

  await page.goto("/admin/contact-requests");
  await expect(page).toHaveURL(/\/account/);

  const status = await page.evaluate(async () => {
    const response = await fetch("/api/v1/contact-requests?page=1&pageSize=12", {
      headers: { Authorization: "Bearer customer-e2e-access-token" },
    });
    return response.status;
  });
  expect(status).toBe(403);
});
