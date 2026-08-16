import type { Metadata } from "next";
import { AdminCatalogClient } from "@/components/admin-catalog-client";

export const metadata: Metadata = { title: "Quản lý Catalog" };

export default function AdminCatalogPage() {
  return <AdminCatalogClient />;
}
