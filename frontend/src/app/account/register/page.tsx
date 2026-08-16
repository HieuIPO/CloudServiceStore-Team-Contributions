import type { Metadata } from "next";
import { AccountAuthForm } from "@/components/account/account-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Đăng ký khách hàng" };

export default function AccountRegisterPage() {
  return <><SiteHeader /><AccountAuthForm mode="register" /><SiteFooter /></>;
}
