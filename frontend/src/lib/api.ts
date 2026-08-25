import { clearAccessToken, getAccessToken, setAccessToken, setCurrentUser, type AuthenticatedUser } from "@/lib/auth-store";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// Browser calls stay on the frontend origin and are proxied by Next.js. This
// works from localhost, Docker bridge hosts and the in-app browser alike.
export const apiBaseUrl = typeof window === "undefined" ? configuredApiBaseUrl : "";

export type PagedResult<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number };
export type ServiceCategory = { id: string; name: string; slug: string; description?: string; displayOrder: number; isActive: boolean };
export type ServicePlanFeature = { id: string; featureKey: string; displayName: string; value: string; unit?: string; displayOrder: number };
export type PlanPrice = { id: string; servicePlanId: string; billingCycle: 1 | 12; amount: number; currency: string; effectiveFrom: string; effectiveTo?: string; isActive: boolean };
export type ActivePromotion = { id: string; code: string; name: string; discountType: 1 | 2; discountValue: number; billingCycle?: 1 | 12 | null };
export type ServicePlan = { id: string; categoryId: string; categoryName: string; name: string; slug: string; summary: string; isFeatured: boolean; isActive: boolean; currentMonthlyPrice?: number; promotionalMonthlyPrice?: number | null; currency: string; activePromotion?: ActivePromotion | null; qrCodePath?: string | null };
export type ServicePlanDetail = Omit<ServicePlan, "currentMonthlyPrice" | "promotionalMonthlyPrice" | "currency" | "activePromotion"> & { qrCodePath?: string; features: ServicePlanFeature[]; prices: PlanPrice[]; activePromotions: ActivePromotion[] };
export type Promotion = { id: string; code: string; name: string; discountType: 1 | 2; discountValue: number; billingCycle?: 1 | 12 | null; startsAt: string; endsAt: string; isActive: boolean; showOnPublicBanner: boolean; servicePlanIds: string[] };
export type NewsCategory = { id: string; name: string; slug: string; description?: string; displayOrder: number; isActive: boolean };
export type NewsArticleStatus = 1 | 2;
export type NewsArticle = { id: string; categoryId: string; categoryName: string; title: string; slug: string; excerpt: string; thumbnailUrl?: string; status: NewsArticleStatus; publishedAt?: string; createdAt: string; isFeatured: boolean };
export type NewsArticleDetail = NewsArticle & { markdownContent: string; updatedAt?: string };
export type NewsDataSyncResult = { fetched: number; created: number; updated: number; skipped: number; items: Array<{ id: string; title: string; slug: string; sourceName: string; link: string; status: NewsArticleStatus }> };
export type LandingPageContent = { id: string; heroEyebrow: string; heroTitle: string; heroDescription: string; primaryCtaLabel: string; primaryCtaUrl: string; secondaryCtaLabel: string; secondaryCtaUrl: string; aboutTitle: string; aboutMarkdown: string; infrastructureMarkdown: string; uptimeCommitment: string; isPublished: boolean; updatedAt?: string };
export type Testimonial = { id: string; customerName: string; customerRole?: string; companyName: string; quote: string; avatarUrl?: string; displayOrder: number; isActive: boolean };
export type CustomerLogo = { id: string; name: string; logoUrl: string; websiteUrl?: string; altText: string; displayOrder: number; isActive: boolean };
export type PublicLandingContent = { content: LandingPageContent; testimonials: Testimonial[]; customerLogos: CustomerLogo[] };
export type OrderStatus = 1 | 2 | 3 | 4 | 5;
export type OrderConfirmation = { id: string; status: OrderStatus; planName: string; billingCycle: 1 | 12; quotedAmount: number; currency: string; createdAt: string };
export type OrderListItem = { id: string; customerName: string; email: string; phoneNumber: string; companyName?: string; servicePlanId: string; planName: string; billingCycle: 1 | 12; quotedAmount: number; currency: string; promotionCode?: string; status: OrderStatus; createdAt: string };
export type OrderStatusHistory = { id: string; fromStatus: OrderStatus; toStatus: OrderStatus; note?: string; changedBy?: string; createdAt: string };
export type OrderDetail = OrderListItem & { originalAmount: number; specificationSnapshot: string; note?: string; updatedAt?: string; statusHistory: OrderStatusHistory[] };
export type CustomerOrderListItem = { id: string; servicePlanId: string; planName: string; billingCycle: 1 | 12; quotedAmount: number; currency: string; status: OrderStatus; createdAt: string };
export type CustomerOrderStatusHistory = { id: string; fromStatus: OrderStatus; toStatus: OrderStatus; createdAt: string };
export type CustomerOrderDetail = CustomerOrderListItem & { originalAmount: number; specificationSnapshot: string; updatedAt?: string; statusHistory: CustomerOrderStatusHistory[] };
export type AffiliateStatus = 1 | 2 | 3 | 4;
export type AffiliateProgramContent = { id: string; title: string; summary: string; commissionSummary: string; policyMarkdown: string; isPublished: boolean; updatedAt?: string };
export type AffiliateConfirmation = { id: string; status: AffiliateStatus; createdAt: string };
export type AffiliateListItem = { id: string; fullName: string; email: string; phoneNumber: string; companyName?: string; websiteUrl?: string; promotionChannels: string; status: AffiliateStatus; createdAt: string };
export type AffiliateStatusHistory = { id: string; fromStatus: AffiliateStatus; toStatus: AffiliateStatus; note?: string; changedBy?: string; createdAt: string };
export type AffiliateDetail = AffiliateListItem & { audienceDescription: string; experienceDescription?: string; reviewNote?: string; reviewedBy?: string; reviewedAt?: string; updatedAt?: string; statusHistory: AffiliateStatusHistory[] };
export type CustomerAffiliateListItem = { id: string; fullName: string; companyName?: string; status: AffiliateStatus; createdAt: string; updatedAt?: string };
export type CustomerAffiliateStatusHistory = { id: string; fromStatus: AffiliateStatus; toStatus: AffiliateStatus; createdAt: string };
export type CustomerAffiliateDetail = CustomerAffiliateListItem & { email: string; phoneNumber: string; websiteUrl?: string; promotionChannels: string; audienceDescription: string; experienceDescription?: string; statusHistory: CustomerAffiliateStatusHistory[] };
export type ContactRequestStatus = 1 | 2 | 3 | 4 | 5;
export type ContactRequestConfirmation = { id: string; status: ContactRequestStatus; createdAt: string };
export type ContactRequestListItem = { id: string; fullName: string; email: string; phoneNumber: string; companyName?: string | null; subject: string; status: ContactRequestStatus; createdAt: string };
export type ContactRequestStatusHistory = { id: string; fromStatus: ContactRequestStatus; toStatus: ContactRequestStatus; note?: string | null; changedBy?: string | null; createdAt: string };
export type ContactRequestDetail = ContactRequestListItem & { message: string; resolutionNote?: string | null; resolvedBy?: string | null; resolvedAt?: string | null; updatedAt?: string | null; statusHistory: ContactRequestStatusHistory[]; allowedTransitions: ContactRequestStatus[] };
export type NamedCount = { name: string; count: number };
export type MonthlyOrder = { year: number; month: number; count: number; quotedAmount: number; approvedCount: number };
export type OrderSummary = { from: string; to: string; totalOrders: number; periodOrders: number; pendingOrders: number; approvedOrders: number; approvedQuotedAmount: number; totalAffiliateApplications: number; pendingAffiliateApplications: number; publishedNewsArticles: number; statuses: NamedCount[]; monthlyOrders: MonthlyOrder[] };
export type PopularPlan = { planName: string; orderCount: number; quotedAmount: number };
export type ServiceInterest = { serviceName: string; orderCount: number };
export type AuditLogItem = { id: string; actorId?: string; actorEmail?: string; action: string; entityName: string; entityId?: string; oldValuesJson?: string; newValuesJson?: string; ipAddress?: string; occurredAt: string };

export type EditorWorkspaceSummary = {
  newOrders: number;
  newOrdersLast24Hours: number;
  inProgressOrders: number;
  overdueActiveOrders: number;
  pendingAffiliates: number;
  newAffiliatesLast24Hours: number;
  draftArticles: number;
  draftsUpdatedLast24Hours: number;
};

export type EditorWorkspaceQueueItem = {
  id: string;
  type: "order" | "affiliate";
  customerName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  subject: string;
  sourceStatus: string;
  statusGroup: "new" | "inProgress" | "completed" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  lastActivityAt: string;
};

export type EditorWorkspaceDraftArticle = {
  id: string;
  title: string;
  categoryName: string;
  updatedAt: string;
};

export type EditorWorkspaceDto = {
  summary: EditorWorkspaceSummary;
  queue: PagedResult<EditorWorkspaceQueueItem>;
  recentDrafts: EditorWorkspaceDraftArticle[];
};

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as {
      detail?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };
    const validationMessages = Object.values(body.errors ?? {}).flat().filter(Boolean);
    if (validationMessages.length > 0) return validationMessages.join(" ");
    return body.detail ?? body.title ?? "Yêu cầu không thành công.";
  } catch {
    return "Yêu cầu không thành công.";
  }
}

const API_REQUEST_TIMEOUT_MS = 15_000;

function createTimedRequestSignal(externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromCaller);
    }
  };
}

// Dedup concurrent refresh: only one in-flight refresh at a time
let inflightRefresh: Promise<AuthenticatedUser | null> | null = null;

const REFRESH_TIMEOUT_MS = 10_000;

const createAbortError = (): Error => {
  if (typeof DOMException !== "undefined") return new DOMException("The operation was aborted", "AbortError");
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
};

/**
 * Wait for the shared refresh without allowing one caller's cancellation to
 * cancel the network request used by every other caller.
 */
function waitForRefresh(
  refreshPromise: Promise<AuthenticatedUser | null>,
  externalSignal?: AbortSignal
): Promise<AuthenticatedUser | null> {
  if (!externalSignal) return refreshPromise;
  if (externalSignal.aborted) return Promise.reject(createAbortError());

  return new Promise<AuthenticatedUser | null>((resolve, reject) => {
    const cleanup = () => externalSignal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    externalSignal.addEventListener("abort", onAbort, { once: true });
    refreshPromise.then(
      value => {
        cleanup();
        resolve(value);
      },
      error => {
        cleanup();
        reject(error);
      }
    );
  });
}

export function refreshSession(externalSignal?: AbortSignal): Promise<AuthenticatedUser | null> {
  if (externalSignal?.aborted) return Promise.reject(createAbortError());

  if (!inflightRefresh) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), REFRESH_TIMEOUT_MS);

    const doRefresh = (async (): Promise<AuthenticatedUser | null> => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          signal: timeoutController.signal
        });
        if (response.status === 401 || response.status === 403) {
          clearAccessToken();
          return null;
        }
        if (!response.ok) {
          throw new ApiError(response.status, await readError(response));
        }
        const body = (await response.json()) as { accessToken: string; user: AuthenticatedUser };
        setAccessToken(body.accessToken);
        setCurrentUser(body.user);
        return body.user;
      } catch (err: unknown) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearAccessToken();
          return null;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    inflightRefresh = doRefresh.finally(() => {
      inflightRefresh = null;
    });
  }

  return waitForRefresh(inflightRefresh, externalSignal);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const request = createTimedRequestSignal(init.signal ?? undefined);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, credentials: "include", signal: request.signal });
    if (response.status === 401 && retry) {
      const refreshed = await refreshSession(init.signal ?? undefined);
      if (refreshed) return apiFetch<T>(path, init, false);
    }
    if (!response.ok) throw new ApiError(response.status, await readError(response));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } finally {
    request.cleanup();
  }
}

async function apiDownload(path: string, retry = true): Promise<{ blob: Blob; fileName: string }> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const request = createTimedRequestSignal();
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { headers, credentials: "include", signal: request.signal });
    if (response.status === 401 && retry) {
      const refreshed = await refreshSession();
      if (refreshed) return apiDownload(path, false);
    }
    if (!response.ok) throw new ApiError(response.status, await readError(response));
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plain = disposition.match(/filename=\"?([^\";]+)\"?/i)?.[1];
    return { blob: await response.blob(), fileName: encoded ? decodeURIComponent(encoded) : plain ?? "order-requests.xlsx" };
  } finally {
    request.cleanup();
  }
}

export const catalogApi = {
  categories: (isActive = true) => apiFetch<PagedResult<ServiceCategory>>(`/api/v1/service-categories?page=1&pageSize=100&isActive=${isActive}`),
  publicPlans: () => apiFetch<PagedResult<ServicePlan>>("/api/v1/service-plans?page=1&pageSize=100&isActive=true"),
  adminPlans: (isActive: boolean | null = true, page = 1, pageSize = 100, includeInactive = false) => apiFetch<PagedResult<ServicePlan>>(`/api/v1/service-plans?page=${page}&pageSize=${pageSize}${isActive === null ? "" : `&isActive=${isActive}`}${includeInactive ? "&includeInactive=true" : ""}`),
  plan: (id: string) => apiFetch<ServicePlanDetail>(`/api/v1/service-plans/${id}`),
  planBySlug: (slug: string) => apiFetch<ServicePlanDetail>(`/api/v1/service-plans/by-slug/${encodeURIComponent(slug)}`),
  createCategory: (body: Omit<ServiceCategory, "id">) => apiFetch<ServiceCategory>("/api/v1/service-categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Omit<ServiceCategory, "id">) => apiFetch<ServiceCategory>(`/api/v1/service-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteCategory: (id: string) => apiFetch<void>(`/api/v1/service-categories/${id}`, { method: "DELETE" }),
  createPlan: (body: object) => apiFetch<ServicePlanDetail>("/api/v1/service-plans", { method: "POST", body: JSON.stringify(body) }),
  updatePlan: (id: string, body: object) => apiFetch<ServicePlanDetail>(`/api/v1/service-plans/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePlan: (id: string) => apiFetch<void>(`/api/v1/service-plans/${id}`, { method: "DELETE" }),
  createPrice: (planId: string, body: object) => apiFetch<PlanPrice>(`/api/v1/service-plans/${planId}/prices`, { method: "POST", body: JSON.stringify(body) }),
  generateQr: (planId: string) => apiFetch<{ imagePath: string; targetUrl: string }>(`/api/v1/service-plans/${planId}/qr-code`, { method: "POST" }),
};

export const promotionApi = {
  all: (isActive: boolean) => apiFetch<PagedResult<Promotion>>(`/api/v1/promotions?page=1&pageSize=100&isActive=${isActive}`),
  create: (body: Omit<Promotion, "id">) => apiFetch<Promotion>("/api/v1/promotions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Omit<Promotion, "id">) => apiFetch<Promotion>(`/api/v1/promotions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/api/v1/promotions/${id}`, { method: "DELETE" }),
};

const newsQuery = (params: { page?: number; pageSize?: number; search?: string; categoryId?: string; status?: NewsArticleStatus }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 12) });
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.status) query.set("status", String(params.status));
  return query.toString();
};

export const newsApi = {
  publicCategories: () => apiFetch<PagedResult<NewsCategory>>("/api/v1/news-categories?page=1&pageSize=100"),
  adminCategories: (isActive: boolean) => apiFetch<PagedResult<NewsCategory>>(`/api/v1/news-categories/admin?page=1&pageSize=100&isActive=${isActive}`),
  publicArticles: (params: { page?: number; pageSize?: number; search?: string; categoryId?: string } = {}, signal?: AbortSignal) => apiFetch<PagedResult<NewsArticle>>(`/api/v1/news-articles?${newsQuery(params)}`, { signal }),
  articleBySlug: (slug: string) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/${encodeURIComponent(slug)}`),
  adminArticles: (params: { page?: number; pageSize?: number; search?: string; categoryId?: string; status?: NewsArticleStatus } = {}, signal?: AbortSignal) => apiFetch<PagedResult<NewsArticle>>(`/api/v1/news-articles/admin?${newsQuery(params)}`, { signal }),
  adminArticle: (id: string) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/admin/${id}`),
  createCategory: (body: Omit<NewsCategory, "id">) => apiFetch<NewsCategory>("/api/v1/news-categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Omit<NewsCategory, "id">) => apiFetch<NewsCategory>(`/api/v1/news-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id: string) => apiFetch<void>(`/api/v1/news-categories/${id}`, { method: "DELETE" }),
  createArticle: (body: object) => apiFetch<NewsArticleDetail>("/api/v1/news-articles", { method: "POST", body: JSON.stringify(body) }),
  updateArticle: (id: string, body: object) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  publishArticle: (id: string) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/${id}/publish`, { method: "PATCH", body: "{}" }),
  unpublishArticle: (id: string) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/${id}/unpublish`, { method: "PATCH" }),
  setFeaturedArticle: (id: string, isFeatured: boolean) => apiFetch<NewsArticleDetail>(`/api/v1/news-articles/${id}/featured`, { method: "PATCH", body: JSON.stringify({ isFeatured }) }),
  deleteArticle: (id: string) => apiFetch<void>(`/api/v1/news-articles/${id}`, { method: "DELETE" }),
  syncNewsData: (limit = 10, publish = false) => apiFetch<NewsDataSyncResult>("/api/v1/news-articles/sync-newsdata", { method: "POST", body: JSON.stringify({ limit, publish }) }),
};

export const landingApi = {
  public: () => apiFetch<PublicLandingContent>("/api/v1/landing-content"),
  admin: () => apiFetch<PublicLandingContent>("/api/v1/landing-content/admin"),
  updateContent: (body: Omit<LandingPageContent, "id" | "updatedAt">) => apiFetch<LandingPageContent>("/api/v1/landing-content", { method: "PUT", body: JSON.stringify(body) }),
  createTestimonial: (body: Omit<Testimonial, "id">) => apiFetch<Testimonial>("/api/v1/testimonials", { method: "POST", body: JSON.stringify(body) }),
  updateTestimonial: (id: string, body: Omit<Testimonial, "id">) => apiFetch<Testimonial>(`/api/v1/testimonials/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTestimonial: (id: string) => apiFetch<void>(`/api/v1/testimonials/${id}`, { method: "DELETE" }),
  createCustomerLogo: (body: Omit<CustomerLogo, "id">) => apiFetch<CustomerLogo>("/api/v1/customer-logos", { method: "POST", body: JSON.stringify(body) }),
  updateCustomerLogo: (id: string, body: Omit<CustomerLogo, "id">) => apiFetch<CustomerLogo>(`/api/v1/customer-logos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomerLogo: (id: string) => apiFetch<void>(`/api/v1/customer-logos/${id}`, { method: "DELETE" }),
};

const orderQuery = (params: { page?: number; pageSize?: number; search?: string; servicePlanId?: string; status?: OrderStatus }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
  if (params.search) query.set("search", params.search);
  if (params.servicePlanId) query.set("servicePlanId", params.servicePlanId);
  if (params.status) query.set("status", String(params.status));
  return query.toString();
};

export const orderApi = {
  create: (body: object) => apiFetch<OrderConfirmation>("/api/v1/orders", { method: "POST", body: JSON.stringify(body) }),
  all: (params: { page?: number; pageSize?: number; search?: string; servicePlanId?: string; status?: OrderStatus } = {}, signal?: AbortSignal) =>
    apiFetch<PagedResult<OrderListItem>>(`/api/v1/orders?${orderQuery(params)}`, { signal }),
  detail: (id: string) => apiFetch<OrderDetail>(`/api/v1/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiFetch<OrderDetail>(`/api/v1/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: note || null }) }),
};

const accountOrderQuery = (params: { page?: number; pageSize?: number; status?: OrderStatus }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
  if (params.status) query.set("status", String(params.status));
  return query.toString();
};

const accountAffiliateQuery = (params: { page?: number; pageSize?: number; status?: AffiliateStatus }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
  if (params.status) query.set("status", String(params.status));
  return query.toString();
};

export const accountApi = {
  orders: (params: { page?: number; pageSize?: number; status?: OrderStatus } = {}, signal?: AbortSignal) =>
    apiFetch<PagedResult<CustomerOrderListItem>>(`/api/v1/account/orders?${accountOrderQuery(params)}`, { signal }),
  order: (id: string) => apiFetch<CustomerOrderDetail>(`/api/v1/account/orders/${id}`),
  affiliates: (params: { page?: number; pageSize?: number; status?: AffiliateStatus } = {}, signal?: AbortSignal) =>
    apiFetch<PagedResult<CustomerAffiliateListItem>>(`/api/v1/account/affiliates?${accountAffiliateQuery(params)}`, { signal }),
  affiliate: (id: string) => apiFetch<CustomerAffiliateDetail>(`/api/v1/account/affiliates/${id}`),
};

const affiliateQuery = (params: { page?: number; pageSize?: number; search?: string; status?: AffiliateStatus }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", String(params.status));
  return query.toString();
};

export const affiliateApi = {
  publicProgram: () => apiFetch<AffiliateProgramContent>("/api/v1/affiliate-program"),
  adminProgram: () => apiFetch<AffiliateProgramContent>("/api/v1/affiliate-program/admin"),
  updateProgram: (body: Omit<AffiliateProgramContent, "id" | "updatedAt">) =>
    apiFetch<AffiliateProgramContent>("/api/v1/affiliate-program", { method: "PUT", body: JSON.stringify(body) }),
  create: (body: object) => apiFetch<AffiliateConfirmation>("/api/v1/affiliate-applications", { method: "POST", body: JSON.stringify(body) }),
  all: (params: { page?: number; pageSize?: number; search?: string; status?: AffiliateStatus } = {}, signal?: AbortSignal) =>
    apiFetch<PagedResult<AffiliateListItem>>(`/api/v1/affiliate-applications?${affiliateQuery(params)}`, { signal }),
  detail: (id: string) => apiFetch<AffiliateDetail>(`/api/v1/affiliate-applications/${id}`),
  updateStatus: (id: string, status: AffiliateStatus, note?: string) =>
    apiFetch<AffiliateDetail>(`/api/v1/affiliate-applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: note || null }) }),
};

const contactRequestQuery = (params: { page?: number; pageSize?: number; search?: string; status?: ContactRequestStatus; createdFrom?: string; createdTo?: string }) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", String(params.status));
  if (params.createdFrom) query.set("createdFrom", params.createdFrom);
  if (params.createdTo) query.set("createdTo", params.createdTo);
  return query.toString();
};

export const contactRequestsApi = {
  create: (body: { fullName: string; email: string; phoneNumber: string; companyName?: string; subject: string; message: string; turnstileToken?: string }) =>
    apiFetch<ContactRequestConfirmation>("/api/v1/contact-requests", { method: "POST", body: JSON.stringify(body) }),
  all: (params: { page?: number; pageSize?: number; search?: string; status?: ContactRequestStatus; createdFrom?: string; createdTo?: string } = {}, signal?: AbortSignal) =>
    apiFetch<PagedResult<ContactRequestListItem>>(`/api/v1/contact-requests?${contactRequestQuery(params)}`, { signal }),
  detail: (id: string) => apiFetch<ContactRequestDetail>(`/api/v1/contact-requests/${id}`),
  updateStatus: (id: string, status: ContactRequestStatus, note?: string) =>
    apiFetch<ContactRequestDetail>(`/api/v1/contact-requests/${id}/status`, { method: "POST", body: JSON.stringify({ status, note: note || null }) }),
};

const reportPeriodQuery = (from?: string, to?: string) => {
  const query = new URLSearchParams();
  if (from) query.set("from", new Date(`${from}T00:00:00`).toISOString());
  if (to) query.set("to", new Date(`${to}T23:59:59`).toISOString());
  return query.toString();
};

export const reportingApi = {
  summary: (from?: string, to?: string) => apiFetch<OrderSummary>(`/api/v1/dashboard/order-summary?${reportPeriodQuery(from, to)}`),
  popularPlans: (from?: string, to?: string) => apiFetch<PopularPlan[]>(`/api/v1/dashboard/popular-plans?${reportPeriodQuery(from, to)}`),
  serviceInterest: (from?: string, to?: string) => apiFetch<ServiceInterest[]>(`/api/v1/dashboard/service-interest?${reportPeriodQuery(from, to)}`),
  audits: (params: { page?: number; pageSize?: number; search?: string; action?: string; entityName?: string; from?: string; to?: string } = {}) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
    if (params.search) query.set("search", params.search);
    if (params.action) query.set("action", params.action);
    if (params.entityName) query.set("entityName", params.entityName);
    if (params.from) query.set("from", new Date(`${params.from}T00:00:00`).toISOString());
    if (params.to) query.set("to", new Date(`${params.to}T23:59:59`).toISOString());
    return apiFetch<PagedResult<AuditLogItem>>(`/api/v1/audit-logs?${query}`);
  },
  exportOrders: (from?: string, to?: string, status?: OrderStatus | "") => {
    const query = new URLSearchParams(reportPeriodQuery(from, to));
    if (status) query.set("status", String(status));
    return apiDownload(`/api/v1/exports/order-requests.xlsx?${query}`);
  },
};

export const editorWorkspaceApi = {
  get: (params: { page?: number; pageSize?: number; type?: string; status?: string; search?: string; sort?: string } = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 20) });
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.sort) query.set("sort", params.sort);
    return apiFetch<EditorWorkspaceDto>(`/api/v1/editor-workspace?${query}`, { signal });
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; accessTokenExpiresAt: string; user: AuthenticatedUser }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(result => {
      setAccessToken(result.accessToken);
      setCurrentUser(result.user);
      return result;
    }),
  register: (fullName: string, email: string, password: string) =>
    apiFetch<{ accessToken: string; accessTokenExpiresAt: string; user: AuthenticatedUser }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }).then(result => {
      setAccessToken(result.accessToken);
      setCurrentUser(result.user);
      return result;
  }),
  me: () => apiFetch<AuthenticatedUser>("/api/v1/auth/me"),
  updateProfile: (fullName: string, avatarUrl?: string | null) =>
    apiFetch<AuthenticatedUser>("/api/v1/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ fullName, avatarUrl: avatarUrl || null }),
    }),
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword = newPassword) =>
    apiFetch<void>("/api/v1/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }) }),
  logout: async () => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      clearAccessToken();
    }
  },
};
