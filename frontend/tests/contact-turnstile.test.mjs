import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../src/components/contact-public-client.tsx", import.meta.url), "utf8");
const api = await readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8");

test("Contact form renders Turnstile only when a public site key is configured", () => {
  assert.match(component, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(component, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/);
  assert.match(component, /action: "contact_submit"/);
  assert.match(component, /turnstileToken: turnstileSiteKey \? turnstileToken : undefined/);
});

test("Contact client sends only the Turnstile token to the backend and never a secret key", () => {
  assert.match(api, /turnstileToken\?: string/);
  assert.doesNotMatch(component, /TURNSTILE_SECRET_KEY/);
  assert.doesNotMatch(component, /ContactTurnstile__SecretKey/);
});
