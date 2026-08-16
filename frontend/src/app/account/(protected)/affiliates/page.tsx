import type { Metadata } from "next";
import { AccountAffiliatesClient } from "@/components/account/account-affiliates-client";

export const metadata: Metadata = { title: "Hồ sơ Affiliate của tôi" };

export default function AccountAffiliatesPage() {
  return <AccountAffiliatesClient />;
}
