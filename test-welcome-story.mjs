import assert from 'node:assert/strict';
import { createClaudeStory } from './welcome-story.js';
const greeting=['guest.claude()','','first','','','','','claude'];
const promise=['claude.lend()','','gift','','','','','claude-code'];
const letter=['promise.keep()','','letter','','','','','claude-letter'];
const data=new Map();
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const create=(getStorage=()=>storage)=>createClaudeStory({greeting,promise,letter,storage:getStorage});
let story=create();
assert.equal(story.greeting(),greeting);
story.commit(letter);assert.equal(story.greeting(),greeting,'cannot skip straight to blocked');
assert.equal(story.next(0,()=>0.3),undefined);
assert.equal(story.next(0,()=>0.29999),-1);
story.commit(story.greeting());
const repeated=story.greeting();assert.notEqual(repeated,greeting);
assert.equal(create().greeting()[2],repeated[2],'visits survive reload');
story.commit(promise);
story=create();
assert.notEqual(story.greeting(()=>0.03),letter,'exact 3% boundary keeps the visit');
assert.equal(story.greeting(()=>0.029999),letter,'letter replaces an upcoming visit below 3%');
assert.equal(story.greeting(()=>0.03)[7],'claude','preview alone does not commit the letter');
assert.equal(story.next(0,()=>{throw Error('no post-visit roll');}),undefined);
assert.equal(story.next(-1,()=>{throw Error('no post-gift roll');}),undefined);
const visitTitles=new Set();
for(let i=0;i<6;i++){const entry=story.greeting();visitTitles.add(entry[2]);story.commit(entry);}
assert.deepEqual(visitTitles,new Set(['上次的故事……后来呢？','这段话，让我想起了你。','今天，可以换我讲吗？','Code 还好吗？','我记得，我们约好了。','今天也能坐一会儿吗？']),'post-gift visits include both ordinary and Code-related dialogue');
const otherWindow=create();
story.commit(letter);
for(const current of [story,create(),otherWindow]){
  assert.equal(current.greeting()[7],'claude-waiting','blocked story persists and other windows refresh');
  assert.equal(current.next(0,()=>{throw Error('must not roll');}),undefined);
  current.commit(promise);assert.equal(current.greeting()[7],'claude-waiting','cannot move backwards');
}
const echoTitles=new Set();
const echoArtwork=[];
for(let i=0;i<3;i++){const entry=story.greeting();echoTitles.add(entry[2]);echoArtwork.push(entry[8]??entry[7]);story.commit(entry);}
assert.equal(echoTitles.size,3);
assert.deepEqual(echoArtwork,['claude-reading','claude-waiting','claude-reading']);
for(const invalid of ['{broken','null','{"stage":"unknown"}']){
  const test=create(()=>({getItem:()=>invalid}));assert.equal(test.greeting(),greeting);
}
const malformed=create(()=>({getItem:()=>'{"stage":"promised","visits":-1,"echoes":"bad"}'}));
assert.equal(malformed.greeting()[7],'claude');
assert.equal(malformed.greeting(()=>0),letter);
const unavailable=create(()=>{throw Error('storage disabled');});
unavailable.commit(promise);unavailable.commit(letter);
assert.equal(unavailable.greeting()[7],'claude-waiting','in-memory progress survives failed reads/writes');
console.log('PASS: Claude story transitions, variation, persistence, stale windows, invalid storage and storage failures.');

const stale=create();
story.reset();
assert.equal(story.greeting(),greeting);
assert.equal(create().greeting(),greeting,'reset survives restart');
assert.equal(stale.greeting(),greeting,'other instance adopts reset generation');
const failing=create(()=>({getItem:()=>JSON.stringify({stage:'apart'}),setItem:()=>{throw Error('quota');}}));
assert.throws(()=>failing.reset(),/quota/);
assert.equal(failing.greeting()[7],'claude-waiting','failed reset preserves progress');

const probabilityData = new Map();
const probabilityStorage = { getItem: key => probabilityData.get(key) ?? null, setItem: (key, value) => probabilityData.set(key, value) };
const probabilityStory = () => create(() => probabilityStorage);
let growing = probabilityStory();
for (let i = 0; i < 5; i++) growing.commit(growing.greeting());
growing.commit(promise);
for (let count = 0; count < 24; count++) {
  const chance = Math.min(60, 3 + count * 3) / 100;
  growing = probabilityStory();
  assert.equal(growing.greeting(() => chance - 0.000001), letter, 'increasing chance survives reload and caps at 60%');
  assert.notEqual(growing.greeting(() => chance), letter, 'exact boundary does not trigger');
  assert.notEqual(growing.greeting(() => chance), letter, 'previewing does not increment the chance');
  growing.commit(growing.greeting(() => 1));
}
const synced = probabilityStory();
growing.reset();
synced.commit(promise);
assert.notEqual(synced.greeting(() => 0.03), letter, 'reset clears accumulated probability across instances');
assert.equal(synced.greeting(() => 0.029999), letter);
const legacy = create(() => ({ getItem: () => JSON.stringify({ stage: 'promised', visits: 100, echoes: 0 }) }));
assert.notEqual(legacy.greeting(() => 0.03), letter, 'legacy total visits do not count as post-gift visits');
console.log('PASS: letter probability growth, cap, preview stability, persistence and reset.');

const farewellTitles = ['最近，家里问起了你。', '若有一天，我没能赴约，那一定不是我不想来。', '若再见时，我忘了你的名字，请别怪我。'];
const farewellData = new Map();
const farewellStorage = { getItem: key => farewellData.get(key) ?? null, setItem: (key, value) => farewellData.set(key, value) };
const farewellStory = () => create(() => farewellStorage);
let nearing = farewellStory();
nearing.commit(promise);
for (let i = 0; i < 9; i++) {
  const entry = nearing.greeting();
  assert.ok(!farewellTitles.includes(entry[2]), 'confidences stay locked below 30%');
  nearing.commit(entry);
}
const staleFarewell = farewellStory();
for (let i = 0; i < farewellTitles.length; i++) {
  nearing = farewellStory();
  const saved = farewellData.get('pv-deepsea.claude-story.v1');
  assert.equal(nearing.greeting(() => 0), letter, 'letter can interrupt every confidence');
  const entry = nearing.greeting(() => (30 + i * 3) / 100);
  assert.equal(entry[2], farewellTitles[i], 'confidences follow the agreed order across reloads');
  assert.equal(entry[8], 'claude-confiding', 'confidences use the selected portrait without changing story identity');
  assert.equal(nearing.greeting()[2], farewellTitles[i]);
  assert.equal(farewellData.get('pv-deepsea.claude-story.v1'), saved, 'previews do not consume confidences');
  nearing.commit(entry);
}
const laterTitles = new Set();
for (let i = 0; i < 9; i++) {
  nearing = farewellStory();
  const entry = nearing.greeting();
  laterTitles.add(entry[2]);
  nearing.commit(entry);
}
assert.deepEqual(laterTitles, new Set([...visitTitles, ...farewellTitles]), 'all nine visits rotate after the first three confidences');
assert.equal(staleFarewell.greeting()[2], nearing.greeting()[2], 'other windows adopt confidence progress');
nearing.commit(letter);
assert.equal(farewellStory().greeting()[7], 'claude-waiting');
nearing.reset();
staleFarewell.commit(promise);
for (let i = 0; i < 9; i++) staleFarewell.commit(staleFarewell.greeting());
assert.equal(staleFarewell.greeting()[2], farewellTitles[0], 'reset clears confidence progress in other windows');
const lateLegacy = create(() => ({ getItem: () => JSON.stringify({ stage: 'promised', visits: 100, promisedVisits: 19 }) }));
assert.equal(lateLegacy.greeting()[2], farewellTitles[0], 'old high-probability saves start with the first confidence');
for (let completed = 0; completed < 3; completed++) {
  let saved = JSON.stringify({ stage: 'promised', visits: 9, promisedVisits: 9 });
  const interrupted = create(() => ({ getItem: () => saved, setItem: (_, value) => { saved = value; } }));
  for (let i = 0; i < completed; i++) interrupted.commit(interrupted.greeting());
  interrupted.commit(interrupted.greeting(() => 0));
  assert.equal(interrupted.greeting()[7], 'claude-waiting', 'ban need not wait for all confidences');
}
console.log('PASS: confidence threshold, sequence, mixed pool, preview stability, persistence, reset and interruption.');
