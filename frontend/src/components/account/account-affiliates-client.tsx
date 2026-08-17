"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountApi, ApiError, type AffiliateStatus, type CustomerAffiliateListItem, type PagedResult } from "@/lib/api";
import { useAccountSession } from "@/components/account/account-session-provider";
import { accountAffiliateStatusClass, accountAffiliateStatusLabel, formatAccountDate } from "@/components/account/account-utils";

const statusOptions: Array<{ value: AffiliateStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: 1, label: "Chờ duyệt" },
  { value: 2, label: "Đang xem xét" },
  { value: 3, label: "Đã duyệt" },
  { value: 4, label: "Từ chối" },
];

export function AccountAffiliatesClient() {
  const { user, logout } = useAccountSession();
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | "">("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<CustomerAffiliateListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void accountApi.affiliates({ page, pageSize: 10, status: statusFilter || undefined }, controller.signal)
      .then(setResult)
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof ApiError ? reason.message : "Không thể tải hồ sơ Affiliate.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, statusFilter]);

  const changeStatus = (value: string) => {
    setLoading(true);
    setError(null);
    setPage(1);
    setStatusFilter(value ? Number(value) as AffiliateStatus : "");
  };

  return <main className="account-page bg-[#f8fbff]"><section className="border-b border-blue-100 bg-white"><div className="shell flex flex-wrap items-end justify-between gap-5 py-8"><div><p className="text-sm font-black text-blue-600">Tài khoản khách hàng</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#10245a]">Hồ sơ Affiliate của tôi</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Xin chào {user?.fullName}. Theo dõi các hồ sơ Affiliate bạn đã gửi và trạng thái xem xét từ đội ngũ CloudServiceStore.</p></div><div className="flex flex-wrap gap-2"><Link className="min-h-11 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700" href="/affiliate">Gửi hồ sơ mới</Link><Link className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#10245a] hover:border-blue-300 hover:bg-blue-50" href="/account">Yêu cầu dịch vụ</Link><button className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => void logout()} type="button">Đăng xuất</button></div></div></section><section className="shell py-7 sm:py-9"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#10245a]">Danh sách hồ sơ</h2>{result && <p className="mt-1 text-sm text-slate-500">{result.totalCount} hồ sơ</p>}</div><label className="text-sm font-bold text-slate-700">Lọc trạng thái<select aria-label="Lọc hồ sơ Affiliate theo trạng thái" className="field ml-2 min-h-11 w-48" onChange={event => changeStatus(event.target.value)} value={statusFilter}><option value="">Tất cả trạng thái</option>{statusOptions.slice(1).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>{error && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}{loading ? <AffiliateSkeleton /> : result?.items.length ? <div className="mt-5 grid gap-4">{result.items.map(application => <AffiliateCard application={application} key={application.id} />)}</div> : <EmptyAffiliates />}{result && result.totalPages > 1 && <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"><button className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)} type="button">← Trang trước</button><span className="text-sm font-bold text-slate-600">Trang {result.page} / {result.totalPages}</span><button className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} type="button">Trang sau →</button></div>}</section></main>;
}

function AffiliateCard({ application }: { application: CustomerAffiliateListItem }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Hồ sơ Affiliate</p><h3 className="mt-2 text-lg font-black text-[#10245a]">{application.companyName || application.fullName}</h3><p className="mt-1 text-xs text-slate-500">Mã hồ sơ: {application.id}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${accountAffiliateStatusClass(application.status)}`}>{accountAffiliateStatusLabel(application.status)}</span></div><div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Người đăng ký</span><strong className="mt-1 block text-[#10245a]">{application.fullName}</strong></div><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Ngày gửi</span><strong className="mt-1 block text-[#10245a]">{formatAccountDate(application.createdAt)}</strong></div></div><Link className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50" href={`/account/affiliates/${application.id}`}>Xem chi tiết →</Link></article>;
}

function AffiliateSkeleton() {
  return <div aria-busy="true" aria-label="Đang tải hồ sơ Affiliate" className="mt-5 grid gap-4">{[1, 2, 3].map(item => <div className="h-48 animate-pulse rounded-xl border border-slate-100 bg-white" key={item} />)}</div>;
}

function EmptyAffiliates() {
  return <div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-xl text-blue-600">↗</div><h3 className="mt-4 text-lg font-black text-[#10245a]">Chưa có hồ sơ Affiliate</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Bạn có thể gửi hồ sơ đối tác để đội ngũ CloudServiceStore xem xét và liên hệ xác minh.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700" href="/affiliate">Đăng ký làm đối tác</Link></div>;
}
