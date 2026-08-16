import type { Metadata } from "next";
import { AdminProfileClient } from "@/components/admin/admin-profile-client";

export const metadata: Metadata = { title: "Thông tin cá nhân" };

export default function AdminProfilePage() {
  return <AdminProfileClient />;
}
