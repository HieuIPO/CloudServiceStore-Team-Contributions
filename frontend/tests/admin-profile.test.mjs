import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = path => readFile(new URL(path, import.meta.url), "utf8");

test("Admin and Editor can open the shared personal profile page", async () => {
  const nav = await readSource("../src/components/admin/admin-nav.ts");
  const page = await readSource("../src/app/admin/profile/page.tsx");
  const shell = await readSource("../src/components/admin/admin-shell.tsx");

  assert.match(nav, /normalizedPath === "\/admin\/profile"/);
  assert.match(page, /AdminProfileClient/);
  assert.match(shell, /href="\/admin\/profile"/);
  assert.match(shell, /Thông tin cá nhân/);
});

test("Admin profile uses the persisted profile API and updates the session avatar", async () => {
  const profile = await readSource("../src/components/admin/admin-profile-client.tsx");
  const session = await readSource("../src/components/admin/admin-session-provider.tsx");
  const shell = await readSource("../src/components/admin/admin-shell.tsx");

  assert.match(profile, /AccountProfileCard/);
  assert.match(profile, /updateUser/);
  assert.match(session, /setCurrentUser/);
  assert.match(session, /updateUser/);
  assert.match(shell, /avatarUrl/);
  assert.match(shell, /Ảnh đại diện/);
});

test("personal profile stays in the account menu while the desktop sidebar can collapse", async () => {
  const nav = await readSource("../src/components/admin/admin-nav.ts");
  const shell = await readSource("../src/components/admin/admin-shell.tsx");
  const styles = await readSource("../src/app/admin/admin.css");

  assert.doesNotMatch(nav, /groupName: "Tài khoản"/);
  assert.doesNotMatch(nav, /href: "\/admin\/profile"/);
  assert.match(nav, /normalizedPath === "\/admin\/profile"/);
  assert.match(shell, /sidebarCollapsed/);
  assert.match(shell, /Thu gọn menu/);
  assert.match(shell, /Mở rộng menu/);
  assert.match(shell, /admin-sidebar.*collapsed/);
  assert.match(styles, /\.admin-sidebar\.is-collapsed/);
});
