"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { accountApi, ApiError, type CustomerOrderDetail } from "@/lib/api";
import { accountStatusClass, accountStatusLabel, formatAccountDate, formatAccountMoney, readSpecification } from "@/components/account/account-utils";

export function AccountOrderDetailClient() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let subscribed = true;
    void accountApi.order(params.id)
      .then(value => {
        if (subscribed) setOrder(value);
      })
      .catch(reason => {
        if (subscribed) setError(reason instanceof ApiError && reason.status === 404 ? "Không tìm thấy yêu cầu này trong tài khoản của bạn." : "Không thể tải chi tiết yêu cầu.");
      })
      .finally(() => {
        if (subscribed) setLoading(false);
      });
    return () => { subscribed = false; };
  }, [params.id]);

  if (loading) return <main className="account-page bg-[#f8fbff] py-10"><div className="shell"><div className="h-96 animate-pulse rounded-xl bg-white" /></div></main>;
  if (error || !order) return <main className="account-page bg-[#f8fbff] py-10"><div className="shell"><section className="rounded-xl border border-rose-200 bg-white p-8 text-center"><h1 className="text-xl font-black text-[#10245a]">{error ?? "Không tìm thấy yêu cầu"}</h1><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700" href="/account">Quay lại tài khoản</Link></section></div></main>;

  const features = readSpecification(order);
  return <main className="account-page bg-[#f8fbff]"><section className="border-b border-blue-100 bg-white"><div className="shell py-8"><Link className="text-sm font-bold text-blue-700 hover:underline" href="/account">← Quay lại yêu cầu của tôi</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">{order.planName}</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#10245a]">Chi tiết yêu cầu</h1><p className="mt-2 text-sm text-slate-500">Mã yêu cầu: {order.id}</p></div><span className={`rounded-full border px-4 py-2 text-sm font-black ${accountStatusClass(order.status)}`}>{accountStatusLabel(order.status)}</span></div></div></section><section className="shell grid gap-5 py-7 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.7fr)]"><div className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Thông tin gói dịch vụ</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Chu kỳ" value={order.billingCycle === 1 ? "Theo tháng" : "Theo năm"} /><Info label="Giá gốc" value={formatAccountMoney(order.originalAmount, order.currency)} /><Info label="Giá chốt tham khảo" value={formatAccountMoney(order.quotedAmount, order.currency)} /><Info label="Ngày gửi" value={formatAccountDate(order.createdAt)} /></div>{features.length > 0 && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-black text-[#10245a]">Cấu hình đã ghi nhận</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{features.map((feature, index) => <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700" key={`${feature.featureKey ?? feature.displayName ?? "feature"}-${index}`}><span className="font-bold">{feature.displayName ?? feature.featureKey}:</span> {feature.value ?? "—"}{feature.unit ? ` ${feature.unit}` : ""}</li>)}</ul></div>}</section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Tiến trình xử lý</h2><ol className="mt-5 space-y-4">{order.statusHistory.map((history, index) => <li className="relative flex gap-3" key={history.id}>{index < order.statusHistory.length - 1 && <span aria-hidden="true" className="absolute left-[.45rem] top-5 h-full w-px bg-blue-100" />}<span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-50" /><div><p className="text-sm font-black text-[#10245a]">{history.fromStatus === history.toStatus ? "Đã tiếp nhận yêu cầu" : `Đã chuyển sang: ${accountStatusLabel(history.toStatus)}`}</p><p className="mt-1 text-xs text-slate-500">{formatAccountDate(history.createdAt)}</p></div></li>)}</ol></section></div><aside className="h-fit rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Cần hỗ trợ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Đây là yêu cầu tư vấn, chưa phải thanh toán hoặc kích hoạt tự động. Nhân viên sẽ liên hệ để xác nhận bước tiếp theo.</p><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700" href="/order">Gửi yêu cầu khác</Link></aside></section></main>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-[#10245a]">{value}</p></div>;
}
