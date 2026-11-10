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

  const dailyDiscoveries = [
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
    const topics = [...new Set([
      ...dailyApplications.map(item => item.topicId),
      "sentence-basics","verb-tenses","nouns-and-articles","everyday-vocabulary",
      "nouns-and-quantity","phrasal-verbs","collocations","word-formation",
      "conditional-sentences","advanced-grammar","idioms-fixed-expressions",
      "academic-professional-english","precise-vocabulary"
    ])];
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
    const pools = {
      daily_topic:dailyTopics,
      daily_application:dailyApplications,
      daily_discovery:dailyDiscoveries
    };
    if (pools[activityType]) {
      const pool = pools[activityType];
      const completedIds = new Set((snapshot.dailyResults || [])
        .filter(row => row.activity_type === activityType)
        .map(row => row.content_id));
      const available = pool.filter(item => !completedIds.has(item.id));
      // Never surface yesterday's completed Premium slot as today's first item.
      // If the curated pool is exhausted, fall back to a free replay.
      return available.length
        ? available[(baseIndex + slot) % available.length]
        : pool[(baseIndex + slot) % pool.length];
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
        .eq("user_id",userId).order("attempted_at",{ascending:false}).limit(200),
      supabaseClient.from("daily_activity_sessions")
        .select("activity_type,content_id,topic_id,correct_count,question_count,completed_at,status")
        .eq("user_id",userId).eq("status","completed")
        .order("completed_at",{ascending:false}).limit(200)
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
      const alreadyCompleted = (snapshot.dailyResults || []).some(row =>
        row.activity_type === type && row.content_id === content.id && row.status === "completed");
      const remainingLabel = alreadyCompleted
        ? "No new content available · replay is free"
        : remaining === null ? "Allowance unavailable" : remaining + " / " + limit + " completions remaining";
      const buttonLabel = alreadyCompleted ? "Review completed content" : "Start / Resume";
      const reason = type === "daily_revision" ? '<p class="daily-activity-meta"><span class="daily-activity-tag">' + esc(content.body) + '</span></p>' : "";
      const disabled = !currentUser || !supabaseClient || snapshot.learningLanguage !== "en" || (typeof course !== "undefined" && course !== "en");
      return '<article class="daily-activity-card" data-activity-card="' + type + '">'
        + '<div class="daily-activity-meta"><span class="daily-activity-tag">' + esc(meta.label) + '</span><span class="daily-activity-tag">' + esc(remainingLabel) + '</span></div>'
        + '<h2>' + esc(meta.title) + '</h2><p>' + esc(meta.description) + '</p>'
        + '<div class="daily-reader-example"><strong>' + esc(content.title) + '</strong></div>'
        + reason
        + '<button type="button" class="primary-button" data-label="' + esc(buttonLabel) + '" data-start-daily="' + type + '"' + (disabled ? " disabled" : "") + '>' + esc(buttonLabel) + '</button>'
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
      if (button) { button.disabled = false; button.textContent = button.dataset.label || "Start / Resume"; }
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
    if (location.hash === "#daily-learning") initialiseDailyLearning();
  });
  if (location.hash === "#daily-learning") initialiseDailyLearning();
})();
