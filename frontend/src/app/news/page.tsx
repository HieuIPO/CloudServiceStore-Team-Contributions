import type { Metadata } from "next";
import { NewsPublic } from "@/components/news-public";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Tin tức & kiến thức Cloud", description: "Kiến thức Cloud, VPS, Hosting và thông báo mới nhất." };

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const params = await searchParams;
  return <><SiteHeader activeHref="/news" /><NewsPublic samplePreview={params.preview === "sample"} /><SiteFooter /></>;
}
