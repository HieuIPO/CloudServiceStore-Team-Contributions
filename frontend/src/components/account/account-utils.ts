import type { AffiliateStatus, CustomerOrderDetail, OrderStatus } from "@/lib/api";
import { getAffiliateStatusPresentation, getOrderStatusPresentation } from "@/lib/status-formatters";

export const formatAccountMoney = (amount: number, currency: string) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)} ${currency}`;

export const formatAccountDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export const accountStatusClass = (status: OrderStatus) => {
  switch (getOrderStatusPresentation(status).group) {
    case "completed": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected": return "border-rose-200 bg-rose-50 text-rose-700";
    case "cancelled": return "border-slate-200 bg-slate-100 text-slate-700";
    case "inProgress": return "border-blue-200 bg-blue-50 text-blue-700";
    default: return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

export const accountStatusLabel = (status: OrderStatus) => getOrderStatusPresentation(status).label;

export const accountAffiliateStatusClass = (status: AffiliateStatus) => {
  switch (getAffiliateStatusPresentation(status).group) {
    case "completed": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected": return "border-rose-200 bg-rose-50 text-rose-700";
    case "inProgress": return "border-blue-200 bg-blue-50 text-blue-700";
    default: return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

export const accountAffiliateStatusLabel = (status: AffiliateStatus) => getAffiliateStatusPresentation(status).label;

export const readSpecification = (detail: CustomerOrderDetail): Array<{ displayName?: string; value?: string; unit?: string; featureKey?: string }> => {
  try {
    const parsed = JSON.parse(detail.specificationSnapshot) as unknown;
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "object" && item !== null) as Array<{ displayName?: string; value?: string; unit?: string; featureKey?: string }> : [];
  } catch {
    return [];
  }
};
