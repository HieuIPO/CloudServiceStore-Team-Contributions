import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/affiliate-public-client.tsx", import.meta.url), "utf8");

test("Affiliate form collects and sends promotion channels", () => {
  assert.match(source, /value=\{form\.channelDescription\}/);
  assert.match(source, /updateField\("channelDescription", event\.target\.value\)/);
  assert.match(source, /maxLength=\{500\}/);
  assert.match(source, /promotionChannels: form\.channelDescription/);
});

test("affiliate commission rows use a shared table border without a featured frame", () => {
  assert.match(source, /className="affiliate-commission-row border-t border-blue-50"/);
  assert.doesNotMatch(source, /border-2 border-blue-500/);
});
