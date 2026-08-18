import type { Metadata } from "next";
import { AdminContactRequestsClient } from "@/components/admin-contact-requests-client";

export const metadata: Metadata = { title: "Yêu cầu liên hệ" };

export default function AdminContactRequestsPage() {
  return <AdminContactRequestsClient />;
}
