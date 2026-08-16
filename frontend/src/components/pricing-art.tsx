import Image from "next/image";

export function PricingHeroArt() {
  return (
    <div aria-hidden="true" className="pricing-hero-art pointer-events-none relative h-full w-full">
      <div className="pricing-hero-art-glow absolute right-[8%] top-1/2 h-52 w-52 -translate-y-1/2 rounded-full" />
      <Image alt="" className="absolute right-0 top-1/2 h-[10rem] w-[10rem] -translate-y-1/2 object-contain lg:h-[10.5rem] lg:w-[10.5rem]" height={716} priority sizes="14vw" src="/assets/pricing/pricing-hero-3d-alpha.png" width={716} />
    </div>
  );
}

export function PricingPlanIcon({ enterprise = false, variant = "vps" }: { enterprise?: boolean; variant?: "vps" | "cloud" | "enterprise" }) {
  const source = enterprise || variant === "enterprise"
    ? "/assets/pricing/pricing-enterprise-3d-alpha.png"
    : variant === "cloud"
      ? "/assets/pricing/pricing-cloud-server-3d-alpha.png"
      : "/assets/pricing/pricing-vps-3d-alpha.png";
  return <span className="relative block h-full w-full"><Image alt="" aria-hidden="true" className="object-contain" fill sizes="96px" src={source} /></span>;
}

export function GiftIcon() {
  return <Image alt="" aria-hidden="true" className="h-12 w-12 object-contain" height={128} src="/assets/pricing/pricing-gift-3d-alpha.png" width={128} />;
}

export function CalendarIcon() {
  return <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24"><rect height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="17" x="3.5" y="5.5" /><path d="M7 3.5v4M17 3.5v4M3.5 10h17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M8 14h3m2 0h3m-8 3h3m2 0h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>;
}

export function DocumentIcon() {
  return <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20.5H6z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg>;
}

export function TrendIcon() {
  return <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24"><path d="M4 18 10 12l4 3 6-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M15.5 7H20v4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export function FeatureIcon({ label }: { label: string }) {
  const icon = label.toLocaleLowerCase("vi-VN");
  const kind = icon === "cpu" ? "cpu" : icon === "ram" ? "ram" : icon.includes("ssd") ? "ssd" : icon.includes("băng") ? "bandwidth" : icon.includes("ip") ? "ip" : icon.includes("backup") ? "backup" : icon.includes("hỗ trợ") ? "support" : "generic";
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24">
      {kind === "cpu" && <><rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="6" /><path d="M9 9h6v6H9zM9 2v4m6-4v4m-6 12v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></>}
      {kind === "ram" && <><rect height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="17" x="3.5" y="8" /><path d="M7 11h2m3 0h2m3 0h2M6 16v3m4-3v3m4-3v3m4-3v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></>}
      {kind === "ssd" && <><rect height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="3.5" /><circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" /><path d="M9 15h6M9 18h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></>}
      {kind === "bandwidth" && <><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3.8 12h16.4M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.5" /></>}
      {kind === "ip" && <><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3.8 12h16.4M12 3.5v17M7.2 6.4c1.4 1.1 3 1.7 4.8 1.7s3.4-.6 4.8-1.7M7.2 17.6c1.4-1.1 3-1.7 4.8-1.7s3.4.6 4.8 1.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></>}
      {kind === "backup" && <><path d="M5 16.5c0-3.5 2.7-6.2 6.1-6.2.9 0 1.7.2 2.5.5C14.4 8.3 16.5 7 19 7c3.1 0 5.5 2.4 5.5 5.5 0 .4 0 .8-.1 1.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" transform="translate(-2 -1)" /><path d="m12 20 3-3m-3 3-3-3m3 3v-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></>}
      {kind === "support" && <><path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M4 13h2v5H4a2 2 0 0 1 0-4Zm16 0h-2v5h2a2 2 0 0 0 0-4ZM12 20h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></>}
      {kind === "generic" && <><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v5m0-8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></>}
    </svg>
  );
}
