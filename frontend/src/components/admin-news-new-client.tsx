"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { newsApi, ApiError, type NewsCategory } from "@/lib/api";
import { PageHeader, ErrorState } from "./admin/admin-primitives";
import { IconArrowLeft, IconCheck, IconEye } from "@tabler/icons-react";

export function AdminNewsNewClient() {
  const router = useRouter();

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [markdownContent, setMarkdownContent] = useState("# Tiêu đề bài viết\n\nNội dung bài viết dùng định dạng Markdown...");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await newsApi.adminCategories(true);
        setCategories(res.items);
        if (res.items.length > 0) setCategoryId(res.items[0].id);
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : "Không thể nạp danh mục.");
      }
    }
    void loadCategories();
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto generate slug if empty
    if (!slug) {
      const generatedSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (publishImmediately = false) => {
    if (!categoryId || !title.trim() || !slug.trim() || !excerpt.trim()) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await newsApi.createArticle({
        categoryId,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        markdownContent,
        thumbnailUrl: thumbnailUrl.trim() || null,
      });

      if (publishImmediately) {
        await newsApi.publishArticle(created.id);
      }

      router.push("/admin/news");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Tạo bài viết không thành công.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soạn thảo bài viết mới"
        description="Tạo bản nháp bài viết mới với trình xem trước Markdown."
        actions={
          <Link href="/admin/news" className="admin-button admin-button-secondary admin-button-sm">
            <IconArrowLeft size={16} /> Quay lại danh sách
          </Link>
        }
      />

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Editor Form */}
        <div className="admin-card space-y-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Danh mục bài viết *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="admin-select"
              required
            >
              <option value="">Chọn danh mục</option>
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
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề..."
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
              placeholder="tieu-de-bai-viet"
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
              placeholder="Mô tả tóm tắt nội dung bài viết..."
              className="admin-textarea"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">URL ảnh đại diện (Thumbnail)</label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
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
              onClick={() => handleSave(false)}
              className="admin-button admin-button-secondary admin-button-sm flex-1"
            >
              {saving ? "Đang lưu..." : "Lưu bản nháp"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="admin-button bg-emerald-600 hover:bg-emerald-700 text-white admin-button-sm flex-1"
            >
              <IconCheck size={16} /> Lưu & Xuất bản ngay
            </button>
          </div>
        </div>

        {/* Live Markdown Preview */}
        <div className="admin-card space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <IconEye size={14} /> Xem trước hiển thị bài viết
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title || "Tiêu đề bài viết"}</h2>
          <p className="text-slate-500 italic">{excerpt || "Tóm tắt bài viết sẽ hiển thị ở đây."}</p>
          <div className="border-t border-slate-200 pt-4 prose prose-slate max-w-none text-xs">
            <ReactMarkdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{markdownContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
