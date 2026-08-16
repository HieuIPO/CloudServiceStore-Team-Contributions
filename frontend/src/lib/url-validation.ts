import { isRouteAllowed } from "@/components/admin/admin-nav";

/**
 * Validate that a return-to path is a safe admin route.
 * Accepts only /admin or /admin/... paths.
 * Rejects /administrator, absolute URLs, protocol-relative //..., etc.
 */
export const isSafeAdminReturnTo = (path: string): boolean => {
  if (!path) return false;
  // Must be exactly /admin or start with /admin/
  if (path !== "/admin" && !path.startsWith("/admin/")) return false;
  // Reject protocol-relative URLs
  if (path.startsWith("//")) return false;
  // Reject absolute URLs that snuck through
  if (/^[a-zA-Z]+:/.test(path)) return false;
  return true;
};

export const getSafeReturnTo = (path: string): string => {
  return isSafeAdminReturnTo(path) ? path : "/admin/dashboard";
};

export const getSafeReturnToForUser = (path: string | null | undefined, userRoles: string[]): string => {
  const defaultRoute = userRoles.includes("Admin")
    ? "/admin/dashboard"
    : userRoles.includes("Editor")
    ? "/admin/workspace"
    : "/account";

  if (!path || !isSafeAdminReturnTo(path)) {
    return defaultRoute;
  }

  if (!isRouteAllowed(path, userRoles)) {
    return defaultRoute;
  }

  return path;
};

export const isSafeAccountReturnTo = (path: string): boolean => {
  if (!path || !path.startsWith("/account")) return false;
  if (path !== "/account" && !path.startsWith("/account/")) return false;
  if (path.startsWith("//") || /^[a-zA-Z]+:/.test(path)) return false;
  return true;
};

export const getSafeAccountReturnTo = (path: string | null | undefined): string =>
  path && isSafeAccountReturnTo(path) ? path : "/account";

export const isSafeCustomerReturnTo = (path: string): boolean => {
  if (!path || path.startsWith("//") || /^[a-zA-Z]+:/.test(path)) return false;
  return path === "/order" || path === "/affiliate" || isSafeAccountReturnTo(path);
};

export const getSafeCustomerReturnTo = (path: string | null | undefined): string =>
  path && isSafeCustomerReturnTo(path) ? path : "/account";
