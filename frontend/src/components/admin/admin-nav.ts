import {
  IconLayoutDashboard,
  IconBriefcase,
  IconShoppingCart,
  IconUsers,
  IconNews,
  IconCategory,
  IconCurrencyDollar,
  IconTag,
  IconAppWindow,
  IconFileSpreadsheet,
  IconHistory,
  IconMessageCircle
} from "@tabler/icons-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: typeof IconLayoutDashboard;
  roles: Array<"Admin" | "Editor">;
};

export type AdminNavGroup = {
  groupName: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    groupName: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: IconLayoutDashboard,
        roles: ["Admin"],
      }
    ]
  },
  {
    groupName: "Vận hành",
    items: [
      {
        title: "Workspace",
        href: "/admin/workspace",
        icon: IconBriefcase,
        roles: ["Admin", "Editor"],
      },
      {
        title: "Yêu cầu dịch vụ",
        href: "/admin/orders",
        icon: IconShoppingCart,
        roles: ["Admin", "Editor"],
      },
      {
        title: "Hồ sơ Affiliate",
        href: "/admin/affiliates",
        icon: IconUsers,
        roles: ["Admin", "Editor"],
      },
      {
        title: "Yêu cầu liên hệ",
        href: "/admin/contact-requests",
        icon: IconMessageCircle,
        roles: ["Admin", "Editor"],
      }
    ]
  },
  {
    groupName: "Nội dung",
    items: [
      {
        title: "Bài viết & Tin tức",
        href: "/admin/news",
        icon: IconNews,
        roles: ["Admin", "Editor"],
      },
      {
        title: "Landing Page",
        href: "/admin/landing",
        icon: IconAppWindow,
        roles: ["Admin"],
      }
    ]
  },
  {
    groupName: "Dịch vụ",
    items: [
      {
        title: "Danh mục & Gói",
        href: "/admin/catalog",
        icon: IconCategory,
        roles: ["Admin"],
      },
      {
        title: "Bảng giá",
        href: "/admin/pricing",
        icon: IconCurrencyDollar,
        roles: ["Admin"],
      },
      {
        title: "Khuyến mãi & QR",
        href: "/admin/promotions",
        icon: IconTag,
        roles: ["Admin"],
      }
    ]
  },
  {
    groupName: "Báo cáo",
    items: [
      {
        title: "Báo cáo Excel",
        href: "/admin/exports",
        icon: IconFileSpreadsheet,
        roles: ["Admin"],
      },
      {
        title: "Nhật ký hoạt động",
        href: "/admin/audit-logs",
        icon: IconHistory,
        roles: ["Admin"],
      }
    ]
  }
];

export const allNavItems: AdminNavItem[] = adminNavGroups.flatMap(g => g.items);

export const getNavGroupsForUser = (userRoles: string[]): AdminNavGroup[] => {
  return adminNavGroups
    .map(g => ({
      groupName: g.groupName,
      items: g.items.filter(item => item.roles.some(r => userRoles.includes(r)))
    }))
    .filter(g => g.items.length > 0);
};

export const isRouteAllowed = (pathname: string, userRoles: string[]): boolean => {
  const route = new URL(pathname, "http://admin.local");
  const normalizedPath = route.pathname;

  // The program tab shares the affiliate page shell but is Admin-only.
  if (normalizedPath === "/admin/affiliates" && route.searchParams.get("tab") === "program") {
    return userRoles.includes("Admin");
  }

  // The personal profile is opened from the account menu instead of the sidebar.
  if (normalizedPath === "/admin/profile") {
    return userRoles.some(role => role === "Admin" || role === "Editor");
  }

  // Sort items by longest href first for most specific route matching
  const sortedItems = [...allNavItems].sort((a, b) => b.href.length - a.href.length);
  const matchedItem = sortedItems.find(item => normalizedPath === item.href || normalizedPath.startsWith(item.href + "/"));

  // /admin is the redirect entry point; every other unknown admin route is denied
  // by default so an Editor cannot reach a future or mistyped Admin page.
  if (!matchedItem) return normalizedPath === "/admin" || normalizedPath === "/admin/";
  return matchedItem.roles.some(r => userRoles.includes(r));
};
