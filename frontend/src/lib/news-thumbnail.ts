const fallbackNewsImages = [
  "/hero/hero-cloud-01.webp",
  "/hero/hero-cloud-02.webp",
  "/hero/hero-cloud-03.webp",
  "/hero/hero-cloud-04.webp",
];

/** Keep visual-QA placeholder thumbnails from being stretched as article art. */
export function resolveNewsThumbnail(source?: string, index = 0) {
  const normalized = source?.trim();
  if (!normalized || normalized.endsWith("/window.svg")) {
    return fallbackNewsImages[Math.abs(index) % fallbackNewsImages.length];
  }
  return normalized;
}
