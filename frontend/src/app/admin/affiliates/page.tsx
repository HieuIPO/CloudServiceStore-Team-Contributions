import type { Metadata } from "next";
import { AdminAffiliatesClient } from "@/components/admin-affiliates-client";

export const metadata: Metadata = { title: "Quản lý Affiliate" };

export default function AdminAffiliatesPage() {
  return <AdminAffiliatesClient />;
}
