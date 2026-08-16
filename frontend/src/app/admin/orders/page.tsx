import type { Metadata } from "next";
import { AdminOrdersClient } from "@/components/admin-orders-client";

export const metadata: Metadata = { title: "Quản lý yêu cầu dịch vụ" };

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
