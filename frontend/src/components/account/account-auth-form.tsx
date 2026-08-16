"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, authApi } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth-store";
import { getSafeCustomerReturnTo, getSafeReturnToForUser } from "@/lib/url-validation";
import { BrandLogo } from "@/components/brand-logo";

type AccountAuthFormProps = {
  mode: "login" | "register";
  returnTo?: string | null;
  shared?: boolean;
};

const passwordRequirements = [
  { id: "length", label: "Ít nhất 12 ký tự", matches: (password: string) => password.length >= 12 },
  { id: "case", label: "Có chữ hoa và chữ thường", matches: (password: string) => /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) },
  { id: "number", label: "Có ít nhất một chữ số", matches: (password: string) => /\p{Nd}/u.test(password) },
  { id: "special", label: "Có ít nhất một ký tự đặc biệt", matches: (password: string) => /[^\p{L}\p{N}]/u.test(password) },
];

const authErrorTranslations = [
  ["email and password are required", "Vui lòng nhập email và mật khẩu."],
  ["already registered", "Email này đã được đăng ký. Vui lòng dùng email khác."],
  ["already exists", "Email này đã được đăng ký. Vui lòng dùng email khác."],
  ["full name is required", "Vui lòng nhập họ và tên."],
  ["a valid email address is required", "Email không hợp lệ."],
  ["email is required", "Vui lòng nhập email."],
  ["password is required", "Vui lòng nhập mật khẩu."],
  ["password must contain at least 12 characters", "Mật khẩu phải có ít nhất 12 ký tự."],
  ["password must contain an uppercase letter", "Mật khẩu phải có ít nhất một chữ hoa."],
  ["password must contain a lowercase letter", "Mật khẩu phải có ít nhất một chữ thường."],
  ["password must contain a number", "Mật khẩu phải có ít nhất một chữ số."],
  ["password must contain a special character", "Mật khẩu phải có ít nhất một ký tự đặc biệt."],
  ["authentication failed", "Email hoặc mật khẩu không đúng."],
] as const;

function localizeAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();
  const translatedMessages = authErrorTranslations
    .filter(([source]) => normalizedMessage.includes(source))
    .map(([, translation]) => translation);

  return translatedMessages.length > 0
    ? [...new Set(translatedMessages)].join(" ")
    : message;
}

export function AccountAuthForm({ mode, returnTo, shared = false }: AccountAuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = isRegister
        ? await authApi.register(fullName, email, password)
        : await authApi.login(email, password);
      const roles = result.user.roles ?? [];

      if (isRegister) {
        if (!roles.includes("Customer")) {
          clearAccessToken();
          setError("Đăng ký tài khoản khách hàng không thành công. Vui lòng thử lại.");
          return;
        }

        router.push("/account");
        return;
      }

      if (shared && (roles.includes("Admin") || roles.includes("Editor"))) {
        router.push(getSafeReturnToForUser(returnTo, roles));
        return;
      }

      if (roles.includes("Customer")) {
        router.push(getSafeCustomerReturnTo(returnTo));
        return;
      }

      clearAccessToken();
      setError("Tài khoản không có quyền truy cập khu vực này.");
    } catch (reason) {
      setError(reason instanceof ApiError ? localizeAuthError(reason.message) : "Không thể kết nối API. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = isRegister ? "Tạo tài khoản khách hàng" : shared ? "Đăng nhập tài khoản" : "Đăng nhập khách hàng";
  const description = isRegister
    ? "Theo dõi các yêu cầu dịch vụ của bạn trong một nơi."
    : shared
      ? ""
      : "Xem trạng thái và thông tin các yêu cầu dịch vụ của bạn.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(16,36,90,0.08)] sm:p-8">
        <div className="text-center">
          <BrandLogo className="mx-auto max-w-[18rem]" variant="full" />
          <p className="mt-7 text-sm font-black text-blue-600">Tài khoản CloudServiceStore</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#10245a]">{title}</h1>
          {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700" role="alert">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {isRegister && (
            <label className="block text-sm font-bold text-slate-700" htmlFor="account-full-name">
              Họ và tên
              <input
                className="field mt-1 min-h-11 w-full"
                id="account-full-name"
                maxLength={160}
                onChange={event => setFullName(event.target.value)}
                required
                value={fullName}
              />
            </label>
          )}

          <label className="block text-sm font-bold text-slate-700" htmlFor="account-email">
            Email
            <input
              className="field mt-1 min-h-11 w-full"
              id="account-email"
              maxLength={256}
              onChange={event => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm font-bold text-slate-700" htmlFor="account-password">
            Mật khẩu
            <span className="relative mt-1 block">
              <input
                className="field min-h-11 w-full pr-20"
                id="account-password"
                onChange={event => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 text-sm font-bold text-blue-700 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={() => setShowPassword(value => !value)}
                type="button"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </span>
          </label>

          {isRegister && (
            <ul className="space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              {passwordRequirements.map(requirement => {
                const satisfied = requirement.matches(password);
                return (
                  <li className={satisfied ? "font-semibold text-green-600" : "text-slate-600"} key={requirement.id}>
                    <span aria-hidden="true">{satisfied ? "✓" : "•"}</span> {requirement.label}
                  </li>
                );
              })}
            </ul>
          )}

          <button className="min-h-11 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link className="font-bold text-blue-700 underline" href="/">
            Về trang chủ
          </Link>
          {isRegister ? (
            <span className="text-slate-600">
              Đã có tài khoản? <Link className="font-bold text-blue-700 underline" href="/login">Đăng nhập</Link>
            </span>
          ) : (
            <Link className="font-bold text-blue-700 underline" href="/account/register">
              Đăng ký tài khoản khách hàng
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
