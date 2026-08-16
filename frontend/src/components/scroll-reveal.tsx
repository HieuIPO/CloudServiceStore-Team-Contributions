"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "0px 0px -48px", threshold: 0.08 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = { "--scroll-reveal-delay": `${delay}ms` } as CSSProperties;
  const classes = ["scroll-reveal", visible && "is-visible", className].filter(Boolean).join(" ");

  return <div className={classes} ref={elementRef} style={style}>{children}</div>;
}
