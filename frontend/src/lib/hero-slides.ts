export const HERO_ROTATION_MS = 5_000;

export type HeroSlide = {
  id: string;
  imageUrl: string;
  imagePosition: string;
  alt: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "cloud-infrastructure",
    imageUrl: "/hero/hero-cloud-01.webp",
    imagePosition: "center",
    alt: "Hạ tầng cloud và các máy chủ được kết nối",
  },
  {
    id: "managed-database",
    imageUrl: "/hero/hero-cloud-02.webp",
    imagePosition: "center",
    alt: "Cơ sở dữ liệu cloud được theo dõi trên dashboard",
  },
  {
    id: "storage-security",
    imageUrl: "/hero/hero-cloud-03.webp",
    imagePosition: "center",
    alt: "Lưu trữ cloud và lớp bảo mật nhiều tầng",
  },
  {
    id: "network-performance",
    imageUrl: "/hero/hero-cloud-04.webp",
    imagePosition: "center",
    alt: "Mạng lưới máy chủ cloud hiệu năng cao",
  },
];

export function getHeroSlideIndex(
  elapsedMs: number,
  intervalMs = HERO_ROTATION_MS,
  slideCount = heroSlides.length,
): number {
  if (slideCount <= 0 || intervalMs <= 0) return 0;
  return Math.floor(Math.max(0, elapsedMs) / intervalMs) % slideCount;
}
