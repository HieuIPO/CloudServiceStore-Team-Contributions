import { AccountSessionProvider } from "@/components/account/account-session-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ProtectedAccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountSessionProvider><SiteHeader /><div className="flex-1">{children}</div><SiteFooter /></AccountSessionProvider>;
}
