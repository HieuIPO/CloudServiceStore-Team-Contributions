"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { ApiError, newsApi, type NewsArticleDetail } from "@/lib/api";
import { resolveNewsThumbnail } from "@/lib/news-thumbnail";
import { NewsIcon, NewsSupportArt } from "@/components/news-art";

const liveApiEnabled = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim());
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "24/05/2024";

export function NewsDetailClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(liveApiEnabled);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!liveApiEnabled) return;
    let active = true;
    void newsApi.articleBySlug(slug)
      .then(result => { if (active) setArticle(result); })
      .catch(reason => { if (active) setError(reason instanceof ApiError ? reason.message : "Không thể tải bài viết."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  if (loading && !article) return <main className="shell py-12"><div className="mx-auto h-[36rem] max-w-5xl animate-pulse rounded-2xl bg-slate-100" /></main>;
  if (error || !article) return <main className="shell py-12"><div className="mx-auto max-w-3xl rounded-xl border border-rose-100 bg-white p-10 text-center text-rose-700" role="alert">{error ?? "Không tìm thấy bài viết."}<Link className="mt-5 inline-flex font-bold text-blue-700" href="/news">Quay lại Tin tức</Link></div></main>;

  return <main className="news-detail-page bg-[#fbfdff] text-[#10245a]">
    <section className="shell pb-8 pt-6 sm:pb-10 sm:pt-8">
      <div className="mt-0 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <article className="min-w-0">
          <span className="inline-flex rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">{article.categoryName}</span>
          <h1 className="news-detail-title mt-4 min-w-0 max-w-full text-3xl font-black leading-[1.13] tracking-[-.045em] sm:text-4xl lg:text-[2.35rem]">{article.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><NewsIcon name="author" />CloudServiceStore</span><time className="inline-flex items-center gap-1.5" dateTime={article.publishedAt}><NewsIcon name="calendar" />{formatDate(article.publishedAt)}</time><span className="inline-flex items-center gap-1.5"><NewsIcon name="clock" />6 phút đọc</span>{article.updatedAt && <span className="inline-flex items-center gap-1.5"><NewsIcon name="calendar" />Cập nhật: {formatDate(article.updatedAt)}</span>}</div>
          <div className="mt-5 flex flex-wrap gap-2"><ShareButton brand="f" label="Chia sẻ Facebook" /><ShareButton brand="in" label="Chia sẻ LinkedIn" /><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700" onClick={copyLink} type="button"><NewsIcon name="link" />{copied ? "Đã sao chép" : "Sao chép liên kết"}</button></div>
          <div className="mt-5 overflow-hidden rounded-xl border border-blue-100 bg-white"><img alt="" className="aspect-[2.1/1] w-full object-cover brightness-[.7] contrast-[1.1] saturate-[1.25] sm:aspect-[2.3/1]" src={resolveNewsThumbnail(article.thumbnailUrl)} /></div>
          <p className="mt-6 text-sm leading-7 text-slate-700">{article.excerpt}</p>
          <div className="news-markdown mt-5 text-sm"><ReactMarkdown>{article.markdownContent}</ReactMarkdown></div>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700" href="/pricing">Xem bảng giá <NewsIcon name="arrow" /></Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-slate-600">Tags:</span>{[article.categoryName, "VPS", "Hướng dẫn"].map((tag, index) => <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-medium text-blue-700" key={`${tag}-${index}`}>{tag}</span>)}</div>
          <AuthorCard />
        </article>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <div className="rounded-xl border border-blue-100 bg-white p-5"><h2 className="text-sm font-black">Nội dung bài viết</h2><ol className="mt-4 space-y-3 text-xs text-slate-600"><TocItem href="#why" label="Tại sao cần chọn đúng cấu hình?" number="1" /><TocItem href="#needs" label="Xác định nhu cầu sử dụng" number="2" /><TocItem href="#components" label="Các thành phần cấu hình quan trọng" number="3" /><TocItem href="#reference" label="Bảng tham khảo cấu hình" number="4" /><TocItem href="#conclusion" label="Kết luận" number="5" /></ol></div>
          <div className="rounded-xl border border-blue-100 bg-[linear-gradient(155deg,#edf7ff,#fff)] p-5"><h2 className="text-sm font-black text-blue-700">Cần hỗ trợ lựa chọn cấu hình?</h2><p className="mt-3 text-xs leading-5 text-slate-600">Đội ngũ kỹ thuật của chúng tôi luôn sẵn sàng tư vấn giải pháp phù hợp nhất cho doanh nghiệp của bạn.</p><Link className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-400 bg-white px-3 text-xs font-bold text-blue-700" href="/order"><NewsIcon name="headset" />Liên hệ tư vấn</Link><div className="mt-5 space-y-4 border-t border-blue-100 pt-5 text-xs"><SmallSupport icon="headset" title="Hỗ trợ 24/7" text="Kỹ thuật viên luôn sẵn sàng" /><SmallSupport icon="arrow" title="Tư vấn miễn phí" text="Đề xuất giải pháp tối ưu" /><SmallSupport icon="cloud" title="Triển khai nhanh" text="Kích hoạt chỉ trong vài phút" /></div></div>
        </aside>
      </div>
    </section>
    <section className="shell pb-8 sm:pb-10"><div className="relative overflow-hidden rounded-xl border border-blue-100 bg-[linear-gradient(100deg,#edf7ff,#e4f1ff)] px-5 py-6 sm:px-8"><div className="relative z-10 max-w-xl"><h2 className="text-2xl font-black tracking-[-.03em] sm:text-3xl">Cần tư vấn giải pháp Cloud?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Chúng tôi sẵn sàng đồng hành cùng doanh nghiệp của bạn với giải pháp tối ưu và chi phí hợp lý.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white" href="/order">Liên hệ tư vấn <NewsIcon name="headset" /></Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-400 bg-white px-5 text-sm font-black text-blue-700" href="/services">Xem dịch vụ <NewsIcon name="arrow" /></Link></div></div><div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[40%] md:block"><NewsSupportArt /></div></div></section>
  </main>;
}
function ShareButton({ brand, label }: { brand: string; label: string }) {
  return <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1264d8] px-4 text-xs font-bold text-white transition hover:bg-blue-700" type="button"><span className="font-black">{brand}</span>{label}</button>;
}

function TocItem({ href, label, number }: { href: string; label: string; number: string }) {
  return <li><a className="flex items-start gap-2 transition hover:text-blue-700" href={href}><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">{number}</span><span>{label}</span></a></li>;
}

function SmallSupport({ icon, text, title }: { icon: "arrow" | "cloud" | "headset"; text: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="text-blue-600"><NewsIcon name={icon} /></span><div><b className="block">{title}</b><span className="text-slate-500">{text}</span></div></div>;
}

function AuthorCard() {
  return <div className="mt-7 flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4 sm:flex-row sm:items-center"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><NewsIcon className="h-7 w-7" name="cloud" /></span><div className="min-w-0 flex-1"><b className="block text-sm">CloudServiceStore – Biên tập viên</b><p className="mt-1 text-xs leading-5 text-slate-600">Đội ngũ biên tập và kỹ thuật chia sẻ kiến thức, kinh nghiệm triển khai và tối ưu hệ thống Cloud cho doanh nghiệp.</p></div><div className="flex gap-2 text-blue-600"><span className="grid h-8 w-8 place-items-center rounded border border-blue-100"><NewsIcon name="cloud" /></span><span className="grid h-8 w-8 place-items-center rounded border border-blue-100"><NewsIcon name="link" /></span><span className="grid h-8 w-8 place-items-center rounded border border-blue-100"><NewsIcon name="mail" /></span></div></div>;
}
