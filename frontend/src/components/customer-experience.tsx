"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type PointerEvent } from "react";
import { CustomerIcon, type CustomerIconKind } from "@/components/customer-art";
import { FeaturedTestimonialArt } from "@/components/customer-experience-art";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { CustomerLogo, Testimonial } from "@/lib/api";
import { cycleIndex, filterByCategory, visibleWindow } from "@/lib/customer-carousel";

export type CustomerQrPlan = {
  id: string;
  category: string;
  icon: CustomerIconKind;
  name: string;
  price: string;
  qrCodePath: string;
  slug: string;
  specs: string;
};

type CustomerExperienceProps = {
  testimonials: Testimonial[];
  logos: CustomerLogo[];
  qrPlans?: CustomerQrPlan[];
};

const brandAccents = ["#2563eb", "#0f8f79", "#7c3aed", "#0284c7", "#d97706", "#db2777", "#0891b2", "#4f46e5", "#0f766e", "#c2410c"];
const qrFilters = [
  { id: "all", label: "Tất cả" },
  { id: "VPS", label: "VPS" },
  { id: "Hosting", label: "Hosting" },
  { id: "Cloud", label: "Cloud" },
  { id: "Email", label: "Email" },
  { id: "SSL", label: "SSL" },
];

export function CustomerExperience({ testimonials, logos, qrPlans = [] }: CustomerExperienceProps) {
  return <>
    {testimonials.length > 0 && <>
      <ScrollReveal delay={80}><FeaturedTestimonial testimonials={testimonials} /></ScrollReveal>
      <ScrollReveal delay={80}><ReviewCarousel testimonials={testimonials} /></ScrollReveal>
    </>}
    <ScrollReveal delay={80}><CustomerMarquee logos={logos} /></ScrollReveal>
    {qrPlans.length > 0 && <ScrollReveal delay={80}><QrPlanCarousel qrPlans={qrPlans} /></ScrollReveal>}
  </>;
}

function FeaturedTestimonial({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const current = testimonials[activeIndex] ?? testimonials[0];
  const move = useCallback((delta: number) => setActiveIndex((index) => cycleIndex(index, delta, testimonials.length)), [testimonials.length]);

  useAutoplay({ active: !paused && !reducedMotion, interval: 5_500, length: testimonials.length, onAdvance: () => move(1) });

  if (!current) return null;

  return <section className="shell py-7 sm:py-8" aria-roledescription="carousel" aria-label="Khách hàng nói gì về chúng tôi">
    <SectionHeading number="1." title="Khách hàng nói gì về chúng tôi?" />
    <div className="customer-featured-stage mt-5">
      <article className="customer-featured-card" onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onFocusCapture={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="customer-featured-copy">
          <QuoteMark />
          <blockquote className="customer-featured-quote" key={current.id}>{current.quote}</blockquote>
          <CustomerIdentity item={current} />
        </div>
        <div className="customer-featured-art"><FeaturedTestimonialArt /></div>
        {testimonials.length > 1 && <div className="customer-featured-controls" aria-label="Điều khiển đánh giá nổi bật">
          <button aria-label="Xem đánh giá trước" className="customer-carousel-arrow" onClick={() => move(-1)} type="button"><Chevron direction="left" /></button>
          <div className="customer-carousel-dots">{testimonials.map((item, index) => <button aria-label={`Xem đánh giá ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={index === activeIndex ? "is-active" : ""} key={item.id} onClick={() => setActiveIndex(index)} type="button"><span /></button>)}</div>
          <button aria-label="Xem đánh giá tiếp theo" className="customer-carousel-arrow" onClick={() => move(1)} type="button"><Chevron direction="right" /></button>
        </div>}
        {!reducedMotion && testimonials.length > 1 && <span aria-hidden="true" className="customer-featured-progress" key={activeIndex} />}
      </article>
    </div>
  </section>;
}

function ReviewCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const move = useCallback((delta: number) => setActiveIndex((index) => cycleIndex(index, delta, testimonials.length)), [testimonials.length]);
  const visibleReviews = visibleWindow(testimonials, activeIndex, 3);
  const touchStart = useRef<number | null>(null);

  useAutoplay({ active: !paused && !reducedMotion, interval: 5_500, length: testimonials.length, onAdvance: () => move(1) });

  return <section className="shell pb-7 sm:pb-8" aria-roledescription="carousel" aria-label="Đánh giá từ khách hàng">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading title="Đánh giá từ khách hàng" /><CarouselControls activeIndex={activeIndex} items={testimonials} nextLabel="Đánh giá tiếp theo" onMove={move} onSelect={setActiveIndex} previousLabel="Đánh giá trước" /></div>
    <div className="customer-review-viewport mt-5" onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onFocusCapture={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onPointerDown={(event) => { touchStart.current = event.pointerType === "touch" ? event.clientX : null; }} onPointerUp={(event) => handleSwipe(event, touchStart, move)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleReviews.map((item, index) => <TestimonialCard className={index === 1 ? "hidden md:flex" : index === 2 ? "hidden xl:flex" : "flex"} item={item} key={`${item.id}-${activeIndex}`} />)}
      </div>
    </div>
  </section>;
}

function CustomerMarquee({ logos }: { logos: CustomerLogo[] }) {
  const marqueeItems = [...logos, ...logos];
  if (!logos.length) return null;

  return <section className="shell pb-7 sm:pb-8">
    <SectionHeading description="Đồng hành cùng doanh nghiệp ở nhiều lĩnh vực." title="Khách hàng tiêu biểu" />
    <div className="customer-logo-marquee mt-5" tabIndex={0}>
      <div className="customer-logo-track">
        {marqueeItems.map((logo, index) => <LogoMark accent={brandAccents[index % brandAccents.length]} item={logo} key={`${logo.id}-${index}`} />)}
      </div>
    </div>
  </section>;
}

function QrPlanCarousel({ qrPlans }: { qrPlans: CustomerQrPlan[] }) {
  const [category, setCategory] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const filteredPlans = useMemo(() => filterByCategory(qrPlans, category), [category, qrPlans]);
  const visiblePlans = visibleWindow(filteredPlans, activeIndex, 4);
  const move = useCallback((delta: number) => setActiveIndex((index) => cycleIndex(index, delta, filteredPlans.length)), [filteredPlans.length]);

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setActiveIndex(0);
    setExpandedQr(null);
  };

  return <section className="shell pb-7 sm:pb-8" aria-label="Quét QR để xem từng gói dịch vụ">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading title="Quét QR để xem từng gói dịch vụ" /><CarouselControls activeIndex={activeIndex} items={filteredPlans} nextLabel="Gói dịch vụ tiếp theo" onMove={move} onSelect={setActiveIndex} previousLabel="Gói dịch vụ trước" /></div>
    <div className="customer-filter-list mt-5" role="group" aria-label="Lọc gói dịch vụ">{qrFilters.map((filter) => <button aria-pressed={category === filter.id} className={category === filter.id ? "is-active" : ""} key={filter.id} onClick={() => selectCategory(filter.id)} type="button">{filter.label}</button>)}</div>
    <div className="customer-qr-viewport mt-4">
      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiblePlans.map((item, index) => <QrPlanCard className={index === 1 ? "hidden sm:flex" : index === 2 ? "hidden lg:flex" : index === 3 ? "hidden xl:flex" : "flex"} expanded={expandedQr === item.slug} item={item} key={`${item.slug}-${category}-${activeIndex}`} onToggleQr={() => setExpandedQr((value) => value === item.slug ? null : item.slug)} />)}
      </div>
    </div>
  </section>;
}

function CarouselControls<T extends { id?: string; slug?: string }>({ activeIndex, items, nextLabel, onMove, onSelect, previousLabel }: { activeIndex: number; items: T[]; nextLabel: string; onMove: (delta: number) => void; onSelect: (index: number) => void; previousLabel: string }) {
  if (items.length < 2) return null;
  return <div className="customer-compact-controls" aria-label="Điều khiển danh sách"><button aria-label={previousLabel} className="customer-carousel-arrow" onClick={() => onMove(-1)} type="button"><Chevron direction="left" /></button><div className="customer-carousel-dots">{items.map((item, index) => <button aria-label={`Xem mục ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={index === activeIndex ? "is-active" : ""} key={item.id ?? item.slug ?? index} onClick={() => onSelect(index)} type="button"><span /></button>)}</div><button aria-label={nextLabel} className="customer-carousel-arrow" onClick={() => onMove(1)} type="button"><Chevron direction="right" /></button></div>;
}

function TestimonialCard({ className, item }: { className: string; item: Testimonial }) {
  return <article className={`customer-review-card ${className}`}><div className="flex items-center gap-3"><Avatar item={item} /><div><b className="block text-sm text-[#10245a]">{item.customerName}</b><p className="mt-1 text-[11px] text-[#5a6e8a]">{item.customerRole}</p><p className="text-[11px] text-[#5a6e8a]">{item.companyName}</p></div></div><p className="mt-5 flex-1 text-sm leading-6 text-[#465f7d]">{item.quote}</p></article>;
}

function QrPlanCard({ className, expanded, item, onToggleQr }: { className: string; expanded: boolean; item: CustomerQrPlan; onToggleQr: () => void }) {
  const qrId = `customer-qr-${item.slug}`;
  // eslint-disable-next-line @next/next/no-img-element -- QR image is served by the backend endpoint.
  return <article className={`customer-qr-card ${className}`}><div className="flex items-center justify-between"><span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{item.category}</span><CustomerIcon className="h-5 w-5 text-blue-600" kind={item.icon} /></div><span className="mx-auto mt-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><CustomerIcon className="h-8 w-8" kind={item.icon} /></span><h3 className="mt-3 min-h-10 text-center text-sm font-black leading-5 text-[#10245a]">{item.name}</h3><p className="mt-2 min-h-10 whitespace-pre-line text-center text-[11px] leading-4 text-[#465f7d]">{item.specs}</p><p className="mt-3 text-center text-base font-black text-blue-700">{item.price}</p><div className="mt-4 grid grid-cols-2 gap-2"><Link className="inline-flex min-h-9 items-center justify-center rounded-lg bg-blue-600 px-2 text-[11px] font-black text-white" href={`/services/${item.slug}`}>Xem chi tiết</Link><button aria-controls={qrId} aria-expanded={expanded} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-200 bg-white px-2 text-[11px] font-black text-blue-700" onClick={onToggleQr} type="button">Xem QR</button></div><div className={`customer-qr-reveal ${expanded ? "is-open" : ""}`} id={qrId}><div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><img alt={`Mã QR mở gói ${item.name}`} className="h-16 w-16 shrink-0 rounded bg-white p-1" decoding="async" height="64" loading="lazy" src={item.qrCodePath} width="64" /><span className="text-[11px] leading-5 text-[#465f7d]">Quét mã để mở nhanh trang chi tiết gói dịch vụ.</span></div></div></article>;
}

function CustomerIdentity({ item }: { item: Testimonial }) {
  return <div className="mt-5 flex items-center gap-3"><Avatar item={item} /><div><b className="block text-sm text-[#10245a]">{item.customerName}</b><p className="mt-1 text-xs text-[#5a6e8a]">{item.customerRole ? `${item.customerRole} · ` : ""}{item.companyName}</p></div></div>;
}

function Avatar({ item }: { item: Testimonial }) {
  return item.avatarUrl ? <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${item.avatarUrl}")` }} /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-700 to-cyan-400 text-lg font-black text-white">{item.customerName.charAt(0)}</span>;
}

function LogoMark({ accent, item }: { accent: string; item: CustomerLogo }) {
  const label = item.altText || `Logo ${item.name}`;
  // eslint-disable-next-line @next/next/no-img-element -- logo URLs are editable admin data and may use arbitrary hosts.
  const logo = item.logoUrl ? <img alt={label} className="customer-logo-image" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={item.logoUrl} /> : <span className="customer-logo-fallback">{item.name}</span>;
  const content = <div className="customer-logo-mark" style={{ "--customer-brand-accent": accent } as CSSProperties}>{logo}</div>;
  return item.websiteUrl ? <a aria-label={`Mở website ${item.name}`} className="customer-logo-link" href={item.websiteUrl} rel="noreferrer" target="_blank">{content}</a> : content;
}

function SectionHeading({ description, number, title }: { description?: string; number?: string; title: string }) {
  return <div><h2 className="text-xl font-black tracking-[-.025em] text-[#10245a] sm:text-2xl">{number && <span>{number} </span>}{title}</h2>{description && <p className="mt-2 text-sm text-slate-600">{description}</p>}</div>;
}

function QuoteMark() {
  return <svg aria-hidden="true" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 44 44"><path d="M19 11C11.7 13.3 8 18.2 8 25.8c0 4.8 2.8 8.2 7.4 8.2 4.2 0 7.1-2.9 7.1-7.1 0-3.7-2.4-6.1-5.8-6.1-.4 0-.8 0-1.2.1.9-2.7 3.2-4.8 7.1-6.1L19 11Zm17 0c-7.3 2.3-11 7.2-11 14.8 0 4.8 2.8 8.2 7.4 8.2 4.2 0 7.1-2.9 7.1-7.1 0-3.7-2.4-6.1-5.8-6.1-.4 0-.8 0-1.2.1.9-2.7 3.2-4.8 7.1-6.1L36 11Z" fill="currentColor" /></svg>;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 20 20"><path d={direction === "left" ? "m12 4-6 6 6 6" : "m8 4 6 6-6 6"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function useAutoplay({ active, interval, length, onAdvance }: { active: boolean; interval: number; length: number; onAdvance: () => void }) {
  useEffect(() => {
    if (!active || length < 2) return;
    const timer = window.setInterval(onAdvance, interval);
    return () => window.clearInterval(timer);
  }, [active, interval, length, onAdvance]);
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reducedMotion;
}

function handleSwipe(event: PointerEvent<HTMLDivElement>, touchStart: MutableRefObject<number | null>, move: (delta: number) => void) {
  if (touchStart.current === null) return;
  const delta = event.clientX - touchStart.current;
  touchStart.current = null;
  if (Math.abs(delta) < 48) return;
  move(delta < 0 ? 1 : -1);
}
