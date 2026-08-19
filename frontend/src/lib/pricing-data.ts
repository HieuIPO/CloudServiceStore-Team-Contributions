import type { ActivePromotion, PlanPrice, Promotion, ServicePlan, ServicePlanDetail } from "@/lib/api";

export type BillingCycle = 1 | 12;
export type PricingSpecKey = "CPU" | "RAM" | "SSD/NVMe" | "Băng thông" | "IP riêng" | "Backup" | "Hỗ trợ kỹ thuật";

export type PricingPrice = {
  current: number;
  original?: number;
};

export type PricingPlan = {
  id: string;
  slug?: string;
  categoryName: string;
  name: string;
  summary: string;
  currency: string;
  isFeatured: boolean;
  isCustom: boolean;
  monthly?: PricingPrice;
  annual?: PricingPrice;
  promotionLabel?: string;
  specs: Record<PricingSpecKey, string>;
};

export const pricingSpecRows: Array<{ key: PricingSpecKey; label: string }> = [
  { key: "CPU", label: "CPU" },
  { key: "RAM", label: "RAM" },
  { key: "SSD/NVMe", label: "SSD/NVMe" },
  { key: "Băng thông", label: "Băng thông" },
  { key: "IP riêng", label: "IP riêng" },
  { key: "Backup", label: "Backup" },
  { key: "Hỗ trợ kỹ thuật", label: "Hỗ trợ kỹ thuật" },
];

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function getCountdownParts(now: number, end: number): CountdownParts {
  const remaining = Math.max(0, end - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: remaining === 0,
  };
}

export function getActivePromotion(promotions: Promotion[], now = Date.now()): Promotion | undefined {
  return promotions
    .filter(promotion => promotion.isActive
      && Date.parse(promotion.startsAt) <= now
      && Date.parse(promotion.endsAt) > now)
    .sort((left, right) => {
      const leftPercentage = left.discountType === 1 ? left.discountValue : 0;
      const rightPercentage = right.discountType === 1 ? right.discountValue : 0;
      return rightPercentage - leftPercentage || Date.parse(left.endsAt) - Date.parse(right.endsAt);
    })[0];
}

export function promotionAppliesToCycle(promotion: Pick<ActivePromotion, "billingCycle">, billingCycle: BillingCycle) {
  return promotion.billingCycle == null || promotion.billingCycle === billingCycle;
}

export function formatPromotionValue(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

export function formatPromotionDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function getPromotionSavingsLabel(promotion: Pick<Promotion, "discountType" | "discountValue" | "billingCycle"> | undefined, billingCycle: BillingCycle = 12) {
  if (!promotion || !promotionAppliesToCycle(promotion, billingCycle)) return undefined;
  return promotion.discountType === 1
    ? `Tiết kiệm ${formatPromotionValue(promotion.discountValue)}%`
    : `Giảm ${formatMoney(promotion.discountValue)}`;
}

export function formatMoney(value: number | undefined, currency = "VND") {
  if (value === undefined) return "Liên hệ";
  const formatted = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
  return currency === "VND" ? `${formatted}đ` : `${formatted} ${currency}`;
}

export function getActivePlanPrice(detail: ServicePlanDetail | undefined, cycle: BillingCycle, now = Date.now()): PlanPrice | undefined {
  return detail?.prices
    .filter(price => price.billingCycle === cycle
      && price.isActive
      && Date.parse(price.effectiveFrom) <= now
      && (!price.effectiveTo || Date.parse(price.effectiveTo) > now))
    .sort((left, right) => Date.parse(right.effectiveFrom) - Date.parse(left.effectiveFrom))[0];
}

export function getBestPromotion<T extends Pick<ActivePromotion, "discountType" | "discountValue" | "billingCycle">>(amount: number, promotions: T[], billingCycle?: BillingCycle): { promotion: T; price: number } | undefined {
  const eligiblePromotions = billingCycle === undefined
    ? promotions
    : promotions.filter(promotion => promotionAppliesToCycle(promotion, billingCycle));
  const candidates = eligiblePromotions.map(promotion => ({
    promotion,
    price: promotion.discountType === 1
      ? Math.max(0, Math.round(amount * (1 - promotion.discountValue / 100)))
      : Math.max(0, amount - promotion.discountValue),
  }));
  return candidates.sort((left, right) => left.price - right.price)[0];
}

export function getBestPromotionPrice<T extends Pick<ActivePromotion, "discountType" | "discountValue" | "billingCycle">>(amount: number, promotions: T[], billingCycle?: BillingCycle): number | undefined {
  return getBestPromotion(amount, promotions, billingCycle)?.price;
}

const preferredPlanNames = ["VPS Start 2", "VPS Business 4", "Cloud Server Pro 8"];

export function buildPricingPlans(plans: ServicePlan[], details: Record<string, ServicePlanDetail>): PricingPlan[] {
  const preferred = preferredPlanNames
    .map(name => plans.find(plan => plan.name.toLocaleLowerCase("vi-VN") === name.toLocaleLowerCase("vi-VN")))
    .filter((plan): plan is ServicePlan => Boolean(plan));
  const infrastructurePlans = plans.filter(plan => /vps|hosting|cloud|server/i.test(`${plan.categoryName} ${plan.name}`));
  const candidates = [...preferred, ...infrastructurePlans, ...plans].filter((plan, index, list) => list.findIndex(item => item.id === plan.id) === index);
  const selected = candidates.slice(0, 4).map(plan => mapPlan(plan, details[plan.id]));
  const enterprise = selected.find(plan => /enterprise/i.test(plan.name));
  const priced = selected.filter(plan => !/enterprise/i.test(plan.name)).slice(0, 3);
  return enterprise ? [...priced, enterprise] : priced;
}

function mapPlan(plan: ServicePlan, detail?: ServicePlanDetail): PricingPlan {
  const baseMonthly = getActivePlanPrice(detail, 1)?.amount ?? plan.currentMonthlyPrice;
  const baseAnnual = getActivePlanPrice(detail, 12)?.amount ?? (baseMonthly === undefined ? undefined : baseMonthly * 12);
  const activePromotions = detail?.activePromotions ?? [];
  const bestMonthlyPromotion = baseMonthly === undefined ? undefined : getBestPromotion(baseMonthly, activePromotions, 1);
  const bestAnnualPromotion = baseAnnual === undefined ? undefined : getBestPromotion(baseAnnual, activePromotions, 12);
  const promotionalMonthly = plan.promotionalMonthlyPrice ?? bestMonthlyPromotion?.price;
  const promotionalAnnual = bestAnnualPromotion?.price;
  const currentMonthly = promotionalMonthly ?? baseMonthly;
  const currentAnnual = promotionalAnnual ?? baseAnnual;
  const promotion = bestAnnualPromotion?.promotion ?? bestMonthlyPromotion?.promotion ?? plan.activePromotion ?? activePromotions[0];
  const promotionLabel = promotion?.name.match(/-?\d+%/)?.[0] ?? (promotion ? "Ưu đãi" : undefined);

  return {
    id: plan.id,
    slug: plan.slug,
    categoryName: plan.categoryName,
    name: plan.name,
    summary: plan.summary,
    currency: plan.currency,
    isFeatured: plan.isFeatured,
    isCustom: currentMonthly === undefined,
    monthly: currentMonthly === undefined ? undefined : { current: currentMonthly, original: promotionalMonthly === undefined ? undefined : baseMonthly },
    annual: currentAnnual === undefined ? undefined : { current: currentAnnual, original: promotionalAnnual === undefined ? undefined : baseAnnual },
    promotionLabel,
    specs: readSpecs(detail),
  };
}

function readSpecs(detail?: ServicePlanDetail): Record<PricingSpecKey, string> {
  const find = (keys: string[]) => {
    const feature = detail?.features.find(item => {
      const key = `${item.featureKey} ${item.displayName}`.toLocaleLowerCase("vi-VN");
      return keys.some(candidate => key.includes(candidate.toLocaleLowerCase("vi-VN")));
    });
    return feature ? [feature.value, feature.unit].filter(Boolean).join(" ") : "Tùy chỉnh";
  };
  return {
    CPU: find(["cpu"]),
    RAM: find(["ram", "memory"]),
    "SSD/NVMe": find(["ssd", "storage", "disk"]),
    "Băng thông": find(["bandwidth", "băng thông", "traffic"]),
    "IP riêng": find(["ip", "địa chỉ"]),
    Backup: find(["backup", "sao lưu"]),
    "Hỗ trợ kỹ thuật": find(["support", "hỗ trợ"]),
  };
}
