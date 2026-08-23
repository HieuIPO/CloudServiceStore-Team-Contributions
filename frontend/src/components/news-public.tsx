/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { NewsArticle, NewsCategory, PagedResult } from "@/lib/api";
import { getNewsHref, type PublicNewsQuery } from "@/lib/news-server";
import { resolveNewsThumbnail } from "@/lib/news-thumbnail";
import { NewsIcon, NewsNewsletterArt } from "@/components/news-art";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "24/05/2024";
const readingTime = (index: number) => `${index % 3 === 0 ? 6 : index % 3 === 1 ? 5 : 7} phút đọc`;

type NewsPublicProps = { articles: PagedResult<NewsArticle>; categories: NewsCategory[]; query: PublicNewsQuery };

export function NewsPublic({ articles, categories, query }: NewsPublicProps) {
  const hasFeaturedLayout = !query.search && !query.categoryId && articles.page === 1;
  const featured = hasFeaturedLayout ? articles.items.find(article => article.isFeatured) ?? null : null;
  const cards = featured ? articles.items.filter(article => article.id !== featured.id) : articles.items;

  return <main className="news-page bg-[#fbfdff] text-[#10245a]">
    <PublicPageBanner
      networkClassName="bg-[url('/assets/page-heroes/news-hero.png')] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center"
      breadcrumb="Tin tức"
      description="Cập nhật kiến thức, hướng dẫn kỹ thuật và thông tin mới nhất từ CloudServiceStore."
      extra={<form action="/news" className="relative z-10 flex max-w-3xl gap-2 rounded-xl border border-blue-100 bg-white/95 p-3 shadow-sm" method="get" role="search"><label className="relative min-w-0 flex-1"><span className="sr-only">Tìm kiếm bài viết</span><input aria-label="Tìm kiếm bài viết" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" defaultValue={query.search} name="search" placeholder="Tìm kiếm bài viết..." /><NewsIcon className="pointer-events-none absolute right-4 top-3 h-5 w-5 text-slate-500" name="search" /></label>{query.categoryId && <input name="categoryId" type="hidden" value={query.categoryId} />}{query.preview && <input name="preview" type="hidden" value="sample" />}<button className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-7 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" type="submit">Tìm kiếm</button></form>}
      title={<>Tin tức &amp; kiến thức Cloud</>}
    />

    <ScrollReveal delay={80}><section className="shell py-5 sm:py-6"><div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Phân loại bài viết"><CategoryLink active={!query.categoryId} href={getNewsHref({ search: query.search, preview: query.preview })} label="Tất cả" />{categories.slice(0, 5).map(category => <CategoryLink active={query.categoryId === category.id} href={getNewsHref({ categoryId: category.id, search: query.search, preview: query.preview })} key={category.id} label={category.name} />)}</div></section></ScrollReveal>

    {featured && <ScrollReveal delay={120}><section className="shell pb-8 sm:pb-10" aria-labelledby="featured-news-title"><article className="news-featured-card group overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4 lg:grid lg:grid-cols-[.95fr_1.05fr] lg:gap-7 lg:p-4"><ArticleImage alt="" fallbackIndex={0} src={featured.thumbnailUrl} className="aspect-[16/10] rounded-lg lg:aspect-auto lg:min-h-[17rem]" /><div className="flex flex-col justify-center px-2 py-5 sm:px-4 lg:py-4"><span className="w-fit rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">{featured.categoryName}</span><h2 className="mt-4 text-2xl font-black leading-tight tracking-[-.035em] sm:text-3xl" id="featured-news-title">{featured.title}</h2><p className="mt-4 text-sm leading-6 text-slate-600">{featured.excerpt}</p><ArticleMeta article={featured} index={0} /><Link className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={`/news/${featured.slug}`}>Đọc bài viết <NewsIcon name="arrow" /></Link></div></article></section></ScrollReveal>}

    <ScrollReveal delay={100}><section className="shell pb-8 sm:pb-10" aria-labelledby="latest-news-title"><h2 className="text-2xl font-black tracking-[-.03em] sm:text-3xl" id="latest-news-title">Bài viết mới nhất</h2>{cards.length ? <div className="news-article-grid mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map((article, index) => <ScrollReveal delay={(index % 3) * 55} key={article.id}><NewsCard article={article} index={index + (featured ? 1 : 0)} /></ScrollReveal>)}</div> : <div className="mt-5 rounded-xl border border-blue-100 bg-white p-10 text-center"><h3 className="font-black">Chưa có bài viết phù hợp</h3><p className="mt-2 text-sm text-slate-500">Thử từ khóa hoặc danh mục khác.</p></div>}<Pagination query={query} result={articles} /></section></ScrollReveal>

    <ScrollReveal delay={80}><section className="shell pb-8 sm:pb-10"><div className="news-newsletter relative overflow-hidden rounded-xl border border-blue-100 bg-[linear-gradient(100deg,#edf7ff_0%,#e5f2ff_70%,#f5faff_100%)] px-5 py-7 sm:px-8 lg:min-h-[10rem] lg:py-8"><div className="relative z-10 max-w-xl"><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Đừng bỏ lỡ thông tin mới</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Đăng ký nhận bản tin để cập nhật các bài viết hữu ích, hướng dẫn kỹ thuật và khuyến mãi mới nhất từ CloudServiceStore.</p><div className="mt-5 flex max-w-[33rem] flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1"><span className="sr-only">Email nhận tin</span><input className="h-11 w-full rounded-lg border border-blue-100 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Nhập email nhận tin" type="email" /></label><button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700" type="button">Đăng ký nhận tin</button></div></div><div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[42%] md:block"><NewsNewsletterArt /></div></div></section></ScrollReveal>
  </main>;
}

function CategoryLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return <Link aria-selected={active} className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-7 text-sm ${active ? "bg-blue-600 font-black text-white" : "border border-slate-100 bg-white font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"}`} href={href} role="tab">{label}</Link>;
}

function ArticleImage({ alt, className, fallbackIndex = 0, src }: { alt: string; className: string; fallbackIndex?: number; src?: string }) {
  return <div className={`news-article-image relative overflow-hidden bg-[linear-gradient(135deg,#071b46,#0959b5,#63c8ff)] ${className}`}><img alt={alt} className="h-full w-full object-cover brightness-[.68] contrast-[1.08] saturate-[1.25] transition duration-700 ease-out group-hover:scale-[1.04]" src={resolveNewsThumbnail(src, fallbackIndex)} /></div>;
}

function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  return <article className="news-article-card group flex min-h-[25rem] flex-col overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><ArticleImage alt="" fallbackIndex={index} className="aspect-[16/8]" src={article.thumbnailUrl} /><div className="flex flex-1 flex-col p-4 sm:p-5"><span className="w-fit rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600">{article.categoryName}</span><h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug tracking-[-.02em] group-hover:text-blue-700">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p><ArticleMeta article={article} index={index} /><Link className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-black text-blue-600 hover:text-blue-800" href={`/news/${article.slug}`}>Xem chi tiết <NewsIcon name="arrow" /></Link></div></article>;
}

function ArticleMeta({ article, index }: { article: NewsArticle; index: number }) {
  return <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><NewsIcon className="h-3.5 w-3.5" name="author" />CloudServiceStore</span><time className="inline-flex items-center gap-1.5" dateTime={article.publishedAt}><NewsIcon className="h-3.5 w-3.5" name="calendar" />{formatDate(article.publishedAt)}</time><span className="inline-flex items-center gap-1.5"><NewsIcon className="h-3.5 w-3.5" name="clock" />{readingTime(index)}</span></div>;
}

function Pagination({ query, result }: { query: PublicNewsQuery; result: PagedResult<NewsArticle> }) {
  if (result.totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(result.totalPages, 5) }, (_, index) => index + 1);
  const hrefFor = (page: number) => getNewsHref({ categoryId: query.categoryId, page, preview: query.preview, search: query.search });
  return <nav aria-label="Phân trang bài viết" className="mt-8 flex flex-wrap items-center justify-center gap-2"><PaginationLink disabled={result.page === 1} href={hrefFor(result.page - 1)} label="← Trước" /><div className="flex gap-2">{pages.map(page => <Link aria-current={page === result.page ? "page" : undefined} className={page === result.page ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white" : "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"} href={hrefFor(page)} key={page}>{page}</Link>)}</div><PaginationLink disabled={result.page === result.totalPages} href={hrefFor(result.page + 1)} label="Tiếp theo →" /></nav>;
}

function PaginationLink({ disabled, href, label }: { disabled: boolean; href: string; label: string }) {
  return disabled ? <span aria-disabled="true" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-400">{label}</span> : <Link className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700" href={href}>{label}</Link>;
}
