import type { Metadata } from "next";
import Link from "next/link";
import { CustomerIcon } from "@/components/customer-art";
import type { CustomerIconKind } from "@/components/customer-art";
import { CustomerExperience, type CustomerQrPlan } from "@/components/customer-experience";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { ServicePlan } from "@/lib/api";
import { formatMoney } from "@/lib/pricing-data";
import { getPublicLandingContent, getPublicServicePlans } from "@/lib/landing-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Khách hàng CloudServiceStore",
  description: "Đánh giá từ khách hàng, doanh nghiệp tiêu biểu và QR từng gói dịch vụ.",
};

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const params = await searchParams;
  const landing = await getPublicLandingContent(params.preview === "sample");
  const testimonials = landing?.testimonials ?? [];
  const logos = landing?.customerLogos?.slice(0, 10) ?? [];
  const qrPlans = (await getPublicServicePlans()).map(toCustomerQrPlan);

  return <><SiteHeader activeHref="/customers" /><main className="customers-page bg-[#fbfdff] text-[#10245a]">
    <PublicPageBanner actions={<><Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white" href="/services">Xem dịch vụ <ArrowIcon /></Link><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white/80 px-5 text-sm font-black text-blue-700" href="/order"><CustomerIcon kind="support" />Liên hệ tư vấn</Link></>} networkClassName="bg-[url('/assets/page-heroes/customers-hero.png')] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center" breadcrumb="Khách hàng" description="Những trải nghiệm thực tế là minh chứng cho chất lượng dịch vụ và sự đồng hành của chúng tôi." title="Khách hàng tin chọn CloudServiceStore" />

    <CustomerExperience logos={logos} qrPlans={qrPlans} testimonials={testimonials} />

    <ScrollReveal delay={80}><section className="shell pb-8 sm:pb-10"><div className="customer-cta relative overflow-hidden rounded-xl border border-blue-100 bg-[#f6fbff] px-5 py-6 sm:px-8 md:bg-[url('/assets/page-heroes/order-hero.png')] md:bg-[length:auto_125%] md:bg-[position:right_center] md:bg-no-repeat"><div className="relative z-10 max-w-2xl"><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Bắt đầu cùng CloudServiceStore</h2><p className="mt-2 text-sm leading-6 text-[#465f7d]">Chọn gói phù hợp hoặc liên hệ để được tư vấn cấu hình riêng.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white" href="/pricing">Xem bảng giá <ArrowIcon /></Link><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-5 text-sm font-black text-blue-700" href="/order"><CustomerIcon kind="support" />Yêu cầu tư vấn</Link></div></div></div></section></ScrollReveal>
  </main><SiteFooter /></>;
}

function toCustomerQrPlan(plan: ServicePlan): CustomerQrPlan {
  const monthlyPrice = plan.promotionalMonthlyPrice ?? plan.currentMonthlyPrice;
  return {
    id: plan.id,
    category: plan.categoryName,
    icon: customerPlanIcon(plan),
    name: plan.name,
    price: formatMoney(monthlyPrice, plan.currency),
    qrCodePath: plan.qrCodePath ?? `/api/v1/service-plans/${plan.id}/qr-code/image`,
    slug: plan.slug,
    specs: plan.summary,
  };
}

function customerPlanIcon(plan: ServicePlan): CustomerIconKind {
  const label = `${plan.categoryName} ${plan.name}`.toLocaleLowerCase("vi-VN");
  if (/email|mail/.test(label)) return "mail";
  if (/ssl|security|bảo mật|firewall/.test(label)) return "ssl";
  if (/cloud/.test(label)) return "cloud";
  if (/vps|hosting|server|storage|lưu trữ/.test(label)) return "server";
  return "support";
}

function ArrowIcon() {
  return <svg aria-hidden="true" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 20 20"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
