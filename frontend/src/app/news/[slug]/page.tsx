import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDetailClient } from "@/components/news-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicNewsDetail } from "@/lib/news-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tin tức & kiến thức Cloud" };

export default async function NewsDetailPage({ params, searchParams }: PageProps<"/news/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const samplePreview = query.preview === "sample";
  const article = await getPublicNewsDetail(slug, samplePreview);
  if (!article) notFound();
  return <><SiteHeader activeHref="/news" /><NewsDetailClient article={article} samplePreview={samplePreview} /><SiteFooter /></>;
}
