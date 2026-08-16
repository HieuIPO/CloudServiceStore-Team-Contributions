import type { Metadata } from "next";
import { OrderRequestClient } from "@/components/order-request-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Liên hệ / Đặt dịch vụ" };

export default async function OrderPage({ searchParams }: PageProps<"/order">) {
  const { plan, cycle, preview } = await searchParams;
  const initialBillingCycle = cycle === "12" ? 12 : 1;
  return <><SiteHeader activeHref="/order" /><OrderRequestClient initialBillingCycle={initialBillingCycle} initialPlanSlug={typeof plan === "string" ? plan : undefined} samplePreview={preview === "sample"} /><SiteFooter /></>;
}
