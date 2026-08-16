import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("account page keeps security and logout actions in the header menu", async () => {
  const accountPage = await readSource("../src/components/account/account-orders-client.tsx");
  const header = await readSource("../src/components/customer-header-actions.tsx");

  assert.doesNotMatch(accountPage, /href="\/account\/security"/);
  assert.doesNotMatch(accountPage, />Bảo mật</);
  assert.doesNotMatch(accountPage, /logout\(\)/);
  assert.match(header, /href="\/account\/security"/);
  assert.match(header, /Đăng xuất/);
});

test("account page exposes editable personal information and avatar persistence", async () => {
  const accountPage = await readSource("../src/components/account/account-orders-client.tsx");
  const profileCard = await readSource("../src/components/account/account-profile-card.tsx");
  const api = await readSource("../src/lib/api.ts");
  const authStore = await readSource("../src/lib/auth-store.ts");

  assert.match(accountPage, /AccountProfileCard/);
  assert.match(profileCard, /Thông tin cá nhân/);
  assert.match(profileCard, /URL avatar/);
  assert.match(profileCard, /authApi\.updateProfile/);
  assert.match(profileCard, /role=\{isError \? "alert" : "status"\}/);
  assert.match(api, /auth\/profile/);
  assert.match(authStore, /avatarUrl/);
});

test("saved avatar is reflected in the account header", async () => {
  const header = await readSource("../src/components/customer-header-actions.tsx");

  assert.match(header, /useAccountSession/);
  assert.match(header, /sessionUser/);
  assert.match(header, /displayUser\.avatarUrl/);
  assert.match(header, /alt=""/);
});

test("profile feedback uses a dismissible auto-closing toast", async () => {
  const profileCard = await readSource("../src/components/account/account-profile-card.tsx");

  assert.match(profileCard, /account-toast/);
  assert.match(profileCard, /setTimeout/);
  assert.match(profileCard, /Đóng thông báo/);
  assert.doesNotMatch(profileCard, /role="status"[^>]*className="rounded-lg/);
});
