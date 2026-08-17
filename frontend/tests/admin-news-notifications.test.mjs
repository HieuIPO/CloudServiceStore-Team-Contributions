import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const componentsDirectory = path.resolve(process.cwd(), "src/components");

test("news admin feedback uses compact auto-closing toasts", () => {
  for (const fileName of ["admin-news-client.tsx", "admin-news-edit-client.tsx"]) {
    const source = fs.readFileSync(path.join(componentsDirectory, fileName), "utf8");

    assert.match(source, /admin-toast admin-toast-success/);
    assert.match(source, /admin-toast-progress/);
    assert.match(source, /aria-live="polite"/);
    assert.doesNotMatch(source, /p-3 bg-emerald-50 border border-emerald-200/);
  }
});
