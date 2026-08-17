import type { Metadata } from "next";
import { AdminAuditLogsClient } from "@/components/admin-audit-logs-client";

export const metadata: Metadata = { title: "Nhật ký hệ thống" };

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsClient />;
}
