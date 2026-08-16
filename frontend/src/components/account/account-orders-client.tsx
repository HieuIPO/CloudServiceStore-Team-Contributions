"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, accountApi, type CustomerOrderListItem, type OrderStatus, type PagedResult } from "@/lib/api";
import { useAccountSession } from "@/components/account/account-session-provider";
import { accountStatusClass, accountStatusLabel, formatAccountDate, formatAccountMoney } from "@/components/account/account-utils";
import { AccountProfileCard } from "@/components/account/account-profile-card";

const statusOptions: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: 1, label: "Mới tạo" },
  { value: 2, label: "Đã liên hệ" },
  { value: 3, label: "Đã duyệt" },
  { value: 4, label: "Từ chối" },
  { value: 5, label: "Đã hủy" },
];

export function AccountOrdersClient() {
  const { user, updateUser } = useAccountSession();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<CustomerOrderListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void accountApi.orders({ page, pageSize: 10, status: statusFilter || undefined }, controller.signal)
      .then(setResult)
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof ApiError ? reason.message : "Không thể tải yêu cầu dịch vụ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, statusFilter]);

  const changeStatus = (value: string) => {
    setLoading(true);
    setError(null);
    setStatusFilter(value ? Number(value) as OrderStatus : "");
    setPage(1);
  };

  return <main className="account-page bg-[#f8fbff]"><section className="border-b border-blue-100 bg-white"><div className="shell flex flex-wrap items-end justify-between gap-5 py-8"><div><p className="text-sm font-black text-blue-600">Tài khoản khách hàng</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#10245a]">Yêu cầu dịch vụ của tôi</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Xin chào {user?.fullName}. Theo dõi các yêu cầu đã gửi và trạng thái xử lý từ đội ngũ CloudServiceStore.</p></div><div className="flex flex-wrap gap-2"><Link className="min-h-11 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700" href="/order">Gửi yêu cầu mới</Link></div></div></section>{user && <section className="shell pt-7 sm:pt-9"><AccountProfileCard onSaved={updateUser} user={user} /></section>}<section className="shell py-7 sm:py-9"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#10245a]">Danh sách yêu cầu</h2>{result && <p className="mt-1 text-sm text-slate-500">{result.totalCount} yêu cầu</p>}</div><label className="text-sm font-bold text-slate-700">Lọc trạng thái<select aria-label="Lọc yêu cầu theo trạng thái" className="field ml-2 min-h-11 w-48" onChange={event => changeStatus(event.target.value)} value={statusFilter}><option value="">Tất cả trạng thái</option>{statusOptions.slice(1).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>{error && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{loading ? <OrdersSkeleton /> : result?.items.length ? <div className="mt-5 grid gap-4">{result.items.map(order => <OrderCard key={order.id} order={order} />)}</div> : <EmptyOrders />}{result && result.totalPages > 1 && <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"><button className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)} type="button">← Trang trước</button><span className="text-sm font-bold text-slate-600">Trang {result.page} / {result.totalPages}</span><button className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} type="button">Trang sau →</button></div>}</section></main>;
}

function OrderCard({ order }: { order: CustomerOrderListItem }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">{order.planName}</p><h3 className="mt-2 text-lg font-black text-[#10245a]">Yêu cầu {order.id.slice(0, 8).toUpperCase()}</h3></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${accountStatusClass(order.status)}`}>{accountStatusLabel(order.status)}</span></div><div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Chu kỳ</span><strong className="mt-1 block text-[#10245a]">{order.billingCycle === 1 ? "Theo tháng" : "Theo năm"}</strong></div><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Giá chốt</span><strong className="mt-1 block text-[#10245a]">{formatAccountMoney(order.quotedAmount, order.currency)}</strong></div><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Ngày gửi</span><strong className="mt-1 block text-[#10245a]">{formatAccountDate(order.createdAt)}</strong></div></div><Link className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50" href={`/account/orders/${order.id}`}>Xem chi tiết →</Link></article>;
}

function OrdersSkeleton() {
  return <div aria-busy="true" aria-label="Đang tải yêu cầu" className="mt-5 grid gap-4">{[1, 2, 3].map(item => <div className="h-48 animate-pulse rounded-xl border border-slate-100 bg-white" key={item} />)}</div>;
}

function EmptyOrders() {
  return <div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-xl text-blue-600">☁</div><h3 className="mt-4 text-lg font-black text-[#10245a]">Chưa có yêu cầu dịch vụ</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Bạn có thể xem bảng giá và gửi yêu cầu tư vấn cho gói phù hợp bất cứ lúc nào.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700" href="/pricing">Xem bảng giá</Link></div>;
}
