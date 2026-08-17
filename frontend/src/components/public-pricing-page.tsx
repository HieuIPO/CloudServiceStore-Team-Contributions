"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, catalogApi, promotionApi, type Promotion, type ServicePlanDetail } from "@/lib/api";
import { buildPricingPlans, formatPromotionDate, getActivePromotion, getCountdownParts, samplePricingPlans, samplePricingPromotion, type BillingCycle, type CountdownParts, type PricingPlan } from "@/lib/pricing-data";
import { CalendarIcon, DocumentIcon, TrendIcon } from "@/components/pricing-art";
import { PricingComparisonTable } from "@/components/pricing-comparison-table";
import { PricingPlanCard } from "@/components/pricing-plan-card";
import { PricingPromotionBanner } from "@/components/pricing-promotion-banner";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";

const pricingShell = "mx-auto w-full max-w-none px-4 sm:px-6 lg:px-11";

export function PublicPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(12);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [samplePreview, setSamplePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (useSamplePreview: boolean) => {
    setLoading(true);
    setError(null);
    setPromotion(null);
    setCountdown(null);
    if (useSamplePreview) {
      setPlans(samplePricingPlans);
      setPromotion(samplePricingPromotion);
      setLoading(false);
      return;
    }

    try {
      const [result, promotionResult] = await Promise.all([
        catalogApi.publicPlans(),
        promotionApi.all(true).catch(() => null),
      ]);
      const detailResults = await Promise.allSettled(result.items.map(plan => catalogApi.plan(plan.id)));
      const details: Record<string, ServicePlanDetail> = {};
      detailResults.forEach((detailResult, index) => {
        if (detailResult.status === "fulfilled") details[result.items[index].id] = detailResult.value;
      });
      setPlans(buildPricingPlans(result.items, details));
      const selectedPromotions = promotionResult
        ? promotionResult.items.filter(promotion => promotion.showOnPublicBanner)
        : [];
      setPromotion(getActivePromotion(selectedPromotions) ?? null);
    } catch (reason) {
      setPlans([]);
      setPromotion(null);
      setError(reason instanceof ApiError ? reason.message : "Không thể tải bảng giá dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const useSamplePreview = new URLSearchParams(window.location.search).get("preview") === "sample";
    const timer = window.setTimeout(() => {
      setSamplePreview(useSamplePreview);
      void load(useSamplePreview);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!promotion) return;

    const end = Date.parse(promotion.endsAt);
    const updateCountdown = () => {
      const next = getCountdownParts(Date.now(), end);
      setCountdown(next);
      if (next.expired) setPromotion(current => current?.id === promotion.id ? null : current);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [promotion]);

  return (
    <main className="pricing-page min-h-full bg-[#fbfdff] text-slate-950">
      <PublicPageBanner
        networkClassName="bg-[url(/assets/page-heroes/pricing-hero.png)] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center"
        breadcrumb="Bảng giá"
        description="Tham khảo các gói VPS, Hosting, Domain, Email, SSL và Cloud Server với mức giá minh bạch, chu kỳ linh hoạt và cấu hình dễ so sánh. Chọn giải pháp phù hợp ngân sách hôm nay, đồng thời sẵn sàng nâng cấp khi hệ thống phát triển."
        eyebrow="Minh bạch chi phí, linh hoạt theo nhu cầu"
        title="Bảng giá dịch vụ"
      />

      <div className={`${pricingShell} pt-5`}>
        <ScrollReveal className="pricing-cycle-reveal" delay={80}>
          <div aria-label="Chọn chu kỳ thanh toán" className="pricing-cycle-switch mx-auto grid min-h-[3.875rem] max-w-[38rem] grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_3px_12px_rgba(28,93,167,.06)]" data-billing-cycle={billingCycle} role="group">
            <BillingButton active={billingCycle === 1} cycle={1} label="Theo tháng" onSelect={setBillingCycle} subtitle="Thanh toán hàng tháng" />
            <BillingButton active={billingCycle === 12} cycle={12} label="Theo năm" onSelect={setBillingCycle} subtitle="Thanh toán 12 tháng" />
          </div>
        </ScrollReveal>

        {samplePreview && <p className="sr-only" role="status">Đang xem dữ liệu mẫu — không ghi vào API.</p>}
        {promotion && countdown && !countdown.expired && <ScrollReveal className="pricing-promotion-reveal mt-5" delay={130}>
          <PricingPromotionBanner billingCycle={billingCycle} countdown={countdown} promotion={promotion} />
        </ScrollReveal>}

        {loading && <PricingLoadingState />}
        {error && <PricingErrorState message={error} onRetry={() => void load(samplePreview)} />}
        {!loading && !error && !plans.length && <PricingEmptyState />}
        {!loading && !error && plans.length > 0 && (
          <ScrollReveal className="pricing-comparison-reveal mt-5" delay={90}>
            <section aria-labelledby="pricing-comparison-title">
              <h2 className="sr-only" id="pricing-comparison-title">So sánh các gói dịch vụ</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plans.map((plan, index) => <PricingPlanCard animationDelay={index * 55} billingCycle={billingCycle} key={plan.id} plan={plan} />)}</div>
              <PricingComparisonTable plans={plans} />
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal className="pricing-notes-reveal" delay={80}>
          <PricingNotes promotion={promotion} />
        </ScrollReveal>
      </div>
    </main>
  );
}

function BillingButton({ active, cycle, label, onSelect, subtitle }: { active: boolean; cycle: BillingCycle; label: string; onSelect: (cycle: BillingCycle) => void; subtitle: string }) {
  return (
    <button aria-pressed={active} className={`relative flex min-h-14 items-center justify-center gap-1 px-2 text-left transition focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-inset sm:gap-2 sm:px-3 ${active ? "z-10 -m-px rounded-xl border-2 border-blue-600 bg-[#f4f8ff] text-blue-700" : "text-slate-700 hover:bg-slate-50"}`} data-cycle={cycle} onClick={() => onSelect(cycle)} type="button">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`} aria-hidden="true">
        {active && <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 16 16"><path d="m3.2 8.2 3.1 3.1 6.5-6.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
      </span>
      <span className="min-w-0"><span className="block whitespace-nowrap text-xs font-black leading-5 sm:text-sm">{label}</span><span className="block whitespace-nowrap text-[10px] leading-4 text-slate-500 sm:text-[11px]">{subtitle}</span></span>
    </button>
  );
}

function PricingNotes({ promotion }: { promotion: Promotion | null }) {
  const promotionDescription = promotion
    ? `Chương trình áp dụng cho ${promotion.servicePlanIds.length ? `${promotion.servicePlanIds.length} gói đã chọn` : "các gói đã chọn"} đến ${formatPromotionDate(promotion.endsAt)}.`
    : "Hiện chưa có chương trình khuyến mãi đang áp dụng.";

  return <aside className="mb-7 mt-6 grid min-h-[6rem] overflow-hidden rounded-xl border border-blue-100 bg-white sm:grid-cols-3">
    <Note icon={<DocumentIcon />} title="Giá theo chu kỳ" description="Chọn theo tháng hoặc theo năm để xem mức giá áp dụng." />
    <Note icon={<CalendarIcon />} title="Ưu đãi có thời hạn" description={promotionDescription} />
    <Note icon={<TrendIcon />} title="Nâng cấp linh hoạt" description="Dễ dàng nâng cấp tài nguyên khi nhu cầu tăng." />
  </aside>;
}

function Note({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-blue-50 px-6 py-5 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-[#10245a]">{title}</h3>
        <p className="mt-1 text-xs leading-4 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function PricingLoadingState() {
  return <div aria-busy="true" aria-label="Đang tải bảng giá" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(item => <div className="h-[15rem] animate-pulse rounded-xl border border-slate-200 bg-white" key={item} />)}</div>;
}

function PricingErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-6 text-center" role="alert"><p className="text-sm font-bold text-rose-800">{message}</p><button className="button-secondary mt-4 min-h-11 border-rose-300 text-rose-800 hover:bg-white" onClick={onRetry} type="button">Thử lại</button></div>;
}

function PricingEmptyState() {
  return <div className="mt-3 rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center"><h2 className="text-lg font-black text-[#10245a]">Chưa có gói dịch vụ đang mở bán</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Các gói dịch vụ công khai sẽ xuất hiện tại đây khi được kích hoạt.</p></div>;
}
