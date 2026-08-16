import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export const metadata: Metadata = { title: "Dashboard vận hành" };

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
