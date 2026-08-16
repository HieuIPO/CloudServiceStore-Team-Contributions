import { GiftIcon } from "@/components/pricing-art";
import type { Promotion } from "@/lib/api";
import { formatMoney, formatPromotionDate, formatPromotionValue, type BillingCycle, type CountdownParts } from "@/lib/pricing-data";

type BannerPromotion = Pick<Promotion, "name" | "discountType" | "discountValue" | "billingCycle" | "endsAt" | "servicePlanIds">;

export function PricingPromotionBanner({ billingCycle, countdown, promotion }: { billingCycle: BillingCycle; countdown: CountdownParts; promotion: BannerPromotion }) {
  const discount = promotion.discountType === 1
    ? `Tiết kiệm đến ${formatPromotionValue(promotion.discountValue)}%`
    : `Giảm ${formatMoney(promotion.discountValue)}`;
  const scope = promotion.servicePlanIds.length ? `${promotion.servicePlanIds.length} gói đã chọn` : "các gói đã chọn";
  const targetCycle = promotion.billingCycle === 1 ? "tháng" : promotion.billingCycle === 12 ? "năm" : null;
  const selectedCycle = billingCycle === 12 ? "năm" : "tháng";
  const description = targetCycle && targetCycle !== selectedCycle
    ? `${discount} khi thanh toán theo ${targetCycle} cho ${scope}. Chọn "Theo ${targetCycle}" để xem giá.`
    : `${discount} khi thanh toán theo ${targetCycle ?? `chu kỳ ${selectedCycle}`} cho ${scope}.`;

  return (
    <section aria-label="Khuyến mãi bảng giá" className="pricing-promotion-banner grid min-h-[7rem] gap-4 rounded-xl border border-blue-200 bg-[linear-gradient(100deg,#f8fbff_0%,#eef7ff_100%)] px-5 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_20rem] sm:items-center sm:px-7">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_3px_10px_rgba(28,93,167,.12)]"><GiftIcon /></div>
      <div className="min-w-0">
        <h2 className="text-base font-black text-[#10245a] sm:text-lg">{promotion.name} – Đăng ký trước {formatPromotionDate(promotion.endsAt)}</h2>
        <p className="mt-1 text-xs leading-4 text-slate-500 sm:text-[13px]">{description}</p>
        {countdown.expired && <p className="text-[11px] font-bold text-rose-600" role="status">Chương trình đã kết thúc.</p>}
      </div>
      <div aria-label={countdown.expired ? "Khuyến mãi đã hết hạn" : "Thời gian còn lại của khuyến mãi"} className="grid grid-cols-4 gap-2 text-center" role="timer">
        <CountdownBox label="Ngày" value={countdown.days} />
        <CountdownBox label="Giờ" value={countdown.hours} />
        <CountdownBox label="Phút" value={countdown.minutes} />
        <CountdownBox label="Giây" value={countdown.seconds} />
      </div>
    </section>
  );
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  return <div className="grid min-h-[3.75rem] place-items-center rounded-lg border border-slate-200 bg-white px-2 py-2"><div><p className="text-xl font-black leading-6 text-[#10245a]"><span className="pricing-countdown-value" key={value}>{String(value).padStart(2, "0")}</span></p><p className="mt-0.5 text-[11px] text-slate-500">{label}</p></div></div>;
}
