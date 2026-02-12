import { test, expect } from "@playwright/test";

test.describe("Trends Page (Protected)", () => {
  test("should show login prompt for unauthenticated users", async ({ page }) => {
    await page.goto("/trends");

    // Should show login/register options for unauthenticated users
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
  });

  test("should have working login link", async ({ page }) => {
    await page.goto("/trends");

    await page.getByRole("link", { name: /log in/i }).click();

    await expect(page).toHaveURL(/.*login/);
  });
});
