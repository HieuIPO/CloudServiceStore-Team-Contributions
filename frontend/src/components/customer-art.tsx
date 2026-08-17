export type CustomerIconKind = "server" | "mail" | "cloud" | "ssl" | "link" | "support";

export function CustomerHeroArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 620 330">
    <path d="M70 282h500" stroke="#b8d8fb" strokeDasharray="6 8" strokeWidth="2" /><path d="m107 256 117-77 108 34 126-83" stroke="#9bcbf7" strokeWidth="2" />
    <path d="M256 94c-6-35 20-65 56-65 24 0 44 14 53 35 7-4 15-6 23-6 25 0 45 20 45 45s-20 45-45 45H296c-22 0-40-17-40-39v-15Z" fill="#a8d2fb" stroke="#5ca0ed" strokeWidth="3" />
    <path d="M278 93c9-16 25-26 44-26 20 0 37 11 46 28 7-7 16-11 27-11" stroke="#fff" strokeLinecap="round" strokeWidth="6" />
    <g><path d="M184 158h205v100H184z" fill="#d7eaff" stroke="#398ae9" strokeWidth="3" /><path d="M184 158h205l-35-28H149z" fill="#eef7ff" stroke="#398ae9" strokeWidth="3" /><path d="M184 158v100l-35-28V130z" fill="#c3defb" stroke="#398ae9" strokeWidth="3" /><path d="M214 185h142M214 207h105M214 229h127" stroke="#2678df" strokeWidth="7" /><circle cx="201" cy="185" r="4" fill="#1d66d5" /><circle cx="201" cy="207" r="4" fill="#1d66d5" /><circle cx="201" cy="229" r="4" fill="#1d66d5" /></g>
    <g><circle cx="155" cy="199" fill="#e6f3ff" r="25" stroke="#4a99ed" strokeWidth="3" /><path d="M145 198c0-10 8-18 18-18 7 0 13 4 16 10" stroke="#297de4" strokeLinecap="round" strokeWidth="4" /><path d="M134 245c2-24 11-36 27-36 17 0 26 12 28 36" fill="#4a8fdc" /><path d="M145 214c6 9 14 13 23 0" stroke="#fff" strokeWidth="3" /></g>
    <g><circle cx="407" cy="218" fill="#e6f3ff" r="25" stroke="#4a99ed" strokeWidth="3" /><path d="M389 246c3-23 12-35 28-35 16 0 25 12 28 35" fill="#2e78d7" /><path d="M397 218c6 8 14 13 23 0" stroke="#fff" strokeWidth="3" /><path d="M419 197c7 2 12 7 14 13" stroke="#297de4" strokeLinecap="round" strokeWidth="4" /></g>
    <g><rect fill="#fff" height="55" rx="8" stroke="#a1cdf7" strokeWidth="2" width="104" x="458" y="122" /><path d="M475 151h69M475 164h46" stroke="#2b81e5" strokeLinecap="round" strokeWidth="5" /><path d="m478 139 13-8 13 7 13-10 16 8" stroke="#76b8f5" strokeWidth="2" /></g>
    <g fill="#72b0ef"><circle cx="71" cy="89" r="4"/><circle cx="117" cy="48" r="3"/><circle cx="485" cy="52" r="4"/><circle cx="565" cy="196" r="3"/></g>
  </svg>;
}

export function CustomerQuoteArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 250 160"><path d="M34 125c3-31 27-51 56-51 24 0 44 13 52 34 5-2 10-3 16-3 24 0 43 18 43 41H35c-3-7-3-14-1-21Z" fill="#d7eaff" stroke="#8dbff2" strokeWidth="2" /><path d="M82 61c0-17 14-31 31-31 12 0 23 6 28 17 4-2 8-2 12-2 13 0 24 10 24 24s-11 24-24 24h-47c-13 0-24-10-24-24v-8Z" fill="#77b6f4" stroke="#3488e9" strokeWidth="2" /><path d="M98 64h31m-31 12h20" stroke="#fff" strokeLinecap="round" strokeWidth="4" /><circle cx="51" cy="129" fill="#fff" r="3"/><circle cx="199" cy="123" fill="#fff" r="3"/></svg>;
}

export function CustomerCtaArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 440 170"><path d="M34 143h365" stroke="#b5d9fb" strokeDasharray="5 6" strokeWidth="2" /><path d="M111 138V69h81v69" fill="#d3e9ff" stroke="#3d8eeb" strokeWidth="2" /><path d="M111 69 129 52h81v69l-18 17" fill="#eff8ff" stroke="#3d8eeb" strokeWidth="2" /><path d="M130 88h40M130 102h51M130 116h30" stroke="#2b7fe2" strokeWidth="5" /><path d="m293 63 22 11 23-11v39c0 17-10 28-23 36-13-8-22-19-22-36V63Z" fill="#7ab8f5" stroke="#2c81e4" strokeWidth="3" /><path d="m304 95 8 8 15-17" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" /><path d="M216 51c0-21 17-38 38-38 15 0 29 9 35 22 4-2 8-3 13-3 17 0 30 13 30 30 0 17-13 30-30 30h-57c-16 0-29-13-29-29v-12Z" fill="#b9dcff" stroke="#68aaf0" strokeWidth="2" /></svg>;
}

export function CustomerIcon({ kind, className = "h-6 w-6" }: { kind: CustomerIconKind; className?: string }) {
  const common = { className, fill: "none", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (kind === "server") return <svg {...common}><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="4" /><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="10" /><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="16" /><path d="M7 6.5h.1M7 12.5h.1M7 18.5h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
  if (kind === "mail") return <svg {...common}><rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "cloud") return <svg {...common}><path d="M7 18h11a4 4 0 0 0 .6-7.95A6 6 0 0 0 7 9.5 4.5 4.5 0 0 0 7 18Z" stroke="currentColor" strokeWidth="1.7" /></svg>;
  if (kind === "ssl") return <svg {...common}><path d="m12 3 7 3v5c0 4.7-3 7.6-7 10-4-2.4-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7" /><path d="m8.5 11.5 2.2 2.2 4.8-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "link") return <svg {...common}><path d="M9.5 14.5 14.5 9.5M7 17l-1.2 1.2a3.5 3.5 0 0 1-5-5L4 10M17 7l1.2-1.2a3.5 3.5 0 0 1 5 5L20 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  return <svg {...common}><path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.7" /><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
