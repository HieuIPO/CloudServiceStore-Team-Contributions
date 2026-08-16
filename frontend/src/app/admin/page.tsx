"use client";

import { useAdminSession } from "@/components/admin/admin-session-provider";
import { SkeletonLoader } from "@/components/admin/admin-primitives";

export default function AdminRootPage() {
  const { status } = useAdminSession();

  return (
    <div className="p-8 max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center">
      <SkeletonLoader rows={4} />
      <p className="text-xs text-slate-400 text-center mt-4">
        {status === "loading" ? "Đang xác thực phiên..." : "Đang điều hướng..."}
      </p>
    </div>
  );
}
