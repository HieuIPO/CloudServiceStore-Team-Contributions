import type { Metadata } from "next";
import { NewsDetailClient } from "@/components/news-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Tin tức & kiến thức Cloud" };

export default async function NewsDetailPage({ params, searchParams }: PageProps<"/news/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <><SiteHeader activeHref="/news" /><NewsDetailClient samplePreview={query.preview === "sample"} slug={slug} /><SiteFooter /></>;
}
