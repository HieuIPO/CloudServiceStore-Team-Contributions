"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  newsApi,
  type NewsArticle,
  type NewsCategory,
  type NewsArticleStatus,
  ApiError
} from "@/lib/api";
import {
  StatusDot,
  PageHeader,
  EmptyState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconX,
  IconRefresh,
  IconAlertCircle,
  IconCheck
} from "@tabler/icons-react";

const NEWS_PAGE_SIZE = 10;

export function AdminNewsClient() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsArticleStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);
  const [articleTotalCount, setArticleTotalCount] = useState(0);

  // Category Modal Drawer
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const loadData = useCallback(async (requestedPage: number) => {
    setError(null);
    try {
      const [artRes, catActiveRes, catInactiveRes] = await Promise.all([
        newsApi.adminArticles({
          page: requestedPage,
          pageSize: NEWS_PAGE_SIZE,
          search: search || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined
        }),
        newsApi.adminCategories(true),
        newsApi.adminCategories(false)
      ]);
      setArticles(artRes.items);
      setArticlePage(Math.min(artRes.page, Math.max(1, artRes.totalPages)));
      setArticleTotalPages(artRes.totalPages);
      setArticleTotalCount(artRes.totalCount);
      setCategories([...catActiveRes.items, ...catInactiveRes.items]);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void loadData(articlePage);
    }, 0);
    return () => clearTimeout(timer);
  }, [articlePage, loadData]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (articlePage === 1) void loadData(1);
    else setArticlePage(1);
  };

  const handleSyncNewsData = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await newsApi.syncNewsData(5, false);
      setNotice(`\u0110\u00E3 \u0111\u1ED3ng b\u1ED9 ${result.fetched} b\u00E0i t\u1EEB 5 ch\u1EE7 \u0111\u1EC1: th\u00EAm ${result.created}, c\u1EADp nh\u1EADt ${result.updated}. B\u00E0i m\u1EDBi \u0111\u01B0\u1EE3c l\u01B0u \u1EDF tr\u1EA1ng th\u00E1i nh\u00E1p \u0111\u1EC3 Admin duy\u1EC7t.`);
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Đồng bộ NewsData.io thất bại.");
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePublish = async (article: NewsArticle) => {
    setError(null);
    try {
      if (article.status === 2) {
        await newsApi.unpublishArticle(article.id);
        setNotice(`Đã gỡ xuất bản bài viết "${article.title}".`);
      } else {
        await newsApi.publishArticle(article.id);
        setNotice(`Đã xuất bản bài viết "${article.title}".`);
      }
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại.");
    }
  };

  const handleToggleFeatured = async (article: NewsArticle) => {
    const nextIsFeatured = !article.isFeatured;
    if (nextIsFeatured && article.status !== 2) {
      setError("Chỉ bài viết đã xuất bản mới có thể được chọn làm bài nổi bật.");
      return;
    }

    setError(null);
    try {
      await newsApi.setFeaturedArticle(article.id, nextIsFeatured);
      setNotice(nextIsFeatured
        ? `Đã chọn bài viết "${article.title}" làm bài nổi bật.`
        : `Đã bỏ chọn bài viết nổi bật "${article.title}".`);
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật bài nổi bật thất bại.");
    }
  };

  const handleDeleteArticle = async (article: NewsArticle) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"?`)) return;
    setError(null);
    try {
      await newsApi.deleteArticle(article.id);
      setNotice(`Đã xóa bài viết "${article.title}".`);
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Xóa bài viết thất bại.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSaving(true);
    setError(null);
    try {
      await newsApi.createCategory({
        name: catName.trim(),
        slug: catSlug.trim(),
        description: catDesc.trim() || undefined,
        displayOrder: 0,
        isActive: true
      });
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      setNotice("Đã tạo danh mục mới thành công.");
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Tạo danh mục thất bại.");
    } finally {
      setCatSaving(false);
    }
  };

  const handleToggleCategory = async (cat: NewsCategory) => {
    try {
      await newsApi.updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        displayOrder: cat.displayOrder,
        isActive: !cat.isActive
      });
      await loadData(articlePage);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cập nhật danh mục thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Tin tức & Bài viết"
        description="Soạn thảo, quản lý bài viết tin tức và danh mục trên hệ thống."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncNewsData}
              disabled={syncing}
              aria-busy={syncing}
              className="admin-button admin-button-secondary admin-button-sm"
              title="Lấy tối đa 5 bài cho mỗi chủ đề và lưu ở trạng thái nháp"
            >
              <IconRefresh size={16} className={syncing ? "animate-spin" : undefined} /> {syncing ? "Đang đồng bộ..." : "Đồng bộ NewsData"}
            </button>
            <button
              onClick={() => setCatDrawerOpen(true)}
              className="admin-button admin-button-secondary admin-button-sm"
            >
              <IconCategory size={16} /> Quản lý danh mục ({categories.length})
            </button>
            <Link
              href="/admin/news/new"
              className="admin-button admin-button-primary admin-button-sm"
            >
              <IconPlus size={16} /> Soạn bài viết mới
            </Link>
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void loadData(articlePage)}
              className="admin-toast-retry"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => setError(null)}
              className="admin-toast-close"
              aria-label="Đóng thông báo"
            >
              <IconX size={16} aria-hidden="true" />
            </button>
          </div>
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

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="admin-card !p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề..."
            value={search}
            onChange={e => { setSearch(e.target.value); setArticlePage(1); }}
            className="admin-input !pl-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value ? (Number(e.target.value) as NewsArticleStatus) : ""); setArticlePage(1); }}
          className="admin-select !w-40"
        >
          <option value="">Tất cả trạng thái</option>
          <option value={1}>Nháp (Draft)</option>
          <option value={2}>Đã xuất bản (Published)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setArticlePage(1); }}
          className="admin-select !w-48"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button type="submit" className="admin-button admin-button-primary admin-button-sm">
          Tìm kiếm
        </button>
      </form>

      {/* Articles Table */}
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : articles.length === 0 ? (
        <EmptyState title="Không có bài viết" description="Chưa có bài viết nào phù hợp với bộ lọc." />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Danh sách bài viết ({articleTotalCount})</span>
            <span>Hiển thị {articles.length} bài mỗi trang</span>
          </div>
          <div className="hidden md:block admin-table-container">
            <table className="admin-table admin-news-table">
              <thead>
                <tr>
                  <th>Tiêu đề bài viết</th>
                  <th>Danh mục</th>
                  <th>Bài nổi bật</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id}>
                    <td className="admin-news-article-cell">
                      <div className="admin-news-article-copy">
                        <div
                          aria-label={article.title}
                          className="admin-news-article-title font-semibold text-slate-900"
                          data-full-text={article.title}
                          title={article.title}
                        >
                          {article.title}
                        </div>
                        <div
                          aria-label={`/news/${article.slug}`}
                          className="admin-news-article-slug text-[11px] text-slate-500"
                          data-full-text={`/news/${article.slug}`}
                          title={`/news/${article.slug}`}
                        >
                          /news/{article.slug}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-slate-700">{article.categoryName}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void handleToggleFeatured(article)}
                        disabled={!article.isFeatured && article.status !== 2}
                        aria-pressed={article.isFeatured}
                        className={`min-h-[40px] rounded px-3 py-1.5 text-xs font-semibold transition ${
                          article.isFeatured
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : article.status === 2
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                        title={article.isFeatured ? "Bỏ chọn bài nổi bật" : article.status === 2 ? "Chọn làm bài nổi bật" : "Cần xuất bản trước khi chọn"}
                      >
                        {article.isFeatured ? "Đang nổi bật" : article.status === 2 ? "Chọn làm bài nổi bật" : "Cần xuất bản"}
                      </button>
                    </td>
                    <td>
                      <StatusDot
                        status={article.status === 2 ? "completed" : "new"}
                        label={article.status === 2 ? "Đã xuất bản" : "Bản nháp"}
                      />
                    </td>
                    <td data-metadata className="text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="admin-news-actions">
                        <Link
                          href={`/admin/news/${article.id}/edit`}
                          className="admin-news-action-icon p-2 min-h-[44px] min-w-[44px] text-slate-600 hover:text-slate-900 rounded flex items-center justify-center"
                          title="Chỉnh sửa"
                          aria-label={`Sửa bài ${article.title}`}
                        >
                          <IconEdit size={16} />
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(article)}
                          className={`admin-news-publish-action px-3 py-1.5 min-h-[44px] text-xs font-semibold rounded ${
                            article.status === 2
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {article.status === 2 ? "Gỡ xuất bản" : "Xuất bản"}
                        </button>

                        <button
                          onClick={() => handleDeleteArticle(article)}
                          className="admin-news-action-icon p-2 min-h-[44px] min-w-[44px] text-red-500 hover:text-red-700 rounded flex items-center justify-center"
                          title="Xóa"
                          aria-label={`Xóa bài ${article.title}`}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {articles.map(article => (
              <div key={article.id} className="admin-card space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="admin-news-article-copy min-w-0">
                    <h2
                      aria-label={article.title}
                      className="admin-news-article-title font-bold text-slate-900 text-sm"
                      data-full-text={article.title}
                      title={article.title}
                    >
                      {article.title}
                    </h2>
                    <p
                      aria-label={`/news/${article.slug}`}
                      className="admin-news-article-slug text-[11px] text-slate-500"
                      data-full-text={`/news/${article.slug}`}
                      title={`/news/${article.slug}`}
                    >
                      /news/{article.slug}
                    </p>
                  </div>
                  <StatusDot
                    status={article.status === 2 ? "completed" : "new"}
                    label={article.status === 2 ? "Đã xuất bản" : "Bản nháp"}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Danh mục: <strong>{article.categoryName}</strong></span>
                  <span>{new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleFeatured(article)}
                  disabled={!article.isFeatured && article.status !== 2}
                  aria-pressed={article.isFeatured}
                  className={`admin-button admin-button-sm w-full ${
                    article.isFeatured
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : article.status === 2
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  {article.isFeatured ? "Bỏ chọn bài nổi bật" : article.status === 2 ? "Chọn làm bài nổi bật" : "Xuất bản để chọn bài nổi bật"}
                </button>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/admin/news/${article.id}/edit`}
                    className="admin-button admin-button-secondary admin-button-sm flex-1"
                  >
                    <IconEdit size={16} /> Sửa
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(article)}
                    className={`admin-button admin-button-sm flex-1 ${
                      article.status === 2 ? "admin-button-secondary" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {article.status === 2 ? "Gỡ bài" : "Xuất bản"}
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article)}
                    className="admin-button admin-button-danger admin-button-sm"
                    aria-label={`Xóa ${article.title}`}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <SimplePagination
            page={articlePage}
            totalPages={articleTotalPages}
            onPageChange={setArticlePage}
          />
        </>
      )}

      {/* Category Management Drawer Modal */}
      {catDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-bold text-slate-900 text-sm">Quản lý danh mục bài viết</h2>
              <button onClick={() => setCatDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <IconX size={18} />
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded">
              <div className="font-semibold text-slate-800">Thêm danh mục mới</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Tên danh mục"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="admin-input"
                />
                <input
                  type="text"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="slug-danh-muc"
                  value={catSlug}
                  onChange={e => setCatSlug(e.target.value)}
                  className="admin-input"
                />
              </div>
              <input
                type="text"
                placeholder="Mô tả danh mục (không bắt buộc)"
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
                className="admin-input"
              />
              <button
                type="submit"
                disabled={catSaving}
                className="admin-button admin-button-primary admin-button-sm"
              >
                + Thêm danh mục
              </button>
            </form>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="font-semibold text-slate-800">Danh sách hiện tại:</div>
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 border border-slate-100 rounded">
                  <div>
                    <span className="font-medium text-slate-900">{cat.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">/{cat.slug}</span>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {cat.isActive ? "Đang hoạt động" : "Đã ẩn"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
