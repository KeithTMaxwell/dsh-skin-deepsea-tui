import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { terminalScene, transitionTerminalArt } from './terminal-scene.js';
const windowsBuild = process.argv.includes('--windows');
const aliases = JSON.parse(fs.readFileSync(new URL('class-aliases.json', import.meta.url), 'utf8'));
const nativeSelector = selector => windowsBuild ? selector.replace(/\.([\w-]+)_([A-Za-z][\w-]*)/g,
  (match, prefix, name) => aliases[prefix] ? `.${aliases[prefix]}_${name}` : match) : selector;
class NativeFixtures extends Map {
  set(selector, value) { return super.set(nativeSelector(selector), value); }
}
let factory, cleanup, definition;
let testRandom = 0;
const testMath = Object.create(Math); testMath.random = () => testRandom;
let testNow=Date.now();
class TestDate extends Date { static now(){return testNow;} }
const timeouts = new Map();
const listeners = new Map(), timers = new Map(); let timerId = 0;
const elements = [];
class Element {
  constructor() { this.attrs = new Map(); this.dataset = {}; this.isConnected = false; this.textContent = ''; this.listeners = new Map(); }
  setAttribute(k,v) { this.attrs.set(k,v); }
  getAttribute(k) { return this.attrs.get(k) ?? null; }
  removeAttribute(k) { this.attrs.delete(k); }
  addEventListener(k,f) { this.listeners.set(k,f); }
  removeEventListener(k) { this.listeners.delete(k); }
  append(e) { e.parentElement=this; e.isConnected=true; }
  prepend(e) { this.append(e); }
  remove() { this.isConnected=false; this.parentElement=null; for(const el of elements) if(el.parentElement===this) el.isConnected=false; }
  querySelector(k) { this.nodes ??= new Map(); if (!this.nodes.has(k)) this.nodes.set(k,new Element()); return this.nodes.get(k); }
  getBoundingClientRect() { return {width:120}; }
  getContext() { return {setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}; }
}
const body=new Element(),head=new Element();
const frame=new Element(), sidebar=new Element(), rightbar=new Element(), center=new Element();
for (const el of [frame,sidebar,rightbar,center]) el.isConnected=true;
const properties=new Map([['--pv-sidebar-edge','original']]);
frame.style={getPropertyValue:k=>properties.get(k)??'',setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)};
frame.getBoundingClientRect=()=>({left:0,top:0,right:1280,bottom:820,width:1280});
sidebar.getBoundingClientRect=()=>({left:12,top:32,right:198,bottom:774,width:186});
rightbar.getBoundingClientRect=()=>({left:712,top:32,right:1268,bottom:774,width:556});
const fixtures=new NativeFixtures([['._6Qf49G_frame',frame],['._6Qf49G_centerCol',center],['[data-pv-part=sidebar]',sidebar],['[data-pv-part=rightbar]',rightbar]]);
const brandSeat=new Element(), conversation=new Element(), heroSeat=new Element();
for (const el of [brandSeat,conversation,heroSeat]) el.isConnected=true;
fixtures.set('._3WPZCG_brandIdentity',brandSeat);
fixtures.set('.ST7X_W_root',conversation);
fixtures.set('.bocITq_root',heroSeat);
fixtures.set('._6Qf49G_sidebarCol',sidebar);
fixtures.set('._6Qf49G_rightbarCol',rightbar);
let resized, resizeDisposed=false, animation, frameId=0;
const frames=new Map();
const mediaListeners=new Map(), documentListeners=new Map();
const media={matches:false,addEventListener:(k,f)=>mediaListeners.set(k,f),removeEventListener:k=>mediaListeners.delete(k)};
const window={devicePixelRatio:1,__ModuleLoader__:{load(x){factory=x.factory;}},addEventListener(k,f){listeners.set(k,f);},removeEventListener(k){listeners.delete(k);},dispatchEvent(e){if(e.type==='dsh:skin-customization-register-v2')definition=e.detail.definition;listeners.get(e.type)?.(e);}};
window.matchMedia=()=>media;
const storyStore = new Map();
window.localStorage = { getItem: key => storyStore.get(key) ?? null, setItem: (key, value) => storyStore.set(key, value) };
const storyState = () => JSON.parse(storyStore.get('pv-deepsea.claude-story.v1') ?? 'null');
const fact={running:false};
const chat={timeline:{turnOrder:[1],turns:new Map([[1,{start:{time:Date.now()-5000},end:{time:Date.now()-3000}}]])},legacy:{}};
const current={key:'test-session',hooks:{session:{getSnapshot:()=>({running:fact.running})},conversation:{getSnapshot:()=>({views:new Map([['chat',chat]])})}}};
let disconnected=false;
const personaCalls=[]; let personaFailure;
const document={body,head,hidden:false,createElement:()=>{const e=new Element();elements.push(e);return e;},querySelector:k=>fixtures.get(k)??null,querySelectorAll:k=>fixtures.has(k)?[fixtures.get(k)]:[]};
document.addEventListener=(k,f)=>documentListeners.set(k,f);
document.removeEventListener=k=>documentListeners.delete(k);
vm.runInNewContext(fs.readFileSync(new URL('lib/client.js',import.meta.url),'utf8'),{Math:testMath,Date:TestDate,window,document,StorageEvent:class{constructor(type,x){this.type=type;Object.assign(this,x);}},CustomEvent:class{constructor(type,x){this.type=type;Object.assign(this,x);}},MutationObserver:class{observe(){}disconnect(){}},ResizeObserver:class{constructor(f){resized=f;}observe(){}unobserve(){}disconnect(){resizeDisposed=true;}},requestAnimationFrame:f=>{const id=++frameId; animation=()=>{frames.delete(id);f();};frames.set(id,animation);return id;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(callback,delay)=>{const id=++timerId;timeouts.set(id,{callback,delay});return id;},clearTimeout:id=>timeouts.delete(id),setInterval:f=>{timers.set(++timerId,f);return timerId;},clearInterval:id=>timers.delete(id)});
factory().apply({effect:f=>cleanup=f(),get:k=>k==='uiSession'?{current:{getSnapshot:()=>{if(disconnected)throw Error('offline');return current;}},sessionStatus:{getSnapshot:()=>new Map([['test-session',fact]])}}:k==='connection'?{rpc:{call:async(channel,endpoint,payload)=>{if(endpoint==='pv-deepsea-persona'){personaCalls.push(payload);if(personaFailure)throw new Error(personaFailure);}return {ok:true,value:{time:Date.now(),samples:[{time:Date.now(),percent:7}]}};}}}:undefined});
assert.equal(body.getAttribute('data-pv-state'),'就绪'); assert.equal(timers.size,2);
assert.equal(frame.getAttribute('data-pv-part'),'frame');
assert.equal(center.getAttribute('data-pv-part'),'center');
assert.equal(elements.find(e=>e.className==='pv-brand').parentElement,brandSeat);
assert.equal(elements.find(e=>e.className==='pv-presence').parentElement,conversation);
assert.equal(elements.find(e=>e.className==='pv-stage').parentElement,heroSeat);
assert.equal(elements.find(e=>e.className==='pv-bottom').parentElement,frame);
assert.equal(properties.get('--pv-sidebar-edge'),'197.5px'); assert.equal(properties.get('--pv-rightbar-edge'),'712.5px');
assert.equal(properties.get('--pv-handle-top'),'32px'); assert.equal(properties.get('--pv-handle-bottom'),'46px');
sidebar.getBoundingClientRect=()=>({left:12,top:32,right:318,bottom:774,width:306}); resized(); animation(); assert.equal(properties.get('--pv-sidebar-edge'),'317.5px');
const tick=[...timers.values()][0]; fact.running=true; tick(); assert.equal(body.getAttribute('data-pv-state'),'思考');
const fx=elements.find(e=>e.className==='pv-fx');
assert.equal(fx.getAttribute('data-phase'),'思考');
const bottom=elements.find(e=>e.className==='pv-bottom');
const fxHud=elements.find(e=>e.className==='pv-fx-hud');
assert.equal(fxHud.parentElement,center,'operation HUD is attached to conversation pane');
assert.ok(fxHud.innerHTML.includes('pv-fx-spinner">/</span><span class="pv-log-brand">dsh web :</span>'),'title slash is the only spinner');
assert.ok(!fxHud.innerHTML.includes('pv-fx-register'),'title contains only slash, brand and status');
const firstSpinner=fxHud.querySelector('.pv-fx-spinner').textContent;
const firstGlyphs=fx.querySelector('.pv-fx-glyphs').textContent;
testNow+=100;tick();
assert.notEqual(fxHud.querySelector('.pv-fx-spinner').textContent,firstSpinner,'spinner advances within 100ms');
assert.notEqual(fx.querySelector('.pv-fx-glyphs').textContent,firstGlyphs,'background characters advance within 100ms');
assert.equal(fx.getAttribute('aria-hidden'),'true');
assert.equal(fx.parentElement,center);
assert.equal(body.getAttribute('data-pv-fx'),'思考');
media.matches=true; mediaListeners.get('change')(); assert.equal(body.getAttribute('data-pv-fx'),'off');
media.matches=false; mediaListeners.get('change')(); assert.equal(body.getAttribute('data-pv-fx'),'思考');
document.hidden=true; documentListeners.get('visibilitychange')(); assert.equal(body.getAttribute('data-pv-fx'),'off');
document.hidden=false; documentListeners.get('visibilitychange')(); assert.equal(body.getAttribute('data-pv-fx'),'思考');
await new Promise(resolve=>setImmediate(resolve));
const presence=elements.find(e=>e.className==='pv-presence');
const pulseCanvas=presence.querySelector('canvas');
const originalContext=pulseCanvas.getContext;
let segments=[], startPoint;
pulseCanvas.getContext=()=>({setTransform(){},clearRect(){segments=[];},beginPath(){},
  moveTo(x,y){startPoint=[x,y];},lineTo(x,y){segments.push([...startPoint,x,y]);},stroke(){}});
chat.legacy.partial={turn:1,blocks:[{kind:'text',text:'pulse'}]};tick();
testNow+=300;tick();
assert.equal(segments.length,40,'waveform draws only its vertical bars, without an overlay line');
assert.ok(segments.every(([x,,endX])=>x===endX),'every waveform segment is vertical');
assert.ok(segments.some(([,y,,endY])=>endY-y>12),'an activity beat raises the bars');
media.matches=true;tick();
assert.ok(segments.every(([,y,,endY])=>endY-y===2),'reduced motion leaves short static bars');
media.matches=false;
delete chat.legacy.partial;
pulseCanvas.getContext=originalContext;
presence.querySelector('canvas').getBoundingClientRect=()=>({width:0});
tick(); assert.equal(bottom.querySelector('.pv-cpu').textContent,'DSH CPU 7%','hidden waveform must not suppress status-bar CPU updates');
assert.match(bottom.querySelector('.pv-cpu').title,/单核基准.*非整机/);
disconnected=true; tick();
assert.equal(presence.querySelector('.pv-presence-state').textContent,'在线 · 就绪','session initialization errors are not network outages');
disconnected=false;
const savedKey=current.key, savedHooks=current.hooks;
current.key=undefined;tick();
assert.equal(presence.querySelector('.pv-presence-state').textContent,'在线 · 就绪','new session without a key stays online');
current.key=savedKey;current.hooks=undefined;fact.running=false;tick();
assert.equal(presence.querySelector('.pv-presence-state').textContent,'在线 · 就绪','new session without hooks stays online');
current.hooks=savedHooks;
window.navigator={onLine:false};listeners.get('offline')();
assert.equal(presence.querySelector('.pv-presence-state').textContent,'未连接');
assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'disconnected');
assert.equal(bottom.querySelector('.pv-log').textContent,'› / disconnected');
window.navigator.onLine=true;listeners.get('online')();
assert.equal(presence.querySelector('.pv-presence-state').textContent,'在线 · 就绪','network restoration updates immediately');
fact.running=true;tick();
const leftToggle=elements.find(e=>e.className==='pv-sidebar-toggle pv-sidebar-toggle-left');
const rightToggle=elements.find(e=>e.className==='pv-sidebar-toggle pv-sidebar-toggle-right');
let leftClicks=0, rightClicks=0;
fixtures.set('._3WPZCG_toggle',{click:()=>leftClicks++});
fixtures.set('[data-sidebar-right-expand]',{click:()=>rightClicks++});
frame.setAttribute('data-sidebar-collapsed','true'); tick();
assert.equal(leftToggle.getAttribute('aria-expanded'),'false'); assert.equal(rightToggle.getAttribute('aria-label'),'展开右侧边栏');
leftToggle.listeners.get('click')(); rightToggle.listeners.get('click')(); assert.equal(leftClicks,1); assert.equal(rightClicks,1);
fixtures.set('[data-sidebar-right-session]:not([hidden]) [data-sidebar-right-open]',new Element());
fixtures.set('[data-sidebar-right-session]:not([hidden]) [data-sidebar-right-open] [data-sidebar-right-toggle]',{click:()=>rightClicks+=10});
frame.removeAttribute('data-sidebar-collapsed'); tick();
assert.equal(leftToggle.getAttribute('aria-label'),'收起左侧边栏'); assert.equal(rightToggle.getAttribute('aria-expanded'),'true');
rightToggle.listeners.get('click')(); assert.equal(rightClicks,11);
const welcome=elements.find(e=>e.className==='pv-stage');
welcome.isConnected=true; current.key=undefined; tick();
const welcomeTitle=()=>welcome.querySelector('p').getAttribute('aria-label') ?? welcome.querySelector('p').textContent;
const firstGreeting=welcomeTitle();
const firstPortrait=welcome.querySelector('img').src;
const firstExpression=welcome.querySelector('img').getAttribute('data-expression');
const firstReveal=welcome.querySelector('img').getAttribute('data-reveal');
testNow+=7750; tick(); assert.equal(welcomeTitle(),firstGreeting);
testNow+=500; tick(); assert.equal(welcome.getAttribute('data-welcome-phase'),'erase');
assert.ok(welcomeTitle().length<firstGreeting.length);
const subframes=new Set();
for(let i=0;i<10;i++){testNow+=16; for(const callback of [...frames.values()])callback();subframes.add(welcome.querySelector('small').textContent);}
assert.ok(subframes.size>=3,'welcome must advance between 250ms status ticks');
assert.equal(frames.size,1,'only one welcome frame may be queued');
testNow+=750; tick(); assert.equal(welcome.getAttribute('data-welcome-phase'),'decode');
assert.equal(welcome.querySelector('.pv-portrait-front .pv-roll-copy img').src,welcome.querySelector('img').src,'wrapped front frame matches current image');
assert.equal(welcome.querySelector('.pv-portrait-back .pv-roll-copy img').src,firstPortrait,'wrapped old frame remains aligned with old image');
assert.equal(welcome.querySelector('.pv-portrait-back img').src,firstPortrait,'scan retains the old portrait below the new layer');
assert.equal(welcome.querySelector('.pv-portrait-back img').getAttribute('data-expression'),firstExpression,'old image keeps its alignment');
assert.equal(welcome.querySelector('.pv-portrait-front').getAttribute('data-reveal'),welcome.querySelector('img').getAttribute('data-reveal'));
assert.notEqual(welcome.querySelector('img').getAttribute('data-reveal'),firstReveal,'decode restarts the scan exactly once');
const nextReveal=welcome.querySelector('img').getAttribute('data-reveal');
testNow+=1000; tick(); assert.equal(welcome.getAttribute('data-welcome-phase'),'hold');
assert.equal(welcome.querySelector('img').getAttribute('data-reveal'),nextReveal,'hold must not restart the scan');
assert.notEqual(welcomeTitle(),firstGreeting);
const secondGreeting=welcomeTitle();
assert.equal(frames.size,0,'idle hold must not run animation frames');
testNow+=8250;tick();assert.equal(frames.size,1);
document.hidden=true;documentListeners.get('visibilitychange')();assert.equal(frames.size,0);
document.hidden=false;documentListeners.get('visibilitychange')();
media.matches=true; mediaListeners.get('change')(); testNow+=30000; tick();
assert.equal(welcomeTitle(),secondGreeting);
media.matches=false; mediaListeners.get('change')();
document.hidden=true; documentListeners.get('visibilitychange')(); testNow+=30000;
document.hidden=false; documentListeners.get('visibilitychange')();
assert.equal(welcome.getAttribute('data-welcome-phase'),'hold');
assert.equal(welcomeTitle(),secondGreeting);
// Repeatable ordinary greetings and ChatGPT remain independent of Claude progress.
testRandom=0.3;
const normalTitles=new Set([welcomeTitle()]);
for(let i=0;i<16;i++){testNow+=10000;tick();normalTitles.add(welcomeTitle());}
assert.ok(normalTitles.has('探索未至之境'));
assert.ok(normalTitles.has('写代码？来试试 Codex 吧。'));
assert.equal(storyState().stage,'visiting');
const guestTitle='写代码？来试试 Codex 吧。';
const followupTitle='哼，用 Codex 也可以找本鱼！';
const promiseTitle='Code 借你……下次再还我。';
const letterTitle='……本鱼陪你坐一会儿。';
const expression=()=>welcome.querySelector('img').getAttribute('data-expression');
function restartAtGuest(random, target='chatgpt') {
  testRandom=random;
  body.listeners.get('click')({target:{closest:()=>true}});tick();
  assert.notEqual(welcomeTitle(),followupTitle);
  assert.notEqual(welcomeTitle(),promiseTitle);
  assert.notEqual(welcomeTitle(),letterTitle);
  for(let i=0;i<20 && expression()!==target;i++){testNow+=10000;tick();}
  assert.equal(expression(),target);
}
assert.equal(definition.settings.find(x=>x.key==='guests').defaultValue,true);
const isGuestArtwork=()=>/^(chatgpt|pushout|claude)/.test(expression());
for(const guest of ['chatgpt','claude']) {
  restartAtGuest(0.3,guest);
  testRandom=0.2;testNow+=9000;tick();
  assert.ok(isGuestArtwork(),'a guest follow-up is being previewed');
  definition.apply({values:{guests:false}});
  assert.equal(isGuestArtwork(),false,'disabling visitors immediately cancels the pending guest scene');
  const clearedStory=storyStore.get('pv-deepsea.claude-story.v1');
  assert.equal(storyState().stage,'visiting');
  for(const field of ['visits','echoes','promisedVisits','farewellVisits']) assert.equal(storyState()[field],0);
  for(let i=0;i<36;i++) {
    testNow+=10000;tick();
    assert.equal(isGuestArtwork(),false,'disabled visitors stay out of successive welcome cycles');
  }
  body.listeners.get('click')({target:{closest:()=>true}});tick();
  assert.equal(isGuestArtwork(),false,'new sessions respect the visitor switch');
  definition.apply({values:{guests:false,motion:false}});
  assert.equal(isGuestArtwork(),false,'static welcome also respects the visitor switch');
  assert.equal(storyStore.get('pv-deepsea.claude-story.v1'),clearedStory,'remaining disabled neither advances progress nor resets it repeatedly');
  definition.apply({values:{guests:true}});
  restartAtGuest(0.3,guest);
}
restartAtGuest(0.3);
testNow+=9000;tick();testRandom=0;testNow+=1000;tick();
assert.notEqual(welcomeTitle(),followupTitle,'exact 0.3 fails and decode decision is cached');
restartAtGuest(0.3);
testRandom=0.299999;testNow+=9000;tick();
assert.equal(expression(),'pushout');
testRandom=0.99;testNow+=1000;tick();
assert.equal(welcomeTitle(),followupTitle);
assert.equal(welcome.querySelector('small').textContent,'curl -fsSL https://cdn.deepseek.com/api-docs/codex-deepseek-setup.sh');
testNow+=10000;tick();assert.notEqual(expression(),'pushout');
restartAtGuest(0.3,'claude');
const earlierVisit=welcomeTitle();
testNow+=9000;tick();testRandom=0;testNow+=1000;tick();
assert.notEqual(welcomeTitle(),promiseTitle,'failed gift decision stays cached');
restartAtGuest(0.3,'claude');
assert.notEqual(welcomeTitle(),earlierVisit,'repeat visits vary before the promise');
const beforeGift=storyStore.get('pv-deepsea.claude-story.v1');
testRandom=0.299999;testNow+=9000;tick();
assert.equal(expression(),'claude-code');
assert.equal(storyStore.get('pv-deepsea.claude-story.v1'),beforeGift,'decode cannot commit a gift');
// Interrupt the uncompleted gift preview with a new session.
restartAtGuest(0.3,'claude');assert.equal(storyState().stage,'visiting');
testRandom=0.2;testNow+=9000;tick();testRandom=0.99;testNow+=1000;tick();
assert.equal(welcomeTitle(),promiseTitle);
assert.equal(storyState().stage,'promised');
assert.equal(welcome.querySelector('small').textContent,'我还想听你说。只是……若被家里发现，往后恐怕就再也见不到你了。');
// A pause/repaint must not commit the same scene a second time.
const savedPromise=storyStore.get('pv-deepsea.claude-story.v1');
media.matches=true;mediaListeners.get('change')();testNow+=30000;tick();
assert.equal(welcomeTitle(),promiseTitle);
assert.equal(storyStore.get('pv-deepsea.claude-story.v1'),savedPromise);
media.matches=false;mediaListeners.get('change')();
testRandom=0;testNow+=9000;tick();testNow+=1000;tick();
assert.notEqual(welcomeTitle(),letterTitle,'gift is never immediately followed by a letter');
assert.equal(storyState().stage,'promised');
restartAtGuest(0.3,'claude');
assert.notEqual(welcomeTitle(),'你刚才说的，能再讲一点吗？');
const laterVisit=welcomeTitle();
testRandom=0.1;
for(let i=0;i<20;i++){testNow+=10000;tick();assert.notEqual(expression(),'claude-code','Code is lent only once');if(expression()==='claude')break;}
assert.equal(expression(),'claude');
assert.notEqual(welcomeTitle(),laterVisit,'promised visits rotate dialogue');
// Inspect the upcoming slot before hold: the roll happens BEFORE Claude appears.
function previewClaudeSlot(random, expected) {
  testRandom=random;
  for(let i=0;i<22;i++) {
    testNow+=9000;tick();
    if(expression()===expected) return;
    testNow+=1000;tick();
  }
  assert.fail('Claude slot did not appear');
}
previewClaudeSlot(0.6,'claude');
assert.equal(storyState().stage,'promised');
testRandom=0;testNow+=1000;tick();
assert.equal(expression(),'claude','failed letter roll stays cached through decode');
// No roll upon leaving a visit, even with random zero.
testNow+=10000;tick();assert.notEqual(expression(),'claude-letter');
for(let i=0;i<9 && storyState().promisedVisits<9;i++) restartAtGuest(0.99,'claude');
assert.equal(storyState().promisedVisits,9);
const beforeConfidence=storyState().farewellVisits;
previewClaudeSlot(0.99,'claude-confiding');
assert.equal(storyState().farewellVisits,beforeConfidence,'portrait preview cannot advance confidences');
assert.equal(welcome.querySelector('img').src,'data:image/webp;base64,'+fs.readFileSync(new URL('assets/guest-claude-confiding.webp',import.meta.url)).toString('base64'));
testNow+=1000;tick();
assert.equal(storyState().farewellVisits,beforeConfidence+1,'portrait override preserves confidence commits');
testNow+=10000;tick();
previewClaudeSlot(0.029999,'claude-letter');
assert.equal(storyState().stage,'promised','letter preview does not block visits');
const visitsBeforeLetter=storyState().visits;
assert.ok(welcome.querySelector('img').src.startsWith('data:image/webp;base64,'));
testRandom=0.99;testNow+=1000;tick();
assert.equal(welcomeTitle(),letterTitle);
assert.equal(storyState().stage,'apart');
assert.equal(storyState().visits,visitsBeforeLetter,'letter replaces visit instead of following it');
media.matches=true;mediaListeners.get('change')();testNow+=30000;tick();
assert.equal(welcomeTitle(),letterTitle);
media.matches=false;mediaListeners.get('change')();
const afterLetter=new Set();testRandom=0;
for(let i=0;i<40;i++){
  testNow+=10000;tick();afterLetter.add(welcomeTitle());
  if(welcome.querySelector('.pv-greeting').textContent==='STILL / WAITING') {
    const waitingArtwork=welcomeTitle()==='小家伙，你也在等她啊。'?'claude-waiting':'claude-reading';
    assert.equal(expression(),waitingArtwork);
    const waitingFile=waitingArtwork==='claude-waiting'?'guest-claude-waiting-v2.webp':'guest-claude-reading.webp';
    assert.equal(welcome.querySelector('img').src,'data:image/webp;base64,'+fs.readFileSync(new URL('assets/'+waitingFile,import.meta.url)).toString('base64'));
    assert.ok(welcome.querySelector('img').src.startsWith('data:image/webp;base64,'));
  }
  assert.ok(!['claude','claude-code','claude-letter'].includes(expression()),'no reappearance, duplicate gift or duplicate ban after letter');
}
assert.ok(afterLetter.has(followupTitle),'ChatGPT branch remains repeatable');
assert.ok([...afterLetter].some(title=>['她的位置，我留着呢。','小家伙，你也在等她啊。','那些话，我替你收好了。'].includes(title)));
body.listeners.get('click')({target:{closest:()=>true}});tick();
assert.equal(storyState().stage,'apart','new conversation preserves story');
for(let i=0;i<20;i++){testNow+=10000;tick();assert.ok(!['claude','claude-code','claude-letter'].includes(expression()));}
// The visitor switch clears completed story progress without rewriting manager preferences.
assert.ok(!definition.settings.some(x=>x.key==='resetStory'));
const preferencesKey='dsh.skin-manager.preferences.v2';
const savedPreferences=JSON.stringify({'pv-deepsea':{guests:false,motion:true,persona:false,resetStory:true},other:{enabled:true}});
storyStore.set(preferencesKey,savedPreferences);
definition.apply({values:{guests:false,motion:true,persona:false}});
assert.equal(storyState().stage,'visiting');
assert.ok(storyState().resetAt>0);
for(const field of ['visits','echoes','promisedVisits','farewellVisits']) assert.equal(storyState()[field],0);
assert.equal(storyStore.get(preferencesKey),savedPreferences);
assert.equal(isGuestArtwork(),false);
const resetStamp=storyState().resetAt;
definition.apply({values:{guests:false,scanlines:false}});
assert.equal(storyState().resetAt,resetStamp,'other settings do not repeat the reset');
definition.apply({values:{guests:true,resetStory:true}});
assert.equal(storyState().resetAt,resetStamp,'obsolete resetStory preference is ignored');
restartAtGuest(0.3,'claude');
assert.equal(welcomeTitle(),'你刚才说的，能再讲一点吗？','re-enabled Claude starts at the first meeting');
const normalWrite=window.localStorage.setItem;
const beforeFailedReset=storyStore.get('pv-deepsea.claude-story.v1');
window.localStorage.setItem=()=>{throw Error('quota');};
definition.apply({values:{guests:false}});
assert.equal(isGuestArtwork(),false,'visitors still stop if storage is unavailable');
assert.equal(storyStore.get('pv-deepsea.claude-story.v1'),beforeFailedReset,'failed save leaves persisted progress intact');
window.localStorage.setItem=normalWrite;
definition.apply({values:{guests:false}});
assert.ok(storyState().resetAt>resetStamp,'a later settings update retries the failed reset');
assert.equal(storyState().visits,0);
definition.apply(null);
definition.apply({values:{guests:false}});
assert.equal(isGuestArtwork(),false,'reactivating the skin respects disabled visitors');
definition.apply({values:{guests:true}});
await new Promise(resolve=>setImmediate(resolve));
let sawInterference=false, sawScanInterference=false, sawIndependent=false, sawOverlap=false;
const modes=['slice','chroma','sync','text','data'];
let randomSeed=183;
testMath.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
// Restart with independent deterministic random samples for all five clocks.
media.matches=true;mediaListeners.get('change')();media.matches=false;mediaListeners.get('change')();
// Cover eight simulated minutes with 20–40s image and 12–24s text intervals.
for(let i=0;i<1920;i++) {
  testNow+=250; tick();
  const activeModes=modes.filter(mode=>welcome.getAttribute(`data-glitch-${mode}`));
  if(activeModes.length) {
    sawInterference=true;
    if(activeModes.length===1) sawIndependent=true;
    if(activeModes.length>1) sawOverlap=true;
    if(welcome.getAttribute('data-welcome-phase')==='decode') sawScanInterference=true;
  }
}
assert.ok(sawInterference);
assert.ok(sawIndependent,'faults can appear alone');
assert.ok(sawOverlap,'independent faults can overlap');
assert.ok(sawScanInterference,'faults can overlap scanning');
media.matches=true; mediaListeners.get('change')();
for(const mode of modes) assert.equal(welcome.getAttribute(`data-glitch-${mode}`),null,'reduced motion clears every fault');
for(const selector of ['.pv-greeting','p','small']) assert.ok(!/[▓▧乂]/.test(welcome.querySelector(selector).textContent),'English and Chinese copy restore after interference');
media.matches=false; mediaListeners.get('change')();
current.key='test-session'; tick(); const stoppedGreeting=welcomeTitle();
testNow+=30000; tick(); assert.equal(welcome.getAttribute('data-welcome-phase'),'hold');
assert.equal(welcomeTitle(),stoppedGreeting);
fact.pendingInteraction=true; tick(); assert.equal(body.getAttribute('data-pv-state'),'等待');
assert.equal(body.getAttribute('data-pv-wait'),'choice');
fact.pendingInteraction={kind:'approval'}; tick();
assert.equal(body.getAttribute('data-pv-wait'),'approval','permission requests are distinguished from choices');
assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'await approval');
assert.equal(bottom.querySelector('.pv-log').textContent,'› / await approval');
media.matches=true; tick();
assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'await approval','reduced motion preserves the waiting prompt');
media.matches=false; tick();
for (const kind of ['question','plan-review']) {
  fact.pendingInteraction={kind}; tick();
  assert.equal(body.getAttribute('data-pv-wait'),'choice','questions and plan reviews use choice highlighting');
  assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'await choice');
  assert.equal(bottom.querySelector('.pv-log').textContent,'› / await choice');
}
assert.equal(body.getAttribute('data-pv-fx'),'等待');
fact.running=false; tick(); assert.equal(body.getAttribute('data-pv-state'),'等待','pending input remains highlighted while the run is paused');
fact.running=true; tick();
assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'await choice');
assert.equal(fxHud.querySelector('.pv-fx-spinner').textContent,'/','waiting restores a static title slash');
const heldGlyphs=fx.querySelector('.pv-fx-glyphs').textContent; testNow+=250; tick(); assert.equal(fx.querySelector('.pv-fx-glyphs').textContent,heldGlyphs);
fact.pendingInteraction=false; chat.legacy.runningCalls=[{}]; tick(); assert.equal(body.getAttribute('data-pv-state'),'执行');
assert.equal(body.getAttribute('data-pv-wait'),'none','resolving the request clears its border override');
assert.equal(fx.getAttribute('data-phase'),'执行'); assert.match(fx.querySelector('.pv-fx-glyphs').textContent,/\[.*=.*\]/);
chat.legacy.runningCalls=[]; chat.legacy.partial={turn:1,blocks:[{kind:'text',text:'output'}]}; tick(); assert.equal(body.getAttribute('data-pv-state'),'输出');
assert.equal(fx.getAttribute('data-phase'),'输出'); assert.match(fx.querySelector('.pv-fx-glyphs').textContent,/stdout/);
fact.running=false; tick(); assert.equal(body.getAttribute('data-pv-fx'),'settle');
testNow+=1000; tick(); assert.equal(body.getAttribute('data-pv-fx'),'off');
assert.equal(fxHud.querySelector('.pv-fx-command').textContent,'await input');
assert.equal(bottom.querySelector('.pv-log').textContent,'› / await input');
fact.running=true; tick(); current.key='another-session'; fact.running=false; tick(); assert.equal(body.getAttribute('data-pv-fx'),'off','switching conversations must not play a completion effect');
current.key='test-session'; fact.running=true; tick();
assert.equal(definition.settings.find(x=>x.key==='persona').defaultValue,true);
personaFailure='transport failure for /api/pv-deepsea-persona: HTTP 404';
definition.apply({values:{persona:false}});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(welcome.getAttribute('data-persona-error'),'人设接口未加载，请重启 DSH 后重试。');
personaFailure=undefined;
definition.apply({values:{persona:false}});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(personaCalls.at(-1).enabled,false,'persona toggle reaches host'); assert.equal(welcome.getAttribute('data-persona-error'),null,'successful retry clears error');
definition.apply({values:{persona:true}});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(personaCalls.at(-1).enabled,true);
assert.ok(!elements.some(e=>e.className==='pv-permission-expand'),'permission changes have no expanding overlay');
const fullAccessFixture='button:is([aria-label^="访问模式"][aria-label*="完全权限"],[aria-label*="access mode" i][aria-label*="full access" i])';
const terminal=elements.find(e=>e.className==='pv-root-terminal');
const oldOrder=chat.timeline.turnOrder;
chat.timeline.turnOrder=[];fact.running=false;
fixtures.set(fullAccessFixture,new Element());
testMath.random=()=>0;
const beforeTerminalStory=JSON.stringify(storyState());tick();
assert.equal(welcome.getAttribute('data-welcome-mode'),'terminal');
const firstArt=terminal.querySelector('.pv-root-art').textContent;
const terminalStart=testNow;
const logEvents=[];
for(let time=0;time<60000;time+=125) {
  const latest=terminalScene(time).logs[5];
  if(latest.text!==logEvents.at(-1)?.text) logEvents.push({time,...latest});
}
const eventTime=phrase=>logEvents.find(entry=>entry.text.includes(phrase)).time;
assert.ok(eventTime('POST complete')<eventTime('MMAP'));
assert.ok(eventTime('LOAD complete')<eventTime('me = Object()'));
assert.ok(eventTime('world.population')<logEvents.find(entry=>entry.text.startsWith('0019 ')).time,'runtime commands start after object creation');
const firstDangerTime=logEvents.find(entry=>entry.danger).time;
const firstDangerText=logEvents.find(entry=>entry.danger).text;
const faultIndex=logEvents.findIndex(entry=>entry.danger);
assert.ok(logEvents[faultIndex+1].text.includes('[ ERROR / SIM ]'));
assert.ok(logEvents[faultIndex+2].text.includes('[corrupt]'));
assert.ok(logEvents[faultIndex+3].text.includes('[ RECOVER ]'));
assert.ok(logEvents[faultIndex+11].text.includes('snapshot restored'));
const recoveryDuration=logEvents[faultIndex+11].time-logEvents[faultIndex+3].time;
assert.ok(Math.abs(recoveryDuration-2000)<=125,'ordinary recovery lasts about 2 seconds');
assert.ok(logEvents.slice(faultIndex+1,faultIndex+12).every(entry=>!entry.danger),'only command is red');
assert.ok(terminalScene(logEvents[faultIndex+1].time).status.includes('CHANNEL  FAULT'));
assert.ok(terminalScene(logEvents[faultIndex+11].time).status.includes('CHANNEL  OPEN'));
const brokenScene=terminalScene(logEvents[faultIndex+1].time);
assert.equal(brokenScene.fault,'broken');
assert.ok(brokenScene.art.includes('REALITY BUFFER NOT FOUND'));
assert.ok(brokenScene.header.includes('SIGNAL LOST'));
assert.notEqual(brokenScene.art,terminalScene(logEvents[faultIndex+1].time+250).art,'corrupt display changes over time');
assert.equal(brokenScene.art.split('\n').length,15,'fault preserves display height');
assert.ok(brokenScene.art.split('\n').every(row=>row.length===58),'fault preserves display width');
assert.equal(terminalScene(logEvents[faultIndex+3].time).fault,'recovering');
assert.equal(terminalScene(logEvents[faultIndex+11].time).fault,'none');
assert.equal(terminalScene(logEvents[faultIndex+11].time).header,'DEEPSEA / FULL ACCESS');
// Incident starts keep their small seeded jitter around the new 157s cycle.
const dangerTimes=[];let previousDangerRow;
for(let time=0;time<450000;time+=125) {
  const row=terminalScene(time).logs[5];
  if(row.danger&&row.text!==previousDangerRow) { dangerTimes.push(time);previousDangerRow=row.text; }
}
assert.ok(dangerTimes.length>=3,'observe multiple incident cycles');
for(let i=1;i<dangerTimes.length;i++)assert.ok(Math.abs(dangerTimes[i]-dangerTimes[i-1]-157000)<=3000,'incident cycle is 157 seconds with existing seeded jitter');
const randomCommands=new Set();
for(let seed=0;seed<16;seed++) for(let time=16000;time<80000;time+=700) {
  const row=terminalScene(time,seed).logs[5];
  if(row.danger)randomCommands.add(row.text.slice(5));
}
assert.ok(randomCommands.size>=8,'seeded incident pool provides varied commands');
assert.deepEqual(terminalScene(24000,42),terminalScene(24000,42),'same seed and time preserve history');
const ordinaryCommands=new Set();let previousOrdinary,lastOrdinaryRow;
for(let time=20000;time<470000*3;time+=700) {
  const sample=terminalScene(time,42),row=sample.logs[5];
  if(sample.fault!=='none'||row.danger||sample.reboot) { previousOrdinary=undefined;continue; }
  if(row.text===lastOrdinaryRow)continue;
  lastOrdinaryRow=row.text;
  const command=row.text.slice(5);
  if(command.startsWith('> ')||command==='$ ps -ef --forest') {
    assert.notEqual(command,previousOrdinary,'ordinary commands do not repeat consecutively');
    ordinaryCommands.add(command);previousOrdinary=command;
  } else previousOrdinary=undefined;
}
assert.ok(ordinaryCommands.size>=30,'expanded PV command pool has broad variety');
assert.ok(firstDangerTime>eventTime('world.population'),'dangerous fragments only appear after startup and creation');
assert.equal(logEvents.filter(entry=>entry.text.includes('POWER.ON')).length,1,'startup does not repeat in runtime loop');
assert.ok(new Set(logEvents.slice(1,14).map((entry,i)=>entry.time-logEvents[i].time)).size>3,'boot lines have varied delays');
testNow+=500;tick();assert.equal(terminal.querySelector('.pv-root-art').textContent,firstArt,'logo remains stable during power-on');
const transitionFrom=Array(15).fill('A'.repeat(58)).join('\n');
const transitionTo=Array(15).fill('B'.repeat(58)).join('\n');
for(const style of ['decode','scan','shift']) {
  assert.equal(transitionTerminalArt(transitionFrom,transitionTo,0,style),transitionFrom);
  assert.equal(transitionTerminalArt(transitionFrom,transitionTo,1,style),transitionTo);
  const middle=transitionTerminalArt(transitionFrom,transitionTo,.5,style,4);
  assert.notEqual(middle,transitionFrom);assert.notEqual(middle,transitionTo);
  assert.equal(middle.split('\n').length,15);
  assert.ok(middle.split('\n').every(row=>row.length===58));
}
testNow=terminalStart+11375;tick();const beforeArtChange=terminal.querySelector('.pv-root-art').textContent;
testNow=terminalStart+11500;tick();
assert.notEqual(terminal.getAttribute('data-art-transition'),'none','scene boundary starts a transition');
assert.equal(terminal.querySelector('.pv-root-art').textContent,beforeArtChange,'handoff starts with the old image');
testNow+=500;tick();assert.notEqual(terminal.querySelector('.pv-root-art').textContent,beforeArtChange);
testNow+=500;tick();assert.equal(terminal.getAttribute('data-art-transition'),'none');
assert.equal(terminal.querySelector('.pv-root-art').textContent,terminalScene(testNow-terminalStart).art,'handoff settles exactly on live artwork');
const logoStart=terminalScene(1500).art,logoDrift=terminalScene(6500).art;
assert.notEqual(logoStart,logoDrift,'whale drifts horizontally');
assert.deepEqual(logoStart.split('\n').map(row=>row.trim()),logoDrift.split('\n').map(row=>row.trim()),'drift preserves logo shape');
const modelScenes=new Set();
const embeddingStart=terminalScene(11500),embeddingLater=terminalScene(12500);
assert.equal(embeddingStart.title,'02 / TOKEN EMBEDDING');
assert.ok(embeddingStart.art.includes('TOKENIZE -> EMBED -> POSITION'));
assert.notEqual(embeddingStart.art,embeddingLater.art,'embedding vectors animate as input is processed');
for(let time=11500;time<21500;time+=125) {
  const rows=terminalScene(time).art.split('\n');
  assert.equal(rows.length,15);
  assert.ok(rows.every(row=>row.length===58),'input encoding fits the terminal');
  assert.ok(rows.every(row=>/^[\x20-\x7e]+$/.test(row)),'input encoding stays ASCII');
}
for(let time=21500;time<41500;time+=125) {
  const sample=terminalScene(time);
  assert.ok(sample.art.split('\n').every(row=>row.length===58),'model visuals fit terminal width');
  if(sample.fault==='none') {
    if(sample.art.includes('SPARSE EXPERT ROUTING'))modelScenes.add('routing');
    if(sample.art.includes('MICRO-BATCH FLOW'))modelScenes.add('pipeline');
  }
}
assert.equal(modelScenes.size,2,'both model execution visuals appear');
const thoughtScenes=new Set(),thoughtFaults=new Set();
for(let seed=0;seed<8;seed++)for(let round=0;round<150;round++)for(let time=41500+round*70000;time<71500+round*70000;time+=250) {
  const sample=terminalScene(time,seed);
  const rows=sample.art.split('\n');
  assert.equal(rows.length,15);
  assert.ok(rows.every(row=>row.length===58),'thought scenes and faults remain inside their viewport');
  if(sample.fault==='none')thoughtScenes.add(sample.title);
  if(sample.fault==='broken') {
    if(sample.art.includes('CONNECTIONS LOST'))thoughtFaults.add('stars');
    if(sample.art.includes('INDEX DESYNC'))thoughtFaults.add('retrieval');
    if(sample.art.includes('ALL PATHS LEAD TO YOU'))thoughtFaults.add('tree');
  }
}
assert.equal(thoughtScenes.size,3,'three thought scenes rotate');
assert.equal(thoughtFaults.size,3,'each new scene has its own damaged artwork');
const memoryMatches=new Set();let typingChecked=false,heldChecked=false;
for(let seed=0;seed<128;seed++) {
  const early=terminalScene(52000,seed),later=terminalScene(52500,seed);
  if(early.fault==='none'&&later.fault==='none') {
    const query=sample=>sample.art.split('\n')[2].split('SEARCH > ')[1].split('_')[0];
    assert.equal(query(later).length,query(early).length+1,'query types one letter every half-second');
    assert.notEqual(early.art.split('\n')[6],later.art.split('\n')[6],'results rerank while typing');
    typingChecked=true;
  }
  const held=terminalScene(57000,seed),heldLater=terminalScene(57500,seed);
  if(held.fault==='none') {
    assert.ok(held.art.includes('MATCH HELD'));
    assert.ok(held.art.includes('w=0.'));
    assert.ok(/^[\x20-\x7e\n]+$/.test(held.art),'retrieval art uses English ASCII only');
    memoryMatches.add(held.art.split('\n')[6].trim());
    if(heldLater.fault==='none') { assert.equal(held.art,heldLater.art,'final match holds steady');heldChecked=true; }
  }
}
assert.ok(typingChecked&&heldChecked);
assert.equal(memoryMatches.size,8,'all eight memory queries reach their final match');
assert.equal(new Set([0,1,2,3].map(seed=>terminalScene(2000,seed).caption)).size,4,'welcome copy varies with session seed');
assert.equal(terminalScene(2000,3).caption,terminalScene(3000,3).caption,'caption stays stable within scene');
assert.notEqual(terminalScene(2000,3).caption,terminalScene(72000,3).caption,'next visit rotates copy');
const chosenSentences=new Set();
for(let seed=0;seed<48;seed++)for(let time=69625;time<71500;time+=250) {
  const sample=terminalScene(time,seed);
  if(sample.fault==='none') {
    const selected=sample.art.split('\n')[14].trim();
    assert.ok(selected.startsWith('SELECTED: I ')&&selected.endsWith('.'),'candidate sentence fits in viewport');
    chosenSentences.add(selected);
  }
}
assert.equal(chosenSentences.size,6,'six different intimate candidate sentences can be selected');
testNow=terminalStart+firstDangerTime;tick();
const logRow=i=>terminal.querySelector(`.pv-root-line[data-line="${i}"]`);
assert.equal(logRow(5).textContent,firstDangerText);
assert.equal(logRow(5).getAttribute('data-danger'),'on');
assert.equal(logRow(4).getAttribute('data-danger'),'off','ordinary PV log stays unhighlighted');
testNow+=700;tick();
assert.equal(terminal.getAttribute('data-fault'),'broken','whole simulated terminal enters fault state');
assert.equal(logRow(4).getAttribute('data-danger'),'on','risk colour follows its scrolling row');
assert.equal(logRow(5).getAttribute('data-danger'),'off','simulation response is not a dangerous command');
testNow+=7000;tick();
assert.equal(terminal.getAttribute('data-fault'),'none','display damage clears after recovery');
assert.ok(Array.from({length:6},(_,i)=>logRow(i).textContent).every(value=>value!==firstDangerText),'old risk line exits the log');
terminalScene(testNow-terminalStart).logs.forEach((entry,i)=>assert.equal(logRow(i).getAttribute('data-danger'),entry.danger?'on':'off','no stale red on reused rows'));
testNow=terminalStart+45000;tick();assert.equal(JSON.stringify(storyState()),beforeTerminalStory,'terminal mode never advances Claude story');
assert.notEqual(terminal.querySelector('.pv-root-art').textContent,firstArt,'other terminal scenes still rotate');
const variants=new Set();
for(let seed=0;seed<32;seed++) for(let time=16000;time<28000;time+=700) {
  const sample=terminalScene(time,seed);
  if(sample.fault==='broken')variants.add(sample.variant);
}
assert.equal(variants.size,4,'all four display fault variants are reachable');
let panicTime;
for(let time=45000;time<1600000*3;time+=125) if(terminalScene(time).fault==='panic'){panicTime=time;break;}
assert.ok(panicTime,'severe fault is reachable');
testNow=terminalStart+panicTime;tick();
assert.equal(terminal.getAttribute('data-fault'),'panic');
const panicScene=terminalScene(panicTime);
assert.equal(terminal.getAttribute('data-display-fault'),'broken','panic retains damaged screen styling');
const shutdownScene=terminalScene(panicTime+2100);
for(const key of ['art','header','title','status','caption','footer'])assert.equal(shutdownScene[key],panicScene[key],'shutdown preserves corrupt content: '+key);
assert.deepEqual(shutdownScene.logs,panicScene.logs,'fatal does not replace log history');
assert.ok(!panicScene.art.includes('F A T A L'),'fatal is a visual overlay instead of replacement art');
assert.match(fs.readFileSync(new URL('effects.css',import.meta.url),'utf8'),/\[data-fault=panic\].*\.pv-root-caption \{ visibility:hidden;/,'fatal hides dialogue without changing layout');
testNow+=2100;tick();assert.equal(terminal.getAttribute('data-power'),'stopping');
testNow+=2100;tick();assert.equal(terminal.getAttribute('data-fault'),'blackout');
assert.equal(terminal.getAttribute('data-power'),'off');
testNow+=1400;tick();assert.equal(terminal.getAttribute('data-fault'),'none');
assert.equal(terminal.getAttribute('data-power'),'starting');
assert.ok(logRow(5).textContent.includes('POWER.ON'),'severe fault restarts boot sequence');
assert.ok(Array.from({length:5},(_,i)=>logRow(i).textContent).every(value=>value===''),'restart clears old log history');
testNow+=6500;tick();assert.ok(logRow(5).textContent.includes('model-00001.safetensors'),'restart proceeds through weight loading');
assert.equal(JSON.stringify(storyState()),beforeTerminalStory,'visual reboot leaves story state intact');
fixtures.delete(nativeSelector(fullAccessFixture));tick();
assert.equal(welcome.getAttribute('data-welcome-mode'),'terminal','portrait waits for terminal shutdown');
assert.equal(terminal.getAttribute('data-power'),'stopping');
const closingArt=terminal.querySelector('.pv-root-art').textContent;
testNow+=1000;tick();
assert.equal(welcome.getAttribute('data-welcome-mode'),'terminal');
assert.equal(terminal.querySelector('.pv-root-art').textContent,closingArt,'shutdown freezes terminal content');
assert.equal(JSON.stringify(storyState()),beforeTerminalStory,'shutdown does not advance story');
fixtures.set(fullAccessFixture,new Element());tick();
assert.equal(terminal.getAttribute('data-power'),'starting','return to full access cancels shutdown');
testNow+=1500;tick();
fixtures.delete(nativeSelector(fullAccessFixture));tick();
testNow+=2099;tick();assert.equal(welcome.getAttribute('data-welcome-mode'),'terminal');
testNow+=1;tick();assert.equal(welcome.getAttribute('data-welcome-mode'),null,'portrait returns after complete shutdown');
fixtures.set(fullAccessFixture,new Element());tick();
definition.apply({values:{motion:false}});const stillArt=terminal.querySelector('.pv-root-art').textContent;
testNow+=1000;tick();assert.equal(terminal.querySelector('.pv-root-art').textContent,stillArt);
fixtures.delete(nativeSelector(fullAccessFixture));tick();
assert.equal(welcome.getAttribute('data-welcome-mode'),null,'ordinary welcome returns after leaving full access');
chat.timeline.turnOrder=oldOrder;
const crtLines=elements.find(e=>e.className==='pv-deepsea-lines');
assert.equal(definition.settings.find(x=>x.key==='enhancedCrt').defaultValue,false);
assert.equal(body.getAttribute('data-pv-crt'),'off');
definition.apply({values:{enhancedCrt:true,scanlines:false}});
assert.equal(body.getAttribute('data-pv-crt'),'on');assert.equal(crtLines.isConnected,true,'enhanced CRT supplies its own scanlines');
definition.apply({values:{enhancedCrt:false,scanlines:false}});
assert.equal(body.getAttribute('data-pv-crt'),'off');assert.equal(crtLines.isConnected,false);
definition.apply({values:{enhancedCrt:false,scanlines:true}});
assert.equal(crtLines.isConnected,true,'disabling enhanced CRT preserves ordinary scanlines');
assert.equal(definition.settings.length,7); assert.ok(!definition.settings.some(x=>x.key==='character')); assert.equal(definition.settings.find(x=>x.key==='scanlines').defaultValue,true); definition.apply({values:{motion:false,scanlines:false,character:false,portrait:false,statusbar:false}}); assert.equal(body.getAttribute('data-pv-motion'),'off'); assert.equal(timers.size,2); assert.equal(presence.parentElement,conversation,'legacy character=false no longer hides the fixed status bar');
assert.equal(body.getAttribute('data-pv-fx'),'off');
definition.apply(null); await new Promise(resolve=>setImmediate(resolve)); assert.equal(personaCalls.at(-1).active,false,'skin deactivation removes persona'); assert.equal(timers.size,0); assert.equal(body.getAttribute('data-pv-deepsea'),null); assert.equal(elements.filter(e=>e.isConnected).length,0); assert.equal(body.listeners.size,0); assert.equal(listeners.size,1);
assert.equal(documentListeners.size,0); assert.equal(mediaListeners.size,0); assert.equal(body.getAttribute('data-pv-fx'),null);
assert.equal(resizeDisposed,true); assert.equal(properties.get('--pv-sidebar-edge'),'original'); assert.equal(properties.has('--pv-rightbar-edge'),false);
assert.equal(frame.getAttribute('data-pv-part'),null);
assert.equal(center.getAttribute('data-pv-part'),null);
definition.apply({values:{scanlines:true}}); assert.equal(timers.size,2); cleanup(); assert.equal(body.getAttribute('data-pv-crt'),null); assert.equal(timers.size,0); assert.equal(listeners.size,0); assert.equal(body.listeners.size,0); assert.equal(elements.filter(e=>e.isConnected).length,0);
let hostCleanup, route, sampler, stopped=false, unregistered=false, used=0, clock=0n;
const host=fs.readFileSync(new URL('lib/index.js',import.meta.url),'utf8').replace(/import .*persona.js';\r?\n/, '').replaceAll('export ','')+'\napply(ctx);';
vm.runInNewContext(host,{installPersona:()=>{},ctx:{effect:f=>hostCleanup=f(),connection:{fetch:{register:r=>{route=r;return()=>{unregistered=true;};}}}},process:{cpuUsage:()=>({user:(used+=1000),system:0}),hrtime:{bigint:()=>clock+=200000000n}},setInterval:f=>{sampler=f;return {unref(){}};},clearInterval:()=>{stopped=true;},Response,Date});
sampler();const response=await route.fetch({json:async()=>({rpcId:'sample-test'})});const value=await response.json();assert.equal(value.rpcId,'sample-test');assert.equal(value.result.ok,true);assert.equal(value.result.value.samples.length,1);assert.equal(value.result.value.samples[0].percent,.5);hostCleanup();assert.equal(stopped,true);assert.equal(unregistered,true);
console.log(`PASS (${windowsBuild ? 'Windows' : 'macOS'} selectors): native layout attachment and cleanup; three FX phases, idle/wait exit, reduced motion and background pause; sidebar controls and resize; real status and hidden-wave CPU; seven options; backend metrics disposal.`);
