"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  landingApi,
  type CustomerLogo,
  type LandingPageContent,
  type Testimonial,
  ApiError
} from "@/lib/api";
import {
  StatusDot,
  PageHeader,
  EmptyState,
  ErrorState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import { AdminDialog } from "./admin/admin-dialog";
import {
  IconAppWindow,
  IconMessage2,
  IconPhoto,
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
  IconX
} from "@tabler/icons-react";

type ContentForm = Omit<LandingPageContent, "id" | "updatedAt">;
type TestimonialForm = Omit<Testimonial, "id">;
type LogoForm = Omit<CustomerLogo, "id">;
type DeleteTarget =
  | { type: "testimonial"; item: Testimonial }
  | { type: "logo"; item: CustomerLogo }
  | null;

const TESTIMONIAL_PAGE_SIZE = 10;
const LOGO_PAGE_SIZE = 10;

const emptyContent: ContentForm = {
  heroEyebrow: "",
  heroTitle: "",
  heroDescription: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "/services",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "/pricing",
  aboutTitle: "",
  aboutMarkdown: "",
  infrastructureMarkdown: "",
  uptimeCommitment: "99,9% SLA",
  isPublished: true,
};

const emptyTestimonial: TestimonialForm = {
  customerName: "",
  customerRole: "",
  companyName: "",
  quote: "",
  avatarUrl: "",
  displayOrder: 0,
  isActive: true,
};

const emptyLogo: LogoForm = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  altText: "",
  displayOrder: 0,
  isActive: true,
};

export function AdminLandingClient() {
  const [activeTab, setActiveTab] = useState<"main" | "testimonials" | "logos">("main");

  const [content, setContent] = useState<ContentForm>(emptyContent);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialPage, setTestimonialPage] = useState(1);
  const [logos, setLogos] = useState<CustomerLogo[]>([]);
  const [logoPage, setLogoPage] = useState(1);

  // Testimonial Form State
  const [testForm, setTestForm] = useState<TestimonialForm>(emptyTestimonial);
  const [testEditId, setTestEditId] = useState<string | null>(null);

  // Logo Form State
  const [logoForm, setLogoForm] = useState<LogoForm>(emptyLogo);
  const [logoEditId, setLogoEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await landingApi.admin();
      setContent({
        heroEyebrow: res.content.heroEyebrow,
        heroTitle: res.content.heroTitle,
        heroDescription: res.content.heroDescription,
        primaryCtaLabel: res.content.primaryCtaLabel,
        primaryCtaUrl: res.content.primaryCtaUrl,
        secondaryCtaLabel: res.content.secondaryCtaLabel,
        secondaryCtaUrl: res.content.secondaryCtaUrl,
        aboutTitle: res.content.aboutTitle,
        aboutMarkdown: res.content.aboutMarkdown,
        infrastructureMarkdown: res.content.infrastructureMarkdown,
        uptimeCommitment: res.content.uptimeCommitment,
        isPublished: res.content.isPublished,
      });
      setTestimonials(res.testimonials);
      setTestimonialPage(currentPage => Math.min(currentPage, Math.max(1, Math.ceil(res.testimonials.length / TESTIMONIAL_PAGE_SIZE))));
      setLogos(res.customerLogos);
      setLogoPage(currentPage => Math.min(currentPage, Math.max(1, Math.ceil(res.customerLogos.length / LOGO_PAGE_SIZE))));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải dữ liệu Landing Page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveMainContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await landingApi.updateContent(content);
      setNotice("Đã cập nhật nội dung chính Landing & About thành công.");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Lưu nội dung thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasOrderConflict = testimonials.some(t => t.id !== testEditId && t.displayOrder === testForm.displayOrder);
    const orderConflictNotice = hasOrderConflict
      ? ` Thứ tự ${testForm.displayOrder} đã tồn tại; các đánh giá phía sau đã được dời xuống.`
      : "";
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (testEditId) {
        await landingApi.updateTestimonial(testEditId, testForm);
        setNotice(`Đã cập nhật đánh giá của "${testForm.customerName}".${orderConflictNotice}`);
      } else {
        await landingApi.createTestimonial(testForm);
        setNotice(`Đã thêm đánh giá mới của "${testForm.customerName}".${orderConflictNotice}`);
      }
      setTestForm(emptyTestimonial);
      setTestEditId(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Lưu đánh giá thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTestimonial = async (t: Testimonial) => {
    try {
      await landingApi.updateTestimonial(t.id, {
        customerName: t.customerName,
        customerRole: t.customerRole,
        companyName: t.companyName,
        quote: t.quote,
        avatarUrl: t.avatarUrl,
        displayOrder: t.displayOrder,
        isActive: !t.isActive
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật ẩn/hiện thất bại.");
    }
  };

  const requestDeleteTestimonial = (t: Testimonial) => {
    setDeleteTarget({ type: "testimonial", item: t });
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasLogoOrderConflict = logos.some(l => l.id !== logoEditId && l.displayOrder === logoForm.displayOrder);
    const logoOrderConflictNotice = hasLogoOrderConflict
      ? " Thứ tự đã tồn tại; các logo đối tác phía sau đã được dời xuống."
      : "";
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (logoEditId) {
        await landingApi.updateCustomerLogo(logoEditId, logoForm);
        setNotice(`Đã cập nhật logo đối tác "${logoForm.name}".${logoOrderConflictNotice}`);
      } else {
        await landingApi.createCustomerLogo(logoForm);
        setNotice(`Đã thêm logo đối tác "${logoForm.name}".${logoOrderConflictNotice}`);
      }
      setLogoForm(emptyLogo);
      setLogoEditId(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Lưu logo đối tác thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLogo = async (l: CustomerLogo) => {
    try {
      await landingApi.updateCustomerLogo(l.id, {
        name: l.name,
        logoUrl: l.logoUrl,
        websiteUrl: l.websiteUrl,
        altText: l.altText,
        displayOrder: l.displayOrder,
        isActive: !l.isActive
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật ẩn/hiện logo thất bại.");
    }
  };

  const requestDeleteLogo = (l: CustomerLogo) => {
    setDeleteTarget({ type: "logo", item: l });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleting(true);
    setError(null);
    try {
      if (target.type === "testimonial") {
        await landingApi.deleteTestimonial(target.item.id);
        setNotice(`Đã xóa đánh giá của "${target.item.customerName}".`);
      } else {
        await landingApi.deleteCustomerLogo(target.item.id);
        setNotice(`Đã xóa logo đối tác "${target.item.name}".`);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : target.type === "testimonial"
            ? "Xóa đánh giá thất bại."
            : "Xóa logo thất bại."
      );
    } finally {
      setDeleting(false);
    }
  };

  const testimonialPageCount = Math.max(1, Math.ceil(testimonials.length / TESTIMONIAL_PAGE_SIZE));
  const activeTestimonialPage = Math.min(testimonialPage, testimonialPageCount);
  const visibleTestimonials = testimonials.slice(
    (activeTestimonialPage - 1) * TESTIMONIAL_PAGE_SIZE,
    activeTestimonialPage * TESTIMONIAL_PAGE_SIZE
  );
  const logoPageCount = Math.max(1, Math.ceil(logos.length / LOGO_PAGE_SIZE));
  const activeLogoPage = Math.min(logoPage, logoPageCount);
  const visibleLogos = logos.slice(
    (activeLogoPage - 1) * LOGO_PAGE_SIZE,
    activeLogoPage * LOGO_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Nội dung Landing Page"
        description="Chỉnh sửa Banner Hero, thông tin Giới thiệu, đánh giá khách hàng và logo đối tác."
      />

      {error && <ErrorState message={error} onRetry={loadData} />}
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
            <strong className="admin-toast-title">Cập nhật thành công</strong>
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

      {/* Underlined Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("main")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 ${
            activeTab === "main"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconAppWindow size={16} /> Nội dung chính (Hero & About)
        </button>
        <button
          onClick={() => setActiveTab("testimonials")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 ${
            activeTab === "testimonials"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconMessage2 size={16} /> Đánh giá khách hàng ({testimonials.length})
        </button>
        <button
          onClick={() => setActiveTab("logos")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 ${
            activeTab === "logos"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconPhoto size={16} /> Logo đối tác ({logos.length})
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={8} />
      ) : (
        <>
          {/* Main Content Tab */}
          {activeTab === "main" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <form onSubmit={handleSaveMainContent} className="admin-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-slate-900 text-sm">Chỉnh sửa Hero Banner & About</h2>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.isPublished}
                      onChange={e => setContent({ ...content, isPublished: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Công khai
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Eyebrow (Nhãn Hero) *</label>
                    <input
                      type="text"
                      required
                      value={content.heroEyebrow}
                      onChange={e => setContent({ ...content, heroEyebrow: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Cam kết Uptime *</label>
                    <input
                      type="text"
                      required
                      value={content.uptimeCommitment}
                      onChange={e => setContent({ ...content, uptimeCommitment: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiêu đề Hero *</label>
                  <input
                    type="text"
                    required
                    value={content.heroTitle}
                    onChange={e => setContent({ ...content, heroTitle: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mô tả Hero *</label>
                  <textarea
                    rows={3}
                    required
                    value={content.heroDescription}
                    onChange={e => setContent({ ...content, heroDescription: e.target.value })}
                    className="admin-textarea"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nút CTA chính *</label>
                    <input
                      type="text"
                      required
                      value={content.primaryCtaLabel}
                      onChange={e => setContent({ ...content, primaryCtaLabel: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">URL CTA chính *</label>
                    <input
                      type="text"
                      required
                      value={content.primaryCtaUrl}
                      onChange={e => setContent({ ...content, primaryCtaUrl: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nút CTA phụ *</label>
                    <input
                      type="text"
                      required
                      value={content.secondaryCtaLabel}
                      onChange={e => setContent({ ...content, secondaryCtaLabel: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">URL CTA phụ *</label>
                    <input
                      type="text"
                      required
                      value={content.secondaryCtaUrl}
                      onChange={e => setContent({ ...content, secondaryCtaUrl: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiêu đề About *</label>
                  <input
                    type="text"
                    required
                    value={content.aboutTitle}
                    onChange={e => setContent({ ...content, aboutTitle: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Giới thiệu Markdown (About) *</label>
                  <textarea
                    rows={6}
                    required
                    value={content.aboutMarkdown}
                    onChange={e => setContent({ ...content, aboutMarkdown: e.target.value })}
                    className="admin-textarea font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hạ tầng Markdown (Infrastructure) *</label>
                  <textarea
                    rows={6}
                    required
                    value={content.infrastructureMarkdown}
                    onChange={e => setContent({ ...content, infrastructureMarkdown: e.target.value })}
                    className="admin-textarea font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-button admin-button-primary admin-button-sm w-full"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi nội dung trang công khai"}
                  </button>
                </div>
              </form>

              {/* Live Preview */}
              <div className="admin-card space-y-4 bg-slate-50/50">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <IconEye size={14} /> Xem trước nội dung Hero
                </div>

                <div className="p-4 bg-slate-900 text-white rounded space-y-3">
                  <span className="text-[10px] uppercase font-bold text-blue-400">{content.heroEyebrow}</span>
                  <h2 className="text-xl font-bold">{content.heroTitle}</h2>
                  <p className="text-slate-300 text-xs">{content.heroDescription}</p>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="px-3 py-1 bg-blue-600 font-semibold rounded text-xs">
                      {content.primaryCtaLabel}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 font-semibold rounded text-xs border border-slate-700">
                      {content.secondaryCtaLabel}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h2 className="font-bold text-slate-900 text-base mb-2">{content.aboutTitle}</h2>
                  <div className="prose prose-slate max-w-none text-xs">
                    <ReactMarkdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{content.aboutMarkdown}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === "testimonials" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Form */}
              <form onSubmit={handleSaveTestimonial} className="admin-card space-y-3 self-start">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-slate-900 text-sm">
                    {testEditId ? "Sửa đánh giá khách hàng" : "Thêm đánh giá khách hàng mới"}
                  </h2>
                  {testEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestEditId(null);
                        setTestForm(emptyTestimonial);
                      }}
                      className="text-blue-600 hover:underline text-xs font-semibold"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tên khách hàng *</label>
                    <input
                      type="text"
                      required
                      value={testForm.customerName}
                      onChange={e => setTestForm({ ...testForm, customerName: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Vai trò (Role)</label>
                    <input
                      type="text"
                      value={testForm.customerRole || ""}
                      onChange={e => setTestForm({ ...testForm, customerRole: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tên công ty *</label>
                  <input
                    type="text"
                    required
                    value={testForm.companyName}
                    onChange={e => setTestForm({ ...testForm, companyName: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label className="block font-medium text-slate-700" htmlFor="testimonial-quote">Nội dung đánh giá (Quote) *</label>
                    <span className="text-xs text-slate-500">{testForm.quote.length}/320</span>
                  </div>
                  <textarea
                    id="testimonial-quote"
                    rows={4}
                    required
                    maxLength={320}
                    value={testForm.quote}
                    onChange={e => setTestForm({ ...testForm, quote: e.target.value })}
                    aria-describedby="testimonial-quote-help"
                    className="admin-textarea"
                  />
                  <p className="mt-1 text-xs text-slate-500" id="testimonial-quote-help">Tối đa 320 ký tự để hiển thị gọn trên trang chủ.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">URL Avatar (không bắt buộc)</label>
                    <input
                      type="text"
                      value={testForm.avatarUrl || ""}
                      onChange={e => setTestForm({ ...testForm, avatarUrl: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={testForm.displayOrder}
                      onChange={e => setTestForm({ ...testForm, displayOrder: Math.max(0, Number(e.target.value)) })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-button admin-button-primary admin-button-sm w-full"
                  >
                    {testEditId ? "Lưu thay đổi đánh giá" : "Thêm đánh giá mới"}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="admin-card space-y-3">
                <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Danh sách đánh giá ({testimonials.length})
                </h2>

                {testimonials.length === 0 ? (
                  <EmptyState title="Chưa có đánh giá" />
                ) : (
                  <div className="space-y-3">
                    {visibleTestimonials.map(t => (
                      <div key={t.id} className="p-3 border border-slate-200 rounded space-y-2 bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{t.customerName}</div>
                            <div className="text-[11px] text-slate-500">
                              {t.customerRole ? `${t.customerRole} - ` : ""}
                              {t.companyName} · Thứ tự: {t.displayOrder}
                            </div>
                          </div>
                          <StatusDot
                            status={t.isActive ? "completed" : "cancelled"}
                            label={t.isActive ? "Đang hiện" : "Đã ẩn"}
                          />
                        </div>

                        <p className="text-slate-700 italic border-l-2 border-slate-300 pl-2">“{t.quote}”</p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => {
                              setTestEditId(t.id);
                              setTestForm({
                                customerName: t.customerName,
                                customerRole: t.customerRole || "",
                                companyName: t.companyName,
                                quote: t.quote,
                                avatarUrl: t.avatarUrl || "",
                                displayOrder: t.displayOrder,
                                isActive: t.isActive
                              });
                            }}
                            className="p-1 text-slate-600 hover:text-slate-900"
                            title="Sửa"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleTestimonial(t)}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                              t.isActive ? "bg-slate-200 text-slate-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {t.isActive ? "Ẩn" : "Hiện"}
                          </button>
                          <button
                            onClick={() => requestDeleteTestimonial(t)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Xóa"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {testimonialPageCount > 1 && (
                      <SimplePagination
                        page={activeTestimonialPage}
                        totalPages={testimonialPageCount}
                        onPageChange={setTestimonialPage}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logos Tab */}
          {activeTab === "logos" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Form */}
              <form onSubmit={handleSaveLogo} className="admin-card space-y-3 self-start">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-slate-900 text-sm">
                    {logoEditId ? "Sửa logo đối tác" : "Thêm logo đối tác mới"}
                  </h2>
                  {logoEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoEditId(null);
                        setLogoForm(emptyLogo);
                      }}
                      className="text-blue-600 hover:underline text-xs font-semibold"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tên khách hàng / Đối tác *</label>
                    <input
                      type="text"
                      required
                      value={logoForm.name}
                      onChange={e => setLogoForm({ ...logoForm, name: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Thẻ Alt (Alt text) *</label>
                    <input
                      type="text"
                      required
                      value={logoForm.altText}
                      onChange={e => setLogoForm({ ...logoForm, altText: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">URL Logo (PNG/SVG/WebP) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/logo.png"
                    value={logoForm.logoUrl}
                    onChange={e => setLogoForm({ ...logoForm, logoUrl: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Website (không bắt buộc)</label>
                    <input
                      type="url"
                      placeholder="https://company.com"
                      value={logoForm.websiteUrl || ""}
                      onChange={e => setLogoForm({ ...logoForm, websiteUrl: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={logoForm.displayOrder}
                      onChange={e => setLogoForm({ ...logoForm, displayOrder: Math.max(0, Number(e.target.value)) })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-button admin-button-primary admin-button-sm w-full"
                  >
                    {logoEditId ? "Lưu thay đổi logo" : "Thêm logo mới"}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="admin-card space-y-3">
                <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Danh sách logo đối tác ({logos.length})
                </h2>

                {logos.length === 0 ? (
                  <EmptyState title="Chưa có logo đối tác" />
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                    {visibleLogos.map(l => (
                      <div key={l.id} className="p-3 border border-slate-200 rounded space-y-2 bg-slate-50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 truncate">{l.name}</span>
                            <span className="block text-[11px] text-slate-500">Thứ tự: {l.displayOrder}</span>
                          </div>
                          <StatusDot
                            status={l.isActive ? "completed" : "cancelled"}
                            label={l.isActive ? "Hiện" : "Ẩn"}
                          />
                        </div>

                        <div className="h-16 bg-white border border-slate-100 rounded flex items-center justify-center p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={l.logoUrl}
                            alt={l.altText || "Customer Logo"}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => {
                              setLogoEditId(l.id);
                              setLogoForm({
                                name: l.name,
                                logoUrl: l.logoUrl,
                                websiteUrl: l.websiteUrl || "",
                                altText: l.altText,
                                displayOrder: l.displayOrder,
                                isActive: l.isActive
                              });
                            }}
                            className="p-1 text-slate-600 hover:text-slate-900"
                            title="Sửa"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleLogo(l)}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                              l.isActive ? "bg-slate-200 text-slate-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {l.isActive ? "Ẩn" : "Hiện"}
                          </button>
                          <button
                            onClick={() => requestDeleteLogo(l)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Xóa"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                    {logoPageCount > 1 && (
                      <SimplePagination
                        page={activeLogoPage}
                        totalPages={logoPageCount}
                        onPageChange={setLogoPage}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <AdminDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={deleteTarget?.type === "logo" ? "Xóa logo đối tác" : "Xóa đánh giá khách hàng"}
        description="Bản ghi sẽ được xóa khỏi danh sách và nội dung công khai."
        isSubmitting={deleting}
      >
        {deleteTarget && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Bạn có chắc muốn xóa {deleteTarget.type === "logo" ? "logo đối tác" : "đánh giá của khách hàng"}{" "}
              <strong className="text-slate-900">
                “{deleteTarget.type === "logo" ? deleteTarget.item.name : deleteTarget.item.customerName}”
              </strong>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="admin-button admin-button-secondary admin-button-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="admin-button admin-button-danger admin-button-sm"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
