"use client";

import React, { useEffect, useState } from "react";
import {
  catalogApi,
  promotionApi,
  apiBaseUrl,
  type Promotion,
  type ServicePlan,
  ApiError
} from "@/lib/api";
import {
  StatusDot,
  PageHeader,
  EmptyState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import { AdminDialog } from "./admin/admin-dialog";
import {
  IconQrcode,
  IconPlus,
  IconTrash,
  IconCopy,
  IconDownload,
  IconCheck,
  IconX,
  IconAlertCircle
} from "@tabler/icons-react";

const QR_PAGE_SIZE = 6;
const PROMOTION_PAGE_SIZE = 10;

const localDate = (offsetDays: number) => {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const formatPromotionDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
};

const formatBillingCycle = (billingCycle?: 1 | 12 | null) =>
  billingCycle === 1 ? "Theo tháng" : billingCycle === 12 ? "Theo năm" : "Theo tháng và năm";

export function AdminPromotionsClient() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [allPlans, setAllPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [promotionPage, setPromotionPage] = useState(1);
  const [qrPage, setQrPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [planTarget, setPlanTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: "",
    name: "",
    discountType: 1 as 1 | 2,
    discountValue: 10,
    billingCycle: null as 1 | 12 | null,
    startsAt: localDate(0),
    endsAt: localDate(30),
    showOnPublicBanner: false,
    servicePlanIds: [] as string[]
  });

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<{ planName: string; imagePath: string; targetUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setError(null);
    try {
      const [actPromos, inactPromos, planRes] = await Promise.all([
        promotionApi.all(true),
        promotionApi.all(false),
        catalogApi.adminPlans(null, 1, 100, true)
      ]);
      setPromotions([...actPromos.items, ...inactPromos.items]);
      setPlans(planRes.items.filter(plan => plan.isActive));
      setAllPlans(planRes.items);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải dữ liệu Khuyến mãi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.servicePlanIds.length) {
      setError("Vui lòng chọn ít nhất 1 gói dịch vụ áp dụng.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await promotionApi.create({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        billingCycle: form.billingCycle,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isActive: true,
        showOnPublicBanner: form.showOnPublicBanner,
        servicePlanIds: form.servicePlanIds
      });
      setNotice(`Đã tạo mã khuyến mãi "${form.code.toUpperCase()}" thành công.`);
      setForm({
        code: "",
        name: "",
        discountType: 1,
        discountValue: 10,
        billingCycle: null,
        startsAt: localDate(0),
        endsAt: localDate(30),
        showOnPublicBanner: false,
        servicePlanIds: []
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Tạo khuyến mãi thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    setError(null);
    try {
      const isActive = !promo.isActive;
      await promotionApi.update(promo.id, {
        ...promo,
        isActive,
        showOnPublicBanner: isActive && promo.showOnPublicBanner
      });
      setNotice(`Đã cập nhật trạng thái mã "${promo.code}".`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật thất bại.");
    }
  };

  const handleSetPublicBanner = async (promo: Promotion) => {
    if (!promo.isActive) {
      setError("Chỉ có thể chọn mã đang bật làm banner công khai.");
      return;
    }

    setError(null);
    setNotice(null);
    try {
      await promotionApi.update(promo.id, {
        ...promo,
        isActive: true,
        showOnPublicBanner: true
      });
      setNotice(`Đã chọn "${promo.name}" làm banner công khai. Khuyến mãi trước đó đã được bỏ chọn.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể chọn banner công khai.");
    }
  };

  const requestDeletePromotion = (promo: Promotion) => {
    setError(null);
    setDeleteTarget(promo);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const promo = deleteTarget;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      await promotionApi.delete(promo.id);
      setNotice(`Đã xóa khuyến mãi "${promo.name}".`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Xóa khuyến mãi thất bại.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const togglePlanSelection = (id: string) => {
    setForm(prev => ({
      ...prev,
      servicePlanIds: prev.servicePlanIds.includes(id)
        ? prev.servicePlanIds.filter(x => x !== id)
        : [...prev.servicePlanIds, id]
    }));
  };

  const handleGenerateQr = async (plan: ServicePlan) => {
    setQrLoading(true);
    setError(null);
    try {
      const res = await catalogApi.generateQr(plan.id);
      setQrData({
        planName: plan.name,
        imagePath: res.imagePath,
        targetUrl: res.targetUrl
      });
      setQrModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể sinh mã QR.");
    } finally {
      setQrLoading(false);
    }
  };

  const copyQrUrl = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promotionPageCount = Math.max(1, Math.ceil(promotions.length / PROMOTION_PAGE_SIZE));
  const safePromotionPage = Math.min(promotionPage, promotionPageCount);
  const visiblePromotions = promotions.slice(
    (safePromotionPage - 1) * PROMOTION_PAGE_SIZE,
    safePromotionPage * PROMOTION_PAGE_SIZE
  );
  const qrTotalPages = Math.max(1, Math.ceil(plans.length / QR_PAGE_SIZE));
  const safeQrPage = Math.min(qrPage, qrTotalPages);
  const visibleQrPlans = plans.slice((safeQrPage - 1) * QR_PAGE_SIZE, safeQrPage * QR_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Khuyến mãi & Mã QR"
        description="Thiết lập mã giảm giá áp dụng cho gói dịch vụ và tạo mã QR liên kết trực tiếp."
      />

      {error && (
        <div
          key={error}
          className="admin-toast admin-toast-error"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span className="admin-toast-icon" aria-hidden="true">
            <IconAlertCircle size={18} stroke={2.5} />
          </span>
          <span className="admin-toast-copy">
            <strong className="admin-toast-title">Thao tác không thành công</strong>
            <span className="admin-toast-message">{error}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void loadData()}
              className="admin-toast-retry"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => setError(null)}
              className="admin-toast-close"
              aria-label="Đóng thông báo"
            >
              <IconX size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
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

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Create Promotion Form */}
          <div className="admin-card space-y-4 self-start">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Tạo mã khuyến mãi mới
            </h2>

            <form onSubmit={handleCreatePromotion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mã khuyến mãi (Code) *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="SALE2026"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="admin-input uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tên chương trình *</label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    placeholder="Giảm giá khai trương"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Áp dụng theo chu kỳ *</label>
                <select
                  value={form.billingCycle ?? 0}
                  onChange={e => {
                    const value = Number(e.target.value);
                    setForm({ ...form, billingCycle: value === 1 || value === 12 ? value : null });
                  }}
                  className="admin-select"
                >
                  <option value={0}>Theo tháng và năm</option>
                  <option value={1}>Chỉ theo tháng</option>
                  <option value={12}>Chỉ theo năm</option>
                </select>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">Khuyến mãi cũ không chọn chu kỳ sẽ tiếp tục áp dụng cho cả hai.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Loại giảm giá *</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: Number(e.target.value) as 1 | 2 })}
                    className="admin-select"
                  >
                    <option value={1}>Theo phần trăm (%)</option>
                    <option value={2}>Số tiền cố định (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mức giảm *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    max={form.discountType === 1 ? 100 : undefined}
                    required
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Thời điểm bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startsAt}
                    onChange={e => setForm({ ...form, startsAt: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Thời điểm kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endsAt}
                    onChange={e => setForm({ ...form, endsAt: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-slate-700">
                <input
                  type="checkbox"
                  checked={form.showOnPublicBanner}
                  onChange={e => setForm({ ...form, showOnPublicBanner: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">Hiển thị trên banner công khai</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    Chỉ một chương trình được hiển thị; nếu chọn chương trình này, lựa chọn trước đó sẽ tự bỏ.
                  </span>
                </span>
              </label>

              {/* Applied Plans Checklist */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chọn gói dịch vụ áp dụng ({form.servicePlanIds.length}) *
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2 space-y-1.5 bg-slate-50">
                  {plans.map(p => (
                    <label key={p.id} className="admin-promotion-plan-option flex items-center gap-2 min-w-0 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={form.servicePlanIds.includes(p.id)}
                        onChange={() => togglePlanSelection(p.id)}
                        className="shrink-0 rounded border-slate-300"
                      />
                      <span className="admin-promotion-plan-name min-w-0 flex-1 font-medium" title={p.name}>{p.name}</span>
                      <span className="admin-promotion-plan-category max-w-[35%] shrink-0 truncate text-[10px] text-slate-400" title={p.categoryName}>({p.categoryName})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || !form.servicePlanIds.length}
                  className="admin-button admin-button-primary admin-button-sm w-full"
                >
                  <IconPlus size={16} /> {saving ? "Đang tạo..." : "Lưu mã khuyến mãi"}
                </button>
              </div>
            </form>
          </div>

          {/* Promotions List */}
          <div className="admin-card space-y-3">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Danh sách khuyến mãi ({promotions.length})
            </h2>

            {promotions.length === 0 ? (
              <EmptyState title="Chưa có khuyến mãi" />
            ) : (
              <>
                <div className="hidden md:block admin-table-container">
                    <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Thời gian áp dụng</th>
                        <th>Chương trình</th>
                        <th>Mức giảm</th>
                        <th>Chu kỳ</th>
                        <th>Số gói</th>
                        <th>Trạng thái</th>
                        <th>Banner công khai</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePromotions.map(promo => (
                        <tr key={promo.id}>
                          <td>
                            <div className="space-y-0.5 whitespace-nowrap text-[11px] leading-4 text-slate-600">
                              <div><span className="text-slate-400">Bắt đầu:</span> {formatPromotionDateTime(promo.startsAt)}</div>
                              <div><span className="text-slate-400">Kết thúc:</span> {formatPromotionDateTime(promo.endsAt)}</div>
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-slate-900">{promo.name}</div>
                            <div className="text-[11px] font-mono text-blue-600">{promo.code}</div>
                          </td>
                          <td>
                            <span className="font-bold text-slate-900">
                              {promo.discountType === 1
                                ? `${promo.discountValue}%`
                                : `${promo.discountValue.toLocaleString("vi-VN")} ₫`}
                            </span>
                          </td>
                          <td><span className="whitespace-nowrap text-xs text-slate-600">{formatBillingCycle(promo.billingCycle)}</span></td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setPlanTarget(promo)}
                              className="text-left text-blue-700 hover:text-blue-900 hover:underline"
                              aria-label={`Xem gói áp dụng cho ${promo.name}`}
                            >
                              <span className="block font-medium">{promo.servicePlanIds.length} gói</span>
                              <span className="block text-[10px]">Xem gói áp dụng</span>
                            </button>
                          </td>
                          <td>
                            <StatusDot
                              status={promo.isActive ? "completed" : "cancelled"}
                              label={promo.isActive ? "Đang bật" : "Đã tắt"}
                            />
                          </td>
                          <td>
                            {promo.showOnPublicBanner && promo.isActive ? (
                              <StatusDot status="completed" label="Đang hiển thị" />
                            ) : promo.isActive ? (
                              <button
                                type="button"
                                onClick={() => void handleSetPublicBanner(promo)}
                                className="min-h-[44px] rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Chọn banner
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Không khả dụng</span>
                            )}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(promo)}
                                className={`px-2.5 py-1 min-h-[44px] text-xs font-semibold rounded ${
                                  promo.isActive
                                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                                aria-label={`${promo.isActive ? "Tắt" : "Bật"} mã khuyến mãi ${promo.code}`}
                              >
                                {promo.isActive ? "Tắt" : "Bật"}
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeletePromotion(promo)}
                                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 rounded"
                                title="Xóa"
                                aria-label={`Xóa khuyến mãi ${promo.name}`}
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (<768px) */}
                <div className="block md:hidden space-y-3">
                  {visiblePromotions.map(promo => (
                    <div
                      key={promo.id}
                      className="p-4 bg-white rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{promo.name}</h3>
                          <span className="text-xs font-mono text-blue-600 font-bold">{promo.code}</span>
                        </div>
                        <StatusDot
                          status={promo.isActive ? "completed" : "cancelled"}
                          label={promo.isActive ? "Đang bật" : "Đã tắt"}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <span>
                          Giảm:{" "}
                          <strong className="text-slate-900">
                            {promo.discountType === 1
                              ? `${promo.discountValue}%`
                              : `${promo.discountValue.toLocaleString("vi-VN")} ₫`}
                          </strong>
                        </span>
                        <span className="text-slate-500">{formatBillingCycle(promo.billingCycle)}</span>
                        <button
                          type="button"
                          onClick={() => setPlanTarget(promo)}
                          className="text-right font-medium text-blue-700 hover:text-blue-900 hover:underline"
                          aria-label={`Xem gói áp dụng cho ${promo.name}`}
                        >
                          {promo.servicePlanIds.length} gói áp dụng
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                        <span className="text-slate-500">Banner công khai</span>
                        {promo.showOnPublicBanner && promo.isActive ? (
                          <StatusDot status="completed" label="Đang hiển thị" />
                        ) : promo.isActive ? (
                          <button
                            type="button"
                            onClick={() => void handleSetPublicBanner(promo)}
                            className="min-h-[44px] rounded bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Chọn banner
                          </button>
                        ) : (
                          <span className="text-slate-400">Không khả dụng</span>
                        )}
                      </div>
                      <div className="space-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                        <div className="font-medium text-slate-700">Thời gian áp dụng</div>
                        <div>Bắt đầu: {formatPromotionDateTime(promo.startsAt)}</div>
                        <div>Kết thúc: {formatPromotionDateTime(promo.endsAt)}</div>
                      </div>
                      <div className="flex items-center justify-end pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(promo)}
                            className={`px-3 py-1.5 min-h-[44px] text-xs font-semibold rounded ${
                              promo.isActive
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            aria-label={`${promo.isActive ? "Tắt" : "Bật"} mã khuyến mãi ${promo.code}`}
                          >
                            {promo.isActive ? "Tắt" : "Bật"}
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeletePromotion(promo)}
                            className="px-3 py-1.5 min-h-[44px] text-xs font-semibold bg-rose-50 text-rose-700 rounded hover:bg-rose-100 flex items-center gap-1"
                            aria-label={`Xóa khuyến mãi ${promo.name}`}
                          >
                            <IconTrash size={14} /> Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {promotionPageCount > 1 && (
                  <SimplePagination
                    page={safePromotionPage}
                    totalPages={promotionPageCount}
                    onPageChange={setPromotionPage}
                  />
                )}
              </>
            )}
          </div>

          {/* QR Code Generator Section */}
          <div className="lg:col-span-2 admin-card space-y-3">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center gap-1.5">
              <IconQrcode size={16} /> Quản lý và sinh mã QR cho Gói dịch vụ
            </h2>
            <p className="text-slate-500">
              Mã QR sẽ trỏ trực tiếp đến trang công khai của gói dịch vụ để khách hàng quét nhanh.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {visibleQrPlans.map(plan => (
                <div key={plan.id} className="admin-qr-plan-card p-3 border border-slate-200 rounded flex min-w-0 items-center justify-between gap-3 bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="admin-qr-plan-name font-semibold text-slate-900" title={plan.name}>{plan.name}</div>
                    <div className="admin-qr-plan-slug break-all text-[10px] text-slate-400" title={`/services/${plan.slug}`}>/services/{plan.slug}</div>
                  </div>
                  <button
                    onClick={() => handleGenerateQr(plan)}
                    disabled={qrLoading}
                    className="admin-button admin-button-secondary admin-button-sm shrink-0 whitespace-nowrap"
                  >
                    <IconQrcode size={14} /> Sinh QR
                  </button>
                </div>
              ))}
            </div>
            <SimplePagination
              page={safeQrPage}
              totalPages={qrTotalPages}
              onPageChange={setQrPage}
            />
          </div>
        </div>
      )}

      {/* QR Preview Dialog Modal */}
      <AdminDialog
        isOpen={qrModalOpen && !!qrData}
        onClose={() => setQrModalOpen(false)}
        title={`Mã QR: ${qrData?.planName || ""}`}
        maxWidthClass="max-w-sm"
      >
        {qrData && (
          <div className="text-center space-y-4">
            <div className="flex justify-center p-4 bg-slate-50 border border-slate-100 rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${apiBaseUrl}${qrData.imagePath}`}
                alt={`QR code for ${qrData.planName}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="text-left space-y-1">
              <span className="text-slate-500 block">Đường dẫn đích (Target URL):</span>
              <div className="p-2 bg-slate-100 border border-slate-200 rounded font-mono break-all text-[11px] text-slate-800">
                {qrData.targetUrl}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={copyQrUrl}
                className="admin-button admin-button-secondary admin-button-sm flex-1"
              >
                {copied ? <IconCheck size={14} className="text-emerald-600" /> : <IconCopy size={14} />}
                {copied ? "Đã chép" : "Copy URL"}
              </button>

              <a
                href={`${apiBaseUrl}${qrData.imagePath}`}
                download={`qr-${qrData.planName}.png`}
                target="_blank"
                rel="noreferrer"
                className="admin-button admin-button-primary admin-button-sm flex-1"
              >
                <IconDownload size={14} /> Tải ảnh QR
              </a>
            </div>
          </div>
        )}
      </AdminDialog>

      {/* Applied Plans Dialog */}
      <AdminDialog
        isOpen={!!planTarget}
        onClose={() => setPlanTarget(null)}
        title={`Gói áp dụng: ${planTarget?.code ?? ""}`}
        description={planTarget ? `${planTarget.name} · ${planTarget.servicePlanIds.length} gói` : undefined}
        maxWidthClass="max-w-lg"
      >
        {planTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Thời gian áp dụng</div>
              <div className="mt-1">Bắt đầu: {formatPromotionDateTime(planTarget.startsAt)}</div>
              <div>Kết thúc: {formatPromotionDateTime(planTarget.endsAt)}</div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold text-slate-900">Danh sách gói áp dụng</h4>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {planTarget.servicePlanIds.map(planId => {
                  const plan = allPlans.find(item => item.id === planId);
                  return (
                    <li key={planId} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="font-semibold text-slate-900">
                        {plan?.name ?? "Gói không còn trong danh mục"}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {plan ? `${plan.categoryName} · ${plan.isActive ? "Đang bật" : "Đã tắt"}` : `ID: ${planId}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPlanTarget(null)}
                className="admin-button admin-button-secondary admin-button-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </AdminDialog>

      {/* Promotion Delete Confirmation Dialog */}
      <AdminDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Xóa khuyến mãi"
        description="Kiểm tra lại thông tin trước khi xác nhận thao tác."
        isSubmitting={deleting}
      >
        {deleteTarget && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Bạn có chắc chắn muốn xóa khuyến mãi{" "}
              <strong className="text-slate-900">“{deleteTarget.name}”</strong>?
            </p>
            <p className="text-slate-500">
              Mã khuyến mãi sẽ được ẩn khỏi danh sách sử dụng nhưng vẫn được lưu trong lịch sử hệ thống.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="admin-button admin-button-secondary admin-button-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="admin-button admin-button-danger admin-button-sm"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
