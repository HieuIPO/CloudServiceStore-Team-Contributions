import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const experienceSource = await readFile(
  new URL("../src/components/customer-experience.tsx", import.meta.url),
  "utf8",
);
const customersPageSource = await readFile(
  new URL("../src/app/customers/page.tsx", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

test("customer experience exposes accessible carousel controls and reduced-motion support", () => {
  assert.match(experienceSource, /aria-label="Xem đánh giá trước"/);
  assert.match(experienceSource, /aria-label="Xem đánh giá tiếp theo"/);
  assert.match(experienceSource, /previousLabel="Đánh giá trước"/);
  assert.match(experienceSource, /nextLabel="Đánh giá tiếp theo"/);
  assert.match(experienceSource, /prefers-reduced-motion/);
});

test("customer experience keeps QR browsing compact and filterable", () => {
  for (const label of ["Tất cả", "VPS", "Hosting", "Cloud", "Email", "SSL"]) {
    assert.match(experienceSource, new RegExp(label));
  }
  assert.match(experienceSource, /Xem QR/);
  assert.match(experienceSource, /aria-expanded/);
  assert.match(experienceSource, /customer-logo-marquee/);
});

test("customer testimonials only render persisted fields", () => {
  assert.doesNotMatch(experienceSource, /reviewServices/);
  assert.doesNotMatch(experienceSource, /StarRating|Đánh giá 5 trên 5 sao/);
  assert.match(experienceSource, /testimonials\.length > 0/);
});

test("customers page passes all persisted testimonials to both carousels", () => {
  assert.match(customersPageSource, /const testimonials = landing\?\.testimonials \?\? \[\];/);
  assert.doesNotMatch(customersPageSource, /landing\?\.testimonials\?\.slice\(0, 3\)/);
  assert.match(customersPageSource, /const logos = landing\?\.customerLogos\?\.slice\(0, 10\) \?\? \[\];/);
  assert.doesNotMatch(customersPageSource, /fallbackTestimonials|fallbackLogos/);
  assert.doesNotMatch(customersPageSource, /Email Business|Hosting Pro|VPS Business 4/);
});

test("customers page wires active plans to real backend QR images", () => {
  assert.match(customersPageSource, /getPublicServicePlans/);
  assert.match(customersPageSource, /qrPlans=\{qrPlans\}/);
  assert.match(experienceSource, /qrCodePath/);
  assert.match(experienceSource, /src=\{item\.qrCodePath\}/);
  assert.doesNotMatch(experienceSource, /function QrCode/);
});

test("customers page highlights its header route and expands only the selected QR card", () => {
  assert.match(customersPageSource, /<SiteHeader activeHref="\/customers" \/>/);
  assert.match(experienceSource, /const \[expandedQr, setExpandedQr\] = useState<string \| null>\(null\)/);
  assert.match(experienceSource, /expanded=\{expandedQr === item\.slug\}/);
  assert.match(experienceSource, /setExpandedQr\(\(value\) => value === item\.slug \? null : item\.slug\)/);
});

test("QR cards do not stretch closed siblings when one QR opens", () => {
  assert.match(experienceSource, /className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"/);
});

test("customer logo marquee renders the supplied logo asset without a generated monogram", () => {
  assert.match(experienceSource, /className="customer-logo-image"/);
  assert.match(experienceSource, /const label = item\.altText \|\| `Logo \$\{item\.name\}`/);
  assert.match(experienceSource, /alt=\{label\}/);
  assert.doesNotMatch(experienceSource, /customer-logo-monogram/);
  const logoMarkSource = experienceSource.slice(experienceSource.indexOf("function LogoMark"), experienceSource.indexOf("function SectionHeading"));
  assert.doesNotMatch(logoMarkSource, /backgroundImage: `url/);
});

test("customer logo tiles keep a consistent width and improve logo contrast", () => {
  assert.match(globalStyles, /\.customer-logo-mark \{[\s\S]*flex: 0 0 13rem;/);
  assert.match(globalStyles, /\.customer-logo-image \{[\s\S]*filter: contrast\(/);
});

test("customer logo marquee keeps the outer area visually clean", () => {
  assert.match(globalStyles, /\.customer-logo-marquee \{[\s\S]*border: 0;[\s\S]*background: transparent;/);
});

test("customer logo marquee uses open spacing instead of individual cards", () => {
  assert.match(globalStyles, /\.customer-logo-mark \{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
    assert.match(globalStyles, /\.customer-logo-image \{[\s\S]*transform: scale\(1\.24\);/);
});

test("customer logo marquee removes the outer frame and blends white image backgrounds", () => {
  assert.match(globalStyles, /\.customer-logo-marquee \{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(globalStyles, /\.customer-logo-image \{[\s\S]*mix-blend-mode: multiply;/);
  assert.match(globalStyles, /\.customer-logo-track \{[^}]*mix-blend-mode: multiply;/);
});
