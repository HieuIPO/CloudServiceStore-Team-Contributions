"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { newsApi, ApiError, type NewsCategory, type NewsArticleDetail } from "@/lib/api";
import { PageHeader, ErrorState, SkeletonLoader, StatusDot } from "./admin/admin-primitives";
import {
  IconArrowLeft,
  IconTrash,
  IconEye,
  IconAlertCircle,
  IconCheck,
  IconX
} from "@tabler/icons-react";

export function AdminNewsEditClient() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [article, setArticle] = useState<NewsArticleDetail | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticleAndCategories() {
      setLoading(true);
      setError(null);
      try {
        const [articleData, catRes] = await Promise.all([
          newsApi.adminArticle(articleId),
          newsApi.adminCategories(true)
        ]);

        setArticle(articleData);
        setCategories(catRes.items);

        setCategoryId(articleData.categoryId);
        setTitle(articleData.title);
        setSlug(articleData.slug);
        setExcerpt(articleData.excerpt);
        setMarkdownContent(articleData.markdownContent);
        setThumbnailUrl(articleData.thumbnailUrl || "");
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : "Không thể tải chi tiết bài viết.");
      } finally {
        setLoading(false);
      }
    }

    if (articleId) void loadArticleAndCategories();
  }, [articleId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleSave = async () => {
    if (!categoryId || !title.trim() || !slug.trim() || !excerpt.trim()) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await newsApi.updateArticle(articleId, {
        categoryId,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        markdownContent,
        thumbnailUrl: thumbnailUrl.trim() || null,
      });

      setArticle(updated);
      setNotice("Đã lưu các thay đổi thành công.");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật bài viết không thành công.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (article.status === 2) {
        const updated = await newsApi.unpublishArticle(articleId);
        setArticle(updated);
        setNotice("Đã gỡ xuất bản bài viết thành công.");
      } else {
        const updated = await newsApi.publishArticle(articleId);
        setArticle(updated);
        setNotice("Đã xuất bản bài viết thành công.");
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật trạng thái bài viết thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!article) return;
    const nextIsFeatured = !article.isFeatured;
    if (nextIsFeatured && article.status !== 2) {
      setError("Chỉ bài viết đã xuất bản mới có thể được chọn làm bài nổi bật.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await newsApi.setFeaturedArticle(article.id, nextIsFeatured);
      setArticle(updated);
      setNotice(nextIsFeatured ? "Đã chọn bài viết làm bài nổi bật." : "Đã bỏ chọn bài viết nổi bật.");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật bài nổi bật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article || !confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"?`)) return;
    setSaving(true);
    try {
      await newsApi.deleteArticle(articleId);
      router.push("/admin/news");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Xóa bài viết thất bại.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader rows={8} />
      </div>
    );
  }

  if (error && !article) {
    return <ErrorState message={error} onRetry={() => router.refresh()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chỉnh sửa bài viết: ${title}`}
        description="Cập nhật nội dung bài viết, xem trước và điều chỉnh trạng thái xuất bản."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/news" className="admin-button admin-button-secondary admin-button-sm">
              <IconArrowLeft size={16} /> Danh sách bài viết
            </Link>

            <button
              onClick={handleDelete}
              className="admin-button admin-button-danger admin-button-sm"
            >
              <IconTrash size={16} /> Xóa bài
            </button>
          </div>
        }
      />

      {error && (
        <div
          key={error}
          className="admin-toast admin-toast-error"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span className="admin-toast-icon" aria-hidden="true">
            <IconAlertCircle size={18} stroke={2.5} />
          </span>
          <span className="admin-toast-copy">
            <strong className="admin-toast-title">Thao tác không thành công</strong>
            <span className="admin-toast-message">{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="admin-toast-close"
            aria-label="Đóng thông báo"
          >
            <IconX size={16} aria-hidden="true" />
          </button>
        </div>
      )}
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

      {article && (
        <div className="flex items-center gap-3">
          <StatusDot
            status={article.status === 2 ? "completed" : "new"}
            label={article.status === 2 ? "Trạng thái: Đã xuất bản" : "Trạng thái: Bản nháp"}
          />
          {article.publishedAt && (
            <span className="text-[11px] text-slate-400">
              Xuất bản ngày: {new Date(article.publishedAt).toLocaleString("vi-VN")}
            </span>
          )}
          {article.status === 2 ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleToggleFeatured()}
              aria-pressed={article.isFeatured}
              className={`admin-button admin-button-sm ${article.isFeatured ? "bg-blue-600 text-white hover:bg-blue-700" : "admin-button-secondary"}`}
            >
              {article.isFeatured ? "Bỏ chọn bài nổi bật" : "Chọn làm bài nổi bật"}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">Xuất bản bài viết trước khi chọn nổi bật</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Form */}
        <div className="admin-card space-y-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Danh mục bài viết *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="admin-select"
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tiêu đề bài viết *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Đường dẫn tĩnh (Slug) *</label>
            <input
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tóm tắt ngắn (Excerpt) *</label>
            <textarea
              rows={3}
              required
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="admin-textarea"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">URL ảnh đại diện (Thumbnail)</label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Nội dung Markdown *</label>
            <textarea
              rows={14}
              required
              value={markdownContent}
              onChange={e => setMarkdownContent(e.target.value)}
              className="admin-textarea font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="admin-button admin-button-primary admin-button-sm flex-1"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>

            {article && (
              <button
                type="button"
                disabled={saving}
                onClick={handleTogglePublish}
                className={`admin-button admin-button-sm flex-1 ${
                  article.status === 2
                    ? "admin-button-secondary"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {article.status === 2 ? "Gỡ xuất bản" : "Xuất bản ngay"}
              </button>
            )}
          </div>
        </div>

        {/* Live Markdown Preview */}
        <div className="admin-card space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <IconEye size={14} /> Xem trước bài viết
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 italic">{excerpt}</p>
          <div className="border-t border-slate-200 pt-4 prose prose-slate max-w-none text-xs">
            <ReactMarkdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{markdownContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
