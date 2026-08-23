import "server-only";

import type { NewsArticle, NewsArticleDetail, NewsCategory, PagedResult } from "@/lib/api";
import { getSampleArticleDetail, sampleNewsArticles, sampleNewsCategories } from "@/lib/news-sample";

const serverApiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const NEWS_PAGE_SIZE = 10;

export type PublicNewsQuery = {
  categoryId: string;
  page: number;
  preview: boolean;
  search: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const emptyPage = <T,>(page: number, pageSize: number): PagedResult<T> => ({
  items: [],
  page,
  pageSize,
  totalCount: 0,
  totalPages: 1,
});

const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export const getPublicNewsQuery = (raw: RawSearchParams): PublicNewsQuery => {
  const rawPage = Number.parseInt(firstValue(raw.page) ?? "1", 10);
  return {
    categoryId: (firstValue(raw.categoryId) ?? "").trim(),
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    preview: firstValue(raw.preview) === "sample",
    search: (firstValue(raw.search) ?? "").trim(),
  };
};

export const getNewsHref = (query: Pick<PublicNewsQuery, "preview" | "search"> & { categoryId?: string; page?: number }) => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.preview) params.set("preview", "sample");
  const value = params.toString();
  return value ? `/news?${value}` : "/news";
};

const getJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`News API request failed with ${response.status}`);
  return response.json() as Promise<T>;
};

const filterSampleArticles = (query: PublicNewsQuery) => {
  const normalizedSearch = query.search.toLocaleLowerCase("vi-VN");
  return sampleNewsArticles.filter(article => {
    const matchesCategory = !query.categoryId || article.categoryId === query.categoryId;
    const matchesSearch = !normalizedSearch || `${article.title} ${article.excerpt} ${article.categoryName}`
      .toLocaleLowerCase("vi-VN")
      .includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });
};

const getSamplePage = (query: PublicNewsQuery): PagedResult<NewsArticle> => {
  const items = filterSampleArticles(query);
  const totalPages = Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  return {
    items: items.slice((page - 1) * NEWS_PAGE_SIZE, page * NEWS_PAGE_SIZE),
    page,
    pageSize: NEWS_PAGE_SIZE,
    totalCount: items.length,
    totalPages,
  };
};

export async function getPublicNewsPage(query: PublicNewsQuery): Promise<{ articles: PagedResult<NewsArticle>; categories: NewsCategory[] }> {
  if (query.preview) return { articles: getSamplePage(query), categories: sampleNewsCategories };

  const articleQuery = new URLSearchParams({
    page: String(query.page),
    pageSize: String(NEWS_PAGE_SIZE),
  });
  if (query.search) articleQuery.set("search", query.search);
  if (query.categoryId) articleQuery.set("categoryId", query.categoryId);

  const [categoryResult, articleResult] = await Promise.allSettled([
    getJson<PagedResult<NewsCategory>>("/api/v1/news-categories?page=1&pageSize=100"),
    getJson<PagedResult<NewsArticle>>(`/api/v1/news-articles?${articleQuery}`),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.items : [],
    articles: articleResult.status === "fulfilled" ? articleResult.value : emptyPage<NewsArticle>(query.page, NEWS_PAGE_SIZE),
  };
}

export async function getPublicNewsDetail(slug: string, preview: boolean): Promise<NewsArticleDetail | null> {
  if (preview) return getSampleArticleDetail(slug);
  try {
    return await getJson<NewsArticleDetail>(`/api/v1/news-articles/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}
