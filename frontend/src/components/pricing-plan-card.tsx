import Link from "next/link";
import { formatMoney, type BillingCycle, type PricingPlan } from "@/lib/pricing-data";
import { PricingPlanIcon } from "@/components/pricing-art";

export function PricingPlanCard({ animationDelay = 0, plan, billingCycle }: { animationDelay?: number; plan: PricingPlan; billingCycle: BillingCycle }) {
  const orderHref = plan.slug
    ? `/order?plan=${encodeURIComponent(plan.slug)}&cycle=${billingCycle}`
    : "/order";
  const artwork = plan.isCustom ? "enterprise" : plan.name.toLocaleLowerCase("vi-VN").includes("cloud") ? "cloud" : "vps";
  const selectedPrice = billingCycle === 12 ? plan.annual : plan.monthly;
  const cycleLabel = billingCycle === 12 ? "/năm" : "/tháng";

  return (
    <article className={`pricing-plan-card pricing-plan-card-enter relative flex min-h-[15rem] min-w-0 flex-col rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(28,93,167,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(28,93,167,.12)] ${
      plan.isFeatured ? "border-blue-500" : "border-blue-100"
    } ${plan.isFeatured ? "pricing-plan-card-featured" : ""}`} style={{ "--pricing-card-delay": `${animationDelay}ms` } as React.CSSProperties}>
      {plan.isFeatured && <span className="absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black text-white shadow-sm"><svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><path d="m8 1.5 1.8 3.7 4.1.6-3 2.9.7 4.1L8 10.9l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 1.5Z" /></svg>Phổ biến nhất</span>}
      <div className="flex min-h-[5.25rem] items-start gap-3">
        <div className="pricing-plan-art grid h-[4.75rem] w-[5.5rem] shrink-0 place-items-center">
          <PricingPlanIcon variant={artwork} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-black leading-5 text-[#10245a] sm:text-lg">{plan.name}</h2>
          <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{plan.summary}</p>
        </div>
      </div>

      <div className="pricing-plan-price mt-2 flex min-h-[4.25rem] flex-col justify-center text-center" key={billingCycle}>
        {plan.isCustom ? (
          <>
            <p className="pt-1 text-xl font-black text-blue-600">Liên hệ</p>
            <p className="mt-1 text-xs leading-4 text-slate-500">Báo giá theo yêu cầu</p>
          </>
        ) : (
          <>
            {selectedPrice ? (
              <>
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <p className={`text-xl font-black leading-6 ${billingCycle === 12 ? "text-emerald-600" : "text-blue-700"}`}>
                    {formatMoney(selectedPrice.current, plan.currency)}
                    <span className={`ml-0.5 text-xs font-bold ${billingCycle === 12 ? "text-emerald-600" : "text-slate-500"}`}>{cycleLabel}</span>
                  </p>
                  {billingCycle === 12 && plan.promotionLabel && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-black text-rose-600">{plan.promotionLabel}</span>}
                </div>
                {billingCycle === 12 && selectedPrice.original && <p className="text-[11px] leading-4 text-slate-400 line-through">{formatMoney(selectedPrice.original, plan.currency)}</p>}
              </>
            ) : (
              <p className="pt-1 text-xl font-black text-blue-600">Liên hệ</p>
            )}
          </>
        )}
      </div>

      <Link className={`mt-auto inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-1 ${
        plan.isFeatured
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-blue-500 bg-white text-blue-700 hover:bg-blue-50"
      }`} href={orderHref}>{plan.isCustom ? "Liên hệ tư vấn" : "Đặt hàng ngay"}</Link>
    </article>
  );
}
