import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { AboutIcon, type AboutIconKind } from "@/components/about-art";
import { AboutMotionController, AboutSlaValue } from "@/components/about-motion";
import { PublicPageBanner } from "@/components/public-page-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicLandingContent } from "@/lib/landing-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Giới thiệu CloudServiceStore",
  description: "Lịch sử, hạ tầng Data Center, chứng chỉ và cam kết SLA của CloudServiceStore.",
};

const timeline = [
  { year: "2019", title: "Khởi đầu", text: "Bắt đầu với định hướng xây dựng hạ tầng Cloud ổn định, đồng hành cùng doanh nghiệp.", icon: "flag" as AboutIconKind },
  { year: "2021", title: "Mở rộng hạ tầng", text: "Đầu tư nâng cấp máy chủ, mạng lưới và khả năng vận hành để đáp ứng nhu cầu tăng trưởng.", icon: "server" as AboutIconKind },
  { year: "2023", title: "Phát triển hệ sinh thái", text: "Mở rộng danh mục dịch vụ từ VPS, Hosting đến Cloud Server, bảo mật và hỗ trợ vận hành.", icon: "network" as AboutIconKind },
  { year: "Hiện nay", title: "Đồng hành cùng doanh nghiệp", text: "Tập trung vào trải nghiệm khách hàng, tính sẵn sàng và giải pháp hạ tầng linh hoạt.", icon: "support" as AboutIconKind },
];

const infrastructureItems: { title: string; text: string; icon: AboutIconKind }[] = [
  { title: "Nguồn điện dự phòng", text: "Hệ thống UPS và máy phát điện N+1 đảm bảo nguồn điện liên tục, không gián đoạn.", icon: "uptime" },
  { title: "Mạng lưới ổn định", text: "Kết nối đa tuyến từ các nhà mạng lớn, băng thông cao và độ trễ thấp.", icon: "network" },
  { title: "Giám sát 24/7", text: "Giám sát hạ tầng liên tục bởi đội ngũ chuyên gia và hệ thống cảnh báo tự động.", icon: "monitor" },
  { title: "Sao lưu và bảo mật dữ liệu", text: "Sao lưu tự động đa lớp, tường lửa nhiều lớp và mã hóa dữ liệu an toàn.", icon: "lock" },
];

const certificates: { title: string; text: string; icon: AboutIconKind }[] = [
  { title: "ISO 27001", text: "Tiêu chuẩn quốc tế về quản lý an toàn thông tin.", icon: "iso" },
  { title: "ISO 9001", text: "Tiêu chuẩn về quản lý chất lượng và cải tiến liên tục.", icon: "iso" },
  { title: "Bảo mật dữ liệu", text: "Tuân thủ các tiêu chuẩn bảo mật, bảo vệ dữ liệu khách hàng.", icon: "shield" },
  { title: "Quy trình vận hành chuẩn", text: "Quy trình được chuẩn hóa, đảm bảo hiệu suất và ổn định.", icon: "process" },
];

const commitments: { title: string; text: string; icon: AboutIconKind }[] = [
  { title: "99.9% Uptime SLA", text: "Cam kết thời gian hoạt động đạt tối thiểu 99.9%. Hạ tầng được thiết kế dự phòng đa lớp để đảm bảo dịch vụ luôn sẵn sàng.", icon: "uptime" },
  { title: "24/7 Hỗ trợ kỹ thuật", text: "Đội ngũ kỹ thuật chuyên nghiệp luôn sẵn sàng hỗ trợ 24/7 qua nhiều kênh Hotline, Ticket, Email và Livechat.", icon: "support" },
  { title: "Giám sát hạ tầng liên tục", text: "Giám sát hệ thống 24/7 với công cụ hiện đại, cảnh báo sớm và xử lý sự cố nhanh chóng nhằm duy trì chất lượng dịch vụ.", icon: "monitor" },
];

export default async function AboutPage({ searchParams }: PageProps<"/about">) {
  const params = await searchParams;
  const landing = await getPublicLandingContent(params.preview === "sample");
  const content = landing?.content;
  const uptime = (content?.uptimeCommitment || "99.9%").replace("99,9", "99.9").replace(/\s*SLA/i, "");

  const uptimeValue = Number.parseFloat(uptime) || 99.9;
  const uptimeLabel = `${uptimeValue}%`;

  return <><SiteHeader activeHref="/about" /><main className="about-page bg-[#fbfdff] text-[#10245a]" data-about-motion-root>
    <AboutMotionController />
    <PublicPageBanner
      actions={<><Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700" href="/services">Xem dịch vụ <ArrowIcon /></Link><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white/80 px-5 text-sm font-black text-blue-700 transition hover:bg-white" href="/order"><AboutIcon className="h-4 w-4" kind="support" />Liên hệ tư vấn</Link></>}
      art={<><Image alt="Hạ tầng Cloud và máy chủ CloudServiceStore" className="object-cover object-right brightness-[.72] contrast-[1.16] saturate-[1.2]" fetchPriority="high" fill loading="eager" sizes="56vw" src="/hero/hero-cloud-03.webp" unoptimized /><div className="absolute inset-0 bg-gradient-to-r from-[#eef7ff] via-[#eef7ff]/10 to-transparent" /></>}
      artClassName="about-hero-art"
      breadcrumb="Giới thiệu"
      contentClassName="about-hero-content"
      description="CloudServiceStore cung cấp giải pháp cloud ổn định, an toàn và linh hoạt cho doanh nghiệp, giúp tối ưu hạ tầng và sẵn sàng tăng trưởng."
      eyebrow="Giới thiệu CloudServiceStore"
      title={content?.aboutTitle || "Hạ tầng vững chắc cho hành trình phát triển"}
    />

    <section className="shell py-7 sm:py-9"><div className="grid gap-7 lg:grid-cols-[.78fr_1.22fr] lg:items-stretch"><div className="relative min-h-[19rem] overflow-hidden rounded-xl border border-blue-100 bg-slate-950 shadow-sm sm:min-h-[23rem]"><Image alt="Phòng máy Data Center" className="object-cover object-right brightness-[.58] contrast-[1.24] saturate-[1.35]" fill sizes="(min-width:1024px) 38vw, 100vw" src="/hero/hero-cloud-03.webp" /></div><div className="min-w-0"><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Về CloudServiceStore</h2>{content?.aboutMarkdown ? <div className="news-markdown mt-4 text-sm leading-6"><ReactMarkdown>{content.aboutMarkdown}</ReactMarkdown></div> : <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><p>CloudServiceStore là đơn vị cung cấp dịch vụ hạ tầng cloud với sứ mệnh mang đến giải pháp ổn định, an toàn và linh hoạt cho doanh nghiệp Việt Nam.</p><p>Chúng tôi đầu tư mạnh mẽ vào hệ thống Data Center hiện đại, công nghệ tiên tiến và đội ngũ kỹ thuật giàu kinh nghiệm để đảm bảo dịch vụ luôn sẵn sàng, bảo mật và hiệu quả.</p><p>Dù bạn là startup, doanh nghiệp SME hay tổ chức lớn, CloudServiceStore luôn đồng hành và cung cấp nền tảng vững chắc để bạn phát triển bền vững.</p></div>}<div className="mt-5 grid gap-3 sm:grid-cols-3"><AboutFeature icon="uptime" iconLabel={uptimeLabel} title={`${uptimeLabel} Uptime SLA`} text={`Cam kết thời gian hoạt động đạt tối thiểu ${uptimeLabel}.`} /><AboutFeature icon="support" title="24/7 Hỗ trợ kỹ thuật" text="Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ." /><AboutFeature icon="shield" title="Bảo mật dữ liệu" text="Áp dụng tiêu chuẩn bảo mật cao cho dữ liệu." /></div></div></div></section>

    <section className="border-y border-blue-50 bg-[#f7fbff] py-8 sm:py-10"><div className="shell"><SectionTitle title="Lịch sử phát triển" /><div className="relative mt-8"><div className="about-timeline-line" data-about-timeline-line aria-hidden="true" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{timeline.map((item, index) => <article className="relative rounded-xl border border-blue-100 bg-white p-5 shadow-sm" data-about-motion data-motion-delay={index * 80} key={item.year}><span className="absolute -top-4 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border-4 border-[#f7fbff] bg-blue-600 text-white"><AboutIcon className="h-4 w-4" kind={item.icon} /></span><div className="flex items-center gap-3 pt-3"><span className="text-2xl font-black text-blue-600">{item.year}</span></div><h3 className="mt-4 text-sm font-black">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p></article>)}</div></div></div></section>

    <section className="shell py-8 sm:py-10"><div className="grid gap-7 lg:grid-cols-[.78fr_1.22fr] lg:items-start"><div><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Hạ tầng Data Center</h2>{content?.infrastructureMarkdown ? <div className="news-markdown mt-3 max-w-md text-sm leading-6"><ReactMarkdown>{content?.infrastructureMarkdown}</ReactMarkdown></div> : <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Hệ thống Data Center đạt chuẩn quốc tế với công nghệ hiện đại, đảm bảo hiệu suất cao, độ ổn định và an toàn tuyệt đối cho dữ liệu của khách hàng.</p>}<div className="relative mt-5 aspect-[1.9/1] overflow-hidden rounded-xl border border-blue-100 bg-slate-950"><Image alt="Hệ thống máy chủ trong Data Center" className="object-cover object-right brightness-[.56] contrast-[1.24] saturate-[1.35]" fill sizes="(min-width:1024px) 38vw, 100vw" src="/hero/hero-cloud-03.webp" /></div></div><div className="grid gap-3 sm:grid-cols-2">{infrastructureItems.map(item => <InfoCard icon={item.icon} iconLabel={item.icon === "uptime" ? uptimeLabel : undefined} key={item.title} text={item.text} title={item.title} />)}</div></div></section>

    <section className="shell pb-8 sm:pb-10"><SectionTitle title="Chứng chỉ và tiêu chuẩn" /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{certificates.map(item => <InfoCard compact icon={item.icon} key={item.title} text={item.text} title={item.title} />)}</div></section>

    <section className="shell pb-8 sm:pb-10"><SectionTitle title="Cam kết SLA và chất lượng dịch vụ" /><div className="mt-5 overflow-hidden rounded-xl border border-blue-100 bg-white">{commitments.map((item, index) => <div className="flex gap-4 border-b border-blue-50 p-4 last:border-b-0 sm:items-center sm:px-6 sm:py-5" key={item.title}><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><AboutIcon kind={item.icon} uptimeLabel={index === 0 ? uptimeLabel : undefined} /></span><div><h3 aria-label={index === 0 ? `${uptimeLabel} Uptime SLA` : item.title} className="text-sm font-black sm:text-base">{index === 0 ? <><AboutSlaValue value={uptimeValue} /> Uptime SLA</> : item.title}</h3><p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600 sm:text-sm">{item.text.replace("99.9%", uptimeLabel)}</p></div></div>)}</div></section>

    <section className="shell pb-8 sm:pb-10"><div className="relative overflow-hidden rounded-xl border border-blue-100 bg-[linear-gradient(100deg,#eef7ff_0%,#e6f3ff_65%,#f3f9ff_100%)] px-5 py-6 sm:px-8"><div className="relative z-10 max-w-2xl"><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Sẵn sàng xây dựng nền tảng vững chắc?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Liên hệ với CloudServiceStore để nhận tư vấn giải pháp cloud tối ưu phù hợp với nhu cầu của doanh nghiệp bạn.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white" href="/services">Xem dịch vụ <ArrowIcon /></Link><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-5 text-sm font-black text-blue-700" href="/order"><AboutIcon className="h-4 w-4" kind="support" />Liên hệ tư vấn</Link></div></div><div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[42%] md:block"><div className="absolute inset-0 bg-gradient-to-r from-[#edf7ff] to-transparent" /><Image alt="" className="object-cover object-right brightness-[.82] opacity-60" fill sizes="42vw" src="/hero/hero-cloud-03.webp" /></div></div></section>
  </main><SiteFooter /></>;
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-center text-2xl font-black tracking-[-.035em] sm:text-3xl">{title}</h2>;
}

function AboutFeature({ icon, iconLabel, text, title }: { icon: AboutIconKind; iconLabel?: string; text: string; title: string }) {
  return <article className="rounded-xl border border-blue-100 bg-white p-4 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><AboutIcon kind={icon} uptimeLabel={iconLabel} /></span><h3 className="mt-3 text-xs font-black leading-5">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-600">{text}</p></article>;
}

function InfoCard({ compact = false, icon, iconLabel, text, title }: { compact?: boolean; icon: AboutIconKind; iconLabel?: string; text: string; title: string }) {
  return <article className={`flex gap-3 rounded-xl border border-blue-100 bg-white ${compact ? "items-center p-4" : "p-4"}`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><AboutIcon kind={icon} uptimeLabel={iconLabel} /></span><div><h3 className="text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div></article>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
