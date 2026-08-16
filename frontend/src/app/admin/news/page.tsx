import type { Metadata } from "next";
import { AdminNewsClient } from "@/components/admin-news-client";

export const metadata: Metadata = { title: "Quản lý tin tức" };

export default function AdminNewsPage() {
  return <AdminNewsClient />;
}
