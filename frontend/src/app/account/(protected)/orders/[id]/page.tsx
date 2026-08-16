import type { Metadata } from "next";
import { AccountOrderDetailClient } from "@/components/account/account-order-detail-client";

export const metadata: Metadata = { title: "Chi tiết yêu cầu" };

export default function AccountOrderDetailPage() {
  return <AccountOrderDetailClient />;
}
