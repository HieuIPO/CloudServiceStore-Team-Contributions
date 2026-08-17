"use client";

import { AccountProfileCard } from "@/components/account/account-profile-card";
import { useAdminSession } from "@/components/admin/admin-session-provider";

export function AdminProfileClient() {
  const { user, updateUser } = useAdminSession();

  if (!user) return null;

  return <div className="admin-profile-page">
    <header className="mb-5 border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Tài khoản quản trị</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Thông tin cá nhân</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Quản lý tên hiển thị và URL avatar dùng trong khu vực Admin/Editor.</p>
    </header>
    <AccountProfileCard onSaved={updateUser} user={user} />
  </div>;
}
