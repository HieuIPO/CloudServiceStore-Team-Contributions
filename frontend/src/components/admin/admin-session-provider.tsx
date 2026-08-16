"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, clearAccessToken, setCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";
import { refreshSession, authApi } from "@/lib/api";
import { isRouteAllowed } from "./admin-nav";
import { getSafeReturnTo } from "@/lib/url-validation";
import { IconLoader2, IconAlertTriangle } from "@tabler/icons-react";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AdminSessionContextType = {
  user: AuthenticatedUser | null;
  roles: string[];
  status: SessionStatus;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (value: AuthenticatedUser) => void;
};

const AdminSessionContext = createContext<AdminSessionContextType>({
  user: null,
  roles: [],
  status: "loading",
  logout: async () => {},
  refresh: async () => {},
  updateUser: () => {}
});

export const useAdminSession = () => useContext(AdminSessionContext);

// isSafeAdminReturnTo and getSafeReturnTo are imported from @/lib/url-validation
// Re-export for backward compatibility
export { isSafeAdminReturnTo, getSafeReturnTo } from "@/lib/url-validation";

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const guardedPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const verifySession = useCallback(async (isSubscribed = true) => {
    const existing = getCurrentUser();
    if (existing) {
      if (isSubscribed) {
        setUser(existing);
        setStatus("authenticated");
      }
      return;
    }

    try {
      // refreshSession has its own 10s internal timeout + dedup
      const refreshed = await refreshSession();
      if (!isSubscribed) return;

      if (refreshed) {
        setUser(refreshed);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    } catch {
      if (isSubscribed) {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const timer = setTimeout(() => {
      void verifySession(isSubscribed);
    }, 0);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [verifySession]);

  // Route Guard and Redirects
  useEffect(() => {
    if (status === "loading" || status === "error") return;

    if (status === "unauthenticated") {
      const safePath = getSafeReturnTo(pathname);
      router.replace(`/login?returnTo=${encodeURIComponent(safePath)}`);
      return;
    }

    if (status === "authenticated" && user) {
      const userRoles = user.roles || [];

      if (!userRoles.includes("Admin") && !userRoles.includes("Editor")) {
        router.replace("/account");
        return;
      }

      // Root /admin redirect
      if (pathname === "/admin" || pathname === "/admin/") {
        if (userRoles.includes("Admin")) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/admin/workspace");
        }
        return;
      }

      // Check role authorization for specific sub-routes
      if (!isRouteAllowed(guardedPath, userRoles)) {
        if (userRoles.includes("Editor")) {
          router.replace("/admin/workspace");
        } else {
          router.replace("/admin/dashboard");
        }
      }
    }
  }, [status, user, pathname, guardedPath, router]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAccessToken();
      setUser(null);
      setStatus("unauthenticated");
      router.replace("/login");
    }
  };

  const refresh = async () => {
    setStatus("loading");
    await verifySession(true);
  };

  const updateUser = (value: AuthenticatedUser) => {
    setCurrentUser(value);
    setUser(value);
    setStatus("authenticated");
  };

  if (status === "loading") {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-3 z-50 text-slate-600">
        <IconLoader2 size={32} className="animate-spin text-slate-800" />
        <span className="text-xs font-semibold tracking-wide">Đang xác thực phiên làm việc...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 z-50 text-slate-700">
        <div className="bg-white border border-slate-200 shadow-md rounded-lg p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <IconAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Không thể kết nối máy chủ phiên</h3>
            <p className="text-xs text-slate-500 mt-1">Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ đang phản hồi quá chậm.</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => void refresh()}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              Thử lại
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition-colors min-h-[44px]"
            >
              Về đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AdminSessionContext.Provider value={{ user, roles: user?.roles || [], status, logout, refresh, updateUser }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
