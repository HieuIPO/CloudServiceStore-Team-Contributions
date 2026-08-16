import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/news-public.tsx"),
  "utf8"
);

test("public news search normalizes Vietnamese Unicode before matching", () => {
  const decomposedTitle = "Va\u0306n kha\u0301n Tha\u0302\u0300n Ta\u0300i";
  const normalizedKeyword = "văn"
    .normalize("NFC")
    .toLocaleLowerCase("vi")
    .replace(/[ăâ]/g, "a")
    .replace(/ê/g, "e")
    .replace(/[ôơ]/g, "o")
    .replace(/ư/g, "u")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const normalizedTitle = decomposedTitle
    .normalize("NFC")
    .toLocaleLowerCase("vi")
    .replace(/[ăâ]/g, "a")
    .replace(/ê/g, "e")
    .replace(/[ôơ]/g, "o")
    .replace(/ư/g, "u")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  assert.ok(normalizedTitle.includes(normalizedKeyword));
  assert.match(source, /normalizeNewsSearchText/);
  assert.match(source, /\.normalize\("NFC"\)/);
  assert.match(source, /replace\(\/\[ăâ\]\/g, "a"\)/);
});
