"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  catalogApi,
  ApiError,
  type ServiceCategory,
  type ServicePlan,
  type ServicePlanDetail
} from "@/lib/api";
import {
  StatusDot,
  PageHeader,
  EmptyState,
  SkeletonLoader,
  SimplePagination
} from "./admin/admin-primitives";
import { AdminDialog } from "./admin/admin-dialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconBox,
  IconCirclePlus,
  IconTrashX,
  IconCheck,
  IconX,
  IconAlertCircle
} from "@tabler/icons-react";

type CategoryForm = { id?: string; name: string; slug: string; description: string; displayOrder: number; isActive: boolean };
type FeatureItem = { featureKey: string; displayName: string; value: string; unit: string; displayOrder: number };
type PlanForm = { id?: string; categoryId: string; name: string; slug: string; summary: string; isFeatured: boolean; isActive: boolean; features: FeatureItem[] };
type DeleteTarget =
  | { type: "category"; item: ServiceCategory }
  | { type: "plan"; item: ServicePlan }
  | null;
const PLAN_PAGE_SIZE = 10;

export function AdminCatalogClient() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categorySlugError, setCategorySlugError] = useState<string | null>(null);
  const [planSlugError, setPlanSlugError] = useState<string | null>(null);
  const [planPage, setPlanPage] = useState(1);
  const [planTotalPages, setPlanTotalPages] = useState(1);
  const [planTotalCount, setPlanTotalCount] = useState(0);

  // Category Drawer Modal
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [catForm, setCatForm] = useState<CategoryForm>({ name: "", slug: "", description: "", displayOrder: 0, isActive: true });
  const [catSaving, setCatSaving] = useState(false);

  // Plan Drawer Modal
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanForm>({
    categoryId: "",
    name: "",
    slug: "",
    summary: "",
    isFeatured: false,
    isActive: true,
    features: [
      { featureKey: "CPU", displayName: "CPU", value: "2", unit: "vCPU", displayOrder: 1 },
      { featureKey: "RAM", displayName: "RAM", value: "4", unit: "GB", displayOrder: 2 }
    ]
  });
  const [planSaving, setPlanSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const [catActive, catInactive, planResult] = await Promise.all([
        catalogApi.categories(true),
        catalogApi.categories(false),
        catalogApi.adminPlans(null, requestedPage, PLAN_PAGE_SIZE, true)
      ]);
      setCategories([...catActive.items, ...catInactive.items]);
      setPlans(planResult.items);
      setPlanPage(planResult.page);
      setPlanTotalPages(planResult.totalPages);
      setPlanTotalCount(planResult.totalCount);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Thao tác không thành công.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openNewCategory = () => {
    setCategorySlugError(null);
    setCatForm({ name: "", slug: "", description: "", displayOrder: 0, isActive: true });
    setCatDrawerOpen(true);
  };

  const openEditCategory = (cat: ServiceCategory) => {
    setCategorySlugError(null);
    setCatForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || "", displayOrder: cat.displayOrder, isActive: cat.isActive });
    setCatDrawerOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const duplicateCategorySlugMessage = "Slug này đã tồn tại. Vui lòng chọn slug khác cho danh mục.";
    const normalizedCategorySlug = catForm.slug.trim().toLowerCase();
    const categorySlugExists = categories.some(
      category => category.id !== catForm.id && category.slug.toLowerCase() === normalizedCategorySlug
    );
    if (categorySlugExists) {
      setCategorySlugError(duplicateCategorySlugMessage);
      setNotice(null);
      setError(duplicateCategorySlugMessage);
      return;
    }

    setCatSaving(true);
    setError(null);
    setNotice(null);
    setCategorySlugError(null);
    try {
      if (catForm.id) {
        await catalogApi.updateCategory(catForm.id, catForm);
        setNotice(`Đã cập nhật danh mục "${catForm.name}".`);
      } else {
        await catalogApi.createCategory(catForm);
        setNotice(`Đã tạo danh mục "${catForm.name}".`);
      }
      setCatDrawerOpen(false);
      await loadData(planPage);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && /slug/i.test(err.message)) {
        setCategorySlugError(duplicateCategorySlugMessage);
        setError(duplicateCategorySlugMessage);
      } else {
        setError(err instanceof ApiError ? err.message : "Lưu danh mục thất bại.");
      }
    } finally {
      setCatSaving(false);
    }
  };

  const requestDeleteCategory = (cat: ServiceCategory) => {
    setDeleteTarget({ type: "category", item: cat });
  };

  const requestDeletePlan = (plan: ServicePlan) => {
    setDeleteTarget({ type: "plan", item: plan });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      if (target.type === "category") {
        await catalogApi.deleteCategory(target.item.id);
        setNotice(`Đã xóa danh mục "${target.item.name}".`);
      } else {
        await catalogApi.deletePlan(target.item.id);
        setNotice(`Đã xóa gói dịch vụ "${target.item.name}".`);
      }
      setDeleteTarget(null);
      await loadData(planPage);
    } catch (err: unknown) {
      if (target.type === "category" && err instanceof ApiError && err.status === 409 && /service plan/i.test(err.message)) {
        const categoryDeleteMessage = "Không thể xóa danh mục vì vẫn còn gói dịch vụ. Hãy xóa hoặc chuyển các gói thuộc danh mục trước.";
        setError(categoryDeleteMessage);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : target.type === "category"
              ? "Xóa danh mục thất bại."
              : "Xóa gói dịch vụ thất bại."
        );
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openNewPlan = () => {
    if (!categories.length) {
      setNotice(null);
      setError("Vui lòng tạo ít nhất 1 danh mục trước khi tạo gói dịch vụ.");
      return;
    }
    setPlanSlugError(null);
    setPlanForm({
      categoryId: categories[0].id,
      name: "",
      slug: "",
      summary: "",
      isFeatured: false,
      isActive: true,
      features: [
        { featureKey: "CPU", displayName: "CPU", value: "2", unit: "vCPU", displayOrder: 1 },
        { featureKey: "RAM", displayName: "RAM", value: "4", unit: "GB", displayOrder: 2 }
      ]
    });
    setPlanDrawerOpen(true);
  };

  const openEditPlan = async (plan: ServicePlan) => {
    setLoading(true);
    setPlanSlugError(null);
    try {
      const detail: ServicePlanDetail = await catalogApi.plan(plan.id);
      setPlanForm({
        id: detail.id,
        categoryId: detail.categoryId,
        name: detail.name,
        slug: detail.slug,
        summary: detail.summary,
        isFeatured: detail.isFeatured,
        isActive: detail.isActive,
        features: detail.features.map(f => ({
          featureKey: f.featureKey,
          displayName: f.displayName,
          value: f.value,
          unit: f.unit || "",
          displayOrder: f.displayOrder
        }))
      });
      setPlanDrawerOpen(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể nạp chi tiết gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSaving(true);
    setError(null);
    setNotice(null);
    setPlanSlugError(null);
    try {
      const body = {
        categoryId: planForm.categoryId,
        name: planForm.name.trim(),
        slug: planForm.slug.trim(),
        summary: planForm.summary.trim(),
        isFeatured: planForm.isFeatured,
        isActive: planForm.isActive,
        features: planForm.features.map((f, idx) => ({
          featureKey: f.featureKey.trim() || f.displayName.trim(),
          displayName: f.displayName.trim(),
          value: f.value.trim(),
          unit: f.unit.trim() || null,
          displayOrder: idx + 1
        }))
      };

      if (planForm.id) {
        await catalogApi.updatePlan(planForm.id, body);
        setNotice(`Đã cập nhật gói "${planForm.name}".`);
      } else {
        await catalogApi.createPlan(body);
        setNotice(`Đã tạo gói mới "${planForm.name}".`);
      }
      setPlanDrawerOpen(false);
      await loadData(planPage);
    } catch (err: unknown) {
      const duplicateSlugMessage = "Slug này đã tồn tại. Vui lòng chọn slug khác cho gói dịch vụ.";
      if (err instanceof ApiError && err.status === 409 && /slug/i.test(err.message)) {
        setPlanSlugError(duplicateSlugMessage);
        setError(duplicateSlugMessage);
      } else {
        setError(err instanceof ApiError ? err.message : "Lưu gói dịch vụ thất bại.");
      }
    } finally {
      setPlanSaving(false);
    }
  };

  const addFeatureRow = () => {
    setPlanForm({
      ...planForm,
      features: [
        ...planForm.features,
        { featureKey: "", displayName: "", value: "", unit: "", displayOrder: planForm.features.length + 1 }
      ]
    });
  };

  const removeFeatureRow = (index: number) => {
    const updated = planForm.features.filter((_, i) => i !== index);
    setPlanForm({ ...planForm, features: updated });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Danh mục & Gói dịch vụ"
        description="Định nghĩa cấu hình danh mục hạ tầng, gói dịch vụ và các tính năng chi tiết."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={openNewCategory} className="admin-button admin-button-secondary admin-button-sm">
              <IconPlus size={16} /> Tạo danh mục mới
            </button>
            <button onClick={openNewPlan} className="admin-button admin-button-primary admin-button-sm">
              <IconPlus size={16} /> Tạo gói dịch vụ mới
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void loadData(planPage)}
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

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List Column */}
          <div className="admin-card space-y-3 self-start">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <IconCategory size={16} /> Danh mục dịch vụ ({categories.length})
              </h2>
            </div>

            {categories.length === 0 ? (
              <EmptyState title="Chưa có danh mục" />
            ) : (
              <div className="divide-y border border-slate-100 rounded">
                {categories.map(cat => (
                  <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-400">/{cat.slug}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1 text-slate-500 hover:text-slate-900"
                        title="Sửa danh mục"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => requestDeleteCategory(cat)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Xóa danh mục"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Plans List Column */}
          <div className="lg:col-span-2 admin-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <IconBox size={16} /> Danh sách gói dịch vụ ({planTotalCount})
              </h2>
              {planTotalCount > 0 && (
                <span className="text-[11px] text-slate-500">
                  Trang {planPage}/{planTotalPages}
                </span>
              )}
            </div>

            {plans.length === 0 ? (
              <EmptyState title="Chưa có gói dịch vụ nào" />
            ) : (
              <>
                <div className="hidden md:block admin-table-container">
                  <table className="admin-table admin-catalog-table">
                    <thead>
                      <tr>
                        <th>Tên gói dịch vụ</th>
                        <th>Danh mục</th>
                        <th>Trạng thái</th>
                        <th>Nổi bật</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map(plan => (
                        <tr key={plan.id}>
                          <td className="admin-catalog-plan-cell">
                            <div className="admin-catalog-plan-name font-semibold text-slate-900" title={plan.name}>
                              {plan.name}
                            </div>
                            <div className="admin-catalog-plan-summary text-[11px] text-slate-500" title={plan.summary}>
                              {plan.summary}
                            </div>
                          </td>
                          <td className="admin-catalog-category-cell">
                            <span className="admin-catalog-category font-medium text-slate-700" title={plan.categoryName}>
                              {plan.categoryName}
                            </span>
                          </td>
                          <td className="admin-catalog-status-cell">
                            <StatusDot
                              status={plan.isActive ? "completed" : "cancelled"}
                              label={plan.isActive ? "Đang bật" : "Đã tắt"}
                            />
                          </td>
                          <td>
                            {plan.isFeatured ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded">
                                Featured
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="admin-catalog-actions-cell text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditPlan(plan)}
                                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded"
                                title="Chỉnh sửa gói"
                                aria-label={`Chỉnh sửa gói ${plan.name}`}
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeletePlan(plan)}
                                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 rounded"
                                title="Xóa gói"
                                aria-label={`Xóa gói ${plan.name}`}
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

                {/* Mobile Card View (<768px) */}
                <div className="block md:hidden space-y-3">
                  {plans.map(plan => (
                    <div
                      key={plan.id}
                      className="p-4 bg-white rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="admin-catalog-mobile-name min-w-0 flex-1 font-bold text-slate-900 text-sm truncate" title={plan.name}>
                          {plan.name}
                        </span>
                        <StatusDot
                          status={plan.isActive ? "completed" : "cancelled"}
                          label={plan.isActive ? "Đang bật" : "Đã tắt"}
                        />
                      </div>
                      <div className="min-w-0 text-xs text-slate-500">
                        Danh mục: <span className="admin-catalog-mobile-category font-medium text-slate-700" title={plan.categoryName}>{plan.categoryName}</span>
                      </div>
                      <p className="admin-catalog-mobile-summary text-xs text-slate-600 line-clamp-2" title={plan.summary}>{plan.summary}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {plan.isFeatured ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded">
                            Featured
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPlan(plan)}
                            className="px-3 py-1.5 min-h-[44px] text-xs font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center gap-1"
                            aria-label={`Chỉnh sửa gói ${plan.name}`}
                          >
                            <IconEdit size={14} /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeletePlan(plan)}
                            className="px-3 py-1.5 min-h-[44px] text-xs font-semibold bg-rose-50 text-rose-700 rounded hover:bg-rose-100 flex items-center gap-1"
                            aria-label={`Xóa gói ${plan.name}`}
                          >
                            <IconTrash size={14} /> Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <SimplePagination
                  page={planPage}
                  totalPages={planTotalPages}
                  onPageChange={page => void loadData(page)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Category Modal Drawer */}
      <AdminDialog
        isOpen={catDrawerOpen}
        onClose={() => setCatDrawerOpen(false)}
        title={catForm.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
      >
        <form onSubmit={handleSaveCategory} className="space-y-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Tên danh mục *</label>
            <input
              type="text"
              required
              value={catForm.name}
              onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Slug *</label>
            <input
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={catForm.slug}
              onChange={e => {
                setCategorySlugError(null);
                setCatForm({ ...catForm, slug: e.target.value });
              }}
              aria-invalid={Boolean(categorySlugError)}
              aria-describedby={categorySlugError ? "category-slug-error" : undefined}
              className={`admin-input ${categorySlugError ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
            />
            {categorySlugError && (
              <p id="category-slug-error" className="mt-1 text-xs text-red-600" role="alert">
                {categorySlugError}
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Mô tả ngắn</label>
            <textarea
              rows={2}
              value={catForm.description}
              onChange={e => setCatForm({ ...catForm, description: e.target.value })}
              className="admin-textarea"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCatDrawerOpen(false)}
              className="admin-button admin-button-secondary admin-button-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={catSaving}
              className="admin-button admin-button-primary admin-button-sm"
            >
              {catSaving ? "Đang lưu..." : "Lưu danh mục"}
            </button>
          </div>
        </form>
      </AdminDialog>

      {/* Plan Modal Drawer */}
      <AdminDialog
        isOpen={planDrawerOpen}
        onClose={() => setPlanDrawerOpen(false)}
        title={planForm.id ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Danh mục *</label>
              <select
                value={planForm.categoryId}
                onChange={e => setPlanForm({ ...planForm, categoryId: e.target.value })}
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
              <label className="block font-medium text-slate-700 mb-1">Tên gói dịch vụ *</label>
              <input
                type="text"
                required
                value={planForm.name}
                onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>

          <div>
              <label htmlFor="plan-slug" className="block font-medium text-slate-700 mb-1">Slug *</label>
              <input
                id="plan-slug"
                type="text"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={planForm.slug}
                onChange={e => {
                  setPlanSlugError(null);
                  setPlanForm({ ...planForm, slug: e.target.value });
                }}
                aria-invalid={Boolean(planSlugError)}
                aria-describedby={planSlugError ? "plan-slug-error" : undefined}
                className={`admin-input ${planSlugError ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
              />
              {planSlugError && (
                <p id="plan-slug-error" className="mt-1 text-xs text-red-600" role="alert">
                  {planSlugError}
                </p>
              )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tóm tắt ngắn *</label>
            <textarea
              rows={2}
              required
              value={planForm.summary}
              onChange={e => setPlanForm({ ...planForm, summary: e.target.value })}
              className="admin-textarea"
            />
          </div>

          {/* Feature Structured Rows */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">Danh sách tính năng (Features)</label>
              <button
                type="button"
                onClick={addFeatureRow}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-[11px]"
              >
                <IconCirclePlus size={14} /> Thêm tính năng
              </button>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_6rem_2.75rem] gap-2 px-2 text-[11px] font-semibold text-slate-500">
              <span>Mã tính năng</span>
              <span>Tên hiển thị</span>
              <span>Giá trị</span>
              <span>Đơn vị</span>
              <span aria-hidden="true" />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {planForm.features.map((feat, idx) => (
                <div key={idx} className="grid grid-cols-1 items-center gap-2 p-2 border border-slate-100 bg-slate-50 rounded sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_6rem_2.75rem]">
                  <input
                    type="text"
                    required
                    placeholder="Key (ví dụ: RAM)"
                    aria-label={`Feature key ${idx + 1}`}
                    value={feat.featureKey}
                    onChange={e => {
                      const updated = [...planForm.features];
                      updated[idx].featureKey = e.target.value;
                      setPlanForm({ ...planForm, features: updated });
                    }}
                    className="admin-input !py-1 text-xs min-w-0"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Tên hiển thị"
                    aria-label={`Feature display name ${idx + 1}`}
                    value={feat.displayName}
                    onChange={e => {
                      const updated = [...planForm.features];
                      updated[idx].displayName = e.target.value;
                      setPlanForm({ ...planForm, features: updated });
                    }}
                    className="admin-input !py-1 text-xs min-w-0"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Giá trị"
                    value={feat.value}
                    onChange={e => {
                      const updated = [...planForm.features];
                      updated[idx].value = e.target.value;
                      setPlanForm({ ...planForm, features: updated });
                    }}
                    className="admin-input !py-1 text-xs min-w-0"
                  />
                  <input
                    type="text"
                    placeholder="Đơn vị"
                    value={feat.unit}
                    onChange={e => {
                      const updated = [...planForm.features];
                      updated[idx].unit = e.target.value;
                      setPlanForm({ ...planForm, features: updated });
                    }}
                    className="admin-input !py-1 text-xs min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeatureRow(idx)}
                    className="text-red-500 hover:text-red-700 p-1 justify-self-center"
                  >
                    <IconTrashX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={planForm.isFeatured}
                onChange={e => setPlanForm({ ...planForm, isFeatured: e.target.checked })}
                className="rounded border-slate-300"
              />
              Gói dịch vụ nổi bật
            </label>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })}
                className="rounded border-slate-300"
              />
              Kích hoạt hoạt động
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPlanDrawerOpen(false)}
              className="admin-button admin-button-secondary admin-button-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={planSaving}
              className="admin-button admin-button-primary admin-button-sm"
            >
              {planSaving ? "Đang lưu..." : "Lưu gói dịch vụ"}
            </button>
          </div>
        </form>
      </AdminDialog>

      {/* Delete Confirmation Dialog */}
      <AdminDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={deleteTarget?.type === "category" ? "Xóa danh mục" : "Xóa gói dịch vụ"}
        description="Kiểm tra lại thông tin trước khi xác nhận thao tác."
        isSubmitting={deleting}
      >
        {deleteTarget && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Bạn có chắc chắn muốn xóa {deleteTarget.type === "category" ? "danh mục" : "gói dịch vụ"}{" "}
              <strong className="text-slate-900">“{deleteTarget.item.name}”</strong>?
            </p>
            {deleteTarget.type === "category" && (
              <p className="text-slate-500">
                Danh mục chỉ xóa được khi không còn gói dịch vụ thuộc danh mục này.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
