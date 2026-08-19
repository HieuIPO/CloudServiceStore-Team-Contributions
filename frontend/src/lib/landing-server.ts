import "server-only";
import type { NewsArticle, PagedResult, Promotion, PublicLandingContent, ServicePlan, ServicePlanDetail, ServicePlanFeature } from "@/lib/api";

const serverApiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`API request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export type LandingHomeData = {
  landing: PublicLandingContent | null;
  featuredPlans: LandingFeaturedPlan[];
  promotions: Promotion[];
  latestNews: NewsArticle[];
  unavailableSections: string[];
};

export type LandingFeaturedPlan = ServicePlan & { features: ServicePlanFeature[] };

export async function getLandingHomeData(): Promise<LandingHomeData> {
  const results = await Promise.allSettled([
    getJson<PublicLandingContent>("/api/v1/landing-content"),
    getJson<PagedResult<ServicePlan>>("/api/v1/service-plans?page=1&pageSize=4&isActive=true&isFeatured=true"),
    getJson<PagedResult<Promotion>>("/api/v1/promotions?page=1&pageSize=100&isActive=true"),
    getJson<PagedResult<NewsArticle>>("/api/v1/news-articles?page=1&pageSize=3"),
  ]);
  const unavailableSections: string[] = [];
  const value = <T,>(index: number, section: string): T | null => {
    const result = results[index];
    if (result.status === "fulfilled") return result.value as T;
    unavailableSections.push(section);
    return null;
  };

  const promotions = value<PagedResult<Promotion>>(2, "promotions")?.items ?? [];
  const featuredPlans = value<PagedResult<ServicePlan>>(1, "services")?.items ?? [];
  const featuredPlansWithDetails = await Promise.all(featuredPlans.map(async plan => {
    try {
      const detail = await getJson<ServicePlanDetail>(`/api/v1/service-plans/${plan.id}`);
      return { ...plan, features: [...detail.features].sort((left, right) => left.displayOrder - right.displayOrder) };
    } catch {
      return { ...plan, features: [] };
    }
  }));
  const now = Date.now();
  return {
    landing: value<PublicLandingContent>(0, "landing"),
    featuredPlans: featuredPlansWithDetails,
    promotions: promotions.filter(item => new Date(item.startsAt).getTime() <= now && new Date(item.endsAt).getTime() >= now).slice(0, 3),
    latestNews: value<PagedResult<NewsArticle>>(3, "news")?.items ?? [],
    unavailableSections,
  };
}

export async function getPublicLandingContent(): Promise<PublicLandingContent | null> {
  try { return await getJson<PublicLandingContent>("/api/v1/landing-content"); }
  catch { return null; }
}

export async function getPublicServicePlans(): Promise<ServicePlan[]> {
  try {
    const result = await getJson<PagedResult<ServicePlan>>("/api/v1/service-plans?page=1&pageSize=100&isActive=true");
    return result.items;
  } catch {
    return [];
  }
}
