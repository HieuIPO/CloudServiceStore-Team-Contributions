"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingPageContent } from "@/lib/api";
import { HERO_ROTATION_MS, heroSlides } from "@/lib/hero-slides";

export function HeroCarousel({ content }: { content: LandingPageContent }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex] ?? heroSlides[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % heroSlides.length);
    }, HERO_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  const selectSlide = (index: number) => {
    setActiveIndex((index + heroSlides.length) % heroSlides.length);
  };

  return (
    <section
      aria-label="Hero CloudServiceStore"
      className="relative isolate overflow-hidden border-b border-blue-100 bg-sky-50"
    >
      <div
        className="hero-slide-image absolute inset-0 -z-20 bg-cover bg-center"
        key={activeSlide.id}
        role="img"
        aria-label={activeSlide.alt}
        style={{
          backgroundImage: `url("${activeSlide.imageUrl}")`,
          backgroundPosition: activeSlide.imagePosition,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(247,251,255,.94)_0%,rgba(247,251,255,.78)_31%,rgba(247,251,255,.22)_65%,rgba(247,251,255,.06)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,.46)_0%,transparent_34%,rgba(220,241,255,.32)_100%)]"
      />

      <div className="shell relative flex min-h-[41rem] items-center pb-24 pt-32 sm:min-h-[43rem] lg:min-h-[45rem]">
        <div className="max-w-2xl">
          {content.heroEyebrow && <p className="mb-4 text-xs font-black uppercase tracking-[.2em] text-blue-700 sm:text-sm">{content.heroEyebrow}</p>}
          <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-[-.04em] text-slate-950 sm:text-5xl lg:text-[4.35rem]">
            {content.heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            {content.heroDescription}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              href={content.primaryCtaUrl}
            >
              {content.primaryCtaLabel}
              <span aria-hidden="true" className="ml-2 text-lg leading-none">→</span>
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/90 bg-white/65 px-6 font-bold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              href={content.secondaryCtaUrl}
            >
              {content.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-10">
        <div className="shell flex items-center gap-4">
          <div className="flex items-center gap-2" aria-label="Chuyển ảnh Hero">
            <button
              aria-label="Ảnh Hero trước"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/90 bg-white/70 text-lg font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              onClick={() => selectSlide(activeIndex - 1)}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Ảnh Hero tiếp theo"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/90 bg-white/70 text-lg font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              onClick={() => selectSlide(activeIndex + 1)}
              type="button"
            >
              →
            </button>
            <div className="ml-2 flex items-center gap-1.5" role="tablist" aria-label="Các ảnh Hero">
              {heroSlides.map((slide, index) => (
                <button
                  aria-label={`Chọn ảnh ${index + 1}`}
                  aria-selected={index === activeIndex}
                  className="grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  key={slide.id}
                  onClick={() => selectSlide(index)}
                  role="tab"
                  type="button"
                >
                  <span aria-hidden="true" className={`block h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-blue-700" : "w-2 bg-slate-400/70 hover:bg-blue-400"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
