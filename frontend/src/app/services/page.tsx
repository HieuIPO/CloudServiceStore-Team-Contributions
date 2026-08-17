import type { Metadata } from "next";
import { PublicServiceCatalog } from "@/components/public-service-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
export const metadata: Metadata = { title: "Dịch vụ Cloud", description: "Các gói VPS, Hosting và dịch vụ Cloud." };
export default function ServicesPage() { return <><SiteHeader activeHref="/services" /><PublicServiceCatalog /><SiteFooter /></>; }
