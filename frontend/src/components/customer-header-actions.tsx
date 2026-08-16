"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState, type FocusEvent } from "react";
import { IconChevronDown, IconLock, IconLogout, IconUser, IconUsers } from "@tabler/icons-react";
import { authApi, refreshSession } from "@/lib/api";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";
import { useAccountSession } from "@/components/account/account-session-provider";

export function CustomerHeaderActions({ mobile = false }: { mobile?: boolean }) {
  const { user: sessionUser } = useAccountSession();
  const [user, setUser] = useState<AuthenticatedUser | null>(() => getCurrentUser());
  const [loading, setLoading] = useState(() => !getCurrentUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);
  const loginClassName = mobile
    ? "mt-1 flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2.5 text-center text-base font-black text-white"
    : "inline-flex min-h-11 min-w-36 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-5 text-base font-black text-white";

  useEffect(() => {
    if (user) return;

    void refreshSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [user]);

  const displayUser = sessionUser ?? user;

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  };

  if (loading && !displayUser) return <Link className={loginClassName} href="/login">Đăng nhập</Link>;

  if (displayUser?.roles.includes("Customer")) {
    const avatarUrl = displayUser.avatarUrl?.trim();
    const accountGroupClass = mobile
      ? "relative mt-1 w-full pt-3"
      : "relative";
    const accountLinkClass = mobile
      ? "inline-flex min-h-11 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm font-black text-[#10245a] transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
      : "inline-flex min-h-11 items-center gap-2 rounded-full px-2 py-2 text-sm font-black text-[#10245a] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";
    const menuClass = mobile
      ? "static mt-2 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      : "absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_32px_rgba(16,36,90,0.14)]";
    const menuItemClass = "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";
    const logoutItemClass = "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";
    const handleAccountBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
    };

    return (
      <div className={accountGroupClass} onBlur={handleAccountBlur}>
        <button aria-expanded={menuOpen} aria-haspopup="menu" aria-label={`Mở menu tài khoản của ${displayUser.fullName}`} className={accountLinkClass} onClick={() => setMenuOpen(value => !value)} type="button">
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-[11px] font-black tracking-wide text-white ring-2 ring-blue-100">
            {avatarUrl && avatarErrorUrl !== avatarUrl ? <img alt="" className="h-full w-full object-cover" onError={() => setAvatarErrorUrl(avatarUrl)} onLoad={() => setAvatarErrorUrl(null)} src={avatarUrl} /> : getUserInitials(displayUser.fullName)}
          </span>
          {mobile && <span className="min-w-0 flex-1 truncate text-left">{displayUser.fullName}</span>}
          <IconChevronDown aria-hidden="true" className={`text-[#10245a] transition-transform ${menuOpen ? "rotate-180" : ""}`} size={15} stroke={2.2} />
        </button>

        {menuOpen && (
          <div aria-label="Tùy chọn tài khoản" className={menuClass} role="menu">
            <Link className={menuItemClass} href="/account" onClick={() => setMenuOpen(false)} role="menuitem"><IconUser aria-hidden="true" className="shrink-0 text-blue-700" size={18} stroke={2} /><span>Tài khoản của tôi</span></Link>
            <Link className={menuItemClass} href="/account/affiliates" onClick={() => setMenuOpen(false)} role="menuitem"><IconUsers aria-hidden="true" className="shrink-0 text-blue-700" size={18} stroke={2} /><span>Hồ sơ Affiliate</span></Link>
            <Link className={menuItemClass} href="/account/security" onClick={() => setMenuOpen(false)} role="menuitem"><IconLock aria-hidden="true" className="shrink-0 text-blue-700" size={18} stroke={2} /><span>Đổi mật khẩu</span></Link>
            <div aria-hidden="true" className="my-1 border-t border-slate-100" />
            <button className={logoutItemClass} onClick={() => void logout()} role="menuitem" type="button"><IconLogout aria-hidden="true" className="shrink-0 text-rose-600" size={18} stroke={2} /><span>Đăng xuất</span></button>
          </div>
        )}
      </div>
    );
  }

  if (displayUser) return <Link className={loginClassName} href="/login">Đăng nhập</Link>;

  return <Link className={loginClassName} href="/login">Đăng nhập</Link>;
}

function getUserInitials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0].slice(0, 1)}${words[words.length - 1].slice(0, 1)}`.toUpperCase();
}
