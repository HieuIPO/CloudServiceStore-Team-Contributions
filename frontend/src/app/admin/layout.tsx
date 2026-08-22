import "@/app/admin/admin.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSessionProvider } from "@/components/admin/admin-session-provider";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | CloudService Admin",
    default: "CloudService Admin Workspace",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" aria-busy="true" />}>
      <AdminSessionProvider>
        <AdminShell>{children}</AdminShell>
      </AdminSessionProvider>
    </Suspense>
  );
}
