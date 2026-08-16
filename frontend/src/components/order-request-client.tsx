"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, catalogApi, orderApi, type OrderConfirmation, type ServicePlan, type ServicePlanDetail } from "@/lib/api";
import { refreshSession } from "@/lib/api";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";
import { getActivePlanPrice, getBestPromotionPrice } from "@/lib/pricing-data";
import { OrderCloudArt, OrderIcon } from "@/components/order-art";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";

type OrderForm = {
  servicePlanId: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  billingCycle: 1 | 12;
  note: string;
};

const emptyForm: OrderForm = { servicePlanId: "", customerName: "", email: "", phoneNumber: "", companyName: "", billingCycle: 1, note: "" };
const liveApiEnabled = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim());

const samplePlans: ServicePlan[] = [
  { id: "sample-cloud-ssd-2", categoryId: "cloud-server", categoryName: "Cloud Server", name: "Cloud Server SSD 2", slug: "cloud-server-ssd-2", summary: "2 vCPU, 4GB RAM, 80GB SSD", isFeatured: true, isActive: true, currentMonthlyPrice: 880000, promotionalMonthlyPrice: 792000, currency: "VND", activePromotion: { id: "sample-promo", code: "CLOUD10", name: "Ưu đãi tháng 5", discountType: 1, discountValue: 10 } },
  { id: "sample-cloud-ssd-4", categoryId: "cloud-server", categoryName: "Cloud Server", name: "Cloud Server SSD 4", slug: "cloud-server-ssd-4", summary: "4 vCPU, 8GB RAM, 160GB SSD", isFeatured: false, isActive: true, currentMonthlyPrice: 1490000, promotionalMonthlyPrice: 1341000, currency: "VND", activePromotion: { id: "sample-promo", code: "CLOUD10", name: "Ưu đãi tháng 5", discountType: 1, discountValue: 10 } },
  { id: "sample-vps-start-2", categoryId: "vps", categoryName: "VPS", name: "VPS Start 2", slug: "vps-start-2", summary: "2 vCPU, 2GB RAM, 80GB NVMe", isFeatured: false, isActive: true, currentMonthlyPrice: 199000, currency: "VND" },
  { id: "sample-hosting-pro", categoryId: "hosting", categoryName: "Hosting", name: "Hosting Pro", slug: "hosting-pro", summary: "10GB SSD, website tốc độ cao", isFeatured: false, isActive: true, currentMonthlyPrice: 129000, currency: "VND" },
];

const money = (value: number, currency: string) => `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} ${currency}`;
const number = (value: number, currency = "VND") => money(value, currency);

export function OrderRequestClient({ initialBillingCycle = 1, initialPlanSlug, samplePreview = false }: { initialBillingCycle?: 1 | 12; initialPlanSlug?: string; samplePreview?: boolean }) {
  const initialPlan = samplePlans.find(item => item.slug === initialPlanSlug);
  const [plans, setPlans] = useState<ServicePlan[]>(samplePlans);
  const [planDetails, setPlanDetails] = useState<Record<string, ServicePlanDetail>>({});
  const [category, setCategory] = useState(initialPlan?.categoryName ?? "");
  const [form, setForm] = useState<OrderForm>({ ...emptyForm, billingCycle: initialBillingCycle, servicePlanId: initialPlan?.id ?? "" });
  const [loading, setLoading] = useState(liveApiEnabled && !samplePreview);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [customerAccount, setCustomerAccount] = useState<AuthenticatedUser | null>(null);
  const [accountChecked, setAccountChecked] = useState(samplePreview);

  useEffect(() => {
    if (samplePreview) {
      return;
    }
    let subscribed = true;
    const applyAccount = (user: AuthenticatedUser | null) => {
      if (!subscribed) return;
      if (!user?.roles.includes("Customer")) {
        setAccountChecked(true);
        return;
      }
      setCustomerAccount(user);
      setForm(current => ({ ...current, customerName: user.fullName, email: user.email }));
      setAccountChecked(true);
    };
    const current = getCurrentUser();
    if (current) applyAccount(current);
    else void refreshSession().then(applyAccount).catch(() => {
      if (subscribed) setAccountChecked(true);
    });
    return () => { subscribed = false; };
  }, [samplePreview]);

  useEffect(() => {
    if (!liveApiEnabled || samplePreview) return;
    void catalogApi.publicPlans()
      .then(result => {
        if (!result.items.length) return;
        setPlans(result.items);
        const selected = initialPlanSlug ? result.items.find(item => item.slug === initialPlanSlug) : undefined;
        if (selected) {
          setCategory(selected.categoryName);
          setForm(current => ({ ...current, servicePlanId: selected.id }));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [initialPlanSlug, samplePreview]);

  useEffect(() => {
    if (!liveApiEnabled || samplePreview || !form.servicePlanId) return;

    let subscribed = true;
    const timer = window.setTimeout(() => {
      setDetailLoading(true);
      void catalogApi.plan(form.servicePlanId)
        .then(detail => {
          if (!subscribed) return;
          setPlanDetails(current => ({ ...current, [form.servicePlanId]: detail }));
        })
        .catch(() => undefined)
        .finally(() => {
          if (subscribed) setDetailLoading(false);
        });
    }, 0);

    return () => {
      subscribed = false;
      window.clearTimeout(timer);
    };
  }, [form.servicePlanId, samplePreview]);

  const categories = useMemo(() => Array.from(new Set(["Cloud Server", "VPS", "Hosting", ...plans.map(item => item.categoryName)])), [plans]);
  const categoryPlans = useMemo(() => plans.filter(plan => plan.categoryName === category), [category, plans]);
  const planOptions = category ? (categoryPlans.length ? categoryPlans : plans) : [];
  const selectedPlan = useMemo(() => plans.find(item => item.id === form.servicePlanId), [form.servicePlanId, plans]);
  const selectedDetail = selectedPlan ? planDetails[selectedPlan.id] : undefined;
  const pricing = useMemo(() => {
    if (!selectedPlan) return { base: 0, discount: 0, total: 0, hasPrice: false, loading: false };
    const monthly = selectedPlan.currentMonthlyPrice ?? 0;
    const selectedPrice = getActivePlanPrice(selectedDetail, form.billingCycle);
    const fallbackBase = form.billingCycle === 12 ? monthly * 12 : monthly;
    const base = selectedPrice?.amount ?? (samplePreview ? fallbackBase : 0);
    const livePromotion = selectedDetail ? getBestPromotionPrice(base, selectedDetail.activePromotions, form.billingCycle) : undefined;
    const previewPromotion = samplePreview
      ? form.billingCycle === 12
        ? Math.round(base * .8)
        : selectedPlan.promotionalMonthlyPrice
      : undefined;
    const publicMonthlyPromotion = !samplePreview
      && form.billingCycle === 1
      && typeof selectedPlan.promotionalMonthlyPrice === "number"
      ? selectedPlan.promotionalMonthlyPrice
      : undefined;
    const discounted = livePromotion ?? previewPromotion ?? publicMonthlyPromotion;
    const discount = typeof discounted === "number" ? Math.max(0, base - discounted) : 0;
    const total = base - discount;
    return {
      base,
      discount,
      total,
      hasPrice: Boolean(selectedPrice) || (samplePreview && Boolean(selectedPlan)),
      loading: !samplePreview && detailLoading && !selectedDetail,
    };
  }, [detailLoading, form.billingCycle, samplePreview, selectedDetail, selectedPlan]);

  const updateForm = <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => setForm(current => ({ ...current, [field]: value }));
  const changeCategory = (value: string) => {
    setCategory(value);
    updateForm("servicePlanId", "");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlan) {
      setError("Vui lòng chọn dịch vụ và gói / cấu hình trước khi gửi yêu cầu.");
      return;
    }
    if (!samplePreview && !customerAccount) {
      setError("Vui lòng đăng nhập tài khoản khách hàng trước khi gửi yêu cầu.");
      return;
    }
    if (!samplePreview && !pricing.hasPrice) {
      setError("Chu kỳ thanh toán này chưa có mức giá đang hiệu lực cho gói đã chọn.");
      return;
    }
    setSubmitting(true);
    setError(null);

    if (samplePreview) {
      setConfirmation({ id: "PREVIEW-ORDER-001", status: 1, planName: selectedPlan.name, billingCycle: form.billingCycle, quotedAmount: pricing.total, currency: selectedPlan.currency || "VND", createdAt: new Date().toISOString() });
      setForm(current => ({ ...emptyForm, servicePlanId: current.servicePlanId }));
      setSubmitting(false);
      return;
    }

    void orderApi.create({ ...form, companyName: form.companyName || null, note: form.note || null })
      .then(result => { setConfirmation(result); setForm(current => ({ ...emptyForm, servicePlanId: current.servicePlanId, customerName: customerAccount?.fullName ?? "", email: customerAccount?.email ?? "" })); })
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "Không thể gửi yêu cầu. Vui lòng thử lại."))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <main className="shell py-12"><div className="h-[34rem] animate-pulse rounded-2xl bg-slate-100" /></main>;

  return <main className="order-page bg-[#fbfdff] text-[#10245a]">
    <PublicPageBanner
      networkClassName="order-network bg-[url('/assets/page-heroes/order-hero.png')] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center"
      breadcrumb="Yêu cầu dịch vụ"
      description="Để lại thông tin nhu cầu, cấu hình mong muốn và thời gian triển khai. Đội ngũ CloudServiceStore sẽ tư vấn giải pháp phù hợp, báo giá rõ ràng và hỗ trợ bạn từ lúc lựa chọn đến khi dịch vụ vận hành ổn định."
      eyebrow="Tư vấn cấu hình và triển khai"
      title="Liên hệ / Đặt dịch vụ"
    />
    <ScrollReveal className="order-content-reveal" delay={80}>
    <section className="shell py-7 sm:py-8"><div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,.92fr)] lg:items-start">
      <div className="min-w-0"><section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><OrderIcon kind="document" /></span><h2 className="text-base font-black">Thông tin đăng ký</h2></div>{!samplePreview && accountChecked && !customerAccount && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">Để gửi yêu cầu và theo dõi tiến trình, vui lòng <Link className="font-black text-blue-700 underline" href="/account/login?returnTo=%2Forder">đăng nhập tài khoản khách hàng</Link> trước.</p>}{error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{pricing.loading && <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700" role="status">Đang tải giá theo chu kỳ đã chọn...</p>}{!pricing.loading && selectedPlan && !pricing.hasPrice && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Gói này chưa có mức giá đang hiệu lực cho chu kỳ đã chọn.</p>}<form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submit}><FormField label="Chọn dịch vụ" required><select className="order-field" value={category} onChange={event => changeCategory(event.target.value)} required><option value="">Chọn dịch vụ</option>{categories.map(item => <option key={item}>{item}</option>)}</select></FormField><FormField label="Chọn gói / cấu hình" required><select className="order-field" disabled={!category || !planOptions.length} value={form.servicePlanId} onChange={event => updateForm("servicePlanId", event.target.value)} required><option value="">Chọn gói / cấu hình</option>{planOptions.map(plan => <option key={plan.id} value={plan.id}>{plan.name} ({plan.summary})</option>)}</select></FormField><fieldset className="sm:col-span-2"><legend className="text-xs font-bold">Chu kỳ thanh toán</legend><div className="mt-1 grid grid-cols-2 overflow-hidden rounded-lg border border-blue-100"><CycleButton active={form.billingCycle === 1} icon="calendar" label="Theo tháng" onClick={() => updateForm("billingCycle", 1)} /><CycleButton active={form.billingCycle === 12} icon="calendar" label="Theo năm" onClick={() => updateForm("billingCycle", 12)} /></div></fieldset><FormField label="Họ và tên" required><input className="order-field" maxLength={160} readOnly={Boolean(customerAccount)} required value={form.customerName} onChange={event => updateForm("customerName", event.target.value)} /></FormField><FormField label="Email" required><input className="order-field" maxLength={256} readOnly={Boolean(customerAccount)} required type="email" value={form.email} onChange={event => updateForm("email", event.target.value)} /></FormField><FormField label="Số điện thoại" required><input className="order-field" maxLength={30} minLength={8} required type="tel" value={form.phoneNumber} onChange={event => updateForm("phoneNumber", event.target.value)} /></FormField><FormField label="Tên công ty (nếu có)"><input className="order-field" maxLength={160} value={form.companyName} onChange={event => updateForm("companyName", event.target.value)} /></FormField><FormField className="sm:col-span-2" label="Nhu cầu / ghi chú thêm"><textarea className="order-field min-h-20 resize-y" maxLength={1000} placeholder="Mô tả nhu cầu, cấu hình mong muốn hoặc yêu cầu đặc biệt..." value={form.note} onChange={event => updateForm("note", event.target.value)} /></FormField><label className="flex items-start gap-2 text-xs leading-5 text-slate-600 sm:col-span-2"><input className="mt-1 h-4 w-4 accent-blue-600" type="checkbox" required /> <span>Tôi đồng ý với <Link className="font-bold text-blue-700 underline" href="/about">điều khoản dịch vụ</Link></span></label><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2" disabled={submitting || !accountChecked || (!samplePreview && !customerAccount) || pricing.loading || (!samplePreview && !pricing.hasPrice)} type="submit"><OrderIcon kind="send" />{submitting ? "Đang gửi..." : "Gửi yêu cầu đặt dịch vụ"}</button></form></section>{confirmation && <SuccessCard confirmation={confirmation} customerAccount={customerAccount} onReset={() => setConfirmation(null)} />}</div>
      <OrderSummary billingCycle={form.billingCycle} plan={selectedPlan} pricing={pricing} />
    </div></section>
    </ScrollReveal>
  </main>;
}

function FormField({ children, className = "", label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) {
  return <label className={`block text-xs font-bold text-[#10245a] ${className}`}>{label}{required && <span className="ml-1 text-blue-600">*</span>}{children}</label>;
}

function CycleButton({ active, icon, label, onClick }: { active: boolean; icon: "calendar"; label: string; onClick: () => void }) {
  return <button className={active ? "inline-flex min-h-10 items-center justify-center gap-2 bg-blue-600 px-3 text-sm font-bold text-white" : "inline-flex min-h-10 items-center justify-center gap-2 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50"} onClick={onClick} type="button"><OrderIcon className="h-4 w-4" kind={icon} />{label}</button>;
}

function OrderSummary({ billingCycle, plan, pricing }: { billingCycle: 1 | 12; plan?: ServicePlan; pricing: { base: number; discount: number; total: number; hasPrice: boolean; loading: boolean } }) {
  const currency = plan?.currency || "VND";
  const priceLabel = pricing.loading ? "Đang tải..." : pricing.hasPrice ? money(pricing.base, currency) : "Chưa cấu hình";
  const discountLabel = pricing.loading ? "Đang tải..." : pricing.hasPrice ? `-${money(pricing.discount, currency)}` : "—";
  const totalLabel = pricing.loading ? "Đang tải..." : pricing.hasPrice ? number(pricing.total, currency) : "Chưa cấu hình";
  return <aside className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm"><div className="relative p-5 sm:p-6"><div className="absolute right-3 top-2 h-32 w-44 opacity-90"><OrderCloudArt /></div><div className="relative z-10 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><OrderIcon kind="clipboard" /></span><h2 className="text-base font-black">Tóm tắt đơn hàng</h2></div><div className="relative z-10 mt-6 divide-y divide-blue-50 text-sm"><SummaryRow label="Dịch vụ đã chọn" value={plan?.categoryName ?? "Chưa chọn dịch vụ"} /><SummaryRow label="Gói / cấu hình" value={plan ? `${plan.name} (${plan.summary})` : "Chưa chọn gói / cấu hình"} /><SummaryRow label="Chu kỳ thanh toán" value={billingCycle === 1 ? "Theo tháng" : "Theo năm"} /><SummaryRow label="Giá gốc" value={priceLabel} />{(pricing.loading || (pricing.hasPrice && pricing.discount > 0)) && <SummaryRow className="text-emerald-600" label="Khuyến mãi" value={discountLabel} />}</div><div className="mt-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-black text-blue-700"><span>Tổng dự kiến</span><strong className="text-xl">{totalLabel}</strong></div><SupportContact /><SecurityNote /></div></aside>;
}

function SummaryRow({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return <div className={`grid grid-cols-[9rem_1fr] gap-3 py-3 text-xs ${className}`}><span className="text-slate-600">{label}</span><span className="font-medium text-[#10245a]">{value}</span></div>;
}

function SupportContact() {
  return <div className="mt-4 grid gap-3 border-b border-blue-50 pb-4 sm:grid-cols-[.9fr_1.1fr] sm:items-center"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-blue-50 text-blue-600"><OrderIcon className="h-8 w-8" kind="headset" /></span><div><p className="text-xs font-bold text-slate-600">Hotline hỗ trợ 24/7</p><p className="text-xl font-black text-blue-600">1900 6868</p></div></div><div className="border-t border-blue-50 pt-3 text-xs text-slate-600 sm:border-l sm:border-t-0 sm:pl-5"><p className="flex items-center gap-2"><OrderIcon kind="mail" />support@cloudservicestore.vn</p><p className="mt-2 flex items-center gap-2"><OrderIcon kind="globe" />www.cloudservicestore.vn</p></div></div>;
}

function SecurityNote() {
  return <div className="mt-4 rounded-xl bg-[linear-gradient(145deg,#f1f7ff,#eaf3ff)] p-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600"><OrderIcon kind="lock" /></span><div><h3 className="text-sm font-black text-blue-700">Thông tin của bạn được bảo mật an toàn.</h3><p className="mt-1 text-xs leading-5 text-slate-600">Mọi thông tin đăng ký của bạn được mã hóa và lưu trữ an toàn trên hệ thống CloudServiceStore và chỉ được xử lý bởi bộ phận quản trị.</p></div></div><div className="mt-4 grid gap-3 border-t border-blue-100 pt-4 text-xs sm:grid-cols-3"><SecurityStep label="Dữ liệu được mã hóa" /><SecurityStep label="Lưu trữ an toàn" /><SecurityStep label="Xử lý bởi hệ thống quản trị" /></div></div>;
}

function SecurityStep({ label }: { label: string }) {
  return <div className="flex items-center gap-2 text-slate-600"><span className="text-blue-600"><OrderIcon className="h-6 w-6" kind="lock" /></span><span>{label}</span></div>;
}

function SuccessCard({ confirmation, customerAccount, onReset }: { confirmation: OrderConfirmation; customerAccount: AuthenticatedUser | null; onReset: () => void }) {
  return <section className="mt-3 flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><OrderIcon kind="check" /></span><div className="min-w-0"><h2 className="text-base font-black text-emerald-700">Đăng ký thành công</h2><p className="mt-1 text-sm leading-5 text-slate-600">Yêu cầu của bạn đã được ghi nhận. Nhân viên tư vấn sẽ liên hệ với bạn trong thời gian sớm nhất.</p><p className="mt-2 text-xs text-slate-500">Mã yêu cầu: <b>{confirmation.id}</b></p>{customerAccount && <Link className="mt-3 inline-block text-xs font-bold text-blue-700 underline" href={`/account/orders/${confirmation.id}`}>Xem yêu cầu trong tài khoản</Link>}<button className="mt-3 block text-xs font-bold text-blue-700 underline" onClick={onReset} type="button">Gửi yêu cầu khác</button></div></section>;
}
