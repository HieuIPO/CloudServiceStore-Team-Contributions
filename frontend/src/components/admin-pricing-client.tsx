"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  catalogApi,
  type ServicePlan,
  type ServicePlanDetail,
  type PlanPrice,
  ApiError
} from "@/lib/api";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonLoader,
  StatusDot,
  SimplePagination
} from "./admin/admin-primitives";
import {
  IconHistory,
  IconPlus,
  IconCheck,
  IconX
} from "@tabler/icons-react";

const money = (val: number, cur = "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(val);

const compactPlanOptionLabel = (plan: Pick<ServicePlan, "name" | "categoryName">) => {
  const maxNameLength = 36;
  const name = plan.name.length > maxNameLength
    ? `${plan.name.slice(0, maxNameLength - 1)}…`
    : plan.name;
  return `${name} (${plan.categoryName})`;
};

const PRICE_PAGE_SIZE = 10;

const getPricePresentation = (price: Pick<PlanPrice, "effectiveFrom" | "effectiveTo" | "isActive">) => {
  const now = Date.now();
  const effectiveFrom = Date.parse(price.effectiveFrom);
  const effectiveTo = price.effectiveTo ? Date.parse(price.effectiveTo) : undefined;

  if (!price.isActive) return { status: "cancelled", label: "Đã ngưng" } as const;
  if (Number.isFinite(effectiveFrom) && effectiveFrom > now) return { status: "inProgress", label: "Sắp áp dụng" } as const;
  if (effectiveTo !== undefined && Number.isFinite(effectiveTo) && effectiveTo <= now) return { status: "cancelled", label: "Đã kết thúc" } as const;
  return { status: "completed", label: "Đang áp dụng" } as const;
};

export function AdminPricingClient() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [planDetail, setPlanDetail] = useState<ServicePlanDetail | null>(null);
  const [pricePage, setPricePage] = useState(1);

  const [amount, setAmount] = useState<number>(199000);
  const [billingCycle, setBillingCycle] = useState<1 | 12>(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const pricePageCount = Math.max(1, Math.ceil((planDetail?.prices.length ?? 0) / PRICE_PAGE_SIZE));
  const activePricePage = Math.min(pricePage, pricePageCount);
  const visiblePrices = planDetail?.prices.slice(
    (activePricePage - 1) * PRICE_PAGE_SIZE,
    activePricePage * PRICE_PAGE_SIZE
  ) ?? [];

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadPlans = useCallback(async () => {
    setError(null);
    try {
      const res = await catalogApi.adminPlans(true);
      setPlans(res.items);
      if (res.items.length > 0 && !selectedPlanId) {
        setSelectedPlanId(res.items[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải danh sách gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void loadPlans();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPlans]);

  const loadPlanDetail = useCallback(async (id: string) => {
    setError(null);
    try {
      const detail = await catalogApi.plan(id);
      setPlanDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải lịch sử giá gói.");
    }
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      const timer = setTimeout(() => {
        void loadPlanDetail(selectedPlanId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedPlanId, loadPlanDetail]);

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || amount <= 0) return;

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await catalogApi.createPrice(selectedPlanId, {
        billingCycle,
        amount,
        currency: "VND",
        effectiveFrom: new Date().toISOString(),
        isActive: true
      });
      setNotice(`Đã cập nhật mức giá mới cho gói.`);
      setPricePage(1);
      await loadPlanDetail(selectedPlanId);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Thêm giá mới không thành công.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bảng giá & Lịch sử hiệu lực"
        description="Cấu hình bảng giá theo chu kỳ (tháng/năm). Mức giá mới tạo sẽ tự động đóng hiệu lực giá trước đó cùng chu kỳ."
      />

      {error && <ErrorState message={error} onRetry={loadPlans} />}
      {notice && (
        <div
          key={notice}
          className="admin-toast admin-toast-success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="admin-toast-icon" aria-hidden="true">
            <IconCheck size={18} stroke={2.5} />
          </span>
          <span className="admin-toast-copy">
            <strong className="admin-toast-title">Cập nhật thành công</strong>
            <span className="admin-toast-message">{notice}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="admin-toast-close"
            aria-label="Đóng thông báo"
          >
            <IconX size={16} aria-hidden="true" />
          </button>
          <span className="admin-toast-progress" aria-hidden="true" />
        </div>
      )}

      {loading && !plans.length ? (
        <SkeletonLoader rows={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Select Plan & Create Price */}
          <div className="admin-card space-y-4 self-start">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Chọn gói & Tạo mức giá mới
            </h2>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Chọn gói dịch vụ *</label>
              <select
                value={selectedPlanId}
                onChange={e => {
                  setSelectedPlanId(e.target.value);
                  setPricePage(1);
                }}
                className="admin-select admin-pricing-plan-select"
                title={selectedPlan ? `${selectedPlan.name} (${selectedPlan.categoryName})` : undefined}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {compactPlanOptionLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleCreatePrice} className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Chu kỳ thanh toán *</label>
                <select
                  value={billingCycle}
                  onChange={e => setBillingCycle(Number(e.target.value) as 1 | 12)}
                  className="admin-select"
                >
                  <option value={1}>Theo tháng (Monthly)</option>
                  <option value={12}>Theo năm (Yearly)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Số tiền (VND) *</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="admin-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || !selectedPlanId}
                  className="admin-button admin-button-primary admin-button-sm w-full"
                >
                  <IconPlus size={16} /> {saving ? "Đang lưu..." : "Áp dụng giá mới"}
                </button>
              </div>
            </form>
          </div>

          {/* Price History Table */}
          <div className="lg:col-span-2 admin-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="min-w-0 font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <IconHistory size={16} className="shrink-0" />
                <span
                  className="admin-pricing-history-title min-w-0 truncate"
                  title={planDetail?.name ? `Lịch sử giá của gói: ${planDetail.name}` : undefined}
                >
                  Lịch sử giá của gói: {planDetail?.name || "..."}
                </span>
              </h2>
            </div>

            {!planDetail?.prices?.length ? (
              <EmptyState title="Chưa có thiết lập giá" description="Gói dịch vụ này hiện chưa có mức giá nào." />
            ) : (
              <>
                <div className="hidden md:block admin-table-container">
                  <table className="admin-table admin-pricing-table">
                    <thead>
                      <tr>
                        <th>Chu kỳ</th>
                        <th>Mức giá</th>
                        <th>Hiệu lực từ</th>
                        <th>Đến ngày</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePrices.map(p => {
                        const presentation = getPricePresentation(p);
                        return <tr key={p.id}>
                          <td className="font-semibold text-slate-900">
                            {p.billingCycle === 1 ? "Theo tháng" : "Theo năm"}
                          </td>
                          <td className="font-bold text-slate-900">{money(p.amount, p.currency)}</td>
                          <td className="text-slate-500">
                            {new Date(p.effectiveFrom).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="text-slate-500">
                            {p.effectiveTo ? new Date(p.effectiveTo).toLocaleDateString("vi-VN") : "Hiện tại"}
                          </td>
                          <td className="admin-pricing-status-cell">
                            <StatusDot
                              status={presentation.status}
                              label={presentation.label}
                            />
                          </td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {visiblePrices.map(p => {
                    const presentation = getPricePresentation(p);
                    return <div key={p.id} className="admin-card space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900">{p.billingCycle === 1 ? "Theo tháng" : "Theo năm"}</span>
                        <StatusDot
                          status={presentation.status}
                          label={presentation.label}
                        />
                      </div>
                      <div className="text-base font-extrabold text-blue-700">{money(p.amount, p.currency)}</div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Từ: {new Date(p.effectiveFrom).toLocaleDateString("vi-VN")}</span>
                        <span>Đến: {p.effectiveTo ? new Date(p.effectiveTo).toLocaleDateString("vi-VN") : "Hiện tại"}</span>
                      </div>
                    </div>
                  })}
                </div>

                {pricePageCount > 1 && (
                  <SimplePagination
                    page={activePricePage}
                    totalPages={pricePageCount}
                    onPageChange={setPricePage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
