"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="m-0 bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
          <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">CloudServiceStore</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Không thể tải trang</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Đã xảy ra lỗi không mong muốn. Bạn có thể thử tải lại trang; nếu lỗi tiếp diễn, vui lòng liên hệ quản trị viên.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Thử lại
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
