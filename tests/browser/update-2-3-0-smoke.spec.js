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

test("Daily Learning is integrated into Lessons and does not expose account progress while signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-page="daily-learning"]')).toHaveCount(0);
  await page.locator('[data-page="lessons"]').click();
  await expect(page.locator("#dailyLearningPage")).toBeVisible();
  const order = await page.evaluate(() => document.getElementById("dailyLearningPage").compareDocumentPosition(document.querySelector(".difficulty-tabs")));
  expect(order & 4).toBeTruthy();
  await expect(page.locator("#dailyLearningStatus")).toContainText("Sign in");
  await expect(page.locator("#dailyActivityGrid [data-activity-card]")).toHaveCount(4);
  await expect(page.locator("#dailyActivityGrid [data-start-daily]:disabled")).toHaveCount(4);
  await expect(page.locator('[data-daily-pref="daily_topic_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_application_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_discovery_enabled"]')).toBeChecked();
  await expect(page.locator('[data-daily-pref="daily_revision_enabled"]')).toBeChecked();
});

test("signed-out Dashboard route safely redirects to Dictionary", async ({ page }) => {
  await page.goto("/#profile");
  await expect(page.locator("#dictionaryPage")).toBeVisible();
  await expect(page.locator("#profilePage")).toBeHidden();
});

test("signed-in Daily Topic completes through the server RPC without answer-level data", async ({ page }) => {
  await installDailyLearningMock(page);
  await page.goto("/");
  await page.locator('[data-page="lessons"]').click();
  await expect(page.locator("#dailyLearningPage")).toBeVisible();
  const start = page.locator('#dailyActivityGrid [data-start-daily="daily_topic"]');
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator("#dailyActivityReader")).toBeVisible();
  await page.locator("#dailyActivityReader [data-complete-daily]").click();

  const dailyRpcNames = () => page.evaluate(() => window.__swiftDailyMock.rpcCalls
    .filter(call => ["start_daily_activity_session","complete_daily_activity_session"].includes(call.name))
    .map(call => call.name));
  await expect.poll(dailyRpcNames).toEqual(["start_daily_activity_session","complete_daily_activity_session"]);
  const calls = await page.evaluate(() => window.__swiftDailyMock.rpcCalls
    .filter(call => ["start_daily_activity_session","complete_daily_activity_session"].includes(call.name)));
  expect(calls[0].args.p_activity_type).toBe("daily_topic");
  expect(calls[1].args).toEqual({
    p_session_id: "daily-session-1",
    p_correct_count: null,
    p_question_count: null
  });
  expect(JSON.stringify(calls)).not.toMatch(/selectedAnswer|answerIndex|questionAnswer/i);
  await expect(page.locator('#dailyActivityGrid [data-activity-card="daily_topic"]'))
    .toContainText("0 / 1 completions remaining");
});

test("signed-in Daily Application submits only aggregate first-try results", async ({ page }) => {
  await installDailyLearningMock(page, "daily-user-b");
  await page.goto("/");
  await page.locator('[data-page="lessons"]').click();
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
        legacySchema: false,
        listeners: [],
        rpcCalls: [],
        sessions: [],
        allowanceUsage: [
          { activity_type: "lesson", used_count: 0 },
          { activity_type: "daily_topic", used_count: 0 },
          { activity_type: "daily_application", used_count: 0 },
          { activity_type: "daily_discovery", used_count: 0 },
          { activity_type: "daily_revision", used_count: 0 }
        ],
        tables: {
          profiles: [],
          saved_words: [],
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
          learning_plan_limits: ["daily_topic","daily_application","daily_discovery","daily_revision"].map(activity_type => ({ plan_code: "free", activity_type, daily_limit: 1, is_enabled: true })),
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
        let selectError = null;
        const q = {
          select(columns) {
            const selected = String(columns || "");
            if (state.legacySchema && table === "user_preferences" && selected.includes("allowance_timezone")) {
              selectError = { code:"PGRST204", message:"Could not find the allowance_timezone column in the user_preferences schema cache" };
            } else if (state.legacySchema && table === "learning_activity_log" && selected.includes("event_type")) {
              selectError = { code:"42703", message:"column learning_activity_log.event_type does not exist" };
            } else if (state.legacySchema && table === "daily_activity_sessions") {
              selectError = { code:"PGRST205", message:"Could not find the daily_activity_sessions table in the schema cache" };
            }
            return q;
          },
          eq(key, value) { filters[key] = { op: "eq", value }; return q; },
          in(key, value) { filters[key] = { op: "in", value }; return q; },
          gte(key, value) { filters[key] = { op: "gte", value }; return q; },
          lt(key, value) { filters[key] = { op: "lt", value }; return q; },
          order() { return q; },
          limit() { return q; },
          upsert() { return Promise.resolve({ data: null, error: null }); },
          maybeSingle() { return Promise.resolve({ data: selectError ? null : (rowsFor(table, filters)[0] || null), error: selectError }); },
          single() { return Promise.resolve({ data: selectError ? null : (rowsFor(table, filters)[0] || null), error: selectError }); },
          then(resolve, reject) { return Promise.resolve({ data: selectError ? null : rowsFor(table, filters), error: selectError }).then(resolve, reject); }
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
          if (name === "get_my_learning_allowance_usage") return state.legacySchema
            ? { data:null, error:{ code:"PGRST202", message:"Could not find the get_my_learning_allowance_usage function in the schema cache" } }
            : { data: state.allowanceUsage, error: null };
          if (name === "is_personal_learning_test_access") return { data: false, error: null };
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
            const allowance = state.allowanceUsage.find(row => row.activity_type === session.activity_type);
            if (allowance) allowance.used_count += 1;
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

test("Daily Revision is adaptive, abandonment is free, and Daily Discovery is unscored", async ({ page }) => {
  await installDailyLearningMock(page, "daily-behaviour-user");
  await page.goto("/");
  await page.evaluate(() => {
    const state = window.__swiftDailyMock;
    const now = Date.now();
    state.tables.lesson_practice_results = [
      { user_id:"daily-behaviour-user", topic_id:"verb-tenses", correct_count:1, question_count:3, attempted_at:new Date(now-2*86400000).toISOString() },
      { user_id:"daily-behaviour-user", topic_id:"verb-tenses", correct_count:1, question_count:3, attempted_at:new Date(now-86400000).toISOString() }
    ];
  });
  await page.locator('[data-page="lessons"]').click();

  await page.locator('#dailyActivityGrid [data-start-daily="daily_revision"]').click();
  await expect(page.locator("#dailyActivityReader #dailyQuestions .daily-question").first()).toBeVisible();
  const revisionStart = await page.evaluate(() => window.__swiftDailyMock.rpcCalls.find(call => call.name === "start_daily_activity_session" && call.args.p_activity_type === "daily_revision"));
  expect(revisionStart.args.p_source).toBe("adaptive_revision");
  expect(revisionStart.args.p_topic_id).toBe("verb-tenses");
  await page.locator("#dailyActivityReader [data-abandon-daily]").click();
  await expect(page.locator("#dailyLearningStatus")).toContainText("Session abandoned. No daily allowance was used.");
  const revisionUsage = await page.evaluate(() => window.__swiftDailyMock.allowanceUsage.find(row => row.activity_type === "daily_revision").used_count);
  expect(revisionUsage).toBe(0);

  await page.locator('#dailyActivityGrid [data-start-daily="daily_discovery"]').click();
  await expect(page.locator("#dailyActivityReader")).toBeVisible();
  await expect(page.locator("#dailyActivityReader #dailyQuestions")).toHaveCount(0);
  await page.locator("#dailyActivityReader [data-complete-daily]").click();
  await expect(page.locator("#dailyLearningStatus")).toContainText("Activity completed successfully.");
  const discovery = await page.evaluate(() => ({
    call: window.__swiftDailyMock.rpcCalls.find(call => call.name === "complete_daily_activity_session"),
    session: window.__swiftDailyMock.sessions.find(row => row.activity_type === "daily_discovery"),
    used: window.__swiftDailyMock.allowanceUsage.find(row => row.activity_type === "daily_discovery").used_count
  }));
  expect(discovery.call.args.p_correct_count).toBeNull();
  expect(discovery.call.args.p_question_count).toBeNull();
  expect(discovery.session.status).toBe("completed");
  expect(discovery.used).toBe(1);
});

test("Dashboard shows saved words, course recency, ledger allowances and practice insights; Preferences stays separate", async ({ page }) => {
  const userId = "dashboard-user";
  await installDailyLearningMock(page, userId);
  await page.goto("/");
  await page.evaluate(userId => {
    const state = window.__swiftDailyMock;
    const now = Date.now();
    state.tables.profiles = [{ user_id:userId, display_name:"Learner", avatar_icon:"🦊" }];
    state.tables.saved_words = [
      { user_id:userId, course:"en", word:"hello" },
      { user_id:userId, course:"zh", word:"你" }
    ];
    state.tables.learning_activity_log = [
      { user_id:userId, activity_type:"lesson", event_type:"completed", language_code:"en", created_at:new Date(now-2*86400000).toISOString() },
      { user_id:userId, activity_type:"lesson", event_type:"completed", language_code:"zh", created_at:new Date(now-3600000).toISOString() }
    ];
    state.tables.user_entitlements = [{ user_id:userId, plan_code:"free", status:"active", valid_from:null, valid_until:null }];
    state.tables.learning_plan_limits = [
      { plan_code:"free", activity_type:"lesson", daily_limit:5, is_enabled:true },
      ...["daily_topic","daily_application","daily_discovery","daily_revision"].map(activity_type => ({ plan_code:"free", activity_type, daily_limit:1, is_enabled:true }))
    ];
    state.allowanceUsage = [
      { activity_type:"lesson", used_count:2 },
      { activity_type:"daily_topic", used_count:1 },
      { activity_type:"daily_application", used_count:0 },
      { activity_type:"daily_discovery", used_count:0 },
      { activity_type:"daily_revision", used_count:0 }
    ];
    state.tables.lesson_practice_results = [
      { user_id:userId, topic_id:"sentence-basics", correct_count:1, question_count:3, attempted_at:new Date(now-2*86400000).toISOString() },
      { user_id:userId, topic_id:"sentence-basics", correct_count:1, question_count:3, attempted_at:new Date(now-86400000).toISOString() }
    ];
    state.tables.daily_activity_sessions = [];
  }, userId);

  await page.locator("#accountButton").click();
  await page.locator("#menuProfile").click();
  await expect(page.locator("#profilePage")).toBeVisible();
  await expect(page.locator("#profileHeading")).toHaveText("Your Dashboard");
  await expect(page.locator("#dashboardAvatar")).toHaveText("🦊");
  await expect(page.locator("#activeLanguagesList .active-language-row").first()).toContainText("简体中文");
  await expect(page.locator("#activeLanguagesList .active-language-row").first()).toContainText("Last active");
  await expect(page.locator("#dashboardAllowanceBars")).toContainText("3 of 5 remaining");
  await expect(page.locator("#dashboardAllowanceBars")).toContainText("0 of 1 remaining");
  await expect(page.locator("#practiceAccuracy")).toHaveText("33%");
  await expect(page.locator("#practiceReviewTopics")).toContainText("Sentence Basics");
  await page.locator("#favoriteEnglishGrid").locator("xpath=..").locator("summary").click();
  await expect(page.locator("#favoriteEnglishGrid .word-card")).toContainText("hello");
  await page.locator("#favoriteChineseGrid").locator("xpath=..").locator("summary").click();
  await expect(page.locator("#favoriteChineseGrid .word-card")).toContainText("你");

  await page.locator("#accountButton").click();
  await page.locator("#menuPreferences").click();
  await expect(page.locator("#preferencesPage")).toBeVisible();
  await expect(page.locator("#preferencesPage")).toContainText("Account preferences");
  await expect(page.locator("#preferencesPage")).toContainText("Privacy and data");
  await expect(page.locator("#profilePage")).toBeHidden();
});

test("Dashboard remains readable on the legacy 2.2 database while Daily Learning waits for migrations", async ({ page }) => {
  const userId = "legacy-dashboard-user";
  await installDailyLearningMock(page, userId);
  await page.goto("/");
  await page.evaluate(userId => {
    const state = window.__swiftDailyMock;
    state.legacySchema = true;
    state.tables.profiles = [{ user_id:userId, display_name:"Legacy Learner", avatar_icon:"🐼" }];
    state.tables.user_preferences = [{ user_id:userId, learning_language:"en", translation_language:"zh", timezone:"Asia/Kuala_Lumpur" }];
    state.tables.user_entitlements = [{ user_id:userId, plan_code:"free", status:"active", valid_from:null, valid_until:null }];
    state.tables.learning_plan_limits = [{ plan_code:"free", activity_type:"lesson", daily_limit:5, is_enabled:true }];
    state.tables.learning_activity_log = [{ user_id:userId, activity_type:"lesson", language_code:"en", created_at:new Date().toISOString() }];
    state.tables.saved_words = [{ user_id:userId, course:"en", word:"hello" }];
    state.tables.lesson_practice_results = [];
    state.tables.daily_activity_sessions = [];
  }, userId);

  await page.locator("#accountButton").click();
  await page.locator("#menuProfile").click();
  await expect(page.locator("#profilePage")).toBeVisible();
  await expect(page.locator("#profileHeading")).toHaveText("Your Dashboard");
  await expect(page.locator("#favoriteEnglishGrid")).toContainText("hello");
  await expect(page.locator("#activeLanguagesList")).toContainText("English");
  await expect(page.locator("#dashboardAllowanceBars")).toContainText("Usage unavailable");
  await expect(page.locator("#allowanceDetails")).toContainText("Counts are not estimated from learning history.");
  await expect(page.locator("#practiceInsightsDetails")).toContainText("Daily activity practice data will appear after the matching server update");

  await page.locator('[data-page="lessons"]').click();
  await expect(page.locator("#dailyLearningStatus")).toContainText("matching server database update has not been applied yet");
  await expect(page.locator("#dailyActivityGrid")).toContainText("waiting for a server update");
});

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
