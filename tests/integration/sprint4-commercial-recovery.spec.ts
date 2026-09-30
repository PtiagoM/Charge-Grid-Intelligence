import { expect, test } from "@playwright/test";

const admin = "http://127.0.0.1:5273";

test("Admin marks the last commercial reading stale during API outage and recovers automatically", async ({ page }) => {
  await page.goto(`${admin}/#/login`);
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();

  const syncWarning = page.locator(".api-sync-warning");
  await expect(syncWarning).toHaveCount(0);
  await page.route("**/commercial/snapshot", (route) => route.abort());
  await expect(syncWarning).toContainText("API indisponível · última leitura");

  await page.unroute("**/commercial/snapshot");
  await expect(syncWarning).toHaveCount(0);
});
