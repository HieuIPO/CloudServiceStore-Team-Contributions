"use client";

import { FormEvent, useState } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAccountSession } from "@/components/account/account-session-provider";

export function AccountSecurityClient() {
  const { logout } = useAccountSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
      window.setTimeout(() => void logout(), 900);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Không thể đổi mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="account-page bg-[#f8fbff] py-8 sm:py-10"><div className="shell"><section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><p className="text-sm font-black text-blue-600">Bảo mật tài khoản</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#10245a]">Đổi mật khẩu</h1><p className="mt-2 text-sm leading-6 text-slate-600">Sau khi đổi thành công, các phiên đăng nhập cũ sẽ bị thu hồi và bạn cần đăng nhập lại.</p>{error && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{success && <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">Đổi mật khẩu thành công. Đang chuyển tới trang đăng nhập...</p>}<form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-bold text-slate-700" htmlFor="current-password">Mật khẩu hiện tại<input className="field mt-1 min-h-11 w-full" id="current-password" onChange={event => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} /></label><label className="block text-sm font-bold text-slate-700" htmlFor="new-password">Mật khẩu mới<input className="field mt-1 min-h-11 w-full" id="new-password" minLength={12} onChange={event => setNewPassword(event.target.value)} required type="password" value={newPassword} /></label><label className="block text-sm font-bold text-slate-700" htmlFor="confirm-password">Nhập lại mật khẩu mới<input className="field mt-1 min-h-11 w-full" id="confirm-password" onChange={event => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></label><p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Mật khẩu cần có ít nhất 12 ký tự, chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</p><button className="min-h-11 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || success} type="submit">{submitting ? "Đang lưu..." : "Đổi mật khẩu"}</button></form></section></div></main>;
}
