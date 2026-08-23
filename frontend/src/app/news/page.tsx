import type { Metadata } from "next";
import { NewsPublic } from "@/components/news-public";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicNewsPage, getPublicNewsQuery } from "@/lib/news-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tin tức & kiến thức Cloud", description: "Kiến thức Cloud, VPS, Hosting và thông báo mới nhất." };

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const query = getPublicNewsQuery(await searchParams);
  const data = await getPublicNewsPage(query);
  return <><SiteHeader activeHref="/news" /><NewsPublic articles={data.articles} categories={data.categories} query={query} /><SiteFooter /></>;
}
