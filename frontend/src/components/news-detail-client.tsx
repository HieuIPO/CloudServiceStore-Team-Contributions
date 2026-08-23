"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { type NewsArticle, type NewsArticleDetail } from "@/lib/api";
import { sampleFeaturedArticle, sampleNewsArticles } from "@/lib/news-sample";
import { resolveNewsThumbnail } from "@/lib/news-thumbnail";
import { NewsIcon, NewsSupportArt } from "@/components/news-art";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "24/05/2024";

export function NewsDetailClient({ article, samplePreview = false }: { article: NewsArticleDetail; samplePreview?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  const related = samplePreview ? sampleNewsArticles.filter(item => item.slug !== article.slug).slice(0, 3) : [];
  const articleIndex = samplePreview ? sampleNewsArticles.findIndex(item => item.slug === article.slug) : -1;
  const previous = articleIndex > 0 ? sampleNewsArticles[articleIndex - 1] : null;
  const next = articleIndex >= 0 ? sampleNewsArticles[articleIndex + 1] : null;
  const isFeatured = samplePreview && article.slug === sampleFeaturedArticle.slug;

  return <main className="news-detail-page bg-[#fbfdff] text-[#10245a]">
    <section className="shell pb-8 pt-6 sm:pb-10 sm:pt-8">
      <div className="mt-0 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <article className="min-w-0">
          <span className="inline-flex rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">{article.categoryName}</span>
          <h1 className="news-detail-title mt-4 min-w-0 max-w-full text-3xl font-black leading-[1.13] tracking-[-.045em] sm:text-4xl lg:text-[2.35rem]">{article.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><NewsIcon name="author" />CloudServiceStore</span><time className="inline-flex items-center gap-1.5" dateTime={article.publishedAt}><NewsIcon name="calendar" />{formatDate(article.publishedAt)}</time><span className="inline-flex items-center gap-1.5"><NewsIcon name="clock" />6 phút đọc</span>{article.updatedAt && <span className="inline-flex items-center gap-1.5"><NewsIcon name="calendar" />Cập nhật: {formatDate(article.updatedAt)}</span>}</div>
          <div className="mt-5 flex flex-wrap gap-2"><ShareButton brand="f" label="Chia sẻ Facebook" /><ShareButton brand="in" label="Chia sẻ LinkedIn" /><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700" onClick={copyLink} type="button"><NewsIcon name="link" />{copied ? "Đã sao chép" : "Sao chép liên kết"}</button></div>
          <div className="mt-5 overflow-hidden rounded-xl border border-blue-100 bg-white"><img alt="" className="aspect-[2.1/1] w-full object-cover brightness-[.7] contrast-[1.1] saturate-[1.25] sm:aspect-[2.3/1]" src={resolveNewsThumbnail(article.thumbnailUrl, articleIndex)} /></div>
          {!isFeatured && <p className="mt-6 text-sm leading-7 text-slate-700">{article.excerpt}</p>}
          {isFeatured ? <FeaturedArticleBody /> : <div className="news-markdown mt-5 text-sm"><ReactMarkdown>{article.markdownContent}</ReactMarkdown></div>}
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700" href="/pricing">Xem bảng giá <NewsIcon name="arrow" /></Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-slate-600">Tags:</span>{[article.categoryName, "VPS", "Hướng dẫn"].map((tag, index) => <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-medium text-blue-700" key={`${tag}-${index}`}>{tag}</span>)}</div>
          <AuthorCard />
          <section className="mt-8" aria-labelledby="related-news-title"><h2 className="text-xl font-black" id="related-news-title">Bài viết liên quan</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{related.map(item => <RelatedCard article={item} key={item.id} />)}</div></section>
          {(previous || next) && <nav aria-label="Điều hướng bài viết" className="mt-6 grid gap-3 sm:grid-cols-2">{previous ? <ArticleDirection direction="Bài viết trước" article={previous} /> : <span />}{next && <ArticleDirection direction="Bài viết tiếp theo" article={next} align="right" />}</nav>}
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

function FeaturedArticleBody() {
  return <div className="news-markdown mt-5 text-sm"><p>Việc lựa chọn cấu hình Cloud Server phù hợp giúp doanh nghiệp tối ưu hiệu năng, đảm bảo hệ thống ổn định và tiết kiệm chi phí. Bài viết hướng dẫn cách đánh giá nhu cầu, so sánh cấu hình và lựa chọn giải pháp tối ưu nhất cho từng mô hình vận hành.</p><h2 id="why">1. Tại sao cần chọn đúng cấu hình?</h2><p>Mỗi doanh nghiệp có đặc thù hệ thống và lưu lượng truy cập khác nhau. Chọn đúng cấu hình giúp bạn:</p><ul><li>Đảm bảo hiệu năng và tốc độ xử lý ổn định.</li><li>Tránh lãng phí tài nguyên và chi phí không cần thiết.</li><li>Dễ dàng mở rộng khi hệ thống phát triển.</li><li>Tăng tính sẵn sàng và độ tin cậy cho hệ thống.</li></ul><h2 id="needs">2. Xác định nhu cầu sử dụng</h2><p>Trước khi lựa chọn cấu hình, hãy xác định rõ nhu cầu của bạn:</p><ul><li>Loại ứng dụng hoặc website cần triển khai.</li><li>Lưu lượng truy cập dự kiến theo ngày và theo tháng.</li><li>Yêu cầu về lưu trữ, tốc độ đọc ghi và sao lưu dữ liệu.</li><li>Yêu cầu về độ ổn định: SLA, backup và bảo mật.</li></ul><div className="my-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-700"><b className="text-blue-700">Lưu ý</b><br />Nên dự trù tài nguyên cao hơn nhu cầu hiện tại khoảng 20–30% để đảm bảo hệ thống hoạt động ổn định khi lượng truy cập tăng đột biến.</div><h2 id="components">3. Các thành phần cấu hình quan trọng</h2><div className="overflow-hidden rounded-xl border border-blue-100 bg-white"><div className="grid grid-cols-[5rem_1fr] border-b border-blue-50 px-3 py-3"><b>CPU</b><span>Quyết định khả năng xử lý yêu cầu từ máy chủ. CPU càng cao, hiệu năng càng mạnh.</span></div><div className="grid grid-cols-[5rem_1fr] border-b border-blue-50 px-3 py-3"><b>RAM</b><span>Ảnh hưởng đến khả năng đa nhiệm và độ ổn định khi chạy nhiều ứng dụng.</span></div><div className="grid grid-cols-[5rem_1fr] border-b border-blue-50 px-3 py-3"><b>SSD</b><span>Ổ cứng SSD NVMe giúp tăng tốc độ đọc ghi và rút ngắn thời gian truy xuất dữ liệu.</span></div><div className="grid grid-cols-[5rem_1fr] px-3 py-3"><b>Băng thông</b><span>Đảm bảo truyền tải dữ liệu nhanh và ổn định, đặc biệt quan trọng với website nhiều người truy cập.</span></div></div><h2 id="reference">4. Bảng tham khảo cấu hình</h2><ConfigurationTable /><h2 id="conclusion">5. Kết luận</h2><p>Lựa chọn Cloud Server phù hợp là yếu tố quan trọng giúp doanh nghiệp vận hành hệ thống hiệu quả, ổn định và tiết kiệm chi phí. Hãy bắt đầu từ nhu cầu thực tế và chọn cấu hình có khả năng mở rộng khi cần.</p></div>;
}

function ConfigurationTable() {
  return <div className="overflow-x-auto rounded-xl border border-blue-100"><table className="min-w-[620px] w-full border-collapse text-xs"><thead className="bg-[#f5f9ff]"><tr><th className="px-3 py-3 text-left">Nhu cầu sử dụng</th><th className="px-3 py-3">CPU</th><th className="px-3 py-3">RAM</th><th className="px-3 py-3">SSD</th><th className="px-3 py-3">Băng thông</th><th className="px-3 py-3 text-left">Phù hợp với</th></tr></thead><tbody><tr className="border-t border-blue-50"><td className="px-3 py-3">Website cá nhân / Blog</td><td className="px-3 py-3 text-center">2 vCPU</td><td className="px-3 py-3 text-center">2 GB</td><td className="px-3 py-3 text-center">40 GB</td><td className="px-3 py-3 text-center">Không giới hạn</td><td className="px-3 py-3">Website nhỏ, lượng truy cập thấp</td></tr><tr className="border-t border-blue-50"><td className="px-3 py-3">Website doanh nghiệp</td><td className="px-3 py-3 text-center">4 vCPU</td><td className="px-3 py-3 text-center">4 GB</td><td className="px-3 py-3 text-center">80 GB</td><td className="px-3 py-3 text-center">Không giới hạn</td><td className="px-3 py-3">Landing page, website công ty</td></tr><tr className="border-t border-blue-50"><td className="px-3 py-3">Hệ thống nhiều truy cập</td><td className="px-3 py-3 text-center">8 vCPU</td><td className="px-3 py-3 text-center">8 GB</td><td className="px-3 py-3 text-center">160 GB</td><td className="px-3 py-3 text-center">Không giới hạn</td><td className="px-3 py-3">TMĐT, ứng dụng lớn, app nội bộ</td></tr></tbody></table></div>;
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

function RelatedCard({ article }: { article: NewsArticle }) {
  return <Link className="group overflow-hidden rounded-xl border border-blue-100 bg-white" href={`/news/${article.slug}`}><img alt="" className="aspect-[16/8] w-full object-cover brightness-[.7] contrast-[1.1] saturate-[1.2] transition group-hover:brightness-[.8]" src={resolveNewsThumbnail(article.thumbnailUrl)} /><div className="p-3"><span className="text-[10px] font-bold text-blue-600">{article.categoryName}</span><h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 group-hover:text-blue-700">{article.title}</h3><p className="mt-2 text-[11px] text-slate-500"><NewsIcon className="mr-1 inline h-3 w-3" name="calendar" />{formatDate(article.publishedAt)} · 6 phút đọc</p></div></Link>;
}

function ArticleDirection({ align = "left", article, direction }: { align?: "left" | "right"; article: NewsArticle; direction: string }) {
  return <Link className={`group flex min-h-16 items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 ${align === "right" ? "justify-end text-right" : ""}`} href={`/news/${article.slug}`}><span className="text-xs text-blue-600">{align === "right" ? "→" : "←"}</span><span><small className="block text-[10px] font-bold text-blue-600">{direction}</small><b className="mt-1 block line-clamp-1 text-xs group-hover:text-blue-700">{article.title}</b></span></Link>;
}
