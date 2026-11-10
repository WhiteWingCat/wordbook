/* SwiftDictionary Update 2.3.0 — Daily Learning page.
   Daily session writes use the server-side start/complete RPCs only.
   Answer selections remain in memory; only aggregate outcomes are submitted. */
(() => {
  const preferenceKeys = [
    "daily_topic_enabled",
    "daily_application_enabled",
    "daily_discovery_enabled",
    "daily_revision_enabled"
  ];
  const activityMeta = {
    daily_topic: { title: "Daily Topic", label: "Learn one focused idea", description: "A short guided explanation with examples." },
    daily_application: { title: "Daily Application", label: "Use what you know", description: "Apply grammar and vocabulary in practical contexts." },
    daily_discovery: { title: "Daily Discovery", label: "Explore something new", description: "A mixed collection of language facts, expressions and common mistakes." },
    daily_revision: { title: "Daily Revision", label: "Strengthen your memory", description: "An adaptive review chosen from your learning history." }
  };

  const dailyTopics = [
    { id:"topic-present-perfect-01", topicId:"verb-tenses", difficulty:"intermediate", title:"Past simple or present perfect?", body:"Use the past simple for a finished action at a finished time. Use the present perfect when the time is not specified or the past action connects to the present.", example:"I visited Penang last year. / I have visited Penang several times.", zh:"已结束且时间明确的动作通常用一般过去时；没有说明具体过去时间，或强调与现在的联系时，常用现在完成时。", zhExample:"我去年去了槟城。/ 我去过槟城好几次。" },
    { id:"topic-articles-01", topicId:"nouns-and-articles", difficulty:"beginner", title:"Choose a or an by sound", body:"Use a before a consonant sound and an before a vowel sound. The first written letter does not always decide the choice.", example:"a university / an umbrella / an honest answer", zh:"a 或 an 的选择取决于后面的发音，而不只是拼写的第一个字母。", zhExample:"a university / an umbrella / an honest answer" },
    { id:"topic-quantity-01", topicId:"nouns-and-quantity", difficulty:"beginner", title:"Countable and uncountable nouns", body:"Countable nouns can form plurals and take numbers. Uncountable nouns are treated as amounts; use a quantity phrase when you need to count them.", example:"three suggestions / some advice / two pieces of advice", zh:"可数名词可以用数字计数并有复数形式；不可数名词通常表示整体或数量，需要用量词表达具体件数。", zhExample:"three suggestions / some advice / two pieces of advice" },
    { id:"topic-sentence-order-01", topicId:"sentence-basics", difficulty:"beginner", title:"Build a clear English sentence", body:"A common English statement follows subject + verb + object. Time and place details often come after the main clause.", example:"Maya (subject) sent (verb) the report (object) yesterday.", zh:"英语陈述句常见的基本语序是主语 + 动词 + 宾语，时间和地点信息通常放在主要结构之后。", zhExample:"Maya（主语）sent（动词）the report（宾语）yesterday。" },
    { id:"topic-collocations-01", topicId:"collocations", difficulty:"intermediate", title:"Learn words in natural pairs", body:"A collocation is a combination that English speakers commonly use together. Learning the whole phrase helps your writing sound more natural.", example:"make a decision / take responsibility / heavy rain", zh:"搭配是英语中经常一起出现的词语组合。整组记忆比单独背词更容易写出自然的表达。", zhExample:"make a decision / take responsibility / heavy rain" }
  ];

  const dailyApplications = [
    { id:"application-verb-patterns-01", topicId:"verb-tenses", difficulty:"intermediate", title:"Verb patterns in everyday plans", questions:[
      { q:"I look forward to _____ from you.", options:["hear","hearing","heard"], answer:1, explanation:"In look forward to, to is a preposition, so a following verb uses the -ing form.", zh:"look forward to 中的 to 是介词，后接动词时使用 -ing 形式。" },
      { q:"They decided _____ the earlier train.", options:["take","taking","to take"], answer:2, explanation:"Decide is commonly followed by a to-infinitive.", zh:"decide 后面通常接 to + 动词原形。" }
    ]},
    { id:"application-articles-01", topicId:"nouns-and-articles", difficulty:"beginner", title:"Articles in real sentences", questions:[
      { q:"She gave us _____ useful suggestion.", options:["a","an","the"], answer:0, explanation:"Useful begins with the consonant sound /j/, so use a.", zh:"useful 的开头是辅音音素 /j/，所以使用 a。" },
      { q:"It was _____ unusual experience.", options:["a","an","no article"], answer:1, explanation:"Unusual begins with a vowel sound, so use an.", zh:"unusual 以元音音素开头，所以使用 an。" }
    ]},
    { id:"application-quantity-01", topicId:"nouns-and-quantity", difficulty:"beginner", title:"Choose the right quantity word", questions:[
      { q:"We received _____ emails this morning than yesterday.", options:["less","fewer","little"], answer:1, explanation:"Emails are countable plural items, so fewer is the standard choice.", zh:"emails 是可数复数名词，标准用法使用 fewer。" },
      { q:"There is _____ information in this short note.", options:["fewer","many","less"], answer:2, explanation:"Information is uncountable, so use less.", zh:"information 是不可数名词，因此使用 less。" }
    ]},
    { id:"application-say-tell-01", topicId:"sentence-basics", difficulty:"intermediate", title:"Say or tell?", questions:[
      { q:"Please _____ me what happened.", options:["say","tell","speak"], answer:1, explanation:"Tell normally takes the listener as its object: tell me, tell us, tell them.", zh:"tell 后面通常直接接听话的人作宾语，例如 tell me、tell us。" },
      { q:"What did she say _____ you?", options:["to","at","for"], answer:0, explanation:"With say, use to before the listener: say something to someone.", zh:"say 后面要指出听话的人时，通常使用 to。" }
    ]},
    { id:"application-collocations-01", topicId:"collocations", difficulty:"intermediate", title:"Choose a natural collocation", questions:[
      { q:"We need to _____ a decision before Friday.", options:["do","make","take"], answer:1, explanation:"Make a decision is the standard collocation.", zh:"make a decision 是常见且自然的固定搭配。" },
      { q:"The town experienced _____ rain overnight.", options:["strong","heavy","hard"], answer:1, explanation:"Heavy rain is the usual collocation.", zh:"heavy rain 是描述大雨的常见搭配。" }
    ]}
  ];

  const dailyDiscoveries = [
    { id:"discovery-look-forward-01", category:"Grammar insight", title:"The hidden grammar in “look forward to”", body:"In this expression, to is a preposition rather than an infinitive marker. Follow it with a noun or an -ing form.", example:"I look forward to meeting your team.", zh:"这个表达中的 to 是介词，不是不定式标记。后面可以接名词或 -ing 形式。", zhExample:"I look forward to meeting your team.", source:"Cambridge Dictionary · English Grammar Today", sourceUrl:"https://dictionary.cambridge.org/grammar/british-grammar/word-patterns-look-forward-to" },
    { id:"discovery-less-fewer-01", category:"Usage note", title:"Less and fewer are not interchangeable in formal writing", body:"Use fewer with plural countable nouns and less with uncountable nouns. You may hear less with plural nouns in informal speech, but fewer is the safer choice in formal writing.", example:"fewer meetings / less time", zh:"正式写作中，fewer 通常搭配可数复数名词，less 通常搭配不可数名词。口语中也常听到 less 搭配复数名词。", zhExample:"fewer meetings / less time", source:"Cambridge Dictionary · English Grammar Today", sourceUrl:"https://dictionary.cambridge.org/grammar/british-grammar/less-or-fewer" },
    { id:"discovery-say-tell-01", category:"Common mistake", title:"Why “tell me” but “say to me”?", body:"Tell normally takes the listener directly as its object. With say, add to before the listener.", example:"Tell me the answer. / Say the answer to me.", zh:"tell 后面通常直接接听话的人；say 若要指出听话的人，通常在对方前面加 to。", zhExample:"Tell me the answer. / Say the answer to me.", source:"Cambridge Dictionary · About Words", sourceUrl:"https://dictionaryblog.cambridge.org/2015/11/11/say-and-tell-how-to-talk-about-talking-1/" },
    { id:"discovery-information-01", category:"Vocabulary fact", title:"Why “informations” is usually incorrect", body:"Information is an uncountable noun in standard English. To count separate pieces, say a piece of information or two items of information.", example:"Could you give me some information? / I found three useful pieces of information.", zh:"information 在标准英语中通常是不可数名词。要表达具体条数，可以说 a piece of information。", zhExample:"some information / three pieces of information", source:"Cambridge Dictionary · About Words", sourceUrl:"https://dictionaryblog.cambridge.org/2018/03/21/countable-or-uncountable-and-why-it-matters/" },
    { id:"discovery-salary-01", category:"Etymology", title:"The history behind “salary” is more complicated than the salt story", body:"English salary came through Anglo-French from Latin salarium, a word for an allowance or payment. The Latin root is connected with salt, but the popular story that Roman soldiers were literally paid in salt or a salt allowance is debated and not firmly established.", example:"salary → Anglo-French salarie / Old French salaire → Latin salarium", zh:"salary 经由盎格鲁法语源自拉丁语 salarium，原指津贴或报酬。它的词根与“盐”有关，但“罗马士兵直接以盐作为工资”的流行说法仍有争议，不能当作已证实的事实。", zhExample:"salary → Anglo-French salarie / Old French salaire → Latin salarium", source:"Wordorigins.org · Salary", sourceUrl:"https://www.wordorigins.org/big-list-entries/salary" },
    { id:"discovery-verb-patterns-01", category:"Grammar insight", title:"Some verbs prefer -ing; others prefer to + verb", body:"English verb patterns depend on the first verb. Enjoy is followed by an -ing form; want is followed by a to-infinitive. Some verbs allow both forms, sometimes with a change in meaning.", example:"I enjoy learning languages. / I want to learn another language.", zh:"英语动词后面的结构取决于前面的动词。enjoy 后接 -ing；want 后接 to + 动词原形。有些动词两种形式都可以，但意思可能不同。", zhExample:"I enjoy learning languages. / I want to learn another language.", source:"British Council · LearnEnglish", sourceUrl:"https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/verbs-followed-ing-or-infinitive" }
  ];

  let preferences = Object.fromEntries(preferenceKeys.map(key => [key, true]));
  let snapshot = { timezone:"UTC", day:"", plan:"free", limits:{}, completed:{}, content:{} };
  let readerState = null;
  let loadSequence = 0;
  let preferenceListenersReady = false;

  const byId = id => document.getElementById(id);
  const esc = value => escapeHTML(String(value ?? ""));
  const dayOrdinal = day => Math.floor(Date.parse(day + "T00:00:00Z") / 86400000);
  const addDays = day => new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().slice(0,10);

  function selectedTranslation(item) {
    if (typeof translationLanguage !== "undefined" && translationLanguage === "zh" && item.zh) {
      return '<p class="daily-translation">' + esc(item.zh) + '</p>';
    }
    return "";
  }

  function makeRevisionContent(topicId, contentId, reason) {
    const source = dailyApplications.find(item => item.topicId === topicId) || dailyApplications[0];
    return {
      id: contentId,
      topicId: topicId || source.topicId,
      difficulty: source.difficulty,
      title: "Review: " + source.title,
      body: reason || "A short adaptive review selected from your learning history.",
      zh: "根据你的学习记录安排的简短复习。",
      questions: source.questions
    };
  }

  function revisionCandidates(lessonResults, dailyResults, completedToday) {
    const combined = [...(lessonResults || []), ...(dailyResults || [])];
    const recordsByTopic = new Map();
    for (const row of combined) {
      if (!row.topic_id || !Number.isFinite(Number(row.question_count)) || Number(row.question_count) <= 0) continue;
      const records = recordsByTopic.get(row.topic_id) || [];
      records.push({
        correct:Number(row.correct_count || 0),
        questions:Number(row.question_count),
        at:row.attempted_at || row.completed_at || null
      });
      recordsByTopic.set(row.topic_id,records);
    }

    const evidenceByTopic = new Map();
    for (const [topicId,records] of recordsByTopic) {
      records.sort((a,b) => Date.parse(b.at || 0) - Date.parse(a.at || 0));
      const recent = records.slice(0,3);
      const correct = recent.reduce((sum,row) => sum + row.correct,0);
      const questions = recent.reduce((sum,row) => sum + row.questions,0);
      evidenceByTopic.set(topicId,{
        topicId,correct,questions,attempts:recent.length,lastAt:recent[0]?.at || null
      });
    }

    const usedToday = new Set((completedToday || [])
      .filter(row => row.activity_type === "daily_revision")
      .map(row => row.topic_id).filter(Boolean));
    const topics = [...new Set(dailyApplications.map(item => item.topicId))];
    const candidates = topics.filter(topicId => !usedToday.has(topicId)).map(topicId => {
      const evidence = evidenceByTopic.get(topicId);
      if (!evidence) return { topicId, priority:2, reason:"First review — building your learning history", accuracy:null, lastAt:null };
      const accuracy = evidence.correct / evidence.questions;
      const enoughEvidence = evidence.attempts >= 2 && evidence.questions >= 6;
      const interval = accuracy < 0.65 ? 1 : accuracy < 0.8 ? 3 : accuracy < 0.9 ? 7 : 14;
      const daysSince = evidence.lastAt ? (Date.now() - Date.parse(evidence.lastAt)) / 86400000 : 999;
      const due = daysSince >= interval;
      const weak = enoughEvidence && accuracy < 0.7;
      const priority = weak && due ? 0 : due ? 1 : 3;
      const reason = weak && due ? "Needs attention — recent accuracy is below 70%"
        : !enoughEvidence ? "Building evidence — not enough recent practice to label this topic weak"
        : due ? "Review due based on your spaced-practice interval"
        : "Keep this topic fresh with a short review";
      return { topicId, priority, reason, accuracy, lastAt:evidence.lastAt };
    });

    candidates.sort((a,b) => a.priority-b.priority
      || (a.accuracy ?? 2) - (b.accuracy ?? 2)
      || (a.lastAt ? Date.parse(a.lastAt) : 0) - (b.lastAt ? Date.parse(b.lastAt) : 0));
    return candidates;
  }

  function chooseContent(activityType, slot) {
    const day = snapshot.day;
    const baseIndex = dayOrdinal(day);
    if (activityType === "daily_topic") {
      return dailyTopics[(baseIndex + slot) % dailyTopics.length];
    }
    if (activityType === "daily_application") {
      return dailyApplications[(baseIndex + slot) % dailyApplications.length];
    }
    if (activityType === "daily_discovery") {
      return dailyDiscoveries[(baseIndex + slot) % dailyDiscoveries.length];
    }
    const candidates = revisionCandidates(snapshot.lessonResults, snapshot.dailyResults, snapshot.completedToday);
    const candidate = candidates[0] || { topicId:dailyApplications[0].topicId, reason:"A short review to keep your knowledge active." };
    const id = ["revision",candidate.topicId,day,String(slot+1)].join("-");
    return makeRevisionContent(candidate.topicId,id,candidate.reason);
  }

  function resolveSessionContent(activityType, session, fallback) {
    if (activityType === "daily_revision") {
      const candidate = revisionCandidates(snapshot.lessonResults, snapshot.dailyResults, snapshot.completedToday)
        .find(item => item.topicId === session.topic_id);
      return makeRevisionContent(session.topic_id,session.content_id,candidate?.reason || "Resume your adaptive review.");
    }
    const pools = {
      daily_topic:dailyTopics,
      daily_application:dailyApplications,
      daily_discovery:dailyDiscoveries
    };
    return (pools[activityType] || []).find(item => item.id === session.content_id) || fallback;
  }

  async function loadDailyData() {
    const sequence = ++loadSequence;
    const status = byId("dailyLearningStatus");
    const grid = byId("dailyActivityGrid");
    if (!supabaseClient || !currentUser) {
      preferences = Object.fromEntries(preferenceKeys.map(key => [key, true]));
      snapshot = { timezone:"UTC", day:localDayStart("UTC"), learningLanguage:"en", plan:"free", limits:{}, completed:{}, content:{} };
      applyPreferenceInputs(false);
      status.textContent = "Sign in to start activities and sync your preferences and progress across devices.";
      renderCards();
      return;
    }

    status.textContent = "Loading your daily learning plan…";
    const userId = currentUser.id;
    const [prefResult, entitlementResult] = await Promise.all([
      supabaseClient.from("user_preferences")
        .select("timezone,learning_language,translation_language,daily_topic_enabled,daily_application_enabled,daily_discovery_enabled,daily_revision_enabled")
        .eq("user_id",userId).maybeSingle(),
      supabaseClient.from("user_entitlements")
        .select("plan_code,status,valid_from,valid_until")
        .eq("user_id",userId).maybeSingle()
    ]);
    if (sequence !== loadSequence) return;
    if (prefResult.error) throw prefResult.error;
    if (entitlementResult.error) throw entitlementResult.error;
    if (!prefResult.data) throw new Error("Your learning preferences could not be found. Please sign out and sign in again.");
    const prefs = prefResult.data;
    preferences = Object.fromEntries(preferenceKeys.map(key => [key,prefs[key] !== false]));
    applyPreferenceInputs(true);
    const timezone = prefs.timezone || browserTimezone();
    const day = localDayStart(timezone);
    const nextDay = addDays(day);
    const start = zonedMidnightUtc(day,timezone);
    const finish = zonedMidnightUtc(nextDay,timezone);
    const entitlement = entitlementResult.data;
    const now = Date.now();
    const active = entitlement?.status === "active"
      && (!entitlement.valid_from || Date.parse(entitlement.valid_from) <= now)
      && (!entitlement.valid_until || Date.parse(entitlement.valid_until) > now);
    const plan = active ? entitlement.plan_code : "free";

    const [limitResult, logResult, lessonResult, dailyResult] = await Promise.all([
      supabaseClient.from("learning_plan_limits")
        .select("activity_type,daily_limit,is_enabled")
        .eq("plan_code",plan)
        .in("activity_type",["daily_topic","daily_application","daily_discovery","daily_revision"]),
      supabaseClient.from("learning_activity_log")
        .select("activity_type,created_at")
        .eq("user_id",userId).eq("event_type","completed")
        .gte("created_at",start).lt("created_at",finish),
      supabaseClient.from("lesson_practice_results")
        .select("topic_id,correct_count,question_count,attempted_at")
        .eq("user_id",userId),
      supabaseClient.from("daily_activity_sessions")
        .select("activity_type,topic_id,correct_count,question_count,completed_at,status")
        .eq("user_id",userId).eq("status","completed")
    ]);
    if (sequence !== loadSequence) return;
    for (const result of [limitResult,logResult,lessonResult,dailyResult]) if (result.error) throw result.error;

    const limits = {};
    for (const row of limitResult.data || []) limits[row.activity_type] = { limit:row.daily_limit, enabled:row.is_enabled };
    const completed = {};
    for (const row of logResult.data || []) completed[row.activity_type] = (completed[row.activity_type] || 0) + 1;
    const completedToday = (dailyResult.data || []).filter(row => row.completed_at && row.completed_at >= start && row.completed_at < finish);
    const language = prefs.learning_language || "en";
    snapshot = {
      timezone, day, learningLanguage:language, plan, limits, completed, completedToday,
      lessonResults:lessonResult.data || [],
      dailyResults:dailyResult.data || [],
      content:{}
    };

    const slots = {};
    for (const type of Object.keys(activityMeta)) slots[type] = completed[type] || 0;
    for (const type of Object.keys(activityMeta)) snapshot.content[type] = chooseContent(type,slots[type]);
    status.textContent = "Your daily activities reset at midnight (" + timezone + "). Plan: " + (plan === "premium" ? "Premium" : "Free") + ". Daily content currently focuses on English learning.";
    if (language !== "en" || course !== "en") {
      status.textContent += " Switch the learning course to English to start these activities.";
    }
    renderCards();
  }

  function applyPreferenceInputs(signedIn) {
    document.querySelectorAll("[data-daily-pref]").forEach(input => {
      const key = input.dataset.dailyPref;
      input.checked = preferences[key] !== false;
      input.disabled = !signedIn;
    });
  }

  function renderCards() {
    const grid = byId("dailyActivityGrid");
    const enabledTypes = Object.keys(activityMeta).filter(type => preferences[type + "_enabled"] !== false);
    if (!enabledTypes.length) {
      grid.innerHTML = '<div class="coming-card"><h2>All daily activities are paused</h2><p>Enable at least one activity above whenever you are ready to continue.</p></div>';
      return;
    }
    grid.innerHTML = enabledTypes.map(type => {
      const meta = activityMeta[type];
      const content = snapshot.content[type] || chooseContent(type,snapshot.completed?.[type] || 0);
      const limit = snapshot.limits[type]?.limit;
      const used = snapshot.completed[type] || 0;
      const remaining = Number.isFinite(limit) ? Math.max(0,limit-used) : null;
      const remainingLabel = remaining === null ? "Allowance unavailable" : remaining + " / " + limit + " completions remaining";
      const reason = type === "daily_revision" ? '<p class="daily-activity-meta"><span class="daily-activity-tag">' + esc(content.body) + '</span></p>' : "";
      const disabled = !currentUser || !supabaseClient || snapshot.learningLanguage !== "en" || (typeof course !== "undefined" && course !== "en");
      return '<article class="daily-activity-card" data-activity-card="' + type + '">'
        + '<div class="daily-activity-meta"><span class="daily-activity-tag">' + esc(meta.label) + '</span><span class="daily-activity-tag">' + esc(remainingLabel) + '</span></div>'
        + '<h2>' + esc(meta.title) + '</h2><p>' + esc(meta.description) + '</p>'
        + '<div class="daily-reader-example"><strong>' + esc(content.title) + '</strong></div>'
        + reason
        + '<button type="button" class="primary-button" data-start-daily="' + type + '"' + (disabled ? " disabled" : "") + '>Start / Resume</button>'
        + '</article>';
    }).join("");
    grid.querySelectorAll("[data-start-daily]").forEach(button => {
      button.addEventListener("click",() => startDailyActivity(button.dataset.startDaily));
    });
  }

  async function startDailyActivity(activityType) {
    if (!currentUser || !supabaseClient) return;
    const selected = snapshot.content[activityType] || chooseContent(activityType,snapshot.completed?.[activityType] || 0);
    const button = document.querySelector('[data-start-daily="' + activityType + '"]');
    if (button) { button.disabled = true; button.textContent = "Opening…"; }
    try {
      const {data,error} = await supabaseClient.rpc("start_daily_activity_session",{
        p_activity_type:activityType,
        p_content_id:selected.id,
        p_topic_id:selected.topicId || null,
        p_difficulty:selected.difficulty || null,
        p_source:activityType === "daily_revision" ? "adaptive_revision" : "daily"
      });
      if (error) throw error;
      const session = Array.isArray(data) ? data[0] : data;
      if (!session) throw new Error("The daily activity session could not be opened.");
      const content = resolveSessionContent(activityType,session,selected);
      renderReader(activityType,content,session);
    } catch (error) {
      byId("dailyLearningStatus").textContent = error.message || "The activity could not be opened. Please try again.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Start / Resume"; }
    }
  }

  function renderReader(activityType,content,session) {
    const reader = byId("dailyActivityReader");
    const completed = session.status === "completed";
    const isQuiz = activityType === "daily_application" || activityType === "daily_revision";
    reader.hidden = false;
    readerState = { activityType,content,session,firstTry:(content.questions || []).map(() => null),passed:(content.questions || []).map(() => false) };
    let html = '<button type="button" class="secondary-button" data-daily-back>← Back to Daily Learning</button>'
      + '<div class="daily-activity-meta"><span class="daily-activity-tag">' + esc(activityMeta[activityType].title) + '</span>'
      + (completed ? '<span class="daily-activity-tag">Completed · replay is free</span>' : '<span class="daily-activity-tag">In progress · no allowance used yet</span>')
      + '</div><h2>' + esc(content.title) + '</h2>';
    if (content.body) html += '<p>' + esc(content.body) + '</p>';
    if (content.example) html += '<div class="daily-reader-example"><strong>Example</strong><p>' + esc(content.example) + '</p></div>';
    html += selectedTranslation(content);
    if (content.zhExample && typeof translationLanguage !== "undefined" && translationLanguage === "zh") {
      html += '<div class="daily-reader-example"><strong>例句</strong><p>' + esc(content.zhExample) + '</p></div>';
    }
    if (content.sourceUrl) {
      html += '<p class="lesson-muted">Reference: <a href="' + esc(content.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(content.source) + '</a>. The explanation and examples above are original SwiftDictionary content.</p>';
    }
    if (isQuiz) {
      html += '<div id="dailyQuestions">';
      content.questions.forEach((question,index) => {
        html += '<div class="daily-question" data-daily-question="' + index + '"><strong>' + (index+1) + '. ' + esc(question.q) + '</strong>';
        question.options.forEach((option,optionIndex) => {
          html += '<label><input type="radio" name="daily-question-' + index + '" value="' + optionIndex + '"' + (completed ? " disabled" : "") + '> <span>' + esc(option) + '</span></label>';
        });
        html += '<p class="daily-question-feedback" id="daily-feedback-' + index + '"></p></div>';
      });
      html += '</div>';
      if (!completed) html += '<button type="button" class="secondary-button" data-check-daily>Check answers</button>';
      html += '<p id="dailyPracticeStatus" role="status" aria-live="polite" class="page-intro"></p>';
    }
    if (!completed && !isQuiz) html += '<button type="button" class="primary-button" data-complete-daily>Mark activity complete</button>';
    if (!completed) html += '<button type="button" class="secondary-button" data-abandon-daily>Abandon session</button>';
    if (!completed && isQuiz) html += '<button type="button" class="primary-button" data-complete-daily hidden>Complete activity</button>';
    if (completed) html += '<p class="page-intro">This content is already completed. You can revisit it without using another daily allowance.</p>';
    reader.innerHTML = html;
    reader.querySelector("[data-daily-back]").addEventListener("click",() => { reader.hidden = true; reader.innerHTML = ""; readerState = null; });
    const checkButton = reader.querySelector("[data-check-daily]");
    if (checkButton) checkButton.addEventListener("click",checkDailyAnswers);
    reader.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener("change",() => {
      const index = Number(input.name.split("-").pop());
      if (readerState && Number.isInteger(index)) readerState.passed[index] = false;
      const complete = reader.querySelector("[data-complete-daily]");
      if (complete) complete.hidden = true;
      const practiceStatus = byId("dailyPracticeStatus");
      if (practiceStatus) practiceStatus.textContent = "Your answer changed. Check your answers again before completing.";
    }));
    const completeButton = reader.querySelector("[data-complete-daily]");
    if (completeButton) completeButton.addEventListener("click",completeDailyActivity);
    const abandonButton = reader.querySelector("[data-abandon-daily]");
    if (abandonButton) abandonButton.addEventListener("click",abandonDailyActivity);
    reader.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function checkDailyAnswers() {
    if (!readerState) return;
    const {content,firstTry,passed} = readerState;
    let allCorrect = true;
    for (let i=0;i<content.questions.length;i+=1) {
      const selected = document.querySelector('input[name="daily-question-' + i + '"]:checked');
      const feedback = byId("daily-feedback-" + i);
      if (!selected) {
        allCorrect = false;
        feedback.textContent = "Choose an answer before checking.";
        continue;
      }
      const correct = Number(selected.value) === content.questions[i].answer;
      if (firstTry[i] === null) firstTry[i] = correct;
      passed[i] = correct;
      if (correct) feedback.textContent = "Correct. " + content.questions[i].explanation;
      else {
        allCorrect = false;
        feedback.textContent = "Not quite. Try again. " + content.questions[i].explanation;
      }
    }
    const completeButton = byId("dailyActivityReader").querySelector("[data-complete-daily]");
    if (completeButton) completeButton.hidden = !allCorrect;
    const status = byId("dailyPracticeStatus");
    if (status) status.textContent = allCorrect ? "All answers are correct. You can now complete this activity." : "Review the feedback and try the unanswered or incorrect questions again.";
  }

  async function abandonDailyActivity() {
    if (!readerState || !currentUser || !supabaseClient) return;
    const sessionId = readerState.session.id;
    const button = byId("dailyActivityReader").querySelector("[data-abandon-daily]");
    if (button) { button.disabled = true; button.textContent = "Abandoning…"; }
    try {
      const {data,error} = await supabaseClient.rpc("abandon_daily_activity_session",{p_session_id:sessionId});
      if (error) throw error;
      const saved = Array.isArray(data) ? data[0] : data;
      if (!saved || saved.status !== "abandoned") throw new Error("The session could not be abandoned.");
      byId("dailyActivityReader").hidden = true;
      byId("dailyActivityReader").innerHTML = "";
      readerState = null;
      byId("dailyLearningStatus").textContent = "Session abandoned. No daily allowance was used.";
      await loadDailyData();
    } catch (error) {
      byId("dailyLearningStatus").textContent = error.message || "The session could not be abandoned.";
      if (button) { button.disabled = false; button.textContent = "Abandon session"; }
    }
  }

  async function completeDailyActivity() {
    if (!readerState || !currentUser || !supabaseClient) return;
    const {activityType,content,session,firstTry,passed} = readerState;
    if ((activityType === "daily_application" || activityType === "daily_revision") && !passed.every(Boolean)) {
      byId("dailyPracticeStatus").textContent = "Check every answer and correct any mistakes before completing.";
      return;
    }
    const button = byId("dailyActivityReader").querySelector("[data-complete-daily]");
    if (button) { button.disabled = true; button.textContent = "Saving…"; }
    const args = { p_session_id:session.id, p_correct_count:null, p_question_count:null };
    if (activityType === "daily_application" || activityType === "daily_revision") {
      if (firstTry.some(value => value === null)) {
        if (button) { button.disabled = false; button.textContent = "Complete activity"; }
        byId("dailyPracticeStatus").textContent = "Check every question before completing this activity.";
        return;
      }
      args.p_correct_count = firstTry.filter(value => value === true).length;
      args.p_question_count = content.questions.length;
    }
    let saved;
    try {
      const {data,error} = await supabaseClient.rpc("complete_daily_activity_session",args);
      if (error) throw error;
      saved = Array.isArray(data) ? data[0] : data;
      if (!saved) throw new Error("The completion could not be confirmed.");
      readerState.session = saved;
      renderReader(activityType,content,saved);
    } catch (error) {
      byId("dailyLearningStatus").textContent = error.message || "Completion could not be saved. Your session remains in progress.";
      if (button) { button.disabled = false; button.textContent = "Complete activity"; }
      return;
    }
    try {
      await loadDailyData();
    } catch (error) {
      byId("dailyLearningStatus").textContent = "Activity completed successfully. The remaining allowance display could not be refreshed: " + (error.message || "Please reload the page.");
    }
  }

  async function initialiseDailyLearning() {
    if (!byId("dailyLearningPage")) return;
    try {
      await loadDailyData();
    } catch (error) {
      byId("dailyLearningStatus").textContent = "Daily Learning could not load: " + (error.message || "Please try again.");
      byId("dailyActivityGrid").innerHTML = "";
    }
  }

  function bindPreferenceControls() {
    if (preferenceListenersReady) return;
    preferenceListenersReady = true;
    document.querySelectorAll("[data-daily-pref]").forEach(input => {
      input.addEventListener("change",async () => {
        const key = input.dataset.dailyPref;
        const previous = preferences[key] !== false;
        preferences[key] = input.checked;
        if (!currentUser || !supabaseClient) {
          input.checked = previous;
          preferences[key] = previous;
          byId("dailyLearningStatus").textContent = "Sign in to save daily activity preferences across devices.";
          return;
        }
        input.disabled = true;
        const {error} = await supabaseClient.from("user_preferences")
          .update({[key]:input.checked}).eq("user_id",currentUser.id);
        input.disabled = false;
        if (error) {
          input.checked = previous;
          preferences[key] = previous;
          byId("dailyLearningStatus").textContent = "Preference could not be saved: " + error.message;
        } else {
          renderCards();
          byId("dailyLearningStatus").textContent = "Your daily activity preferences have been saved and will sync across devices.";
        }
      });
    });
  }

  window.initialiseDailyLearning = initialiseDailyLearning;
  bindPreferenceControls();
  window.addEventListener("swift-auth-updated",() => {
    if (location.hash === "#daily-learning") initialiseDailyLearning();
  });
  if (location.hash === "#daily-learning") initialiseDailyLearning();
})();
