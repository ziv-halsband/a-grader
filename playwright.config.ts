import { defineConfig, devices } from "@playwright/test";

// End-to-end checks in a separate browser (its own storage: never touches the founder's tabs on :3000).
// Runs against a production build on :3031 (E2E_PORT overrides it, so parallel worktrees don't collide). "ipad" uses WebKit (Safari's engine) with touch, like the kids' iPad.
const port = process.env.E2E_PORT ?? "3031";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, locale: "he-IL", trace: "retain-on-failure" },
  projects: [
    { name: "ipad", use: { ...devices["iPad Mini"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
