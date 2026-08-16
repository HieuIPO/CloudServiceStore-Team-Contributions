import type { Metadata } from "next";
import { AccountSecurityClient } from "@/components/account/account-security-client";

export const metadata: Metadata = { title: "Bảo mật tài khoản" };

export default function AccountSecurityPage() {
  return <AccountSecurityClient />;
}
