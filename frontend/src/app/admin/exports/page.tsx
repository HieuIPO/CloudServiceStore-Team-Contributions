import type { Metadata } from "next";
import { AdminExportsClient } from "@/components/admin-exports-client";

export const metadata: Metadata = { title: "Báo cáo Excel" };

export default function AdminExportsPage() {
  return <AdminExportsClient />;
}
