import type { Metadata } from "next";
import { AdminNewsEditClient } from "@/components/admin-news-edit-client";

export const metadata: Metadata = { title: "Chỉnh sửa bài viết" };

export default function EditNewsArticlePage() {
  return <AdminNewsEditClient />;
}
