import type { Metadata } from "next";
import { AccountAffiliateDetailClient } from "@/components/account/account-affiliate-detail-client";

export const metadata: Metadata = { title: "Chi tiết hồ sơ Affiliate" };

export default function AccountAffiliateDetailPage() {
  return <AccountAffiliateDetailClient />;
}
