"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  reportingApi,
  type AuditLogItem,
  type PagedResult,
  ApiError
} from "@/lib/api";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import {
  IconSearch,
  IconX,
  IconCode
} from "@tabler/icons-react";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const defaultFrom = isoDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
const defaultTo = isoDate(new Date());

const formatDateTime = (val: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(val));

const prettyJson = (raw?: string) => {
  if (!raw) return "—";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const auditActionLabels: Record<string, string> = {
  "Auth.Registered": "Đăng ký tài khoản",
  "Auth.LoginFailed": "Đăng nhập thất bại",
  "Auth.LoginSucceeded": "Đăng nhập thành công",
  "Auth.RefreshTokenReuseDetected": "Phát hiện dùng lại phiên đăng nhập",
  "Auth.RefreshTokenRotated": "Tự động gia hạn phiên đăng nhập",
  "Auth.Logout": "Đăng xuất",
  "Auth.PasswordChanged": "Đổi mật khẩu tài khoản",
  "Auth.ProfileUpdated": "Cập nhật hồ sơ tài khoản",
  "Catalog.CategoryCreated": "Tạo danh mục dịch vụ",
  "Catalog.CategoryUpdated": "Cập nhật danh mục dịch vụ",
  "Catalog.CategoryDeleted": "Xóa danh mục dịch vụ",
  "Catalog.PlanCreated": "Tạo gói dịch vụ",
  "Catalog.PlanUpdated": "Cập nhật gói dịch vụ",
  "Catalog.PlanDeleted": "Xóa gói dịch vụ",
  "Catalog.PriceCreated": "Tạo phiên bản giá",
  "Catalog.PriceClosed": "Đóng phiên bản giá",
  "Catalog.QrCodeRegenerated": "Tạo lại mã QR",
  "Promotion.Created": "Tạo chương trình khuyến mãi",
  "Promotion.Updated": "Cập nhật chương trình khuyến mãi",
  "Promotion.Deleted": "Xóa chương trình khuyến mãi",
  "News.CategoryCreated": "Tạo chuyên mục tin tức",
  "News.CategoryUpdated": "Cập nhật chuyên mục tin tức",
  "News.CategoryDeleted": "Xóa chuyên mục tin tức",
  "News.CategoryReactivated": "Kích hoạt lại chuyên mục tin tức",
  "News.ArticleCreated": "Tạo bài viết",
  "News.ArticleUpdated": "Cập nhật bài viết",
  "News.ArticlePublished": "Xuất bản bài viết",
  "News.ArticleUnpublished": "Gỡ xuất bản bài viết",
  "News.ArticleFeatured": "Đặt bài viết nổi bật",
  "News.ArticleUnfeatured": "Bỏ bài viết nổi bật",
  "News.ArticleDeleted": "Xóa bài viết",
  "News.ArticleImported": "Nhập bài viết từ nguồn dữ liệu",
  "Order.Created": "Tạo yêu cầu dịch vụ",
  "Order.StatusChanged": "Cập nhật trạng thái yêu cầu dịch vụ",
  "Orders.Exported": "Xuất danh sách yêu cầu dịch vụ ra Excel",
  "Affiliate.ProgramUpdated": "Cập nhật chương trình đối tác",
  "Affiliate.ApplicationCreated": "Tạo hồ sơ đăng ký đối tác",
  "Affiliate.StatusChanged": "Cập nhật trạng thái hồ sơ đối tác",
  "Landing.ContentUpdated": "Cập nhật nội dung trang chủ",
  "Landing.TestimonialCreated": "Thêm đánh giá khách hàng",
  "Landing.TestimonialUpdated": "Cập nhật đánh giá khách hàng",
  "Landing.TestimonialDeleted": "Xóa đánh giá khách hàng",
  "Landing.CustomerLogoCreated": "Thêm logo khách hàng",
  "Landing.CustomerLogoUpdated": "Cập nhật logo khách hàng",
  "Landing.CustomerLogoDeleted": "Xóa logo khách hàng",
  Created: "Tạo mới",
  Updated: "Cập nhật",
  Reviewed: "Kiểm tra"
};

const auditEntityLabels: Record<string, string> = {
  AppUser: "Tài khoản người dùng",
  RefreshToken: "Phiên đăng nhập",
  ServiceCategory: "Danh mục dịch vụ",
  ServicePlan: "Gói dịch vụ",
  PlanPrice: "Phiên bản giá",
  Promotion: "Chương trình khuyến mãi",
  NewsCategory: "Chuyên mục tin tức",
  NewsArticle: "Bài viết",
  OrderRequest: "Yêu cầu dịch vụ",
  AffiliateProgramContent: "Nội dung chương trình đối tác",
  AffiliateApplication: "Hồ sơ đăng ký đối tác",
  LandingPageContent: "Nội dung trang chủ",
  Testimonial: "Đánh giá khách hàng",
  CustomerLogo: "Logo khách hàng"
};

const auditEntityOptions = [
  { value: "", label: "Tất cả đối tượng dữ liệu" },
  ...Object.entries(auditEntityLabels)
    .sort(([, first], [, second]) => first.localeCompare(second, "vi"))
    .map(([value, label]) => ({ value, label }))
];

const auditSearchAliases = Object.entries({ ...auditActionLabels, ...auditEntityLabels });
const formatAuditAction = (action: string) => auditActionLabels[action] ?? action;
const formatAuditEntity = (entityName: string) => auditEntityLabels[entityName] ?? entityName;
const resolveAuditSearch = (value: string) => {
  const normalized = value.trim().toLocaleLowerCase();
  const alias = auditSearchAliases.find(([, label]) => label.toLocaleLowerCase() === normalized);
  return alias?.[0] ?? value;
};

export function AdminAuditLogsClient() {
  const [result, setResult] = useState<PagedResult<AuditLogItem> | null>(null);
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  const [search, setSearch] = useState("");
  const [entityName, setEntityName] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportingApi.audits({
        page: requestedPage,
        pageSize: 15,
        search: resolveAuditSearch(search) || undefined,
        entityName: entityName || undefined,
        from: from || undefined,
        to: to || undefined
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải nhật ký hoạt động.");
    } finally {
      setLoading(false);
    }
  }, [page, search, entityName, from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLogs(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hoạt động hệ thống"
        description="Theo dõi các thay đổi dữ liệu, lần xuất Excel và thao tác quản trị viên."
      />

      {error && <ErrorState message={error} onRetry={() => loadLogs(page)} />}

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="admin-card !p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[180px]">
            <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Tìm theo hành động, đối tượng hoặc email"
              placeholder="Tìm hành động, đối tượng hoặc email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input !pl-8"
            />
          </div>

        <select
          aria-label="Lọc theo đối tượng dữ liệu"
          value={entityName}
          onChange={e => setEntityName(e.target.value)}
          className="admin-select !w-56"
        >
          {auditEntityOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Từ:</span>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="admin-input !py-1"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Đến:</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="admin-input !py-1"
          />
        </div>

        <button type="submit" className="admin-button admin-button-primary admin-button-sm">
          Lọc hoạt động
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Table Area */}
        <div className={`${selected ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
          {loading && !result ? (
            <SkeletonLoader rows={6} />
          ) : !result?.items.length ? (
            <EmptyState title="Không có hoạt động" description="Không tìm thấy nhật ký hoạt động phù hợp." />
          ) : (
            <>
              <div className="hidden md:block admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hành động</th>
                      <th>Đối tượng dữ liệu</th>
                      <th>Người thực hiện</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map(item => {
                      const isSelected = item.id === selected?.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelected(item)}
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(item);
                            }
                          }}
                          className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                          aria-label={`Xem chi tiết hoạt động ${formatAuditAction(item.action)}`}
                        >
                          <td>
                            <div className="font-semibold text-slate-900">{formatAuditAction(item.action)}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]" title={item.action}>
                              {item.action}
                            </div>
                            {item.ipAddress && <div className="text-[10px] text-slate-400">IP: {item.ipAddress}</div>}
                          </td>
                          <td>
                            <div className="font-medium text-slate-800">{formatAuditEntity(item.entityName)}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.entityName}</div>
                            {item.entityId && <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{item.entityId}</div>}
                          </td>
                          <td>
                            <span className="font-medium text-slate-700">{item.actorEmail || "Hệ thống"}</span>
                          </td>
                          <td data-metadata className="text-slate-500 text-[11px] whitespace-nowrap">
                            {formatDateTime(item.occurredAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {result.items.map(item => {
                  const isSelected = item.id === selected?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full text-left admin-card space-y-2 cursor-pointer transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 text-xs">{formatAuditAction(item.action)}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(item.occurredAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Đối tượng: <strong>{formatAuditEntity(item.entityName)}</strong></span>
                        <span>{item.actorEmail || "Hệ thống"}</span>
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
                loadLogs(p);
              }}
            />
          )}
        </div>

        {/* Selected Event Details (Before / After Diff) */}
        {selected && (
          <div className="admin-card space-y-4 self-start sticky top-20 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Chi tiết hoạt động
                </span>
                <h2 className="text-sm font-bold text-slate-900">{formatAuditAction(selected.action)}</h2>
                <span className="text-[10px] text-slate-400 font-mono">{selected.action}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Đóng chi tiết hoạt động"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-100 rounded">
              <div>
                <span className="text-slate-400 text-[10px] block">Người thực hiện:</span>
                <span className="font-semibold text-slate-800">{selected.actorEmail || "Hệ thống"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Địa chỉ IP:</span>
                <span className="font-semibold text-slate-800">{selected.ipAddress || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Đối tượng dữ liệu:</span>
                <span className="font-semibold text-slate-800">{formatAuditEntity(selected.entityName)}</span>
                <span className="block text-[10px] text-slate-400 font-mono">{selected.entityName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Thời gian:</span>
                <span className="font-semibold text-slate-800">{formatDateTime(selected.occurredAt)}</span>
              </div>
            </div>

            {/* Before / After JSON Diff */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <IconCode size={14} /> Dữ liệu trước thao tác:
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {prettyJson(selected.oldValuesJson)}
                </pre>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <IconCode size={14} /> Dữ liệu sau thao tác:
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {prettyJson(selected.newValuesJson)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
