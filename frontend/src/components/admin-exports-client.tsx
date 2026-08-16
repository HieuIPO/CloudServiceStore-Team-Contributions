"use client";

import React, { useEffect, useState } from "react";
import { reportingApi, type OrderStatus, ApiError } from "@/lib/api";
import { PageHeader, ErrorState } from "./admin/admin-primitives";
import { IconFileSpreadsheet, IconDownload, IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const defaultFrom = isoDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
const defaultTo = isoDate(new Date());

const statusLabels: Record<OrderStatus, string> = {
  1: "Chờ xử lý",
  2: "Đã liên hệ",
  3: "Đã duyệt",
  4: "Từ chối",
  5: "Đã hủy",
};

export function AdminExportsClient() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [status, setStatus] = useState<OrderStatus | "">("");

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const file = await reportingApi.exportOrders(from, to, status);
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Đã tải xuống file "${file.fileName}" thành công! Thao tác này đã được ghi lại vào Audit Log.`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Xuất file Excel không thành công.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo & Xuất dữ liệu Excel"
        description="Xuất danh sách yêu cầu dịch vụ ra định dạng .xlsx để theo dõi và đối soát."
      />

      {error && <ErrorState message={error} />}
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
            <strong className="admin-toast-title">Xuất file thành công</strong>
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

      <div className="max-w-xl admin-card space-y-4 text-xs">
        <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center gap-1.5">
          <IconFileSpreadsheet size={18} className="text-emerald-600" /> Xuất file danh sách Yêu cầu dịch vụ
        </h2>

        <form onSubmit={handleExport} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Từ ngày *</label>
              <input
                type="date"
                required
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Đến ngày *</label>
              <input
                type="date"
                required
                value={to}
                onChange={e => setTo(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Lọc theo trạng thái yêu cầu</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value ? (Number(e.target.value) as OrderStatus) : "")}
              className="admin-select"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start gap-2">
            <IconAlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý:</strong> Mỗi lần xuất file Excel sẽ được ghi nhận trong <strong>Audit Log</strong> để theo dõi lịch sử truy xuất dữ liệu, gồm người thực hiện, thời gian và số lượng bản ghi.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={exporting}
              className="admin-button bg-emerald-600 hover:bg-emerald-700 text-white admin-button-sm w-full"
            >
              <IconDownload size={16} /> {exporting ? "Đang kết xuất dữ liệu..." : "Tải xuống file Excel (.xlsx)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
