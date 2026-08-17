import type { Metadata } from "next";
import { AccountAuthForm } from "@/components/account/account-auth-form";

export const metadata: Metadata = { title: "Đăng nhập tài khoản" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  return <AccountAuthForm mode="login" returnTo={typeof params.returnTo === "string" ? params.returnTo : null} shared />;
}
