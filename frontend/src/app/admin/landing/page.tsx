import type { Metadata } from "next";
import { AdminLandingClient } from "@/components/admin-landing-client";

export const metadata: Metadata = { title: "Quản lý Landing Page" };

export default function AdminLandingPage() {
  return <AdminLandingClient />;
}
