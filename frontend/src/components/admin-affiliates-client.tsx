"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  affiliateApi,
  ApiError,
  type AffiliateDetail,
  type AffiliateListItem,
  type AffiliateProgramContent,
  type AffiliateStatus,
  type PagedResult
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-store";
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
  IconUsers,
  IconFileText,
  IconCheck
} from "@tabler/icons-react";
import {
  getAffiliateStatusPresentation,
  getAffiliateStatusLabel
} from "@/lib/status-formatters";

const nextStatuses: Record<AffiliateStatus, AffiliateStatus[]> = {
  1: [2, 3, 4],
  2: [3, 4],
  3: [],
  4: [],
};

type ProgramForm = Omit<AffiliateProgramContent, "id" | "updatedAt">;

export function AdminAffiliatesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTab = searchParams.get("tab") || "applications";
  const queryId = searchParams.get("id") || "";

  const [result, setResult] = useState<PagedResult<AffiliateListItem> | null>(null);
  const [selected, setSelected] = useState<AffiliateDetail | null>(null);
  const [program, setProgram] = useState<ProgramForm | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AffiliateStatus | "">("");
  const [page, setPage] = useState(1);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadApplications = async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const applications = await affiliateApi.all({
        page: requestedPage,
        pageSize: 15,
        search: search || undefined,
        status: status || undefined,
      });
      setResult(applications);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể nạp danh sách hồ sơ Affiliate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const user = getCurrentUser();
      const admin = user?.roles.includes("Admin") || false;
      setIsAdmin(admin);

      if (!admin && queryTab === "program") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "applications");
        router.replace(`/admin/affiliates?${params.toString()}`);
        return;
      }

      try {
        const [applications, content] = await Promise.all([
          affiliateApi.all({ page: 1, pageSize: 15 }),
          admin ? affiliateApi.adminProgram() : Promise.resolve(null),
        ]);
        setResult(applications);
        if (content) {
          setProgram({
            title: content.title,
            summary: content.summary,
            commissionSummary: content.commissionSummary,
            policyMarkdown: content.policyMarkdown,
            isPublished: content.isPublished,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : "Khởi tạo dữ liệu thất bại.");
      } finally {
        setLoading(false);
      }
    })();
  }, [queryTab, router, searchParams]);

  const openDetail = useCallback(async (id: string) => {
    setError(null);
    try {
      setSelected(await affiliateApi.detail(id));
      setReviewNote("");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể nạp chi tiết hồ sơ.");
    }
  }, []);

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

  const handleSelectAffiliate = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/admin/affiliates?${params.toString()}`);
  };

  const handleCloseDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/admin/affiliates?${params.toString()}`);
  };

  const setTab = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.push(`/admin/affiliates?${params.toString()}`);
  };

  const changeStatus = async (next: AffiliateStatus, forceNoteCheck = true) => {
    if (!selected) return;

    if (forceNoteCheck && next === 4 && !reviewNote.trim()) {
      setRejectModalOpen(true);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await affiliateApi.updateStatus(selected.id, next, reviewNote.trim() || undefined);
      setSelected(updated);
      setReviewNote("");
      setRejectModalOpen(false);
      setNotice(`Đã chuyển hồ sơ sang “${getAffiliateStatusLabel(next)}”.`);
      await loadApplications(page);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const saveProgram = async () => {
    if (!program) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await affiliateApi.updateProgram(program);
      setProgram({
        title: updated.title,
        summary: updated.summary,
        commissionSummary: updated.commissionSummary,
        policyMarkdown: updated.policyMarkdown,
        isPublished: updated.isPublished,
      });
      setNotice("Đã cập nhật nội dung chương trình Affiliate thành công.");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Lưu nội dung chương trình thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Hồ sơ Affiliate"
        description="Duyệt hồ sơ đối tác tiếp thị liên kết và quản lý nội dung chính sách chương trình."
      />

      {error && <ErrorState message={error} onRetry={() => loadApplications(page)} />}
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setTab("applications")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 ${
            queryTab !== "program"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconUsers size={16} /> Hồ sơ đăng ký
        </button>

        {isAdmin && (
          <button
            onClick={() => setTab("program")}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 ${
              queryTab === "program"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <IconFileText size={16} /> Nội dung chương trình (Admin)
          </button>
        )}
      </div>

      {/* Applications Tab */}
      {queryTab !== "program" && (
        <>
          {/* Filter Bar */}
          <div className="admin-card !p-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên đối tác, email, sđt, công ty, kênh..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-input !pl-8"
              />
            </div>

            <select
              value={status}
              onChange={e => setStatus(e.target.value ? (Number(e.target.value) as AffiliateStatus) : "")}
              className="admin-select !w-48"
            >
              <option value="">Tất cả trạng thái</option>
              {([1, 2, 3, 4] as const).map(v => (
                <option key={v} value={v}>
                  {getAffiliateStatusLabel(v)}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setPage(1);
                loadApplications(1);
              }}
              className="admin-button admin-button-primary admin-button-sm"
            >
              Lọc kết quả
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Table Area */}
            <div className={`${selected ? "xl:col-span-2" : "xl:col-span-3"} min-w-0 space-y-4`}>
              {loading && !result ? (
                <SkeletonLoader rows={6} />
              ) : !result?.items.length ? (
                <EmptyState title="Không có hồ sơ" description="Không tìm thấy hồ sơ đăng ký đối tác nào." />
              ) : (
                <>
                  <div className="hidden md:block admin-table-container">
                    <table className="admin-table admin-affiliate-table">
                      <thead>
                        <tr>
                          <th>Họ tên / Đơn vị</th>
                          <th>Liên hệ</th>
                          <th>Kênh quảng bá</th>
                          <th>Trạng thái</th>
                          <th>Ngày gửi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map(item => {
                          const isSelected = item.id === queryId;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => handleSelectAffiliate(item.id)}
                              className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                            >
                              <td className="admin-affiliate-name-cell">
                                <div className="admin-affiliate-name font-semibold text-slate-900" title={item.fullName}>
                                  {item.fullName}
                                </div>
                                <div className="admin-affiliate-subline text-[11px] text-slate-500">
                                  {item.companyName || "Cá nhân"}
                                </div>
                              </td>
                              <td className="admin-affiliate-contact-cell">
                                <div className="admin-affiliate-email font-medium text-slate-800" title={item.email}>{item.email}</div>
                                <div className="admin-affiliate-subline text-[11px] text-slate-500">{item.phoneNumber}</div>
                              </td>
                              <td className="admin-affiliate-channel-cell">
                                <div className="admin-affiliate-copy font-medium text-slate-800" title={item.promotionChannels}>
                                  {item.promotionChannels}
                                </div>
                              </td>
                              <td className="admin-affiliate-status-cell">
                                {(() => {
                                  const pres = getAffiliateStatusPresentation(item.status);
                                  return <StatusDot status={pres.group} label={pres.label} />;
                                })()}
                              </td>
                              <td data-metadata className="text-slate-500 text-[11px] whitespace-nowrap">
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
                      const pres = getAffiliateStatusPresentation(item.status);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectAffiliate(item.id)}
                          aria-label={`Xem chi tiết hồ sơ Affiliate của ${item.fullName}`}
                          className={`w-full text-left p-4 bg-white rounded-lg border transition-all space-y-2 ${
                            isSelected ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm truncate">{item.fullName}</span>
                            <StatusDot status={pres.group} label={pres.label} />
                          </div>
                          <div className="text-xs text-slate-600 truncate">
                            {item.email} · {item.phoneNumber}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            Kênh: <span className="font-medium text-slate-700">{item.promotionChannels}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>{item.companyName || "Cá nhân"}</span>
                            <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
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
                    loadApplications(p);
                  }}
                />
              )}
            </div>

            {/* Selected Affiliate Detail Pane */}
            {selected && (
              <div className="admin-card admin-detail-panel space-y-4 self-start xl:sticky xl:top-20 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="admin-detail-header-copy">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Chi tiết hồ sơ Affiliate
                    </span>
                    <h2 className="admin-detail-title text-sm font-bold text-slate-900">{selected.fullName}</h2>
                  </div>
                  <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600 p-1">
                    <IconX size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Công ty:</span>
                      <div className="admin-detail-value font-medium text-slate-800">{selected.companyName || "—"}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Số điện thoại:</span>
                      <div className="admin-detail-value font-medium text-slate-800">{selected.phoneNumber}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Email:</span>
                    <div className="admin-detail-email admin-detail-value font-medium text-slate-800" title={selected.email}>
                      {selected.email}
                    </div>
                  </div>

                  {selected.websiteUrl && (
                    <div>
                      <span className="text-slate-500">Website / Kênh chính:</span>
                      <div className="font-medium text-blue-600 break-all">{selected.websiteUrl}</div>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Kênh quảng bá:</span>
                    <p className="admin-detail-value p-2 bg-slate-50 border border-slate-100 rounded text-slate-700 whitespace-pre-wrap">
                      {selected.promotionChannels}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Mô tả tệp khách hàng:</span>
                    <p className="admin-detail-value p-2 bg-slate-50 border border-slate-100 rounded text-slate-700 whitespace-pre-wrap">
                      {selected.audienceDescription}
                    </p>
                  </div>

                  {selected.experienceDescription && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Kinh nghiệm tiếp thị:</span>
                      <p className="admin-detail-value p-2 bg-slate-50 border border-slate-100 rounded text-slate-700 whitespace-pre-wrap">
                        {selected.experienceDescription}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {nextStatuses[selected.status].length > 0 && (
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <label className="block font-semibold text-slate-700">Ghi chú đánh giá nội bộ:</label>
                      <textarea
                        rows={2}
                        value={reviewNote}
                        onChange={e => setReviewNote(e.target.value)}
                        placeholder="Nhập nhận xét (bắt buộc nếu từ chối)..."
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
                                : next === 4
                                ? "admin-button-danger"
                                : "admin-button-primary"
                            }`}
                          >
                            {getAffiliateStatusLabel(next)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  {selected.statusHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 mb-2">
                        <IconHistory size={14} /> Lịch sử thẩm định
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selected.statusHistory.map(h => (
                          <div key={h.id} className="p-2 border-l-2 border-slate-300 bg-slate-50 rounded-r text-[11px]">
                            <div className="font-semibold text-slate-800">{getAffiliateStatusLabel(h.toStatus)}</div>
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
        </>
      )}

      {/* Program Management Tab (Admin Only) */}
      {queryTab === "program" && isAdmin && program && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xs">
          <div className="admin-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Nội dung và chính sách chương trình</h2>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tiêu đề chương trình</label>
              <input
                type="text"
                value={program.title}
                onChange={e => setProgram({ ...program, title: e.target.value })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tóm tắt tổng quan</label>
              <textarea
                rows={3}
                value={program.summary}
                onChange={e => setProgram({ ...program, summary: e.target.value })}
                className="admin-textarea"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tóm tắt chính sách hoa hồng</label>
              <textarea
                rows={2}
                value={program.commissionSummary}
                onChange={e => setProgram({ ...program, commissionSummary: e.target.value })}
                className="admin-textarea"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nội dung chi tiết (Markdown)</label>
              <textarea
                rows={12}
                value={program.policyMarkdown}
                onChange={e => setProgram({ ...program, policyMarkdown: e.target.value })}
                className="admin-textarea font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={program.isPublished}
                onChange={e => setProgram({ ...program, isPublished: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isPublished" className="font-semibold text-slate-700 cursor-pointer">
                Công khai nội dung chương trình này trên website
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={saveProgram}
                disabled={saving}
                className="admin-button admin-button-primary admin-button-sm"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi chính sách"}
              </button>
            </div>
          </div>

          {/* Markdown Preview */}
          <div className="admin-card space-y-3 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Xem trước Markdown</span>
            <h2 className="text-xl font-bold text-slate-900">{program.title}</h2>
            <p className="text-slate-600">{program.summary}</p>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-900 font-semibold">
              {program.commissionSummary}
            </div>
            <div className="prose prose-slate max-w-none text-xs border-t border-slate-200 pt-4">
              <ReactMarkdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{program.policyMarkdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <AdminDialog
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Xác nhận từ chối hồ sơ đối tác"
        description="Vui lòng nhập lý do từ chối hồ sơ đối tác này (bắt buộc)."
      >
        <div className="space-y-4">
          <textarea
            required
            rows={3}
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
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
              onClick={() => changeStatus(4, false)}
              disabled={!reviewNote.trim() || saving}
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
