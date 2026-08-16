"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { clearAccessToken, getCurrentUser, setCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";
import { authApi, refreshSession } from "@/lib/api";

export type AccountSessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AccountSessionContextValue = {
  user: AuthenticatedUser | null;
  status: AccountSessionStatus;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (value: AuthenticatedUser) => void;
};

const AccountSessionContext = createContext<AccountSessionContextValue>({
  user: null,
  status: "loading",
  logout: async () => undefined,
  refresh: async () => undefined,
  updateUser: () => undefined,
});

export const useAccountSession = () => useContext(AccountSessionContext);

export function AccountSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<AccountSessionStatus>("loading");

  const verifySession = useCallback(async (subscribed = true) => {
    const existing = getCurrentUser();
    if (existing) {
      if (subscribed) {
        setUser(existing);
        setStatus("authenticated");
      }
      return;
    }

    try {
      const refreshed = await refreshSession();
      if (!subscribed) return;
      if (refreshed) {
        setUser(refreshed);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    } catch {
      if (subscribed) setStatus("error");
    }
  }, []);

  useEffect(() => {
    let subscribed = true;
    const timer = window.setTimeout(() => void verifySession(subscribed), 0);
    return () => {
      subscribed = false;
      window.clearTimeout(timer);
    };
  }, [verifySession]);

  useEffect(() => {
    if (status === "loading" || status === "error") return;
    if (status === "unauthenticated") {
      router.replace(`/account/login?returnTo=${encodeURIComponent(pathname || "/account")}`);
      return;
    }
    if (status === "authenticated" && user && !user.roles.includes("Customer")) {
      router.replace("/login");
    }
  }, [pathname, router, status, user]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      clearAccessToken();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      router.replace("/account/login");
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
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600" role="status"><IconLoader2 className="mr-2 animate-spin" size={22} />Đang mở tài khoản...</div>;
  }

  if (status === "error") {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-black text-[#10245a]">Không thể xác thực phiên</h1><p className="mt-2 text-sm leading-6 text-slate-600">Vui lòng kiểm tra kết nối rồi thử lại.</p><button className="mt-5 min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700" onClick={() => void refresh()} type="button">Thử lại</button></section></main>;
  }

  if (status === "unauthenticated" || (user && !user.roles.includes("Customer"))) return null;

  return <AccountSessionContext.Provider value={{ user, status, logout, refresh, updateUser }}>{children}</AccountSessionContext.Provider>;
}
