export type OrderIconKind = "document" | "clipboard" | "calendar" | "send" | "lock" | "mail" | "globe" | "server" | "headset" | "check";

export function OrderIcon({ kind, className = "h-5 w-5" }: { kind: OrderIconKind; className?: string }) {
  const common = { className, fill: "none", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (kind === "document") return <svg {...common}><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "clipboard") return <svg {...common}><rect height="17" rx="2" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="4" /><path d="M9 4V3h6v1M8 10h8M8 14h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "calendar") return <svg {...common}><rect height="16" rx="2" stroke="currentColor" strokeWidth="1.7" width="17" x="3.5" y="5" /><path d="M7 3v4M17 3v4M4 9h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "send") return <svg {...common}><path d="m4 5 16 7-16 7 3-7-3-7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M7 12h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "lock") return <svg {...common}><rect height="10" rx="2" stroke="currentColor" strokeWidth="1.7" width="14" x="5" y="10" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "mail") return <svg {...common}><rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "globe") return <svg {...common}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" /><path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5s-1.1 6.2-3.2 8.5c-2.1-2.3-3.2-5.1-3.2-8.5S9.9 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (kind === "server") return <svg {...common}><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="4" /><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="10" /><rect height="5" rx="1" stroke="currentColor" strokeWidth="1.7" width="15" x="4.5" y="16" /><path d="M7 6.5h.1M7 12.5h.1M7 18.5h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
  if (kind === "headset") return <svg {...common}><path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.7" /><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z" stroke="currentColor" strokeWidth="1.7" /><path d="M17 19c0 1.1-1.1 2-2.5 2H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8.5" fill="currentColor" /><path d="m8 12 2.6 2.6L16.5 9" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export function OrderCloudArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 300 150">
    <path d="M74 114h147" stroke="#b7d9fb" strokeDasharray="5 6" strokeWidth="2" />
    <path d="M92 103V43h72v60" fill="#d4eaff" stroke="#3b8ce9" strokeWidth="2" />
    <path d="M92 43 108 29h72v60l-16 14" fill="#eef7ff" stroke="#3b8ce9" strokeWidth="2" />
    <path d="M109 59h35M109 72h35M109 85h35" stroke="#1c6fd8" strokeWidth="5" />
    <path d="M180 96c-2-22 15-40 37-40 15 0 28 9 34 23 3-1 7-2 11-2 14 0 25 11 25 25 0 14-11 25-25 25h-56c-14 0-25-11-26-25Z" fill="#b8dbff" stroke="#5ca0ee" strokeWidth="2" />
    <path d="m198 83 20 14 20-14" stroke="#fff" strokeWidth="4" /><path d="M218 97v22" stroke="#fff" strokeWidth="4" />
    <g fill="#83bbf3"><circle cx="45" cy="34" r="4"/><circle cx="218" cy="25" r="3"/><circle cx="263" cy="48" r="3"/></g>
  </svg>;
}
