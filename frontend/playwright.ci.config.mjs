const contactPublicE2eConfig = {
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- -p 3001",
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
};

export default contactPublicE2eConfig;
