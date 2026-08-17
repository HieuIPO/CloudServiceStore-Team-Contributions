"use client";

import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { AffiliateIcon, AffiliatePartnerArt, type IconKind } from "@/components/affiliate-art";
import { affiliateApi, ApiError, refreshSession, type AffiliateConfirmation, type AffiliateProgramContent } from "@/lib/api";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";

type AffiliateForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  websiteUrl: string;
  partnerType: string;
  serviceInterest: string;
  estimatedReferrals: string;
  channelDescription: string;
  audienceDescription: string;
  consent: boolean;
};

const emptyForm: AffiliateForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  companyName: "",
  websiteUrl: "",
  partnerType: "",
  serviceInterest: "",
  estimatedReferrals: "",
  channelDescription: "",
  audienceDescription: "",
  consent: false,
};

const benefits: { title: string; description: string; icon: IconKind }[] = [
  { title: "Hoa hồng hấp dẫn", description: "Nhận hoa hồng cạnh tranh lên đến 20% từ mỗi khách hàng giới thiệu thành công.", icon: "commission" },
  { title: "Theo dõi minh bạch", description: "Hệ thống theo dõi hiện đại, thống kê chi tiết và minh bạch mọi lượt giới thiệu.", icon: "tracking" },
  { title: "Hỗ trợ bán hàng", description: "Cung cấp tài liệu, hướng dẫn và hỗ trợ kỹ thuật để giúp bạn tăng tỉ lệ chuyển đổi.", icon: "support" },
  { title: "Thanh toán đúng hạn", description: "Đối soát rõ ràng, thanh toán đúng hạn vào ngày cố định hàng tháng.", icon: "payment" },
];

const commissionRows = [
  { level: "Đối tác cơ bản", condition: "Từ 0 – 10 khách hàng giới thiệu thành công", commission: "Hoa hồng từ", value: "10%", support: ["Tài liệu bán hàng cơ bản", "Hỗ trợ qua email"], icon: "person" as IconKind },
  { level: "Đối tác phát triển", condition: "Từ 11 – 30 khách hàng giới thiệu thành công", commission: "Hoa hồng từ", value: "15%", support: ["Tài liệu bán hàng nâng cao", "Hỗ trợ kỹ thuật ưu tiên"], icon: "customers" as IconKind },
  { level: "Đối tác chiến lược", condition: "Từ 31 khách hàng giới thiệu thành công", commission: "Hoa hồng lên đến", value: "20%", support: ["Tài liệu chuyên biệt", "Hỗ trợ 1:1, ưu tiên xử lý"], icon: "money" as IconKind, featured: true },
];

const processSteps: { title: string; description: string; icon: IconKind }[] = [
  { title: "Đăng ký đối tác", description: "Điền thông tin đăng ký để trở thành đối tác của CloudServiceStore.", icon: "person" },
  { title: "Nhận liên kết giới thiệu", description: "Nhận liên kết giới thiệu riêng và các tài liệu hỗ trợ bán hàng.", icon: "link" },
  { title: "Giới thiệu khách hàng", description: "Chia sẻ liên kết và giới thiệu khách hàng sử dụng dịch vụ thành công.", icon: "customers" },
  { title: "Nhận hoa hồng", description: "Hoa hồng được ghi nhận và thanh toán theo chu kỳ đối soát.", icon: "money" },
];

const rules: { title: string; items: string[]; icon: IconKind }[] = [
  { title: "Điều kiện tham gia", items: ["Tuân thủ chính sách và quy định của chương trình.", "Không sử dụng hình thức quảng cáo vi phạm pháp luật."], icon: "person" },
  { title: "Quy định ghi nhận khách hàng", items: ["Khách hàng phải đăng ký qua link giới thiệu của bạn.", "Cookie ghi nhận trong vòng 30 ngày."], icon: "link" },
  { title: "Thời gian đối soát", items: ["Đối soát hoa hồng hàng tháng.", "Thời gian đối soát từ ngày 01 – ngày 05 hàng tháng."], icon: "calendar" },
  { title: "Điều kiện thanh toán", items: ["Khách hàng không có yêu cầu hoàn tiền.", "Dịch vụ duy trì hoạt động trong kỳ đối soát."], icon: "shield" },
  { title: "Ngưỡng thanh toán tối thiểu", items: ["Ngưỡng thanh toán tối thiểu: 500.000 VND.", "Thanh toán theo chuyển khoản ngân hàng."], icon: "wallet" },
  { title: "Chính sách hỗ trợ đối tác", items: ["Cung cấp tài liệu marketing và hướng dẫn bán hàng.", "Hỗ trợ kỹ thuật và chăm sóc đối tác tận tâm."], icon: "support" },
];

const faqs = [
  ["Ai có thể đăng ký làm đối tác?", "Cá nhân, doanh nghiệp, agency và các nhà phát triển nội dung đều có thể đăng ký nếu đáp ứng điều kiện chương trình."],
  ["Hoa hồng được tính như thế nào?", "Hoa hồng được ghi nhận theo gói dịch vụ, trạng thái thanh toán và cấp độ đối tác trong kỳ đối soát."],
  ["Khi nào đối tác được thanh toán?", "Hoa hồng được đối soát hàng tháng và thanh toán khi đạt ngưỡng tối thiểu theo chính sách."],
  ["Làm thế nào để theo dõi khách hàng giới thiệu?", "Đội ngũ CloudServiceStore sẽ cung cấp liên kết và hướng dẫn theo dõi sau khi hồ sơ được duyệt."],
];

export function AffiliatePublicClient({ program, samplePreview = false }: { program: AffiliateProgramContent | null; samplePreview?: boolean }) {
  const [form, setForm] = useState<AffiliateForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<AffiliateConfirmation | null>(null);
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
      setForm(current => ({ ...current, fullName: user.fullName, email: user.email }));
      setAccountChecked(true);
    };
    const current = getCurrentUser();
    if (current) applyAccount(current);
    else void refreshSession().then(applyAccount).catch(() => {
      if (subscribed) setAccountChecked(true);
    });
    return () => { subscribed = false; };
  }, [samplePreview]);

  const title = program?.title?.trim() || "Trở thành đối tác CloudServiceStore";
  const summary = program?.summary?.trim() || "Cùng phát triển hệ sinh thái Cloud và nhận hoa hồng hấp dẫn từ mỗi khách hàng giới thiệu.";

  const updateField = <K extends keyof AffiliateForm>(field: K, value: AffiliateForm[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!samplePreview && !customerAccount) {
      setError("Vui lòng đăng nhập tài khoản khách hàng trước khi gửi hồ sơ Affiliate.");
      return;
    }
    if (!form.consent) {
      setError("Vui lòng đồng ý với chính sách chương trình Affiliate.");
      return;
    }
    if (!form.channelDescription.trim()) {
      setError("Vui lòng nhập kênh quảng bá hoặc kênh tiếp cận khách hàng.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const audienceDescription = [
      `Loại đối tác: ${form.partnerType}`,
      `Dịch vụ quan tâm: ${form.serviceInterest}`,
      `Số lượng khách hàng dự kiến: ${form.estimatedReferrals}`,
      `Kế hoạch hợp tác: ${form.audienceDescription}`,
    ].join("\n");

    if (samplePreview) {
      setConfirmation({ id: "PREVIEW-AFFILIATE-001", status: 1, createdAt: new Date().toISOString() });
      setForm(emptyForm);
      setSubmitting(false);
      return;
    }

    void affiliateApi.create({
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      companyName: form.companyName || null,
      websiteUrl: form.websiteUrl || null,
      promotionChannels: form.channelDescription,
      audienceDescription,
      experienceDescription: null,
    })
      .then(result => {
        setConfirmation(result);
        setForm({ ...emptyForm, fullName: customerAccount?.fullName ?? "", email: customerAccount?.email ?? "" });
      })
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "Không thể gửi hồ sơ. Vui lòng thử lại."))
      .finally(() => setSubmitting(false));
  };

  return (
    <main className="affiliate-page bg-[#fbfdff] text-[#10245a]">
      <PublicPageBanner
        actions={<><a className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="#affiliate-form">Đăng ký làm đối tác <ArrowRightIcon /></a><a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-500 bg-white/80 px-5 text-sm font-black text-blue-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="#commission-policy">Xem chính sách hoa hồng <DocumentIcon /></a></>}
        breadcrumb="Đối tác"
        description={summary}
        networkClassName="affiliate-hero-banner-background"
        title={title}
      />

      <section className="affiliate-section affiliate-benefits-section shell py-8 sm:py-10" aria-labelledby="affiliate-benefits-title">
        <SectionTitle id="affiliate-benefits-title" title="Tại sao nên trở thành đối tác?" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:mt-6 lg:gap-4">
          {benefits.map((item, index) => <ScrollReveal className="affiliate-benefit-reveal" delay={index * 65} key={item.title}><article className="affiliate-card affiliate-benefit-card flex min-h-[7.2rem] flex-col items-center justify-center p-3 text-center lg:min-h-[9.4rem] lg:p-5"><span className="text-blue-600"><AffiliateIcon kind={item.icon} /></span><h3 className="mt-2 text-sm font-black lg:mt-3">{item.title}</h3><p className="mt-1 max-w-[15rem] text-xs leading-5 text-slate-600 lg:mt-2">{item.description}</p></article></ScrollReveal>)}
        </div>
      </section>

      <section className="affiliate-section shell pb-8 sm:pb-10" id="commission-policy" aria-labelledby="commission-policy-title">
        <SectionTitle id="commission-policy-title" title="Chính sách hoa hồng" />
        <div className="affiliate-commission-reveal mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white lg:mt-5">
          <div className="overflow-x-auto">
            <table className="affiliate-commission-table min-w-[680px] w-full border-collapse text-[10px] lg:min-w-[820px] lg:text-sm">
              <thead className="bg-[#f5f9ff] text-[10px] font-black text-[#10245a] lg:text-xs"><tr><th className="px-2 py-2 text-left lg:px-4 lg:py-3">Cấp độ đối tác</th><th className="px-2 py-2 text-left lg:px-4 lg:py-3">Điều kiện áp dụng</th><th className="px-2 py-2 text-center lg:px-4 lg:py-3">Mức hoa hồng</th><th className="px-2 py-2 text-center lg:px-4 lg:py-3">Chu kỳ đối soát</th><th className="px-2 py-2 text-left lg:px-4 lg:py-3">Hỗ trợ đi kèm</th></tr></thead>
              <tbody>
                {commissionRows.map(row => <tr className="affiliate-commission-row border-t border-blue-50" key={row.level}>
                  <td className="px-2 py-2 lg:px-4 lg:py-3"><div className="flex items-center gap-2 lg:gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 lg:h-8 lg:w-8"><AffiliateIcon kind={row.icon} /></span><span><b className="block">{row.level}</b>{row.featured && <small className="mt-1 inline-flex rounded bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white">Phổ biến</small>}</span></div></td>
                  <td className="px-2 py-2 text-slate-600 lg:px-4 lg:py-3">{row.condition}</td>
                  <td className="px-2 py-2 text-center lg:px-4 lg:py-3"><span className="text-[10px] text-slate-600 lg:text-xs">{row.commission} </span><strong className="text-base text-blue-600 lg:text-xl">{row.value}</strong></td>
                  <td className="px-2 py-2 text-center text-slate-600 lg:px-4 lg:py-3">Hàng tháng</td>
                  <td className="px-2 py-2 text-slate-600 lg:px-4 lg:py-3">{row.support.map(item => <span className="block" key={item}>{item}</span>)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-center text-xs leading-5 text-slate-500"><span className="mr-1 text-blue-600">ⓘ</span>{program?.commissionSummary || "Mức hoa hồng trong mockup là nội dung minh họa và có thể thay đổi theo chính sách thực tế."}</p>
        {program?.policyMarkdown && <details className="mx-auto mt-4 max-w-4xl rounded-xl border border-blue-100 bg-white px-5 py-4"><summary className="cursor-pointer text-sm font-black text-blue-700">Xem chi tiết chính sách cập nhật</summary><div className="news-markdown mt-4 text-sm"><ReactMarkdown>{program.policyMarkdown}</ReactMarkdown></div></details>}
      </section>

      <section className="affiliate-section shell pb-8 sm:pb-10" aria-labelledby="affiliate-process-title">
        <SectionTitle id="affiliate-process-title" title="Cách chương trình Affiliate hoạt động" />
        <div className="affiliate-process mt-3 grid gap-3 md:grid-cols-4 lg:mt-5 lg:gap-4">
          {processSteps.map((step, index) => <div className="relative" key={step.title}><article className="affiliate-card flex min-h-[7rem] flex-col items-center justify-center p-3 text-center lg:min-h-[9.2rem] lg:p-4"><span className="absolute -top-3 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span><span className="text-blue-600"><AffiliateIcon kind={step.icon} /></span><h3 className="mt-2 text-sm font-black">{step.title}</h3><p className="mt-1 max-w-[12rem] text-xs leading-5 text-slate-600">{step.description}</p></article>{index < processSteps.length - 1 && <span aria-hidden="true" className="affiliate-process-arrow">→</span>}</div>)}
        </div>
      </section>

      <section className="affiliate-section shell pb-8 sm:pb-10" aria-labelledby="affiliate-rules-title">
        <SectionTitle id="affiliate-rules-title" title="Điều kiện và quy định" />
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:mt-5 lg:gap-x-4">
          {rules.map((rule, index) => <ScrollReveal className="affiliate-rule-reveal" delay={index * 55} key={rule.title}><article className="affiliate-rule-card flex gap-3 rounded-lg border border-blue-100 bg-white px-3 py-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eff7ff] text-blue-600"><AffiliateIcon kind={rule.icon} /></span><div className="min-w-0"><h3 className="text-sm font-black">{rule.title}</h3><ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-5 text-slate-600">{rule.items.map(item => <li key={item}>{item}</li>)}</ul></div></article></ScrollReveal>)}
        </div>
      </section>

      <section className="affiliate-section shell pb-8 sm:pb-10" id="affiliate-form" aria-labelledby="affiliate-form-title">
        <SectionTitle id="affiliate-form-title" title="Đăng ký làm đối tác" />
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(16rem,.95fr)] lg:mt-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(19rem,.9fr)] lg:gap-4">
          <section className="affiliate-form-card affiliate-form-panel rounded-xl border border-blue-100 bg-white p-3 sm:p-6 lg:p-5">
            {confirmation ? <ConfirmationState confirmation={confirmation} customerAccount={customerAccount} samplePreview={samplePreview} onReset={() => setConfirmation(null)} /> : <>
              <div><p className="text-sm font-black text-[#10245a]">Thông tin đăng ký đối tác</p><p className="mt-1 text-xs text-slate-500">Để lại thông tin, đội ngũ CloudServiceStore sẽ liên hệ xác minh trong thời gian sớm nhất.</p></div>
              {!samplePreview && accountChecked && !customerAccount && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">Để gửi và theo dõi hồ sơ Affiliate, vui lòng <Link className="font-black text-blue-700 underline" href="/account/login?returnTo=%2Faffiliate">đăng nhập tài khoản khách hàng</Link> trước.</p>}
              {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
              <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
                <AffiliateField label="Họ và tên" required><input className="affiliate-field" maxLength={160} readOnly={Boolean(customerAccount)} required value={form.fullName} onChange={event => updateField("fullName", event.target.value)} /></AffiliateField>
                <AffiliateField label="Email" required><input className="affiliate-field" maxLength={256} readOnly={Boolean(customerAccount)} required type="email" value={form.email} onChange={event => updateField("email", event.target.value)} /></AffiliateField>
                <AffiliateField label="Số điện thoại" required><input className="affiliate-field" maxLength={30} minLength={8} required type="tel" value={form.phoneNumber} onChange={event => updateField("phoneNumber", event.target.value)} /></AffiliateField>
                <AffiliateField label="Tên công ty / thương hiệu"><input className="affiliate-field" maxLength={160} value={form.companyName} onChange={event => updateField("companyName", event.target.value)} /></AffiliateField>
                <AffiliateField className="sm:col-span-2" label="Website hoặc kênh giới thiệu"><input className="affiliate-field" maxLength={500} placeholder="https://website.com hoặc URL kênh của bạn" type="url" value={form.websiteUrl} onChange={event => updateField("websiteUrl", event.target.value)} /></AffiliateField>
                <AffiliateField label="Loại đối tác" required><select className="affiliate-field" required value={form.partnerType} onChange={event => updateField("partnerType", event.target.value)}><option value="">Chọn loại đối tác</option><option>Cá nhân</option><option>Doanh nghiệp</option><option>Agency</option><option>Nhà phát triển nội dung</option></select></AffiliateField>
                <AffiliateField label="Dịch vụ quan tâm" required><select className="affiliate-field" required value={form.serviceInterest} onChange={event => updateField("serviceInterest", event.target.value)}><option value="">Chọn dịch vụ quan tâm</option><option>VPS</option><option>Hosting</option><option>Cloud Server</option><option>Website và bảo mật</option></select></AffiliateField>
                <AffiliateField label="Số lượng khách hàng dự kiến mỗi tháng" required><select className="affiliate-field" required value={form.estimatedReferrals} onChange={event => updateField("estimatedReferrals", event.target.value)}><option value="">Ví dụ: 10 khách hàng</option><option>1 – 10 khách hàng</option><option>11 – 30 khách hàng</option><option>Từ 31 khách hàng</option></select></AffiliateField>
                <AffiliateField className="sm:col-span-2" label="Kênh quảng bá hoặc kênh tiếp cận khách hàng" required><textarea className="affiliate-field min-h-20 resize-y" maxLength={500} placeholder="Website, mạng xã hội, cộng đồng, sự kiện..." required value={form.channelDescription} onChange={event => updateField("channelDescription", event.target.value)} /></AffiliateField>
                <AffiliateField className="sm:col-span-2" label="Giới thiệu về kênh hoặc kế hoạch hợp tác" required><textarea className="affiliate-field min-h-24 resize-y" maxLength={1500} required value={form.audienceDescription} onChange={event => updateField("audienceDescription", event.target.value)} /></AffiliateField>
                <label className="flex items-start gap-2 text-xs leading-5 text-slate-600 sm:col-span-2"><input checked={form.consent} className="mt-1 h-4 w-4 accent-blue-600" onChange={event => updateField("consent", event.target.checked)} type="checkbox" /> <span>Tôi đồng ý với <a className="font-bold text-blue-700 underline" href="#affiliate-rules-title">chính sách chương trình Affiliate</a></span></label>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:col-span-2" disabled={submitting || !accountChecked || (!samplePreview && !customerAccount)} type="submit">{submitting ? "Đang gửi..." : "Gửi đăng ký đối tác"}<ArrowRightIcon /></button>
              </form>
            </>}
          </section>

          <aside className="affiliate-support-card overflow-hidden rounded-xl border border-blue-100 bg-[linear-gradient(155deg,#edf7ff_0%,#f8fcff_100%)] p-3 sm:p-6 lg:p-5">
            <div className="h-24 lg:h-28"><AffiliatePartnerArt /></div>
            <div className="mt-2 rounded-lg border border-blue-100 bg-white/90 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600"><AffiliateIcon kind="support" /></span><div><p className="text-xs font-bold text-slate-600">Hotline hỗ trợ đối tác</p><p className="text-xl font-black text-blue-600">1900 6868</p></div></div><p className="mt-3 border-t border-blue-50 pt-3 text-xs text-slate-600">partner@cloudservicestore.vn</p><p className="mt-1 text-xs text-slate-600">www.cloudservicestore.vn</p></div>
            <div className="mt-3 space-y-3 text-xs"><SupportPoint icon="support" title="Phản hồi nhanh" description="Đội ngũ hỗ trợ sẵn sàng giải đáp thắc mắc trong thời gian sớm nhất." /><SupportPoint icon="rules" title="Tài liệu bán hàng" description="Cung cấp bộ nhận diện, video và hướng dẫn bán hàng chi tiết." /><SupportPoint icon="tracking" title="Theo dõi hoa hồng minh bạch" description="Theo dõi real-time, thống kê chi tiết mọi lượt giới thiệu." /></div>
          </aside>
        </div>
      </section>

      <section className="affiliate-section affiliate-faq shell pb-8 sm:pb-10" aria-labelledby="affiliate-faq-title">
        <SectionTitle id="affiliate-faq-title" title="Câu hỏi thường gặp" />
        <div className="mt-5 overflow-hidden rounded-xl border border-blue-100 bg-white">{faqs.map(([question, answer]) => <details className="group border-b border-blue-50 last:border-b-0" key={question}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-bold marker:content-none"><span>{question}</span><span aria-hidden="true" className="text-blue-600 transition group-open:rotate-180">⌄</span></summary><p className="px-4 pb-4 text-sm leading-6 text-slate-600">{answer}</p></details>)}</div>
      </section>

      <section className="affiliate-section shell pb-8 sm:pb-10"><div className="affiliate-cta affiliate-cta-banner relative overflow-hidden rounded-xl border border-blue-100 px-5 py-6 sm:px-8"><div className="relative z-10 max-w-2xl lg:max-w-none"><h2 className="text-2xl font-black tracking-[-.03em] sm:text-3xl lg:whitespace-nowrap">Sẵn sàng trở thành đối tác của CloudServiceStore?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bắt đầu kết nối và cùng tạo ra nhiều giá trị hơn.</p><a className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="#affiliate-form">Đăng ký ngay <ArrowRightIcon /></a></div></div></section>
    </main>
  );
}

function SectionTitle({ id, title }: { id: string; title: string }) {
  return <h2 className="affiliate-section-title text-center text-xl font-black tracking-[-.03em] sm:text-2xl lg:text-3xl" id={id}>{title}</h2>;
}

function AffiliateField({ children, className = "", label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) {
  return <label className={`block text-xs font-bold text-[#10245a] ${className}`}>{label}{required && <span className="ml-1 text-blue-600">*</span>}{children}</label>;
}

function SupportPoint({ description, icon, title }: { description: string; icon: IconKind; title: string }) {
  return <div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-600"><AffiliateIcon kind={icon} /></span><div><b className="block text-[#10245a]">{title}</b><span className="mt-0.5 block leading-5 text-slate-600">{description}</span></div></div>;
}

function ConfirmationState({ confirmation, customerAccount, samplePreview, onReset }: { confirmation: AffiliateConfirmation; customerAccount: AuthenticatedUser | null; samplePreview: boolean; onReset: () => void }) {
  return <div className="flex min-h-[32rem] flex-col items-center justify-center text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</span><p className="mt-5 text-xs font-black uppercase tracking-widest text-emerald-700">Đã tiếp nhận hồ sơ</p><h3 className="mt-2 text-2xl font-black">Cảm ơn bạn đã đăng ký hợp tác</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Đội ngũ vận hành sẽ xem xét và liên hệ xác minh. Mã hồ sơ của bạn:</p><code className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">{confirmation.id}</code>{customerAccount && !samplePreview && <Link className="mt-4 font-bold text-blue-700 underline" href={`/account/affiliates/${confirmation.id}`}>Xem hồ sơ trong tài khoản</Link>}<button className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-500 px-5 text-sm font-black text-blue-700 transition hover:bg-blue-50" onClick={onReset} type="button">Gửi hồ sơ khác</button></div>;
}

function ArrowRightIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function DocumentIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20"><path d="M5 2.5h7l3 3V17H5zM12 2.5v3h3M8 9h4M8 12h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}
