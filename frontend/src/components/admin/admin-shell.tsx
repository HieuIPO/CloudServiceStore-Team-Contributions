"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession } from "./admin-session-provider";
import { getNavGroupsForUser } from "./admin-nav";
import { authApi, orderApi, affiliateApi, newsApi, OrderListItem, AffiliateListItem, NewsArticle } from "@/lib/api";
import { AdminDialog } from "./admin-dialog";
import { BrandLogo } from "@/components/brand-logo";
import {
  IconSearch,
  IconBell,
  IconChevronUp,
  IconKey,
  IconExternalLink,
  IconLogout,
  IconMenu2,
  IconX,
  IconShoppingCart,
  IconUsers,
  IconNews,
  IconLoader2,
  IconWifi,
  IconWifiOff,
  IconUser,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand
} from "@tabler/icons-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, roles, logout } = useAdminSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);

  // Connection & Date State
  const [isOnline, setIsOnline] = useState(true);
  const [currentDateStr, setCurrentDateStr] = useState("");

  // Account menu trigger ref
  const menuRef = useRef<HTMLDivElement>(null);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    orders: OrderListItem[];
    affiliates: AffiliateListItem[];
    news: NewsArticle[];
  }>({ orders: [], affiliates: [], news: [] });
  const [searchOpen, setSearchOpen] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      );
    }, 0);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search (300ms) with AbortController & Escape key
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ orders: [], affiliates: [], news: [] });
        setSearchOpen(false);
        return;
      }

      setIsSearching(true);
      setSearchOpen(true);
      try {
        const q = searchQuery.trim();
        const [ordersRes, affiliatesRes, newsRes] = await Promise.allSettled([
          orderApi.all({ search: q, pageSize: 5 }, controller.signal),
          affiliateApi.all({ search: q, pageSize: 5 }, controller.signal),
          newsApi.adminArticles({ search: q, pageSize: 5 }, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setSearchResults({
          orders: ordersRes.status === "fulfilled" ? ordersRes.value.items : [],
          affiliates: affiliatesRes.status === "fulfilled" ? affiliatesRes.value.items : [],
          news: newsRes.status === "fulfilled" ? newsRes.value.items : [],
        });
      } catch {
        // Handle search errors silently without console logging
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Handle Escape key to close search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError("Mật khẩu phải có độ dài tối thiểu 12 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Mật khẩu phải chứa ít nhất 1 chữ số.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*).");
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPasswordSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        void logout();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu không thành công.";
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const navGroups = getNavGroupsForUser(roles);

  // Avatar initials (2 letters)
  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user?.fullName);
  const avatarUrl = user?.avatarUrl?.trim();

  return (
    <div className="admin-app">
      <div className="admin-shell">
        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${mobileSidebarOpen ? "open" : ""}`}>
          {/* Brand Mark */}
          <div className="admin-sidebar__brand h-14 flex items-center justify-between px-4 border-b border-slate-200">
            <Link aria-label="CloudServiceStore - Trang quản trị" href="/admin" className="admin-sidebar__brand-link min-w-0">
              <BrandLogo />
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-700"
              aria-label="Đóng menu sidebar"
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="admin-sidebar__nav flex-1 py-3 px-2 space-y-4 overflow-y-auto">
            {navGroups.map(group => (
              <div key={group.groupName} className="space-y-1">
                <div className="admin-nav-group-title px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupName}
                </div>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      title={sidebarCollapsed ? item.title : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={`admin-nav-link flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors ${
                        isActive
                          ? "bg-blue-50/80 text-blue-700 font-semibold border-l-2 border-blue-600 rounded-l-none"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={18} stroke={1.5} />
                      <span className="admin-nav-label">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Account Bottom Trigger & Menu */}
          <div className="p-2 border-t border-slate-200 relative" ref={menuRef}>
            {menuOpen && (
              <div className="admin-account-menu absolute bottom-full left-2 right-2 mb-2 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs text-slate-700">
                <button

                  onClick={() => {
                    setMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <IconKey size={16} /> Đổi mật khẩu
                </button>
                <Link
                  href="/admin/profile"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <IconUser size={16} /> Thông tin cá nhân
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <IconExternalLink size={16} /> Xem trang công khai
                </Link>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => void logout()}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-red-600 font-medium"
                >
                  <IconLogout size={16} /> Đăng xuất
                </button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="admin-account-trigger w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
              aria-label="Menu tài khoản"
              aria-expanded={menuOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div aria-label="Ảnh đại diện" className="w-8 h-8 overflow-hidden rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-blue-200">
                  {avatarUrl && avatarErrorUrl !== avatarUrl ? <img alt="Ảnh đại diện" className="h-full w-full object-cover" onError={() => setAvatarErrorUrl(avatarUrl)} onLoad={() => setAvatarErrorUrl(null)} src={avatarUrl} /> : userInitials}
                </div>
                <div className="admin-account-details min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.fullName || "User"}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {roles.join(", ") || "Role"}
                  </div>
                </div>
              </div>
              <IconChevronUp size={16} className="admin-account-chevron text-slate-400 flex-shrink-0" />
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(value => !value)}
                className="admin-sidebar__collapse-button hidden md:inline-flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                aria-expanded={!sidebarCollapsed}
                aria-label={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
              >
                {sidebarCollapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
              </button>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden text-slate-600 hover:text-slate-900 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded"
                aria-label="Mở menu mobile"
              >
                <IconMenu2 size={22} />
              </button>

              {/* Search Bar */}
              <div className="admin-global-search relative">
                <IconSearch
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm Order, Affiliate, Bài viết..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Tìm Order, Affiliate hoặc bài viết"
                  className="admin-input !pl-8 pr-3"
                />

                {/* Search Overlay */}
                {searchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 p-2 text-xs">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-4 text-slate-500 gap-2">
                        <IconLoader2 size={16} className="animate-spin" /> Đang tìm kiếm...
                      </div>
                    ) : searchResults.orders.length === 0 &&
                      searchResults.affiliates.length === 0 &&
                      searchResults.news.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">Không tìm thấy kết quả phù hợp.</div>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.orders.length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-400 px-2 py-1 flex items-center gap-1 uppercase text-[10px]">
                              <IconShoppingCart size={14} /> Yêu cầu dịch vụ ({searchResults.orders.length})
                            </div>
                            {searchResults.orders.map(o => (
                              <Link
                                key={o.id}
                                href={`/admin/orders?id=${o.id}`}
                                onClick={() => setSearchOpen(false)}
                                className="block px-2 py-1.5 hover:bg-slate-50 rounded"
                              >
                                <div className="font-medium text-slate-900">
                                  {o.customerName} - {o.planName}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {o.email} | {o.phoneNumber}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {searchResults.affiliates.length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-400 px-2 py-1 flex items-center gap-1 uppercase text-[10px]">
                              <IconUsers size={14} /> Hồ sơ Affiliate ({searchResults.affiliates.length})
                            </div>
                            {searchResults.affiliates.map(a => (
                              <Link
                                key={a.id}
                                href={`/admin/affiliates?id=${a.id}`}
                                onClick={() => setSearchOpen(false)}
                                className="block px-2 py-1.5 hover:bg-slate-50 rounded"
                              >
                                <div className="font-medium text-slate-900">{a.fullName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {a.email} | {a.phoneNumber}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {searchResults.news.length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-400 px-2 py-1 flex items-center gap-1 uppercase text-[10px]">
                              <IconNews size={14} /> Bài viết ({searchResults.news.length})
                            </div>
                            {searchResults.news.map(n => (
                              <Link
                                key={n.id}
                                href={`/admin/news/${n.id}/edit`}
                                onClick={() => setSearchOpen(false)}
                                className="block px-2 py-1.5 hover:bg-slate-50 rounded"
                              >
                                <div className="font-medium text-slate-900">{n.title}</div>
                                <div className="text-[10px] text-slate-500">{n.categoryName}</div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Topbar Right - Status & Date */}
            <div className="flex items-center gap-4 text-xs">
              <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <IconWifi size={14} /> System Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <IconWifiOff size={14} /> Offline Mode
                  </span>
                )}
              </div>

              {currentDateStr && (
                <div className="hidden md:block text-slate-400 text-[11px] font-medium border-l border-slate-200 pl-3">
                  {currentDateStr}
                </div>
              )}

              <div className="relative group">
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Thông báo"
                >
                  <IconBell size={18} stroke={1.5} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded shadow-lg p-3 hidden group-hover:block z-50 text-center text-xs text-slate-400">
                  Không có thông báo mới.
                </div>
              </div>
            </div>
          </header>

          <main className="admin-content">{children}</main>
        </div>
      </div>

      {/* Change Password Modal */}
      <AdminDialog
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Đổi mật khẩu"
        description="Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi."
        isSubmitting={passwordLoading}
      >
        {passwordError && (
          <div id="password-error-desc" role="alert" className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div role="status" className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded">
            Đổi mật khẩu thành công! Đang chuyển hướng đăng nhập...
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label htmlFor="current-password-input" className="block font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
            <input
              id="current-password-input"
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label htmlFor="new-password-input" className="block font-medium text-slate-700 mb-1">Mật khẩu mới</label>
            <input
              id="new-password-input"
              type="password"
              required
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error-desc password-policy-desc" : "password-policy-desc"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="admin-input"
            />
            <p id="password-policy-desc" className="text-[10px] text-slate-400 mt-1">
              Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$%^&*).
            </p>
          </div>
          <div>
            <label htmlFor="confirm-password-input" className="block font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              id="confirm-password-input"
              type="password"
              required
              aria-invalid={!!passwordError}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="admin-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setChangePasswordOpen(false)}
              disabled={passwordLoading}
              className="admin-button admin-button-secondary admin-button-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="admin-button admin-button-primary admin-button-sm"
            >
              {passwordLoading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </AdminDialog>
    </div>
  );
}
