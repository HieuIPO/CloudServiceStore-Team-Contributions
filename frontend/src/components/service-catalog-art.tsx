export function ServiceHeroArt() {
  return (
    <div aria-hidden="true" className="service-hero-art pointer-events-none h-full w-full">
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 760 180">
        <defs>
          <linearGradient id="hero-server-face" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#f8fbff" />
            <stop offset="1" stopColor="#cfe3ff" />
          </linearGradient>
          <linearGradient id="hero-server-blue" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#69adff" />
            <stop offset="1" stopColor="#2476ed" />
          </linearGradient>
          <linearGradient id="hero-fade" x1="0" x2="1">
            <stop stopColor="#edf6ff" stopOpacity="0" />
            <stop offset=".35" stopColor="#edf6ff" stopOpacity=".55" />
            <stop offset="1" stopColor="#e8f3ff" />
          </linearGradient>
        </defs>

        <rect fill="url(#hero-fade)" height="180" width="760" />
        <path d="M126 154 254 88l113 36 119-78 179 78" stroke="#c7ddfa" strokeDasharray="5 6" strokeWidth="1.5" />
        <path d="M191 168 299 111l105 34 119-69 151 58" stroke="#d7e8fc" strokeWidth="1.5" />
        <circle cx="315" cy="124" fill="#c4dcfa" r="4" />
        <circle cx="485" cy="46" fill="#9fc6f7" r="4" />
        <circle cx="664" cy="124" fill="#9fc6f7" r="4" />

        <g fill="#fff" stroke="#d4e6fb" strokeWidth="1.5">
          <path d="M72 145c0-15 12-27 27-27 3-23 22-40 46-40 26 0 47 20 47 46 17 0 30 13 30 29 0 17-14 30-31 30H99c-15 0-27-12-27-27Z" />
          <path d="M625 144c0-12 9-22 21-22 3-18 18-32 37-32 21 0 38 17 38 38 14 0 25 11 25 25 0 14-11 26-26 26h-72c-13 0-23-10-23-23Z" />
          <path d="M240 85c0-8 7-15 15-15 2-12 12-21 25-21 14 0 26 11 26 26 9 0 17 7 17 16 0 10-8 17-17 17h-51c-9 0-15-7-15-16Z" opacity=".85" />
        </g>

        <g data-hero-server="secondary" transform="translate(425 23)">
          <path d="m0 26 47-20 48 20-48 20L0 26Z" fill="#f8fbff" stroke="#9fc5f5" strokeWidth="1.5" />
          <path d="m0 26 47 20v98L0 124V26Z" fill="#dbeaff" stroke="#9fc5f5" strokeWidth="1.5" />
          <path d="m47 46 48-20v98l-48 20V46Z" fill="#c4dcfb" stroke="#9fc5f5" strokeWidth="1.5" />
          <path d="m12 37 35 15v79l-35-15V37Z" fill="url(#hero-server-blue)" />
          <path d="m59 51 25-10v70l-25 10V51Z" fill="#edf6ff" />
          <path d="m18 55 23 10m-23 10 23 10m-23 10 23 10m23-40 14-6m-14 20 14-6m-14 20 14-6" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
          <circle cx="18" cy="46" fill="#70d5ff" r="2.5" />
        </g>

        <g data-hero-server="primary" transform="translate(516 40)">
          <path d="m0 27 52-22 53 22-53 22L0 27Z" fill="#fff" stroke="#8eb9f0" strokeWidth="1.5" />
          <path d="m0 27 52 22v104L0 131V27Z" fill="url(#hero-server-face)" stroke="#8eb9f0" strokeWidth="1.5" />
          <path d="m52 49 53-22v104l-53 22V49Z" fill="#c5ddfb" stroke="#8eb9f0" strokeWidth="1.5" />
          <path d="m12 40 40 17v83l-40-17V40Z" fill="url(#hero-server-blue)" />
          <path d="m65 55 28-12v74l-28 12V55Z" fill="#edf6ff" />
          <path d="m19 59 26 11m-26 12 26 11m-26 12 26 11m27-44 15-6m-15 21 15-6m-15 21 15-6" stroke="#fff" strokeLinecap="round" strokeWidth="3.5" />
          <circle cx="18" cy="48" fill="#7ae0ff" r="2.5" />
        </g>

        <g transform="translate(692 29)">
          <circle cx="24" cy="24" fill="#fff" r="23" stroke="#c7def9" strokeWidth="1.5" />
          <rect fill="#eaf4ff" height="22" rx="5" stroke="#4389e8" strokeWidth="2" width="24" x="12" y="20" />
          <path d="M18 20v-5a6 6 0 0 1 12 0v5" stroke="#4389e8" strokeLinecap="round" strokeWidth="2" />
          <circle cx="24" cy="31" fill="#4389e8" r="2" />
        </g>
      </svg>
    </div>
  );
}

export function ServiceSupportArt() {
  return (
    <div aria-hidden="true" className="service-support-art mx-auto h-[5.5rem] w-full max-w-[13rem] lg:h-[6.5rem] lg:max-w-[14rem]">
      <svg className="h-full w-full" fill="none" viewBox="0 0 250 110">
        <path d="M14 92h222" stroke="#c5dcf8" strokeLinecap="round" strokeWidth="2" />
        <path d="M25 76c0-9 7-16 16-16 2-14 13-24 28-24 16 0 29 12 29 28 10 0 18 8 18 18 0 10-8 18-18 18H42c-9 0-17-7-17-17Z" fill="#fff" stroke="#c1daf8" strokeWidth="2" />
        <ellipse cx="53" cy="72" fill="#4f91ec" rx="4" ry="7" />
        <ellipse cx="72" cy="72" fill="#4f91ec" rx="4" ry="7" />
        <path d="M84 29c0-12 10-22 22-22h28c12 0 22 10 22 22s-10 22-22 22h-11l-12 11V51h-5c-12 0-22-10-22-22Z" fill="#79c4ff" stroke="#69a9ed" strokeWidth="2" />
        <circle cx="111" cy="29" fill="#fff" r="3" /><circle cx="120" cy="29" fill="#fff" r="3" /><circle cx="129" cy="29" fill="#fff" r="3" />
        <g transform="translate(151 20)">
          <path d="M12 51V38C12 17 27 2 47 2s35 15 35 36v13" stroke="#2f7ee8" strokeLinecap="round" strokeWidth="7" />
          <rect fill="#4c96f1" height="35" rx="10" stroke="#276ed0" strokeWidth="2" width="16" x="5" y="43" />
          <rect fill="#4c96f1" height="35" rx="10" stroke="#276ed0" strokeWidth="2" width="16" x="74" y="43" />
          <path d="M81 71c0 13-8 19-21 19H48" stroke="#276ed0" strokeLinecap="round" strokeWidth="3" />
          <rect fill="#78c5ff" height="8" rx="4" width="18" x="35" y="86" />
        </g>
      </svg>
    </div>
  );
}

export function ServiceServerArt() {
  return (
    <div aria-hidden="true" className="service-server-art mx-auto h-[5rem] w-full max-w-[12rem] lg:h-[4.75rem]">
      <svg className="h-full w-full" fill="none" viewBox="0 0 260 110">
        <path d="M20 94h222" stroke="#c5dcf8" strokeLinecap="round" strokeWidth="2" />
        <path d="M145 73c0-9 7-16 16-16 2-15 15-27 31-27 18 0 33 14 33 32 11 0 20 9 20 20 0 12-9 21-21 21h-62c-10 0-18-8-18-18Z" fill="#fff" stroke="#d4e6fb" strokeWidth="2" />
        <path d="M28 82c0-7 6-13 13-13 2-11 11-19 23-19 14 0 25 11 25 25 9 0 16 7 16 16H41c-7 0-13-6-13-13Z" fill="#fff" stroke="#d4e6fb" strokeWidth="2" />
        <g transform="translate(72 15)">
          <path d="m12 15 52-12 53 12-53 13-52-13Z" fill="#fff" stroke="#a6c8f4" strokeWidth="1.5" />
          <path d="M12 15 64 28v17L12 33V15Z" fill="#d8eaff" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="m64 28 53-13v18L64 45V28Z" fill="#c4dcfb" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="M12 39 64 52v17L12 57V39Z" fill="#e8f3ff" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="m64 52 53-13v18L64 69V52Z" fill="#c4dcfb" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="M12 63 64 76v17L12 81V63Z" fill="#e8f3ff" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="m64 76 53-13v18L64 93V76Z" fill="#c4dcfb" stroke="#8fb9ef" strokeWidth="1.5" />
          <path d="m24 25 26 7m-26 17 26 7m-26 17 26 7" stroke="#3886ea" strokeLinecap="round" strokeWidth="4" />
          <circle cx="20" cy="22" fill="#66c7ff" r="2.5" /><circle cx="20" cy="46" fill="#66c7ff" r="2.5" /><circle cx="20" cy="70" fill="#66c7ff" r="2.5" />
        </g>
      </svg>
    </div>
  );
}
