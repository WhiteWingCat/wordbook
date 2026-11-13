import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const dailyScript = fs.readFileSync("daily-learning.js", "utf8");

new vm.Script(dailyScript, { filename: "daily-learning.js" });

function readCuratedArray(name) {
  const declaration = `const ${name} = [`;
  const start = dailyScript.indexOf(declaration);
  const end = dailyScript.indexOf("\n  ];", start);
  if (start < 0 || end < 0) throw new Error(`Could not locate curated array ${name}.`);
  const open = dailyScript.indexOf("[", start);
  return vm.runInNewContext(`(${dailyScript.slice(open, end + 4)})`);
}
const curated = {
  topics: readCuratedArray("dailyTopics"),
  applications: readCuratedArray("dailyApplications"),
  discoveries: readCuratedArray("dailyDiscoveries")
};
for (const [name, items, minimum] of [
  ["Daily Topic", curated.topics, 20],
  ["Daily Application", curated.applications, 20],
  ["Daily Discovery", curated.discoveries, 20]
]) {
  if (items.length < minimum) throw new Error(`${name} content pool too small: ${items.length}`);
  const ids = items.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${name} contains duplicate content IDs.`);
}
for (const item of curated.topics) {
  if (!item.topicId || !item.title || !item.body || !item.example || !item.zh) {
    throw new Error(`Daily Topic is missing required metadata or Chinese translation: ${item.id}`);
  }
}
for (const item of curated.applications) {
  if (!item.topicId || !item.questions?.length) {
    throw new Error(`Daily Application is missing topic, questions or translation: ${item.id}`);
  }
  for (const question of item.questions) {
    if (!question.q || !question.explanation || !question.zh
        || !Array.isArray(question.options) || question.options.length < 2
        || !Number.isInteger(question.answer) || question.answer < 0
        || question.answer >= question.options.length) {
      throw new Error(`Invalid Daily Application question in ${item.id}`);
    }
  }
}
for (const item of curated.discoveries) {
  if (!item.category || !item.title || !item.body || !item.example || !item.zh) {
    throw new Error(`Daily Discovery is missing required metadata or Chinese translation: ${item.id}`);
  }
}
const revisionTopicIds = [
  "sentence-basics","verb-tenses","nouns-and-articles","everyday-vocabulary",
  "nouns-and-quantity","phrasal-verbs","collocations","word-formation",
  "conditional-sentences","advanced-grammar","idioms-fixed-expressions",
  "academic-professional-english","precise-vocabulary"
];
for (const topicId of revisionTopicIds) {
  if (!curated.applications.some(item => item.topicId === topicId)) {
    throw new Error(`Adaptive revision has no application content for topic ${topicId}`);
  }
}

const revisionStart = dailyScript.indexOf("  function revisionCandidates(");
const revisionEnd = dailyScript.indexOf("\n  function chooseContent(", revisionStart);
if (revisionStart < 0 || revisionEnd < 0) throw new Error("Adaptive revision function could not be isolated for tests.");
const revisionFunction = dailyScript.slice(revisionStart, revisionEnd);
const fixedNow = Date.parse("2026-11-10T12:00:00.000Z");
const RevisionDate = class extends Date { static now() { return fixedNow; } };
const revisionRunner = vm.runInNewContext(
  `const dailyApplications = ${JSON.stringify(revisionTopicIds.map(topicId => ({ topicId })))};\n${revisionFunction}\nrevisionCandidates;`,
  { Date: RevisionDate, Map, Set }
);
const revisionRow = (topic_id, correct_count, question_count, daysAgo, id) => ({
  topic_id, correct_count, question_count,
  attempted_at: new Date(fixedNow - daysAgo * 86400000).toISOString(), id
});
const weakDue = revisionRunner([
  revisionRow("verb-tenses",1,3,3,"weak-old"),
  revisionRow("verb-tenses",1,3,2,"weak-new")
],[],[]);
const weakCandidate = weakDue.find(item => item.topicId === "verb-tenses");
if (!weakCandidate?.weak || !weakCandidate.due || weakCandidate.priority !== 0) {
  throw new Error("Adaptive revision failed to prioritise a sufficiently evidenced weak, overdue topic.");
}
const overdue = revisionRunner([
  revisionRow("collocations",3,3,20,"overdue-old"),
  revisionRow("collocations",3,3,20.1,"overdue-new")
],[],[]);
const overdueCandidate = overdue.find(item => item.topicId === "collocations");
if (!overdueCandidate?.due || overdueCandidate.weak || overdueCandidate.overdueDays < 5) {
  throw new Error("Adaptive revision failed to distinguish a strong but overdue topic from a weak topic.");
}
const improving = revisionRunner([
  revisionRow("word-formation",0,3,2,"improve-old"),
  revisionRow("word-formation",3,3,0.5,"improve-new")
],[],[]);
const improvingCandidate = improving.find(item => item.topicId === "word-formation");
if (!improvingCandidate?.improving || improvingCandidate.weak || !improvingCandidate.reason.includes("improvement")) {
  throw new Error("Adaptive revision did not recognise a clear recent improvement.");
}
const insufficient = revisionRunner([
  revisionRow("advanced-grammar",0,3,10,"single-attempt")
],[],[]);
const insufficientCandidate = insufficient.find(item => item.topicId === "advanced-grammar");
if (insufficientCandidate?.weak || !insufficientCandidate.reason.includes("not enough recent practice")) {
  throw new Error("Adaptive revision labelled a topic weak without the minimum evidence threshold.");
}
const usedToday = revisionRunner([
  revisionRow("idioms-fixed-expressions",0,3,5,"today-used")
],[],[{ activity_type:"daily_revision",topic_id:"idioms-fixed-expressions" }]);
if (usedToday.some(item => item.topicId === "idioms-fixed-expressions")) {
  throw new Error("Adaptive revision repeated a topic already completed today.");
}
const invalidHistory = revisionRunner([
  { topic_id:"precise-vocabulary",correct_count:9,question_count:3,attempted_at:"not-a-date" },
  { topic_id:"precise-vocabulary",correct_count:1,question_count:3,attempted_at:"2026-11-09T12:00:00.000Z" }
],[],[]);
const invalidCandidate = invalidHistory.find(item => item.topicId === "precise-vocabulary");
if (Math.abs((invalidCandidate?.accuracy ?? 0) - (1 / 3)) > 0.0001 || invalidCandidate?.weak
    || !invalidCandidate.reason.includes("not enough recent practice")) {
  throw new Error("Adaptive revision accepted malformed practice history as valid evidence.");
}

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

const effectiveZoneStart = html.indexOf("function effectiveAllowanceTimezone(");
const effectiveZoneEnd = html.indexOf("\n    function localDayStart(", effectiveZoneStart);
if (effectiveZoneStart < 0 || effectiveZoneEnd < 0) {
  throw new Error("Effective allowance timezone helper could not be located.");
}
const effectiveAllowanceTimezone = new Function(
  html.slice(effectiveZoneStart, effectiveZoneEnd) + "; return effectiveAllowanceTimezone;"
)();
const pendingUntil = "2026-11-11T00:00:00.000Z";
assertTime(
  effectiveAllowanceTimezone({
    timezone:"America/Los_Angeles",
    allowance_timezone:"Asia/Kuala_Lumpur",
    allowance_timezone_until:pendingUntil
  }, Date.parse("2026-11-10T12:00:00.000Z")),
  "Asia/Kuala_Lumpur",
  "Pending timezone change keeps previous allowance timezone"
);
assertTime(
  effectiveAllowanceTimezone({
    timezone:"America/Los_Angeles",
    allowance_timezone:"Asia/Kuala_Lumpur",
    allowance_timezone_until:pendingUntil
  }, Date.parse("2026-11-11T00:00:00.000Z")),
  "America/Los_Angeles",
  "New timezone becomes effective after preserved allowance boundary"
);
if (!html.includes("allowance_timezone,allowance_timezone_until")
    || !html.includes("new timezone takes effect after the current allowance day ends")) {
  throw new Error("Profile and lesson allowance UI do not explain/use deferred timezone changes.");
}
if (!dailyScript.includes("function effectiveAllowanceTimezone(")
    || !dailyScript.includes("allowance_timezone,allowance_timezone_until")
    || !dailyScript.includes("Your preferred timezone (")) {
  throw new Error("Daily Learning does not use or explain the effective allowance timezone.");
}

const dailyZoneStart = dailyScript.indexOf("  function effectiveAllowanceTimezone(");
const dailyZoneEnd = dailyScript.indexOf("\n\n  function selectedTranslation(", dailyZoneStart);
if (dailyZoneStart < 0 || dailyZoneEnd < 0) {
  throw new Error("Daily Learning effective timezone helper could not be isolated.");
}
const dailyEffectiveAllowanceTimezone = new Function(
  dailyScript.slice(dailyZoneStart, dailyZoneEnd) + "; return effectiveAllowanceTimezone;"
)();
assertTime(
  dailyEffectiveAllowanceTimezone({
    timezone:"America/Los_Angeles",
    allowance_timezone:"Asia/Kuala_Lumpur",
    allowance_timezone_until:pendingUntil
  }, Date.parse("2026-11-10T12:00:00.000Z")),
  "Asia/Kuala_Lumpur",
  "Daily Learning pending timezone remains aligned with the database"
);
assertTime(
  dailyEffectiveAllowanceTimezone({
    timezone:"America/Los_Angeles",
    allowance_timezone:"Asia/Kuala_Lumpur",
    allowance_timezone_until:pendingUntil
  }, Date.parse("2026-11-11T00:00:00.000Z")),
  "America/Los_Angeles",
  "Daily Learning adopts the new timezone after the boundary"
);

const required = [
  'rpc("complete_permanent_lesson"',
  'rpc("record_completed_lesson_practice_result"',
  'rpc("delete_my_learning_history"',
  'id="deleteLearningHistoryButton"',
  'id="learningHistoryDeleteStatus"',
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
for (const fragment of ["start_daily_activity_session","complete_daily_activity_session","abandon_daily_activity_session","get_my_learning_allowance_usage","daily_topic_enabled","daily_revision","revisionCandidates","learningLanguage","firstTry"]) {
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
if (html.includes('data-page="daily-learning"')) {
  throw new Error("Daily Learning must not be a separate top-level navigation destination.");
}
const lessonsShellStart = html.indexOf('<section id="lessonsPage"');
const dailySectionStart = html.indexOf('<section id="dailyLearningPage"');
const difficultyNavStart = html.indexOf('<div class="difficulty-tabs"');
if (lessonsShellStart < 0 || dailySectionStart < lessonsShellStart || difficultyNavStart < dailySectionStart) {
  throw new Error("Daily Learning must appear inside Lessons above the difficulty navigation.");
}
for (const fragment of ['id="dailyLearningPage"','data-daily-pref=','Your Dashboard','id="dashboardAvatar"','Favorite words','id="favoriteEnglishGrid"','id="favoriteChineseGrid"','id="preferencesPage"','Privacy and data','id="dashboardAllowanceBars"','id="practiceChart"','id="practiceReviewTopics"','id="activeLanguagesList"']) {
  if (!html.includes(fragment)) throw new Error(`Update 2.3.1 dashboard/navigation check failed: missing ${fragment}`);
}
const dashboardStart = html.indexOf('<section id="profilePage"');
const preferencesStart = html.indexOf('<section id="preferencesPage"');
const dashboardShell = html.slice(dashboardStart,preferencesStart);
const preferencesShell = html.slice(preferencesStart);
if (/Account preferences|Privacy and data/i.test(dashboardShell)
    || !/Account preferences/i.test(preferencesShell)
    || !/Privacy and data/i.test(preferencesShell)) {
  throw new Error("Account preferences and Privacy and Data must live in the dedicated Preferences page.");
}
for (const fragment of ["dailyTopics","dailyApplications","dailyDiscoveries","sourceUrl","get_my_learning_allowance_usage","lesson_practice_results"]) {
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
    user_id: "test-user",
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
  rpc(name) {
    if (name === "get_my_learning_allowance_usage") {
      return Promise.resolve({ data: [
        { activity_type:"lesson", used_count:0 },
        { activity_type:"daily_topic", used_count:0 },
        { activity_type:"daily_application", used_count:0 },
        { activity_type:"daily_discovery", used_count:0 },
        { activity_type:"daily_revision", used_count:0 }
      ], error:null });
    }
    throw new Error("Unexpected RPC during Daily Learning initialisation: " + name);
  }
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
const firstTopicCard = mockElements.dailyActivityGrid.innerHTML
  .split('data-activity-card="daily_topic"')[1]?.split('data-activity-card="daily_application"')[0] || "";
if (firstTopicCard.includes("Past simple or present perfect?")) {
  throw new Error("Daily Topic selected a previously completed assignment instead of unused content.");
}
mockData.daily_activity_sessions = curated.topics.map(item => item.id).map(content_id => ({
  user_id:"test-user",activity_type:"daily_topic",content_id,topic_id:"test-topic",
  correct_count:null,question_count:null,completed_at:"2026-11-09T08:00:00.000Z",status:"completed"
}));
await runtimeWindow.initialiseDailyLearning();
const topicCard = mockElements.dailyActivityGrid.innerHTML
  .split('data-activity-card="daily_topic"')[1]?.split('data-activity-card="daily_application"')[0] || "";
if (!topicCard.includes("Completed · replay is free") || !topicCard.includes("Review completed content")) {
  throw new Error("Daily Learning did not clearly label an exhausted content pool as a free replay.");
}

process.stdout.write(`Frontend syntax and integration checks passed (${checked} inline scripts).\n`);
