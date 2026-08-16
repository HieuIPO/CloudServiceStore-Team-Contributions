import Link from "next/link";
import type { ServicePlan, ServicePlanDetail } from "@/lib/api";

type ServicePlanCardProps = {
  animationDelay?: number;
  plan: ServicePlan;
  detail?: ServicePlanDetail;
};

export function ServicePlanCard({ animationDelay = 0, plan, detail }: ServicePlanCardProps) {
  const featured = plan.isFeatured;
  const promotion = plan.activePromotion;
  const hasPromotion = typeof plan.promotionalMonthlyPrice === "number";
  const actionLabel = typeof plan.currentMonthlyPrice === "number" ? "Đăng ký ngay" : "Liên hệ tư vấn";
  const category = categoryTone(plan.categoryName);
  const features = (detail?.features ?? [])
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .slice(0, 4);

  return (
    <article className={`service-plan-card service-plan-card-enter group flex min-h-[22rem] flex-col rounded-2xl border p-4 transition duration-200 hover:-translate-y-1 ${
      featured
        ? "service-plan-card-featured border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-600/25"
        : "border-slate-200 bg-white text-slate-950 shadow-sm hover:border-blue-300 hover:shadow-lg"
    }`} style={{ animationDelay: `${animationDelay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${featured ? "bg-white/15 text-white" : category.badge}`}>{plan.categoryName}</span>
        <div className="flex max-w-[65%] flex-wrap justify-end gap-2">
          {featured && <span className="inline-flex items-center gap-1 rounded-md bg-amber-300 px-2.5 py-1 text-[11px] font-black text-blue-950"><StarIcon /> Phổ biến nhất</span>}
          {promotion && <span className={`rounded-md px-2.5 py-1 text-[11px] font-black ${featured ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}>{promotion.name}</span>}
          {!promotion && hasPromotion && <span className={`rounded-md px-2.5 py-1 text-[11px] font-black ${featured ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}>Đang ưu đãi</span>}
          {plan.qrCodePath && <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${featured ? "text-blue-100" : "text-slate-500"}`}><QrIcon /> QR sẵn sàng</span>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className={`service-plan-card-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${featured ? "bg-white/15" : "bg-blue-50"}`}>
          <ServiceIcon categoryName={plan.categoryName} featured={featured} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black leading-tight sm:text-xl">{plan.name}</h3>
          <p className={`mt-1 min-h-10 text-[13px] leading-5 ${featured ? "text-blue-100" : "text-slate-600"}`}>{plan.summary}</p>
        </div>
      </div>

      <div className={`mt-3 border-t pt-3 ${featured ? "border-white/20" : "border-slate-200"}`}>
        <PlanPrice plan={plan} featured={featured} />
      </div>

      <FeatureList features={features} featured={featured} hasDetail={Boolean(detail)} />

      <div className="mt-auto grid gap-2 pt-3 sm:grid-cols-2">
        <Link className={`inline-flex min-w-0 whitespace-nowrap min-h-11 items-center justify-center rounded-xl border px-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3 sm:text-sm ${
          featured
            ? "border-white/80 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-blue-600"
            : "border-blue-500 text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-700 focus-visible:ring-offset-white"
        }`} href={`/services/${plan.slug}`}>Xem chi tiết</Link>
        <Link className={`inline-flex min-w-0 whitespace-nowrap min-h-11 items-center justify-center rounded-xl px-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3 sm:text-sm ${
          featured
            ? "bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-white focus-visible:ring-offset-blue-600"
            : "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-700 focus-visible:ring-offset-white"
        }`} href={`/order?plan=${encodeURIComponent(plan.slug)}`}>{actionLabel}</Link>
      </div>
    </article>
  );
}

function FeatureList({
  features,
  featured,
  hasDetail,
}: {
  features: ServicePlanDetail["features"];
  featured: boolean;
  hasDetail: boolean;
}) {
  return (
    <div className={`service-feature-list mt-3 min-h-[4.5rem] border-t pt-3 ${featured ? "border-white/20" : "border-slate-200"}`}>
      {features.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Thông số gói dịch vụ">
          {features.map(feature => <FeatureItem feature={feature} featured={featured} key={feature.id} />)}
        </ul>
      ) : (
        <p className={`text-sm leading-6 ${featured ? "text-blue-100" : "text-slate-500"}`}>
          {hasDetail ? "Thông số đang được cập nhật." : "Đang tải thông số gói dịch vụ..."}
        </p>
      )}
    </div>
  );
}

function FeatureItem({ feature, featured }: { feature: ServicePlanDetail["features"][number]; featured: boolean }) {
  const value = [feature.value, feature.unit].filter(Boolean).join(" ");
  const fullLabel = [feature.displayName, value].filter(Boolean).join(" ");
  return (
    <li className={`flex min-w-0 items-start gap-2 text-xs leading-5 ${featured ? "text-blue-50" : "text-slate-600"}`} title={fullLabel}>
      <FeatureIcon featured={featured} name={feature.displayName} />
      <span className="min-w-0 truncate"><span className="font-semibold">{feature.displayName}</span>{value && <span className={`ml-1 ${featured ? "text-blue-100" : "text-slate-500"}`}>{value}</span>}</span>
    </li>
  );
}

function PlanPrice({ plan, featured }: { plan: ServicePlan; featured: boolean }) {
  const muted = featured ? "text-blue-100" : "text-slate-400";
  const period = /domain|ssl/i.test(plan.categoryName) ? "/năm" : "/tháng";
  if (typeof plan.currentMonthlyPrice !== "number") return <p className="text-2xl font-black">Liên hệ báo giá</p>;
  if (typeof plan.promotionalMonthlyPrice !== "number") return <p className="text-2xl font-black">{formatMoney(plan.currentMonthlyPrice, plan.currency)}<span className={`ml-1 text-sm font-semibold ${muted}`}>{period}</span></p>;
  return (
    <div>
      <p className={`text-sm line-through ${muted}`}>{formatMoney(plan.currentMonthlyPrice, plan.currency)}</p>
      <p className="text-2xl font-black">{formatMoney(plan.promotionalMonthlyPrice, plan.currency)}<span className={`ml-1 text-sm font-semibold ${muted}`}>{period}</span></p>
    </div>
  );
}

function ServiceIcon({ categoryName, featured }: { categoryName: string; featured: boolean }) {
  const category = categoryName.toLocaleLowerCase("vi-VN");
  const stroke = featured ? "#ffffff" : "#1769e8";
  const accent = featured ? "#bfdbfe" : category.includes("domain") ? "#7c3aed" : category.includes("email") ? "#0ea5e9" : category.includes("ssl") ? "#0f9f82" : category.includes("firewall") ? "#f97316" : "#60a5fa";

  return (
    <svg aria-hidden="true" className="h-10 w-10" fill="none" viewBox="0 0 64 64">
      {category.includes("domain") ? <><circle cx="32" cy="32" r="21" stroke={stroke} strokeWidth="3" /><path d="M11 32h42M32 11c6 6 9 13 9 21s-3 15-9 21c-6-6-9-13-9-21s3-15 9-21Z" stroke={accent} strokeWidth="3" /></> : category.includes("email") ? <><rect height="29" rx="4" stroke={stroke} strokeWidth="3" width="43" x="10.5" y="18" /><path d="m12 21 20 16 20-16" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></> : category.includes("ssl") ? <><path d="m32 9 17 7v14c0 12-8 20-17 25-9-5-17-13-17-25V16l17-7Z" fill={accent} fillOpacity=".2" stroke={stroke} strokeWidth="3" /><rect height="12" rx="2" stroke={stroke} strokeWidth="3" width="16" x="24" y="28" /><path d="M28 28v-4a4 4 0 0 1 8 0v4" stroke={accent} strokeWidth="3" /></> : category.includes("firewall") ? <><path d="M32 8 49 15v13c0 12-7 21-17 27-10-6-17-15-17-27V15l17-7Z" fill={accent} fillOpacity=".18" stroke={stroke} strokeWidth="3" /><path d="M32 21v13m0 7v.1" stroke={accent} strokeLinecap="round" strokeWidth="4" /></> : <><path d="M13 25h38v13H13zM17 15h30v10H17zM17 38h30v10H17z" fill={accent} fillOpacity=".2" stroke={stroke} strokeLinejoin="round" strokeWidth="3" /><path d="M19 20h.1m0 23h.1" stroke={accent} strokeLinecap="round" strokeWidth="4" /></>}
    </svg>
  );
}

function categoryTone(categoryName: string) {
  const category = categoryName.toLocaleLowerCase("vi-VN");
  if (category.includes("domain")) return { badge: "bg-violet-50 text-violet-700" };
  if (category.includes("email")) return { badge: "bg-sky-50 text-sky-700" };
  if (category.includes("ssl")) return { badge: "bg-emerald-50 text-emerald-700" };
  if (category.includes("firewall")) return { badge: "bg-orange-50 text-orange-700" };
  return { badge: "bg-blue-50 text-blue-700" };
}

const formatMoney = (value: number, currency = "VND") => new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

type FeatureIconKind = "cpu" | "ram" | "ssd" | "bandwidth" | "ip" | "backup" | "support" | "uptime" | "generic";

function featureIconKind(name: string): FeatureIconKind {
  const label = name.toLocaleLowerCase("vi-VN");
  if (label.includes("cpu")) return "cpu";
  if (label.includes("ram")) return "ram";
  if (label.includes("ssd") || label.includes("nvme") || label.includes("disk")) return "ssd";
  if (label.includes("băng thông") || label.includes("bandwidth")) return "bandwidth";
  if (label.includes("ip")) return "ip";
  if (label.includes("backup") || label.includes("sao lưu")) return "backup";
  if (label.includes("hỗ trợ") || label.includes("support")) return "support";
  if (label.includes("uptime") || label.includes("sẵn sàng")) return "uptime";
  return "generic";
}

function FeatureIcon({ featured, name }: { featured: boolean; name: string }) {
  const kind = featureIconKind(name);
  const stroke = featured ? "#dbeafe" : "#1769e8";
  const accent = featured ? "#93c5fd" : "#60a5fa";

  return (
    <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 64 64">
      {kind === "cpu" && <><rect height="28" rx="4" stroke={stroke} strokeWidth="3" width="28" x="18" y="18" /><rect height="14" rx="2" stroke={accent} strokeWidth="2.5" width="14" x="25" y="25" /><path d="M24 12v6m8-6v6m8-6v6M24 46v6m8-6v6m8-6v6M12 24h6m-6 8h6m-6 8h6m28-16h6m-6 8h6m-6 8h6" stroke={stroke} strokeLinecap="round" strokeWidth="2.5" /></>}
      {kind === "ram" && <><rect height="24" rx="3" stroke={stroke} strokeWidth="3" width="44" x="10" y="20" /><path d="M17 20v-5h30v5M17 44v5h30v-5M20 27h6v8h-6zm10 0h6v8h-6zm10 0h6v8h-6z" stroke={accent} strokeLinejoin="round" strokeWidth="2.5" /></>}
      {kind === "ssd" && <><rect height="44" rx="4" stroke={stroke} strokeWidth="3" width="32" x="16" y="10" /><path d="M24 20h16M24 28h11M24 36h14" stroke={accent} strokeLinecap="round" strokeWidth="2.5" /><circle cx="40" cy="44" fill={accent} r="3" /></>}
      {kind === "bandwidth" && <><circle cx="32" cy="32" r="21" stroke={stroke} strokeWidth="3" /><path d="M11 32h42M32 11c6 6 9 13 9 21s-3 15-9 21c-6-6-9-13-9-21s3-15 9-21Z" stroke={accent} strokeWidth="2.5" /></>}
      {kind === "ip" && <><circle cx="32" cy="32" r="21" stroke={stroke} strokeWidth="3" /><path d="M19 32h26M32 19c4 4 6 8 6 13s-2 9-6 13c-4-4-6-8-6-13s2-9 6-13Z" stroke={accent} strokeWidth="2.5" /><circle cx="32" cy="32" fill={accent} r="3" /></>}
      {kind === "backup" && <><path d="M20 45h24a9 9 0 0 0 0-18 13 13 0 0 0-25-1 8 8 0 0 0 1 19Z" fill={accent} fillOpacity=".16" stroke={stroke} strokeWidth="3" /><path d="M32 29v17m0-17-6 6m6-6 6 6" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></>}
      {kind === "support" && <><path d="M15 34v-4a17 17 0 0 1 34 0v4" stroke={stroke} strokeLinecap="round" strokeWidth="3" /><path d="M15 34h4v11h-4a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4Zm34 0h-4v11h4a4 4 0 0 0 4-4v-3a4 4 0 0 0-4-4ZM30 50h8" stroke={accent} strokeLinejoin="round" strokeWidth="3" /></>}
      {kind === "uptime" && <><path d="M13 39a20 20 0 1 1 38 0" stroke={stroke} strokeLinecap="round" strokeWidth="3" /><path d="m32 32 9-8" stroke={accent} strokeLinecap="round" strokeWidth="3" /><circle cx="32" cy="32" fill={accent} r="3" /><path d="M20 45h24" stroke={stroke} strokeLinecap="round" strokeWidth="3" /></>}
      {kind === "generic" && <><circle cx="32" cy="32" r="21" stroke={stroke} strokeWidth="3" /><path d="M32 29v13" stroke={accent} strokeLinecap="round" strokeWidth="3" /><circle cx="32" cy="22" fill={accent} r="2.5" /></>}
    </svg>
  );
}

function StarIcon() {
  return <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="m10 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L10 2Z" /></svg>;
}

function QrIcon() {
  return <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 18 18"><path d="M2 2h5v5H2zM11 2h5v5h-5zM2 11h5v5H2zM11 11h2v2h-2zm3 3h2v2h-2zm0-3h2" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}
