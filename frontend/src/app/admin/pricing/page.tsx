import type { Metadata } from "next";
import { AdminPricingClient } from "@/components/admin-pricing-client";

export const metadata: Metadata = { title: "Bảng giá & Lịch sử hiệu lực" };

export default function AdminPricingPage() {
  return <AdminPricingClient />;
}
