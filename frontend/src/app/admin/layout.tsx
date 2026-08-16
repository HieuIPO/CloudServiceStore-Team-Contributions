import "@/app/admin/admin.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSessionProvider } from "@/components/admin/admin-session-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | CloudService Admin",
    default: "CloudService Admin Workspace",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
