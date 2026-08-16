import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const navigation = [
  { href: "/about", label: "Giới thiệu" },
  { href: "/services", label: "Dịch vụ" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/news", label: "Tin tức" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/order", label: "Yêu cầu dịch vụ" },
];

const supportLinks: Array<{ href?: string; label: string }> = [
  { href: "/order", label: "Liên hệ" },
  { href: "/affiliate#affiliate-faq-title", label: "Câu hỏi thường gặp" },
  { label: "Chính sách bảo mật" },
  { label: "Điều khoản sử dụng" },
];

const socialLinks = [
  { label: "Facebook", kind: "facebook" as const },
  { label: "Website", kind: "website" as const },
  { label: "LinkedIn", kind: "linkedin" as const },
  { label: "GitHub", kind: "github" as const },
];

export function SiteFooter() {
  return (
    <footer aria-labelledby="site-footer-title" className="site-footer">
      <div className="shell site-footer__shell">
        <div className="site-footer__surface">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <Link aria-label="CloudServiceStore - Trang chủ" className="site-footer__brand-link" href="/">
                <BrandLogo />
              </Link>
              <p id="site-footer-title" className="site-footer__description">
                CloudServiceStore cung cấp các dịch vụ Cloud, VPS, Hosting và giải pháp bảo mật tin cậy, hiệu suất cao cho cá nhân và doanh nghiệp.
              </p>
            </div>

            <FooterLinkGroup id="footer-navigation" links={navigation} title="Điều hướng" />
            <FooterLinkGroup id="footer-support" links={supportLinks} title="Hỗ trợ" />

            <div className="site-footer__social">
              <h2 className="site-footer__heading">Kết nối với chúng tôi</h2>
              <div aria-label="Các kênh kết nối" className="site-footer__social-links" role="list">
                {socialLinks.map(item => (
                  <span aria-label={item.label} className="site-footer__social-icon" key={item.kind} role="img">
                    <SocialIcon kind={item.kind} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="site-footer__bottom">
            <span>© {new Date().getFullYear()} CloudServiceStore. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ id, links, title }: { id: string; links: Array<{ href?: string; label: string }>; title: string }) {
  return (
    <>
      <nav aria-labelledby={`${id}-desktop-title`} className="site-footer__section site-footer__section--desktop">
        <h2 className="site-footer__heading" id={`${id}-desktop-title`}>{title}</h2>
        <div className="site-footer__links">
          <FooterLinks links={links} />
        </div>
      </nav>

      <details className="site-footer__section site-footer__section--mobile">
        <summary>
          <h2 className="site-footer__heading">{title}</h2>
        </summary>
        <div className="site-footer__links">
          <FooterLinks links={links} />
        </div>
      </details>
    </>
  );
}

function FooterLinks({ links }: { links: Array<{ href?: string; label: string }> }) {
  return links.map(link => link.href ? (
    <Link className="site-footer__link" href={link.href} key={link.label}>{link.label}</Link>
  ) : (
    <span className="site-footer__link site-footer__link--muted" key={link.label}>{link.label}</span>
  ));
}

function SocialIcon({ kind }: { kind: "facebook" | "website" | "linkedin" | "github" }) {
  if (kind === "facebook") return <span aria-hidden="true" className="site-footer__social-letter">f</span>;
  if (kind === "linkedin") return <span aria-hidden="true" className="site-footer__social-letter site-footer__social-letter--in">in</span>;
  if (kind === "website") {
    return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5c-2.1-2.3-3.2-5.1-3.2-8.5S9.9 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.5" /></svg>;
  }
  return <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.48.09.65-.21.65-.46v-1.7c-2.65.58-3.2-1.12-3.2-1.12-.44-1.1-1.06-1.39-1.06-1.39-.87-.6.07-.59.07-.59.96.07 1.47.99 1.47.99.85 1.47 2.23 1.05 2.77.8.09-.62.33-1.05.6-1.29-2.11-.24-4.33-1.06-4.33-4.7 0-1.04.37-1.89.98-2.55-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.97a9.07 9.07 0 0 1 4.76 0c1.82-1.23 2.62-.97 2.62-.97.52 1.31.19 2.28.09 2.52.61.66.98 1.51.98 2.55 0 3.65-2.22 4.45-4.34 4.69.34.29.65.86.65 1.74v2.57c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg>;
}
