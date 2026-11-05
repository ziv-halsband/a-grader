import { defineConfig, devices } from "@playwright/test";

// End-to-end checks in a separate browser (its own storage: never touches the founder's tabs on :3000).
// Runs against a production build on :3031. "ipad" uses WebKit (Safari's engine) with touch, like the kids' iPad.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3031", locale: "he-IL", trace: "retain-on-failure" },
  projects: [
    { name: "ipad", use: { ...devices["iPad Mini"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3031",
    url: "http://localhost:3031",
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
