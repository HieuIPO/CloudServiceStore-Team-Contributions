import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const nextBinary = resolve(scriptDirectory, "../node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBinary, "build"], {
  env: { ...process.env, NODE_ENV: "production" },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
