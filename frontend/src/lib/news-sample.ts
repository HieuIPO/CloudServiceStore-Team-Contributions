import type { NewsArticle, NewsArticleDetail, NewsCategory } from "@/lib/api";

export const sampleNewsCategories: NewsCategory[] = [
  { id: "guide", name: "Hướng dẫn", slug: "huong-dan", description: "Hướng dẫn vận hành và tối ưu hạ tầng.", displayOrder: 1, isActive: true },
  { id: "promotion", name: "Khuyến mãi", slug: "khuyen-mai", description: "Ưu đãi mới nhất từ CloudServiceStore.", displayOrder: 2, isActive: true },
  { id: "technology", name: "Công nghệ", slug: "cong-nghe", description: "Xu hướng công nghệ Cloud và website.", displayOrder: 3, isActive: true },
  { id: "security", name: "Bảo mật", slug: "bao-mat", description: "Bảo vệ dữ liệu và hệ thống an toàn.", displayOrder: 4, isActive: true },
  { id: "cloud-server", name: "Cloud Server", slug: "cloud-server", description: "Kiến thức về Cloud Server.", displayOrder: 5, isActive: true },
];

const imagePool = [
  "/hero/hero-cloud-03.webp",
  "/hero/hero-cloud-04.webp",
  "/hero/hero-cloud-02.webp",
  "/hero/hero-cloud-01.webp",
];

const createArticle = (input: Omit<NewsArticle, "status" | "createdAt" | "isFeatured"> & { status?: NewsArticle["status"]; isFeatured?: boolean }): NewsArticle => ({
  ...input,
  status: input.status ?? 2,
  isFeatured: input.isFeatured ?? false,
  createdAt: `${input.publishedAt ?? "2024-05-01"}T08:00:00Z`,
});

export const sampleNewsArticles: NewsArticle[] = [
  createArticle({ id: "sample-1", categoryId: "cloud-server", categoryName: "Hướng dẫn", title: "Cách lựa chọn cấu hình Cloud Server phù hợp cho doanh nghiệp", slug: "cach-lua-chon-cau-hinh-cloud-server", excerpt: "Việc lựa chọn cấu hình Cloud Server phù hợp giúp doanh nghiệp tối ưu hiệu năng, đảm bảo ổn định và tiết kiệm chi phí vận hành.", thumbnailUrl: imagePool[0], publishedAt: "2024-05-24T08:00:00Z" }),
  createArticle({ id: "sample-2", categoryId: "guide", categoryName: "Hướng dẫn", title: "VPS là gì? So sánh VPS và Hosting nên chọn loại nào?", slug: "vps-la-gi-so-sanh-vps-va-hosting", excerpt: "Tìm hiểu sự khác biệt giữa VPS và Hosting, ưu nhược điểm của từng loại để lựa chọn giải pháp phù hợp với nhu cầu website.", thumbnailUrl: imagePool[1], publishedAt: "2024-05-22T08:00:00Z" }),
  createArticle({ id: "sample-3", categoryId: "guide", categoryName: "Hướng dẫn", title: "Hướng dẫn triển khai Website WordPress trên Cloud Server", slug: "trien-khai-wordpress-tren-cloud-server", excerpt: "Các bước cài đặt WordPress trên Cloud Server nhanh chóng, tối ưu hiệu năng và đảm bảo bảo mật cho website của bạn.", thumbnailUrl: imagePool[2], publishedAt: "2024-05-20T08:00:00Z" }),
  createArticle({ id: "sample-4", categoryId: "security", categoryName: "Bảo mật", title: "10 mẹo tăng cường bảo mật cho Cloud Server", slug: "10-meo-tang-cuong-bao-mat-cloud-server", excerpt: "Những phương pháp hiệu quả giúp bảo vệ Cloud Server khỏi các mối đe dọa và tấn công mạng phổ biến.", thumbnailUrl: imagePool[3], publishedAt: "2024-05-18T08:00:00Z" }),
  createArticle({ id: "sample-5", categoryId: "guide", categoryName: "Hướng dẫn", title: "Lưu dữ liệu tự động với Cloud Backup", slug: "luu-du-lieu-tu-dong-voi-cloud-backup", excerpt: "Hướng dẫn thiết lập sao lưu dữ liệu tự động trên Cloud Server để đảm bảo an toàn và khôi phục nhanh chóng khi cần thiết.", thumbnailUrl: imagePool[0], publishedAt: "2024-05-16T08:00:00Z" }),
  createArticle({ id: "sample-6", categoryId: "technology", categoryName: "Công nghệ", title: "Tối ưu hiệu năng website trên Cloud Server", slug: "toi-uu-hieu-nang-website-tren-cloud-server", excerpt: "Các kỹ thuật tối ưu cấu hình và phần mềm giúp tăng tốc độ website, cải thiện trải nghiệm người dùng.", thumbnailUrl: imagePool[2], publishedAt: "2024-05-14T08:00:00Z" }),
  createArticle({ id: "sample-7", categoryId: "security", categoryName: "Bảo mật", title: "SSL là gì? Hướng dẫn cài đặt SSL miễn phí Let's Encrypt", slug: "ssl-la-gi-huong-dan-cai-dat-ssl", excerpt: "Tìm hiểu SSL là gì và cách cài đặt SSL miễn phí Let's Encrypt cho website để bảo vệ dữ liệu người dùng.", thumbnailUrl: imagePool[3], publishedAt: "2024-05-12T08:00:00Z" }),
  createArticle({ id: "sample-8", categoryId: "security", categoryName: "Bảo mật", title: "Chống DDoS hiệu quả cho Cloud Server", slug: "chong-ddos-hieu-qua-cho-cloud-server", excerpt: "Giải pháp và cấu hình giúp bảo vệ hệ thống khỏi các cuộc tấn công DDoS, đảm bảo uptime ổn định cho dịch vụ.", thumbnailUrl: imagePool[1], publishedAt: "2024-05-10T08:00:00Z" }),
  createArticle({ id: "sample-9", categoryId: "promotion", categoryName: "Khuyến mãi", title: "Ưu đãi Cloud Server tháng 5 – Giảm đến 30%", slug: "uu-dai-cloud-server-thang-5", excerpt: "Đăng ký Cloud Server ngay hôm nay để nhận ưu đãi lên đến 30% cùng nhiều quà tặng hấp dẫn từ CloudServiceStore.", thumbnailUrl: imagePool[2], publishedAt: "2024-05-08T08:00:00Z" }),
  createArticle({ id: "sample-10", categoryId: "technology", categoryName: "Công nghệ", title: "Cloud Server vs Dedicated Server: Nên chọn loại nào?", slug: "cloud-server-vs-dedicated-server", excerpt: "So sánh chi tiết giữa Cloud Server và Dedicated Server để giúp bạn đưa ra quyết định phù hợp với nhu cầu vận hành.", thumbnailUrl: imagePool[0], publishedAt: "2024-05-06T08:00:00Z" }),
  createArticle({ id: "sample-11", categoryId: "guide", categoryName: "Hướng dẫn", title: "Cấu hình máy chủ cho website bán hàng online", slug: "cau-hinh-may-chu-website-ban-hang", excerpt: "Gợi ý cấu hình phù hợp cho website bán hàng với lưu lượng truy cập tăng trưởng theo mùa.", thumbnailUrl: imagePool[1], publishedAt: "2024-05-04T08:00:00Z" }),
  createArticle({ id: "sample-12", categoryId: "security", categoryName: "Bảo mật", title: "Thiết lập tường lửa cơ bản cho máy chủ Linux", slug: "thiet-lap-tuong-lua-linux", excerpt: "Các bước kiểm tra và thiết lập tường lửa giúp giảm rủi ro truy cập trái phép vào hệ thống.", thumbnailUrl: imagePool[3], publishedAt: "2024-05-02T08:00:00Z" }),
  createArticle({ id: "sample-13", categoryId: "technology", categoryName: "Công nghệ", title: "Container và Cloud Server: Bắt đầu từ đâu?", slug: "container-va-cloud-server", excerpt: "Tổng quan về container và cách ứng dụng vào quy trình triển khai hiện đại.", thumbnailUrl: imagePool[2], publishedAt: "2024-04-30T08:00:00Z" }),
  createArticle({ id: "sample-14", categoryId: "guide", categoryName: "Hướng dẫn", title: "Theo dõi tài nguyên máy chủ với dashboard", slug: "theo-doi-tai-nguyen-may-chu", excerpt: "Cách đọc các chỉ số CPU, RAM, SSD và băng thông để chủ động tối ưu hệ thống.", thumbnailUrl: imagePool[0], publishedAt: "2024-04-28T08:00:00Z" }),
  createArticle({ id: "sample-15", categoryId: "promotion", categoryName: "Khuyến mãi", title: "Ưu đãi Hosting Pro cho website mới", slug: "uu-dai-hosting-pro-website-moi", excerpt: "Gói Hosting Pro tối ưu cho website mới với ưu đãi đặc biệt trong thời gian có hạn.", thumbnailUrl: imagePool[1], publishedAt: "2024-04-26T08:00:00Z" }),
  createArticle({ id: "sample-16", categoryId: "cloud-server", categoryName: "Cloud Server", title: "Khi nào nên nâng cấp tài nguyên Cloud Server?", slug: "khi-nao-nen-nang-cap-cloud-server", excerpt: "Nhận biết các dấu hiệu hệ thống cần thêm tài nguyên để giữ trải nghiệm ổn định.", thumbnailUrl: imagePool[3], publishedAt: "2024-04-24T08:00:00Z" }),
  createArticle({ id: "sample-17", categoryId: "security", categoryName: "Bảo mật", title: "Sao lưu dữ liệu: Quy tắc 3-2-1 dễ áp dụng", slug: "quy-tac-sao-luu-du-lieu-3-2-1", excerpt: "Một quy trình sao lưu đơn giản giúp dữ liệu an toàn hơn trước sự cố và lỗi vận hành.", thumbnailUrl: imagePool[2], publishedAt: "2024-04-22T08:00:00Z" }),
  createArticle({ id: "sample-18", categoryId: "technology", categoryName: "Công nghệ", title: "HTTP/3 và tác động đến tốc độ website", slug: "http-3-va-toc-do-website", excerpt: "Tìm hiểu những thay đổi đáng chú ý của HTTP/3 và cách chuẩn bị cho website.", thumbnailUrl: imagePool[0], publishedAt: "2024-04-20T08:00:00Z" }),
  createArticle({ id: "sample-19", categoryId: "cloud-server", categoryName: "Cloud Server", title: "Bí quyết chọn chu kỳ thanh toán Cloud Server", slug: "chon-chu-ky-thanh-toan-cloud-server", excerpt: "So sánh chu kỳ tháng và năm để chủ động ngân sách, khuyến mãi và kế hoạch mở rộng hạ tầng.", thumbnailUrl: imagePool[1], publishedAt: "2024-04-18T08:00:00Z" }),
  createArticle({ id: "sample-20", categoryId: "guide", categoryName: "Hướng dẫn", title: "Checklist vận hành máy chủ cho doanh nghiệp", slug: "checklist-van-hanh-may-chu", excerpt: "Danh sách kiểm tra ngắn gọn giúp đội ngũ duy trì hệ thống ổn định mỗi ngày.", thumbnailUrl: imagePool[3], publishedAt: "2024-04-16T08:00:00Z" }),
];

export const sampleFeaturedArticle = sampleNewsArticles[0];

const featuredMarkdown = `Việc lựa chọn cấu hình Cloud Server phù hợp giúp doanh nghiệp tối ưu hiệu năng, đảm bảo hệ thống ổn định và tiết kiệm chi phí. Bài viết hướng dẫn cách đánh giá nhu cầu, so sánh cấu hình và lựa chọn giải pháp tối ưu nhất cho từng mô hình vận hành.

## 1. Tại sao cần chọn đúng cấu hình?

Mỗi doanh nghiệp có đặc thù hệ thống và lưu lượng truy cập khác nhau. Chọn đúng cấu hình giúp bạn:

- Đảm bảo hiệu năng và tốc độ xử lý ổn định.
- Tránh lãng phí tài nguyên và chi phí không cần thiết.
- Dễ dàng mở rộng khi hệ thống phát triển.
- Tăng tính sẵn sàng và độ tin cậy cho hệ thống.

## 2. Xác định nhu cầu sử dụng

Trước khi lựa chọn cấu hình, hãy xác định rõ nhu cầu của bạn:

- Loại ứng dụng hoặc website cần triển khai.
- Lưu lượng truy cập dự kiến theo ngày và theo tháng.
- Yêu cầu về lưu trữ, tốc độ đọc ghi và sao lưu dữ liệu.
- Yêu cầu về độ ổn định: SLA, backup và bảo mật.

> **Lưu ý:** Nên dự trù tài nguyên cao hơn nhu cầu hiện tại khoảng 20–30% để đảm bảo hệ thống hoạt động ổn định khi lượng truy cập tăng đột biến.

## 3. Các thành phần cấu hình quan trọng

CPU quyết định khả năng xử lý yêu cầu. RAM ảnh hưởng đến khả năng đa nhiệm. SSD NVMe giúp tăng tốc độ đọc ghi và băng thông quyết định tốc độ truyền tải dữ liệu.

## 4. Kết luận

Lựa chọn Cloud Server phù hợp là yếu tố quan trọng giúp doanh nghiệp vận hành hiệu quả, ổn định và tiết kiệm chi phí. Hãy bắt đầu từ nhu cầu thực tế và chọn cấu hình có khả năng mở rộng khi cần.`;

export function getSampleArticleDetail(slug: string): NewsArticleDetail | null {
  const article = sampleNewsArticles.find(item => item.slug === slug);
  if (!article) return null;
  return {
    ...article,
    markdownContent: slug === sampleFeaturedArticle.slug ? featuredMarkdown : `## ${article.title}\n\n${article.excerpt}\n\nCloudServiceStore chia sẻ những hướng dẫn thực tế giúp bạn vận hành hạ tầng Cloud ổn định, bảo mật và tối ưu chi phí. Hãy theo dõi các bài viết tiếp theo để cập nhật thêm kiến thức hữu ích cho doanh nghiệp.\n\n## Những điều cần lưu ý\n\n- Chủ động theo dõi tài nguyên và hiệu năng hệ thống.\n- Thiết lập sao lưu và lớp bảo mật phù hợp.\n- Luôn có kế hoạch mở rộng khi nhu cầu tăng trưởng.`,
    updatedAt: article.publishedAt,
  };
}
