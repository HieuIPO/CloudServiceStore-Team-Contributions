"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, catalogApi, type ServicePlan } from "@/lib/api";

const formatMoney = (value?: number, currency = "VND") =>
  value === undefined
    ? "Liên hệ"
    : new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function Price({ plan }: { plan: ServicePlan }) {
  if (typeof plan.promotionalMonthlyPrice !== "number") {
    return <p className="text-xl font-bold text-slate-900">{formatMoney(plan.currentMonthlyPrice, plan.currency)}<span className="text-sm font-normal text-slate-500">/tháng</span></p>;
  }

  return <div>
    <p className="text-sm text-slate-400 line-through">{formatMoney(plan.currentMonthlyPrice, plan.currency)}</p>
    <p className="text-xl font-bold text-rose-700">{formatMoney(plan.promotionalMonthlyPrice, plan.currency)}<span className="text-sm font-normal text-slate-500">/tháng</span></p>
    <p className="mt-1 text-xs font-semibold text-rose-700">{plan.activePromotion?.name} · mã {plan.activePromotion?.code}</p>
  </div>;
}

export function PublicPlanCatalog({ pricing = false }: { pricing?: boolean }) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try { setPlans((await catalogApi.publicPlans()).items); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Không thể kết nối API."); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const shown = useMemo(() => plans.filter(x => `${x.name} ${x.categoryName}`.toLowerCase().includes(query.toLowerCase())), [plans, query]);

  if (loading) return <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(x => <div className="h-64 animate-pulse rounded-2xl bg-slate-200" key={x} />)}</div>;
  if (error) return <div role="alert" className="panel p-6 text-center text-red-700"><p>{error}</p><button className="button-secondary mt-4" onClick={() => void load()}>Thử lại</button></div>;
  if (!plans.length) return <div className="panel p-10 text-center"><h2 className="font-semibold">Chưa có gói dịch vụ công khai</h2><p className="mt-2 text-sm text-slate-500">Quản trị viên cần thêm và kích hoạt gói dịch vụ trước.</p></div>;

  return <><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row"><p className="text-sm text-slate-500">{shown.length} gói dịch vụ đang mở bán</p><input className="field mt-0 sm:w-72" placeholder="Tìm VPS, Hosting..." value={query} onChange={e => setQuery(e.target.value)} /></div>{!shown.length ? <div className="panel p-8 text-center text-slate-500">Không có gói phù hợp với từ khóa.</div> : <div className={pricing ? "overflow-x-auto panel" : "grid gap-5 md:grid-cols-2 lg:grid-cols-3"}>{pricing ? <table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-slate-500"><tr><th className="p-4">Gói</th><th className="p-4">Dịch vụ</th><th className="p-4">Giá/tháng</th><th className="p-4">Hành động</th></tr></thead><tbody>{shown.map(plan => <tr className="border-b last:border-0" key={plan.id}><td className="p-4 font-semibold">{plan.name}</td><td className="p-4 text-slate-600">{plan.categoryName}</td><td className="p-4"><Price plan={plan} /></td><td className="p-4"><Link className="button-primary" href={`/services/${plan.slug}`}>Xem gói</Link></td></tr>)}</tbody></table> : shown.map(plan => <article className="panel flex flex-col p-6" key={plan.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-sky-700">{plan.categoryName}</p><h2 className="mt-1 text-xl font-bold">{plan.name}</h2></div>{plan.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Nổi bật</span>}</div><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{plan.summary}</p><div className="mt-6"><Price plan={plan} /></div><Link className="button-primary mt-5" href={`/services/${plan.slug}`}>Chi tiết & QR</Link></article>)}</div>}</>;
}
