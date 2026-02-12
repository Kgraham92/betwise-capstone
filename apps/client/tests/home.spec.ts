import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    // Check for main heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Check for CTA buttons
    await expect(page.getByRole("link", { name: /games/i })).toBeVisible();
  });

  test("should navigate to games page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /games/i }).click();

    await expect(page).toHaveURL(/.*games/);
  });
});
