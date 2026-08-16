import type { Metadata } from "next";
import { AffiliatePublicClient } from "@/components/affiliate-public-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAffiliateProgram } from "@/lib/affiliate-server";

export const metadata: Metadata = { title: "Đối tác Affiliate Cloud", description: "Chính sách hoa hồng và đăng ký trở thành đối tác CloudServiceStore." };
export const dynamic = "force-dynamic";

export default async function AffiliatePage({ searchParams }: PageProps<"/affiliate">) {
  const params = await searchParams;
  const useSamplePreview = params.preview === "sample";
  const program = await getAffiliateProgram(useSamplePreview);
  return <><SiteHeader activeHref="/affiliate" /><AffiliatePublicClient program={program} samplePreview={useSamplePreview} /><SiteFooter /></>;
}
