type NewsIconName = "search" | "calendar" | "clock" | "author" | "arrow" | "link" | "headset" | "cloud" | "mail" | "info";

export function NewsHeroArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 560 250">
    <path d="M85 175h370" stroke="#b8d8fb" strokeDasharray="5 7" strokeWidth="2" />
    <path d="m115 165 110-55 105 42 105-64" stroke="#9cc9f7" strokeWidth="1.5" />
    <g opacity=".95">
      <path d="M244 104h154v72H244z" fill="#d7eaff" stroke="#6daaf0" strokeWidth="2" />
      <path d="M244 104h154l-29-24H215z" fill="#edf6ff" stroke="#6daaf0" strokeWidth="2" />
      <path d="M244 104v72l-29-25V80z" fill="#c0ddfb" stroke="#6daaf0" strokeWidth="2" />
      <path d="M264 120h112M264 139h112M264 158h112" stroke="#2d81e9" strokeWidth="6" />
      <circle cx="253" cy="120" r="3" fill="#1d66d5" /><circle cx="253" cy="139" r="3" fill="#1d66d5" /><circle cx="253" cy="158" r="3" fill="#1d66d5" />
    </g>
    <g opacity=".92">
      <path d="M347 87c-3-27 17-48 44-48 18 0 34 11 41 27 4-2 9-3 14-3 18 0 32 14 32 31 0 18-14 32-32 32H378c-16 0-29-12-31-27Z" fill="#b9dcff" stroke="#6ca8ef" strokeWidth="2" />
      <path d="M358 87c7-11 19-18 33-18 15 0 28 8 35 20 5-5 12-8 20-8 11 0 20 5 26 14" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
    </g>
    <g>
      <rect fill="#fff" height="54" rx="8" stroke="#c2defa" strokeWidth="2" width="88" x="424" y="52" />
      <path d="M440 83h54M440 95h34" stroke="#2d81e9" strokeLinecap="round" strokeWidth="4" />
      <path d="m442 72 12-7 11 8 12-9 13 7" stroke="#76b7f5" strokeWidth="2" />
    </g>
    <g fill="#9ac7f5"><circle cx="83" cy="100" r="4"/><circle cx="133" cy="56" r="3"/><circle cx="183" cy="128" r="3"/><circle cx="465" cy="22" r="4"/><circle cx="518" cy="126" r="3"/></g>
  </svg>;
}

export function NewsNewsletterArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 420 180">
    <path d="M45 140c28-42 77-40 105-8 23-47 102-50 127 1 43-22 91 4 98 36H38c-5-10-2-21 7-29Z" fill="#b9dcff" opacity=".55" />
    <path d="M171 129c11-29 48-39 74-21 7-31 42-48 70-32 16 9 25 27 23 45 23-3 44 13 48 36H132c3-14 17-26 39-28Z" fill="#d7eaff" stroke="#9cc9f7" strokeWidth="2" />
    <path d="M216 100c0-18 15-33 33-33 12 0 22 6 28 16 3-1 7-2 11-2 14 0 25 11 25 25 0 14-11 25-25 25h-48c-14 0-24-11-24-25Z" fill="#79b8f6" stroke="#3286e8" strokeWidth="2" />
    <rect fill="#fff" height="56" rx="10" stroke="#3d8fec" strokeWidth="3" width="82" x="190" y="109" />
    <path d="m198 116 33 24 33-24M198 159l24-22m42 22-24-22" stroke="#2878df" strokeWidth="3" />
    <path d="M49 63h94M49 77h57" stroke="#9cc9f7" strokeLinecap="round" strokeWidth="3" />
    <g fill="#82bdf3"><circle cx="55" cy="42" r="3"/><circle cx="97" cy="29" r="3"/><circle cx="350" cy="53" r="3"/><circle cx="389" cy="83" r="4"/></g>
  </svg>;
}

export function NewsSupportArt() {
  return <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 360 190">
    <path d="M32 161h300" stroke="#b4d8fa" strokeDasharray="5 6" strokeWidth="2" />
    <path d="M78 145V62h76v83" fill="#d5eaff" stroke="#4b97ed" strokeWidth="2" />
    <path d="M78 62 96 45h76v83l-18 17" fill="#eef7ff" stroke="#4b97ed" strokeWidth="2" />
    <path d="M95 80h42M95 96h42M95 112h42" stroke="#287be2" strokeWidth="5" />
    <path d="M205 135c-2-25 17-46 42-46 18 0 33 11 39 27 4-2 8-3 13-3 17 0 30 13 30 30 0 17-13 30-30 30h-64c-17 0-30-14-30-31Z" fill="#b9dcff" stroke="#5ba0ee" strokeWidth="2" />
    <path d="m222 118 25 17 25-17" stroke="#fff" strokeWidth="5" />
    <path d="M247 135v25" stroke="#fff" strokeWidth="5" />
    <path d="M252 26v37M234 44h36" stroke="#9bc9f7" strokeLinecap="round" strokeWidth="3" />
    <g fill="#83bbf3"><circle cx="30" cy="50" r="4"/><circle cx="189" cy="27" r="4"/><circle cx="313" cy="45" r="3"/></g>
  </svg>;
}

export function NewsIcon({ name, className = "h-4 w-4" }: { name: NewsIconName; className?: string }) {
  const common = { className, fill: "none", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
  if (name === "calendar") return <svg {...common}><rect height="16" rx="2" stroke="currentColor" strokeWidth="1.7" width="17" x="3.5" y="5" /><path d="M7 3v4M17 3v4M4 9h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" /><path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (name === "author") return <svg {...common}><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" /><path d="M5.5 20c.6-3.3 3-5 6.5-5s5.9 1.7 6.5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (name === "link") return <svg {...common}><path d="M9.5 14.5 14.5 9.5M7 17l-1.2 1.2a3.5 3.5 0 0 1-5-5L4 10M17 7l1.2-1.2a3.5 3.5 0 0 1 5 5L20 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (name === "headset") return <svg {...common}><path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.7" /><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z" stroke="currentColor" strokeWidth="1.7" /><path d="M17 19c0 1.1-1.1 2-2.5 2H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (name === "cloud") return <svg {...common}><path d="M7 18h11a4 4 0 0 0 .6-7.95A6 6 0 0 0 7 9.5 4.5 4.5 0 0 0 7 18Z" stroke="currentColor" strokeWidth="1.7" /></svg>;
  if (name === "mail") return <svg {...common}><rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (name === "info") return <svg {...common}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></svg>;
  return <svg {...common}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
