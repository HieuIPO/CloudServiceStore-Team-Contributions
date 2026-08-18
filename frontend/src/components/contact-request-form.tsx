"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type ContactForm = { fullName: string; email: string; phoneNumber: string; companyName: string; subject: string; message: string };
const initialForm: ContactForm = { fullName: "", email: "", phoneNumber: "", companyName: "", subject: "", message: "" };

export function ContactRequestForm() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const update = (key: keyof ContactForm, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      await apiFetch<{ id: string; status: number; createdAt: string }>("/api/v1/contact-requests", { method: "POST", body: JSON.stringify(form) });
      setForm(initialForm);
      setSuccess("Cảm ơn bạn. Đội ngũ CloudServiceStore sẽ liên hệ tư vấn trong thời gian sớm nhất.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.");
    } finally { setSubmitting(false); }
  }

  const field = "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-xl font-black text-[#10245a] sm:text-2xl">Gửi yêu cầu tư vấn</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Mô tả nhu cầu của bạn. Thông tin được dùng để tư vấn và xử lý yêu cầu, không hiển thị công khai.</p>
      {success && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{success}</p>}
      {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Họ và tên" required><input className={field} maxLength={160} required value={form.fullName} onChange={event => update("fullName", event.target.value)} /></Field>
        <Field label="Email" required><input className={field} maxLength={256} required type="email" value={form.email} onChange={event => update("email", event.target.value)} /></Field>
        <Field label="Số điện thoại" required><input className={field} maxLength={30} minLength={8} required type="tel" value={form.phoneNumber} onChange={event => update("phoneNumber", event.target.value)} /></Field>
        <Field label="Công ty"><input className={field} maxLength={160} value={form.companyName} onChange={event => update("companyName", event.target.value)} /></Field>
        <Field label="Chủ đề" required><input className={field} maxLength={180} required value={form.subject} onChange={event => update("subject", event.target.value)} /></Field>
        <Field className="sm:col-span-2" label="Nội dung cần tư vấn" required><textarea className={`${field} min-h-32 resize-y`} maxLength={4000} required value={form.message} onChange={event => update("message", event.target.value)} /></Field>
        <button className="min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2" disabled={submitting} type="submit">{submitting ? "Đang gửi..." : "Gửi yêu cầu"}</button>
      </form>
    </section>
  );
}

function Field({ children, className = "", label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) {
  return <label className={`grid gap-1.5 text-xs font-bold text-slate-700 ${className}`}><span>{label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</span>{children}</label>;
}
