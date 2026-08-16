"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  orderApi,
  reportingApi,
  type AuditLogItem,
  type MonthlyOrder,
  type OrderListItem,
  type OrderSummary,
  type PopularPlan,
  type ServiceInterest
} from "@/lib/api";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonLoader
} from "./admin/admin-primitives";
import {
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconClock,
  IconFileText,
  IconHistory,
  IconNews,
  IconShoppingCart,
  IconUsers
} from "@tabler/icons-react";
import { getOrderStatusPresentation } from "@/lib/status-formatters";

const money = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const defaultFrom = isoDate(new Date(new Date().setMonth(new Date().getMonth() - 12)));
const defaultTo = isoDate(new Date());

const formatCycle = (billingCycle: OrderListItem["billingCycle"]) =>
  billingCycle === 1 ? "1 tháng" : "12 tháng";

const timeAgo = (value: string) => {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

const auditLabels: Record<string, string> = {
  "Auth.LoginSucceeded": "Đăng nhập quản trị thành công",
  "Auth.PasswordChanged": "Đã đổi mật khẩu tài khoản",
  "Catalog.CategoryCreated": "Đã tạo danh mục dịch vụ",
  "Catalog.PlanCreated": "Đã tạo gói dịch vụ mới",
  "Catalog.PlanUpdated": "Đã cập nhật gói dịch vụ",
  "Catalog.PriceCreated": "Đã thêm phiên bản giá",
  "Catalog.QrCodeRegenerated": "Đã sinh lại QR của gói dịch vụ",
  "News.ArticleCreated": "Đã soạn bài viết mới",
  "News.ArticlePublished": "Đã xuất bản bài viết",
  "News.ArticleUpdated": "Đã cập nhật bài viết",
  "Order.Created": "Có yêu cầu dịch vụ mới",
  "Order.StatusChanged": "Đã cập nhật trạng thái yêu cầu",
  "Orders.Exported": "Đã xuất danh sách yêu cầu ra Excel",
  "Affiliate.ApplicationCreated": "Đã nhận hồ sơ Affiliate mới",
  "Affiliate.StatusChanged": "Đã cập nhật hồ sơ Affiliate"
};

const auditLabel = (item: AuditLogItem) =>
  auditLabels[item.action] ?? `${item.action} · ${item.entityName}`;

const auditTone = (action: string) => {
  if (action.startsWith("Order") || action.startsWith("Orders")) return "blue";
  if (action.startsWith("News")) return "violet";
  if (action.startsWith("Affiliate")) return "green";
  if (action.startsWith("Auth")) return "amber";
  return "slate";
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  aside
}: {
  icon?: ElementType;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="dashboard-section-header">
      <div className="dashboard-section-heading">
        {Icon && <Icon size={17} stroke={1.8} />}
        <div>
          <h2 className="dashboard-section-title">{title}</h2>
          {subtitle && <p className="dashboard-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {aside}
    </div>
  );
}

function MonthlyDemandChart({
  monthlyOrders,
  maxMonthCount
}: {
  monthlyOrders: MonthlyOrder[];
  maxMonthCount: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 1000;
  const height = 248;
  const left = 42;
  const right = 16;
  const top = 16;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const hitAreaWidth = 88;
  const xFor = (index: number) =>
    monthlyOrders.length === 1
      ? left + plotWidth / 2
      : left + (index / (monthlyOrders.length - 1)) * plotWidth;
  const yFor = (value: number) => top + plotHeight - (value / maxMonthCount) * plotHeight;
  const totalPoints = monthlyOrders.map((item, index) => `${xFor(index)},${yFor(item.count)}`).join(" ");
  const approvedPoints = monthlyOrders
    .map((item, index) => `${xFor(index)},${yFor(item.approvedCount || 0)}`)
    .join(" ");
  const tickRatios = [1, 0.75, 0.5, 0.25, 0];
  const hoveredItem = hoveredIndex === null ? null : monthlyOrders[hoveredIndex];
  const hoveredX = hoveredIndex === null ? 0 : xFor(hoveredIndex);
  const hoveredY = hoveredItem
    ? Math.min(yFor(hoveredItem.count), yFor(hoveredItem.approvedCount || 0))
    : 0;
  const completionRate = hoveredItem && hoveredItem.count > 0
    ? Math.round(((hoveredItem.approvedCount || 0) / hoveredItem.count) * 100)
    : 0;
  const tooltipLeft = Math.min(88, Math.max(12, (hoveredX / width) * 100));
  const tooltipAbove = hoveredY > 78;
  const tooltipTop = (hoveredY / height) * 100 + (tooltipAbove ? -3 : 4);

  return (
    <div className="dashboard-chart-scroll">
      <div className="dashboard-chart-canvas">
        <div className="dashboard-chart-plot">
          <svg
            className="dashboard-line-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label="Biểu đồ yêu cầu dịch vụ và đơn đã duyệt theo tháng"
          >
            {tickRatios.map(ratio => {
              const y = yFor(maxMonthCount * ratio);
              return (
                <g key={ratio}>
                  <line x1={left} x2={width - right} y1={y} y2={y} className="dashboard-chart-grid-line" />
                  <text x={2} y={y + 4} className="dashboard-chart-axis-label">
                    {Math.round(maxMonthCount * ratio)}
                  </text>
                </g>
              );
            })}

            <polyline points={totalPoints} className="dashboard-chart-line dashboard-chart-line-total" />
            <polyline points={approvedPoints} className="dashboard-chart-line dashboard-chart-line-approved" />

            {monthlyOrders.map((item, index) => {
              const x = xFor(index);
              const approvedCount = item.approvedCount || 0;
              return (
                <g key={`${item.year}-${item.month}`}>
                  <circle cx={x} cy={yFor(item.count)} r="4.5" className="dashboard-chart-point dashboard-chart-point-total" />
                  <circle cx={x} cy={yFor(approvedCount)} r="4" className="dashboard-chart-point dashboard-chart-point-approved" />
                  <rect
                    x={x - hitAreaWidth / 2}
                    y={top}
                    width={hitAreaWidth}
                    height={plotHeight}
                    className="dashboard-chart-hit-area"
                    tabIndex={0}
                    role="button"
                    aria-label={`Tháng ${item.month}/${item.year}: ${item.count} yêu cầu, ${approvedCount} đơn hoàn tất, doanh thu dự kiến ${money(item.quotedAmount)}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  >
                    <title>{`Xem số liệu tháng ${item.month}/${item.year}`}</title>
                  </rect>
                </g>
              );
            })}
          </svg>

          {hoveredItem && hoveredIndex !== null && (
            <div
              className={`dashboard-chart-tooltip ${tooltipAbove ? "is-above" : "is-below"}`}
              style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}
              role="status"
            >
              <strong>Tháng {hoveredItem.month}/{hoveredItem.year}</strong>
              <span><i className="dashboard-tooltip-dot dashboard-tooltip-dot-total" />Yêu cầu: <b>{hoveredItem.count}</b></span>
              <span><i className="dashboard-tooltip-dot dashboard-tooltip-dot-approved" />Hoàn tất: <b>{hoveredItem.approvedCount || 0}</b> ({completionRate}%)</span>
              <span>Doanh thu dự kiến: <b>{money(hoveredItem.quotedAmount)}</b></span>
            </div>
          )}
        </div>

        <div
          className="dashboard-chart-labels"
          style={{ gridTemplateColumns: `repeat(${monthlyOrders.length}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {monthlyOrders.map(item => (
            <span key={`${item.year}-${item.month}`}>
              Tháng {item.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentOrders({ orders }: { orders: OrderListItem[] }) {
  return (
    <section className="admin-card dashboard-panel">
      <SectionHeader
        icon={IconShoppingCart}
        title="Yêu cầu dịch vụ gần đây"
        aside={
          <Link className="dashboard-section-link" href="/admin/orders">
            Xem tất cả
          </Link>
        }
      />

      {!orders.length ? (
        <EmptyState title="Chưa có yêu cầu" description="Chưa có yêu cầu dịch vụ nào để hiển thị." />
      ) : (
        <>
          <div className="dashboard-table-scroll">
            <table className="dashboard-data-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Gói dịch vụ</th>
                  <th>Chu kỳ</th>
                  <th>Giá dự kiến</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const status = getOrderStatusPresentation(order.status);
                  return (
                    <tr key={order.id}>
                      <td>
                        <Link className="dashboard-table-primary" href={`/admin/orders?id=${order.id}`}>
                          {order.customerName}
                        </Link>
                        <span className="dashboard-table-secondary">{order.companyName || order.email}</span>
                      </td>
                      <td className="dashboard-table-plan">{order.planName}</td>
                      <td>{formatCycle(order.billingCycle)}</td>
                      <td className="dashboard-table-amount">{money(order.quotedAmount, order.currency)}</td>
                      <td>
                        <span className={`dashboard-status dashboard-status-${status.group}`}>{status.label}</span>
                      </td>
                      <td className="dashboard-table-time" data-metadata>
                        {timeAgo(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dashboard-mobile-list">
            {orders.map(order => {
              const status = getOrderStatusPresentation(order.status);
              return (
                <Link className="dashboard-mobile-order" href={`/admin/orders?id=${order.id}`} key={order.id}>
                  <div className="dashboard-mobile-order-topline">
                    <span className="dashboard-table-primary">{order.customerName}</span>
                    <span className={`dashboard-status dashboard-status-${status.group}`}>{status.label}</span>
                  </div>
                  <span className="dashboard-mobile-order-plan">{order.planName}</span>
                  <div className="dashboard-mobile-order-meta">
                    <span>{formatCycle(order.billingCycle)}</span>
                    <strong>{money(order.quotedAmount, order.currency)}</strong>
                    <span>{timeAgo(order.createdAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function RecentActivity({ activity }: { activity: AuditLogItem[] }) {
  return (
    <section className="admin-card dashboard-panel">
      <SectionHeader
        icon={IconHistory}
        title="Hoạt động gần đây"
        aside={
          <Link className="dashboard-section-link" href="/admin/audit-logs">
            Xem tất cả
          </Link>
        }
      />

      {!activity.length ? (
        <EmptyState title="Chưa có hoạt động" description="Audit Log hiện chưa có thao tác gần đây." />
      ) : (
        <div className="dashboard-activity-list">
          {activity.map(item => (
            <div className="dashboard-activity-item" key={item.id}>
              <span className={`dashboard-activity-icon dashboard-activity-icon-${auditTone(item.action)}`} aria-hidden="true">
                {item.action.startsWith("News") ? <IconFileText size={16} /> : item.action.startsWith("Auth") ? <IconUsers size={16} /> : <IconHistory size={16} />}
              </span>
              <div className="dashboard-activity-copy">
                <p className="dashboard-activity-title">{auditLabel(item)}</p>
                <p className="dashboard-activity-meta">
                  {item.actorEmail || "Hệ thống"} · {timeAgo(item.occurredAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminDashboardClient() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [plans, setPlans] = useState<PopularPlan[]>([]);
  const [services, setServices] = useState<ServiceInterest[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderListItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, planResult, serviceResult, ordersResult, auditResult] = await Promise.all([
        reportingApi.summary(from, to),
        reportingApi.popularPlans(from, to),
        reportingApi.serviceInterest(from, to),
        orderApi.all({ page: 1, pageSize: 5 }),
        reportingApi.audits({ page: 1, pageSize: 5 })
      ]);
      setSummary(summaryResult);
      setPlans(planResult);
      setServices(serviceResult);
      setRecentOrders(ordersResult.items);
      setRecentActivity(auditResult.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể nạp dữ liệu Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const maxMonthCount = useMemo(() => {
    if (!summary?.monthlyOrders?.length) return 10;
    const maxValue = Math.max(...summary.monthlyOrders.map(month => Math.max(month.count, month.approvedCount || 0)));
    return maxValue > 0 ? maxValue : 10;
  }, [summary]);

  const maxPlanCount = useMemo(() => Math.max(1, ...plans.map(plan => plan.orderCount)), [plans]);

  return (
    <div className="dashboard-page space-y-5">
      <PageHeader
        title="Dashboard vận hành"
        description="Theo dõi biến động yêu cầu dịch vụ, tỷ lệ duyệt đơn và xu hướng quan tâm của khách hàng."
      />

      {error && <ErrorState message={error} onRetry={loadData} />}

      <div className="admin-card dashboard-date-filter">
        <div className="dashboard-date-heading">
          <IconCalendar size={17} />
          <span>Kỳ báo cáo</span>
        </div>
        <div className="dashboard-date-fields">
          <label className="dashboard-date-field">
            <span>Từ ngày</span>
            <input type="date" value={from} onChange={event => setFrom(event.target.value)} className="admin-input" />
          </label>
          <label className="dashboard-date-field">
            <span>Đến ngày</span>
            <input type="date" value={to} onChange={event => setTo(event.target.value)} className="admin-input" />
          </label>
        </div>
        <button className="admin-button admin-button-primary dashboard-date-submit" onClick={loadData} disabled={loading}>
          {loading ? "Đang nạp..." : "Cập nhật dữ liệu"}
        </button>
      </div>

      {loading && !summary ? (
        <SkeletonLoader rows={8} />
      ) : summary ? (
        <>
          <div className="dashboard-primary-grid">
            <section className="admin-card dashboard-panel">
              <SectionHeader
                icon={IconChartBar}
                title="Yêu cầu theo tháng"
                subtitle="So sánh số lượng yêu cầu gửi về và đơn đã hoàn tất."
                aside={
                  <div className="dashboard-chart-legend" aria-label="Chú giải biểu đồ">
                    <span><i className="dashboard-legend-dot dashboard-legend-dot-total" />Yêu cầu dịch vụ</span>
                    <span><i className="dashboard-legend-dot dashboard-legend-dot-approved" />Hoàn tất</span>
                  </div>
                }
              />
              {summary.monthlyOrders.length === 0 ? (
                <EmptyState title="Chưa có dữ liệu" description="Không có phát sinh đơn nào trong khoảng thời gian chọn." />
              ) : (
                <MonthlyDemandChart monthlyOrders={summary.monthlyOrders} maxMonthCount={maxMonthCount} />
              )}
            </section>

            <section className="admin-card dashboard-panel">
              <SectionHeader
                icon={IconShoppingCart}
                title="Gói được quan tâm"
                subtitle="Xếp hạng theo số yêu cầu trong kỳ."
              />
              {!plans.length ? (
                <EmptyState title="Chưa có dữ liệu" />
              ) : (
                <div className="dashboard-ranked-list">
                  {plans.slice(0, 5).map((plan, index) => (
                    <div className="dashboard-rank-row" key={plan.planName}>
                      <div className="dashboard-rank-topline">
                        <span className="dashboard-rank-number">{index + 1}.</span>
                        <span className="dashboard-rank-name" title={plan.planName}>{plan.planName}</span>
                        <strong className="dashboard-rank-count">{plan.orderCount}</strong>
                      </div>
                      <div className="dashboard-rank-track" aria-hidden="true">
                        <span className="dashboard-rank-fill" style={{ width: `${(plan.orderCount / maxPlanCount) * 100}%` }} />
                      </div>
                      <span className="dashboard-rank-amount">Doanh số báo: {money(plan.quotedAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="dashboard-secondary-grid">
            <RecentOrders orders={recentOrders} />
            <RecentActivity activity={recentActivity} />
          </div>

          <section className="admin-card dashboard-panel dashboard-category-panel">
            <SectionHeader
              icon={IconUsers}
              title="Nhu cầu quan tâm theo danh mục"
              subtitle="Tổng hợp nhóm dịch vụ được khách hàng quan tâm trong kỳ."
            />
            {!services.length ? (
              <EmptyState title="Chưa có dữ liệu" />
            ) : (
              <div className="dashboard-category-grid">
                {services.slice(0, 6).map(service => (
                  <div className="dashboard-category-card" key={service.serviceName}>
                    <span className="dashboard-category-name">{service.serviceName}</span>
                    <strong>{service.orderCount}</strong>
                    <span>yêu cầu tư vấn</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="dashboard-summary-note" aria-label="Tóm tắt kỳ báo cáo">
            <span><IconClock size={15} /> {summary.pendingOrders} yêu cầu chờ xử lý</span>
            <span><IconCheck size={15} /> {summary.approvedOrders} đơn đã duyệt</span>
            <span><IconNews size={15} /> {summary.publishedNewsArticles} bài viết đã xuất bản</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
