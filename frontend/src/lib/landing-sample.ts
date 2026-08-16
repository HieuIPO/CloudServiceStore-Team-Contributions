import type { AffiliateProgramContent, CustomerLogo, PublicLandingContent, Promotion, Testimonial } from "@/lib/api";
import { sampleNewsArticles } from "@/lib/news-sample";
import { samplePlanDetails, samplePlans } from "@/lib/service-catalog-sample";
import type { LandingHomeData, LandingFeaturedPlan } from "@/lib/landing-server";

const logoData = (name: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><rect width="320" height="80" rx="14" fill="white"/><circle cx="38" cy="40" r="20" fill="${color}" fill-opacity=".12"/><path d="M29 48h18M33 31h10v18H33z" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><text x="72" y="48" fill="${color}" font-family="Arial,sans-serif" font-size="24" font-weight="700">${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const sampleLandingContent: PublicLandingContent = {
  content: {
    id: "sample-landing-content",
    heroEyebrow: "CLOUD HẠ TẦNG CHO DOANH NGHIỆP",
    heroTitle: "Hạ tầng Cloud vững vàng cho mọi chặng tăng trưởng.",
    heroDescription: "VPS, Hosting và dịch vụ bảo mật được thiết kế minh bạch, linh hoạt và luôn có đội ngũ kỹ thuật đồng hành.",
    primaryCtaLabel: "Khám phá dịch vụ",
    primaryCtaUrl: "/services?preview=sample",
    secondaryCtaLabel: "Xem bảng giá",
    secondaryCtaUrl: "/pricing?preview=sample",
    aboutTitle: "Hạ tầng đáng tin cậy, vận hành bởi con người tận tâm.",
    aboutMarkdown: "CloudServiceStore cung cấp giải pháp hạ tầng cloud ổn định, an toàn và linh hoạt cho doanh nghiệp Việt Nam.\n\nChúng tôi đầu tư vào Data Center hiện đại, quy trình vận hành chuẩn hóa và đội ngũ kỹ thuật giàu kinh nghiệm để dịch vụ luôn sẵn sàng.\n\nTừ startup đến doanh nghiệp đang mở rộng, bạn luôn có một nền tảng vững chắc để phát triển.",
    infrastructureMarkdown: "Hạ tầng được giám sát 24/7, kết nối đa tuyến, sao lưu nhiều lớp và có khả năng mở rộng theo nhu cầu.",
    uptimeCommitment: "99.9% SLA",
    isPublished: true,
    updatedAt: "2026-08-05T08:00:00Z",
  },
  testimonials: [
    { id: "sample-testimonial-1", customerName: "Nguyễn Hoàng Nam", customerRole: "CTO", companyName: "TechViet", quote: "Hệ thống vận hành ổn định, tốc độ nhanh và đội ngũ hỗ trợ phản hồi rất nhanh mỗi khi cần.", displayOrder: 1, isActive: true },
    { id: "sample-testimonial-2", customerName: "Trần Minh Anh", customerRole: "Giám đốc Marketing", companyName: "EduSmart", quote: "Dịch vụ hosting ổn định, tốc độ truy cập nhanh và quy trình hỗ trợ rất rõ ràng.", displayOrder: 2, isActive: true },
    { id: "sample-testimonial-3", customerName: "Lê Quốc Bảo", customerRole: "Founder", companyName: "BaotriWeb", quote: "Cấu hình minh bạch, nâng cấp linh hoạt và không gián đoạn dịch vụ khi hệ thống tăng trưởng.", displayOrder: 3, isActive: true },
  ] satisfies Testimonial[],
  customerLogos: [
    ["TECHVIET", "#1368e8"], ["EDUSMART", "#13a0d8"], ["BAOTRIWEB", "#2563eb"], ["GREENRETAIL", "#10a56b"], ["FINANCEVIET", "#3348a8"],
    ["SAIGONFOOD", "#f59e0b"], ["MEDICARE", "#0ea5e9"], ["HANOI LOGISTICS", "#2563eb"], ["VINALINK", "#06b6d4"], ["NEXTGEN TECH", "#4f46e5"],
  ].map(([name, color], index): CustomerLogo => ({
    id: `sample-logo-${index + 1}`,
    name,
    logoUrl: logoData(name, color),
    altText: `${name} — khách hàng CloudServiceStore`,
    displayOrder: index + 1,
    isActive: true,
  })),
};

const featuredPlanIndexes = [1, 0, 7, 2];
const sampleFeaturedPlans: LandingFeaturedPlan[] = featuredPlanIndexes.map(index => ({
  ...samplePlans[index],
  features: samplePlanDetails[samplePlans[index].id]?.features.slice(0, 4) ?? [],
}));

const samplePromotions: Promotion[] = [
  { id: "sample-promotion-vps", code: "VPS20", name: "Ưu đãi VPS tháng 8", discountType: 1, discountValue: 20, startsAt: "2026-08-01T00:00:00+07:00", endsAt: "2026-08-31T23:59:59+07:00", isActive: true, showOnPublicBanner: false, servicePlanIds: [samplePlans[0].id, samplePlans[1].id] },
  { id: "sample-promotion-cloud", code: "CLOUD15", name: "Giảm 15% Cloud Server", discountType: 1, discountValue: 15, startsAt: "2026-08-01T00:00:00+07:00", endsAt: "2026-08-31T23:59:59+07:00", isActive: true, showOnPublicBanner: false, servicePlanIds: [samplePlans[7].id] },
  { id: "sample-promotion-ssl", code: "SSL10", name: "SSL an toàn cho website", discountType: 1, discountValue: 10, startsAt: "2026-08-01T00:00:00+07:00", endsAt: "2026-08-31T23:59:59+07:00", isActive: true, showOnPublicBanner: false, servicePlanIds: [samplePlans[5].id] },
];

export const sampleLandingHomeData: LandingHomeData = {
  landing: sampleLandingContent,
  featuredPlans: sampleFeaturedPlans,
  promotions: samplePromotions,
  latestNews: sampleNewsArticles.slice(0, 3),
  unavailableSections: [],
};

export const sampleAffiliateProgram: AffiliateProgramContent = {
  id: "sample-affiliate-program",
  title: "Trở thành đối tác CloudServiceStore",
  summary: "Cùng phát triển hệ sinh thái Cloud và nhận hoa hồng hấp dẫn từ mỗi khách hàng giới thiệu.",
  commissionSummary: "Mức hoa hồng trong mockup là nội dung minh họa và có thể thay đổi theo chính sách thực tế.",
  policyMarkdown: "## Chính sách dành cho đối tác\n\n- Hoa hồng lên đến **20%** theo cấp độ đối tác.\n- Cookie ghi nhận trong vòng **30 ngày**.\n- Đối soát và thanh toán theo chu kỳ hàng tháng.\n\n> Đây là dữ liệu mẫu để xem giao diện, không phải chính sách chính thức.",
  isPublished: true,
  updatedAt: "2026-08-05T08:00:00Z",
};
