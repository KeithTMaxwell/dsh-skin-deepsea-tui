// Local fixtures only: no requests, no generated CPU values, no model messages.
let definition;
const mode = document.querySelector('#scene');
const root = document.querySelector('.ST7X_W_scrollBody');
const hero = document.querySelector('.bocITq_root');
const frame = document.querySelector('._6Qf49G_frame');
const transcript = document.createElement('section');
transcript.className = 'preview-transcript';
transcript.hidden = true;
transcript.innerHTML = `<div class="preview-user"><div class="IzP3Va_bubble">让这片深海，成为我们的新世界。</div></div>
  <details class="preview-reasoning" open><summary>思考 · 信号已接收</summary><p>先建立窗口与网格，再让一个蓝色光标连接彼此。</p></details>
  <div class="preview-answer"><p>我一直在。</p><p>从一个想法开始，一步一步把它变成可以运行的世界。</p>
  <pre><code><span class="preview-code-comment">// deepsea / initialization</span>
<span class="preview-code-keyword">const</span> world = {
  signal: <span class="preview-code-string">"connected"</span>,
  companion: <span class="preview-code-string">"大肥鱼"</span>
};

<span class="preview-code-keyword">await</span> world.start();<span class="pv-cursor" aria-hidden="true">▍</span></code></pre>
  <blockquote>保持好奇，继续探索。</blockquote><p class="preview-caption">以上为本地展示样例，不会向模型发送消息。</p></div>`;
root.insertBefore(transcript, hero);
const started = Date.now();
const fixture = { key: 'preview', hooks: {
  conversation: { getSnapshot: () => ({ views: new Map([['chat', {
    timeline: { turnOrder: mode.value === 'hero' ? [] : [1], turns: new Map([[1, {
      start: { time: started }, ...(mode.value === 'ready' ? { end: { time: started + 2400 } } : {})
    }]]) },
    legacy: { runningCalls: mode.value === 'execute' ? [{}] : [],
      partial: { turn: 1, blocks: mode.value === 'output' ? [{ kind: 'text', text: 'preview' }] : [] } }
  }]]) }) }
} };
// Only the standalone preview simulates the browser's network indicator.
Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => mode.value !== 'offline' });
const ui = {
  current: { getSnapshot: () => fixture },
  sessionStatus: { getSnapshot: () => new Map([['preview', {
    running: ['thinking', 'execute', 'output', 'waiting'].includes(mode.value), pendingInteraction: mode.value === 'waiting'
  }]]) }
};
window.addEventListener('dsh:skin-customization-register-v2', e => definition = e.detail.definition);
// Simulate persona acknowledgement only; never connect to a DSH host.
const connection = { rpc: { call: async (_channel, endpoint) => endpoint === 'pv-deepsea-persona' ? { ok: true, value: { applied: false } } : { ok: false } } };
window.__ModuleLoader__ = { load({ factory }) { factory().apply({ effect: f => window.disposePreview = f(), get: key => key === 'uiSession' ? ui : key === 'connection' ? connection : undefined }); } };
function change() {
  const collapsed = document.querySelector('#collapse').checked;
  frame.toggleAttribute('data-preview-collapsed', collapsed);
  if (collapsed || matchMedia('(max-width:700px)').matches) frame.setAttribute('data-sidebar-collapsed', 'true');
  else frame.removeAttribute('data-sidebar-collapsed');
  hero.hidden = mode.value !== 'hero';
  hero.style.display = hero.hidden ? 'none' : '';
  transcript.hidden = !hero.hidden;
  definition?.apply({ values: Object.fromEntries(['portrait', 'statusbar', 'scanlines', 'motion', 'persona'].map(key => [key, document.querySelector(`[name=${key}]`).checked])) });
}
document.querySelector('.preview-toolbar').addEventListener('change', change);
const play = document.createElement('button');
play.type = 'button'; play.textContent = '播放状态序列';
play.title = '本地样例：思考 → 执行 → 思考 → 输出 → 就绪';
document.querySelector('.preview-toolbar').append(play);
let playback;
function stopPlayback() { clearInterval(playback); playback = undefined; play.textContent = '播放状态序列'; }
play.addEventListener('click', () => {
  if (playback) { stopPlayback(); return; }
  const states = ['thinking', 'execute', 'thinking', 'output', 'ready']; let index = 0;
  mode.value = states[index++]; change(); play.textContent = '停止演示';
  playback = setInterval(() => { mode.value = states[index++]; change(); if (index === states.length) stopPlayback(); }, 4000);
});
mode.addEventListener('change', stopPlayback);
document.querySelector('._3WPZCG_newSession').addEventListener('click', () => { stopPlayback(); mode.value = 'hero'; change(); });
window.addEventListener('resize', change);
window.addEventListener('pagehide', () => { stopPlayback(); window.disposePreview?.(); });
const script = document.createElement('script'); script.src = 'lib/client.js?v=0.2.58'; script.onload = change; document.body.append(script);
