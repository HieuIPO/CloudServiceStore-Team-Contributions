import type { ReactNode } from "react";

type PublicPageBannerProps = {
  actions?: ReactNode;
  art?: ReactNode;
  artClassName?: string;
  breadcrumb?: ReactNode;
  contentClassName?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  extra?: ReactNode;
  networkClassName?: string;
  title: ReactNode;
};

export function PublicPageBanner({ actions, art, artClassName = "", contentClassName = "", description, eyebrow, extra, networkClassName = "", title }: PublicPageBannerProps) {
  const contentClasses = ["public-page-banner-content relative z-10 pt-1 sm:pt-0", contentClassName].filter(Boolean).join(" ");
  const artClasses = ["public-page-banner-art pointer-events-none absolute bottom-0 right-0 hidden h-full w-[48%] sm:block lg:w-[56%]", artClassName].filter(Boolean).join(" ");
  const networkClasses = ["public-page-network absolute inset-0", networkClassName].filter(Boolean).join(" ");

  return (
    <section className="public-page-banner relative overflow-hidden border-b border-blue-100 bg-[linear-gradient(105deg,#f8fcff_0%,#eef7ff_57%,#e2f0ff_100%)]">
      <div aria-hidden="true" className={networkClasses} />
      <div className="shell relative flex min-h-[17rem] items-center py-7 sm:min-h-[12rem] lg:min-h-[18rem] lg:py-8">
        <div className="relative z-10 w-full sm:max-w-[56%] lg:max-w-[64%]">
          <div className={contentClasses}>
            {eyebrow && <p className="text-sm font-black text-blue-600">{eyebrow}</p>}
            <h1 className={`${eyebrow ? "mt-3" : "mt-0"} max-w-2xl text-2xl font-black leading-[1.12] tracking-[-.045em] text-[#10245a] sm:text-3xl lg:text-4xl`}>{title}</h1>
            {description && <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 lg:text-lg lg:leading-7">{description}</p>}
            {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
          </div>
          {extra && <div className="relative z-10 mt-5">{extra}</div>}
        </div>
        {art && <div className={artClasses}>{art}</div>}
      </div>
    </section>
  );
}
