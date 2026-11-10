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
  "lessonTopicIdFor"
];
for (const fragment of required) {
  if (!html.includes(fragment)) throw new Error(`Frontend integration check failed: missing ${fragment}`);
}
for (const fragment of ["start_daily_activity_session","complete_daily_activity_session","daily_topic_enabled","daily_revision","revisionCandidates","record"]) {
  if (!dailyScript.includes(fragment)) throw new Error(`Daily Learning integration check failed: missing ${fragment}`);
}
for (const fragment of ['data-page="daily-learning"','id="dailyLearningPage"','data-daily-pref=']) {
  if (!html.includes(fragment)) throw new Error(`Daily Learning page shell check failed: missing ${fragment}`);
}
for (const fragment of ["dailyTopics","dailyApplications","dailyDiscoveries","sourceUrl","learning_activity_log","lesson_practice_results"]) {
  if (!dailyScript.includes(fragment)) throw new Error(`Daily Learning content check failed: missing ${fragment}`);
}
if (/from\(["']daily_activity_sessions["']\)\.insert\(/.test(dailyScript)
    || /from\(["']learning_activity_log["']\)\.insert\(/.test(dailyScript)) {
  throw new Error("Daily Learning frontend must use server RPCs, not direct activity-log/session INSERTs.");
}

if (/from\(["']lesson_progress["']\)\.update\(/.test(html)) {
  throw new Error("Direct lesson_progress completion UPDATE remains in the frontend.");
}

process.stdout.write(`Frontend syntax and integration checks passed (${checked} inline scripts).\n`);
