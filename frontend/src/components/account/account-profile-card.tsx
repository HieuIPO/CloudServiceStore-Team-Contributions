"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type FormEvent } from "react";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { ApiError, authApi } from "@/lib/api";
import type { AuthenticatedUser } from "@/lib/auth-store";

type AccountProfileCardProps = {
  user: AuthenticatedUser;
  onSaved: (user: AuthenticatedUser) => void;
};

export function AccountProfileCard({ user, onSaved }: AccountProfileCardProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [avatarError, setAvatarError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initials = getInitials(fullName || user.fullName);
  const previewUrl = avatarUrl.trim();

  useEffect(() => {
    if (!success && !error) return;
    const timer = window.setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await authApi.updateProfile(trimmedName, previewUrl || null);
      onSaved(updatedUser);
      setFullName(updatedUser.fullName);
      setAvatarUrl(updatedUser.avatarUrl ?? "");
      setAvatarError(false);
      setSuccess("Đã cập nhật thông tin cá nhân.");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const notice = error ?? success;
  const noticeIsError = Boolean(error);

  return <>
    {notice && <AccountToast isError={noticeIsError} message={notice} onClose={() => { setError(null); setSuccess(null); }} />}
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="account-profile-heading">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Hồ sơ tài khoản</p>
        <h2 className="mt-2 text-xl font-black tracking-[-.02em] text-[#10245a]" id="account-profile-heading">Thông tin cá nhân</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Cập nhật tên hiển thị và ảnh đại diện để sử dụng nhất quán trong tài khoản của bạn.</p>
      </div>
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-lg font-black text-white ring-4 ring-blue-50" aria-label={`Ảnh đại diện của ${user.fullName}`}>
        {previewUrl && !avatarError ? <img alt="Ảnh đại diện" className="h-full w-full object-cover" onError={() => setAvatarError(true)} onLoad={() => setAvatarError(false)} src={previewUrl} /> : initials}
      </div>
    </div>

    <form className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="field-label">Họ và tên *</span><input autoComplete="name" className="field mt-2 min-h-11 w-full" maxLength={160} onChange={event => setFullName(event.target.value)} required value={fullName} /></label>
        <label className="block sm:col-span-2"><span className="field-label">Email tài khoản</span><input className="field mt-2 min-h-11 w-full bg-slate-50 text-slate-500" readOnly value={user.email} /></label>
        <label className="block sm:col-span-2"><span className="field-label">URL avatar <span className="font-normal text-slate-400">(không bắt buộc)</span></span><input autoComplete="url" className="field mt-2 min-h-11 w-full" inputMode="url" onChange={event => { setAvatarUrl(event.target.value); setAvatarError(false); }} placeholder="https://example.com/avatar.jpg" type="url" value={avatarUrl} /><span className="mt-1 block text-xs leading-5 text-slate-500">Dùng liên kết ảnh công khai bắt đầu bằng http:// hoặc https://.</span></label>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
        <h3 className="text-sm font-black text-[#10245a]">Thông tin tài khoản</h3>
        <dl className="mt-4 grid gap-4 text-sm">
          <ProfileDetail label="Loại tài khoản" value={getRoleLabel(user.roles)} />
          <ProfileDetail label="Ngày tạo" value={formatProfileDate(user.createdAt)} />
          <ProfileDetail label="Đăng nhập gần nhất" value={formatProfileDate(user.lastLoginAt)} />
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2">
        <div className="flex justify-end"><button className="min-h-11 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Lưu thông tin"}</button></div>
      </div>
    </form>
    </section>
  </>;
}

function AccountToast({ isError, message, onClose }: { isError: boolean; message: string; onClose: () => void }) {
  return <div aria-live={isError ? "assertive" : "polite"} className={`account-toast fixed right-4 top-4 z-[70] grid w-[min(26rem,calc(100vw-2rem))] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border p-3.5 shadow-[0_12px_28px_rgba(15,23,42,.14)] ${isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={isError ? "alert" : "status"}>
    <span className={`grid h-9 w-9 place-items-center rounded-full ${isError ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}><span aria-hidden="true">{isError ? <IconAlertCircle size={20} /> : <IconCheck size={20} />}</span></span>
    <span className="min-w-0"><strong className="block text-xs font-black">{isError ? "Thao tác không thành công" : "Cập nhật thành công"}</strong><span className={`mt-0.5 block break-words text-[13px] leading-5 ${isError ? "text-rose-700" : "text-emerald-700"}`}>{message}</span></span>
    <button aria-label="Đóng thông báo" className={`grid h-9 w-9 place-items-center rounded-lg transition ${isError ? "text-rose-600 hover:bg-rose-100" : "text-emerald-600 hover:bg-emerald-100"}`} onClick={onClose} type="button"><IconX aria-hidden="true" size={19} /></button>
    <span aria-hidden="true" className={`account-toast-progress absolute inset-x-0 bottom-0 h-0.5 ${isError ? "bg-rose-500" : "bg-emerald-500"}`} />
  </div>;
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 font-bold text-[#10245a]">{value}</dd></div>;
}

function formatProfileDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getRoleLabel(roles: string[]) {
  if (roles.includes("Customer")) return "Khách hàng";
  return roles.length > 0 ? roles.join(", ") : "—";
}

function getInitials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0].slice(0, 1)}${words[words.length - 1].slice(0, 1)}`.toUpperCase();
}
