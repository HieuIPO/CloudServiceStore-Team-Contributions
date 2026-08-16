"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, catalogApi, type ServiceCategory, type ServicePlan, type ServicePlanDetail } from "@/lib/api";
import { ServiceServerArt, ServiceSupportArt } from "@/components/service-catalog-art";
import { ServicePlanCard } from "@/components/service-plan-card";
import { PublicPageBanner } from "@/components/public-page-banner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { sampleCategories, samplePlanDetails, samplePlans } from "@/lib/service-catalog-sample";

type SortOrder = "recommended" | "name" | "priceAsc" | "priceDesc";
type CategoryOption = Pick<ServiceCategory, "id" | "name">;

const serviceShell = "service-shell mx-auto w-full max-w-none px-4 sm:px-6 lg:px-20";
const SERVICE_PAGE_SIZE = 8;

const planPrice = (plan: ServicePlan) => typeof plan.promotionalMonthlyPrice === "number"
  ? plan.promotionalMonthlyPrice
  : typeof plan.currentMonthlyPrice === "number" ? plan.currentMonthlyPrice : undefined;

const categoryFromPlans = (plans: ServicePlan[]): CategoryOption[] => {
  const unique = new Map<string, CategoryOption>();
  plans.forEach(plan => unique.set(plan.categoryId, { id: plan.categoryId, name: plan.categoryName }));
  return [...unique.values()].sort((left, right) => left.name.localeCompare(right.name, "vi"));
};

export function PublicServiceCatalog() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [details, setDetails] = useState<Record<string, ServicePlanDetail>>({});
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samplePreview, setSamplePreview] = useState(false);

  const load = useCallback(async (useSamplePreview = false) => {
    setLoading(true);
    setError(null);

    if (useSamplePreview) {
      setPlans(samplePlans);
      setDetails(samplePlanDetails);
      setCategories(sampleCategories.map(category => ({ id: category.id, name: category.name })));
      setLoading(false);
      return;
    }
    const [plansResult, categoriesResult] = await Promise.allSettled([
      catalogApi.publicPlans(),
      catalogApi.categories(),
    ]);

    if (plansResult.status === "rejected") {
      setPlans([]);
      setDetails({});
      setCategories([]);
      setError(plansResult.reason instanceof ApiError ? plansResult.reason.message : "Không thể tải danh sách dịch vụ.");
      setLoading(false);
      return;
    }

    const loadedPlans = plansResult.value.items;
    const detailResults = await Promise.allSettled(loadedPlans.map(plan => catalogApi.plan(plan.id)));
    const loadedDetails: Record<string, ServicePlanDetail> = {};
    detailResults.forEach((result, index) => {
      if (result.status === "fulfilled") loadedDetails[loadedPlans[index].id] = result.value;
    });

    setPlans(loadedPlans);
    setDetails(loadedDetails);
    if (categoriesResult.status === "fulfilled" && categoriesResult.value.items.length > 0) {
      setCategories(categoriesResult.value.items.map(category => ({ id: category.id, name: category.name })));
    } else {
      setCategories(categoryFromPlans(loadedPlans));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const useSamplePreview = new URLSearchParams(window.location.search).get("preview") === "sample";
    const timer = window.setTimeout(() => {
      setSamplePreview(useSamplePreview);
      void load(useSamplePreview);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const shownPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return plans
      .filter(plan => selectedCategory === "all" || plan.categoryId === selectedCategory)
      .filter(plan => !normalizedQuery || `${plan.name} ${plan.categoryName} ${plan.summary}`.toLocaleLowerCase("vi-VN").includes(normalizedQuery))
      .sort((left, right) => {
        if (sortOrder === "name") return left.name.localeCompare(right.name, "vi");
        if (sortOrder === "priceAsc") return (planPrice(left) ?? Number.POSITIVE_INFINITY) - (planPrice(right) ?? Number.POSITIVE_INFINITY);
        if (sortOrder === "priceDesc") return (planPrice(right) ?? -1) - (planPrice(left) ?? -1);
        return 0;
      });
  }, [plans, query, selectedCategory, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(shownPlans.length / SERVICE_PAGE_SIZE));
  const activePage = Math.min(currentPage, pageCount);
  const visiblePlans = shownPlans.slice((activePage - 1) * SERVICE_PAGE_SIZE, activePage * SERVICE_PAGE_SIZE);
  const visibleStart = shownPlans.length === 0 ? 0 : (activePage - 1) * SERVICE_PAGE_SIZE + 1;
  const visibleEnd = Math.min(activePage * SERVICE_PAGE_SIZE, shownPlans.length);

  const hasFilters = Boolean(query.trim()) || selectedCategory !== "all" || sortOrder !== "recommended";
  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSortOrder("recommended");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, pageCount));
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      document.getElementById("service-results-title")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <main className="bg-[#f7fbff] text-slate-950">
      <PublicPageBanner
        networkClassName="bg-[url(/assets/page-heroes/services-hero.png)] bg-cover bg-center bg-no-repeat !opacity-100 sm:bg-[position:62%_center] lg:bg-center"
        breadcrumb="Dịch vụ"
        description="Khám phá hệ sinh thái VPS, Hosting, Domain, Email, SSL, Anti-DDoS và Cloud Server được tối ưu cho cá nhân, startup và doanh nghiệp. Chọn cấu hình rõ ràng, giá minh bạch, kích hoạt nhanh và dễ dàng mở rộng khi nhu cầu tăng."
        eyebrow="Hạ tầng cloud dễ chọn, dễ mở rộng"
        title="Dịch vụ Cloud cho mọi nhu cầu"
      />

      <ScrollReveal className="service-filter-reveal" delay={80}>
        <section aria-label="Bộ lọc dịch vụ" className={`${serviceShell} relative z-20 -mt-1 py-4 sm:py-6`}>
          <div className="service-filter-bar flex flex-col gap-3 border-b border-slate-200 bg-transparent py-1 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:flex-1" role="tablist" aria-label="Danh mục dịch vụ">
            {[{ id: "all", name: "Tất cả" }, ...categories].map(category => <CategoryTab active={selectedCategory === category.id} category={category} key={category.id} onSelect={id => { setSelectedCategory(id); setCurrentPage(1); }} />)}
          </div>
          <label className="relative block shrink-0 lg:w-60 xl:w-64">
              <span className="sr-only">Tìm kiếm dịch vụ</span>
              <SearchIcon />
              <input aria-label="Tìm kiếm dịch vụ" className="field mt-0 min-h-11 pl-11" onChange={event => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Tìm dịch vụ..." type="search" value={query} />
          </label>
          <label className="relative block shrink-0 lg:w-52">
              <span className="sr-only">Sắp xếp</span>
              <select aria-label="Sắp xếp" className="field mt-0 min-h-11" onChange={event => { setSortOrder(event.target.value as SortOrder); setCurrentPage(1); }} value={sortOrder}>
                <option value="recommended">Sắp xếp: Phổ biến</option>
                <option value="name">Tên A–Z</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
              </select>
          </label>
          {hasFilters && <button className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" onClick={resetFilters} type="button">Xóa bộ lọc</button>}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal className="service-results-reveal" delay={140}>
        <section className={`${serviceShell} pb-16 sm:pb-20`} aria-labelledby="service-results-title">
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-2xl font-black tracking-[-.02em] text-[#10245a] sm:text-3xl" id="service-results-title">Gói dịch vụ Cloud</h2><p className="mt-1 text-sm text-slate-500">Chọn gói phù hợp với quy mô hệ thống của bạn.</p></div>
          {!loading && !error && <p className="shrink-0 text-sm font-semibold text-slate-500">{shownPlans.length} kết quả</p>}
        </div>
        {samplePreview && <p className="mt-3 text-xs font-semibold text-blue-700" role="status">Đang xem dữ liệu mẫu — không ghi vào API.</p>}
        {loading && <LoadingGrid />}
        {error && <ErrorState message={error} onRetry={() => void load(samplePreview)} />}
        {!loading && !error && !plans.length && <EmptyState />}
        {!loading && !error && plans.length > 0 && !shownPlans.length && <NoMatchState onReset={resetFilters} />}
        {!loading && !error && shownPlans.length > 0 && <>
          <div className="service-plan-grid mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visiblePlans.map((plan, index) => <ServicePlanCard animationDelay={index * 45} detail={details[plan.id]} key={`${activePage}-${plan.id}`} plan={plan} />)}</div>
          <nav aria-label="Phân trang gói dịch vụ" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button aria-label="Trang trước" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45" disabled={activePage === 1} onClick={() => goToPage(activePage - 1)} type="button">Trước</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => <button aria-current={activePage === page ? "page" : undefined} aria-label={`Trang ${page}`} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-black transition ${activePage === page ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`} key={page} onClick={() => goToPage(page)} type="button">{page}</button>)}
            <button aria-label="Trang sau" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45" disabled={activePage === pageCount} onClick={() => goToPage(activePage + 1)} type="button">Sau</button>
            <span aria-live="polite" className="basis-full text-center text-xs font-semibold text-slate-500 sm:basis-auto sm:pl-2">Hiển thị {visibleStart}–{visibleEnd} / {shownPlans.length} gói</span>
          </nav>
        </>}
        </section>
      </ScrollReveal>

      <ScrollReveal className="service-support-reveal" delay={80}>
        <section className={`${serviceShell} pb-16 sm:pb-20`}>
          <div className="service-support-panel h-[17.875rem] overflow-hidden rounded-lg border border-blue-100 bg-[linear-gradient(100deg,#eef7ff_0%,#e8f3ff_58%,#edf7ff_100%)] px-5 py-6 sm:px-8 lg:h-[13.875rem] lg:py-0">
          <div className="grid h-full items-center gap-5 lg:grid-cols-[.9fr_1.45fr_.9fr]">
            <div className="hidden lg:block"><ServiceSupportArt /></div>
            <div className="text-center">
              <h2 className="text-xl font-black tracking-[-.02em] text-[#10245a] lg:text-2xl">Bạn chưa biết chọn gói nào?</h2>
              <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-600 lg:text-sm lg:leading-5">Đội ngũ CloudServiceStore sẵn sàng tư vấn cấu hình phù hợp với nhu cầu của bạn.</p>
              <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="/order">Tư vấn cấu hình <ArrowRightIcon /></Link>
                <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-500 bg-white px-5 text-sm font-black text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="/pricing">Xem bảng giá</Link>
              </div>
            </div>
            <div className="hidden lg:block"><ServiceServerArt /></div>
          </div>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}

function LoadingGrid() {
  return <div aria-busy="true" aria-label="Đang tải danh sách dịch vụ" className="service-plan-grid mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(item => <div className="min-h-[22rem] animate-pulse rounded-2xl border border-slate-200 bg-white p-4" key={item}><div className="h-14 w-14 rounded-2xl bg-slate-200" /><div className="mt-4 h-6 w-24 rounded bg-slate-200" /><div className="mt-3 h-8 w-40 rounded bg-slate-200" /><div className="mt-2 h-10 rounded bg-slate-100" /><div className="mt-4 h-20 rounded bg-slate-100" /><div className="mt-5 h-11 rounded bg-slate-200" /></div>)}</div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert"><p className="font-bold text-red-800">{message}</p><button className="button-secondary mt-5 min-h-11 border-red-300 text-red-800 hover:bg-white" onClick={onRetry} type="button">Thử lại</button></div>;
}

function EmptyState() {
  return <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-white p-10 text-center"><h3 className="text-xl font-black text-slate-950">Chưa có gói dịch vụ đang mở bán</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Các gói dịch vụ công khai sẽ xuất hiện tại đây khi được kích hoạt. Bạn vẫn có thể gửi nhu cầu để đội ngũ tư vấn hỗ trợ.</p><Link className="button-primary mt-5 min-h-11" href="/order">Liên hệ tư vấn</Link></div>;
}

function NoMatchState({ onReset }: { onReset: () => void }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-white p-10 text-center"><h3 className="text-xl font-black text-slate-950">Không có gói phù hợp với bộ lọc hiện tại</h3><p className="mt-3 text-sm text-slate-600">Thử một từ khóa khác hoặc xem lại danh mục đang chọn.</p><button className="button-secondary mt-5 min-h-11" onClick={onReset} type="button">Xóa bộ lọc</button></div>;
}

function SearchIcon() {
  return <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function ArrowRightIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function CategoryTab({
  active,
  category,
  onSelect,
}: {
  active: boolean;
  category: CategoryOption;
  onSelect: (id: string) => void;
}) {
  const selectedClass = "min-h-11 shrink-0 rounded-lg bg-blue-600 px-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";
  const idleClass = "min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";
  return <button aria-label={category.id === "all" ? "Tất cả dịch vụ" : category.name} aria-selected={active} className={active ? selectedClass : idleClass} onClick={() => onSelect(category.id)} role="tab" type="button">{category.name}</button>;
}
