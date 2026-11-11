const { test, expect } = require("@playwright/test");

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
  await expect(page.locator("#dailyActivityGrid [data-activity-card]")).toHaveCount(4);
  await expect(page.locator("#dailyActivityGrid [data-start-daily]:disabled")).toHaveCount(4);
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

async function installMockSupabase(page, initialUser = null) {
  await page.unroute("**/supabase-config.js");
  await page.route("**/supabase-config.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `window.SWIFT_SUPABASE_CONFIG = { url: "https://swift-test.supabase.co", anonKey: "test-publishable-key" };
window.__SWIFT_TEST_INITIAL_USER = ${JSON.stringify(initialUser)};`
  }));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `(() => {
      const state = {
        user: window.__SWIFT_TEST_INITIAL_USER || null,
        listeners: [],
        oauthCalls: [],
        setUser(user) {
          this.user = user;
          const session = user ? { user } : null;
          this.listeners.forEach(listener => listener(user ? "SIGNED_IN" : "SIGNED_OUT", session));
        }
      };
      function query() {
        const q = {
          select() { return q; }, eq() { return q; }, neq() { return q; },
          gte() { return q; }, gt() { return q; }, lte() { return q; }, lt() { return q; },
          order() { return q; }, limit() { return q; }, insert() { return q; },
          update() { return q; }, delete() { return q; },
          upsert() { return Promise.resolve({ data: null, error: null }); },
          maybeSingle() { return Promise.resolve({ data: null, error: null }); },
          single() { return Promise.resolve({ data: null, error: null }); },
          then(resolve, reject) { return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject); }
        };
        return q;
      }
      const client = {
        auth: {
          async getSession() { state.user = window.__SWIFT_TEST_INITIAL_USER || state.user; return { data: { session: state.user ? { user: state.user } : null }, error: null }; },
          onAuthStateChange(callback) { state.listeners.push(callback); return { data: { subscription: { unsubscribe() {} } } }; },
          async signInWithOAuth(options) { state.oauthCalls.push(options); return { data: {}, error: null }; },
          async signOut() { state.setUser(null); return { error: null }; }
        },
        from() { return query(); },
        async rpc() { return { data: false, error: null }; }
      };
      window.__swiftTestAuth = state;
      window.supabase = { createClient() { return client; } };
    })();`
  }));
}

test("Google sign-in requests account selection and a stable callback URL", async ({ page }) => {
  await installMockSupabase(page);
  await page.goto("/");
  await page.locator("#accountButton").click();
  await page.locator("#menuSignIn").click();
  await expect(page.locator("#accountDialog")).toHaveClass(/open/);
  await page.locator("#googleSignIn").click();
  await expect.poll(() => page.evaluate(() => window.__swiftTestAuth.oauthCalls.length)).toBe(1);
  const call = await page.evaluate(() => window.__swiftTestAuth.oauthCalls[0]);
  expect(call.provider).toBe("google");
  expect(call.options.queryParams.prompt).toBe("select_account");
  expect(call.options.redirectTo).toBe(new URL("/", page.url()).origin + "/");
});

test("account switching clears the previous account state before another sign-in", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("swiftdictionary-saved", JSON.stringify(["hello", "world"])));
  await installMockSupabase(page, { id: "account-a", email: "first@example.test" });
  await page.goto("/");
  await expect(page.locator("#accountButtonLabel")).toHaveText("Account");
  await expect(page.locator("#accountStatus")).toContainText("Signed in as first@example.test");
  expect(await page.evaluate(() => localStorage.getItem("swiftdictionary-saved"))).toBeNull();

  await page.locator("#accountButton").click();
  await expect(page.locator("#menuSwitchAccount")).toBeVisible();
  await page.locator("#menuSwitchAccount").click();
  await expect(page.locator("#accountDialog")).toHaveClass(/open/);
  await expect(page.locator("#accountButtonLabel")).toHaveText("Sign in");
  await expect(page.locator("#menuSignIn")).toBeVisible();
  await expect(page.locator("#menuSwitchAccount")).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("swiftdictionary-saved"))).toBeNull();

  await page.evaluate(() => window.__swiftTestAuth.setUser({ id: "account-b", email: "second@example.test" }));
  await expect(page.locator("#accountStatus")).toContainText("Signed in as second@example.test");
  expect(await page.evaluate(() => localStorage.getItem("swiftdictionary-saved"))).toBeNull();
});
