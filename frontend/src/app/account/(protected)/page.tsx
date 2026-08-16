import type { Metadata } from "next";
import { AccountOrdersClient } from "@/components/account/account-orders-client";

export const metadata: Metadata = { title: "Yêu cầu dịch vụ của tôi" };

export default function AccountPage() {
  return <AccountOrdersClient />;
}
