import { expect, test } from "@playwright/test";

const pwa = "http://127.0.0.1:5274";

test.use({ serviceWorkers: "allow" });

test("service worker controls the PWA without caching commercial API responses", async ({ page }) => {
  await page.goto(pwa);
  await expect.poll(() => page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map((registration) => ({ scope: registration.scope, state: registration.active?.state ?? registration.installing?.state ?? registration.waiting?.state ?? "none" }));
  })).toContainEqual(expect.objectContaining({ state: "activated" }));
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "")).toContain("/sw.js");

  await page.route("**/api/commercial/catalog", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ establishments: [], generatedAt: new Date().toISOString() })
  }));
  await page.evaluate(() => fetch("/api/commercial/catalog").then((response) => response.json()));

  const cachedCommercialUrls = await page.evaluate(async () => {
    const names = await caches.keys();
    const entries = await Promise.all(names.map(async (name) => (await caches.open(name)).keys()));
    return entries.flat().map((request) => new URL(request.url).pathname).filter((path) => /^\/(?:api\/)?(?:commercial|payments)(?:\/|$)/.test(path));
  });
  expect(cachedCommercialUrls).toEqual([]);
});
