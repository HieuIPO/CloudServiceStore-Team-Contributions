import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getHeroSlideIndex, HERO_ROTATION_MS, heroSlides } from "../src/lib/hero-slides.ts";

const heroCarouselSource = await readFile(new URL("../src/components/hero-carousel.tsx", import.meta.url), "utf8");

test("hero slide index rotates predictably at the configured interval", () => {
  assert.equal(heroSlides.length, 4);
  assert.ok(heroSlides.every((slide) => slide.imageUrl.endsWith(".webp")));
  assert.equal(HERO_ROTATION_MS, 5_000);
  assert.equal(getHeroSlideIndex(0), 0);
  assert.equal(getHeroSlideIndex(4_999), 0);
  assert.equal(getHeroSlideIndex(5_000), 1);
  assert.equal(getHeroSlideIndex(20_000), 0);
});

test("hero renders the editable eyebrow before the primary message", () => {
  assert.equal(heroCarouselSource.includes("content.heroEyebrow"), true);
  assert.ok(heroCarouselSource.indexOf("content.heroEyebrow") < heroCarouselSource.indexOf("content.heroTitle"));
  assert.equal(heroCarouselSource.includes("TrustPoint"), false);
  assert.equal(heroCarouselSource.includes("Cloud status"), false);
  assert.equal(heroCarouselSource.includes("String(activeIndex + 1)"), false);
});
