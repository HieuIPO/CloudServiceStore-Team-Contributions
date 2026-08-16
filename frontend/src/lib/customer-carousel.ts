export function cycleIndex(index: number, delta: number, length: number) {
  if (length <= 0) return 0;
  return ((index + delta) % length + length) % length;
}

export function visibleWindow<T>(items: T[], startIndex: number, count: number) {
  const visibleCount = Math.min(Math.max(count, 0), items.length);
  return Array.from(
    { length: visibleCount },
    (_, offset) => items[cycleIndex(startIndex, offset, items.length)],
  );
}

const publicCategoryKeywords: Record<string, string[]> = {
  vps: ["vps"],
  hosting: ["hosting"],
  cloud: ["cloud"],
  email: ["email", "mail"],
  ssl: ["ssl"],
};

export function filterByCategory<T extends { category: string; name?: string }>(items: T[], category: string) {
  if (category === "all") return items;

  const normalizedCategory = category.trim().toLocaleLowerCase("vi-VN");
  const keywords = publicCategoryKeywords[normalizedCategory] ?? [normalizedCategory];
  return items.filter((item) => {
    const searchableText = `${item.category} ${item.name ?? ""}`.toLocaleLowerCase("vi-VN");
    return keywords.some((keyword) => searchableText.includes(keyword));
  });
}
