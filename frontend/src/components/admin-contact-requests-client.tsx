"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch, type PagedResult } from "@/lib/api";

type Status = 1 | 2 | 3 | 4;
type ListItem = { id: string; fullName: string; email: string; phoneNumber: string; companyName?: string; subject: string; status: Status; createdAt: string };
type History = { id: string; fromStatus: Status; toStatus: Status; note?: string; changedBy?: string; createdAt: string };
type Detail = ListItem & { message: string; resolutionNote?: string; resolvedBy?: string; resolvedAt?: string; updatedAt?: string; statusHistory: History[] };
const statusLabels: Record<Status, string> = { 1: "Mới", 2: "Đang xử lý", 3: "Đã giải quyết", 4: "Từ chối" };
const nextStatuses: Record<Status, Status[]> = { 1: [2, 3, 4], 2: [3, 4], 3: [], 4: [] };

export function AdminContactRequestsClient() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search.trim()) query.set("search", search.trim());
      if (status) query.set("status", String(status));
      const result = await apiFetch<PagedResult<ListItem>>(`/api/v1/contact-requests?${query}`);
      setItems(result.items); setTotalPages(Math.max(1, result.totalPages));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể tải yêu cầu liên hệ.");
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  async function openDetail(id: string) {
    setError(null);
    try { setSelected(await apiFetch<Detail>(`/api/v1/contact-requests/${id}`)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể tải chi tiết."); }
  }

  async function updateStatus(next: Status) {
    if (!selected) return;
    const note = window.prompt("Ghi chú xử lý (bắt buộc khi từ chối):", selected.resolutionNote ?? "");
    if (next === 4 && !note?.trim()) return;
    setError(null);
    try {
      const updated = await apiFetch<Detail>(`/api/v1/contact-requests/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, note: note || null }) });
      setSelected(updated); setNotice("Đã cập nhật trạng thái."); await load();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể cập nhật trạng thái."); }
  }

  return <main className="space-y-5 p-4 sm:p-6 lg:p-8">
    <header><p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Vận hành</p><h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Yêu cầu liên hệ</h1><p className="mt-2 text-sm text-slate-500">Tiếp nhận, phân loại và theo dõi yêu cầu tư vấn từ khách hàng.</p></header>
    {notice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
    {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
      <input aria-label="Tìm kiếm yêu cầu liên hệ" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={event => setSearch(event.target.value)} placeholder="Tìm tên, email, chủ đề..." value={search} />
      <select aria-label="Lọc trạng thái" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm" onChange={event => setStatus(event.target.value ? Number(event.target.value) as Status : "")} value={status}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Người gửi</th><th className="px-4 py-3">Chủ đề</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Ngày gửi</th><th className="px-4 py-3"> </th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>Đang tải...</td></tr> : items.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>Chưa có yêu cầu phù hợp.</td></tr> : items.map(item => <tr className="align-top" key={item.id}><td className="px-4 py-4"><p className="font-bold text-slate-900">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.email}</p></td><td className="max-w-xs px-4 py-4 text-slate-700">{item.subject}</td><td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{statusLabels[item.status]}</span></td><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</td><td className="px-4 py-4"><button className="font-bold text-blue-700 underline" onClick={() => void openDetail(item.id)} type="button">Xem</button></td></tr>)}</tbody></table></div></section>
    <div className="flex items-center justify-between gap-3"><button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))} type="button">Trang trước</button><span className="text-xs font-bold text-slate-500">Trang {page}/{totalPages}</span><button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold disabled:opacity-40" disabled={page >= totalPages || loading} onClick={() => setPage(value => Math.min(totalPages, value + 1))} type="button">Trang sau</button></div>
    {selected && <div aria-label="Chi tiết yêu cầu liên hệ" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3" role="dialog"><article className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Chi tiết yêu cầu</p><h2 className="mt-2 text-xl font-black text-slate-900">{selected.subject}</h2></div><button aria-label="Đóng" className="text-2xl leading-none text-slate-400" onClick={() => setSelected(null)} type="button">×</button></div><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-bold text-slate-500">Họ tên</dt><dd>{selected.fullName}</dd></div><div><dt className="font-bold text-slate-500">Email</dt><dd className="break-all">{selected.email}</dd></div><div><dt className="font-bold text-slate-500">Điện thoại</dt><dd>{selected.phoneNumber}</dd></div><div><dt className="font-bold text-slate-500">Công ty</dt><dd>{selected.companyName || "—"}</dd></div></dl><div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p className="font-bold text-slate-900">Nội dung</p><p className="mt-2 whitespace-pre-wrap">{selected.message}</p></div><div className="mt-5 flex flex-wrap gap-2">{nextStatuses[selected.status].map(next => <button className="min-h-10 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700" key={next} onClick={() => void updateStatus(next)} type="button">Chuyển: {statusLabels[next]}</button>)}</div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Lịch sử</p><div className="mt-3 space-y-2">{selected.statusHistory.map(history => <p className="text-xs text-slate-600" key={history.id}>{statusLabels[history.toStatus]} · {new Date(history.createdAt).toLocaleString("vi-VN")}{history.note ? ` · ${history.note}` : ""}</p>)}</div></div></article></div>}
  </main>;
}
