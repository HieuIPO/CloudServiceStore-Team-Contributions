import type { Metadata } from "next";
import { ServicePlanDetailClient } from "@/components/service-plan-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Chi tiết gói Cloud" };

export default async function ServicePlanPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  return <><SiteHeader /><ServicePlanDetailClient slug={slug} /><SiteFooter /></>;
}
