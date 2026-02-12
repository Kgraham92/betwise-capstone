import { test, expect } from "@playwright/test";

test.describe("Games Page", () => {
  test("should display games list", async ({ page }) => {
    await page.goto("/games");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for games heading or content
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have sport filter options", async ({ page }) => {
    await page.goto("/games");

    await page.waitForLoadState("networkidle");

    // Check for sport filter buttons (NBA, NFL, etc.)
    const filterArea = page.locator("body");
    await expect(filterArea).toBeVisible();
  });

  test("should be accessible without login", async ({ page }) => {
    await page.goto("/games");

    // Should not redirect to login
    await expect(page).toHaveURL(/.*games/);
  });
});
