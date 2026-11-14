import fs from "node:fs";
import assert from "node:assert/strict";

const dailySource = fs.readFileSync("daily-learning.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const migration = fs.readFileSync("docs/UPDATE-2.3.0-CONTENT-CATALOG-MIGRATION-DRAFT.sql", "utf8");

function arrayBlock(source, name) {
  const start = source.indexOf(`const ${name} = [`);
  assert.notEqual(start, -1, `Missing ${name} array`);
  const end = source.indexOf("\n  ];", start);
  assert.notEqual(end, -1, `Unclosed ${name} array`);
  return source.slice(start, end);
}

const frontendRows = [];
for (const [name, type] of [
  ["dailyTopics", "daily_topic"],
  ["dailyApplications", "daily_application"]
]) {
  const block = arrayBlock(dailySource, name);
  for (const match of block.matchAll(/\{\s*["']?id["']?\s*:\s*"([^"]+)"\s*,\s*["']?topicId["']?\s*:\s*"([^"]+)"\s*,\s*["']?difficulty["']?\s*:\s*"([^"]+)"/g)) {
    frontendRows.push([type, match[1], match[2], match[3], "en"].join("|"));
  }
}
{
  const core = arrayBlock(dailySource, "dailyDiscoveryCoreVocabulary");
  for (const match of core.matchAll(/\\{\\s*["']?id["']?\\s*:\\s*"([^"]+)"/g)) {
    frontendRows.push(["daily_discovery", match[1], null, null, "en"].join("|"));
  }
  const additional = arrayBlock(dailySource, "dailyDiscoveryAdditionalWords");
  for (const match of additional.matchAll(/\\["(discovery-word-[^"]+)"/g)) {
    frontendRows.push(["daily_discovery", match[1], null, null, "en"].join("|"));
  }
}

const topicMap = {
  "Sentence basics":"sentence-basics",
  "Verb tenses":"verb-tenses",
  "Nouns and articles":"nouns-and-articles",
  "Everyday vocabulary":"everyday-vocabulary",
  "Nouns and quantity":"nouns-and-quantity",
  "Phrasal verbs":"phrasal-verbs",
  "Collocations":"collocations",
  "Word formation":"word-formation",
  "Conditional sentences":"conditional-sentences",
  "Advanced grammar":"advanced-grammar",
  "Idioms and fixed expressions":"idioms-fixed-expressions",
  "Academic and professional English":"academic-professional-english",
  "Precise vocabulary":"precise-vocabulary"
};
const lessonStart = html.indexOf("const lessonData={");
assert.notEqual(lessonStart, -1, "Missing lessonData object");
const lessonEnd = html.indexOf("\n    };", lessonStart);
assert.notEqual(lessonEnd, -1, "Unclosed lessonData object");
const lessonBlock = html.slice(lessonStart, lessonEnd);
let difficulty = null;
for (const line of lessonBlock.split("\n")) {
  if (line.includes("beginner:[")) difficulty = "beginner";
  if (line.includes("intermediate:[")) difficulty = "intermediate";
  if (line.includes("advanced:[")) difficulty = "advanced";
  const id = line.match(/id\s*:\s*"([^"]+)"/)?.[1];
  const topicName = line.match(/topic\s*:\s*"([^"]+)"/)?.[1];
  if (id && topicName) {
    assert.ok(difficulty, `Missing difficulty for lesson ${id}`);
    assert.ok(topicMap[topicName], `Unknown lesson topic ${topicName}`);
    frontendRows.push(["permanent_lesson", id, topicMap[topicName], difficulty, "en"].join("|"));
  }
}

const sqlRows = [];
for (const match of migration.matchAll(/\('([^']+)','([^']+)',(null|'[^']*'),(null|'[^']*'),'en',true\)/g)) {
  const topic = match[3] === "null" ? null : match[3].slice(1, -1);
  const level = match[4] === "null" ? null : match[4].slice(1, -1);
  sqlRows.push([match[1], match[2], topic, level, "en"].join("|"));
}

const normalize = rows => rows.slice().sort();
assert.equal(new Set(frontendRows).size, frontendRows.length, "Frontend contains duplicate catalogue entries");
assert.equal(new Set(sqlRows).size, sqlRows.length, "SQL catalogue contains duplicate entries");
assert.equal(frontendRows.length, 161, `Expected 80 frontend content entries, found ${frontendRows.length}`);
assert.equal(sqlRows.length, 161, `Expected 80 SQL catalogue entries, found ${sqlRows.length}`);
assert.deepEqual(normalize(sqlRows), normalize(frontendRows), "SQL approved catalogue differs from frontend IDs/topic/difficulty metadata");

console.log("Approved content catalogue matches frontend exactly (161 entries; no answer-level content).");
