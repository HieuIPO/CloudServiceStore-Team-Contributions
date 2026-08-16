"use client";

import { useEffect, useRef, useState } from "react";

export function AboutMotionController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-about-motion-root]");
    if (!root || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-about-motion]"));
    const line = root.querySelector<HTMLElement>("[data-about-timeline-line]");
    if (items.length === 0 && !line) return;

    root.dataset.aboutMotionReady = "true";
    items.forEach(item => item.style.setProperty("--about-motion-delay", `${Number(item.dataset.motionDelay ?? 0)}ms`));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.16 });

    if (line) observer.observe(line);
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return null;
}

export function AboutSlaValue({ value }: { value: number }) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const element = valueRef.current;
    if (!element || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const animate = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / 1100, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(value * easedProgress);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      setDisplayValue(0);
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      animate();
      observer.disconnect();
    }, { threshold: 0.45 });

    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span className="about-sla-value tabular-nums" ref={valueRef}>{displayValue.toFixed(1)}%</span>;
}
