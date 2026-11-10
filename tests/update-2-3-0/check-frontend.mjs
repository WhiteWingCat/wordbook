import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const dailyScript = fs.readFileSync("daily-learning.js", "utf8");
new vm.Script(dailyScript, { filename: "daily-learning.js" });
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let checked = 0;

for (let i = 0; i < scripts.length; i += 1) {
  const attrs = scripts[i][1] || "";
  const source = scripts[i][2] || "";
  if (/\bsrc\s*=/.test(attrs)) continue;
  const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (type && !["text/javascript", "application/javascript"].includes(type)) continue;
  if (!source.trim()) continue;
  new vm.Script(source, { filename: `index-inline-${i + 1}.js` });
  checked += 1;
}

if (checked === 0) throw new Error("No inline JavaScript blocks were checked.");

const dateFnStart = html.indexOf("function datePartsInZone(");
const zoneFnStart = html.indexOf("function zonedMidnightUtc(", dateFnStart);
const zoneFnEnd = html.indexOf("async function loadLessonAllowance", zoneFnStart);
if (dateFnStart < 0 || zoneFnStart < 0 || zoneFnEnd < 0) {
  throw new Error("Timezone helper functions could not be located.");
}
const datePartsInZone = new Function(
  html.slice(dateFnStart, zoneFnStart) + "; return datePartsInZone;"
)();
const zonedMidnightUtc = new Function(
  "datePartsInZone",
  html.slice(zoneFnStart, zoneFnEnd) + "; return zonedMidnightUtc;"
)(datePartsInZone);

const assertTime = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
};
assertTime(zonedMidnightUtc("2026-11-10", "Asia/Kuala_Lumpur"), "2026-11-09T16:00:00.000Z", "Malaysia local midnight");
assertTime(zonedMidnightUtc("2026-11-10", "America/Los_Angeles"), "2026-11-10T08:00:00.000Z", "Los Angeles local midnight");
const springHours = (Date.parse(zonedMidnightUtc("2026-03-09", "America/New_York")) - Date.parse(zonedMidnightUtc("2026-03-08", "America/New_York"))) / 3600000;
const fallHours = (Date.parse(zonedMidnightUtc("2026-11-02", "America/New_York")) - Date.parse(zonedMidnightUtc("2026-11-01", "America/New_York"))) / 3600000;
if (springHours !== 23 || fallHours !== 25) {
  throw new Error(`DST boundary test failed: expected 23/25 hours, got ${springHours}/${fallHours}`);
}

const required = [
  'rpc("complete_permanent_lesson"',
  'rpc("record_completed_lesson_practice_result"',
  "saveCompletedLessonPractice",
  "p_topic_id:",
  "p_correct_count:",
  "p_question_count:",
  "practiceFirstTry",
  "lessonTopicIdFor",
  "const saved=Array.isArray(data)?data[0]:data"
];
for (const fragment of required) {
  if (!html.includes(fragment)) throw new Error(`Frontend integration check failed: missing ${fragment}`);
}
for (const fragment of ["start_daily_activity_session","complete_daily_activity_session","abandon_daily_activity_session","daily_topic_enabled","daily_revision","revisionCandidates","learningLanguage","firstTry"]) {
  if (!dailyScript.includes(fragment)) throw new Error(`Daily Learning integration check failed: missing ${fragment}`);
}
const languageDeclaration = dailyScript.indexOf('const language = prefs.learning_language || "en";');
const languageSnapshot = dailyScript.indexOf("learningLanguage:language");
if (languageDeclaration < 0 || languageSnapshot < 0 || languageDeclaration > languageSnapshot) {
  throw new Error("Daily Learning must declare the saved learning language before building its snapshot.");
}
for (const fragment of [
  'from("lesson_practice_results").select("topic_id,correct_count,question_count,attempted_at")',
  'from("daily_activity_sessions").select("topic_id,correct_count,question_count,completed_at")',
  'getElementById("practiceAccuracy").textContent',
  'getElementById("practiceTopicsDue").textContent',
  'getElementById("practiceSummaries").textContent'
]) {
  if (!html.includes(fragment)) throw new Error(`Profile practice insights check failed: missing ${fragment}`);
}
for (const fragment of ['data-page="daily-learning"','id="dailyLearningPage"','data-daily-pref=']) {
  if (!html.includes(fragment)) throw new Error(`Daily Learning page shell check failed: missing ${fragment}`);
}
for (const fragment of ["dailyTopics","dailyApplications","dailyDiscoveries","sourceUrl","learning_activity_log","lesson_practice_results"]) {
  if (!dailyScript.includes(fragment)) throw new Error(`Daily Learning content check failed: missing ${fragment}`);
}
if (dailyScript.includes('.from("daily_activity_sessions").insert(')
    || dailyScript.includes('.from("learning_activity_log").insert(')) {
  throw new Error("Daily Learning frontend must use server RPCs, not direct activity-log/session INSERTs.");
}


// Execute the Daily Learning loader with a mocked Supabase client.
// This catches runtime ordering errors that syntax-only checks cannot detect.
const mockElements = {
  dailyLearningPage: {},
  dailyLearningStatus: { textContent: "" },
  dailyActivityGrid: { innerHTML: "", querySelectorAll: () => [] }
};
const mockData = {
  user_preferences: {
    timezone: "Asia/Kuala_Lumpur",
    learning_language: "en",
    translation_language: "zh",
    daily_topic_enabled: true,
    daily_application_enabled: true,
    daily_discovery_enabled: true,
    daily_revision_enabled: true
  },
  user_entitlements: { plan_code: "free", status: "active", valid_from: null, valid_until: null },
  learning_plan_limits: ["daily_topic","daily_application","daily_discovery","daily_revision"]
    .map(activity_type => ({ activity_type, daily_limit: 1, is_enabled: true })),
  learning_activity_log: [],
  lesson_practice_results: [],
  daily_activity_sessions: [{
    activity_type: "daily_topic",
    content_id: "topic-present-perfect-01",
    topic_id: "verb-tenses",
    correct_count: null,
    question_count: null,
    completed_at: "2026-11-09T08:00:00.000Z",
    status: "completed"
  }]
};
const mockSupabase = {
  from(table) {
    return {
      select() { return this; },
      eq() { return this; },
      gte() { return this; },
      lt() { return this; },
      in() { return this; },
      order() { return this; },
      limit() { return this; },
      maybeSingle() { return Promise.resolve({ data: mockData[table], error: null }); },
      then(resolve, reject) {
        return Promise.resolve({ data: mockData[table] || [], error: null }).then(resolve, reject);
      }
    };
  },
  rpc() { throw new Error("RPC should not run during page initialisation"); }
};
const runtimeWindow = { addEventListener() {} };
const runtimeContext = {
  document: {
    getElementById(id) { return mockElements[id] || null; },
    querySelectorAll() { return []; }
  },
  window: runtimeWindow,
  location: { hash: "" },
  currentUser: { id: "test-user" },
  supabaseClient: mockSupabase,
  course: "en",
  translationLanguage: "zh",
  escapeHTML: value => String(value),
  browserTimezone: () => "UTC",
  localDayStart: () => "2026-11-10",
  zonedMidnightUtc: day => day + "T00:00:00.000Z",
  Date,
  Intl,
  Map,
  Set,
  Promise
};
vm.runInNewContext(dailyScript, runtimeContext, { filename: "daily-learning-runtime.js" });
await runtimeWindow.initialiseDailyLearning();
if (!mockElements.dailyLearningStatus.textContent.includes("Asia/Kuala_Lumpur")) {
  throw new Error("Daily Learning runtime fixture failed: " + mockElements.dailyLearningStatus.textContent);
}
for (const activity of ["daily_topic","daily_application","daily_discovery","daily_revision"]) {
  if (!mockElements.dailyActivityGrid.innerHTML.includes(`data-start-daily="${activity}"`)) {
    throw new Error(`Daily Learning runtime did not render ${activity}.`);
  }
}
if (mockElements.dailyActivityGrid.innerHTML.includes("Past simple or present perfect?")) {
  throw new Error("Daily Learning selected a previously completed topic as a new daily assignment.");
}
mockData.daily_activity_sessions = [
  "topic-present-perfect-01","topic-articles-01","topic-quantity-01","topic-sentence-order-01","topic-collocations-01"
].map(content_id => ({
  activity_type:"daily_topic",content_id,topic_id:"test-topic",
  correct_count:null,question_count:null,completed_at:"2026-11-09T08:00:00.000Z",status:"completed"
}));
await runtimeWindow.initialiseDailyLearning();
const topicCard = mockElements.dailyActivityGrid.innerHTML.split('data-activity-card="daily_topic"')[1] || "";
if (!topicCard.includes("No new content available") || !topicCard.includes("Review completed content")) {
  throw new Error("Daily Learning did not clearly label an exhausted content pool as a free replay.");
}

process.stdout.write(`Frontend syntax and integration checks passed (${checked} inline scripts).\n`);
