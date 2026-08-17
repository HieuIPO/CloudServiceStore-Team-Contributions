import type { ActivePromotion, ServiceCategory, ServicePlan, ServicePlanDetail, ServicePlanFeature } from "@/lib/api";

// Synthetic preview content for visual QA only. It is never written to the API or database.

const categoryIds = {
  vps: "sample-category-vps",
  hosting: "sample-category-hosting",
  domain: "sample-category-domain",
  email: "sample-category-email",
  ssl: "sample-category-ssl",
  firewall: "sample-category-firewall",
} as const;

export const sampleCategories: ServiceCategory[] = [
  { id: categoryIds.vps, name: "VPS", slug: "vps", description: "Máy chủ ảo linh hoạt", displayOrder: 1, isActive: true },
  { id: categoryIds.hosting, name: "Hosting", slug: "hosting", description: "Hosting website doanh nghiệp", displayOrder: 2, isActive: true },
  { id: categoryIds.domain, name: "Domain", slug: "domain", description: "Tên miền quốc tế", displayOrder: 3, isActive: true },
  { id: categoryIds.email, name: "Email doanh nghiệp", slug: "email-doanh-nghiep", description: "Email theo tên miền riêng", displayOrder: 4, isActive: true },
  { id: categoryIds.ssl, name: "SSL", slug: "ssl", description: "Chứng chỉ bảo mật website", displayOrder: 5, isActive: true },
  { id: categoryIds.firewall, name: "Firewall chống DDoS", slug: "firewall-chong-ddos", description: "Bảo vệ lưu lượng ứng dụng", displayOrder: 6, isActive: true },
];

const promotion = (id: string, name: string, discountValue: number): ActivePromotion => ({
  id,
  code: `SAMPLE-${id.toUpperCase()}`,
  name,
  discountType: 1,
  discountValue,
});

const makePlan = ({
  id,
  categoryId,
  categoryName,
  name,
  slug,
  summary,
  currentMonthlyPrice,
  promotionalMonthlyPrice,
  isFeatured = false,
  activePromotion,
}: {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  summary: string;
  currentMonthlyPrice?: number;
  promotionalMonthlyPrice?: number;
  isFeatured?: boolean;
  activePromotion?: ActivePromotion;
}): ServicePlan => ({
  id,
  categoryId,
  categoryName,
  name,
  slug,
  summary,
  isFeatured,
  isActive: true,
  currentMonthlyPrice,
  promotionalMonthlyPrice,
  currency: "VND",
  activePromotion,
});

export const samplePlans: ServicePlan[] = [
  makePlan({ id: "sample-plan-vps-start-2", categoryId: categoryIds.vps, categoryName: "VPS", name: "VPS Start 2", slug: "sample-vps-start-2", summary: "Phù hợp website nhỏ và landing page.", currentMonthlyPrice: 199000 }),
  makePlan({ id: "sample-plan-vps-business-4", categoryId: categoryIds.vps, categoryName: "VPS", name: "VPS Business 4", slug: "sample-vps-business-4", summary: "Cấu hình ổn định cho doanh nghiệp vừa.", currentMonthlyPrice: 499000, isFeatured: true }),
  makePlan({ id: "sample-plan-hosting-pro", categoryId: categoryIds.hosting, categoryName: "Hosting", name: "Hosting Pro", slug: "sample-hosting-pro", summary: "Tối ưu cho website doanh nghiệp và WordPress.", currentMonthlyPrice: 129000 }),
  makePlan({ id: "sample-plan-domain-com", categoryId: categoryIds.domain, categoryName: "Domain", name: "Tên miền .com", slug: "sample-domain-com", summary: "Đăng ký tên miền quốc tế nhanh chóng.", currentMonthlyPrice: 320000, promotionalMonthlyPrice: 289000, activePromotion: promotion("domain-10", "-10%", 10) }),
  makePlan({ id: "sample-plan-email-business", categoryId: categoryIds.email, categoryName: "Email", name: "Email Business", slug: "sample-email-business", summary: "Email doanh nghiệp chuyên nghiệp, bảo mật.", currentMonthlyPrice: 79000 }),
  makePlan({ id: "sample-plan-ssl-standard", categoryId: categoryIds.ssl, categoryName: "SSL", name: "SSL DV Standard", slug: "sample-ssl-dv-standard", summary: "Chứng chỉ số bảo mật cho website.", currentMonthlyPrice: 459000, promotionalMonthlyPrice: 390000, activePromotion: promotion("ssl-15", "-15%", 15) }),
  makePlan({ id: "sample-plan-antiddos-basic", categoryId: categoryIds.firewall, categoryName: "Firewall", name: "Anti-DDoS Basic", slug: "sample-antiddos-basic", summary: "Bảo vệ dịch vụ khỏi tấn công DDoS phổ biến.", currentMonthlyPrice: 650000 }),
  makePlan({ id: "sample-plan-cloud-server-pro-8", categoryId: categoryIds.vps, categoryName: "VPS", name: "Cloud Server Pro 8", slug: "sample-cloud-server-pro-8", summary: "Hiệu năng cao cho ứng dụng và hệ thống nội bộ.", currentMonthlyPrice: 1059000, promotionalMonthlyPrice: 899000, activePromotion: promotion("server-15", "-15%", 15) }),
];

const feature = (id: string, featureKey: string, displayName: string, value: string, unit: string, displayOrder: number): ServicePlanFeature => ({
  id,
  featureKey,
  displayName,
  value,
  unit,
  displayOrder,
});

const detail = (plan: ServicePlan, features: ServicePlanFeature[]): ServicePlanDetail => ({
  id: plan.id,
  categoryId: plan.categoryId,
  categoryName: plan.categoryName,
  name: plan.name,
  slug: plan.slug,
  summary: plan.summary,
  isFeatured: plan.isFeatured,
  isActive: plan.isActive,
  qrCodePath: undefined,
  features,
  prices: [],
  activePromotions: plan.activePromotion ? [plan.activePromotion] : [],
});

export const samplePlanDetails: Record<string, ServicePlanDetail> = {
  [samplePlans[0].id]: detail(samplePlans[0], [feature("sample-vps-start-cpu", "CPU", "CPU", "2", "vCPU", 1), feature("sample-vps-start-ram", "RAM", "RAM", "2", "GB", 2), feature("sample-vps-start-ssd", "SSD", "SSD NVMe", "40", "GB", 3), feature("sample-vps-start-bandwidth", "BANDWIDTH", "Băng thông", "2", "TB", 4)]),
  [samplePlans[1].id]: detail(samplePlans[1], [feature("sample-vps-business-cpu", "CPU", "CPU", "4", "vCPU", 1), feature("sample-vps-business-ram", "RAM", "RAM", "8", "GB", 2), feature("sample-vps-business-ssd", "SSD", "SSD NVMe", "80", "GB", 3), feature("sample-vps-business-bandwidth", "BANDWIDTH", "Băng thông", "4", "TB", 4)]),
  [samplePlans[2].id]: detail(samplePlans[2], [feature("sample-hosting-storage", "STORAGE", "SSD", "10", "GB", 1), feature("sample-hosting-email", "EMAIL", "Email", "Không giới hạn", "", 2), feature("sample-hosting-ssl", "SSL", "SSL", "Miễn phí", "", 3), feature("sample-hosting-backup", "BACKUP", "Backup", "Hàng ngày", "", 4)]),
  [samplePlans[3].id]: detail(samplePlans[3], [feature("sample-domain-register", "REGISTER", "Kích hoạt", "Nhanh", "", 1), feature("sample-domain-dns", "DNS", "Quản lý DNS", "Có", "", 2), feature("sample-domain-whois", "WHOIS", "Ẩn thông tin WHOIS", "Có", "", 3), feature("sample-domain-transfer", "TRANSFER", "Hỗ trợ chuyển đổi", "Có", "", 4)]),
  [samplePlans[4].id]: detail(samplePlans[4], [feature("sample-email-mailbox", "MAILBOX", "Mailbox", "30", "GB", 1), feature("sample-email-antispam", "ANTISPAM", "Anti-spam", "Có", "", 2), feature("sample-email-webmail", "WEBMAIL", "Webmail", "Có", "", 3), feature("sample-email-domain", "DOMAIN", "Tên miền riêng", "Có", "", 4)]),
  [samplePlans[5].id]: detail(samplePlans[5], [feature("sample-ssl-auth", "AUTH", "Xác thực", "DV", "", 1), feature("sample-ssl-encryption", "ENCRYPTION", "Mã hóa", "256", "bit", 2), feature("sample-ssl-install", "INSTALL", "Cài đặt", "Dễ dàng", "", 3), feature("sample-ssl-browser", "BROWSER", "Tương thích", "Trình duyệt", "", 4)]),
  [samplePlans[6].id]: detail(samplePlans[6], [feature("sample-firewall-filter", "FILTER", "Lọc lưu lượng", "L3/L4", "", 1), feature("sample-firewall-mitigation", "MITIGATION", "Giảm thiểu", "Tự động", "", 2), feature("sample-firewall-alert", "ALERT", "Cảnh báo", "Cơ bản", "", 3), feature("sample-firewall-report", "REPORT", "Báo cáo", "Hàng tháng", "", 4)]),
  [samplePlans[7].id]: detail(samplePlans[7], [feature("sample-server-cpu", "CPU", "CPU", "8", "vCPU", 1), feature("sample-server-ram", "RAM", "RAM", "16", "GB", 2), feature("sample-server-ssd", "SSD", "SSD NVMe", "160", "GB", 3), feature("sample-server-bandwidth", "BANDWIDTH", "Băng thông", "6", "TB", 4)]),
};
