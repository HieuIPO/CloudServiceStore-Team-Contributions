import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CustomerHeaderActions } from "@/components/customer-header-actions";

const navigation = [
  { href: "/about", label: "Giới thiệu" }, { href: "/services", label: "Dịch vụ" }, { href: "/pricing", label: "Bảng giá" },
  { href: "/customers", label: "Khách hàng" }, { href: "/news", label: "Tin tức" }, { href: "/affiliate", label: "Affiliate" },
  { href: "/order", label: "Yêu cầu dịch vụ" }, { href: "/contact", label: "Liên hệ" },
];

export function SiteHeader({ overlay = false, activeHref }: { overlay?: boolean; activeHref?: string }) {
  return <header className={overlay ? "absolute inset-x-0 top-0 z-40 border-b border-white/70 bg-white/42 backdrop-blur-md" : "relative z-40 border-b border-slate-200 bg-white"}>
    <div className="shell flex min-h-16 items-center justify-between gap-4 py-3">
      <Link aria-label="CloudServiceStore - Trang chủ" className="min-w-0 shrink" href="/"><BrandLogo /></Link>
      <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 text-[15px] font-bold text-slate-900 xl:flex">{navigation.map(item => <SiteNavLink activeHref={activeHref} href={item.href} key={item.href} label={item.label} />)}</nav>
      <div className="hidden items-center gap-3 xl:flex"><Link aria-label="Hỗ trợ" className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-200 text-[#10245a] transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href="/contact"><HeadsetIcon /></Link><div aria-label="Tài khoản người dùng. Đăng nhập hoặc mở menu tài khoản"><CustomerHeaderActions /></div></div>
      <details className="site-mobile-menu group relative xl:hidden"><summary aria-label="Menu điều hướng" className="site-mobile-menu__trigger flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 marker:content-none"><span>Menu</span><svg aria-hidden="true" className="site-mobile-menu__trigger-arrow transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></summary>
        <nav aria-label="Điều hướng trên di động" className="site-mobile-menu__panel"><span aria-hidden="true" className="site-mobile-menu__eyebrow">Điều hướng</span><div className="site-mobile-menu__links">{navigation.map(item => <Link aria-current={item.href === activeHref ? "page" : undefined} className={item.href === activeHref ? "site-mobile-menu__link site-mobile-menu__link--active" : "site-mobile-menu__link"} href={item.href} key={item.href}>{item.label}</Link>)}</div><Link aria-label="Hỗ trợ" className="site-mobile-menu__support" href="/contact"><HeadsetIcon />Hỗ trợ</Link><div aria-label="Tài khoản người dùng. Đăng nhập hoặc mở menu tài khoản" className="site-mobile-menu__account"><CustomerHeaderActions mobile /></div></nav>
      </details>
    </div>
  </header>;
}

function SiteNavLink({ activeHref, href, label }: { activeHref?: string; href: string; label: string }) {
  if (href === activeHref) return <Link aria-current="page" className="relative inline-flex min-h-11 items-center px-3 text-blue-600 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-blue-600" href={href}>{label}</Link>;
  return <Link className="inline-flex min-h-11 items-center px-3 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" href={href}>{label}</Link>;
}
function HeadsetIcon() { return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1m-16 0a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3Zm16 0a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3ZM15 20h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>; }
