import type { Metadata } from "next";
import { AdminPromotionsClient } from "@/components/admin-promotions-client";

export const metadata: Metadata = { title: "Quản lý khuyến mãi & QR" };

export default function AdminPromotionsPage() {
  return <AdminPromotionsClient />;
}
