import type { Metadata } from "next";
import { NewsDetailClient } from "@/components/news-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Tin tức & kiến thức Cloud" };

export default async function NewsDetailPage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  return <><SiteHeader activeHref="/news" /><NewsDetailClient slug={slug} /><SiteFooter /></>;
}
