import { SiteHeader } from "@/components/site-header";

export function ServiceCatalogHeader({ activeHref = "/services" }: { activeHref?: string }) {
  return <SiteHeader activeHref={activeHref} />;
}
