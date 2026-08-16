import type { Metadata } from "next";
import { AdminNewsNewClient } from "@/components/admin-news-new-client";

export const metadata: Metadata = { title: "Soạn bài viết mới" };

export default function NewNewsArticlePage() {
  return <AdminNewsNewClient />;
}
