export type IconKind = "commission" | "tracking" | "support" | "payment" | "person" | "link" | "customers" | "money" | "rules" | "wallet" | "calendar" | "shield";

export function AffiliateHeroArt() {
  return (
    <div aria-hidden="true" className="affiliate-hero-art pointer-events-none h-full w-full">
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 760 300">
        <defs>
          <linearGradient id="affiliate-hero-cloud" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#a8d6ff" />
            <stop offset="1" stopColor="#4e9cf4" />
          </linearGradient>
          <linearGradient id="affiliate-hero-panel" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#dceeff" />
          </linearGradient>
        </defs>
        <path d="M52 244h650M106 213l109-65 93 30 111-98 187 73" stroke="#c5defb" strokeDasharray="5 7" strokeWidth="1.5" />
        <path d="M88 268 221 190l104 35 121-105 173 74" stroke="#d9eafd" strokeWidth="1.5" />
        <circle cx="215" cy="149" fill="#87baf2" r="4" />
        <circle cx="415" cy="52" fill="#87baf2" r="4" />
        <circle cx="592" cy="195" fill="#6ba7ee" r="4" />

        <g transform="translate(452 32)">
          <path d="M0 49c0-26 21-47 47-47 7 0 14 2 20 4C79-11 113-28 143-9c18 11 28 29 28 49 25 0 46 20 46 45 0 26-21 46-47 46H45C20 131 0 110 0 85c0-14 6-27 16-36C6 44 0 47 0 49Z" fill="url(#affiliate-hero-cloud)" opacity=".95" />
          <path d="M29 83h166" stroke="#d7ecff" strokeLinecap="round" strokeWidth="3" />
          <circle cx="108" cy="52" fill="#fff" opacity=".9" r="4" />
          <circle cx="128" cy="52" fill="#fff" opacity=".9" r="4" />
          <circle cx="148" cy="52" fill="#fff" opacity=".9" r="4" />
        </g>

        <g transform="translate(377 122)">
          <path d="m0 24 72-24 74 24-74 25L0 24Z" fill="#f7fbff" stroke="#8cbcf3" strokeWidth="2" />
          <path d="m0 24 72 25v66L0 90V24Z" fill="#cfe5fc" stroke="#8cbcf3" strokeWidth="2" />
          <path d="m72 49 74-25v66l-74 25V49Z" fill="#a9cef6" stroke="#8cbcf3" strokeWidth="2" />
          <path d="m17 35 55 19v44L17 79V35Z" fill="#287de5" />
          <path d="m89 57 43-15v39L89 96V57Z" fill="#e8f4ff" />
          <path d="m27 51 38 13m-38 10 38 13m34-19 25-9m-25 24 25-9" stroke="#fff" strokeLinecap="round" strokeWidth="5" />
          <circle cx="27" cy="42" fill="#8de4ff" r="4" />
        </g>

        <g transform="translate(286 107)">
          <circle cx="30" cy="20" fill="#f5bf93" r="17" />
          <path d="M14 18c2-19 30-24 37-3-9-5-21-7-37 3Z" fill="#182d59" />
          <path d="M7 93c2-32 12-51 34-51 24 0 35 19 37 51H7Z" fill="#2e77dc" />
          <path d="m20 56 20 20 17-21" stroke="#a9d4ff" strokeWidth="7" />
          <path d="m60 72 35 26" stroke="#f5bf93" strokeLinecap="round" strokeWidth="10" />
        </g>

        <g transform="translate(222 105)">
          <circle cx="30" cy="20" fill="#f4bb8e" r="17" />
          <path d="M13 15c4-20 28-24 39-5-13-4-25-2-39 5Z" fill="#132857" />
          <path d="M6 94c3-32 13-51 35-51 23 0 34 19 36 51H6Z" fill="#244f9e" />
          <path d="m67 68 28 28" stroke="#f4bb8e" strokeLinecap="round" strokeWidth="10" />
          <path d="m88 88 23-1" stroke="#f4bb8e" strokeLinecap="round" strokeWidth="8" />
        </g>

        <g transform="translate(616 122)">
          <rect fill="url(#affiliate-hero-panel)" height="74" rx="12" stroke="#8fbef2" strokeWidth="2" width="116" />
          <path d="M17 53 43 35l19 8 30-26" stroke="#176fe1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          <path d="m83 17 10 0-1 10" stroke="#176fe1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="M17 61h82" stroke="#bad9fa" strokeLinecap="round" strokeWidth="2" />
        </g>

        <g transform="translate(553 204)">
          <circle cx="33" cy="33" fill="#f4bb38" r="31" stroke="#fff" strokeWidth="4" />
          <path d="M33 15v36m-11-27h15a8 8 0 0 1 0 16H27a8 8 0 0 0 0 16h17" stroke="#fff" strokeLinecap="round" strokeWidth="5" />
        </g>
      </svg>
    </div>
  );
}

export function AffiliatePartnerArt() {
  return (
    <div aria-hidden="true" className="affiliate-partner-art h-full w-full">
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 360 150">
        <path d="M28 131h304" stroke="#bcdcff" strokeLinecap="round" strokeWidth="2" />
        <path d="M34 103c0-13 10-23 23-23 3-19 19-33 39-33 22 0 39 17 39 39 14 0 25 11 25 25H54c-11 0-20-8-20-18Z" fill="#fff" stroke="#c7ddf8" strokeWidth="2" />
        <path d="M201 70c0-18 15-33 33-33h44c18 0 33 15 33 33s-15 33-33 33h-17l-18 18v-18h-9c-18 0-33-15-33-33Z" fill="#7fc5ff" stroke="#5ea5ed" strokeWidth="2" />
        <circle cx="252" cy="70" fill="#fff" r="4" /><circle cx="267" cy="70" fill="#fff" r="4" /><circle cx="282" cy="70" fill="#fff" r="4" />
        <g transform="translate(115 61)">
          <path d="m0 24 43-20 44 20-44 20L0 24Z" fill="#fff" stroke="#8dbcf0" strokeWidth="2" />
          <path d="m0 24 43 20v36L0 60V24Z" fill="#d8eafb" stroke="#8dbcf0" strokeWidth="2" />
          <path d="m43 44 44-20v36L43 80V44Z" fill="#bad9fb" stroke="#8dbcf0" strokeWidth="2" />
          <path d="m12 34 31 14v20L12 54V34Z" fill="#2478df" />
          <path d="m55 49 23-11v19L55 68V49Z" fill="#edf7ff" />
        </g>
        <path d="m179 81 27 22m-24-29 22 19m-13-27 19 16" stroke="#2b75d7" strokeLinecap="round" strokeWidth="7" />
        <path d="m178 83-16 22m27-31-19 24" stroke="#f0b487" strokeLinecap="round" strokeWidth="8" />
      </svg>
    </div>
  );
}

export function AffiliateIcon({ kind }: { kind: IconKind }) {
  const common = { stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return (
    <svg aria-hidden="true" className="h-9 w-9" fill="none" viewBox="0 0 40 40">
      {kind === "commission" && <><ellipse cx="19" cy="10" fill="#e9f4ff" rx="10" ry="5" {...common} /><path d="M9 10v17c0 3 5 5 10 5s10-2 10-5V10M9 18c0 3 5 5 10 5s10-2 10-5" {...common} /><circle cx="30" cy="29" fill="#fff" r="7" {...common} /><path d="M30 25v8m-3-6h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4" {...common} /></>}
      {kind === "tracking" && <><rect height="24" rx="2" width="28" x="6" y="7" {...common} /><path d="m11 25 6-6 4 3 8-9M26 13h3v3" {...common} /></>}
      {kind === "support" && <><path d="M8 21v-2a12 12 0 0 1 24 0v2" {...common} /><rect height="11" rx="3" width="7" x="6" y="20" {...common} /><rect height="11" rx="3" width="7" x="27" y="20" {...common} /><path d="M27 31h-5a4 4 0 0 1-4-4" {...common} /></>}
      {kind === "payment" && <><rect height="25" rx="3" width="28" x="6" y="7" {...common} /><path d="M6 14h28M12 22h8" {...common} /><circle cx="27" cy="26" fill="#e9f4ff" r="4" {...common} /><path d="m25 26 2 2 3-4" {...common} /></>}
      {kind === "person" && <><circle cx="20" cy="12" fill="#e9f4ff" r="6" {...common} /><path d="M9 32c1-7 5-11 11-11s10 4 11 11" {...common} /></>}
      {kind === "link" && <><path d="M15 24 11 28a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0M25 16l4-4a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0M13 27l14-14" {...common} /></>}
      {kind === "customers" && <><circle cx="14" cy="13" fill="#e9f4ff" r="5" {...common} /><circle cx="27" cy="14" fill="#e9f4ff" r="4" {...common} /><path d="M5 31c1-6 4-9 9-9s8 3 9 9m-1-8c6-2 11 1 13 8" {...common} /></>}
      {kind === "money" && <><circle cx="20" cy="20" fill="#e9f4ff" r="13" {...common} /><path d="M20 11v18m-5-14h6a4 4 0 0 1 0 8h-3a4 4 0 0 0 0 8h6" {...common} /></>}
      {kind === "rules" && <><rect height="28" rx="3" width="24" x="8" y="6" {...common} /><path d="M13 13h14M13 19h14M13 25h8m-4-19v-3h4v3" {...common} /><path d="m11 12 1 1 2-3m-3 9 1 1 2-3" {...common} /></>}
      {kind === "wallet" && <><path d="M7 11h23a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h15" {...common} /><path d="M4 13h25m-5 8h5" {...common} /><circle cx="24" cy="21" fill="currentColor" r="1.5" /></>}
      {kind === "calendar" && <><rect height="25" rx="3" width="28" x="6" y="8" {...common} /><path d="M12 5v6m16-6v6M6 15h28M12 20h3m4 0h3m-10 5h3m4 0h3" {...common} /></>}
      {kind === "shield" && <><path d="m20 4 12 5v8c0 8-5 14-12 18C13 31 8 25 8 17V9l12-5Z" fill="#e9f4ff" {...common} /><path d="m14 20 4 4 8-9" {...common} /></>}
    </svg>
  );
}
