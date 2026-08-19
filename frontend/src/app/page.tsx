import type { Metadata } from "next";
import { PublicLanding } from "@/components/public-landing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLandingHomeData } from "@/lib/landing-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Hạ tầng Cloud cho doanh nghiệp",
  description: "VPS, Hosting, bảo mật và hạ tầng Cloud minh bạch cho doanh nghiệp.",
};

export default async function Home() {
  const data = await getLandingHomeData();
  return <><SiteHeader overlay /><PublicLanding data={data} /><SiteFooter /></>;
}
