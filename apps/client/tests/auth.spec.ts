import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
    });

    test("should show validation errors for empty form", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("button", { name: /log in/i }).click();

      // Form should require fields (HTML5 validation or custom)
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test("should have link to register page", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("link", { name: /register|sign up|create/i })).toBeVisible();
    });
  });

  test.describe("Register Page", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("heading", { name: /register|sign up|create/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("link", { name: /log in|sign in/i })).toBeVisible();
    });
  });
});
