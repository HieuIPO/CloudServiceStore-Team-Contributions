"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  catalogApi,
  orderApi,
  type OrderDetail,
  type OrderListItem,
  type OrderStatus,
  type PagedResult,
  type ServicePlan
} from "@/lib/api";
import {
  StatusDot,
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import { AdminDialog } from "./admin/admin-dialog";
import {
  IconSearch,
  IconX,
  IconHistory,
  IconCheck
} from "@tabler/icons-react";
import { getOrderStatusPresentation, getOrderStatusLabel } from "@/lib/status-formatters";

// All 5 order statuses for filter dropdown
const allOrderStatuses = [1, 2, 3, 4, 5] as const;

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  1: [2, 4, 5],
  2: [3, 4, 5],
  3: [5],
  4: [],
  5: [],
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

type FeatureSnapshot = { featureKey: string; displayName: string; value: string; unit?: string };

export function AdminOrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryId = searchParams.get("id") || "";

  const [result, setResult] = useState<PagedResult<OrderListItem> | null>(null);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [planId, setPlanId] = useState("");
  const [page, setPage] = useState(1);
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [pendingRejectStatus, setPendingRejectStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const load = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await orderApi.all({
        page: requestedPage,
        pageSize: 15,
        search: search || undefined,
        servicePlanId: planId || undefined,
        status: status || undefined,
      });
      setResult(orders);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Thao tác không thành công.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, planId, status]);

  const openDetail = useCallback(async (id: string) => {
    setError(null);
    try {
      setSelected(await orderApi.detail(id));
      setStatusNote("");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể nạp thông tin chi tiết đơn.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const plansResult = await catalogApi.publicPlans();
        setPlans(plansResult.items);
        await load(1);
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : "Lỗi khởi tạo trang yêu cầu dịch vụ.");
      }
    })();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryId) {
        void openDetail(queryId);
      } else {
        setSelected(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [queryId, openDetail]);

  const handleSelectOrder = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleCloseDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/admin/orders?${params.toString()}`);
  };

  const changeStatus = async (next: OrderStatus, forceNoteCheck = true) => {
    if (!selected) return;

    if (forceNoteCheck && (next === 4 || next === 5) && !statusNote.trim()) {
      setPendingRejectStatus(next);
      setRejectModalOpen(true);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await orderApi.updateStatus(selected.id, next, statusNote.trim() || undefined);
      setSelected(updated);
      setStatusNote("");
      setRejectModalOpen(false);
      setNotice(`Đã chuyển yêu cầu sang “${getOrderStatusLabel(next)}”.`);
      await load(page);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật không thành công.");
    } finally {
      setSaving(false);
    }
  };

  const features = useMemo(() => {
    if (!selected) return [];
    try {
      return JSON.parse(selected.specificationSnapshot) as FeatureSnapshot[];
    } catch {
      return [];
    }
  }, [selected]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Yêu cầu dịch vụ"
        description="Theo dõi danh sách tư vấn, xác nhận hoặc cập nhật tiến độ xử lý yêu cầu khách hàng."
      />

      {error && <ErrorState message={error} onRetry={() => load(page)} />}
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

      {/* Filter Bar */}
      <div className="admin-card !p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, sđt, công ty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input !pl-8"
          />
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value ? (Number(e.target.value) as OrderStatus) : "")}
          className="admin-select !w-44"
        >
          <option value="">Tất cả trạng thái</option>
          {allOrderStatuses.map(v => (
            <option key={v} value={v}>
              {getOrderStatusLabel(v)}
            </option>
          ))}
        </select>

        <select
          value={planId}
          onChange={e => setPlanId(e.target.value)}
          className="admin-select admin-orders-plan-select !w-48"
        >
          <option value="">Tất cả gói dịch vụ</option>
          {plans.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setPage(1);
            load(1);
          }}
          className="admin-button admin-button-primary admin-button-sm"
        >
          Lọc kết quả
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders Table Area */}
        <div className={`${selected ? "xl:col-span-2" : "xl:col-span-3"} min-w-0 space-y-4`}>
          {loading && !result ? (
            <SkeletonLoader rows={6} />
          ) : !result?.items.length ? (
            <EmptyState title="Không có yêu cầu" description="Không tìm thấy yêu cầu dịch vụ phù hợp." />
          ) : (
            <>
              <div className="hidden md:block admin-table-container">
                <table className="admin-table admin-orders-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Gói dịch vụ</th>
                      <th>Giá báo</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map(item => {
                      const isSelected = item.id === queryId;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectOrder(item.id)}
                          className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                        >
                          <td className="admin-order-customer-cell">
                            <div className="font-semibold text-slate-900">{item.customerName}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.email} · {item.phoneNumber}
                            </div>
                          </td>
                          <td className="admin-order-plan-cell">
                            <div className="admin-order-plan-name font-medium text-slate-800" title={item.planName}>
                              {item.planName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.billingCycle === 1 ? "Theo tháng" : "Theo năm"}
                            </div>
                          </td>
                          <td className="admin-order-amount-cell">
                            <div className="font-semibold text-slate-900">
                              {money(item.quotedAmount, item.currency)}
                            </div>
                          </td>
                          <td className="admin-order-status-cell">
                            {(() => {
                              const pres = getOrderStatusPresentation(item.status);
                              return <StatusDot status={pres.group} label={pres.label} />;
                            })()}
                          </td>
                          <td data-metadata className="admin-order-date-cell text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (<768px) */}
              <div className="block md:hidden space-y-3">
                {result.items.map(item => {
                  const isSelected = item.id === queryId;
                  const pres = getOrderStatusPresentation(item.status);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectOrder(item.id)}
                      aria-label={`Xem chi tiết đơn hàng của ${item.customerName}`}
                      className={`w-full text-left p-4 bg-white rounded-lg border transition-all space-y-2 ${
                        isSelected ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm truncate">{item.customerName}</span>
                        <StatusDot status={pres.group} label={pres.label} />
                      </div>
                      <div className="min-w-0 text-xs text-slate-600">
                        <span className="block truncate font-medium text-slate-900" title={item.planName}>
                          {item.planName}
                        </span>
                        <span>{item.billingCycle === 1 ? "Theo tháng" : "Theo năm"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-900">{money(item.quotedAmount, item.currency)}</span>
                        <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {result && (
            <SimplePagination
              page={page}
              totalPages={result.totalPages}
              onPageChange={p => {
                setPage(p);
                load(p);
              }}
            />
          )}
        </div>

        {/* Selected Order Detail Pane */}
        {selected && (
          <div className="admin-card admin-detail-panel space-y-4 self-start xl:sticky xl:top-20 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="admin-detail-header-copy">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Chi tiết đơn hàng
                </span>
                <h2 className="admin-detail-title text-sm font-bold text-slate-900">{selected.customerName}</h2>
              </div>
              <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Công ty:</span>
                  <div className="font-medium text-slate-800">{selected.companyName || "—"}</div>
                </div>
                <div>
                  <span className="text-slate-500">Số điện thoại:</span>
                  <div className="font-medium text-slate-800">{selected.phoneNumber}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Email:</span>
                <div className="admin-detail-value font-medium text-slate-800">{selected.email}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="admin-detail-value font-semibold text-slate-900">{selected.planName}</div>
                <div className="text-[11px] text-slate-500">
                  {selected.billingCycle === 1 ? "Theo tháng" : "Theo năm"}
                </div>
                <div className="font-bold text-slate-900 text-sm mt-1">
                  {money(selected.quotedAmount, selected.currency)}
                </div>
                {selected.originalAmount !== selected.quotedAmount && (
                  <div className="text-[10px] text-slate-400">
                    Giá gốc: {money(selected.originalAmount, selected.currency)}
                  </div>
                )}
              </div>

              {features.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Cấu hình tính năng:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {features.map(f => (
                      <div key={f.featureKey} className="p-2 border border-slate-100 rounded bg-slate-50">
                        <span className="text-slate-400 text-[10px] block">{f.displayName}</span>
                        <span className="font-semibold text-slate-800">
                          {f.value} {f.unit || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.note && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Ghi chú của khách:</span>
                  <p className="admin-detail-value p-2 bg-slate-50 border border-slate-100 rounded text-slate-700 whitespace-pre-wrap">
                    {selected.note}
                  </p>
                </div>
              )}

              {/* Status Change Actions */}
              {nextStatuses[selected.status].length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="block font-semibold text-slate-700">Ghi chú xử lý nội bộ:</label>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="Nhập ghi chú xử lý (bắt buộc nếu từ chối)..."
                    className="admin-textarea"
                  />

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nextStatuses[selected.status].map(next => (
                      <button
                        key={next}
                        disabled={saving}
                        onClick={() => changeStatus(next)}
                        className={`admin-button admin-button-sm flex-1 ${
                          next === 3
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : next === 4 || next === 5
                            ? "admin-button-danger"
                            : "admin-button-primary"
                        }`}
                      >
                        {getOrderStatusLabel(next)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History Timeline */}
              {selected.statusHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mb-2">
                    <IconHistory size={14} /> Lịch sử thay đổi
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selected.statusHistory.map(h => (
                      <div key={h.id} className="p-2 border-l-2 border-slate-300 bg-slate-50 rounded-r text-[11px]">
                        <div className="font-semibold text-slate-800">{getOrderStatusLabel(h.toStatus)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleString("vi-VN")}
                        </div>
                        {h.note && <div className="text-slate-600 mt-1">{h.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AdminDialog
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Xác nhận từ chối / hủy yêu cầu"
        description="Vui lòng nhập lý do từ chối yêu cầu này (bắt buộc)."
      >
        <div className="space-y-4">
          <textarea
            required
            rows={3}
            value={statusNote}
            onChange={e => setStatusNote(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            className="admin-textarea"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="admin-button admin-button-secondary admin-button-sm"
            >
              Hủy
            </button>
            <button
              onClick={() => pendingRejectStatus && changeStatus(pendingRejectStatus, false)}
              disabled={!statusNote.trim() || saving}
              className="admin-button admin-button-danger admin-button-sm"
            >
              {saving ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </div>
      </AdminDialog>
    </div>
  );
}
