"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { newsApi, type NewsArticle, type NewsCategory } from "@/lib/api";
import { resolveNewsThumbnail } from "@/lib/news-thumbnail";
import { NewsIcon, NewsNewsletterArt } from "@/components/news-art";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";

const pageSize = 9;
const liveApiEnabled = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim());

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "24/05/2024";
const readingTime = (index: number) => `${index % 3 === 0 ? 6 : index % 3 === 1 ? 5 : 7} phút đọc`;
const normalizeNewsSearchText = (value: string) => value
  .normalize("NFC")
  .toLocaleLowerCase("vi")
  .replace(/[ăâ]/g, "a")
  .replace(/ê/g, "e")
  .replace(/[ôơ]/g, "o")
  .replace(/ư/g, "u")
  .replace(/đ/g, "d")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

export function NewsPublic() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(liveApiEnabled);

  useEffect(() => {
    if (!liveApiEnabled) return;
    let active = true;
    void Promise.all([newsApi.publicCategories(), newsApi.publicArticles({ page: 1, pageSize: 100 })])
      .then(([categoryResult, articleResult]) => {
        if (!active) return;
        setCategories(categoryResult.items);
        setArticles(articleResult.items);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredArticles = useMemo(() => {
    const keyword = normalizeNewsSearchText(search.trim());
    return articles.filter(article => {
      const matchesCategory = !categoryId || article.categoryId === categoryId;
      const searchable = normalizeNewsSearchText(`${article.title} ${article.excerpt} ${article.categoryName}`);
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [articles, categoryId, search]);

  const hasFeaturedLayout = !search.trim() && !categoryId;
  const selectedFeatured = articles.find(article => article.isFeatured);
  const featuredCandidate = hasFeaturedLayout
    ? (selectedFeatured ?? filteredArticles[0] ?? null)
    : null;
  const cardArticles = hasFeaturedLayout && featuredCandidate
    ? filteredArticles.filter(article => article.id !== featuredCandidate.id)
    : filteredArticles;
  const totalPages = Math.max(1, Math.ceil(cardArticles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const showingFeatured = currentPage === 1 && hasFeaturedLayout;
  const featured = showingFeatured ? featuredCandidate : null;
  const cards = cardArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
  };

  return <main className="news-page bg-[#fbfdff] text-[#10245a]" aria-busy={loading}>
    <PublicPageBanner
      networkClassName="bg-[url('/assets/page-heroes/news-hero.png')] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center"
      breadcrumb="Tin tức"
      description="Cập nhật kiến thức, hướng dẫn kỹ thuật và thông tin mới nhất từ CloudServiceStore."
      extra={<form className="relative z-10 flex max-w-3xl gap-2 rounded-xl border border-blue-100 bg-white/95 p-3 shadow-sm" onSubmit={submitSearch} role="search"><label className="relative min-w-0 flex-1"><span className="sr-only">Tìm kiếm bài viết</span><input aria-label="Tìm kiếm bài viết" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Tìm kiếm bài viết..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /><NewsIcon className="pointer-events-none absolute right-4 top-3 h-5 w-5 text-slate-500" name="search" /></label><button className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-7 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" type="submit">Tìm kiếm</button></form>}
      title={<>Tin tức &amp; kiến thức Cloud</>}
    />

    <ScrollReveal delay={80}><section className="shell py-5 sm:py-6">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Phân loại bài viết">
        <CategoryButton active={!categoryId} label="Tất cả" onClick={() => { setCategoryId(""); setPage(1); }} />
        {categories.slice(0, 5).map(category => <CategoryButton active={categoryId === category.id} key={category.id} label={category.name} onClick={() => { setCategoryId(category.id); setPage(1); }} />)}
      </div>
    </section></ScrollReveal>

    {featured && <ScrollReveal delay={120}><section className="shell pb-8 sm:pb-10" aria-labelledby="featured-news-title">
      <article className="news-featured-card group overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4 lg:grid lg:grid-cols-[.95fr_1.05fr] lg:gap-7 lg:p-4">
        <ArticleImage alt="" fallbackIndex={0} src={featured.thumbnailUrl} className="aspect-[16/10] rounded-lg lg:aspect-auto lg:min-h-[17rem]" />
        <div className="flex flex-col justify-center px-2 py-5 sm:px-4 lg:py-4">
          <span className="w-fit rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">{featured.categoryName}</span>
          <h2 className="mt-4 text-2xl font-black leading-tight tracking-[-.035em] sm:text-3xl" id="featured-news-title">{featured.title}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{featured.excerpt}</p>
          <ArticleMeta article={featured} index={0} />
          <Link className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={`/news/${featured.slug}`}>Đọc bài viết <NewsIcon name="arrow" /></Link>
        </div>
      </article>
    </section></ScrollReveal>}

    <ScrollReveal delay={100}><section className="shell pb-8 sm:pb-10" aria-labelledby="latest-news-title">
      <h2 className="text-2xl font-black tracking-[-.03em] sm:text-3xl" id="latest-news-title">Bài viết mới nhất</h2>
      {cards.length ? <div className="news-article-grid mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" key={`${categoryId}-${search}-${currentPage}`}>{cards.map((article, index) => <ScrollReveal delay={(index % 3) * 55} key={article.id}><NewsCard article={article} index={index + (showingFeatured ? 1 : (currentPage - 1) * pageSize)} /></ScrollReveal>)}</div> : <div className="mt-5 rounded-xl border border-blue-100 bg-white p-10 text-center"><h3 className="font-black">Chưa có bài viết phù hợp</h3><p className="mt-2 text-sm text-slate-500">Thử từ khóa hoặc danh mục khác.</p></div>}
      <Pagination currentPage={currentPage} onChange={nextPage => { setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); }} totalPages={totalPages} />
    </section></ScrollReveal>

    <ScrollReveal delay={80}><section className="shell pb-8 sm:pb-10"><div className="news-newsletter relative overflow-hidden rounded-xl border border-blue-100 bg-[linear-gradient(100deg,#edf7ff_0%,#e5f2ff_70%,#f5faff_100%)] px-5 py-7 sm:px-8 lg:min-h-[10rem] lg:py-8"><div className="relative z-10 max-w-xl"><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Đừng bỏ lỡ thông tin mới</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Đăng ký nhận bản tin để cập nhật các bài viết hữu ích, hướng dẫn kỹ thuật và khuyến mãi mới nhất từ CloudServiceStore.</p><form className="mt-5 flex max-w-[33rem] flex-col gap-2 sm:flex-row" onSubmit={event => event.preventDefault()}><label className="min-w-0 flex-1"><span className="sr-only">Email nhận bản tin</span><input className="h-11 w-full rounded-lg border border-blue-100 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Nhập email của bạn" type="email" /></label><button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700" type="submit">Đăng ký nhận tin</button></form></div><div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[42%] md:block"><NewsNewsletterArt /></div></div></section></ScrollReveal>
  </main>;
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button aria-selected={active} className={`news-category-button ${active ? "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-7 text-sm font-black text-white" : "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white px-7 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"}`} onClick={onClick} role="tab" type="button">{label}</button>;
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

function Pagination({ currentPage, onChange, totalPages }: { currentPage: number; onChange: (page: number) => void; totalPages: number }) {
  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1);
  return <nav aria-label="Phân trang bài viết" className="mt-8 flex items-center justify-center gap-2"><button aria-label="Trang trước" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)} type="button">← Trước</button>{pages.map(page => <button aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white" : "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"} key={page} onClick={() => onChange(page)} type="button">{page}</button>)}<button aria-label="Trang sau" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)} type="button">Tiếp theo →</button></nav>;
}
