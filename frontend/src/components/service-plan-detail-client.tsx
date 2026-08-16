"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiBaseUrl, catalogApi, type PlanPrice, type ServicePlanDetail } from "@/lib/api";
import { getBestPromotion, promotionAppliesToCycle } from "@/lib/pricing-data";

type BillingCycle = 1 | 12;

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const isPriceActive = (price: PlanPrice, asOf: number) =>
  price.isActive &&
  Date.parse(price.effectiveFrom) <= asOf &&
  (!price.effectiveTo || Date.parse(price.effectiveTo) > asOf);

const activePriceForCycle = (prices: PlanPrice[], billingCycle: BillingCycle, asOf: number) =>
  prices
    .filter(price => price.billingCycle === billingCycle && isPriceActive(price, asOf))
    .sort((a, b) => Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom))[0];

export function ServicePlanDetailClient({ slug }: { slug: string }) {
  const [plan, setPlan] = useState<ServicePlanDetail | null>(null);
  const [billingCycle, setBillingCycle] = useState<1 | 12>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const requestId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      setPlan(null);
      setAsOf(null);

      void catalogApi.planBySlug(slug)
        .then(result => {
          if (cancelled) return;
          setPlan(result);
          setAsOf(Date.now());
        })
        .catch(requestError => {
          if (cancelled) return;
          setError(requestError instanceof ApiError ? requestError.message : "Không thể tải gói dịch vụ.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(requestId);
    };
  }, [slug]);

  const selectedPrice = useMemo(() => {
    if (!plan || asOf === null) return undefined;
    return activePriceForCycle(plan.prices, billingCycle, asOf);
  }, [asOf, billingCycle, plan]);

  const bestPromotion = useMemo(() => {
    if (!selectedPrice || !plan) return undefined;
    return getBestPromotion(selectedPrice.amount, plan.activePromotions, billingCycle);
  }, [billingCycle, plan, selectedPrice]);

  const applicablePromotions = useMemo(
    () => plan?.activePromotions.filter(promotion => promotionAppliesToCycle(promotion, billingCycle)) ?? [],
    [billingCycle, plan],
  );

  const discountedPrice = bestPromotion?.price ?? selectedPrice?.amount;

  if (loading) {
    return (
      <main className="service-plan-detail-shell min-h-[70vh] bg-slate-50" aria-busy="true" aria-label="Đang tải chi tiết gói dịch vụ">
        <div className="shell py-10 sm:py-14 lg:py-16">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
            <div className="space-y-5">
              <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
              <div className="h-12 max-w-xl animate-pulse rounded bg-slate-200" />
              <div className="h-6 max-w-2xl animate-pulse rounded bg-slate-200" />
              <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !plan) {
    const notFound = error === "Không tìm thấy gói dịch vụ." || error?.toLowerCase().includes("not found");

    return (
      <main className="service-plan-detail-shell min-h-[70vh] bg-slate-50">
        <div className="shell py-10 sm:py-14 lg:py-16">
          <div className="panel mx-auto max-w-2xl p-8 text-center sm:p-12" role="alert">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl text-rose-700" aria-hidden="true">!</div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
              {notFound ? "Không tìm thấy gói dịch vụ" : "Không thể tải dữ liệu gói dịch vụ"}
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
              {notFound ? "Gói dịch vụ có thể đã được ẩn hoặc đường dẫn không còn tồn tại." : error ?? "Yêu cầu không thành công."}
            </p>
            <Link className="button-primary mt-7" href="/services">Quay lại danh sách dịch vụ</Link>
          </div>
        </div>
      </main>
    );
  }

  const hasDiscount = selectedPrice !== undefined && discountedPrice !== undefined && discountedPrice < selectedPrice.amount;
  const cycleLabel = billingCycle === 1 ? "tháng" : "năm";

  return (
    <main className="service-plan-detail-shell min-h-[70vh] bg-slate-50">
      <div className="shell py-10 sm:py-14 lg:py-16">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900" href="/services">
          <span aria-hidden="true">←</span>
          Tất cả dịch vụ
        </Link>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:gap-10">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{plan.categoryName}</p>
              {plan.isFeatured && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Phổ biến nhất</span>}
            </div>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{plan.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{plan.summary || "Gói dịch vụ được cấu hình linh hoạt theo nhu cầu của bạn."}</p>

            <section className="panel mt-8 overflow-hidden p-5 sm:p-8" aria-labelledby="plan-features-title">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Thông số dịch vụ</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950" id="plan-features-title">Cấu hình gói</h2>
                </div>
                <span className="text-sm text-slate-500">{plan.features.length} tính năng</span>
              </div>

              {plan.features.length > 0 ? (
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {plan.features.map(feature => (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4" key={feature.id}>
                      <dt className="text-sm text-slate-500">{feature.displayName || feature.featureKey}</dt>
                      <dd className="mt-2 text-lg font-bold text-slate-950">
                        {feature.value}
                        {feature.unit ? <span className="ml-1 font-semibold text-slate-700">{feature.unit}</span> : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600" role="status">Gói này chưa có thông tin cấu hình.</p>
              )}
            </section>
          </article>

          <aside className="panel h-fit p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Thông tin giá gói dịch vụ">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Bảng giá</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Giá gói dịch vụ</h2>

            <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Chu kỳ thanh toán">
              <button
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${billingCycle === 1 ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
                type="button"
                aria-pressed={billingCycle === 1}
                onClick={() => setBillingCycle(1)}
              >
                Theo tháng
              </button>
              <button
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${billingCycle === 12 ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
                type="button"
                aria-pressed={billingCycle === 12}
                onClick={() => setBillingCycle(12)}
              >
                Theo năm
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6" aria-live="polite">
              <p className="text-sm font-semibold text-slate-600">Giá theo {cycleLabel}</p>
              {selectedPrice ? (
                <>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatMoney(selectedPrice.amount, selectedPrice.currency)}</span>}
                    <span className={`text-3xl font-bold tracking-tight ${hasDiscount ? "text-rose-700" : "text-slate-950"}`}>
                      {formatMoney(discountedPrice ?? selectedPrice.amount, selectedPrice.currency)}
                    </span>
                  </div>
                  {billingCycle === 12 && <p className="mt-2 text-sm text-slate-500">Tương đương khoảng {formatMoney((discountedPrice ?? selectedPrice.amount) / 12, selectedPrice.currency)}/tháng</p>}
                </>
              ) : (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800" role="alert">Chưa có mức giá cho chu kỳ này.</p>
              )}
            </div>

            {applicablePromotions.length > 0 && (
              <div className="mt-5 space-y-2">
                {applicablePromotions.map(promotion => (
                  <div className={`rounded-lg p-3 text-sm leading-5 ${bestPromotion?.promotion === promotion ? "border border-rose-300 bg-rose-100 text-rose-800" : "bg-rose-50 text-rose-700"}`} key={promotion.id}>
                    <p className="font-semibold">{promotion.name} · mã {promotion.code}</p>
                    {bestPromotion?.promotion === promotion && <p className="mt-1 text-xs font-bold">Đang áp dụng cho chu kỳ này</p>}
                  </div>
                ))}
              </div>
            )}

            {plan.qrCodePath && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-sm font-semibold text-slate-700">Quét mã để xem nhanh gói này</p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <img className="mx-auto h-44 w-44 object-contain" src={`${apiBaseUrl}${plan.qrCodePath}`} alt={`Mã QR tới gói ${plan.name}`} width={176} height={176} />
                </div>
              </div>
            )}

            <Link className="button-primary mt-6 w-full" href={`/order?plan=${plan.slug}&cycle=${billingCycle}`}>Yêu cầu tư vấn</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
