import Link from "next/link";
import Image from "next/image";
import type { LandingPageContent, Promotion, ServicePlan, ServicePlanFeature, Testimonial } from "@/lib/api";
import type { LandingFeaturedPlan, LandingHomeData } from "@/lib/landing-server";
import { HeroCarousel } from "@/components/hero-carousel";

const fallbackContent: LandingPageContent = {
  id: "fallback",
  heroEyebrow: "CLOUD HẠ TẦNG CHO DOANH NGHIỆP",
  heroTitle: "Hạ tầng cloud vững vàng cho mọi chặng tăng trưởng.",
  heroDescription: "VPS, Hosting và dịch vụ bảo mật minh bạch, linh hoạt, luôn có đội ngũ kỹ thuật đồng hành.",
  primaryCtaLabel: "Khám phá dịch vụ",
  primaryCtaUrl: "/services",
  secondaryCtaLabel: "Xem bảng giá",
  secondaryCtaUrl: "/pricing",
  aboutTitle: "Hạ tầng đáng tin cậy, vận hành bởi con người tận tâm.",
  aboutMarkdown: "",
  infrastructureMarkdown: "",
  uptimeCommitment: "99,9% SLA",
  isPublished: true,
};

const money = (value?: number, currency = "VND") => value === undefined
  ? "Liên hệ"
  : new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date(value));

export function PublicLanding({ data }: { data: LandingHomeData }) {
  const content = data.landing?.content ?? fallbackContent;
  const testimonials = data.landing?.testimonials ?? [];
  const logos = data.landing?.customerLogos ?? [];
  const isTestimonialMarquee = testimonials.length > 1;
  const testimonialCopies = isTestimonialMarquee ? [0, 1] : [0];

  return (
    <main className="overflow-hidden bg-[#f7fbff] text-slate-950">
      <HeroCarousel content={content} />

      {logos.length > 0 && <section className="landing-logo-section border-b border-blue-200">
        <div className="shell py-7 sm:py-8">
          <p className="text-center text-xs font-black uppercase tracking-[.22em] text-slate-700">Được tin chọn bởi các đội ngũ đang tăng trưởng</p>
          <div aria-label="Khách hàng tiêu biểu" className="landing-logo-marquee mt-5">
            <div className="landing-logo-track flex w-max items-center">
              {[0, 1].map(copy => <div aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4" key={copy}>
                {logos.map(logo => {
                  // eslint-disable-next-line @next/next/no-img-element -- partner logo URLs are editable admin data and may use arbitrary hosts.
                  const mark = logo.logoUrl ? <img alt={logo.altText || `Logo ${logo.name}`} className="landing-logo-image" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={logo.logoUrl} /> : <span className="landing-logo-fallback">{logo.name}</span>;
                  const item = <span className="landing-logo-item" key={`${logo.id}-${copy}`}>{mark}</span>;
                  if (copy === 1 || !logo.websiteUrl) return item;
                  return <a aria-label={`Mở website ${logo.name}`} className="landing-logo-item landing-logo-item--link" href={logo.websiteUrl} key={`${logo.id}-${copy}`} rel="noreferrer" target="_blank">{mark}</a>;
                })}
              </div>)}
            </div>
          </div>
        </div>
      </section>}

      <FeaturedPlansSection plans={data.featuredPlans} />
      <PromotionsSection promotions={data.promotions} />

      <section className="shell py-20 sm:py-24" id="uptime">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-7 text-white shadow-xl shadow-blue-700/15 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-black tracking-[.2em] text-cyan-100">CAM KẾT UPTIME</p><h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Hạ tầng ổn định, luôn sẵn sàng phục vụ.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-blue-50">Một nền tảng tốt không chỉ là CPU và RAM. Đó là giám sát liên tục, SLA rõ ràng và đội ngũ thực sự chịu trách nhiệm khi bạn cần.</p><Link className="mt-7 inline-flex font-black text-white underline decoration-cyan-200 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700" href="/about">Tìm hiểu về hạ tầng <Arrow /></Link></div>
            <div className="grid gap-4 sm:grid-cols-3"><UptimeMetric value={content.uptimeCommitment} label="Cam kết SLA"/><UptimeMetric value="24/7" label="Giám sát hệ thống"/><UptimeMetric value="< 15m" label="Phản hồi sự cố"/><div className="rounded-3xl border border-white/20 bg-white/10 p-6 sm:col-span-3"><div className="flex items-center justify-between gap-3"><span className="font-bold">Trạng thái hệ thống</span><span className="flex items-center gap-2 text-sm text-emerald-100"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-300"/>All systems operational</span></div><div className="mt-5 flex h-12 items-end gap-1.5">{Array.from({ length: 34 }, (_, index) => <span aria-hidden="true" className="flex-1 rounded-full bg-cyan-100/80" key={index} style={{ height: `${42 + (index % 5) * 10}%` }} />)}</div></div></div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && <section className="landing-testimonial-section relative overflow-hidden border-y border-slate-100 bg-white py-20 sm:py-24"><div aria-hidden="true" className="landing-testimonial-glow landing-testimonial-glow-left"/><div aria-hidden="true" className="landing-testimonial-glow landing-testimonial-glow-right"/><div className="relative z-10 shell"><SectionHeading eyebrow="KHÁCH HÀNG CHIA SẺ" title="Sự ổn định được cảm nhận mỗi ngày." description="Phản hồi từ các đội ngũ đang vận hành sản phẩm trên hạ tầng của chúng tôi."/><div aria-label="Đánh giá khách hàng" className="landing-testimonial-marquee mt-10 overflow-hidden"><div className={isTestimonialMarquee ? "landing-testimonial-track flex w-max" : "flex w-max"}>{testimonialCopies.map(copy => <div aria-hidden={copy === 1} className="flex shrink-0 gap-6 pr-6" key={copy}>{testimonials.map(item => <TestimonialCard item={item} key={`${item.id}-${copy}`} />)}</div>)}</div></div></div></section>}

      <section className="shell py-20 sm:py-24">
        <SectionHeading eyebrow="TIN MỚI NHẤT" title="Tin tức và hướng dẫn từ đội ngũ kỹ thuật." description="Cập nhật vận hành, bảo mật và cách tối ưu dịch vụ Cloud." href="/news" linkLabel="Xem tất cả bài viết" />
        {data.latestNews.length > 0 ? <div className="mt-10 grid gap-6 md:grid-cols-3">{data.latestNews.map(article => <article className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm" key={article.id}><div className={`aspect-[16/8] bg-cover bg-center ${article.thumbnailUrl ? "" : "bg-gradient-to-br from-blue-950 via-blue-700 to-cyan-400"}`} style={article.thumbnailUrl ? { backgroundImage: `url("${article.thumbnailUrl}")` } : undefined}/><div className="p-6"><p className="text-xs font-black uppercase tracking-[.15em] text-blue-700">{article.categoryName}</p><h3 className="mt-3 text-xl font-black leading-snug group-hover:text-blue-700">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p><Link className="mt-5 inline-flex font-black text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={`/news/${article.slug}`}>Đọc bài viết <Arrow /></Link></div></article>)}</div> : <EmptySection message="Nội dung mới đang được cập nhật." href="/news" linkLabel="Xem tất cả tin tức" />}
      </section>

      <section className="shell pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-10 text-white shadow-xl shadow-blue-700/20 sm:px-12 sm:py-12">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-35 mix-blend-screen sm:w-1/2" style={{ backgroundImage: "url(\"/hero/hero-cloud-04.webp\")" }} />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-700/95 to-blue-600/10" />
          <div className="relative z-10 max-w-2xl"><p className="text-xs font-black tracking-[.2em] text-cyan-100">BẮT ĐẦU TỪ NHU CẦU THẬT</p><h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">Sẵn sàng bắt đầu với cloud?</h2><p className="mt-4 max-w-xl text-base leading-7 text-blue-50">Chọn cấu hình phù hợp, mở rộng đúng lúc và luôn có đội ngũ đồng hành khi bạn cần.</p><div className="mt-7 flex flex-wrap gap-3"><Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-black text-blue-700 shadow-lg shadow-blue-950/15 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700" href="/services">Khám phá dịch vụ <Arrow /></Link><Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 bg-white/10 px-5 font-black text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700" href="/order">Liên hệ tư vấn</Link></div></div>
        </div>
      </section>

      {data.unavailableSections.length > 0 && <p className="sr-only" role="status">Một số dữ liệu động đang tạm thời không khả dụng: {data.unavailableSections.join(", ")}.</p>}
    </main>
  );
}

function FeaturedPlansSection({ plans }: { plans: LandingFeaturedPlan[] }) {
  return <section className="shell py-20 sm:py-24"><DataSectionHeading eyebrow="GÓI DỊCH VỤ NỔI BẬT" title="Chọn gói phù hợp với nhu cầu của bạn." description="Cấu hình rõ ràng, giá hiện hành minh bạch và mỗi gói đều có đường dẫn đăng ký trực tiếp." href="/services" linkLabel="Xem tất cả dịch vụ" />{plans.length > 0 ? <div className="featured-plan-grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plans.map((plan, index) => <FeaturedPlanCard key={plan.id} index={index} plan={plan} />)}</div> : <EmptySection message="Các gói nổi bật đang được cập nhật." href="/services" linkLabel="Xem toàn bộ dịch vụ" />}</section>;
}

function FeaturedPlanCard({ index, plan }: { index: number; plan: LandingFeaturedPlan }) {
  const highlighted = index === 1;
  const actionLabel = typeof plan.currentMonthlyPrice !== "number" ? "Liên hệ tư vấn" : "Đăng ký ngay";
  const cardClass = highlighted
    ? "group flex min-h-[24rem] flex-col rounded-2xl border border-blue-600 bg-blue-600 p-4 text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-1 hover:bg-blue-700 sm:p-5"
    : "group flex min-h-[24rem] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:p-5";
  const featureTextClass = highlighted ? "text-blue-100" : "text-slate-600";

  return <article className={cardClass} key={plan.id}>
    <div className="flex items-start justify-between gap-3"><PlanVisual index={index} /><div className="flex flex-col items-end gap-2">{highlighted && <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700">Phổ biến nhất</span>}{plan.activePromotion && <span className={highlighted ? "rounded-full bg-blue-500 px-3 py-1 text-[11px] font-black text-white" : "rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black text-orange-700"}>{plan.activePromotion.code}</span>}</div></div>
    <p className={highlighted ? "mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-100" : "mt-4 text-xs font-black uppercase tracking-[.16em] text-blue-700"}>{plan.categoryName}</p>
    <h3 className="mt-2 text-lg font-black leading-tight sm:text-xl">{plan.name}</h3>
    <p className={`mt-2 min-h-10 line-clamp-2 text-sm leading-5 ${featureTextClass}`}>{plan.summary}</p>
    <div className="mt-4"><PlanPrice inverted={highlighted} plan={plan} /></div>
    <ul className={`mt-4 min-h-[7rem] space-y-2 border-t pt-4 text-sm ${highlighted ? "border-white/20" : "border-slate-100"}`}>
      {plan.features.length > 0 ? plan.features.slice(0, 4).map(feature => <li className={`flex items-start gap-2 ${featureTextClass}`} key={feature.id}><FeatureIcon feature={feature} inverted={highlighted} /><span><b className={highlighted ? "text-white" : "text-slate-700"}>{feature.displayName}</b>{feature.value ? ` ${feature.value}` : ""}{feature.unit ? ` ${feature.unit}` : ""}</span></li>) : <li className={`flex items-start gap-2 ${featureTextClass}`}><FeatureIcon label={plan.summary} inverted={highlighted} /><span>{plan.summary}</span></li>}
      {plan.qrCodePath && <li className={`flex items-start gap-2 ${featureTextClass}`}><FeatureIcon label="QR cấu hình sẵn sàng" inverted={highlighted} /><span>QR cấu hình sẵn sàng</span></li>}
    </ul>
    <Link className={highlighted ? "mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600" : "mt-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-500 bg-white px-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"} href={`/order?plan=${encodeURIComponent(plan.slug)}`}>{actionLabel}{actionLabel === "Đăng ký ngay" && <Arrow />}</Link>
  </article>;
}

function PromotionsSection({ promotions }: { promotions: Promotion[] }) {
  return (
    <section className="border-y border-slate-100 bg-white py-20 sm:py-24">
      <div className="shell">
        <DataSectionHeading eyebrow="KHUYẾN MÃI ĐANG CHẠY" title="Ưu đãi rõ ràng, thời hạn minh bạch." description="Theo dõi các chương trình đang áp dụng trực tiếp cho những gói dịch vụ phù hợp." href="/pricing" linkLabel="Xem bảng giá" />
        {promotions.length > 0 ? (
          <div className="promotion-grid promotion-list mx-auto mt-10 grid w-full max-w-[1200px] grid-cols-1 gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((item, index) => <PromotionCard index={index} item={item} key={item.id} />)}
          </div>
        ) : <EmptySection message="Hiện chưa có chương trình khuyến mãi đang hoạt động." href="/pricing" linkLabel="Xem bảng giá" />}
      </div>
    </section>
  );
}

function PromotionCard({ index, item }: { index: number; item: Promotion }) {
  const discount = item.discountType === 1 ? `${item.discountValue}%` : money(item.discountValue);
  const badge = item.discountType === 1 ? `-${item.discountValue}%` : "ƯU ĐÃI";
  const cardTone = ["border-orange-100 bg-orange-50/45", "border-blue-100 bg-blue-50/45", "border-amber-100 bg-amber-50/45"][index % 3];
  const detailTone = ["border-orange-400 text-orange-600 hover:bg-orange-50", "border-blue-500 text-blue-700 hover:bg-blue-50", "border-amber-500 text-amber-700 hover:bg-amber-50"][index % 3];
  return <article className={`group flex min-h-[13rem] flex-col overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5 ${cardTone}`}>
    <div className="flex min-h-[6.75rem] items-start gap-2"><div className="relative z-10 min-w-0 max-w-[62%]"><PromotionBadge index={index} label={badge} /><h3 className="mt-2 line-clamp-2 text-[1.125rem] font-black leading-[1.25] text-slate-950 sm:text-[1.2rem]">{item.name}</h3><p className="mt-2 text-[0.8125rem] font-semibold leading-5 text-blue-700">{item.discountType === 1 ? `Tiết kiệm ${discount}` : `Giảm ${discount}`}</p><p className="mt-3 text-xs font-bold text-slate-500">Hạn: {formatDate(item.endsAt)}</p></div><PromotionArt index={index} /></div>
    <div className="mt-auto flex items-end justify-between gap-2 pt-3"><Link className={`inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border bg-white/80 px-3.5 text-[0.75rem] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${detailTone}`} href={`/pricing?promotion=${encodeURIComponent(item.code)}`}>Xem chi tiết</Link><p className="text-right text-xs leading-4 text-slate-600">Áp dụng cho {item.servicePlanIds.length} gói</p></div>
  </article>;
}

function PlanPrice({ inverted = false, plan }: { inverted?: boolean; plan: ServicePlan }) {
  const mutedClass = inverted ? "text-blue-100/70" : "text-slate-400";
  const priceClass = inverted ? "text-white" : "text-slate-950";
  const saleClass = inverted ? "text-white" : "text-blue-700";
  if (typeof plan.currentMonthlyPrice !== "number") return <p className={`text-2xl font-black ${priceClass}`}>Liên hệ</p>;
  if (typeof plan.promotionalMonthlyPrice !== "number") return <p className={`text-2xl font-black ${priceClass}`}>{money(plan.currentMonthlyPrice, plan.currency)}<span className={`text-sm font-medium ${mutedClass}`}>/tháng</span></p>;
  return <div><p className={`text-sm line-through ${mutedClass}`}>{money(plan.currentMonthlyPrice, plan.currency)}</p><p className={`text-2xl font-black ${saleClass}`}>{money(plan.promotionalMonthlyPrice, plan.currency)}<span className={`text-sm font-medium ${mutedClass}`}>/tháng</span></p></div>;
}

function PlanVisual({ index }: { index: number }) {
  return <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><svg className="h-7 w-7" fill="none" viewBox="0 0 48 48"><path d={index % 2 === 0 ? "M10 30.5c0-4.7 3.8-8.5 8.5-8.5.8 0 1.6.1 2.4.3C22.2 17.9 26.1 15 30.5 15c5.8 0 10.5 4.7 10.5 10.5 0 .5 0 1-.1 1.5h.6a5.5 5.5 0 0 1 0 11H16a6 6 0 0 1-6-6v-1.5Z" : "M11 36h26M13 36V20h8v16m4 0V12h8v24M11 40h26"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" /><path d={index % 2 === 0 ? "M17 31h15" : "M16 25h2m8 0h2M16 30h2m8 0h2"} stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" /></svg></span>;
}

function PromotionArt({ index }: { index: number }) {
  const sources = ["/promotions/promo-discount.png", "/promotions/promo-cloud-backup.png", "/promotions/promo-new-customer.png"];
  return <span aria-hidden="true" className="relative -mr-2 h-24 w-[38%] shrink-0 sm:h-28"><Image alt="" className="object-contain object-right-bottom transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 640px) 38vw, 140px" src={sources[index % sources.length]} /></span>;
}

function PromotionBadge({ index, label }: { index: number; label: string }) {
  const classes = ["bg-orange-500", "bg-emerald-500", "bg-blue-700"][index % 3];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black leading-none text-white shadow-sm ${classes}`}>{label}</span>;
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return <figure className="landing-testimonial-card flex min-h-[18rem] w-[min(78vw,17.5rem)] shrink-0 flex-col rounded-xl border border-slate-200 border-t-2 border-t-blue-600 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:w-[18rem] sm:p-5">
    <blockquote className="flex-1 text-[0.95rem] leading-7 text-slate-700"><span aria-hidden="true" className="block text-4xl font-black leading-none text-blue-600">“</span><span className="mt-3 block line-clamp-6 overflow-hidden">{item.quote}”</span></blockquote>
    <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">{item.avatarUrl ? <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${item.avatarUrl}")` }} /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blue-100 bg-blue-50 font-black text-blue-700">{item.customerName.charAt(0)}</span>}<span className="min-w-0"><b className="block truncate text-sm font-black text-slate-950">{item.customerName}</b><span className="block truncate text-xs text-slate-500">{item.customerRole ? `${item.customerRole}, ` : ""}{item.companyName}</span></span></figcaption>
  </figure>;
}

function FeatureIcon({ feature, inverted = false, label = "" }: { feature?: ServicePlanFeature; inverted?: boolean; label?: string }) {
  const copy = `${feature?.featureKey ?? ""} ${feature?.displayName ?? ""} ${label}`.toLowerCase();
  const iconClass = `mt-0.5 h-4 w-4 shrink-0 ${inverted ? "text-cyan-200" : "text-blue-600"}`;
  if (copy.includes("cpu") || copy.includes("core")) return <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24"><rect height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="7"/><path d="M9 2v3m3-3v3m3-3v3M9 19v3m3-3v3m3-3v3M2 9h3m-3 3h3m-3 3h3m14-6h3m-3 3h3m-3 3h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>;
  if (copy.includes("ram") || copy.includes("memory")) return <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24"><rect height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="17" x="3.5" y="8"/><path d="M7 8V5m3 3V5m4 3V5m3 3V5M7 16v3m3-3v3m4-3v3m3-3v3M7 11h.01m4 0h.01m4 0h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>;
  if (copy.includes("ssd") || copy.includes("disk") || copy.includes("storage")) return <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6m-15 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" stroke="currentColor" strokeWidth="1.8"/><path d="M15.5 7.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg>;
  if (copy.includes("bandwidth") || copy.includes("băng thông") || copy.includes("network") || copy.includes("traffic")) return <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.4 8.8 12S9.9 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/></svg>;
  return <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M12 3.5 19 6v5.2c0 4.5-2.9 7.7-7 9.3-4.1-1.6-7-4.8-7-9.3V6l7-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8"/><path d="m8.7 12 2.2 2.2 4.5-4.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>;
}

function Arrow() {
  return <span aria-hidden="true" className="ml-2">→</span>;
}

function UptimeMetric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-3xl border border-white/20 bg-white/10 p-6"><b className="block text-3xl font-black">{value}</b><span className="mt-2 block text-sm text-blue-50">{label}</span></div>;
}

function DataSectionHeading({ eyebrow, title, description, href, linkLabel }: { eyebrow: string; title: string; description: string; href?: string; linkLabel?: string }) {
  return <div className="mx-auto max-w-2xl text-center lg:max-w-5xl xl:max-w-6xl"><p className="text-xs font-black tracking-[.2em] text-blue-700">{eyebrow}</p><h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl xl:whitespace-nowrap">{title}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>{href && linkLabel && <Link className="mt-4 inline-flex font-black text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={href}>{linkLabel}<Arrow /></Link>}</div>;
}

function SectionHeading({ eyebrow, title, description, href, linkLabel }: { eyebrow: string; title: string; description: string; href?: string; linkLabel?: string }) {
  return <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-3xl lg:max-w-none"><p className="text-xs font-black tracking-[.2em] text-blue-700">{eyebrow}</p><h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-[clamp(2.25rem,3.6vw,3.25rem)] xl:whitespace-nowrap">{title}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">{description}</p></div>{href && linkLabel && <Link className="shrink-0 font-black text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={href}>{linkLabel}<Arrow /></Link>}</div>;
}

function EmptySection({ message, href, linkLabel }: { message: string; href?: string; linkLabel?: string }) {
  return <div className="mt-10 rounded-3xl border border-dashed border-blue-200 bg-white/70 p-10 text-center"><p className="text-base font-bold text-slate-700">{message}</p>{href && linkLabel && <Link className="mt-4 inline-flex font-black text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={href}>{linkLabel}<Arrow /></Link>}</div>;
}
