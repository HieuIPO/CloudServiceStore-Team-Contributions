"use client";

import React, { ReactNode } from "react";
import { IconAlertCircle, IconInbox, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="admin-metric-card">
      <div className="admin-metric-header">
        {Icon && <Icon size={16} stroke={1.5} />}
        <span>{title}</span>
      </div>
      <div className="admin-metric-value">{value}</div>
      {subtitle && <div className="admin-metric-sub">{subtitle}</div>}
    </div>
  );
}

export function StatusDot({
  status,
  label
}: {
  status: "new" | "inProgress" | "completed" | "rejected" | "cancelled" | string;
  label: string;
}) {
  const mappedStatus =
    status === "Pending" ? "new" :
    status === "Contacted" || status === "UnderReview" ? "inProgress" :
    status === "Approved" ? "completed" :
    status === "Rejected" ? "rejected" :
    status === "Cancelled" ? "cancelled" : status;

  return (
    <span className="admin-status-dot" data-status={mappedStatus}>
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào phù hợp."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 rounded-md bg-white">
      <IconInbox size={36} className="text-slate-300 mb-3" stroke={1.2} />
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = "Tải dữ liệu thất bại",
  message = "Có lỗi xảy ra trong quá trình tải dữ liệu. Vui lòng thử lại sau.",
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-red-200 bg-red-50/50 rounded-md">
      <IconAlertCircle size={36} className="text-red-500 mb-2" stroke={1.5} />
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="text-xs text-red-600 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="admin-button admin-button-secondary admin-button-sm mt-4"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export function SkeletonLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded w-full" />
      ))}
    </div>
  );
}

export function SimplePagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
      <div>
        Trang <span className="font-semibold text-slate-900">{page}</span> / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Trang trước"
          title="Trang trước"
        >
          <IconChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Trang sau"
          title="Trang sau"
        >
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
