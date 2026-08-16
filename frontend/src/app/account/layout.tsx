import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tài khoản khách hàng" };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
