import type { Metadata } from "next";
import Link from "next/link";
import { ContactRequestForm } from "@/components/contact-request-form";
import { PublicPageBanner } from "@/components/public-page-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Liên hệ tư vấn Cloud",
  description: "Gửi yêu cầu tư vấn dịch vụ cloud, VPS, hosting và giải pháp hạ tầng cho doanh nghiệp.",
};

export default function ContactPage() {
  return <>
    <SiteHeader activeHref="/contact" />
    <main className="bg-[#fbfdff] text-[#10245a]">
      <PublicPageBanner breadcrumb="Liên hệ" description="Đội ngũ CloudServiceStore sẵn sàng lắng nghe nhu cầu và đề xuất giải pháp hạ tầng phù hợp với quy mô doanh nghiệp." eyebrow="Tư vấn giải pháp cloud" title="Kết nối với đội ngũ chuyên gia" actions={<Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700" href="/services">Xem dịch vụ</Link>} />
      <section className="shell grid gap-6 py-8 lg:grid-cols-[.72fr_1.28fr] lg:py-10">
        <div className="rounded-2xl border border-blue-100 bg-[#f1f8ff] p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">CloudServiceStore</p>
          <h2 className="mt-3 text-2xl font-black tracking-[-.035em] sm:text-3xl">Tư vấn rõ ràng, đồng hành lâu dài</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">Hãy cho chúng tôi biết mục tiêu, tải sử dụng hoặc vấn đề hạ tầng đang gặp phải. Chuyên viên sẽ liên hệ để làm rõ yêu cầu trước khi đề xuất gói dịch vụ.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <p className="rounded-lg border border-blue-100 bg-white px-4 py-3"><strong className="text-[#10245a]">Hỗ trợ 24/7:</strong> tiếp nhận nhu cầu và sự cố qua nhiều kênh.</p>
            <p className="rounded-lg border border-blue-100 bg-white px-4 py-3"><strong className="text-[#10245a]">Giải pháp linh hoạt:</strong> từ VPS, hosting đến cloud server doanh nghiệp.</p>
            <p className="rounded-lg border border-blue-100 bg-white px-4 py-3"><strong className="text-[#10245a]">Bảo mật thông tin:</strong> nội dung yêu cầu chỉ được dùng cho mục đích tư vấn.</p>
          </div>
        </div>
        <ContactRequestForm />
      </section>
    </main>
    <SiteFooter />
  </>;
}
