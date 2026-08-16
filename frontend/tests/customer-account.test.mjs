import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("shared login supports staff and customers and exposes customer registration", async () => {
  const loginPage = await readSource("../src/app/login/page.tsx");
  const accountLoginPage = await readSource("../src/app/account/login/page.tsx");
  const authForm = await readSource("../src/components/account/account-auth-form.tsx");

  assert.match(loginPage, /AccountAuthForm/);
  assert.match(accountLoginPage, /shared/);
  assert.match(authForm, /getSafeReturnToForUser/);
  assert.match(authForm, /getSafeCustomerReturnTo/);
  assert.match(authForm, /Đăng nhập tài khoản/);
  assert.doesNotMatch(authForm, /Đăng nhập để quản lý yêu cầu dịch vụ hoặc vào khu vực quản trị\./);
  assert.match(authForm, /href="\/account\/register"/);
  assert.match(authForm, /Đăng ký tài khoản khách hàng/);
  assert.match(authForm, /showPassword/);
  assert.match(authForm, /Hiện mật khẩu/);
  assert.match(authForm, /passwordRequirements/);
  assert.match(authForm, /text-green-600/);
  assert.match(authForm, /localizeAuthError/);
});

test("customer account routes expose registration, tracking, detail, and security surfaces", async () => {
  const sources = await Promise.all([
    readSource("../src/app/account/login/page.tsx"),
    readSource("../src/app/account/register/page.tsx"),
    readSource("../src/app/account/(protected)/page.tsx"),
    readSource("../src/app/account/(protected)/orders/[id]/page.tsx"),
    readSource("../src/app/account/(protected)/affiliates/page.tsx"),
    readSource("../src/app/account/(protected)/affiliates/[id]/page.tsx"),
    readSource("../src/app/account/(protected)/security/page.tsx"),
  ]);

  assert.match(sources[0], /AccountAuthForm/);
  assert.match(sources[1], /mode="register"/);
  assert.match(sources[2], /AccountOrdersClient/);
  assert.match(sources[3], /AccountOrderDetailClient/);
  assert.match(sources[4], /AccountAffiliatesClient/);
  assert.match(sources[5], /AccountAffiliateDetailClient/);
  assert.match(sources[6], /AccountSecurityClient/);
});

test("customer account API contracts are scoped and use public-safe order DTOs", async () => {
  const api = await readSource("../src/lib/api.ts");
  const controller = await readSource("../../src/CloudServiceStore.WebApi/Controllers/AccountController.cs");
  const contracts = await readSource("../../src/CloudServiceStore.Application/Orders/OrderContracts.cs");

  assert.match(api, /\/api\/v1\/account\/orders/);
  assert.match(api, /\/api\/v1\/account\/affiliates/);
  assert.match(api, /Object\.values\(body\.errors \?\? \{\}\)/);
  assert.match(controller, /Authorize\(Roles = "Customer"\)/);
  assert.match(contracts, /CustomerOrderDetailDto/);
  assert.doesNotMatch(contracts.slice(contracts.indexOf("public sealed record CustomerOrderDetailDto")), /ChangedBy/);
  assert.match(await readSource("../../src/CloudServiceStore.Application/Affiliates/AffiliateContracts.cs"), /CustomerAffiliateApplicationDetailDto/);
});

test("order submissions require a customer session and are linked to that customer", async () => {
  const orderClient = await readSource("../src/components/order-request-client.tsx");
  const ordersController = await readSource("../../src/CloudServiceStore.WebApi/Controllers/OrdersController.cs");
  const orderService = await readSource("../../src/CloudServiceStore.Application/Orders/OrderService.cs");

  assert.match(orderClient, /refreshSession/);
  assert.match(orderClient, /readOnly=\{Boolean\(customerAccount\)\}/);
  assert.match(ordersController, /Authorize\(Roles = "Customer"\)/);
  assert.doesNotMatch(ordersController, /AllowAnonymous/);
  assert.match(ordersController, /GetCustomerOwner/);
  assert.match(orderService, /AppUserId = owner\?\.UserId/);
  assert.match(orderClient, /account\/login\?returnTo=%2Forder/);
});

test("affiliate submissions require login and customer account endpoints remain scoped", async () => {
  const affiliateClient = await readSource("../src/components/affiliate-public-client.tsx");
  const affiliateController = await readSource("../../src/CloudServiceStore.WebApi/Controllers/AffiliatesController.cs");
  const accountController = await readSource("../../src/CloudServiceStore.WebApi/Controllers/AccountController.cs");
  const contracts = await readSource("../../src/CloudServiceStore.Application/Affiliates/AffiliateContracts.cs");

  assert.match(affiliateClient, /refreshSession/);
  assert.match(affiliateClient, /account\/login\?returnTo=%2Faffiliate/);
  assert.match(affiliateClient, /readOnly=\{Boolean\(customerAccount\)\}/);
  assert.match(affiliateController, /Authorize\(Roles = "Customer"\)/);
  assert.match(affiliateController, /GetCustomerOwner/);
  assert.match(accountController, /HttpGet\("affiliates"\)/);
  assert.match(contracts, /CustomerAffiliateStatusHistoryDto/);
  assert.doesNotMatch(contracts.slice(contracts.indexOf("public sealed record CustomerAffiliateApplicationDetailDto")), /ChangedBy/);
  assert.doesNotMatch(contracts.slice(contracts.indexOf("public sealed record CustomerAffiliateApplicationDetailDto")), /ReviewNote/);
});

test("customer account session and public header keep admin/customer boundaries explicit", async () => {
  const session = await readSource("../src/components/account/account-session-provider.tsx");
  const header = await readSource("../src/components/customer-header-actions.tsx");
  const adminSession = await readSource("../src/components/admin/admin-session-provider.tsx");

  assert.match(session, /roles\.includes\("Customer"\)/);
  assert.match(session, /\/account\/login/);
  assert.doesNotMatch(header, /href="\/account\/register"/);
  assert.match(header, /href="\/login"/);
  assert.match(header, /whitespace-nowrap/);
  assert.match(header, /href="\/login">Đăng nhập/);
  assert.doesNotMatch(header, /href="\/admin">Quản trị/);
  assert.match(header, /Đăng xuất/);
  assert.match(header, /getUserInitials/);
  assert.match(header, /rounded-full/);
  assert.match(header, /IconChevronDown/);
  assert.match(header, /IconUser/);
  assert.match(header, /IconUsers/);
  assert.match(header, /IconLock/);
  assert.match(header, /IconLogout/);
  assert.match(header, /aria-haspopup="menu"/);
  assert.match(header, /role="menu"/);
  assert.match(header, /href="\/account\/security"/);
  assert.match(header, /href="\/account\/affiliates"/);
  assert.match(header, /setMenuOpen\(value => !value\)/);
  assert.doesNotMatch(header, /onMouseEnter/);
  assert.match(adminSession, /router\.replace\("\/account"\)/);
});
