import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
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

const required = [
  'rpc("complete_permanent_lesson"',
  "p_topic_id:",
  "p_correct_count:",
  "p_question_count:",
  "practiceFirstTry",
  "lessonTopicIdFor"
];
for (const fragment of required) {
  if (!html.includes(fragment)) throw new Error(`Frontend integration check failed: missing ${fragment}`);
}
if (/from\(["']lesson_progress["']\)\.update\(/.test(html)) {
  throw new Error("Direct lesson_progress completion UPDATE remains in the frontend.");
}

process.stdout.write(`Frontend syntax and integration checks passed (${checked} inline scripts).\n`);
