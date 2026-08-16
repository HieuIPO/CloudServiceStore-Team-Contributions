"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  editorWorkspaceApi,
  orderApi,
  affiliateApi,
  EditorWorkspaceDto,
  EditorWorkspaceQueueItem,
  OrderDetail,
  AffiliateDetail,
  OrderStatus,
  AffiliateStatus,
  ApiError
} from "@/lib/api";
import {
  MetricCard,
  StatusDot,
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonLoader,
  SimplePagination
} from "./admin-primitives";
import { AdminDialog } from "./admin-dialog";
import { getOrderStatusPresentation, getAffiliateStatusPresentation, getQueueItemStatusPresentation } from "@/lib/status-formatters";
import {
  IconBriefcase,
  IconClock,
  IconFileText,
  IconCheck,
  IconX,
  IconFilter,
  IconHistory,
  IconSearch,
  IconAlertCircle,
  IconBan,
  IconChevronDown,
  IconChevronRight
} from "@tabler/icons-react";

type ToastState = { type: "success" | "error"; message: string } | null;

export function EditorWorkspaceClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentType = searchParams.get("type") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentSelectedType = searchParams.get("selectedType") || "";
  const currentId = searchParams.get("id") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [data, setData] = useState<EditorWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local Search Input state for debouncing
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Detail panel state
  const [selectedItem, setSelectedItem] = useState<EditorWorkspaceQueueItem | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [affiliateDetail, setAffiliateDetail] = useState<AffiliateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Action state
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ status: number; isReject: boolean; isCancel: boolean } | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const activeRequestRef = useRef<number>(0);
  const workspaceRequestControllerRef = useRef<AbortController | null>(null);

  const updateWorkspaceUrl = useCallback((params: URLSearchParams) => {
    const query = params.toString();
    window.history.pushState(null, "", query ? `/admin/workspace?${query}` : "/admin/workspace");
  }, []);

  useEffect(() => {
    if (!sortMenuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".editor-workspace-sort-control")) return;
      setSortMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sortMenuOpen]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Workspace Queue
  const fetchWorkspace = useCallback(async () => {
    workspaceRequestControllerRef.current?.abort();
    const requestController = new AbortController();
    workspaceRequestControllerRef.current = requestController;
    const requestId = ++activeRequestRef.current;
    setError(null);
    try {
      const res = await editorWorkspaceApi.get({
        page: currentPage,
        pageSize: 15,
        type: currentType,
        status: currentStatus,
        search: currentSearch,
        sort: currentSort
      }, requestController.signal);
      if (requestId === activeRequestRef.current) {
        setData(res);
      }
    } catch (err: unknown) {
      if (requestId === activeRequestRef.current && !requestController.signal.aborted) {
        const msg = err instanceof ApiError ? err.message : "Không thể tải dữ liệu Workspace.";
        setError(msg);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
      if (workspaceRequestControllerRef.current === requestController) {
        workspaceRequestControllerRef.current = null;
      }
    }
  }, [currentPage, currentType, currentStatus, currentSearch, currentSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchWorkspace();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWorkspace]);

  useEffect(() => {
    return () => {
      workspaceRequestControllerRef.current?.abort();
    };
  }, []);

  // Sync searchInput when URL search param changes (e.g. Back/Forward)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchInput(currentSearch);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentSearch]);

  // Debounced search input to URL param (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
          params.set("search", searchInput.trim());
        } else {
          params.delete("search");
        }
        params.delete("page");
        updateWorkspaceUrl(params);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, searchParams, updateWorkspaceUrl]);

  // Load item details
  const loadDetail = useCallback(async (id: string, type: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setActionNote("");
    try {
      if (type === "order") {
        const res = await orderApi.detail(id);
        setOrderDetail(res);
        setAffiliateDetail(null);
      } else {
        const res = await affiliateApi.detail(id);
        setAffiliateDetail(res);
        setOrderDetail(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Không thể nạp chi tiết bản ghi.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Update detail when URL contains ID
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentId) {
        setSelectedItem(null);
        setOrderDetail(null);
        setAffiliateDetail(null);
        return;
      }

      const type = currentSelectedType || (data?.queue.items.find(i => i.id === currentId)?.type ?? "order");
      const found = data?.queue.items.find(i => i.id === currentId);
      if (found) {
        setSelectedItem(found);
      } else {
        setSelectedItem({
          id: currentId,
          type: type as "order" | "affiliate",
          customerName: "Đang nạp...",
          email: "",
          phoneNumber: "",
          companyName: undefined,
          subject: "",
          sourceStatus: "",
          statusGroup: "new",
          createdAt: new Date().toISOString(),
          updatedAt: undefined,
          lastActivityAt: new Date().toISOString()
        });
      }
      void loadDetail(currentId, type);
    }, 0);

    return () => clearTimeout(timer);
  }, [currentId, currentSelectedType, data, loadDetail]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "1") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    updateWorkspaceUrl(params);
  };

  const handleSelectItem = (item: EditorWorkspaceQueueItem) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedType", item.type);
    params.set("id", item.id);
    updateWorkspaceUrl(params);
  };

  const handleCloseDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.delete("selectedType");
    setSelectedItem(null);
    setOrderDetail(null);
    setAffiliateDetail(null);
    updateWorkspaceUrl(params);
  };

  // Open modal for Reject (mandatory note) or Cancel (optional note)
  const triggerStatusChange = (newStatus: number, isReject = false, isCancel = false) => {
    if (isReject || isCancel) {
      setPendingAction({ status: newStatus, isReject, isCancel });
      setActionNote("");
      setActionModalOpen(true);
    } else {
      void executeStatusChange(newStatus, "");
    }
  };

  const executeStatusChange = async (newStatus: number, note: string) => {
    if (!currentId && !selectedItem) return;
    const targetId = currentId || selectedItem?.id;
    const targetType = currentSelectedType || selectedItem?.type || "order";
    if (!targetId) return;

    setActionLoading(true);
    try {
      if (targetType === "order") {
        await orderApi.updateStatus(targetId, newStatus as OrderStatus, note.trim() || undefined);
      } else {
        await affiliateApi.updateStatus(targetId, newStatus as AffiliateStatus, note.trim() || undefined);
      }
      setToast({ type: "success", message: "Cập nhật trạng thái thành công!" });
      setActionModalOpen(false);
      setActionNote("");
      setPendingAction(null);
      await fetchWorkspace();
      if (targetId) {
        await loadDetail(targetId, targetType);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại.";
      setToast({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-medium text-white transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
          role="alert"
        >
          {toast.type === "success" ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white" aria-label="Đóng thông báo">
            <IconX size={16} />
          </button>
        </div>
      )}

      <PageHeader
        title="Công việc hôm nay"
        description="Hàng chờ tổng hợp yêu cầu dịch vụ và hồ sơ Affiliate cần xử lý."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateParam("status", currentStatus === "completed" ? "all" : "completed")}
              className={`admin-button min-h-[44px] text-xs ${
                currentStatus === "completed" ? "admin-button-primary" : "admin-button-secondary"
              }`}
            >
              <IconHistory size={16} /> Xem lịch sử đã hoàn tất
            </button>
          </div>
        }
      />

      {loading && !data ? (
        <SkeletonLoader rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWorkspace} />
      ) : data ? (
        <>
          {/* Flat Metric Strip */}
          <div className="admin-metric-grid">
            <MetricCard
              title="Đơn mới chờ xử lý"
              value={data.summary.newOrders}
              subtitle={`+${data.summary.newOrdersLast24Hours} đơn trong 24h`}
              icon={IconBriefcase}
            />
            <MetricCard
              title="Đơn đang liên hệ"
              value={data.summary.inProgressOrders}
              subtitle={`${data.summary.overdueActiveOrders} đơn cần tương tác (>24h)`}
              icon={IconClock}
            />
            <MetricCard
              title="Hồ sơ Affiliate chờ duyệt"
              value={data.summary.pendingAffiliates}
              subtitle={`+${data.summary.newAffiliatesLast24Hours} hồ sơ trong 24h`}
              icon={IconBriefcase}
            />
            <MetricCard
              title="Bài viết nháp"
              value={data.summary.draftArticles}
              subtitle={`${data.summary.draftsUpdatedLast24Hours} bài cập nhật trong 24h`}
              icon={IconFileText}
            />
          </div>

          <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${selectedItem ? "editor-workspace-with-detail" : ""}`}>
            {/* Queue & List Area */}
            <div className={`${selectedItem ? "xl:col-span-2" : "xl:col-span-3"} min-w-0 space-y-4`}>
              {/* Filter Bar */}
              <div className="admin-card editor-workspace-filter-bar !p-3">
                <div className="editor-workspace-type-group">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <IconFilter size={14} /> Loại:
                  </span>
                  <div className="editor-workspace-type-options">
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "order", label: "Đơn dịch vụ" },
                      { key: "affiliate", label: "Affiliate" }
                    ].map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => updateParam("type", t.key)}
                        className={`editor-workspace-type-button text-xs rounded font-medium transition-colors ${
                          currentType === t.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="editor-workspace-query-group">
                  <div className="editor-workspace-search">
                    <IconSearch
                      size={14}
                      aria-hidden="true"
                      className="editor-workspace-search-icon pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm tên, email, sđt..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      aria-label="Tìm theo tên, email hoặc số điện thoại"
                      className="admin-input pl-8 pr-2.5"
                    />
                  </div>

                  <select
                    value={currentStatus}
                    onChange={e => updateParam("status", e.target.value)}
                    className="admin-select editor-workspace-filter-select !py-1.5 sm:!py-1 text-sm min-h-[44px]"
                    aria-label="Lọc theo trạng thái"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="new">Mới tạo (New)</option>
                    <option value="inProgress">Đang xử lý (In Progress)</option>
                    <option value="completed">Hoàn tất (Completed)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                    <option value="cancelled">Đã hủy (Cancelled)</option>
                  </select>

                  <div className="editor-workspace-sort-control">
                    <button
                      type="button"
                      className="admin-select editor-workspace-sort-trigger !py-1.5 sm:!py-1 text-sm min-h-[44px]"
                      aria-label="Sắp xếp danh sách"
                      aria-haspopup="listbox"
                      aria-expanded={sortMenuOpen}
                      aria-controls="editor-workspace-sort-options"
                      onClick={() => setSortMenuOpen(open => !open)}
                    >
                      <span className="truncate">{currentSort === "oldest" ? "Cũ nhất" : "Mới nhất"}</span>
                      <IconChevronDown size={16} aria-hidden="true" />
                    </button>
                    {sortMenuOpen && (
                      <div
                        id="editor-workspace-sort-options"
                        className="editor-workspace-sort-options"
                        role="listbox"
                        aria-label="Lựa chọn sắp xếp"
                      >
                        {[
                          { value: "newest", label: "Mới nhất" },
                          { value: "oldest", label: "Cũ nhất" }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={currentSort === option.value}
                            className={`editor-workspace-sort-option ${currentSort === option.value ? "is-selected" : ""}`}
                            onClick={() => {
                              setSortMenuOpen(false);
                              updateParam("sort", option.value);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              {data.queue.items.length === 0 ? (
                <EmptyState title="Hàng chờ trống" description="Không tìm thấy yêu cầu nào theo bộ lọc hiện tại." />
              ) : (
                <>
                  <div className="hidden lg:block admin-table-container">
                    <table className="admin-table admin-workspace-table">
                      <thead>
                        <tr>
                          <th>Loại</th>
                          <th>Khách hàng</th>
                          <th>Nội dung yêu cầu</th>
                          <th>Trạng thái</th>
                          <th>Hoạt động cuối</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.queue.items.map(item => {
                          const isSelected = item.id === currentId;
                          const pres = getQueueItemStatusPresentation(item.type, item.sourceStatus);
                          return (
                            <tr
                              key={item.id}
                              onClick={() => handleSelectItem(item)}
                              className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleSelectItem(item);
                                }
                              }}
                            >
                              <td className="admin-workspace-type-cell">
                                <span
                                  className={`admin-workspace-type-badge px-2 py-0.5 text-[11px] font-semibold rounded ${
                                    item.type === "order" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                                  }`}
                                >
                                  {item.type === "order" ? "Đơn dịch vụ" : "Affiliate"}
                                </span>
                              </td>
                              <td className="admin-workspace-cell max-w-xs">
                                <div className="font-semibold text-slate-900 truncate">{item.customerName}</div>
                                <div className="text-[11px] text-slate-500 truncate">{item.email}</div>
                              </td>
                              <td className="admin-workspace-cell max-w-xs">
                                <div className="font-medium text-slate-800 truncate">{item.subject}</div>
                                {item.companyName && <div className="text-[11px] text-slate-500 truncate">{item.companyName}</div>}
                              </td>
                              <td>
                                <StatusDot status={pres.group} label={pres.label} />
                              </td>
                              <td data-metadata className="text-slate-500 text-[11px] whitespace-nowrap">
                                {new Date(item.lastActivityAt).toLocaleString("vi-VN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="block lg:hidden space-y-3">
                    {data.queue.items.map(item => {
                      const isSelected = item.id === currentId;
                      const pres = getQueueItemStatusPresentation(item.type, item.sourceStatus);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`p-4 bg-white rounded-lg border transition-all cursor-pointer space-y-2 ${
                            isSelected ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                item.type === "order" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {item.type === "order" ? "Đơn dịch vụ" : "Affiliate"}
                            </span>
                            <StatusDot status={pres.group} label={pres.label} />
                          </div>

                          <div>
                            <h2 className="font-bold text-slate-900 text-sm truncate">{item.customerName}</h2>
                            <p className="text-xs text-slate-500 truncate">{item.email} · {item.phoneNumber}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span className="font-medium truncate max-w-[200px]">{item.subject}</span>
                            <IconChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <SimplePagination
                page={data.queue.page}
                totalPages={data.queue.totalPages}
                onPageChange={p => updateParam("page", String(p))}
              />
            </div>

            {/* Side Detail Pane / Sheet */}
            {selectedItem && (
              <>
                <button
                  type="button"
                  className="editor-workspace-detail-backdrop"
                  onClick={handleCloseDetail}
                  aria-label="Đóng bảng chi tiết"
                />
                <div
                  role="dialog"
                  aria-label="Chi tiết bản ghi Workspace"
                  className="admin-card admin-detail-panel editor-workspace-detail-sheet space-y-4 self-start xl:sticky xl:top-20"
                >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="admin-detail-header-copy">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chi tiết {selectedItem.type === "order" ? "Yêu cầu dịch vụ" : "Hồ sơ Affiliate"}
                    </span>
                    <h2 className="admin-detail-title text-sm font-bold text-slate-900">{selectedItem.customerName}</h2>
                  </div>
                  <button
                    onClick={handleCloseDetail}
                    className="text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Đóng bảng chi tiết"
                  >
                    <IconX size={20} />
                  </button>
                </div>

                {detailLoading ? (
                  <SkeletonLoader rows={6} />
                ) : detailError ? (
                  <ErrorState message={detailError} onRetry={() => loadDetail(selectedItem.id, selectedItem.type)} />
                ) : orderDetail ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-slate-500">Trạng thái hiện tại:</span>
                      <div className="mt-1">
                        {(() => {
                          const pres = getOrderStatusPresentation(orderDetail.status);
                          return <StatusDot status={pres.group} label={pres.label} />;
                        })()}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Gói dịch vụ chọn:</span>
                      <div className="admin-detail-value font-bold text-slate-900 text-sm mt-0.5">{orderDetail.planName}</div>
                      <div className="text-[11px] text-slate-500">
                        {orderDetail.billingCycle === 1 ? "Thanh toán Theo tháng" : "Thanh toán Theo năm"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">Số điện thoại:</span>
                        <div className="font-semibold text-slate-800">{orderDetail.phoneNumber}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Email:</span>
                        <div className="admin-detail-email admin-detail-value font-semibold text-slate-800" title={orderDetail.email}>
                          {orderDetail.email}
                        </div>
                      </div>
                    </div>

                    {orderDetail.companyName && (
                      <div>
                        <span className="text-slate-500">Doanh nghiệp:</span>
                        <div className="admin-detail-value font-medium text-slate-800">{orderDetail.companyName}</div>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500">Báo giá xác nhận:</span>
                      <div className="font-extrabold text-blue-700 text-base mt-0.5">
                        {orderDetail.quotedAmount.toLocaleString("vi-VN")} {orderDetail.currency}
                      </div>
                    </div>

                    {/* Status Transition Action Matrix */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800">Thao tác xử lý đơn:</div>

                      <div className="flex flex-col gap-2">
                        {/* Pending (1) -> Contacted (2), Rejected (4), Cancelled (5) */}
                        {orderDetail.status === 1 && (
                          <button
                            onClick={() => void triggerStatusChange(2)}
                            disabled={actionLoading}
                            className="admin-button admin-button-primary min-h-[44px] text-xs justify-center"
                          >
                            <IconCheck size={16} /> Đã liên hệ trao đổi
                          </button>
                        )}

                        {/* Contacted (2) -> Approved (3), Rejected (4), Cancelled (5) */}
                        {orderDetail.status === 2 && (
                          <button
                            onClick={() => void triggerStatusChange(3)}
                            disabled={actionLoading}
                            className="admin-button bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-xs justify-center font-bold"
                          >
                            <IconCheck size={16} /> Duyệt hoàn tất đơn
                          </button>
                        )}

                        {/* Reject button for Pending (1) or Contacted (2) */}
                        {(orderDetail.status === 1 || orderDetail.status === 2) && (
                          <button
                            onClick={() => void triggerStatusChange(4, true, false)}
                            disabled={actionLoading}
                            className="admin-button admin-button-danger min-h-[44px] text-xs justify-center"
                          >
                            <IconX size={16} /> Từ chối đơn (Cần lý do)
                          </button>
                        )}

                        {/* Cancel button for Pending (1), Contacted (2), Approved (3) */}
                        {(orderDetail.status === 1 || orderDetail.status === 2 || orderDetail.status === 3) && (
                          <button
                            onClick={() => void triggerStatusChange(5, false, true)}
                            disabled={actionLoading}
                            className="admin-button bg-slate-200 hover:bg-slate-300 text-slate-700 min-h-[44px] text-xs justify-center"
                          >
                            <IconBan size={16} /> Hủy đơn hàng
                          </button>
                        )}

                        {/* Rejected (4) or Cancelled (5) -> Locked */}
                        {(orderDetail.status === 4 || orderDetail.status === 5) && (
                          <div className="p-3 bg-slate-100 rounded text-slate-500 text-center font-medium">
                            Đơn hàng đã ở trạng thái kết thúc ({getOrderStatusPresentation(orderDetail.status).label}).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : affiliateDetail ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-slate-500">Trạng thái hồ sơ:</span>
                      <div className="mt-1">
                        {(() => {
                          const pres = getAffiliateStatusPresentation(affiliateDetail.status);
                          return <StatusDot status={pres.group} label={pres.label} />;
                        })()}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Kênh tiếp cận khách hàng:</span>
                      <div className="admin-detail-value font-semibold text-slate-900 mt-0.5">{affiliateDetail.promotionChannels}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">Số điện thoại:</span>
                        <div className="font-semibold text-slate-800">{affiliateDetail.phoneNumber}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Email:</span>
                        <div className="admin-detail-email admin-detail-value font-semibold text-slate-800" title={affiliateDetail.email}>
                          {affiliateDetail.email}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Mô tả tệp độc giả / khách hàng:</span>
                      <div className="admin-detail-value p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 mt-1 leading-relaxed">
                        {affiliateDetail.audienceDescription}
                      </div>
                    </div>

                    {/* Status Transition Action Matrix */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800">Thao tác duyệt hồ sơ:</div>

                      <div className="flex flex-col gap-2">
                        {/* Pending (1) -> UnderReview (2), Approved (3), Rejected (4) */}
                        {affiliateDetail.status === 1 && (
                          <button
                            onClick={() => void triggerStatusChange(2)}
                            disabled={actionLoading}
                            className="admin-button admin-button-primary min-h-[44px] text-xs justify-center"
                          >
                            Chuyển sang Đang xem xét
                          </button>
                        )}

                        {/* Pending (1) or UnderReview (2) -> Approved (3) */}
                        {(affiliateDetail.status === 1 || affiliateDetail.status === 2) && (
                          <button
                            onClick={() => void triggerStatusChange(3)}
                            disabled={actionLoading}
                            className="admin-button bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-xs justify-center font-bold"
                          >
                            <IconCheck size={16} /> Phê duyệt đối tác Affiliate
                          </button>
                        )}

                        {/* Reject button for Pending (1) or UnderReview (2) */}
                        {(affiliateDetail.status === 1 || affiliateDetail.status === 2) && (
                          <button
                            onClick={() => void triggerStatusChange(4, true, false)}
                            disabled={actionLoading}
                            className="admin-button admin-button-danger min-h-[44px] text-xs justify-center"
                          >
                            <IconX size={16} /> Từ chối hồ sơ (Cần lý do)
                          </button>
                        )}

                        {/* Approved (3) or Rejected (4) -> Locked */}
                        {(affiliateDetail.status === 3 || affiliateDetail.status === 4) && (
                          <div className="p-3 bg-slate-100 rounded text-slate-500 text-center font-medium">
                            Hồ sơ đã ở trạng thái kết thúc ({getAffiliateStatusPresentation(affiliateDetail.status).label}).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
                </div>
              </>
            )}
          </div>

          {/* Recent Draft Articles Strip */}
          {data.recentDrafts.length > 0 && (
            <div className="admin-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <IconFileText size={16} className="text-slate-500" /> Bài nháp gần đây
                </div>
                <button
                  onClick={() => router.push("/admin/news/new")}
                  className="admin-button admin-button-secondary min-h-[44px] text-xs"
                >
                  + Tạo bài viết mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.recentDrafts.map(draft => (
                  <div
                    key={draft.id}
                    onClick={() => router.push(`/admin/news/${draft.id}/edit`)}
                    className="p-3 border border-slate-200 rounded-lg hover:border-slate-400 bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{draft.categoryName}</div>
                    <div className="font-bold text-slate-900 text-xs truncate">{draft.title}</div>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Cập nhật: {new Date(draft.updatedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Mandatory Reject / Cancel Action Dialog Modal */}
      <AdminDialog
        isOpen={actionModalOpen && !!pendingAction}
        onClose={() => {
          setActionModalOpen(false);
          setPendingAction(null);
        }}
        title={pendingAction?.isReject ? "Xác nhận từ chối" : "Xác nhận hủy đơn hàng"}
        description={
          pendingAction?.isReject
            ? "Vui lòng nhập lý do từ chối bản ghi này (bắt buộc)."
            : "Vui lòng nhập ghi chú lý do hủy đơn (tùy chọn)."
        }
        isSubmitting={actionLoading}
      >
        {pendingAction && (
          <div className="space-y-4 text-xs">
            <textarea
              required={pendingAction.isReject}
              rows={3}
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              placeholder={pendingAction.isReject ? "Nhập lý do từ chối (bắt buộc)..." : "Nhập ghi chú lý do hủy..."}
              className="admin-textarea text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModalOpen(false);
                  setPendingAction(null);
                }}
                disabled={actionLoading}
                className="admin-button admin-button-secondary min-h-[44px] text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void executeStatusChange(pendingAction.status, actionNote)}
                disabled={(pendingAction.isReject && !actionNote.trim()) || actionLoading}
                className={`admin-button text-xs min-h-[44px] ${
                  pendingAction.isReject ? "admin-button-danger" : "bg-slate-800 text-white hover:bg-slate-900"
                }`}
              >
                {actionLoading ? "Đang xử lý..." : pendingAction.isReject ? "Xác nhận từ chối" : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
