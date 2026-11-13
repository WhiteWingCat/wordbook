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

test("signed-in Daily Topic completes through the server RPC without answer-level data", async ({ page }) => {
  await installDailyLearningMock(page);
  await page.goto("/");
  await page.locator('[data-page="daily-learning"]').click();
  await expect(page.locator("#dailyLearningPage")).toBeVisible();
  const start = page.locator('#dailyActivityGrid [data-start-daily="daily_topic"]');
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator("#dailyActivityReader")).toBeVisible();
  await page.locator("#dailyActivityReader [data-complete-daily]").click();

  await expect.poll(() => page.evaluate(() => window.__swiftDailyMock.rpcCalls.map(call => call.name)))
    .toEqual(["start_daily_activity_session", "complete_daily_activity_session"]);
  const calls = await page.evaluate(() => window.__swiftDailyMock.rpcCalls);
  expect(calls[0].args.p_activity_type).toBe("daily_topic");
  expect(calls[1].args).toEqual({
    p_session_id: "daily-session-1",
    p_correct_count: null,
    p_question_count: null
  });
  expect(JSON.stringify(calls)).not.toMatch(/selectedAnswer|answerIndex|questionAnswer/i);
  await expect(page.locator('#dailyActivityGrid [data-activity-card="daily_topic"]'))
    .toContainText("No new content available");
});

test("signed-in Daily Application submits only aggregate first-try results", async ({ page }) => {
  await installDailyLearningMock(page, "daily-user-b");
  await page.goto("/");
  await page.locator('[data-page="daily-learning"]').click();
  const start = page.locator('#dailyActivityGrid [data-start-daily="daily_application"]');
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator("#dailyActivityReader #dailyQuestions .daily-question").first()).toBeVisible();

  const questions = page.locator("#dailyActivityReader #dailyQuestions .daily-question");
  const count = await questions.count();
  expect(count).toBeGreaterThan(0);

  // Try the first option first. If it is wrong, keep trying until the UI accepts
  // a correct option; the first-try score must remain unchanged.
  let firstTryCorrect = 0;
  for (let i = 0; i < count; i += 1) {
    const question = questions.nth(i);
    const options = question.locator('input[type="radio"]');
    const optionCount = await options.count();
    await options.nth(0).check();
  }
  await page.locator("#dailyActivityReader [data-check-daily]").click();
  for (let i = 0; i < count; i += 1) {
    const question = questions.nth(i);
    let feedback = await question.locator(".daily-question-feedback").textContent();
    if (feedback.includes("Correct.")) {
      firstTryCorrect += 1;
      continue;
    }
    const options = question.locator('input[type="radio"]');
    const optionCount = await options.count();
    let solved = false;
    for (let option = 1; option < optionCount; option += 1) {
      await options.nth(option).check();
      await page.locator("#dailyActivityReader [data-check-daily]").click();
      feedback = await question.locator(".daily-question-feedback").textContent();
      if (feedback.includes("Correct.")) { solved = true; break; }
    }
    expect(solved).toBeTruthy();
  }

  const complete = page.locator("#dailyActivityReader [data-complete-daily]");
  await expect(complete).toBeVisible();
  await complete.click();
  await expect.poll(() => page.evaluate(() => window.__swiftDailyMock.rpcCalls.filter(call => call.name === "complete_daily_activity_session").length)).toBe(1);

  const result = await page.evaluate(() => {
    const call = window.__swiftDailyMock.rpcCalls.find(item => item.name === "complete_daily_activity_session");
    return { args: call.args, session: window.__swiftDailyMock.sessions[0] };
  });
  expect(result.args.p_correct_count).toBe(firstTryCorrect);
  expect(result.args.p_question_count).toBe(count);
  expect(Object.keys(result.args).sort()).toEqual(["p_correct_count","p_question_count","p_session_id"]);
  expect(result.session.status).toBe("completed");
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
        user: null,
        initialized: false,
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
          async getSession() { if (!state.initialized) { state.user = window.__SWIFT_TEST_INITIAL_USER || null; state.initialized = true; } return { data: { session: state.user ? { user: state.user } : null }, error: null }; },
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

async function installDailyLearningMock(page, userId = "daily-user-a") {
  await page.unroute("**/supabase-config.js");
  await page.route("**/supabase-config.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `window.SWIFT_SUPABASE_CONFIG = { url: "https://swift-test.supabase.co", anonKey: "test-publishable-key" };
window.__SWIFT_TEST_INITIAL_USER = { id: ${JSON.stringify(userId)}, email: ${JSON.stringify(userId + "@example.test")} };`
  }));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `(() => {
      const state = {
        user: null,
        listeners: [],
        rpcCalls: [],
        sessions: [],
        tables: {
          user_preferences: [{
            user_id: ${JSON.stringify(userId)},
            timezone: "Asia/Kuala_Lumpur",
            learning_language: "en",
            translation_language: "zh",
            daily_topic_enabled: true,
            daily_application_enabled: true,
            daily_discovery_enabled: true,
            daily_revision_enabled: true
          }],
          user_entitlements: [{ user_id: ${JSON.stringify(userId)}, plan_code: "free", status: "active", valid_from: null, valid_until: null }],
          learning_plan_limits: ["daily_topic","daily_application","daily_discovery","daily_revision"].map(activity_type => ({ activity_type, daily_limit: 1, is_enabled: true })),
          learning_activity_log: [],
          lesson_practice_results: [],
          daily_activity_sessions: []
        },
        setUser(user) {
          this.user = user;
          this.listeners.forEach(listener => listener(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user } : null));
        }
      };
      function rowsFor(table, filters) {
        let rows = state.tables[table] || [];
        if (!Array.isArray(rows)) rows = [rows];
        return rows.filter(row => Object.entries(filters).every(([key, rule]) => {
          const value = row[key];
          if (rule.op === "eq") return value === rule.value;
          if (rule.op === "in") return rule.value.includes(value);
          if (rule.op === "gte") return value >= rule.value;
          if (rule.op === "lt") return value < rule.value;
          return true;
        }));
      }
      function query(table) {
        const filters = {};
        const q = {
          select() { return q; },
          eq(key, value) { filters[key] = { op: "eq", value }; return q; },
          in(key, value) { filters[key] = { op: "in", value }; return q; },
          gte(key, value) { filters[key] = { op: "gte", value }; return q; },
          lt(key, value) { filters[key] = { op: "lt", value }; return q; },
          order() { return q; },
          limit() { return q; },
          maybeSingle() { return Promise.resolve({ data: rowsFor(table, filters)[0] || null, error: null }); },
          single() { return Promise.resolve({ data: rowsFor(table, filters)[0] || null, error: null }); },
          then(resolve, reject) { return Promise.resolve({ data: rowsFor(table, filters), error: null }).then(resolve, reject); }
        };
        return q;
      }
      const client = {
        auth: {
          async getSession() { state.user = window.__SWIFT_TEST_INITIAL_USER || null; return { data: { session: state.user ? { user: state.user } : null }, error: null }; },
          onAuthStateChange(callback) { state.listeners.push(callback); return { data: { subscription: { unsubscribe() {} } } }; },
          async signInWithOAuth() { return { data: {}, error: null }; },
          async signOut() { state.setUser(null); return { error: null }; }
        },
        from(table) { return query(table); },
        async rpc(name, args) {
          state.rpcCalls.push({ name, args: structuredClone(args) });
          if (name === "start_daily_activity_session") {
            const existing = state.sessions.find(row => row.activity_type === args.p_activity_type && row.status === "in_progress");
            if (existing) return { data: existing, error: null };
            const session = {
              id: "daily-session-" + (state.sessions.length + 1),
              user_id: state.user.id,
              activity_type: args.p_activity_type,
              content_id: args.p_content_id,
              topic_id: args.p_topic_id,
              difficulty: args.p_difficulty,
              source: args.p_source,
              status: "in_progress",
              completed_at: null,
              correct_count: null,
              question_count: null
            };
            state.sessions.push(session);
            state.tables.daily_activity_sessions = state.sessions;
            return { data: session, error: null };
          }
          if (name === "complete_daily_activity_session") {
            const session = state.sessions.find(row => row.id === args.p_session_id);
            if (!session) return { data: null, error: { message: "Session not found" } };
            Object.assign(session, {
              status: "completed",
              completed_at: new Date().toISOString(),
              correct_count: args.p_correct_count,
              question_count: args.p_question_count
            });
            state.tables.daily_activity_sessions = state.sessions;
            state.tables.learning_activity_log.push({
              user_id: state.user.id,
              activity_type: session.activity_type,
              event_type: "completed",
              created_at: session.completed_at
            });
            return { data: session, error: null };
          }
          if (name === "abandon_daily_activity_session") {
            const session = state.sessions.find(row => row.id === args.p_session_id);
            if (!session) return { data: null, error: { message: "Session not found" } };
            session.status = "abandoned";
            return { data: session, error: null };
          }
          return { data: null, error: null };
        }
      };
      window.__swiftDailyMock = state;
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
  await page.locator("#accountClose").click();
  await page.locator("#accountButton").click();
  await expect(page.locator("#menuSignIn")).toBeVisible();
  await expect(page.locator("#menuSwitchAccount")).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("swiftdictionary-saved"))).toBeNull();

  await page.evaluate(() => window.__swiftTestAuth.setUser({ id: "account-b", email: "second@example.test" }));
  await expect(page.locator("#accountStatus")).toContainText("Signed in as second@example.test");
  expect(await page.evaluate(() => localStorage.getItem("swiftdictionary-saved"))).toBeNull();
});
