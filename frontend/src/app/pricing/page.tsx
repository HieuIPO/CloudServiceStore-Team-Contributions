import type { Metadata } from "next";
import { PublicPricingPage } from "@/components/public-pricing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Bảng giá dịch vụ", description: "So sánh cấu hình và bảng giá các gói dịch vụ Cloud." };

export default function PricingPage() {
  return <><SiteHeader activeHref="/pricing" /><PublicPricingPage /><SiteFooter /></>;
}
