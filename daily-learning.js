/* SwiftDictionary Update 2.3.1 — Daily Learning integrated into Lessons.
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
    daily_topic: { title: "Daily Topic", titleZh:"每日主题", label: "Learn one focused idea", labelZh:"学习一个重点概念", description: "A short guided explanation with examples.", descriptionZh:"通过简短讲解和例句学习一个重点。" },
    daily_application: { title: "Daily Application", titleZh:"每日应用", label: "Use what you know", labelZh:"运用所学知识", description: "Apply grammar and vocabulary in practical contexts.", descriptionZh:"在实际语境中运用语法和词汇。" },
    daily_discovery: { title: "Daily Discovery", titleZh:"每日发现", label: "A word shared worldwide", labelZh:"全球每日共享词汇", description: "One of three less-common English words selected globally each day.", descriptionZh:"这是每天全球统一安排的三个较少见英语词汇之一。" },
    daily_revision: { title: "Daily Revision", titleZh:"每日复习", label: "Strengthen your memory", labelZh:"巩固记忆", description: "An adaptive review chosen from your learning history.", descriptionZh:"根据你的学习记录安排个性化复习。" }
  };

  const dailyTopics = [
    { id:"topic-present-perfect-01", topicId:"verb-tenses", difficulty:"intermediate", title:"Past simple or present perfect?", body:"Use the past simple for a finished action at a finished time. Use the present perfect when the time is not specified or the past action connects to the present.", example:"I visited Penang last year. / I have visited Penang several times.", zh:"已结束且时间明确的动作通常用一般过去时；没有说明具体过去时间，或强调与现在的联系时，常用现在完成时。", zhExample:"我去年去了槟城。/ 我去过槟城好几次。" },
    { id:"topic-articles-01", topicId:"nouns-and-articles", difficulty:"beginner", title:"Choose a or an by sound", body:"Use a before a consonant sound and an before a vowel sound. The first written letter does not always decide the choice.", example:"a university / an umbrella / an honest answer", zh:"a 或 an 的选择取决于后面的发音，而不只是拼写的第一个字母。", zhExample:"a university / an umbrella / an honest answer" },
    { id:"topic-quantity-01", topicId:"nouns-and-quantity", difficulty:"beginner", title:"Countable and uncountable nouns", body:"Countable nouns can form plurals and take numbers. Uncountable nouns are treated as amounts; use a quantity phrase when you need to count them.", example:"three suggestions / some advice / two pieces of advice", zh:"可数名词可以用数字计数并有复数形式；不可数名词通常表示整体或数量，需要用量词表达具体件数。", zhExample:"three suggestions / some advice / two pieces of advice" },
    { id:"topic-sentence-order-01", topicId:"sentence-basics", difficulty:"beginner", title:"Build a clear English sentence", body:"A common English statement follows subject + verb + object. Time and place details often come after the main clause.", example:"Maya (subject) sent (verb) the report (object) yesterday.", zh:"英语陈述句常见的基本语序是主语 + 动词 + 宾语，时间和地点信息通常放在主要结构之后。", zhExample:"Maya（主语）sent（动词）the report（宾语）yesterday。" },
    { id:"topic-collocations-01", topicId:"collocations", difficulty:"intermediate", title:"Learn words in natural pairs", body:"A collocation is a combination that English speakers commonly use together. Learning the whole phrase helps your writing sound more natural.", example:"make a decision / take responsibility / heavy rain", zh:"搭配是英语中经常一起出现的词语组合。整组记忆比单独背词更容易写出自然的表达。", zhExample:"make a decision / take responsibility / heavy rain" },
    {"id":"topic-present-routines-01","topicId":"verb-tenses","difficulty":"beginner","title":"Talk about routines and facts","body":"Use the present simple for habits, repeated actions and general facts. Add -s or -es to most verbs with he, she or it.","example":"I take the bus to work. / My sister takes the train.","zh":"一般现在时用于习惯、重复动作和普遍事实。主语为 he、she 或 it 时，大多数动词需要加 -s 或 -es。","zhExample":"I take the bus to work. / My sister takes the train。"},
    {"id":"topic-present-continuous-01","topicId":"verb-tenses","difficulty":"beginner","title":"Describe what is happening now","body":"Use am, is or are + verb-ing for an action happening now or around the present period. Some state verbs are not usually used in this form.","example":"I am reading now. / She is staying with a friend this week.","zh":"现在进行时由 am、is 或 are 加动词 -ing 组成，用于描述此刻或当前阶段正在发生的动作。某些表示状态的动词通常不使用这一形式。","zhExample":"I am reading now. / She is staying with a friend this week。"},
    {"id":"topic-past-continuous-01","topicId":"verb-tenses","difficulty":"intermediate","title":"Set the scene with the past continuous","body":"Use was or were + verb-ing for an action in progress at a particular time in the past. It often provides background for a shorter past-simple event.","example":"I was cooking when the phone rang.","zh":"过去进行时由 was 或 were 加动词 -ing 组成，用于描述过去某一时刻正在进行的动作，也常为一般过去时的短动作提供背景。","zhExample":"I was cooking when the phone rang。"},
    {"id":"topic-prepositions-time-01","topicId":"sentence-basics","difficulty":"beginner","title":"Use in, on and at for time","body":"Use at for clock times, on for days and dates, and in for months, years and longer periods. These are useful patterns rather than rules for every expression.","example":"at 8:30 / on Monday / in October","zh":"表示时间时，at 常用于具体时刻，on 常用于星期和日期，in 常用于月份、年份和较长时间段。这些是常见搭配，但并非适用于所有表达。","zhExample":"at 8:30 / on Monday / in October"},
    {"id":"topic-pronouns-01","topicId":"sentence-basics","difficulty":"beginner","title":"Choose subject and object pronouns","body":"Subject pronouns do the action (I, she, they). Object pronouns receive the action or follow a preposition (me, her, them).","example":"She called me. / I spoke to them.","zh":"主格代词用作动作执行者，例如 I、she、they；宾格代词用作动作承受者或介词宾语，例如 me、her、them。","zhExample":"She called me. / I spoke to them。"},
    {"id":"topic-articles-the-01","topicId":"nouns-and-articles","difficulty":"intermediate","title":"Know when to use the","body":"Use the when the listener can identify which person or thing you mean from shared context, previous mention or a unique situation. Do not use it automatically with every noun.","example":"I bought a book. The book is about space.","zh":"当听者能根据共同语境、前文提及或独特情境确定所指对象时，使用 the。不要在每个名词前都自动加 the。","zhExample":"I bought a book. The book is about space。"},
    {"id":"topic-quantity-many-much-01","topicId":"nouns-and-quantity","difficulty":"beginner","title":"Choose many or much","body":"Use many with plural countable nouns and much with uncountable nouns. In everyday positive statements, a lot of is often more natural than much.","example":"How many chairs? / How much water? / We have a lot of time.","zh":"many 搭配可数复数名词，much 搭配不可数名词。在日常肯定句中，a lot of 通常比 much 更自然。","zhExample":"How many chairs? / How much water? / We have a lot of time。"},
    {"id":"topic-everyday-vocabulary-01","topicId":"everyday-vocabulary","difficulty":"beginner","title":"Choose a precise everyday verb","body":"Common verbs such as get, take, make and give have many uses. Learn them in short phrases so the context makes their meaning clear.","example":"take a photo / make a plan / give advice / get ready","zh":"get、take、make 和 give 等常见动词有多种用法。把它们放在短语中学习，有助于通过语境理解意思。","zhExample":"take a photo / make a plan / give advice / get ready"},
    {"id":"topic-everyday-vocabulary-02","topicId":"everyday-vocabulary","difficulty":"beginner","title":"Talk about frequency","body":"Frequency adverbs such as always, usually, often, sometimes and never normally appear before a main verb, but after the verb be.","example":"I often cook at home. / She is usually early.","zh":"always、usually、often、sometimes 和 never 等频率副词通常放在实义动词之前，但放在 be 动词之后。","zhExample":"I often cook at home. / She is usually early。"},
    {"id":"topic-phrasal-verbs-01","topicId":"phrasal-verbs","difficulty":"intermediate","title":"Understand separable phrasal verbs","body":"Some phrasal verbs allow the object between the verb and particle. When the object is a pronoun, it normally goes in the middle for separable verbs.","example":"Turn the light off. / Turn it off.","zh":"有些短语动词可以把宾语放在动词和小品词之间。对于可分开的短语动词，宾语是代词时通常要放在中间。","zhExample":"Turn the light off. / Turn it off。"},
    {"id":"topic-phrasal-verbs-02","topicId":"phrasal-verbs","difficulty":"intermediate","title":"Learn phrasal verbs in context","body":"A phrasal verb's meaning may not be predictable from its individual parts. Learn the complete expression with an example sentence and its usual grammar pattern.","example":"look after a child / run out of milk / find out the answer","zh":"短语动词的意思不一定能从各个单词直接推断。建议连同例句和常见语法结构一起学习完整表达。","zhExample":"look after a child / run out of milk / find out the answer"},
    {"id":"topic-word-formation-01","topicId":"word-formation","difficulty":"intermediate","title":"Build word families with suffixes","body":"A suffix can change a word's grammatical role or meaning. For example, -ness often forms nouns from adjectives, while -ful often forms adjectives.","example":"kind → kindness / care → careful","zh":"后缀可以改变单词的词性或意思。例如，-ness 常把形容词变成名词，-ful 常用于构成形容词。","zhExample":"kind → kindness / care → careful"},
    {"id":"topic-word-formation-02","topicId":"word-formation","difficulty":"intermediate","title":"Notice common negative prefixes","body":"Prefixes such as un-, in-, im- and dis- can make a word negative, but the correct prefix depends on the word. Learn each form as a vocabulary item.","example":"unhappy / incorrect / impossible / disagree","zh":"un-、in-、im- 和 dis- 等前缀可以构成否定含义，但具体使用哪个前缀取决于单词。建议把完整形式作为词汇记忆。","zhExample":"unhappy / incorrect / impossible / disagree"},
    {"id":"topic-conditionals-01","topicId":"conditional-sentences","difficulty":"intermediate","title":"Use the first conditional for real possibilities","body":"The first conditional commonly uses if + present simple, followed by will + base verb. It describes a possible future result, not a guaranteed prediction.","example":"If it rains, we will stay inside.","zh":"第一条件句常用 if + 一般现在时，主句使用 will + 动词原形。它描述未来可能发生的结果，而不是保证会发生的预测。","zhExample":"If it rains, we will stay inside。"},
    {"id":"topic-conditionals-02","topicId":"conditional-sentences","difficulty":"intermediate","title":"Use the second conditional for imagined situations","body":"The second conditional commonly uses if + past simple and would + base verb to discuss an unreal or unlikely present or future situation.","example":"If I had more time, I would learn another language.","zh":"第二条件句常用 if + 一般过去时，主句使用 would + 动词原形，用来讨论不真实或可能性较低的现在或未来情境。","zhExample":"If I had more time, I would learn another language。"},
    {"id":"topic-advanced-inversion-01","topicId":"advanced-grammar","difficulty":"advanced","title":"Use inversion after negative adverbials","body":"In formal or emphatic writing, a negative or limiting expression at the beginning can trigger subject–auxiliary inversion. The auxiliary comes before the subject.","example":"Rarely have I seen such careful work.","zh":"在正式或强调性写作中，否定或限制性表达放在句首时，可能触发主语与助动词倒装，助动词置于主语之前。","zhExample":"Rarely have I seen such careful work。"},
    {"id":"topic-advanced-modals-01","topicId":"advanced-grammar","difficulty":"advanced","title":"Use modal verbs to express degrees of certainty","body":"Modal verbs communicate a speaker's attitude. Must can express a strong deduction, may or might a possibility, and can't a strong belief that something is impossible.","example":"She must be busy. / They might be delayed. / That can't be right.","zh":"情态动词可以表达说话者的判断。must 可表示较强的推断，may 或 might 表示可能性，can't 可表示强烈认为某事不可能。","zhExample":"She must be busy. / They might be delayed. / That can't be right。"},
    {"id":"topic-idioms-01","topicId":"idioms-fixed-expressions","difficulty":"intermediate","title":"Understand idioms as complete expressions","body":"An idiom has a conventional meaning that may differ from the literal meaning of its words. Check its register and context before using it.","example":"After a long discussion, they finally broke the ice.","zh":"习语有约定俗成的整体意思，可能不同于组成单词的字面意思。使用前应确认它适合当前语境和语体。","zhExample":"After a long discussion, they finally broke the ice。"},
    {"id":"topic-idioms-02","topicId":"idioms-fixed-expressions","difficulty":"intermediate","title":"Choose expressions that fit the situation","body":"Fixed expressions often sound natural in particular situations. Learning when they are appropriate is as important as learning their dictionary meaning.","example":"Could you give me a hand? / That sounds familiar.","zh":"固定表达通常适用于特定情境。除了记住词典意思，也要学习它们在什么场合使用才自然。","zhExample":"Could you give me a hand? / That sounds familiar。"},
    {"id":"topic-academic-01","topicId":"academic-professional-english","difficulty":"advanced","title":"Make a claim more cautious","body":"Academic and professional writing often avoids presenting uncertain interpretations as facts. Words such as may, suggests and appears to can signal appropriate caution.","example":"The results suggest that the change may improve access.","zh":"学术和专业写作通常避免把不确定的解释写成事实。may、suggests 和 appears to 等词可以表达适当的谨慎程度。","zhExample":"The results suggest that the change may improve access。"},
    {"id":"topic-academic-02","topicId":"academic-professional-english","difficulty":"advanced","title":"Connect ideas with precise transitions","body":"Choose a transition that expresses the relationship between ideas: however for contrast, therefore for a result, and furthermore for an additional point.","example":"The sample was small; therefore, the findings are preliminary.","zh":"选择能准确表达逻辑关系的连接词：however 表示转折，therefore 表示结果，furthermore 表示补充观点。","zhExample":"The sample was small; therefore, the findings are preliminary。"},
    {"id":"topic-precise-vocabulary-01","topicId":"precise-vocabulary","difficulty":"advanced","title":"Choose between say, tell and mention","body":"Say focuses on the words spoken; tell commonly takes a listener as its object; mention means referring to something briefly.","example":"She said hello, told me the news and mentioned the meeting.","zh":"say 强调说出的内容；tell 通常直接接听话的人；mention 表示简短地提及某事。","zhExample":"She said hello, told me the news and mentioned the meeting。"},
    {"id":"topic-precise-vocabulary-02","topicId":"precise-vocabulary","difficulty":"advanced","title":"Replace vague words with specific ones","body":"Words such as good, bad, big and nice are useful but broad. Choose a more specific word when you know exactly what you want to describe.","example":"a reliable source / a spacious room / a convincing argument","zh":"good、bad、big 和 nice 等词很常用，但含义较宽泛。明确想描述什么时，可以换成更具体的词。","zhExample":"a reliable source / a spacious room / a convincing argument"}
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
    ]},
    {"id":"application-present-routine-02","topicId":"verb-tenses","difficulty":"beginner","title":"Present simple in daily routines","questions":[{"q":"My parents _____ dinner at home most evenings.","options":["cook","cooks","are cook"],"answer":0,"explanation":"Parents is a plural subject, so use the base verb cook.","zh":"parents 是复数主语，因此使用动词原形 cook。"},{"q":"Which sentence describes a regular habit?","options":["I am meeting her yesterday.","I usually walk to class.","I walked right now."],"answer":1,"explanation":"Usually signals a habit, so the present simple is appropriate.","zh":"usually 表示习惯，因此使用一般现在时。"}]},
    {"id":"application-present-continuous-02","topicId":"verb-tenses","difficulty":"beginner","title":"Actions happening around now","questions":[{"q":"Please be quiet. The baby _____.","options":["sleeps","is sleeping","sleep"],"answer":1,"explanation":"The action is happening now, so use is + verb-ing.","zh":"动作正在此刻发生，因此使用 is + 动词 -ing。"},{"q":"This month, I _____ with my cousin while my flat is repaired.","options":["stay","am staying","stayed"],"answer":1,"explanation":"A temporary situation around the present can use the present continuous.","zh":"当前阶段的临时情况可以使用现在进行时。"}]},
    {"id":"application-past-continuous-02","topicId":"verb-tenses","difficulty":"intermediate","title":"Past actions in progress","questions":[{"q":"We _____ dinner when the lights went out.","options":["were having","have","are having"],"answer":0,"explanation":"The past continuous describes the action already in progress when another event happened.","zh":"过去进行时描述另一件事发生时已经正在进行的动作。"},{"q":"At nine last night, I _____ for my exam.","options":["study","was studying","am studying"],"answer":1,"explanation":"A specific time in the past calls for was studying.","zh":"句子指向过去的具体时刻，因此使用 was studying。"}]},
    {"id":"application-prepositions-time-01","topicId":"sentence-basics","difficulty":"beginner","title":"Prepositions for time","questions":[{"q":"The appointment is _____ Friday morning.","options":["in","on","at"],"answer":1,"explanation":"Use on with days and named parts of a day such as Friday morning.","zh":"星期几及其具体时段通常使用 on。"},{"q":"The shop closes _____ 9:00 p.m.","options":["in","on","at"],"answer":2,"explanation":"Use at for a clock time.","zh":"具体时刻前使用 at。"}]},
    {"id":"application-pronouns-01","topicId":"sentence-basics","difficulty":"beginner","title":"Subject or object pronoun?","questions":[{"q":"_____ invited my brother and me to the event.","options":["They","Them","Their"],"answer":0,"explanation":"The pronoun is the subject performing the action, so use they.","zh":"代词是执行动作的主语，因此使用 they。"},{"q":"The teacher spoke to _____ after class.","options":["we","our","us"],"answer":2,"explanation":"The object of the preposition to takes the object pronoun us.","zh":"介词 to 后面使用宾格代词 us。"}]},
    {"id":"application-articles-the-02","topicId":"nouns-and-articles","difficulty":"intermediate","title":"Articles and shared context","questions":[{"q":"I saw a dog outside. _____ dog was wearing a red collar.","options":["A","An","The"],"answer":2,"explanation":"The second mention identifies the same dog, so use the.","zh":"第二次提到同一只狗时，使用 the。"},{"q":"Could you open _____ window next to you?","options":["a","the","an"],"answer":1,"explanation":"The situation identifies which window is meant.","zh":"当前情境已明确指向哪一扇窗户，因此使用 the。"}]},
    {"id":"application-many-much-02","topicId":"nouns-and-quantity","difficulty":"beginner","title":"Many, much and a lot of","questions":[{"q":"How _____ luggage can we take?","options":["many","much","few"],"answer":1,"explanation":"Luggage is uncountable, so use much.","zh":"luggage 是不可数名词，因此使用 much。"},{"q":"There aren't _____ seats left.","options":["much","many","a little"],"answer":1,"explanation":"Seats is a plural countable noun, so use many.","zh":"seats 是可数复数名词，因此使用 many。"}]},
    {"id":"application-everyday-vocabulary-02","topicId":"everyday-vocabulary","difficulty":"beginner","title":"Everyday verb combinations","questions":[{"q":"Please _____ a photo of the sign.","options":["do","make","take"],"answer":2,"explanation":"Take a photo is the natural collocation.","zh":"take a photo 是自然且常见的搭配。"},{"q":"We need to _____ a plan before we leave.","options":["make","do","give"],"answer":0,"explanation":"Make a plan is the usual expression.","zh":"make a plan 是常见表达。"}]},
    {"id":"application-frequency-01","topicId":"everyday-vocabulary","difficulty":"beginner","title":"Place frequency adverbs","questions":[{"q":"She _____ arrives early for meetings.","options":["usually","is usually","usual"],"answer":0,"explanation":"Frequency adverbs normally come before a main verb.","zh":"频率副词通常放在实义动词之前。"},{"q":"They are _____ busy on Mondays.","options":["often","often are","oftens"],"answer":0,"explanation":"With be, the frequency adverb normally follows the verb.","zh":"与 be 动词连用时，频率副词通常放在 be 之后。"}]},
    {"id":"application-phrasal-separable-02","topicId":"phrasal-verbs","difficulty":"intermediate","title":"Place the object in a phrasal verb","questions":[{"q":"The music is too loud. Please turn _____ down.","options":["it","down it","its"],"answer":0,"explanation":"With this separable phrasal verb, the pronoun object goes between turn and down.","zh":"这个可分短语动词的代词宾语应放在 turn 和 down 之间。"},{"q":"Which sentence is correct?","options":["Please pick up them.","Please pick them up.","Please them pick up."],"answer":1,"explanation":"The pronoun them goes between pick and up.","zh":"代词 them 放在 pick 和 up 之间。"}]},
    {"id":"application-phrasal-meaning-02","topicId":"phrasal-verbs","difficulty":"intermediate","title":"Interpret phrasal verbs in context","questions":[{"q":"We have run out of milk. What does this mean?","options":["We have no milk left.","We ran outside with milk.","We bought extra milk."],"answer":0,"explanation":"Run out of means to have none of something left.","zh":"run out of 表示某物已经用完或没有剩余。"},{"q":"She looks after her younger brother. She _____.","options":["takes care of him","searches for him","looks at him"],"answer":0,"explanation":"Look after means take care of.","zh":"look after 的意思是照顾。"}]},
    {"id":"application-word-family-02","topicId":"word-formation","difficulty":"intermediate","title":"Recognise suffix meaning","questions":[{"q":"Which word is a noun formed with -ness?","options":["kindness","kindful","unkind"],"answer":0,"explanation":"The suffix -ness commonly forms nouns such as kindness.","zh":"后缀 -ness 常用于构成名词，例如 kindness。"},{"q":"Which word is an adjective formed with -ful?","options":["careless","careful","carefully"],"answer":1,"explanation":"Careful is an adjective; carefully is the related adverb.","zh":"careful 是形容词；carefully 是相关副词。"}]},
    {"id":"application-prefix-02","topicId":"word-formation","difficulty":"intermediate","title":"Choose a negative prefix","questions":[{"q":"The instructions were not clear. They were _____.","options":["unclear","disclear","imclear"],"answer":0,"explanation":"Unclear is the standard negative form of clear.","zh":"unclear 是 clear 的标准否定形式。"},{"q":"Which is the correct spelling?","options":["inpossible","impossible","unpossible"],"answer":1,"explanation":"Impossible is the established spelling.","zh":"impossible 是约定俗成的正确拼写。"}]},
    {"id":"application-first-conditional-02","topicId":"conditional-sentences","difficulty":"intermediate","title":"Real future possibilities","questions":[{"q":"If you _____ now, you will catch the bus.","options":["leave","will leave","left"],"answer":0,"explanation":"The if-clause in the first conditional normally uses the present simple.","zh":"第一条件句的 if 从句通常使用一般现在时。"},{"q":"If the weather is good, we _____ outside.","options":["ate","will eat","would ate"],"answer":1,"explanation":"Use will + base verb for the likely result.","zh":"可能的结果使用 will + 动词原形。"}]},
    {"id":"application-second-conditional-02","topicId":"conditional-sentences","difficulty":"intermediate","title":"Imagine a different situation","questions":[{"q":"If I _____ fluent, I would apply for the role.","options":["am","were","will be"],"answer":1,"explanation":"The second conditional uses a past form in the if-clause; were is common in formal hypothetical clauses.","zh":"第二条件句的 if 从句使用过去式；正式假设表达中常用 were。"},{"q":"Which sentence describes an imagined situation?","options":["If I had a car, I would drive there.","If I have time, I will call.","I had a car last year."],"answer":0,"explanation":"If I had ... would ... expresses an imagined present situation.","zh":"If I had ... would ... 表达想象中的现在情境。"}]},
    {"id":"application-modals-02","topicId":"advanced-grammar","difficulty":"advanced","title":"Express certainty with modals","questions":[{"q":"The lights are on and I can hear voices. They _____ be home.","options":["must","can't","mustn't"],"answer":0,"explanation":"Must can express a strong deduction based on evidence.","zh":"must 可以根据证据表达较强的推断。"},{"q":"The meeting _____ be delayed; the organiser has not confirmed it.","options":["might","mustn't","can't to"],"answer":0,"explanation":"Might expresses possibility rather than certainty.","zh":"might 表示可能性，而不是确定性。"}]},
    {"id":"application-inversion-02","topicId":"advanced-grammar","difficulty":"advanced","title":"Recognise subject–auxiliary inversion","questions":[{"q":"Choose the correct formal sentence.","options":["Rarely I have seen this.","Rarely have I seen this.","Rarely I seen have this."],"answer":1,"explanation":"After fronted rarely, the auxiliary comes before the subject.","zh":"rarely 放在句首时，助动词置于主语之前。"},{"q":"Which phrase correctly completes the sentence: Never _____ such a view.","options":["I have seen","have I seen","I saw have"],"answer":1,"explanation":"Never at the beginning triggers subject–auxiliary inversion.","zh":"Never 位于句首时触发主语与助动词倒装。"}]},
    {"id":"application-idioms-02","topicId":"idioms-fixed-expressions","difficulty":"intermediate","title":"Interpret common expressions","questions":[{"q":"If someone says “Could you give me a hand?”, they are asking you to _____.","options":["help them","shake their hand only","leave them alone"],"answer":0,"explanation":"Give someone a hand is an informal expression meaning help.","zh":"give someone a hand 是表示帮助某人的非正式表达。"},{"q":"If a task is “a piece of cake”, it is _____.","options":["very difficult","very easy","unfinished"],"answer":1,"explanation":"A piece of cake is an idiom meaning something is very easy.","zh":"a piece of cake 是表示某事很容易的习语。"}]},
    {"id":"application-academic-02","topicId":"academic-professional-english","difficulty":"advanced","title":"Use cautious academic language","questions":[{"q":"Which sentence makes a cautious claim?","options":["This proves the method always works.","The results suggest the method may help.","Everyone knows the method works."],"answer":1,"explanation":"Suggest and may signal a measured interpretation rather than certainty.","zh":"suggest 和 may 表达较为谨慎的解释，而不是绝对确定。"},{"q":"Choose the best transition: The sample was small; _____, the results are preliminary.","options":["therefore","although","meanwhile"],"answer":0,"explanation":"Therefore introduces a consequence or conclusion.","zh":"therefore 用于引出结果或结论。"}]},
    {"id":"application-precise-02","topicId":"precise-vocabulary","difficulty":"advanced","title":"Choose a precise reporting verb","questions":[{"q":"The speaker _____ that the event would begin at six.","options":["said","told","mentioned to"],"answer":0,"explanation":"Say can introduce the words or message; tell normally needs a listener object.","zh":"say 可以引出说话内容；tell 通常需要接听话的人作宾语。"},{"q":"The report _____ three possible causes but does not explain them in detail.","options":["mentions","tells","says to"],"answer":0,"explanation":"Mention means refer to something briefly.","zh":"mention 表示简短地提及某事。"}]}
  ];


  const dailyDiscoveryCoreVocabulary = [
    {id:"discovery-word-meticulous-01",word:"meticulous",part:"adjective",phonetic:"/məˈtɪkjələs/",definition:"Very careful and precise, paying attention to every small detail.",definitionZh:"一丝不苟的；非常细致的",body:"Meticulous describes someone who works carefully and checks details rather than rushing.",examples:["She kept meticulous notes during the experiment.","The designer made a meticulous review of every page.","He is meticulous about checking the figures before sending a report."],tip:"Common patterns: meticulous attention to detail; meticulous planning; meticulous work.",tipZh:"常见搭配：meticulous attention to detail（注重细节）、meticulous planning（周密计划）、meticulous work（细致的工作）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-reluctant-01",word:"reluctant",part:"adjective",phonetic:"/rɪˈlʌktənt/",definition:"Unwilling or hesitant to do something.",definitionZh:"不情愿的；勉强的",body:"Reluctant describes hesitation or unwillingness. It is useful when someone agrees to do something but does not really want to.",examples:["She was reluctant to speak in front of the crowd.","He reluctantly accepted the offer.","I am reluctant to decide without more information."],tip:"Common patterns: reluctant to do something; a reluctant decision; reluctantly agree.",tipZh:"常见搭配：reluctant to do something（不情愿做某事）、a reluctant decision（勉强作出的决定）、reluctantly agree（勉强同意）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-plausible-01",word:"plausible",part:"adjective",phonetic:"/ˈplɔːzəbəl/",definition:"Seeming reasonable or likely to be true, although it has not been proved.",definitionZh:"看似合理的；貌似可信的",body:"Plausible describes an explanation or suggestion that sounds believable, without proving it is true.",examples:["That is a plausible explanation for the delay.","The team offered two plausible reasons for the change.","Her story sounded plausible, but we checked the details."],tip:"Common patterns: a plausible explanation; a plausible reason; seem plausible.",tipZh:"常见搭配：a plausible explanation（看似合理的解释）、a plausible reason（貌似可信的理由）、seem plausible（看起来合理）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-fleeting-01",word:"fleeting",part:"adjective",phonetic:"/ˈfliːtɪŋ/",definition:"Lasting for only a very short time.",definitionZh:"短暂的；转瞬即逝的",body:"Fleeting describes something that passes quickly, such as a moment, glance, feeling or opportunity.",examples:["We caught a fleeting glimpse of the bird.","The excitement was fleeting, but the memory stayed.","She gave him a fleeting smile before leaving."],tip:"Common combinations: a fleeting moment; a fleeting glance; a fleeting feeling.",tipZh:"常见搭配：a fleeting moment（短暂的瞬间）、a fleeting glance（匆匆一瞥）、a fleeting feeling（一闪而过的感觉）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-cumbersome-01",word:"cumbersome",part:"adjective",phonetic:"/ˈkʌmbəsəm/",definition:"Large, heavy, complicated or difficult to handle.",definitionZh:"笨重的；繁琐难处理的",body:"Cumbersome can describe a physical object that is awkward to carry or a process that is unnecessarily complicated.",examples:["The old equipment was cumbersome to move.","The approval process became cumbersome.","A smaller bag is easier to carry than that cumbersome case."],tip:"Often used with process, system, equipment, procedure or paperwork.",tipZh:"常与 process（流程）、system（系统）、equipment（设备）、procedure（程序）或 paperwork（文书工作）搭配。",topicId:"daily-discovery-vocabulary",difficulty:"advanced"},
    {id:"discovery-word-quaint-01",word:"quaint",part:"adjective",phonetic:"/kweɪnt/",definition:"Attractively unusual or old-fashioned.",definitionZh:"古雅的；别致的；古色古香的",body:"Quaint often describes a small place, building or custom that feels charming because it is old-fashioned or unusual.",examples:["We stayed in a quaint little village.","The café occupies a quaint old building.","The street is known for its quaint shops."],tip:"Usually positive when describing places, buildings or details.",tipZh:"描述地点、建筑或细节时，通常带有正面或欣赏的语气。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-weary-01",word:"weary",part:"adjective",phonetic:"/ˈwɪəri/",definition:"Very tired, especially after a long period of effort or difficulty.",definitionZh:"疲倦的；疲惫的",body:"Weary is a more expressive alternative to tired. It can describe physical exhaustion or feeling worn down by a repeated situation.",examples:["The weary travellers finally reached the hotel.","I grew weary of having the same argument.","She gave a weary sigh and sat down."],tip:"Common patterns: feel weary; weary of something; a weary expression.",tipZh:"常见搭配：feel weary（感到疲惫）、weary of something（对某事感到厌倦）、a weary expression（疲惫的神情）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-subtle-01",word:"subtle",part:"adjective",phonetic:"/ˈsʌtəl/",definition:"Not obvious or easy to notice; expressed in a delicate or indirect way.",definitionZh:"微妙的；不易察觉的；含蓄的",body:"Subtle describes a small difference, hint, change or effect that is easy to miss.",examples:["There is a subtle difference between the two versions.","The painting uses subtle shades of blue.","She gave a subtle hint that she wanted to leave."],tip:"Common combinations: subtle difference; subtle change; subtle hint; subtle effect.",tipZh:"常见搭配：subtle difference（细微差别）、subtle change（细微变化）、subtle hint（含蓄的暗示）、subtle effect（微妙的影响）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-obsolete-01",word:"obsolete",part:"adjective",phonetic:"/ˈɒbsəliːt/",definition:"No longer used because something newer or better has replaced it.",definitionZh:"过时的；废弃的",body:"Obsolete describes technology, methods or systems that are no longer in practical use.",examples:["Many people consider fax machines obsolete.","The update replaced several obsolete features.","The old rule became obsolete after the policy changed."],tip:"Common patterns: become obsolete; obsolete technology; render something obsolete.",tipZh:"常见搭配：become obsolete（变得过时）、obsolete technology（过时技术）、render something obsolete（使某物过时）。",topicId:"daily-discovery-vocabulary",difficulty:"advanced"},
    {id:"discovery-word-resilient-01",word:"resilient",part:"adjective",phonetic:"/rɪˈzɪliənt/",definition:"Able to recover after difficulty, damage or change.",definitionZh:"有韧性的；能迅速恢复的",body:"Resilient describes people, communities or systems that can adapt and recover after setbacks.",examples:["Children can be remarkably resilient.","The team remained resilient after the defeat.","A resilient system can recover from unexpected problems."],tip:"Common patterns: remain resilient; resilient community; resilient to change.",tipZh:"常见搭配：remain resilient（保持韧性）、resilient community（有韧性的社区）、resilient to change（能够适应变化）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-bewildered-01",word:"bewildered",part:"adjective",phonetic:"/bɪˈwɪldəd/",definition:"Very confused and unsure what is happening or what to do.",definitionZh:"困惑的；不知所措的",body:"Bewildered is stronger than confused and often describes someone who cannot understand an unexpected situation.",examples:["He looked bewildered by the sudden change.","I was completely bewildered by the instructions.","The visitors seemed bewildered when the train was cancelled."],tip:"Common patterns: look bewildered; feel bewildered; a bewildered expression.",tipZh:"常见搭配：look bewildered（看起来困惑）、feel bewildered（感到不知所措）、a bewildered expression（困惑的表情）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"},
    {id:"discovery-word-scarce-01",word:"scarce",part:"adjective",phonetic:"/skeəs/",definition:"Not available in large amounts; difficult to find or obtain.",definitionZh:"稀少的；不足的；难以获得的",body:"Scarce describes something that is in short supply. It is often used for resources, time, opportunities or supplies.",examples:["Clean water became scarce during the drought.","Affordable housing is scarce in the city centre.","Time was scarce, so we focused on the essentials."],tip:"Common patterns: become scarce; scarce resources; in scarce supply.",tipZh:"常见搭配：become scarce（变得稀缺）、scarce resources（稀缺资源）、in scarce supply（供应短缺）。",topicId:"daily-discovery-vocabulary",difficulty:"intermediate"}
  ];


  const dailyDiscoveryAdditionalWords = [
    ["discovery-word-articulate-01","articulate","verb","/ɑːˈtɪkjəleɪt/","To express an idea or feeling clearly and effectively.","清楚表达；明确说出","Articulate is often used when someone explains a thought carefully so that others can understand it.","She articulated her concerns during the meeting.","The guide articulates the process in simple language.","articulate an idea; articulate clearly; articulate concerns","articulate an idea（清楚表达想法）；articulate clearly（清晰表达）；articulate concerns（表达顾虑）"],
    ["discovery-word-astute-01","astute","adjective","/əˈstjuːt/","Quick to notice important details and make sensible judgments.","敏锐的；精明的","Astute describes someone who understands a situation quickly and makes perceptive decisions.","It was an astute decision to wait for more information.","The astute observer noticed the small change.","an astute decision; an astute observer; astute business sense","an astute decision（明智而敏锐的决定）；an astute observer（观察敏锐的人）；astute business sense（敏锐的商业判断）"],
    ["discovery-word-candid-01","candid","adjective","/ˈkændɪd/","Honest and direct, even when the truth may be uncomfortable.","坦率的；直言不讳的","Candid describes open communication without trying to hide what someone really thinks.","Thank you for your candid feedback.","They had a candid conversation about the problem.","candid feedback; a candid discussion; be candid about something","candid feedback（坦率的反馈）；a candid discussion（坦诚的讨论）；be candid about（坦率谈论）"],
    ["discovery-word-coherent-01","coherent","adjective","/kəʊˈhɪərənt/","Logical, clear and easy to understand as a connected whole.","连贯的；有条理的","A coherent explanation connects its points in a way that makes sense to the listener or reader.","She presented a coherent argument.","The notes form a coherent account of the event.","a coherent argument; a coherent explanation; remain coherent","a coherent argument（连贯的论点）；a coherent explanation（清晰连贯的解释）；remain coherent（保持条理清晰）"],
    ["discovery-word-concise-01","concise","adjective","/kənˈsaɪs/","Giving the necessary information in a clear way using few words.","简洁的；言简意赅的","Concise writing removes unnecessary words while keeping the important meaning.","Please keep your summary concise.","The instructions are concise and easy to follow.","a concise summary; concise instructions; keep something concise","a concise summary（简洁的摘要）；concise instructions（简明的说明）；keep something concise（使内容简洁）"],
    ["discovery-word-diligent-01","diligent","adjective","/ˈdɪlɪdʒənt/","Working carefully and steadily, with consistent effort.","勤奋的；用功的","Diligent describes someone who puts careful and sustained effort into a task.","She is a diligent student who reviews her notes regularly.","The team made a diligent effort to check every detail.","a diligent student; diligent work; diligent research","a diligent student（勤奋的学生）；diligent work（认真勤勉的工作）；diligent research（细致的研究）"],
    ["discovery-word-elusive-01","elusive","adjective","/iˈluːsɪv/","Difficult to find, catch, achieve or understand.","难以找到的；难以捉摸的","Elusive is useful for something that repeatedly escapes attention or remains difficult to achieve.","A clear answer remained elusive.","The animal is rarely seen because it is so elusive.","an elusive answer; an elusive goal; remain elusive","an elusive answer（难以找到的答案）；an elusive goal（难以实现的目标）；remain elusive（仍难以捉摸）"],
    ["discovery-word-empathetic-01","empathetic","adjective","/ˌempəˈθetɪk/","Able to understand and share another person's feelings.","有同理心的；能够共情的","An empathetic person tries to understand how another person feels rather than judging too quickly.","The manager took an empathetic approach to the concern.","Good teachers are patient and empathetic.","an empathetic response; an empathetic listener; show empathy","an empathetic response（有同理心的回应）；an empathetic listener（善于共情的倾听者）；show empathy（表现出同理心）"],
    ["discovery-word-feasible-01","feasible","adjective","/ˈfiːzəbəl/","Possible to do successfully within the available time, resources or conditions.","可行的；行得通的","Feasible focuses on whether a plan can realistically be carried out.","The team needs a feasible schedule.","We discussed several options before choosing the most feasible one.","a feasible plan; a feasible solution; technically feasible","a feasible plan（可行的计划）；a feasible solution（可行的解决方案）；technically feasible（技术上可行）"],
    ["discovery-word-frugal-01","frugal","adjective","/ˈfruːɡəl/","Careful about spending money or using resources; avoiding waste.","节俭的；节约的","Frugal usually describes sensible choices that avoid unnecessary spending or waste.","They chose a frugal holiday close to home.","A frugal use of materials reduced waste.","a frugal lifestyle; frugal spending; be frugal with resources","a frugal lifestyle（节俭的生活方式）；frugal spending（节制开支）；be frugal with resources（节约使用资源）"],
    ["discovery-word-genuine-01","genuine","adjective","/ˈdʒenjuɪn/","Real, sincere or authentic rather than false or pretended.","真正的；真诚的","Genuine can describe objects that are not fake and feelings or interest that are sincere.","Her apology sounded genuine.","The museum confirmed that the painting is genuine.","genuine interest; a genuine concern; a genuine article","genuine interest（真诚的兴趣）；a genuine concern（真实的关切）；a genuine article（真品）"],
    ["discovery-word-impartial-01","impartial","adjective","/ɪmˈpɑːʃəl/","Fair and not influenced by personal opinions or preferences.","公正的；不偏不倚的","An impartial person considers the relevant facts without favouring one side.","We need an impartial review of the proposal.","The judge remained impartial throughout the hearing.","an impartial decision; an impartial observer; remain impartial","an impartial decision（公正的决定）；an impartial observer（公正的观察者）；remain impartial（保持公正）"],
    ["discovery-word-inevitable-01","inevitable","adjective","/ɪnˈevɪtəbəl/","Certain to happen and impossible to avoid.","不可避免的；必然发生的","Inevitable describes an outcome that cannot realistically be prevented.","Some delays are inevitable during major repairs.","Change is inevitable as the project grows.","an inevitable result; seem inevitable; the inevitable","an inevitable result（必然的结果）；seem inevitable（似乎不可避免）；the inevitable（不可避免的事）"],
    ["discovery-word-innovative-01","innovative","adjective","/ˈɪnəvətɪv/","Introducing new ideas, methods or ways of doing something.","创新的；革新的","Innovative describes an approach that uses fresh ideas to improve how something is done.","The studio developed an innovative workflow.","They are looking for innovative ways to teach vocabulary.","an innovative approach; innovative design; innovative ideas","an innovative approach（创新的方法）；innovative design（创新设计）；innovative ideas（创新想法）"],
    ["discovery-word-intuitive-01","intuitive","adjective","/ɪnˈtjuːɪtɪv/","Easy to understand or use without needing detailed instructions; based on intuition.","直观易懂的；凭直觉的","An intuitive interface feels natural to use, while an intuitive decision may come from instinct rather than analysis.","The new menu is more intuitive.","She had an intuitive sense that something was wrong.","an intuitive interface; an intuitive decision; feel intuitive","an intuitive interface（直观的界面）；an intuitive decision（凭直觉作出的决定）；feel intuitive（感觉自然易懂）"],
    ["discovery-word-versatile-01","versatile","adjective","/ˈvɜːsətaɪl/","Able to be used for many different purposes or perform many different tasks.","多用途的；多才多艺的","Versatile highlights the ability to adapt to different tasks or situations.","A versatile jacket works in several seasons.","He is a versatile performer who can play many roles.","a versatile tool; a versatile performer; highly versatile","a versatile tool（多用途工具）；a versatile performer（多才多艺的表演者）；highly versatile（用途广泛）"],
    ["discovery-word-ambiguous-01","ambiguous","adjective","/æmˈbɪɡjuəs/","Having more than one possible meaning, so the intended meaning is unclear.","模棱两可的；有歧义的","An ambiguous sentence can be understood in different ways because it lacks enough context.","The final instruction was ambiguous.","Try to avoid ambiguous wording in the form.","an ambiguous statement; ambiguous wording; remain ambiguous","an ambiguous statement（含义不明的陈述）；ambiguous wording（有歧义的措辞）；remain ambiguous（仍有歧义）"],
    ["discovery-word-arbitrary-01","arbitrary","adjective","/ˈɑːbɪtrəri/","Based on personal choice or chance rather than a clear reason or system.","任意的；武断的","Arbitrary describes a decision that seems unsupported by consistent rules or evidence.","The deadline felt arbitrary to the team.","The samples were assigned arbitrary numbers.","an arbitrary decision; an arbitrary rule; seem arbitrary","an arbitrary decision（武断的决定）；an arbitrary rule（随意制定的规则）；seem arbitrary（显得任意）"],
    ["discovery-word-assertive-01","assertive","adjective","/əˈsɜːtɪv/","Confident in expressing needs or opinions while respecting others.","坚定自信的；果断表达的","Assertive communication is clear and confident without being aggressive.","She was assertive but remained respectful.","You can be assertive when asking for clarification.","an assertive manner; assertive communication; be assertive","an assertive manner（坚定自信的态度）；assertive communication（坚定而尊重他人的沟通）；be assertive（自信明确地表达）"],
    ["discovery-word-authentic-01","authentic","adjective","/ɔːˈθentɪk/","Genuine and true to its origin, character or identity.","真实的；地道的；原汁原味的","Authentic can describe something genuine or a style that feels faithful to its source.","The restaurant serves authentic regional dishes.","Her writing has an authentic voice.","authentic experience; authentic food; an authentic voice","authentic experience（真实的体验）；authentic food（地道的食物）；an authentic voice（真实自然的表达风格）"],
    ["discovery-word-benevolent-01","benevolent","adjective","/bəˈnevələnt/","Kind and generous, especially when intending to help others.","仁慈的；乐善好施的","Benevolent is a relatively formal word for someone who wishes to do good for others.","The benevolent neighbour helped the family rebuild.","The organisation was founded by a benevolent donor.","a benevolent person; benevolent intentions; a benevolent fund","a benevolent person（仁慈的人）；benevolent intentions（善意）；a benevolent fund（慈善基金）"],
    ["discovery-word-conventional-01","conventional","adjective","/kənˈvenʃənəl/","Following ideas or methods that are usual, traditional or widely accepted.","传统的；常规的","Conventional describes what is normal or established, often in contrast with something experimental.","They chose a conventional layout for the report.","The artist prefers unconventional materials to conventional paint.","conventional approach; conventional wisdom; conventional methods","conventional approach（常规方法）；conventional wisdom（普遍认同的看法）；conventional methods（传统方法）"],
    ["discovery-word-credible-01","credible","adjective","/ˈkredəbəl/","Believable and supported by enough evidence to be trusted.","可信的；可靠的","A credible explanation or source gives people good reasons to believe it.","The witness gave a credible account.","Check whether the source is credible before sharing the claim.","a credible source; a credible explanation; highly credible","a credible source（可信的来源）；a credible explanation（可信的解释）；highly credible（非常可信）"],
    ["discovery-word-deliberate-01","deliberate","adjective","/dɪˈlɪbərət/","Done intentionally or carefully, rather than by accident or in a hurry.","故意的；审慎的","Deliberate can mean intentional, or careful and considered; context shows which meaning is intended.","The pause was deliberate, not accidental.","She took a deliberate approach to the decision.","a deliberate choice; deliberate action; a deliberate pace","a deliberate choice（有意作出的选择）；deliberate action（刻意行动）；a deliberate pace（从容而审慎的节奏）"],
    ["discovery-word-distinct-01","distinct","adjective","/dɪˈstɪŋkt/","Clearly different or separate from something else.","明显不同的；独特的","Distinct is used when differences are clear enough to recognise or when items are separate.","The two designs have distinct visual styles.","There are three distinct stages in the process.","distinct features; distinct from; a distinct possibility","distinct features（鲜明特征）；distinct from（与……明显不同）；a distinct possibility（相当大的可能性）"],
    ["discovery-word-efficient-01","efficient","adjective","/ɪˈfɪʃənt/","Working well without wasting time, effort or resources.","高效的；效率高的","Efficient describes a method or system that achieves a result with little waste.","The new process is faster and more efficient.","An efficient learner uses short, focused review sessions.","an efficient system; work efficiently; energy-efficient","an efficient system（高效的系统）；work efficiently（高效工作）；energy-efficient（节能的）"],

    ["discovery-word-elaborate-01","elaborate","adjective","/ɪˈlæbərət/","Containing many carefully arranged details; complicated but developed.","精心设计的；详尽的","Elaborate describes something with many connected details, such as a plan, design or explanation.","The invitation had an elaborate gold border.","He gave an elaborate explanation of the process.","an elaborate design; an elaborate plan; elaborate details","an elaborate design（精心设计的图案）；an elaborate plan（周密的计划）；elaborate details（详尽的细节）"],
    ["discovery-word-evident-01","evident","adjective","/ˈevɪdənt/","Clear and easy to see or understand from the available facts.","明显的；显而易见的","Evident is often used when something becomes clear through signs or evidence.","It was evident that the team needed more time.","The benefits became evident after a few weeks.","be evident; it is evident that; become evident","be evident（显而易见）；it is evident that（显然……）；become evident（逐渐显现）"],
    ["discovery-word-exceptional-01","exceptional","adjective","/ɪkˈsepʃənəl/","Unusually good or much greater than what is normal.","杰出的；非凡的","Exceptional describes a quality or result that is far above the usual standard.","Her portfolio shows exceptional attention to detail.","The service was exceptional from start to finish.","exceptional quality; exceptional talent; an exceptional case","exceptional quality（卓越的品质）；exceptional talent（非凡的才能）；an exceptional case（特殊情况）"],
    ["discovery-word-flexible-01","flexible","adjective","/ˈfleksəbəl/","Able to change or adapt easily when circumstances require it.","灵活的；有弹性的","Flexible can describe schedules, materials or people who can adapt to change.","The studio offers flexible working hours.","We need a flexible plan in case the weather changes.","flexible schedule; flexible approach; be flexible","flexible schedule（灵活的时间安排）；flexible approach（灵活的方法）；be flexible（灵活变通）"],
    ["discovery-word-hesitant-01","hesitant","adjective","/ˈhezɪtənt/","Slow to act or speak because of uncertainty or lack of confidence.","犹豫的；迟疑的","Hesitant describes a pause caused by uncertainty, not necessarily a refusal.","He was hesitant to ask for help.","Her hesitant answer suggested she was unsure.","hesitant to do something; sound hesitant; a hesitant response","hesitant to do something（犹豫是否做某事）；sound hesitant（听起来迟疑）；a hesitant response（迟疑的回应）"],
    ["discovery-word-humble-01","humble","adjective","/ˈhʌmbəl/","Not thinking that you are more important or better than other people.","谦逊的；谦虚的","Humble usually describes someone who does not boast about achievements or status.","Despite the award, he remained humble.","She gave a humble thank-you to the whole team.","a humble person; remain humble; a humble beginning","a humble person（谦逊的人）；remain humble（保持谦虚）；a humble beginning（平凡的起点）"],
    ["discovery-word-immense-01","immense","adjective","/ɪˈmens/","Extremely large in size, amount or degree.","巨大的；广大的","Immense emphasises a very great size, amount or effect.","The project required an immense amount of planning.","The library has immense historical value.","immense pressure; an immense amount; immense value","immense pressure（巨大压力）；an immense amount（大量）；immense value（巨大价值）"],
    ["discovery-word-intricate-01","intricate","adjective","/ˈɪntrɪkət/","Having many small parts or details that fit together in a complicated way.","错综复杂的；精细复杂的","Intricate often describes patterns, designs, systems or problems with many connected details.","The artist created an intricate paper sculpture.","The machine has an intricate internal mechanism.","intricate pattern; intricate design; intricate details","intricate pattern（复杂精美的图案）；intricate design（精细复杂的设计）；intricate details（繁复细节）"],
    ["discovery-word-logical-01","logical","adjective","/ˈlɒdʒɪkəl/","Following clear reasoning and making sense.","合乎逻辑的；合理的","A logical conclusion follows from the information and reasons that come before it.","That is a logical next step.","Try to arrange the instructions in a logical order.","logical conclusion; logical choice; logical order","logical conclusion（合乎逻辑的结论）；logical choice（合理的选择）；logical order（逻辑顺序）"],
    ["discovery-word-modest-01","modest","adjective","/ˈmɒdɪst/","Not large, expensive or extreme; also not boasting about one's abilities.","适度的；谦虚的","Modest has several common meanings: a limited size or amount, or a humble attitude.","The team made modest improvements this month.","She is modest about her achievements.","a modest amount; modest improvement; remain modest","a modest amount（适量）；modest improvement（小幅改善）；remain modest（保持谦逊）"],
    ["discovery-word-obscure-01","obscure","adjective","/əbˈskjʊə/","Not well known or easy to understand; difficult to see clearly.","鲜为人知的；晦涩的；模糊的","Obscure can describe information that few people know or language that is difficult to understand.","The article refers to an obscure historical event.","The meaning of the phrase is obscure without context.","an obscure reference; obscure language; remain obscure","an obscure reference（鲜为人知的典故）；obscure language（晦涩的语言）；remain obscure（仍不清楚）"],
    ["discovery-word-optimistic-01","optimistic","adjective","/ˌɒptɪˈmɪstɪk/","Expecting that good things are likely to happen.","乐观的","Optimistic describes a positive expectation about the future, even when success is not certain.","She is optimistic about the new project.","The team remains optimistic despite the delay.","feel optimistic; an optimistic outlook; optimistic about","feel optimistic（感到乐观）；an optimistic outlook（乐观的展望）；optimistic about（对……持乐观态度）"],
    ["discovery-word-persistent-01","persistent","adjective","/pəˈsɪstənt/","Continuing to try or continuing to exist despite difficulty or opposition.","坚持不懈的；持续存在的","Persistent can describe determined effort or a problem that does not go away.","Persistent practice helped him improve his pronunciation.","The area has a persistent shortage of affordable homes.","persistent effort; a persistent problem; remain persistent","persistent effort（持续努力）；a persistent problem（长期存在的问题）；remain persistent（坚持不懈）"],
    ["discovery-word-profound-01","profound","adjective","/prəˈfaʊnd/","Very great or intense; showing deep understanding or meaning.","深刻的；意义深远的","Profound is used for ideas, effects or feelings that are deep or powerful.","The book had a profound effect on her thinking.","He asked a profound question about fairness.","a profound effect; profound insight; profound change","a profound effect（深远的影响）；profound insight（深刻的见解）；profound change（深刻的变化）"],
    ["discovery-word-remarkable-01","remarkable","adjective","/rɪˈmɑːkəbəl/","Unusual or impressive enough to attract attention.","非凡的；引人注目的","Remarkable highlights something worth noticing because it is unusual or impressive.","The building survived a remarkable number of storms.","She made remarkable progress in a short time.","remarkable progress; a remarkable achievement; it is remarkable that","remarkable progress（显著进步）；a remarkable achievement（非凡成就）；it is remarkable that（值得注意的是）"],
    ["discovery-word-resourceful-01","resourceful","adjective","/rɪˈsɔːsfəl/","Good at finding practical ways to solve problems with what is available.","足智多谋的；善于应变的","A resourceful person finds workable solutions instead of giving up when resources are limited.","The resourceful designer reused the available materials.","We need someone resourceful who can handle unexpected problems.","a resourceful person; be resourceful; resourceful solution","a resourceful person（足智多谋的人）；be resourceful（善于应变）；resourceful solution（巧妙可行的解决办法）"],
    ["discovery-word-sincere-01","sincere","adjective","/sɪnˈsɪə/","Honest and genuine in what you say, feel or intend.","真诚的；诚恳的","Sincere describes feelings or words that are honestly meant rather than polite or false.","Please accept my sincere thanks.","Her sincere apology helped rebuild trust.","sincere thanks; a sincere apology; sincerely believe","sincere thanks（诚挚的感谢）；a sincere apology（真诚的道歉）；sincerely believe（真心相信）"],
    ["discovery-word-sufficient-01","sufficient","adjective","/səˈfɪʃənt/","As much as is needed for a particular purpose.","足够的；充足的","Sufficient is a slightly formal alternative to enough and is often used with for or to.","We have sufficient time to review the draft.","One example is not sufficient to prove the point.","sufficient time; sufficient evidence; sufficient for","sufficient time（足够的时间）；sufficient evidence（充分的证据）；sufficient for（足以满足……）"],
    ["discovery-word-temporary-01","temporary","adjective","/ˈtempərəri/","Lasting for a limited period and not intended to be permanent.","暂时的；临时的","Temporary describes a situation or arrangement that is expected to change or end.","The road closure is temporary.","She accepted a temporary position while studying.","temporary solution; temporary change; temporarily unavailable","temporary solution（临时解决方案）；temporary change（暂时的改变）；temporarily unavailable（暂时无法使用）"],
    ["discovery-word-transparent-01","transparent","adjective","/trænsˈpærənt/","Easy to see through; also open and clear about actions or decisions.","透明的；公开透明的","Transparent can describe a material that lets light pass through or a process that is easy to understand and inspect.","The glass door is almost transparent.","The organisation promised a transparent selection process.","transparent material; transparent process; be transparent about","transparent material（透明材料）；transparent process（公开透明的流程）；be transparent about（坦诚说明）"],
    ["discovery-word-unique-01","unique","adjective","/juːˈniːk/","Being the only one of its kind or very different from others.","独特的；独一无二的","Unique emphasises that something has no exact equivalent, although it is often used informally to mean very unusual.","Each handmade piece has a unique pattern.","The city has a unique mix of cultures.","a unique opportunity; a unique feature; unique to","a unique opportunity（独特的机会）；a unique feature（独有的特点）；unique to（为……所独有）"],
    ["discovery-word-worthwhile-01","worthwhile","adjective","/ˌwɜːθˈwaɪl/","Useful, important or enjoyable enough to justify the time or effort spent.","值得的；有价值的","Worthwhile describes an activity or result that makes the effort feel worthwhile.","The extra practice was worthwhile.","It is worthwhile to compare several sources.","a worthwhile experience; worthwhile effort; be worthwhile","a worthwhile experience（有价值的经历）；worthwhile effort（值得付出的努力）；be worthwhile（值得做）"],
    ["discovery-word-abundant-01","abundant","adjective","/əˈbʌndənt/","Existing in large quantities or more than enough.","丰富的；充裕的","Abundant is a formal way to describe something available in large amounts.","The region has abundant natural resources.","There is abundant evidence to support the claim.","abundant resources; abundant evidence; be abundant in","abundant resources（丰富的资源）；abundant evidence（充分的证据）；be abundant in（富含……）"],
    ["discovery-word-accessible-01","accessible","adjective","/əkˈsesəbəl/","Easy to reach, enter, use or understand.","容易到达的；易于使用的；易懂的","Accessible can refer to physical access, inclusive design or information that is easy to understand.","The website makes the lessons accessible on mobile devices.","The museum is accessible by public transport.","easily accessible; accessible information; make something accessible","easily accessible（容易使用或到达）；accessible information（易懂的信息）；make something accessible（让某物更易使用）"],
    ["discovery-word-accurate-01","accurate","adjective","/ˈækjərət/","Correct and free from mistakes.","准确的；精确的","Accurate describes information, measurements or work that matches the facts or intended result.","Please check that the figures are accurate.","The map gives an accurate picture of the area.","accurate information; accurate measurement; be accurate","accurate information（准确信息）；accurate measurement（精确测量）；be accurate（准确无误）"],
    ["discovery-word-adaptable-01","adaptable","adjective","/əˈdæptəbəl/","Able to change or adjust successfully to new conditions.","适应力强的；能灵活调整的","Adaptable describes people or systems that can respond well when circumstances change.","An adaptable team can handle new requirements.","She is adaptable and learns new software quickly.","an adaptable person; adaptable system; highly adaptable","an adaptable person（适应力强的人）；adaptable system（可灵活调整的系统）；highly adaptable（适应性很强）"],
    ["discovery-word-adjacent-01","adjacent","adjective","/əˈdʒeɪsənt/","Next to or very close to something else.","邻近的；毗连的","Adjacent is commonly used in descriptions of rooms, buildings, streets or areas that are next to one another.","The meeting room is adjacent to the reception area.","They bought two adjacent plots of land.","adjacent to; adjacent room; adjacent areas","adjacent to（紧邻……）；adjacent room（隔壁房间）；adjacent areas（相邻区域）"],


    ["discovery-word-cautious-01","cautious","adjective","/ˈkɔːʃəs/","Careful to avoid danger, mistakes or unnecessary risks.","谨慎的；小心的","Cautious describes a careful attitude when a decision could have unwanted consequences.","Be cautious when opening links from unknown sources.","The team took a cautious approach to the launch.","a cautious approach; be cautious about; cautiously optimistic","a cautious approach（谨慎的方法）；be cautious about（对……保持谨慎）；cautiously optimistic（谨慎乐观）"],
    ["discovery-word-compelling-01","compelling","adjective","/kəmˈpelɪŋ/","Very convincing or interesting, so that it attracts attention or makes people act.","令人信服的；引人入胜的","A compelling argument gives strong reasons to agree; a compelling story holds attention.","She made a compelling case for the change.","The documentary tells a compelling story.","a compelling argument; compelling evidence; a compelling story","a compelling argument（有说服力的论点）；compelling evidence（有力的证据）；a compelling story（引人入胜的故事）"],
    ["discovery-word-competent-01","competent","adjective","/ˈkɒmpɪtənt/","Having the ability and knowledge needed to do something successfully.","有能力的；称职的","Competent means capable of doing a task to an acceptable standard; it does not necessarily mean outstanding.","The new assistant is competent and reliable.","You need a competent technician to inspect the device.","a competent professional; be competent at; fully competent","a competent professional（称职的专业人士）；be competent at（有能力做……）；fully competent（完全胜任）"],
    ["discovery-word-considerate-01","considerate","adjective","/kənˈsɪdərət/","Thinking about other people's needs and feelings before acting.","体贴的；替他人着想的","A considerate person notices how their actions may affect other people.","It was considerate of her to check before changing the plan.","Please be considerate of your neighbours.","a considerate person; considerate of others; thoughtful and considerate","a considerate person（体贴的人）；considerate of others（为他人着想）；thoughtful and considerate（周到体贴）"],
    ["discovery-word-consistent-01","consistent","adjective","/kənˈsɪstənt/","Staying the same in quality, behaviour or results over time.","一致的；始终如一的","Consistent can describe reliable habits, matching information or results that do not change unexpectedly.","Short, consistent practice is often effective.","Make sure the spelling is consistent throughout the document.","consistent quality; remain consistent; consistent with","consistent quality（稳定的品质）；remain consistent（保持一致）；consistent with（与……一致）"],
    ["discovery-word-constructive-01","constructive","adjective","/kənˈstrʌktɪv/","Helpful and intended to improve a situation rather than simply criticise it.","建设性的；有助益的","Constructive feedback identifies a problem while offering a useful direction for improvement.","The reviewer gave constructive suggestions.","They had a constructive discussion about the design.","constructive feedback; constructive criticism; a constructive discussion","constructive feedback（建设性反馈）；constructive criticism（建设性批评）；a constructive discussion（有益的讨论）"],
    ["discovery-word-crucial-01","crucial","adjective","/ˈkruːʃəl/","Extremely important because it can determine the success or result of something.","至关重要的；决定性的","Crucial highlights something that has a major effect on the final outcome.","Clear communication is crucial to the project.","The next few days will be crucial.","crucial to; a crucial role; a crucial decision","crucial to（对……至关重要）；a crucial role（关键作用）；a crucial decision（关键决定）"],
    ["discovery-word-diverse-01","diverse","adjective","/daɪˈvɜːs/","Including people or things that are different from one another.","多样的；形形色色的","Diverse emphasises variety within a group, collection or community.","The course uses examples from diverse situations.","The city has a diverse population.","a diverse range; culturally diverse; diverse backgrounds","a diverse range（多种多样的范围）；culturally diverse（文化多元的）；diverse backgrounds（不同背景）"],
    ["discovery-word-frequent-01","frequent","adjective","/ˈfriːkwənt/","Happening often or at short intervals.","频繁的；经常发生的","Frequent describes something that happens many times, while frequently is the adverb form.","Frequent breaks can help maintain concentration.","The area experiences frequent heavy rain.","frequent visits; frequent changes; occur frequently","frequent visits（频繁拜访）；frequent changes（频繁变化）；occur frequently（经常发生）"],
    ["discovery-word-generous-01","generous","adjective","/ˈdʒenərəs/","Willing to give or share more than is expected; also large in amount or size.","慷慨的；宽宏大量的","Generous can describe a person who gives freely or an amount that is larger than usual.","It was generous of him to share his notes.","The recipe uses a generous amount of fresh herbs.","a generous offer; generous with time; a generous amount","a generous offer（慷慨的提议）；generous with time（乐于付出时间）；a generous amount（大量）"],
    ["discovery-word-gradual-01","gradual","adjective","/ˈɡrædʒuəl/","Happening slowly over a period rather than suddenly.","逐渐的；渐进的","Gradual describes a change that happens in small steps over time.","The town has seen a gradual increase in visitors.","Make gradual changes instead of changing everything at once.","a gradual change; gradual improvement; a gradual increase","a gradual change（逐步变化）；gradual improvement（逐渐改善）；a gradual increase（逐步增加）"],
    ["discovery-word-hostile-01","hostile","adjective","/ˈhɒstaɪl/","Unfriendly or strongly opposed; sometimes showing anger or aggression.","敌对的；不友善的","Hostile can describe an unfriendly attitude, an environment or strong opposition to an idea.","The proposal received a hostile response.","Some plants cannot survive in a hostile environment.","a hostile reaction; hostile environment; be hostile to","a hostile reaction（敌对的反应）；hostile environment（恶劣环境）；be hostile to（对……抱有敌意）"],
    ["discovery-word-relevant-01","relevant","adjective","/ˈreləvənt/","Directly connected with the subject or useful for the matter being considered.","相关的；切题的","Relevant information helps answer the question or supports the current discussion.","Please include only relevant details in the summary.","Her experience is relevant to the role.","relevant information; relevant to; highly relevant","relevant information（相关信息）；relevant to（与……有关）；highly relevant（高度相关）"],
    ["discovery-word-reliable-01","reliable","adjective","/rɪˈlaɪəbəl/","Able to be trusted to work well or provide correct information.","可靠的；可信赖的","Reliable describes a person, tool or source that can be depended on over time.","We need a reliable internet connection for the meeting.","Use reliable sources when checking a claim.","a reliable source; reliable service; be reliable","a reliable source（可靠的信息来源）；reliable service（稳定可靠的服务）；be reliable（值得信赖）"],
    ["discovery-word-significant-01","significant","adjective","/sɪɡˈnɪfɪkənt/","Important or large enough to have a noticeable effect or meaning.","重要的；显著的","Significant can mean important, or large enough to be noticeable in a measurement or result.","The update brought a significant improvement.","There was a significant difference between the two results.","significant change; significant impact; highly significant","significant change（显著变化）；significant impact（重大影响）；highly significant（非常重要／显著）"],
    ["discovery-word-straightforward-01","straightforward","adjective","/ˌstreɪtˈfɔːwəd/","Easy to understand or do; honest and direct in manner.","简单明了的；直截了当的","Straightforward describes a task without unnecessary difficulty or communication without hidden meaning.","The installation process is straightforward.","She gave a straightforward answer to the question.","a straightforward process; straightforward explanation; be straightforward","a straightforward process（简单的流程）；straightforward explanation（清楚明了的解释）；be straightforward（坦率直接）"],
    ["discovery-word-sustainable-01","sustainable","adjective","/səˈsteɪnəbəl/","Able to continue for a long time without using up resources or causing unacceptable harm.","可持续的；能长期维持的","Sustainable is often used for practices that can continue while protecting resources and the environment.","The city is investing in sustainable transport.","A sustainable study routine is better than an exhausting short burst.","sustainable development; sustainable growth; environmentally sustainable","sustainable development（可持续发展）；sustainable growth（可持续增长）；environmentally sustainable（环境可持续的）"],
    ["discovery-word-tentative-01","tentative","adjective","/ˈtentətɪv/","Not final or certain; done carefully because more information may be needed.","暂定的；试探性的","Tentative is useful for plans, agreements or conclusions that may still change.","We made a tentative booking for Friday.","The early results are tentative and need further testing.","a tentative plan; tentative agreement; tentative conclusion","a tentative plan（暂定计划）；tentative agreement（初步协议）；tentative conclusion（暂时性结论）"],
    ["discovery-word-thorough-01","thorough","adjective","/ˈθʌrə/","Complete and careful, including all important details.","彻底的；全面细致的","Thorough emphasises that a task or check covers everything important rather than only the obvious parts.","The technician carried out a thorough inspection.","Please give the document a thorough review.","a thorough check; thorough research; be thorough","a thorough check（全面检查）；thorough research（深入研究）；be thorough（做事周全细致）"],
    ["discovery-word-valid-01","valid","adjective","/ˈvælɪd/","Acceptable or legally/ logically sound according to the relevant rules or facts.","有效的；合理的；成立的","Valid can describe a document that is still accepted, or an argument that follows sound reasoning.","You need a valid ticket to enter.","That is a valid point, and we should consider it.","a valid reason; valid until; a valid argument","a valid reason（合理的理由）；valid until（有效期至）；a valid argument（成立的论点）"],
    ["discovery-word-vulnerable-01","vulnerable","adjective","/ˈvʌlnərəbəl/","Easily harmed, influenced or affected by a particular danger or difficulty.","脆弱的；易受伤害的","Vulnerable describes someone or something with less protection against harm or risk.","Young plants are vulnerable to frost.","The system is vulnerable to this type of attack.","vulnerable to; a vulnerable group; feel vulnerable","vulnerable to（容易受到……影响）；a vulnerable group（弱势群体）；feel vulnerable（感到脆弱）"],
    ["discovery-word-wary-01","wary","adjective","/ˈweəri/","Careful because you do not fully trust a person, situation or possibility.","谨慎提防的；警惕的","Wary suggests caution caused by possible risk or uncertainty.","Be wary of messages asking for personal details.","Investors remained wary after the sudden price change.","be wary of; a wary expression; remain wary","be wary of（提防……）；a wary expression（警惕的神情）；remain wary（保持警惕）"],
    ["discovery-word-vivid-01","vivid","adjective","/ˈvɪvɪd/","Producing strong, clear images or feelings in the mind; bright and intense.","生动的；鲜明的","Vivid often describes memories, descriptions, colours or imagination that feel especially clear.","She gave a vivid description of the journey.","The artist used vivid colours in the poster.","a vivid memory; vivid description; vivid colours","a vivid memory（清晰鲜明的记忆）；vivid description（生动的描述）；vivid colours（鲜艳的色彩）"],
    ["discovery-word-adequate-01","adequate","adjective","/ˈædɪkwət/","Enough for a particular purpose or need, although not necessarily excellent.","足够的；合格的","Adequate means sufficient to meet a requirement, but it can suggest that the quality is only acceptable.","The room has adequate lighting for reading.","We need adequate evidence before making a decision.","adequate time; adequate protection; be adequate for","adequate time（足够的时间）；adequate protection（充分的保护）；be adequate for（足以满足……）"],
    ["discovery-word-compatible-01","compatible","adjective","/kəmˈpætəbəl/","Able to exist, work or be used together without problems.","兼容的；相容的","Compatible is common in technology, relationships and systems that can function together.","Check that the software is compatible with your device.","The new schedule is compatible with my classes.","compatible with; fully compatible; compatible devices","compatible with（与……兼容）；fully compatible（完全兼容）；compatible devices（兼容设备）"],
    ["discovery-word-comprehensive-01","comprehensive","adjective","/ˌkɒmprɪˈhensɪv/","Including nearly all important details or aspects of a subject.","全面的；综合性的","Comprehensive describes coverage that is broad and detailed rather than limited to one part.","The guide provides a comprehensive introduction to the topic.","We need a comprehensive review before release.","a comprehensive guide; comprehensive review; comprehensive coverage","a comprehensive guide（全面的指南）；comprehensive review（全面审查）；comprehensive coverage（全面涵盖）"],


    ["discovery-word-astounding-01","astounding","adjective","/əˈstaʊndɪŋ/","Extremely surprising or impressive.","令人震惊的；惊人的","Astounding describes something so surprising or impressive that it is difficult to believe.","The team made astounding progress in a few months.","The view from the mountain was astounding.","astounding progress; an astounding result; truly astounding","astounding progress（惊人的进展）；an astounding result（令人惊叹的结果）；truly astounding（确实令人震撼）"],
    ["discovery-word-intriguing-01","intriguing","adjective","/ɪnˈtriːɡɪŋ/","Interesting because it is unusual or makes you want to know more.","有趣的；引人好奇的","Intriguing describes something that creates curiosity because it is unusual or not fully explained.","The article raises an intriguing question.","We noticed an intriguing detail in the old photograph.","an intriguing idea; an intriguing question; find something intriguing","an intriguing idea（耐人寻味的想法）；an intriguing question（引人深思的问题）；find something intriguing（觉得某事很有趣）"]

  ];
  const dailyDiscoveryVocabulary = [
    ...dailyDiscoveryCoreVocabulary,
    ...dailyDiscoveryAdditionalWords.map(([id,word,part,phonetic,definition,definitionZh,body,example1,example2,tip,tipZh]) => ({
      id,word,part,phonetic,definition,definitionZh,body,examples:[example1,example2],tip,tipZh,
      topicId:"daily-discovery-vocabulary",difficulty:"intermediate"
    }))
  ];
  const DAILY_DISCOVERY_SCHEDULE_VERSION = 1;
  const DAILY_DISCOVERY_SCHEDULE_EPOCH = "2026-11-15";
  const DAILY_DISCOVERY_SCHEDULE_POOL_SIZE = 93;

  const legacyDailyDiscoveriesBacklog = [
    { id:"discovery-look-forward-01", category:"Grammar insight", title:"The hidden grammar in “look forward to”", body:"In this expression, to is a preposition rather than an infinitive marker. Follow it with a noun or an -ing form.", example:"I look forward to meeting your team.", zh:"这个表达中的 to 是介词，不是不定式标记。后面可以接名词或 -ing 形式。", zhExample:"I look forward to meeting your team.", source:"Cambridge Dictionary · English Grammar Today", sourceUrl:"https://dictionary.cambridge.org/grammar/british-grammar/word-patterns-look-forward-to" },
    { id:"discovery-less-fewer-01", category:"Usage note", title:"Less and fewer are not interchangeable in formal writing", body:"Use fewer with plural countable nouns and less with uncountable nouns. You may hear less with plural nouns in informal speech, but fewer is the safer choice in formal writing.", example:"fewer meetings / less time", zh:"正式写作中，fewer 通常搭配可数复数名词，less 通常搭配不可数名词。口语中也常听到 less 搭配复数名词。", zhExample:"fewer meetings / less time", source:"Cambridge Dictionary · English Grammar Today", sourceUrl:"https://dictionary.cambridge.org/grammar/british-grammar/less-or-fewer" },
    { id:"discovery-say-tell-01", category:"Common mistake", title:"Why “tell me” but “say to me”?", body:"Tell normally takes the listener directly as its object. With say, add to before the listener.", example:"Tell me the answer. / Say the answer to me.", zh:"tell 后面通常直接接听话的人；say 若要指出听话的人，通常在对方前面加 to。", zhExample:"Tell me the answer. / Say the answer to me.", source:"Cambridge Dictionary · About Words", sourceUrl:"https://dictionaryblog.cambridge.org/2015/11/11/say-and-tell-how-to-talk-about-talking-1/" },
    { id:"discovery-information-01", category:"Vocabulary fact", title:"Why “informations” is usually incorrect", body:"Information is an uncountable noun in standard English. To count separate pieces, say a piece of information or two items of information.", example:"Could you give me some information? / I found three useful pieces of information.", zh:"information 在标准英语中通常是不可数名词。要表达具体条数，可以说 a piece of information。", zhExample:"some information / three pieces of information", source:"Cambridge Dictionary · About Words", sourceUrl:"https://dictionaryblog.cambridge.org/2018/03/21/countable-or-uncountable-and-why-it-matters/" },
    { id:"discovery-salary-01", category:"Etymology", title:"The history behind “salary” is more complicated than the salt story", body:"English salary came through Anglo-French from Latin salarium, a word for an allowance or payment. The Latin root is connected with salt, but the popular story that Roman soldiers were literally paid in salt or a salt allowance is debated and not firmly established.", example:"salary → Anglo-French salarie / Old French salaire → Latin salarium", zh:"salary 经由盎格鲁法语源自拉丁语 salarium，原指津贴或报酬。它的词根与“盐”有关，但“罗马士兵直接以盐作为工资”的流行说法仍有争议，不能当作已证实的事实。", zhExample:"salary → Anglo-French salarie / Old French salaire → Latin salarium", source:"Wordorigins.org · Salary", sourceUrl:"https://www.wordorigins.org/big-list-entries/salary" },
    { id:"discovery-verb-patterns-01", category:"Grammar insight", title:"Some verbs prefer -ing; others prefer to + verb", body:"English verb patterns depend on the first verb. Enjoy is followed by an -ing form; want is followed by a to-infinitive. Some verbs allow both forms, sometimes with a change in meaning.", example:"I enjoy learning languages. / I want to learn another language.", zh:"英语动词后面的结构取决于前面的动词。enjoy 后接 -ing；want 后接 to + 动词原形。有些动词两种形式都可以，但意思可能不同。", zhExample:"I enjoy learning languages. / I want to learn another language.", source:"British Council · LearnEnglish", sourceUrl:"https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/verbs-followed-ing-or-infinitive" },
    {"id":"discovery-present-simple-02","category":"Grammar insight","title":"Why the third-person -s matters","body":"In the present simple, most verbs take -s or -es with he, she and it. The ending marks subject–verb agreement; it is not an optional decoration.","example":"They work remotely. / She works remotely.","zh":"一般现在时中，大多数动词在 he、she、it 作主语时要加 -s 或 -es。这一词尾体现主谓一致，并非可有可无。","zhExample":"They work remotely. / She works remotely。","source":"British Council · Present simple","sourceUrl":"https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-simple"},
    {"id":"discovery-present-continuous-02","category":"Usage note","title":"Temporary situations can use the present continuous","body":"The present continuous is not limited to actions happening at the exact second of speaking. It can also describe temporary situations around the present.","example":"I am working from home this week.","zh":"现在进行时不只描述说话这一刻正在发生的动作，也可以描述当前阶段的临时情况。","zhExample":"I am working from home this week。","source":"British Council · Present continuous","sourceUrl":"https://learnenglish.britishcouncil.org/grammar/a1-a2-grammar/present-continuous"},
    {"id":"discovery-time-prepositions-02","category":"Common mistake","title":"A useful way to remember at, on and in","body":"Think from smaller to larger time units: at a time, on a day or date, in a month or year. Some fixed expressions do not follow this simple pattern, so learn them separately.","example":"at noon / on 12 June / in 2026","zh":"可以按时间范围由小到大记忆：具体时刻用 at，星期或日期用 on，月份或年份用 in。部分固定表达不遵循这一简单规律，需要单独记忆。","zhExample":"at noon / on 12 June / in 2026","source":"Cambridge Dictionary · Prepositions of time","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/prepositions-of-time"},
    {"id":"discovery-pronouns-02","category":"Grammar insight","title":"A pronoun changes form depending on its job","body":"English pronouns can have subject and object forms. Compare “They invited us” with “We invited them”: the form changes with the grammatical role.","example":"She called him. / He called her.","zh":"英语代词会根据语法作用改变形式。比较 They invited us 和 We invited them：代词形式会随主语或宾语角色变化。","zhExample":"She called him. / He called her。","source":"Cambridge Dictionary · Pronouns","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/pronouns"},
    {"id":"discovery-the-02","category":"Usage note","title":"The often points back to something already introduced","body":"A noun may be introduced with a or an and then referred to with the when the reader or listener can identify the same thing.","example":"We found a café. The café was still open.","zh":"先用 a 或 an 引入某个名词，之后当读者或听者能确定是同一个对象时，可以使用 the 再次提及。","zhExample":"We found a café. The café was still open。","source":"British Council · Articles","sourceUrl":"https://learnenglish.britishcouncil.org/grammar/a1-a2-grammar/articles"},
    {"id":"discovery-many-much-02","category":"Vocabulary fact","title":"Many and much follow countability","body":"Many normally combines with plural countable nouns, while much combines with uncountable nouns. In everyday affirmative sentences, a lot of often sounds more conversational.","example":"many questions / much patience / a lot of work","zh":"many 通常搭配可数复数名词，much 搭配不可数名词。在日常肯定句中，a lot of 往往听起来更自然。","zhExample":"many questions / much patience / a lot of work","source":"Cambridge Dictionary · Much, many, a lot of","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/much-many-with-a-noun"},
    {"id":"discovery-everyday-get-02","category":"Vocabulary insight","title":"Get is common but highly context-dependent","body":"Get can mean receive, obtain, become, arrive or understand, depending on the phrase. The words around it usually reveal the intended meaning.","example":"get a message / get tired / get home / get the idea","zh":"get 是常见但含义依赖语境的动词，可以表示收到、获得、变得、到达或理解。周围的词通常能帮助判断具体意思。","zhExample":"get a message / get tired / get home / get the idea","source":"Cambridge Dictionary · Get","sourceUrl":"https://dictionary.cambridge.org/dictionary/english/get"},
    {"id":"discovery-frequency-02","category":"Grammar insight","title":"Frequency adverbs have a usual position","body":"Adverbs such as usually and often normally go before a main verb, but after be. They can move for emphasis, but the usual position is a reliable starting point.","example":"We often travel by train. / She is often busy.","zh":"usually 和 often 等频率副词通常放在实义动词之前，但放在 be 动词之后。为了强调，它们也可能移动位置；常见位置是学习时可靠的起点。","zhExample":"We often travel by train. / She is often busy。","source":"British Council · Adverbs of frequency","sourceUrl":"https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/how-often"},
    {"id":"discovery-phrasal-pronoun-02","category":"Common mistake","title":"Keep the pronoun inside a separable phrasal verb","body":"With a separable phrasal verb such as turn off, a pronoun object normally goes between the verb and particle: turn it off. A noun object can often go in either position.","example":"Turn the radio off. / Turn it off.","zh":"对于 turn off 这类可分短语动词，代词宾语通常放在动词和小品词之间：turn it off。名词宾语通常可以放在两个位置。","zhExample":"Turn the radio off. / Turn it off。","source":"Cambridge Dictionary · Phrasal verbs","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/phrasal-verbs-and-multi-"},
    {"id":"discovery-word-suffix-02","category":"Word formation","title":"A suffix can change a word's part of speech","body":"Adding a suffix may turn an adjective into a noun or an adjective into an adverb. The spelling can change too, so check the complete form.","example":"happy → happiness / careful → carefully","zh":"添加后缀可以把形容词变成名词或副词。拼写也可能随之变化，因此要确认完整形式。","zhExample":"happy → happiness / careful → carefully","source":"British Council · Word formation","sourceUrl":"https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/word-formation"},
    {"id":"discovery-conditionals-02","category":"Grammar insight","title":"The if-clause does not usually take will in the first conditional","body":"For a likely future condition, English commonly uses the present simple in the if-clause and will in the result clause.","example":"If you finish early, we will go for a walk.","zh":"表达未来可能发生的条件时，英语通常在 if 从句中使用一般现在时，在结果从句中使用 will。","zhExample":"If you finish early, we will go for a walk。","source":"British Council · Conditionals","sourceUrl":"https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar/conditionals"},
    {"id":"discovery-second-conditional-02","category":"Usage note","title":"Past form can describe an unreal present","body":"In the second conditional, a past form in the if-clause does not necessarily refer to past time. It helps present the situation as imagined or unlikely.","example":"If I lived near the sea, I would swim every day.","zh":"第二条件句中的 if 从句虽然使用过去式，但不一定指过去时间；它用于把情境表达为想象或可能性较低。","zhExample":"If I lived near the sea, I would swim every day。","source":"British Council · Conditionals","sourceUrl":"https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar/conditionals"},
    {"id":"discovery-modal-deduction-02","category":"Grammar insight","title":"Must can express a logical deduction","body":"Must is not only used for obligation. In a positive statement, it can show that the speaker feels something is very likely based on evidence.","example":"The ground is wet. It must have rained.","zh":"must 不只用于表达义务。在肯定句中，它也可以表示说话者根据证据作出的强烈推断。","zhExample":"The ground is wet. It must have rained。","source":"Cambridge Dictionary · Must","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/must"},
    {"id":"discovery-inversion-02","category":"Advanced grammar","title":"Fronted negative expressions can make writing emphatic","body":"Expressions such as never, rarely and not only can trigger subject–auxiliary inversion when placed at the beginning of a clause. This is more common in formal or rhetorical language.","example":"Not only did she finish early, but she also helped the team.","zh":"never、rarely 和 not only 等表达放在从句句首时，可能触发主语与助动词倒装。这种结构较常见于正式或修辞性语言。","zhExample":"Not only did she finish early, but she also helped the team。","source":"Cambridge Dictionary · Inversion","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/inversion"},
    {"id":"discovery-idiom-context-02","category":"Expression insight","title":"Idioms need context, not just a definition","body":"An idiom may be informal, humorous or unsuitable for a formal report. Check who you are speaking to and the situation before using it.","example":"“Give me a hand” is friendly and informal; “Could you assist me?” is more formal.","zh":"习语可能带有非正式、幽默等语气，也可能不适合正式报告。使用前应考虑听众和场合。","zhExample":"“Give me a hand” 较友好且非正式；“Could you assist me?” 更正式。","source":"British Council · Idioms","sourceUrl":"https://learnenglish.britishcouncil.org/vocabulary/idioms"},
    {"id":"discovery-academic-caution-02","category":"Writing insight","title":"Cautious language makes claims more accurate","body":"Academic writing often uses may, might, appears and suggests when evidence supports a possibility but not certainty. This is not weakness; it makes the strength of a claim clearer.","example":"The findings suggest a possible link, rather than prove a cause.","zh":"当证据支持某种可能性但不足以证明确定结论时，学术写作常使用 may、might、appears 和 suggests。这不是表达软弱，而是更准确地说明论断的确定程度。","zhExample":"The findings suggest a possible link, rather than prove a cause。","source":"University of Manchester · Academic phrasebank","sourceUrl":"https://www.phrasebank.manchester.ac.uk/using-cautious-language/"},
    {"id":"discovery-reporting-verbs-02","category":"Vocabulary insight","title":"Reporting verbs show how information is presented","body":"Say, explain, claim, suggest and mention are not interchangeable in every context. A reporting verb can show whether information is simply stated, clarified, argued or briefly referred to.","example":"The author argues that the policy needs revision.","zh":"say、explain、claim、suggest 和 mention 并非在所有语境中都能互换。引述动词可以表达信息是被陈述、解释、主张还是简略提及。","zhExample":"The author argues that the policy needs revision。","source":"Cambridge Dictionary · Reporting verbs","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/reporting-verbs"},
    {"id":"discovery-precise-vocabulary-02","category":"Writing insight","title":"Specific nouns can make writing clearer","body":"A broad word such as thing or issue may hide the exact meaning. When possible, name the object, problem or action directly so readers do not have to guess.","example":"Instead of “We discussed the issue,” write “We discussed the delivery delay.”","zh":"thing 或 issue 等宽泛词语可能掩盖具体意思。条件允许时，直接说明对象、问题或动作，让读者不必猜测。","zhExample":"Instead of “We discussed the issue,” write “We discussed the delivery delay.”"},
    {"id":"discovery-word-choice-02","category":"Common mistake","title":"A word can be grammatical but still sound unnatural","body":"Grammar alone does not guarantee a natural phrase. Collocations are conventional combinations, so learn expressions such as make a decision and heavy rain as complete units.","example":"make a mistake / take a break / heavy traffic","zh":"语法正确并不一定代表搭配自然。词语搭配是约定俗成的组合，建议把 make a mistake、take a break 和 heavy traffic 等表达作为整体学习。","zhExample":"make a mistake / take a break / heavy traffic","source":"Cambridge Dictionary · Collocation","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/collocation"},
    {"id":"discovery-un-countable-02","category":"Common mistake","title":"Some nouns stay uncountable in everyday English","body":"Words such as advice, information, furniture and luggage are normally uncountable. Use a piece of or another suitable unit when counting individual items.","example":"two pieces of advice / three items of furniture","zh":"advice、information、furniture 和 luggage 等词在日常英语中通常不可数。需要计数时，使用 a piece of 或其他合适的量词。","zhExample":"two pieces of advice / three items of furniture","source":"Cambridge Dictionary · Countable and uncountable nouns","sourceUrl":"https://dictionary.cambridge.org/grammar/british-grammar/nouns-countable-and-uncountable"},
    {"id":"discovery-idiom-register-02","category":"Expression insight","title":"Register matters when choosing an expression","body":"A phrase that works with friends may sound too casual in a formal email. Learn both the meaning and the level of formality of a new expression.","example":"“Kids” is informal; “children” is more neutral.","zh":"适合朋友之间的表达，在正式邮件中可能显得过于随意。学习新表达时，应同时了解其意思和正式程度。","zhExample":"“Kids” 较非正式；“children” 更中性。"}
  ];

  let preferences = Object.fromEntries(preferenceKeys.map(key => [key, true]));
  let snapshot = { timezone:"UTC", day:"", plan:"free", limits:{}, completed:{}, openSessions:[], dailyResults:[], content:{} };
  let readerState = null;
  let loadSequence = 0;
  let preferenceListenersReady = false;

  const byId = id => document.getElementById(id);
  const esc = value => escapeHTML(String(value ?? ""));
  const dayOrdinal = day => Math.floor(Date.parse(day + "T00:00:00Z") / 86400000);
  const addDays = day => new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().slice(0,10);
  function effectiveAllowanceTimezone(prefs, now = Date.now()) {
    const until = Date.parse(prefs?.allowance_timezone_until || "");
    if (prefs?.allowance_timezone && Number.isFinite(until) && until > now) {
      return prefs.allowance_timezone;
    }
    return prefs?.timezone || "UTC";
  }

  const dailyChineseTitles = {
    "topic-present-perfect-01":"一般过去时还是现在完成时？","topic-articles-01":"根据发音选择 a 或 an","topic-quantity-01":"可数名词与不可数名词","topic-sentence-order-01":"构建清晰的英语句子","topic-collocations-01":"学习自然的词语搭配",
    "topic-present-routines-01":"描述日常习惯与事实","topic-present-continuous-01":"描述正在发生的事情","topic-past-continuous-01":"用过去进行时交代背景","topic-prepositions-time-01":"用 in、on 和 at 表示时间","topic-pronouns-01":"选择主格和宾格代词",
    "topic-articles-the-01":"了解 the 的使用时机","topic-quantity-many-much-01":"选择 many 或 much","topic-everyday-vocabulary-01":"选择准确的日常动词","topic-everyday-vocabulary-02":"表达动作发生的频率","topic-phrasal-verbs-01":"理解可分离短语动词",
    "topic-phrasal-verbs-02":"在语境中学习短语动词","topic-word-formation-01":"用后缀构建词族","topic-word-formation-02":"识别常见否定前缀","topic-conditionals-01":"用第一类条件句表达真实可能性","topic-conditionals-02":"用第二类条件句表达假设情境",
    "topic-advanced-inversion-01":"在否定副词后使用倒装","topic-advanced-modals-01":"用情态动词表达不同程度的确定性","topic-idioms-01":"把习语作为完整表达来理解","topic-idioms-02":"选择符合语境的表达","topic-academic-01":"更谨慎地表达观点",
    "topic-academic-02":"用准确的连接词衔接观点","topic-precise-vocabulary-01":"区分 say、tell 和 mention","topic-precise-vocabulary-02":"用具体词语替换模糊表达",
    "application-verb-patterns-01":"日常计划中的动词结构","application-articles-01":"真实句子中的冠词","application-quantity-01":"选择正确的数量词","application-say-tell-01":"Say 还是 tell？","application-collocations-01":"选择自然的词语搭配",
    "application-present-routine-02":"日常习惯中的一般现在时","application-present-continuous-02":"描述当前正在发生的动作","application-past-continuous-02":"描述过去正在进行的动作","application-prepositions-time-01":"时间介词","application-pronouns-01":"主格代词还是宾格代词？",
    "application-articles-the-02":"冠词与共同语境","application-many-much-02":"Many、much 和 a lot of","application-everyday-vocabulary-02":"日常动词搭配","application-frequency-01":"频率副词的位置","application-phrasal-separable-02":"在短语动词中放置宾语",
    "application-phrasal-meaning-02":"理解语境中的短语动词","application-word-family-02":"识别后缀的含义","application-prefix-02":"选择否定前缀","application-first-conditional-02":"表达真实的未来可能性","application-second-conditional-02":"想象不同的情境",
    "application-modals-02":"用情态动词表达确定性","application-inversion-02":"识别主语与助动词倒装","application-idioms-02":"理解常见表达","application-academic-02":"使用谨慎的学术表达","application-precise-02":"选择准确的表达动词"
  };
  const dailyUi = (english, chinese) => translationLanguage === "zh" ? chinese : english;
  function dailyTitle(item) {
    return translationLanguage === "zh" ? (item.titleZh || dailyChineseTitles[item.id] || item.title) : item.title;
  }
  function selectedTranslation(item) {
    if (typeof translationLanguage !== "undefined" && translationLanguage === "zh" && item.zh) {
      return '<p class="daily-translation"><strong>中文说明：</strong>' + esc(item.zh) + '</p>';
    }
    return "";
  }
  function renderDailyStaticLabels() {
    const zh = translationLanguage === "zh";
    const labels = {
      dailyLearningEyebrow: zh ? "每日练习" : "DAILY PRACTICE",
      dailyLearningHeading: zh ? "每日学习" : "Daily Learning",
      dailyLearningIntro: zh ? "通过个性化活动和全球共享的每日词汇，建立持续学习的习惯。" : "Build consistency with personalised activities and a shared daily dictionary word for everyone.",
      dailyPreferencesLegend: zh ? "我的每日活动" : "My daily activities"
    };
    Object.entries(labels).forEach(([id,value]) => { const node=byId(id); if(node) node.textContent=value; });
    const names = {
      daily_topic: zh ? "每日主题" : "Daily Topic",
      daily_application: zh ? "每日应用" : "Daily Application",
      daily_discovery: zh ? "每日发现" : "Daily Discovery",
      daily_revision: zh ? "每日复习" : "Daily Revision"
    };
    document.querySelectorAll("[data-daily-pref-label]").forEach(node => {
      if(names[node.dataset.dailyPrefLabel]) node.textContent=names[node.dataset.dailyPrefLabel];
    });
  }

  function renderDailyStatus() {
    if (!snapshot.day) return;
    const status = byId("dailyLearningStatus");
    if (!status) return;
    const timezone = snapshot.timezone || "UTC";
    const plan = snapshot.plan === "premium" ? "Premium" : "Free";
    status.textContent = dailyUi(
      "Your daily activities reset at midnight (" + timezone + "). Plan: " + plan + ". English learning context is preserved; Chinese explanations are shown where available.",
      "每日活动于午夜重置（" + timezone + "）。方案：" + plan + "。英语学习语境会保留，并在适用位置提供中文说明。"
    );
    if (snapshot.timezoneChangePending) status.textContent += dailyUi(
      " Your preferred timezone (" + snapshot.preferredTimezone + ") will take effect after this allowance day ends.",
      " 你偏好的时区（" + snapshot.preferredTimezone + "）将在当前额度日结束后生效。"
    );
    if (snapshot.courseNeedsEnglish) status.textContent += dailyUi(
      " Select English as your Learning course to start these activities. Your saved Chinese course preference is not changed by this message.",
      "请将学习课程切换为 English 后开始这些活动。此提示不会更改你已保存的中文课程偏好。"
    );
  }

  function makeRevisionContent(topicId, contentId, reason) {
    const source = dailyApplications.find(item =>
      item.topicId === topicId && contentId.includes(":" + item.id + ":"))
      || dailyApplications.find(item => item.topicId === topicId)
      || dailyApplications[0];
    return {
      id: contentId,
      topicId: topicId || source.topicId,
      difficulty: source.difficulty,
      title: "Review: " + source.title,
      titleZh: "复习：" + (dailyChineseTitles[source.id] || source.title),
      body: reason || "A short adaptive review selected from your learning history.",
      zh: "根据你的学习记录安排的简短复习。",
      questions: source.questions
    };
  }

  function revisionCandidates(lessonResults, dailyResults, completedToday) {
    const combined = [...(lessonResults || []), ...(dailyResults || [])];
    const recordsByTopic = new Map();
    for (const row of combined) {
      const topicId = typeof row.topic_id === "string" ? row.topic_id.trim() : "";
      const questions = Number(row.question_count);
      const correct = Number(row.correct_count);
      const timestamp = Date.parse(row.attempted_at || row.completed_at || "");
      if (!topicId || !Number.isInteger(questions) || questions <= 0
          || !Number.isInteger(correct) || correct < 0 || correct > questions
          || !Number.isFinite(timestamp)) continue;
      const records = recordsByTopic.get(topicId) || [];
      records.push({ correct, questions, at:timestamp });
      recordsByTopic.set(topicId,records);
    }

    const evidenceByTopic = new Map();
    for (const [topicId,records] of recordsByTopic) {
      records.sort((a,b) => b.at - a.at);
      const recent = records.slice(0,3);
      const correct = recent.reduce((sum,row) => sum + row.correct,0);
      const questions = recent.reduce((sum,row) => sum + row.questions,0);
      const latest = recent[0];
      const previous = recent.slice(1);
      const previousQuestions = previous.reduce((sum,row) => sum + row.questions,0);
      const previousAccuracy = previousQuestions
        ? previous.reduce((sum,row) => sum + row.correct,0) / previousQuestions
        : null;
      const latestAccuracy = latest.correct / latest.questions;
      evidenceByTopic.set(topicId,{
        topicId,correct,questions,attempts:recent.length,lastAt:latest.at,
        latestAccuracy,previousAccuracy
      });
    }

    const usedToday = new Set((completedToday || [])
      .filter(row => row.activity_type === "daily_revision")
      .map(row => row.topic_id).filter(Boolean));
    const topics = [...new Set([
      ...dailyApplications.map(item => item.topicId),
      "sentence-basics","verb-tenses","nouns-and-articles","everyday-vocabulary",
      "nouns-and-quantity","phrasal-verbs","collocations","word-formation",
      "conditional-sentences","advanced-grammar","idioms-fixed-expressions",
      "academic-professional-english","precise-vocabulary"
    ])];
    const now = Date.now();
    const candidates = topics.filter(topicId => !usedToday.has(topicId)).map(topicId => {
      const evidence = evidenceByTopic.get(topicId);
      if (!evidence) return {
        topicId,priority:2,overdueDays:0,
        reason:"First review — building your learning history",accuracy:null,lastAt:null
      };
      const accuracy = evidence.correct / evidence.questions;
      const enoughEvidence = evidence.attempts >= 2 && evidence.questions >= 6;
      const interval = accuracy < 0.65 ? 1 : accuracy < 0.8 ? 3 : accuracy < 0.9 ? 7 : 14;
      const daysSince = Math.max(0,(now - evidence.lastAt) / 86400000);
      const overdueDays = Math.max(0,daysSince - interval);
      const due = daysSince >= interval;
      const improving = enoughEvidence && evidence.previousAccuracy !== null
        && evidence.latestAccuracy >= 0.8
        && evidence.latestAccuracy - evidence.previousAccuracy >= 0.2;
      // Do not keep labelling a learner weak when their latest attempt shows a clear recovery.
      const weak = enoughEvidence && accuracy < 0.7
        && evidence.latestAccuracy < 0.7 && !improving;
      const priority = weak && due ? 0 : due ? 1 : 3;
      const daysUntilDue = Math.max(1,Math.ceil(interval - daysSince));
      const reason = weak
        ? (due ? "Needs attention — recent accuracy is below 70%" : "Needs attention — another review is due in " + daysUntilDue + " day(s)")
        : improving
          ? "Recent improvement — keep building consistency"
          : !enoughEvidence
            ? "Building evidence — not enough recent practice to label this topic weak"
            : due
              ? "Review due based on your spaced-practice interval"
              : "Keep this topic fresh with a short review";
      return {
        topicId,priority,overdueDays,reason,accuracy,lastAt:new Date(evidence.lastAt).toISOString(),
        improving,weak,due
      };
    });

    candidates.sort((a,b) => a.priority-b.priority
      || b.overdueDays-a.overdueDays
      || (a.accuracy ?? 2) - (b.accuracy ?? 2)
      || (a.lastAt ? Date.parse(a.lastAt) : 0) - (b.lastAt ? Date.parse(b.lastAt) : 0));
    return candidates;
  }

  function accountContentOffset() {
    const accountKey = String(currentUser?.id || "anonymous");
    const accountHash = [...accountKey].reduce((hash,char)=>((hash*31)+char.charCodeAt(0))>>>0,7);
    const mockGeneration = Number(window.__swiftDictionaryMock?.selectionGeneration?.() || 0);
    return (accountHash + mockGeneration) >>> 0;
  }

  function dailyDiscoverySchedule(globalDay) {
    const poolSize = DAILY_DISCOVERY_SCHEDULE_POOL_SIZE;
    if (dailyDiscoveryVocabulary.length < poolSize || poolSize < 90 || poolSize % 3 !== 0) {
      throw new Error("Daily Discovery requires an approved vocabulary pool of at least 90 entries in groups of three.");
    }
    const dayOffset = dayOrdinal(globalDay) - dayOrdinal(DAILY_DISCOVERY_SCHEDULE_EPOCH);
    const firstIndex = ((dayOffset * 3) % poolSize + poolSize) % poolSize;
    return [0,1,2].map(slot => {
      const word = dailyDiscoveryVocabulary[(firstIndex + slot) % poolSize];
      return {
        ...word,
        id:word.id + ":" + globalDay,
        title:word.word,
        example:word.examples[0],
        examples:word.examples.slice(1),
        zh:word.definitionZh,
        scheduleVersion:DAILY_DISCOVERY_SCHEDULE_VERSION,
        scheduleSlot:slot + 1
      };
    });
  }

  function chooseContent(activityType, slot) {
    const day = snapshot.day;
    const baseIndex = dayOrdinal(day);
    if (activityType === "daily_discovery") {
      // Global UTC schedule: never use account ID, local timezone, completion count or mock offset.
      const globalDay = new Date().toISOString().slice(0,10);
      return dailyDiscoverySchedule(globalDay);
    }
    const accountOffset = accountContentOffset();
    const pools = {daily_topic:dailyTopics,daily_application:dailyApplications};
    if (pools[activityType]) {
      const pool = pools[activityType];
      const completedIds = new Set((snapshot.dailyResults || [])
        .filter(row => row.activity_type === activityType)
        .map(row => row.content_id));
      const available = pool.filter(item => !completedIds.has(item.id));
      // Never surface yesterday's completed Premium slot as today's first item.
      // If the curated pool is exhausted, fall back to a free replay.
      return available.length
        ? available[(baseIndex + slot + accountOffset) % available.length]
        : pool[(baseIndex + slot + accountOffset) % pool.length];
    }
    const candidates = revisionCandidates(snapshot.lessonResults, snapshot.dailyResults, snapshot.completedToday);
    const best = candidates[0];
    const equallyRanked = best && best.accuracy === null
      ? candidates.filter(item=>item.priority===best.priority && item.accuracy===null)
      : best && candidates.filter(item=>item.priority===best.priority && item.accuracy===best.accuracy);
    const candidate = (equallyRanked?.length
      ? equallyRanked[accountOffset % equallyRanked.length]
      : best) || { topicId:dailyApplications[0].topicId, reason:"A short review to keep your knowledge active." };
    const topicPool = dailyApplications.filter(item => item.topicId === candidate.topicId);
    const previouslyUsedSources = new Set((snapshot.dailyResults || [])
      .filter(row => row.activity_type === "daily_revision" && row.topic_id === candidate.topicId)
      .map(row => {
        const match = String(row.content_id || "").match(/^revision:[^:]+:([^:]+):/);
        return match ? match[1] : null;
      }).filter(Boolean));
    const unusedSources = topicPool.filter(item => !previouslyUsedSources.has(item.id));
    const sourcePool = unusedSources.length ? unusedSources : topicPool;
    const source = sourcePool[(dayOrdinal(day) + slot + accountOffset) % sourcePool.length] || dailyApplications[0];
    const id = ["revision",candidate.topicId,source.id,day,String(slot+1)].join(":");
    return makeRevisionContent(candidate.topicId,id,candidate.reason);
  }
  function resolveSessionContent(activityType, session, fallback) {
    if (activityType === "daily_revision") {
      const candidate = revisionCandidates(snapshot.lessonResults, snapshot.dailyResults, snapshot.completedToday)
        .find(item => item.topicId === session.topic_id);
      return makeRevisionContent(session.topic_id,session.content_id,candidate?.reason || "Resume your adaptive review.");
    }
    if (activityType === "daily_discovery") {
      const approvedId=String(session.content_id).split(":")[0];
      const word=dailyDiscoveryVocabulary.find(item=>item.id===approvedId);
      return word?{...word,id:session.content_id,title:word.word,example:word.examples[0],examples:word.examples.slice(1),zh:word.definitionZh}:fallback;
    }
    const pools={daily_topic:dailyTopics,daily_application:dailyApplications};
    return (pools[activityType] || []).find(item => item.id === session.content_id) || fallback;
  }

  async function loadDailyData() {
    const sequence = ++loadSequence;
    const status = byId("dailyLearningStatus");
    const grid = byId("dailyActivityGrid");
    if (!supabaseClient || !currentUser) {
      preferences = Object.fromEntries(preferenceKeys.map(key => [key, true]));
      snapshot = { timezone:"UTC", day:localDayStart("UTC"), learningLanguage:"en", plan:"free", limits:{}, completed:{}, openSessions:[], dailyResults:[], content:{} };
      applyPreferenceInputs(false);
      status.textContent = "Sign in to start activities and sync your preferences and progress across devices.";
      renderCards();
      return;
    }

    status.textContent = "Loading your daily learning plan…";
    const userId = currentUser.id;
    const [prefResult, entitlementResult] = await Promise.all([
      supabaseClient.from("user_preferences")
        .select("timezone,allowance_timezone,allowance_timezone_until,learning_language,translation_language,daily_topic_enabled,daily_application_enabled,daily_discovery_enabled,daily_revision_enabled")
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
    const timezone = effectiveAllowanceTimezone(prefs);
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

    const [limitResult, usageResult, lessonResult, dailyResult, openSessionResult] = await Promise.all([
      supabaseClient.from("learning_plan_limits")
        .select("activity_type,daily_limit,is_enabled")
        .eq("plan_code",plan)
        .in("activity_type",["daily_topic","daily_application","daily_discovery","daily_revision"]),
      supabaseClient.rpc("get_my_learning_allowance_usage"),
      supabaseClient.from("lesson_practice_results")
        .select("topic_id,correct_count,question_count,attempted_at")
        .eq("user_id",userId).order("attempted_at",{ascending:false}).limit(200),
      supabaseClient.from("daily_activity_sessions")
        .select("activity_type,content_id,topic_id,difficulty,source,correct_count,question_count,completed_at,status,started_at")
        .eq("user_id",userId).eq("status","completed")
        .order("completed_at",{ascending:false}).limit(200),
      supabaseClient.from("daily_activity_sessions")
        .select("activity_type,content_id,topic_id,difficulty,source,status,started_at")
        .eq("user_id",userId).eq("status","in_progress")
        .order("started_at",{ascending:false}).limit(10)
    ]);
    if (sequence !== loadSequence) return;
    for (const result of [limitResult,usageResult,lessonResult,dailyResult,openSessionResult]) if (result.error) throw result.error;

    const limits = {};
    for (const row of limitResult.data || []) limits[row.activity_type] = { limit:row.daily_limit, enabled:row.is_enabled };
    const completed = {};
    for (const row of usageResult.data || []) {
      const used = Number(row.used_count);
      if (typeof row.activity_type === "string" && Number.isInteger(used) && used >= 0) completed[row.activity_type] = used;
    }
    const completedToday = (dailyResult.data || []).filter(row => row.completed_at && row.completed_at >= start && row.completed_at < finish);
    const activeSessions = [];
    for (const session of openSessionResult.data || []) {
      const startedAt = Date.parse(session.started_at || "");
      if (!Number.isFinite(startedAt) || startedAt < Date.parse(start) || startedAt >= Date.parse(finish)) {
        if (!session.id) throw new Error("An expired daily activity session could not be identified for reset.");
        const {error} = await supabaseClient.rpc("abandon_daily_activity_session",{p_session_id:session.id});
        if (error) throw error;
      } else {
        activeSessions.push(session);
      }
    }
    const language = prefs.learning_language || "en";
    const timezoneChangePending = !!(prefs.allowance_timezone && Date.parse(prefs.allowance_timezone_until || "") > Date.now());
    snapshot = {
      timezone, day, learningLanguage:language, plan, limits, completed, completedToday,
      lessonResults:lessonResult.data || [],
      dailyResults:dailyResult.data || [],
      openSessions:activeSessions,
      timezoneChangePending,
      preferredTimezone:prefs.timezone || "UTC",
      courseNeedsEnglish:language !== "en" || course !== "en",
      content:{}
    };

    const slots = {};
    for (const type of Object.keys(activityMeta)) slots[type] = completed[type] || 0;
    for (const type of Object.keys(activityMeta)) snapshot.content[type] = chooseContent(type,slots[type]);
    renderDailyStatus();
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
    renderDailyStaticLabels();
    const grid = byId("dailyActivityGrid");
    const enabledTypes = Object.keys(activityMeta).filter(type => preferences[type + "_enabled"] !== false);
    if (!enabledTypes.length) {
      grid.innerHTML = '<div class="coming-card"><h2>All daily activities are paused</h2><p>Enable at least one activity above whenever you are ready to continue.</p></div>';
      return;
    }

    const renderCard = (type,content,discoveryIndex=null) => {
      const meta = activityMeta[type];
      const limitConfig = snapshot.limits[type];
      const limit = limitConfig?.limit;
      const used = snapshot.completed[type] || 0;
      const remaining = Number.isFinite(limit) ? Math.max(0,limit-used) : null;
      const activeSession = (snapshot.openSessions || []).find(row =>
        row.activity_type === type && (type !== "daily_discovery" || row.content_id === content.id));
      const alreadyCompleted = (snapshot.dailyResults || []).some(row =>
        row.activity_type === type && row.content_id === content.id && row.status === "completed");
      const allowanceUnavailable = !activeSession && !alreadyCompleted
        && (!limitConfig || limitConfig.enabled === false || remaining === null);
      const exhausted = !activeSession && !alreadyCompleted && !allowanceUnavailable && remaining <= 0;
      const remainingLabel = activeSession
        ? dailyUi("In progress · allowance is used only on completion","进行中 · 完成后才会扣除次数")
        : alreadyCompleted
          ? dailyUi("Completed · replay is free","已完成 · 可免费重温")
          : allowanceUnavailable
            ? (limitConfig?.enabled === false ? dailyUi("Unavailable for this plan","当前方案暂不提供") : dailyUi("Allowance unavailable","无法读取可用次数"))
            : dailyUi(remaining + " / " + limit + " completions remaining","剩余 " + remaining + " / " + limit + " 次完成额度");
      const buttonLabel = activeSession ? dailyUi("Resume activity","继续活动")
        : alreadyCompleted ? dailyUi("Review completed content","重温已完成内容")
        : allowanceUnavailable ? dailyUi("Unavailable","暂不可用")
        : exhausted ? dailyUi("Daily limit reached","今日额度已用完") : dailyUi("Start activity","开始活动");
      const reason = type === "daily_revision" ? '<p class="daily-activity-meta"><span class="daily-activity-tag">' + esc(translationLanguage === "zh" ? "根据你的学习记录选择" : content.body) + '</span></p>' : "";
      const preview = exhausted
        ? '<div class="daily-reader-example daily-cooldown-message"><strong>' + esc(dailyUi("Today’s activity is complete","今日活动已完成")) + '</strong><p>' + esc(dailyUi("Your next activity will be available after the daily allowance resets at midnight (" + (snapshot.timezone || "your timezone") + ").","下一次活动将在每日额度于午夜重置后开放（" + (snapshot.timezone || "你的时区") + "）。")) + '</p></div>'
        : '<div class="daily-reader-example"><strong>' + esc(type === "daily_discovery" ? content.word : dailyTitle(content)) + '</strong>' +
          (type === "daily_discovery" ? '<p class="muted-note">' + esc(content.phonetic || "") + ' · ' + esc(content.part || "") + '</p>' : '') + '</div>';
      let disabledReason = "";
      if (!currentUser || !supabaseClient) disabledReason = dailyUi("Sign in to start and sync this activity.","登录后即可开始活动并同步进度。");
      else if (snapshot.learningLanguage !== "en" || (typeof course !== "undefined" && course !== "en")) disabledReason = dailyUi("Daily activities currently teach English. Select English in Learning course to begin.","每日活动目前以英语为学习内容。请将学习课程切换为 English 后开始。");
      else if (allowanceUnavailable) disabledReason = limitConfig?.enabled === false
        ? dailyUi("This activity is not available for your current plan.","当前方案暂不提供此活动。")
        : dailyUi("Your allowance could not be checked. Please refresh before starting this activity.","无法确认活动额度，请刷新页面后再试。");
      const disabled = !!disabledReason;
      const indexAttribute = discoveryIndex === null ? "" : ' data-discovery-index="' + discoveryIndex + '"';
      const discoveryHeading = discoveryIndex === null ? "" : '<span class="daily-activity-tag">' + esc(dailyUi("Discovery " + (discoveryIndex+1) + " of 3","每日发现 " + (discoveryIndex+1) + " / 3")) + '</span>';
      return '<article class="daily-activity-card" data-activity-card="' + type + '"' + (discoveryIndex === null ? "" : ' data-discovery-card="' + (discoveryIndex+1) + '"') + '>'
        + '<div class="daily-activity-meta"><span class="daily-activity-tag">' + esc(meta.label) + '</span>' + discoveryHeading + '<span class="daily-activity-tag">' + esc(remainingLabel) + '</span></div>'
        + '<h2>' + esc(type === "daily_discovery" ? content.word : meta.title) + '</h2><p>' + esc(type === "daily_discovery" ? meta.description : meta.description) + '</p>'
        + preview + reason
        + (disabledReason ? '<p class="daily-activity-status">' + esc(disabledReason) + '</p>' : "")
        + '<button type="button" class="primary-button" data-label="' + esc(buttonLabel) + '" data-start-daily="' + type + '"' + indexAttribute + (disabled ? " disabled" : "") + '>' + esc(buttonLabel) + '</button>'
        + '</article>';
    };

    grid.innerHTML = enabledTypes.flatMap(type => {
      if (type === "daily_discovery") {
        const scheduled = Array.isArray(snapshot.content.daily_discovery)
          ? snapshot.content.daily_discovery : [];
        const visibleCount = Math.min(3,Math.max(1,Number(snapshot.limits.daily_discovery?.limit) || 1));
        return scheduled.slice(0,visibleCount).map((content,index) => renderCard(type,content,index));
      }
      const content = snapshot.content[type] || chooseContent(type,snapshot.completed?.[type] || 0);
      return [renderCard(type,content)];
    }).join("");

    grid.querySelectorAll("[data-start-daily]").forEach(button => {
      button.addEventListener("click",() => startDailyActivity(
        button.dataset.startDaily,
        button.dataset.discoveryIndex === undefined ? 0 : Number(button.dataset.discoveryIndex)
      ));
    });
  }
  async function startDailyActivity(activityType, discoveryIndex=0) {
    if (!currentUser || !supabaseClient) return;
    const discoverySlots = snapshot.content.daily_discovery;
    const selected = activityType === "daily_discovery"
      ? (Array.isArray(discoverySlots) ? discoverySlots[discoveryIndex] : null)
      : snapshot.content[activityType] || chooseContent(activityType,snapshot.completed?.[activityType] || 0);
    if (!selected) return;
    const button = activityType === "daily_discovery"
      ? document.querySelector('[data-start-daily="daily_discovery"][data-discovery-index="' + discoveryIndex + '"]')
      : document.querySelector('[data-start-daily="' + activityType + '"]');
    if (button) { button.disabled = true; button.textContent = dailyUi("Opening…","正在打开…"); }
    try {
      const {data,error} = await supabaseClient.rpc("start_daily_activity_session",{
        p_activity_type:activityType,
        p_content_id:selected.id,
        p_topic_id:activityType === "daily_discovery" ? null : selected.topicId || null,
        p_difficulty:activityType === "daily_discovery" ? null : selected.difficulty || null,
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
      if (button) { button.disabled = false; button.textContent = button.dataset.label || "Start / Resume"; }
    }
  }

  function renderReader(activityType,content,session,existingState=null) {
    const reader = byId("dailyActivityReader");
    const isDiscovery = activityType === "daily_discovery";
    reader.classList.add("modal-backdrop","daily-activity-backdrop");
    reader.setAttribute("role","dialog");
    reader.setAttribute("aria-modal","true");
    reader.setAttribute("aria-label",dailyUi(activityMeta[activityType].title,activityMeta[activityType].titleZh));
    const completed = session.status === "completed";
    const isQuiz = activityType === "daily_application" || activityType === "daily_revision";
    reader.hidden = false;
    reader.classList.add("open");
    document.body.style.overflow = "hidden";
    readerState = existingState || { activityType,content,session,firstTry:(content.questions || []).map(() => null),passed:(content.questions || []).map(() => false) };
    const closeButton = '<button type="button" class="icon-button" data-daily-close aria-label="' + esc(dailyUi("Close activity","关闭活动")) + '">×</button>';
    let html = "";
    if (isDiscovery) {
      const examples = [content.example,...(content.examples || [])].filter(Boolean);
      html = '<div class="modal-head"><div><h2 class="modal-word">' + esc(content.word || content.title) + '</h2><div class="modal-pronunciation">' + esc(content.phonetic || "") + '</div><span class="part">' + esc(dailyUi(content.part || "Vocabulary",content.part === "adjective" ? "形容词" : content.part === "noun" ? "名词" : content.part === "verb" ? "动词" : "词汇")) + '</span></div>' + closeButton + '</div>'
        + '<div class="modal-content">'
        + '<section class="detail-section"><h3>' + esc(dailyUi("Definition","释义")) + '</h3><p class="definition">' + esc(translationLanguage === "zh" && content.definitionZh ? content.definitionZh : content.definition || "") + '</p></section>'
        + '<section class="detail-section"><h3>' + esc(dailyUi("Examples","例句")) + '</h3><ul class="example-list">' + examples.map(example=>'<li>' + esc(example) + '</li>').join("") + '</ul></section>'
        + (content.tip ? '<section class="detail-section"><h3>' + esc(dailyUi("Usage note","用法提示")) + '</h3><p class="tip">' + esc(content.tip) + '</p></section>' : "")
        + '<p class="daily-discovery-frequency-note">' + esc(dailyUi("A less-common word to recognise and understand. Frequency classification is curated, not a live conversational-corpus ranking.","认识并理解一个较少见的词汇。目前词频分类由编辑整理，并非实时口语语料库排名。")) + '</p>'
        + '<p class="muted-note">' + esc(completed ? dailyUi("Completed · replay is free","已完成 · 可免费重温") : dailyUi("In progress · no allowance used until completion","进行中 · 完成后才会扣除次数")) + '</p>';
    } else {
      html = '<div class="daily-drawer-actions"><button type="button" class="secondary-button" data-daily-back>' + esc(dailyUi("← Back to Lessons","← 返回课程")) + '</button>' + closeButton + '</div>'
        + '<div class="daily-activity-meta"><span class="daily-activity-tag">' + esc(dailyUi(activityMeta[activityType].title,activityMeta[activityType].titleZh)) + '</span>'
        + (completed ? '<span class="daily-activity-tag">' + esc(dailyUi("Completed · replay is free","已完成 · 可免费重温")) + '</span>' : '<span class="daily-activity-tag">' + esc(dailyUi("In progress · no allowance used yet","进行中 · 尚未扣除次数")) + '</span>')
        + '</div><h2>' + esc(dailyTitle(content)) + '</h2>';
      if (content.body) html += '<p>' + esc(content.body) + '</p>';
      html += selectedTranslation(content);
      const practiceExamples = isQuiz && Array.isArray(content.questions)
        ? content.questions.map(question => String(question.q || "").replace(/_{2,}/g,question.options?.[question.answer] || "…"))
        : [];
      const examples = [
        ...(content.example ? String(content.example).split(/\s+\/\s+/) : []),
        ...(Array.isArray(content.examples) ? content.examples : []),
        ...practiceExamples
      ].filter(Boolean);
      if (examples.length) html += '<section class="daily-reader-example daily-examples-box"><strong>' + esc(dailyUi("Examples","例句")) + '</strong><ul>' + examples.map(example=>'<li>' + esc(example) + '</li>').join("") + '</ul></section>';
      if (content.tip) html += '<div class="daily-reader-example"><strong>' + esc(dailyUi("Usage note","用法提示")) + '</strong><p>' + esc(content.tip) + '</p></div>';
      if (isQuiz) {
        html += '<p class="daily-practice-instruction">' + esc(dailyUi("Read each English sentence and choose the correct answer. The English wording is kept as the learning context.","请阅读每个英语句子并选择正确答案。英语题目和选项会保留，以便学习英语语境。")) + '</p><div id="dailyQuestions">';
        content.questions.forEach((question,index) => {
          html += '<div class="daily-question" data-daily-question="' + index + '"><strong>' + (index+1) + '. ' + esc(question.q) + '</strong>';
          question.options.forEach((option,optionIndex) => {
            html += '<label><input type="radio" name="daily-question-' + index + '" value="' + optionIndex + '"' + (completed ? " disabled" : "") + '> <span>' + esc(option) + '</span></label>';
          });
          html += '<p class="daily-question-feedback" id="daily-feedback-' + index + '" role="status"></p></div>';
        });
        html += '</div>';
        if (!completed) html += '<button type="button" class="secondary-button" data-check-daily>' + esc(dailyUi("Check answers","检查答案")) + '</button>';
        html += '<p id="dailyPracticeStatus" role="status" aria-live="polite" class="page-intro"></p>';
      }
    }
    if (!completed && !isQuiz) html += '<button type="button" class="primary-button" data-complete-daily>' + esc(dailyUi("Mark activity complete","标记活动为已完成")) + '</button>';
    if (!completed) html += '<button type="button" class="secondary-button" data-abandon-daily>' + esc(dailyUi("Abandon session","放弃本次活动")) + '</button>';
    if (!completed && isQuiz) html += '<button type="button" class="primary-button" data-complete-daily hidden>' + esc(dailyUi("Complete activity","完成活动")) + '</button>';
    if (completed) html += '<p class="page-intro">' + esc(dailyUi("This content is already completed. You can revisit it without using another daily allowance.","此内容已完成。你可以免费重温，不会再次消耗每日额度。")) + '</p>';
    if (isDiscovery) html += '</div>';
    reader.innerHTML = '<article class="modal daily-activity-modal' + (isDiscovery ? ' daily-discovery-modal' : '') + '">' + html + '</article>';
    const backButton = reader.querySelector("[data-daily-back]");
    if (backButton) backButton.addEventListener("click",closeDailyReader);
    reader.querySelector("[data-daily-close]").addEventListener("click",closeDailyReader);
    reader.onclick = event => { if(event.target===reader) closeDailyReader(); };
    const checkButton = reader.querySelector("[data-check-daily]");
    if (checkButton) checkButton.addEventListener("click",checkDailyAnswers);
    reader.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener("change",() => {
      const index = Number(input.name.split("-").pop());
      if (readerState && Number.isInteger(index)) readerState.passed[index] = false;
      const complete = reader.querySelector("[data-complete-daily]");
      if (complete) complete.hidden = true;
      const practiceStatus = byId("dailyPracticeStatus");
      if (practiceStatus) practiceStatus.textContent = dailyUi("Your answer changed. Check your answers again before completing.","答案已更改。请重新检查答案后再完成活动。");
    }));
    const completeButton = reader.querySelector("[data-complete-daily]");
    if (completeButton) completeButton.addEventListener("click",completeDailyActivity);
    const abandonButton = reader.querySelector("[data-abandon-daily]");
    if (abandonButton) abandonButton.addEventListener("click",abandonDailyActivity);
    if (existingState) {
      existingState.passed.forEach((passed,index)=>{
        const previous=document.querySelector('input[name="daily-question-'+index+'"]:checked');
        if(previous) previous.checked=true;
        if(existingState.firstTry[index]!==null){
          const feedback=byId("daily-feedback-"+index);
          if(feedback) {
            const question=existingState.content.questions[index];
            const explanation=question.explanation || "";
            const zhExplanation=translationLanguage === "zh" && question.zh ? " 中文说明：" + question.zh : "";
            feedback.textContent=dailyUi(passed?"Correct. ":"Not quite. Try again. ",passed?"正确。":"还不正确，请再试一次。")+explanation+zhExplanation;
          }
        }
      });
      const complete=reader.querySelector("[data-complete-daily]");
      if(complete && isQuiz) complete.hidden=!existingState.passed.every(Boolean);
    }
  }

  window.refreshDailyLearningTranslation = function() {
    renderDailyStaticLabels();
    renderDailyStatus();
    if (typeof renderCards === "function" && snapshot.content && Object.keys(snapshot.content).length) renderCards();
    if (readerState) {
      const state=readerState;
      const selected=state.content.questions ? state.content.questions.map((_,index)=>document.querySelector('input[name="daily-question-'+index+'"]:checked')?.value ?? null) : [];
      renderReader(state.activityType,state.content,state.session,state);
      selected.forEach((value,index)=>{
        if(value!==null){
          const input=document.querySelector('input[name="daily-question-'+index+'"][value="'+value+'"]');
          if(input) input.checked=true;
        }
      });
    }
  };


  function closeDailyReader() {
    const reader=byId("dailyActivityReader");
    reader.classList.remove("open");
    reader.hidden=true;
    reader.innerHTML="";
    readerState=null;
    document.body.style.overflow="";
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
        feedback.textContent = dailyUi("Choose an answer before checking.","检查答案前，请先选择一个选项。");
        continue;
      }
      const correct = Number(selected.value) === content.questions[i].answer;
      if (firstTry[i] === null) firstTry[i] = correct;
      passed[i] = correct;
      const translatedExplanation = typeof translationLanguage !== "undefined" && translationLanguage === "zh" && content.questions[i].zh ? " 中文说明：" + content.questions[i].zh : "";
      if (correct) feedback.textContent = dailyUi("Correct. ","正确。") + content.questions[i].explanation + translatedExplanation;
      else {
        allCorrect = false;
        feedback.textContent = dailyUi("Not quite. Try again. ","还不正确，请再试一次。") + content.questions[i].explanation + translatedExplanation;
      }
    }
    const completeButton = byId("dailyActivityReader").querySelector("[data-complete-daily]");
    if (completeButton) completeButton.hidden = !allCorrect;
    const status = byId("dailyPracticeStatus");
    if (status) status.textContent = allCorrect ? dailyUi("All answers are correct. You can now complete this activity.","全部答案正确。现在可以完成此活动。") : dailyUi("Review the feedback and try the unanswered or incorrect questions again.","请查看反馈，并重新回答尚未作答或答错的题目。");
  }

  async function abandonDailyActivity() {
    if (!readerState || !currentUser || !supabaseClient) return;
    const sessionId = readerState.session.id;
    const button = byId("dailyActivityReader").querySelector("[data-abandon-daily]");
    if (button) { button.disabled = true; button.textContent = dailyUi("Abandoning…","正在放弃…"); }
    try {
      const {data,error} = await supabaseClient.rpc("abandon_daily_activity_session",{p_session_id:sessionId});
      if (error) throw error;
      const saved = Array.isArray(data) ? data[0] : data;
      if (!saved || saved.status !== "abandoned") throw new Error("The session could not be abandoned.");
      closeDailyReader();
      try {
        await loadDailyData();
        byId("dailyLearningStatus").textContent = "Session abandoned. No daily allowance was used. " + byId("dailyLearningStatus").textContent;
      } catch (refreshError) {
        byId("dailyLearningStatus").textContent = "Session abandoned. No daily allowance was used, but the activity list could not refresh: " + (refreshError.message || "Please reload the page.");
      }
    } catch (error) {
      byId("dailyLearningStatus").textContent = error.message || "The session could not be abandoned.";
      if (button) { button.disabled = false; button.textContent = dailyUi("Abandon session","放弃本次活动"); }
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
    if (button) { button.disabled = true; button.textContent = dailyUi("Saving…","正在保存…"); }
    const args = { p_session_id:session.id, p_correct_count:null, p_question_count:null };
    if (activityType === "daily_application" || activityType === "daily_revision") {
      if (firstTry.some(value => value === null)) {
        if (button) { button.disabled = false; button.textContent = dailyUi("Complete activity","完成活动"); }
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
      closeDailyReader();
    } catch (error) {
      byId("dailyLearningStatus").textContent = error.message || "Completion could not be saved. Your session remains in progress.";
      if (button) { button.disabled = false; button.textContent = dailyUi("Complete activity","完成活动"); }
      return;
    }
    try {
      await loadDailyData();
      byId("dailyLearningStatus").textContent = dailyUi("Activity completed successfully. ","活动已成功完成。") + byId("dailyLearningStatus").textContent;
    } catch (error) {
      byId("dailyLearningStatus").textContent = dailyUi("Activity completed successfully. The remaining allowance display could not be refreshed: ","活动已成功完成，但无法刷新剩余额度显示：") + (error.message || "Please reload the page.");
    }
  }

  async function initialiseDailyLearning() {
    if (!byId("dailyLearningPage")) return;
    try {
      await loadDailyData();
    } catch (error) {
      const message = String(error.message || "");
      const needsServerUpdate = /PGRST202|PGRST204|PGRST205|42703|42P01|does not exist|schema cache/i.test(message);
      byId("dailyLearningStatus").textContent = needsServerUpdate
        ? "Daily Learning is temporarily unavailable because the matching server database update has not been applied yet. No activity allowance has been consumed."
        : "Daily Learning could not load. Please refresh and try again.";
      byId("dailyActivityGrid").innerHTML = needsServerUpdate
        ? '<div class="coming-card"><h3>Daily Learning is waiting for a server update</h3><p>Your daily activities and completion allowances will become available after the matching database update is installed.</p></div>'
        : "";
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
        try {
          const {error} = await supabaseClient.from("user_preferences")
            .update({[key]:input.checked}).eq("user_id",currentUser.id);
          if (error) throw error;
          renderCards();
          byId("dailyLearningStatus").textContent = "Your daily activity preferences have been saved and will sync across devices.";
        } catch (error) {
          input.checked = previous;
          preferences[key] = previous;
          byId("dailyLearningStatus").textContent = "Preference could not be saved: " + (error.message || "Please try again.");
        } finally {
          input.disabled = false;
        }
      });
    });
  }

  window.initialiseDailyLearning = initialiseDailyLearning;
  bindPreferenceControls();
  window.addEventListener("swift-auth-updated",() => {
    if (location.hash === "#lessons") initialiseDailyLearning();
  });
  if (location.hash === "#lessons") initialiseDailyLearning();
})();
