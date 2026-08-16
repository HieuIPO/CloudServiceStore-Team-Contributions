import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const landingSource = await readFile(new URL("../src/components/public-landing.tsx", import.meta.url), "utf8");
const adminLandingSource = await readFile(new URL("../src/components/admin-landing-client.tsx", import.meta.url), "utf8");
const aboutSource = await readFile(new URL("../src/app/about/page.tsx", import.meta.url), "utf8");
const aboutArtSource = await readFile(new URL("../src/components/about-art.tsx", import.meta.url), "utf8");
const globalStyles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("data-present service and promotion sections expose the reference card actions", () => {
  assert.match(landingSource, /featured-plan-grid/);
  assert.match(landingSource, /Đăng ký ngay/);
  assert.match(landingSource, /Phổ biến nhất/);
  assert.match(landingSource, /promotion-grid/);
  assert.match(landingSource, /Xem chi tiết/);
});

test("final landing CTA offers discovery and consultation actions", () => {
  assert.match(landingSource, /Sẵn sàng bắt đầu với cloud\?/);
  assert.match(landingSource, /Khám phá dịch vụ/);
  assert.match(landingSource, /Liên hệ tư vấn/);
});

test("nullable API prices render as contact or regular price instead of zero", () => {
  assert.match(landingSource, /typeof plan\.currentMonthlyPrice !== "number"/);
  assert.match(landingSource, /typeof plan\.promotionalMonthlyPrice !== "number"/);
});

test("public testimonials render as one horizontal marquee row", () => {
  assert.match(landingSource, /const isTestimonialMarquee = testimonials\.length > 1;/);
  assert.match(landingSource, /const testimonialCopies = isTestimonialMarquee \? \[0, 1\] : \[0\];/);
  assert.match(landingSource, /landing-testimonial-marquee mt-10 overflow-hidden/);
  assert.match(landingSource, /landing-testimonial-track flex w-max/);
  assert.match(landingSource, /testimonials\.map\(item => <TestimonialCard item=\{item\} key=\{`\$\{item\.id\}-\$\{copy\}`\} \/>\)/);
  assert.equal(landingSource.includes("md:grid-cols-2"), false);
  assert.match(globalStyles, /\.landing-testimonial-track \{[\s\S]*animation: landing-testimonial-marquee/);
});

test("public partner logos use readable contrast tiles in the landing marquee", () => {
  for (const contract of ["landing-logo-section", "landing-logo-item", "landing-logo-image"]) {
    assert.match(landingSource, new RegExp(contract));
  }
  assert.match(landingSource, /alt=\{logo\.altText \|\| `Logo \$\{logo\.name\}`\}/);
  const logoMarkup = landingSource.slice(landingSource.indexOf("landing-logo-section"), landingSource.indexOf("<FeaturedPlansSection"));
  assert.doesNotMatch(logoMarkup, /backgroundImage: `url\("\$\{logo\.logoUrl\}"\)`/);
  assert.match(globalStyles, /\.landing-logo-marquee \{[\s\S]*background: transparent;/);
  assert.match(globalStyles, /\.landing-logo-image \{[\s\S]*filter: contrast\(/);
});

test("landing partner logos use open spacing instead of individual cards", () => {
  assert.match(globalStyles, /\.landing-logo-item \{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
    assert.match(globalStyles, /\.landing-logo-image \{[\s\S]*transform: scale\(1\.24\);/);
});

test("landing partner logos remove the outer frame and blend white image backgrounds", () => {
  assert.match(globalStyles, /\.landing-logo-marquee \{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(globalStyles, /\.landing-logo-image \{[\s\S]*mix-blend-mode: multiply;/);
  assert.match(globalStyles, /\.landing-logo-track \{[^}]*mix-blend-mode: multiply;/);
});

test("public testimonials use the reference light card treatment", () => {
  assert.match(landingSource, /landing-testimonial-section/);
  assert.match(landingSource, /landing-testimonial-glow landing-testimonial-glow-left/);
  assert.match(landingSource, /landing-testimonial-card/);
  assert.match(landingSource, /text-4xl font-black leading-none text-blue-600/);
  assert.match(landingSource, /border-t border-slate-200/);
  assert.equal(landingSource.includes("bg-cyan-50"), false);
  assert.equal(landingSource.includes('const cardTone = ["border-blue-200'), false);
  assert.match(globalStyles, /\.landing-testimonial-section \{[\s\S]*background: #eef5fb;/);
  assert.match(globalStyles, /\.landing-testimonial-card \{[\s\S]*background: #fff;[\s\S]*border-color: #cbd5e1;[\s\S]*box-shadow: 0 10px 26px rgba\(15, 23, 42, \.1\);/);
  assert.match(globalStyles, /mask-image: linear-gradient/);
});

test("testimonial cards stay compact and long quotes have a readable editor limit", () => {
  assert.match(landingSource, /min-h-\[18rem\]/);
  assert.match(landingSource, /w-\[min\(78vw,17\.5rem\)\]/);
  assert.match(landingSource, /line-clamp-6 overflow-hidden/);
  assert.match(adminLandingSource, /id="testimonial-quote"/);
  assert.match(adminLandingSource, /maxLength=\{320\}/);
  assert.match(adminLandingSource, /testForm\.quote\.length\}\/320/);
});

test("about page renders the editable infrastructure markdown", () => {
  assert.match(aboutSource, /content\?\.infrastructureMarkdown/);
  assert.match(aboutSource, /<ReactMarkdown>\{content\?\.infrastructureMarkdown\}<\/ReactMarkdown>/);
});

test("about feature card uses the editable uptime commitment", () => {
  assert.match(aboutSource, /const uptimeLabel = `\$\{uptimeValue\}%`;/);
  assert.match(aboutSource, /title=\{`\$\{uptimeLabel\} Uptime SLA`\}/);
  assert.match(aboutSource, /Cam kết thời gian hoạt động đạt tối thiểu \$\{uptimeLabel\}\./);
  assert.match(aboutSource, /item\.text\.replace\("99\.9%", uptimeLabel\)/);
});

test("uptime icon accepts the editable commitment label", () => {
  assert.match(aboutArtSource, /uptimeLabel\?: string/);
  assert.match(aboutArtSource, /\{uptimeLabel \?\? "99\.9%"\}/);
  assert.match(aboutSource, /iconLabel=\{uptimeLabel\}/);
  assert.match(aboutSource, /iconLabel=\{item\.icon === "uptime" \? uptimeLabel : undefined\}/);
});
