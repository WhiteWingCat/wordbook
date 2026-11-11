import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Keep browser CI isolated from the hosted project. The signed-out UI only
  // needs the public app shell; account-dependent flows are covered separately.
  await page.route("**/supabase-config.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: 'window.SWIFT_SUPABASE_CONFIG = { url: "", anonKey: "" };'
  }));
  await page.route("https://*.supabase.co/**", route => route.abort());
});

test("dictionary loads and remains usable in signed-out mode", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#dictionaryPage")).toBeVisible();
  await expect(page.locator("#search")).toBeVisible();
  await expect(page.locator(".word-card").first()).toBeVisible();
  await page.locator("#search").fill("hello");
  await expect(page.locator(".word-card").filter({ hasText: /^hello$/i })).toBeVisible();
});

test("lesson library renders and difficulty tabs switch independently", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-page="lessons"]').click();
  await expect(page.locator("#lessonsPage")).toBeVisible();
  await expect(page.locator("#lessonCards .lesson-card").first()).toBeVisible();
  await expect(page.locator("#lessonDifficultySummary")).toContainText("lessons");

  for (const difficulty of ["intermediate", "advanced", "beginner"]) {
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    await expect(page.locator(`[data-difficulty="${difficulty}"]`)).toHaveClass(/active/);
    await expect(page.locator("#lessonCards .lesson-card").first()).toBeVisible();
    await expect(page.locator("#lessonDifficultySummary")).toContainText("lessons");
  }

  // Opening a lesson without an account must not create local progress.
  await page.locator("#lessonCards .lesson-card").first().click();
  await expect(page.locator("#accountDialog")).toHaveClass(/open/);
  await expect(page.locator("#lessonReader")).toBeHidden();
});

test("Daily Learning does not expose account progress while signed out", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-page="daily-learning"]').click();
  await expect(page.locator("#dailyLearningPage")).toBeVisible();
  await expect(page.locator("#dailyLearningStatus")).toContainText("Sign in");
  await expect(page.locator("#dailyActivityGrid")).toBeEmpty();
  await expect(page.locator('[data-daily-pref="daily_topic_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_application_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_discovery_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_revision_enabled"]')).toBeChecked();
});

test("signed-out Profile route safely redirects to Dictionary", async ({ page }) => {
  await page.goto("/#profile");
  await expect(page.locator("#dictionaryPage")).toBeVisible();
  await expect(page.locator("#profilePage")).toBeHidden();
});
