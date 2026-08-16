"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { accountApi, ApiError, type CustomerAffiliateDetail } from "@/lib/api";
import { accountAffiliateStatusClass, accountAffiliateStatusLabel, formatAccountDate } from "@/components/account/account-utils";

export function AccountAffiliateDetailClient() {
  const params = useParams<{ id: string }>();
  const [application, setApplication] = useState<CustomerAffiliateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let subscribed = true;
    void accountApi.affiliate(params.id)
      .then(value => {
        if (subscribed) setApplication(value);
      })
      .catch(reason => {
        if (subscribed) setError(reason instanceof ApiError && reason.status === 404 ? "Không tìm thấy hồ sơ này trong tài khoản của bạn." : "Không thể tải chi tiết hồ sơ Affiliate.");
      })
      .finally(() => {
        if (subscribed) setLoading(false);
      });
    return () => { subscribed = false; };
  }, [params.id]);

  if (loading) return <main className="account-page bg-[#f8fbff] py-10"><div className="shell"><div className="h-96 animate-pulse rounded-xl bg-white" /></div></main>;
  if (error || !application) return <main className="account-page bg-[#f8fbff] py-10"><div className="shell"><section className="rounded-xl border border-rose-200 bg-white p-8 text-center"><h1 className="text-xl font-black text-[#10245a]">{error ?? "Không tìm thấy hồ sơ"}</h1><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700" href="/account/affiliates">Quay lại hồ sơ Affiliate</Link></section></div></main>;

  return <main className="account-page bg-[#f8fbff]"><section className="border-b border-blue-100 bg-white"><div className="shell py-8"><Link className="text-sm font-bold text-blue-700 hover:underline" href="/account/affiliates">← Quay lại hồ sơ Affiliate</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Hồ sơ Affiliate</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#10245a]">Chi tiết hồ sơ</h1><p className="mt-2 text-sm text-slate-500">Mã hồ sơ: {application.id}</p></div><span className={`rounded-full border px-4 py-2 text-sm font-black ${accountAffiliateStatusClass(application.status)}`}>{accountAffiliateStatusLabel(application.status)}</span></div></div></section><section className="shell grid gap-5 py-7 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.7fr)]"><div className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Thông tin hồ sơ</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Họ và tên" value={application.fullName} /><Info label="Email" value={application.email} /><Info label="Số điện thoại" value={application.phoneNumber} /><Info label="Công ty / thương hiệu" value={application.companyName || "—"} /><Info label="Website / kênh giới thiệu" value={application.websiteUrl || "—"} /><Info label="Ngày gửi" value={formatAccountDate(application.createdAt)} /></div><DetailBlock label="Kênh quảng bá" value={application.promotionChannels} /><DetailBlock label="Giới thiệu về kênh / kế hoạch hợp tác" value={application.audienceDescription} />{application.experienceDescription && <DetailBlock label="Kinh nghiệm" value={application.experienceDescription} />}</section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Tiến trình xét duyệt</h2><ol className="mt-5 space-y-4">{application.statusHistory.map((history, index) => <li className="relative flex gap-3" key={history.id}>{index < application.statusHistory.length - 1 && <span aria-hidden="true" className="absolute left-[.45rem] top-5 h-full w-px bg-blue-100" />}<span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-50" /><div><p className="text-sm font-black text-[#10245a]">{history.fromStatus === history.toStatus ? "Đã tiếp nhận hồ sơ" : `Đã chuyển sang: ${accountAffiliateStatusLabel(history.toStatus)}`}</p><p className="mt-1 text-xs text-slate-500">{formatAccountDate(history.createdAt)}</p></div></li>)}</ol></section></div><aside className="h-fit rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#10245a]">Lưu ý</h2><p className="mt-2 text-sm leading-6 text-slate-600">Đây là hồ sơ đăng ký đối tác, chưa phải tài khoản Affiliate đã được kích hoạt. Khi Admin hoặc Editor cập nhật trạng thái, tiến trình trong tài khoản sẽ được cập nhật theo.</p><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700" href="/affiliate">Gửi hồ sơ khác</Link></aside></section></main>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-black text-[#10245a]">{value}</p></div>;
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-black text-[#10245a]">{label}</h3><p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">{value}</p></div>;
}
