import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../../mock-testing.js", import.meta.url), "utf8");
class FakeStorage {
  constructor(){ this.data=new Map(); }
  get length(){ return this.data.size; }
  key(index){ return [...this.data.keys()][index] ?? null; }
  getItem(key){ return this.data.has(String(key)) ? this.data.get(String(key)) : null; }
  setItem(key,value){ this.data.set(String(key),String(value)); }
  removeItem(key){ this.data.delete(String(key)); }
  clear(){ this.data.clear(); }
}
function makeContext(hostname,search="?swiftMock=1") {
  const localStorage=new FakeStorage(), sessionStorage=new FakeStorage();
  const listeners={};
  const originalClient={auth:{},from(){throw new Error("original Supabase client should not be called");}};
  const window={supabase:{createClient(){return originalClient;}}};
  const document={readyState:"loading",addEventListener(name,callback){listeners[name]=callback;}};
  const location={hostname,search,href:"https://"+hostname+"/"+search,replace(){}};
  const context={
    window,document,location,localStorage,sessionStorage,Storage:FakeStorage,
    URLSearchParams,Intl,Date,JSON,String,Set,Array,Object,Number,Math,Promise,
    console:{log(){},info(){},warn(){},error(){}}
  };
  vm.runInNewContext(source,context,{filename:"mock-testing.js"});
  return {context,window,document,location,localStorage,sessionStorage,listeners,originalClient};
}

test("mock adapter activates only on the exact feature preview with explicit opt-in", async()=>{
  const env=makeContext("feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev");
  assert.equal(env.window.SWIFT_DICTIONARY_MOCK_MODE,true);
  assert.equal(env.window.SWIFT_DICTIONARY_MOCK_CAPABILITIES.rls,false);
  assert.equal(env.window.SWIFT_DICTIONARY_MOCK_CAPABILITIES.crossDeviceSync,false);
  const client=env.window.supabase.createClient("https://production.supabase.co","public-key");
  assert.equal(typeof client.from,"function");
  const session=await client.auth.getSession();
  assert.equal(session.data.session.user.id,"mock-user-a");
  const oauth=await client.auth.signInWithOAuth({provider:"google"});
  assert.match(oauth.error.message,/disabled in MOCK TEST MODE/);
});

test("mock data is isolated by identity and scoped to session storage",async()=>{
  const env=makeContext("feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev");
  const client=env.window.supabase.createClient();
  let result=await client.from("saved_words").select("word").eq("user_id","mock-user-a");
  assert.deepEqual(Array.from(result.data,row=>row.word).sort(),["hello","你"].sort());

  env.window.__swiftDictionaryMock.setActiveUser("mock-user-b");
  result=await client.from("saved_words").select("word").eq("user_id","mock-user-b");
  assert.deepEqual(Array.from(result.data,row=>row.word).sort(),["thank","好"].sort());
  await client.from("saved_words").insert({user_id:"mock-user-b",course:"en",word:"world"});
  env.window.__swiftDictionaryMock.setActiveUser("mock-user-a");
  result=await client.from("saved_words").select("word").eq("user_id","mock-user-a");
  assert.deepEqual(Array.from(result.data,row=>row.word).sort(),["hello","你"].sort());

  env.localStorage.setItem("swiftdictionary-saved","real-account-data");
  assert.equal(env.localStorage.getItem("swiftdictionary-saved"),null);
  env.localStorage.setItem("unrelated-real-setting","keep");
  env.sessionStorage.setItem("unrelated-session-setting","keep");
  env.window.__swiftDictionaryMock.reset();
  assert.equal(env.localStorage.getItem("unrelated-real-setting"),"keep");
  assert.equal(env.sessionStorage.getItem("unrelated-session-setting"),"keep");
  assert.equal([...env.sessionStorage.data.keys()].some(key=>key.startsWith("swiftDictionaryMock:v1:")),false);
});

test("daily activity RPCs simulate completion and allowance use without cloud access",async()=>{
  const env=makeContext("feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev");
  const client=env.window.supabase.createClient();
  const started=await client.rpc("start_daily_activity_session",{
    p_activity_type:"daily_topic",p_content_id:"topic-1",p_topic_id:"greetings",p_difficulty:null,p_source:"daily"
  });
  assert.equal(started.data.status,"in_progress");
  const completed=await client.rpc("complete_daily_activity_session",{
    p_session_id:started.data.id,p_correct_count:null,p_question_count:null
  });
  assert.equal(completed.data.status,"completed");
  const usage=await client.rpc("get_my_learning_allowance_usage");
  assert.equal(usage.data.find(row=>row.activity_type==="daily_topic").used_count,1);
  const duplicate=await client.rpc("complete_daily_activity_session",{
    p_session_id:started.data.id,p_correct_count:null,p_question_count:null
  });
  assert.equal(duplicate.data.status,"completed");
  const afterReplay=await client.rpc("get_my_learning_allowance_usage");
  assert.equal(afterReplay.data.find(row=>row.activity_type==="daily_topic").used_count,1);
});

test("production, root Pages and unknown hosts fail closed even with opt-in query",()=>{
  for(const host of [
    "swiftdictionary-testing.pages.dev",
    "whitewingcat.github.io",
    "example.com",
    "another-branch.swiftdictionary-testing.pages.dev"
  ]){
    const env=makeContext(host);
    assert.equal(env.window.SWIFT_DICTIONARY_MOCK_MODE,undefined,host);
    assert.equal(env.window.supabase.createClient(),env.originalClient,host);
    assert.equal(env.window.__swiftDictionaryMock,undefined,host);
  }
});

test("preview host without explicit opt-in does not activate mock mode",()=>{
  const env=makeContext("feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev","");
  assert.equal(env.window.SWIFT_DICTIONARY_MOCK_MODE,undefined);
  assert.equal(env.window.__swiftDictionaryMock,undefined);
});