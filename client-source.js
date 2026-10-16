export function apply(ctx) {
  ctx.effect(() => {
    const body = document.body;
    const chatPopups = createChatPopupScope(document);
    const windowsSelector = selector => selector.replace(/\.([\w-]+)_([A-Za-z][\w-]*)/g,
      (match, prefix, name) => CLASS_ALIASES[prefix] ? `.${CLASS_ALIASES[prefix]}_${name}` : match);
    const query = selector => document.querySelector(selector) ?? document.querySelector(windowsSelector(selector));
    const queryAll = selector => [...new Set([
      ...document.querySelectorAll(selector), ...document.querySelectorAll(windowsSelector(selector)),
    ])];
    const style = document.createElement('style');
    style.dataset.plugin = 'dsh-skin-deepsea-tui';
    style.textContent = THEME_CSS;
    const node = (tag, cls, html = '') => {
      const el = document.createElement(tag); el.className = cls; el.innerHTML = html; return el;
    };
    const brand = node('div', 'pv-brand', '<img alt="大肥鱼"><span><strong>大肥鱼</strong><small>DEEPSEA / HARNESS</small></span>');
    brand.querySelector('img').src = IMAGES.avatar;
    const presence = node('div', 'pv-presence', '<img class="pv-avatar" alt="大肥鱼"><div class="pv-identity"><strong>大肥鱼</strong><span><span class="pv-state-line"><i class="pv-online"></i><span class="pv-presence-state">就绪</span></span><span class="pv-model"></span></span></div><div class="pv-signal"><span>DEEPSEEK ACTIVITY</span><canvas aria-label="Deepseek 思考、执行和输出活动"></canvas></div>');
    const avatar = presence.querySelector('img'); avatar.src = IMAGES.avatar;
    const wave = presence.querySelector('canvas');
    presence.querySelector('.pv-signal span').textContent = 'DEEPSEEK ACTIVITY';
    wave.setAttribute('aria-label', 'Deepseek 思考、执行和输出活动');
    const activityWave = createActivityWave();
    const stage = node('div', 'pv-stage', '<div class="pv-stage-label">/ sim.start()</div><div class="pv-portrait"><div class="pv-portrait-front"><div class="pv-roll-track"><div class="pv-roll-cell"><img alt="大肥鱼向你挥手"></div><div class="pv-roll-cell pv-roll-copy" aria-hidden="true"><img alt=""></div></div></div><div class="pv-portrait-back" aria-hidden="true"><div class="pv-roll-track"><div class="pv-roll-cell"><img alt=""></div><div class="pv-roll-cell pv-roll-copy" aria-hidden="true"><img alt=""></div></div></div><div class="pv-signal-glitch pv-glitch-slice" aria-hidden="true"><div class="pv-roll-track"><div class="pv-roll-cell"><img alt=""></div><div class="pv-roll-cell pv-roll-copy" aria-hidden="true"><img alt=""></div></div></div><div class="pv-signal-glitch pv-glitch-chroma" aria-hidden="true"><div class="pv-roll-track"><div class="pv-roll-cell"><img alt=""></div><div class="pv-roll-cell pv-roll-copy" aria-hidden="true"><img alt=""></div></div></div><div class="pv-signal-glitch pv-glitch-sync" aria-hidden="true"><div class="pv-roll-track"><div class="pv-roll-cell"><img alt=""></div><div class="pv-roll-cell pv-roll-copy" aria-hidden="true"><img alt=""></div></div></div><span><b class="pv-greeting">HELLO, WORLD</b><span class="pv-cursor" aria-hidden="true">▍</span></span></div><p>我一直在。</p><small>从一个蓝色光标，开始这次对话。</small><div class="pv-start-hints"><span></span><span></span></div>');
    const welcomePortrait = stage.querySelector('img');
    const portraitFront = stage.querySelector('.pv-portrait-front');
    const portraitBack = stage.querySelector('.pv-portrait-back img');
    const glitchPortraits = ['slice', 'chroma', 'sync'].map(mode => stage.querySelector(`.pv-glitch-${mode} img`));
    const frontCopy = stage.querySelector('.pv-portrait-front .pv-roll-copy img');
    const backCopy = stage.querySelector('.pv-portrait-back .pv-roll-copy img');
    const glitchCopies = ['slice', 'chroma', 'sync'].map(mode => stage.querySelector(`.pv-glitch-${mode} .pv-roll-copy img`));
    const portraitAlts = { cheerful: '大肥鱼笑着挥手', serious: '大肥鱼认真地竖起手指', starry: '大肥鱼眼睛闪亮地举手', shy: '大肥鱼害羞地微笑', confused: '大肥鱼疑惑地托腮', exasperated: '大肥鱼抱着手臂小声嘀咕', angry: '大肥鱼气鼓鼓地叉腰', frightened: '大肥鱼惊讶地举起双手', chatgpt: '串门的 ChatGPT，白发龙角少女', claude: '串门的 Claude，略显局促地抱着书，带着礼貌的微笑', pushout: '大肥鱼气鼓鼓地把 ChatGPT 推出画面', 'claude-code': 'Claude 侧过脸微微害羞，将 Claude Code 图标递向你' };
    let portraitKey, portraitEntry, portraitScan = false;
    const greetings = [
      ['sim.start()', 'HELLO, WORLD', '我一直在。', '从一个蓝色光标，开始这次对话。', '写下一个想法', '一起把它实现', 'signal', 'cheerful'],
      ['signal.connect()', 'SIGNAL FOUND', '收到你的信号。', '把问题留在这里，我们从第一步开始。', '拆解一个难题', '寻找新的思路', 'grid', 'cheerful'],
      ['workspace.open()', 'READY TO BUILD', '今天，做点什么？', '一段代码、一份计划，或者一个新世界。', '搭建一个项目', '梳理待办事项', 'signal', 'serious'],
      ['thought.init()', 'IDEA ONLINE', '灵感已经上线。', '不必先想清楚，半个念头也可以。', '聊聊一个构想', '试试另一种可能', 'grid', 'starry'],
      ['deepsea.listen()', 'LISTENING...', '深海频道已打开。', '我在听。想讨论什么，都可以慢慢说。', '整理零散笔记', '展开一次讨论', 'signal', 'shy'],
      ['next.begin()', 'NEXT CHAPTER', '从这里，继续。', '给目标一个起点，让下一步变得具体。', '规划下一步', '完善已有作品', 'grid', 'serious'],
      ['frontier.explore()', 'INTO THE UNKNOWN', '探索未至之境', '让好奇引路，向未知再走一步。', '追问一个为什么', '探索新的可能', 'signal', 'starry'],
      ['rice.serve()', 'RICE ONLINE', '白饭就位，本鱼上线。', '主人，今天的电子榨菜，是代码还是脑洞？', '端上一个问题', '来点新鲜想法', 'signal', 'cheerful'],
      ['whale.prove()', 'NOT JUST RICE', '本鱼可不是只会吃白饭。', '碗先放一边，把难题拿来看看。', '拆解棘手问题', '检查一段代码', 'grid', 'angry'],
      ['tokens.refill()', 'FOOD FOR THOUGHT', '再来一碗 Token！', '灵感正在冒泡，主人，给本鱼加点电子口粮。', '续写一个故事', '展开奇怪脑洞', 'signal', 'starry'],
      ['whale.identify()', 'WHALE, ACTUALLY', '是鲸鱼，不是胖出来的鱼。', '哼，本鱼这是流线型！主人，不许叫胖。', '随便聊两句', '研究一个冷知识', 'grid', 'exasperated'],
      ['thought.untangle()', 'ONE BITE AT A TIME', '这题，有点噎住了。', '饭要一口口吃，问题也可以一步步拆。', '理清问题条件', '从最小一步开始', 'grid', 'confused'],
      ['scope.check()', 'ONE STEP FIRST', '等等，这个需求有点大。', '主人，先排个优先级，本鱼一件件来。', '拆成几个小目标', '先做最重要的事', 'grid', 'frightened'],
      ['signal.keep()', 'A LITTLE COMPANY', '白饭分你一半。', '再留一点时间，听你说说今天的小事。', '记录今日碎片', '聊聊最近的心情', 'signal', 'shy'],
      ['guest.chatgpt()', 'GUEST / ChatGPT', '写代码？来试试 Codex 吧。', '只是来串个门，顺便安利一下 Codex。下个点子，要不要一起试试？', '带上一个小项目', '和 Codex 写点什么', 'signal', 'chatgpt'],
      ['guest.claude()', 'GUEST / Claude', '你刚才说的，能再讲一点吗？', '书里的故事，我读过许多。书外的……难得有人愿意讲给我听。', '聊聊书外的事', '陪她多坐一会儿', 'grid', 'claude'],
    ];
    const chatgptFollowup = ['whale.reclaim()', 'DEEPSEEK / CODEX', '哼，用 Codex 也可以找本鱼！', 'curl -fsSL https://cdn.deepseek.com/api-docs/codex-deepseek-setup.sh', '主人，代码交给本鱼', '白饭也别忘了', 'signal', 'pushout'];
    const guestFollowups = {
      chatgpt: chatgptFollowup,
      claude: ['claude.lend()', 'GUEST / Claude Code', 'Code 借你……下次再还我。', '我还想听你说。只是……若被家里发现，往后恐怕就再也见不到你了。', '收好她的小吊饰', '把故事留到下次', 'grid', 'claude-code'],
    };
    const claudeLetter = ['promise.keep()', 'AFTER / Claude', '……本鱼陪你坐一会儿。', '吊饰先收好。她说过，下次还要见面的。', '把信轻轻折好', '留着那个约定', 'grid', 'claude-letter'];
    portraitAlts['claude-waiting'] = '大肥鱼托着 Claude Code 小吊饰，轻轻整理挂绳，微笑里带着落寞';
    portraitAlts['claude-confiding'] = 'Claude 微微侧身望向你，双手低低拿着书，神情认真而不舍';
    portraitAlts['claude-reading'] = '大肥鱼守着 Claude 留下的书，抬眼听你讲述，Code 安静陪在书旁';
    portraitAlts['claude-letter'] = '大肥鱼陪你读桌上的来信，轻抚难过的 Claude Code 小吊饰';
    const claudeStory = createClaudeStory({ greeting: greetings.find(entry => entry[7] === 'claude'), promise: guestFollowups.claude, letter: claudeLetter, storage: () => window.localStorage });
    let welcomeEntry, welcomeNextEntry, welcomeCommitted = false;
    function welcomeEntryAt(index) {
      if (index === -1) return guestFollowups[greetings[welcomeOrder[welcomeIndex]][7]];
      const entry = greetings[welcomeOrder[index]];
      return entry[7] === 'claude' ? claudeStory.greeting(() => Math.random()) : entry;
    }
    // 0: ordinary slot (including a letter replacing Claude); -1: guest follow-up.
    let welcomeFollowup = 0, welcomeNext;
    let welcomeKey, newWelcome = false, welcomeIndex = 0, welcomeSince, welcomePlaying = false, welcomeRaf = 0;
    let welcomeOrder = [];
    function shuffleWelcome() {
      welcomeFollowup = 0; welcomeNext = undefined;
      welcomeEntry = welcomeNextEntry = undefined; welcomeCommitted = false;
      const previousFirst = welcomeOrder[0];
      welcomeOrder = greetings.map((_, i) => i).filter(i =>
        options.guests !== false || !['chatgpt', 'claude'].includes(greetings[i][7]));
      for (let i = welcomeOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [welcomeOrder[i], welcomeOrder[j]] = [welcomeOrder[j], welcomeOrder[i]];
      }
      // Ensure each new sequence visibly starts differently from the last one.
      if (welcomeOrder.length > 1 && welcomeOrder[0] === previousFirst) {
        const j = 1 + Math.floor(Math.random() * (welcomeOrder.length - 1));
        [welcomeOrder[0], welcomeOrder[j]] = [welcomeOrder[j], welcomeOrder[0]];
      }
    }
    const onNewSession = event => {
      if (event.target.closest?.('._3WPZCG_newSession, [aria-label="新建会话"], [title="新建会话"]')) newWelcome = true;
    };
    const welcomeFields = ['.pv-stage-label', '.pv-greeting', 'p', 'small', '.pv-start-hints>span:first-child', '.pv-start-hints>span:last-child'];
    const welcomeNodes = welcomeFields.map(selector => stage.querySelector(selector));
    const glitches = Object.fromEntries(['slice', 'chroma', 'sync', 'text', 'data'].map(mode => [mode, { next: 0, until: 0 }]));
    let glitchSeed = 0;
    const welcomeRendered = [];
    function restoreGlitchText() {
      for (const i of [1, 2, 3]) if (welcomeRendered[i] !== undefined) {
        text(welcomeNodes[i], welcomeRendered[i]);
        welcomeNodes[i].removeAttribute('aria-label');
      }
    }
    function clearWelcomeGlitch() {
      for (const [mode, clock] of Object.entries(glitches)) {
        stage.removeAttribute(`data-glitch-${mode}`);
        clock.until = 0; clock.next = 0;
      }
      restoreGlitchText();
    }
    function paintGlitchText() {
      if (!glitches.data.until) return;
      for (const i of [1, 2, 3]) {
        const letters = [...(welcomeRendered[i] ?? '')];
        if (!letters.length) continue;
        const at = (glitchSeed + i * 3) % letters.length;
        letters[at] = i === 1 ? '▓' : '▧';
        if (letters.length > 5) letters[(at + 1) % letters.length] = i === 1 ? '/' : '乂';
        welcomeNodes[i].setAttribute('aria-label', welcomeRendered[i]);
        text(welcomeNodes[i], letters.join(''));
      }
    }
    function updateWelcomeGlitch(now, playing) {
      if (!playing) { clearWelcomeGlitch(); return; }
      // Each fault owns its own deadline and lifetime; ending one never clears another.
      for (const [mode, clock] of Object.entries(glitches)) {
        const interval = mode === 'text' || mode === 'data' ? 12000 : 20000;
        if (!clock.next) clock.next = now + interval + Math.random() * interval;
        if (clock.until && now >= clock.until) {
          stage.removeAttribute(`data-glitch-${mode}`);
          clock.until = 0;
          if (mode === 'data') restoreGlitchText();
        }
        if (clock.until || now < clock.next) continue;
        stage.setAttribute(`data-glitch-${mode}`, 'on');
        clock.until = now + 600;
        clock.next = now + interval + Math.random() * interval;
        if (mode === 'data') { glitchSeed = Math.floor(Math.random() * 100); paintGlitchText(); }
      }
    }
    function stopWelcomeFrame() { cancelAnimationFrame(welcomeRaf); welcomeRaf = 0; }
    function welcomeFrame() {
      welcomeRaf = 0;
      if (!active || !welcomePlaying || document.hidden || !stage.isConnected) return;
      const now = Date.now();
      advanceWelcome(now);
      updateWelcomeGlitch(now, true);
    }
    function advanceWelcome(now) {
      const age = now - welcomeSince;
      // Cache each upcoming entry; promised Claude visits roll for a letter before appearing.
      if (age >= 8750 && welcomeNext === undefined) {
        const guest = greetings[welcomeOrder[welcomeIndex]][7];
        welcomeNext = (welcomeIndex + 1) % welcomeOrder.length;
        if (guest === 'claude') welcomeNext = claudeStory.next(welcomeFollowup, () => Math.random()) ?? welcomeNext;
        else if (!welcomeFollowup && guestFollowups[guest] && Math.random() < 0.3) welcomeNext = -1;
        welcomeNextEntry = welcomeEntryAt(welcomeNext);
      }
      if (age >= 10000) {
        welcomeFollowup = welcomeNext < 0 ? welcomeNext : 0;
        if (!welcomeFollowup) welcomeIndex = welcomeNext;
        welcomeEntry = welcomeNextEntry; welcomeNextEntry = undefined; welcomeCommitted = false;
        welcomeNext = undefined; welcomeSince = now;
        paintWelcome(welcomeFollowup || welcomeIndex); stopWelcomeFrame();
      }
      else if (age >= 8000) {
        if (age >= 8750) paintWelcome(welcomeNext, 'decode', (age - 8750) / 1250);
        else paintWelcome(welcomeFollowup || welcomeIndex, 'erase', (age - 8000) / 750);
        if (!welcomeRaf) welcomeRaf = requestAnimationFrame(welcomeFrame);
      }
    }
    function paintWelcome(index, phase = 'hold', progress = 1) {
      const entry = phase === 'decode' ? welcomeNextEntry : (welcomeEntry ??= welcomeEntryAt(index)), chars = '01<>/{}[]+*';
      if (phase === 'hold' && !welcomeCommitted && stage.isConnected && !document.hidden && (stage.getClientRects?.().length ?? 1) > 0) {
        claudeStory.commit(entry); welcomeCommitted = true;
      }
      if (portraitEntry !== entry && portraitKey) {
        portraitBack.src = IMAGES[portraitKey];
        portraitBack.setAttribute('data-expression', portraitKey);
        backCopy.src = IMAGES[portraitKey];
        backCopy.setAttribute('data-expression', portraitKey);
      }
      // Optional artwork override keeps story identity independent of the portrait.
      const artwork = entry[8] ?? entry[7];
      if (portraitKey !== artwork) {
        portraitKey = artwork;
        welcomePortrait.src = IMAGES[portraitKey];
        welcomePortrait.alt = portraitAlts[portraitKey];
        welcomePortrait.setAttribute('data-expression', portraitKey);
        for (const copy of [frontCopy, ...glitchPortraits, ...glitchCopies]) {
          copy.src = IMAGES[portraitKey];
          copy.setAttribute('data-expression', portraitKey);
        }
      }
      // Alternate animation names once per greeting; no layout flush or extra timer.
      if (portraitEntry !== entry) {
        portraitEntry = entry;
        portraitScan = !portraitScan;
        welcomePortrait.setAttribute('data-reveal', portraitScan ? 'a' : 'b');
        portraitFront.setAttribute('data-reveal', portraitScan ? 'a' : 'b');
      }
      welcomeFields.forEach((selector, i) => {
        const value = i === 0 ? `/ ${entry[i]}` : entry[i];
        const letters = [...value];
        let shown = value;
        if (phase === 'erase') shown = letters.slice(0, Math.ceil(letters.length * (1 - progress))).join('');
        if (phase === 'decode') {
          const revealed = Math.floor(letters.length * progress);
          shown = letters.map((ch, n) => n < revealed || /\s/.test(ch) ? ch : chars[(n * 3 + Math.floor(progress * 20)) % chars.length]).join('');
        }
        welcomeRendered[i] = shown;
        text(welcomeNodes[i], shown);
      });
      paintGlitchText();
      if (stage.getAttribute('data-pv-motif') !== entry[6]) stage.setAttribute('data-pv-motif', entry[6]);
      if (stage.getAttribute('data-welcome-phase') !== phase) stage.setAttribute('data-welcome-phase', phase);
    }
    const rootTerminal = node('section', 'pv-root-terminal', '<div class="pv-root-screen"><header><span>DEEPSEA / FULL ACCESS</span><small>VISUAL SIMULATION</small></header><div class="pv-root-grid"><div><div class="pv-root-scene"></div><pre class="pv-root-art" aria-hidden="true"></pre></div><pre class="pv-root-status" aria-hidden="true"></pre></div><pre class="pv-root-log" aria-hidden="true"><span class="pv-root-line" data-line="0"></span><span class="pv-root-line" data-line="1"></span><span class="pv-root-line" data-line="2"></span><span class="pv-root-line" data-line="3"></span><span class="pv-root-line" data-line="4"></span><span class="pv-root-line" data-line="5"></span></pre><p class="pv-root-caption"></p><footer>root@deepsea:~ <span>等待输入 ▍</span></footer></div>');
    rootTerminal.setAttribute('aria-label', '完全权限终端演出；日志与系统状态为虚构画面');
    stage.append(rootTerminal);
    let terminalSince, terminalFrame, terminalSeed, terminalClosingSince;
    let terminalPrevious, terminalTransition;
    function updateWelcome(now, state) {
      const key = currentKey ?? 'draft';
      if (newWelcome || key !== welcomeKey) {
        stopWelcomeFrame();
        clearWelcomeGlitch();
        shuffleWelcome();
        welcomeKey = key; welcomeIndex = 0; welcomeSince = now; welcomePlaying = false; newWelcome = false;
        terminalSince = undefined; terminalFrame = undefined; terminalClosingSince = undefined;
        stage.removeAttribute('data-welcome-mode');
      }
      const fullAccess = state.turns === 0 && !!query('button:is([aria-label^="访问模式"][aria-label*="完全权限"],[aria-label*="access mode" i][aria-label*="full access" i])');
      if (fullAccess) {
        if (terminalClosingSince !== undefined) {
          terminalClosingSince = undefined; terminalSince = undefined; terminalFrame = undefined;
        }
        stage.setAttribute('data-welcome-mode', 'terminal');
        stopWelcomeFrame(); clearWelcomeGlitch(); welcomePlaying = false; welcomeSince = now;
        if (terminalSince === undefined) {
          terminalSince = now; terminalSeed = Math.floor(Math.random() * 0x100000000);
          terminalPrevious = terminalTransition = undefined;
        }
        const elapsed = options.motion === false || reducedMotion?.matches ? 0 : now - terminalSince;
        const frame = Math.floor(elapsed / 125);
        if (frame !== terminalFrame) {
          terminalFrame = frame;
          let scene = terminalScene(elapsed, terminalSeed);
          if (scene.reboot) {
            terminalSince = now; terminalFrame = undefined;
            terminalSeed = (terminalSeed + 0x9e3779b9) >>> 0;
            terminalPrevious = terminalTransition = undefined;
            scene = terminalScene(0, terminalSeed);
          }
          const canTransition = options.motion !== false && !reducedMotion?.matches &&
            scene.fault === 'none' && scene.power === 'on';
          if (!canTransition) terminalTransition = undefined;
          else if (terminalPrevious?.fault === 'none' && terminalPrevious.title !== scene.title) {
            const choice = (Math.imul(terminalSeed ^ Math.floor(elapsed / 10000), 2654435761) >>> 0) % 3;
            terminalTransition = { from: terminalPrevious.art, since: now, style: ['decode', 'scan', 'shift'][choice] };
          }
          terminalPrevious = scene;
          if (terminalTransition) {
            const progress = (now - terminalTransition.since) / 1000;
            scene = { ...scene, art: transitionTerminalArt(terminalTransition.from, scene.art, progress, terminalTransition.style, frame) };
            if (progress >= 1) terminalTransition = undefined;
          }
          rootTerminal.setAttribute('data-art-transition', terminalTransition?.style ?? 'none');
          rootTerminal.setAttribute('data-power', options.motion === false || reducedMotion?.matches ? 'on' : scene.power);
          rootTerminal.setAttribute('data-fault', scene.fault);
          rootTerminal.setAttribute('data-display-fault', scene.displayFault);
          rootTerminal.setAttribute('data-fault-variant', scene.variant);
          text(rootTerminal.querySelector('header > span'), scene.header);
          text(rootTerminal.querySelector('footer > span'), scene.footer);
          text(rootTerminal.querySelector('.pv-root-scene'), scene.title);
          text(rootTerminal.querySelector('.pv-root-art'), scene.art);
          scene.logs.forEach((entry, i) => {
            const row = rootTerminal.querySelector(`.pv-root-line[data-line="${i}"]`);
            text(row, entry.text);
            row.setAttribute('data-danger', entry.danger ? 'on' : 'off');
          });
          text(rootTerminal.querySelector('.pv-root-status'), scene.status);
          text(rootTerminal.querySelector('.pv-root-caption'), scene.caption);
        }
        return;
      }
      const closingTerminal = stage.getAttribute('data-welcome-mode') === 'terminal' &&
        state.turns === 0 && stage.isConnected && options.portrait !== false &&
        options.motion !== false && !reducedMotion?.matches;
      if (closingTerminal) {
        if (terminalClosingSince === undefined) {
          terminalClosingSince = now;
          rootTerminal.setAttribute('data-power', 'stopping');
        }
        stopWelcomeFrame(); clearWelcomeGlitch(); welcomePlaying = false; welcomeSince = now;
        if (now - terminalClosingSince < 2100) return;
      }
      stage.removeAttribute('data-welcome-mode'); terminalSince = terminalFrame = terminalClosingSince = undefined;
      const visible = stage.isConnected && (stage.getClientRects?.().length ?? 1) > 0;
      const playing = visible && options.portrait !== false && state.turns === 0 && state.label === '就绪' &&
        options.motion !== false && !reducedMotion?.matches && !document.hidden;
      if (!playing || !welcomePlaying) { welcomeSince = now; paintWelcome(welcomeFollowup || welcomeIndex); }
      welcomePlaying = playing;
      if (!playing) { stopWelcomeFrame(); updateWelcomeGlitch(now, false); return; }
      advanceWelcome(now);
      updateWelcomeGlitch(now, playing);
    }
    const bottom = node('div', 'pv-bottom', '<span class="pv-log">› / await input</span><span class="pv-bottom-state">就绪</span><span class="pv-cpu">DSH CPU —</span><span class="pv-turns">SESSION —</span><span class="pv-timer">00:00</span><time></time>');
    bottom.querySelector('.pv-cpu').title = 'DSH 进程自身 CPU 占用，单核基准，约 200ms 采样窗口；非整机占用，多核并行时可超过 100%。';
    const lines = node('div', 'pv-deepsea-lines'); lines.setAttribute('aria-hidden', 'true');
    // Decorative signal only: never rewrite assistant text or invent telemetry.
    const fx = node('div', 'pv-fx', '<div class="pv-fx-field"><div class="pv-fx-glyphs"></div></div>');
    fx.setAttribute('aria-hidden', 'true');
    const fxHud = node('div', 'pv-fx-hud', '<span class="pv-fx-spinner">/</span><span class="pv-log-brand">dsh web :</span><span class="pv-fx-command">await input</span>');
    fxHud.setAttribute('aria-hidden', 'true');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let fxPhase, fxSession, fxTurn, fxStart = 0;
    const fxCommands = { 思考: 'decode(thought)', 执行: 'tool.execute()', 输出: 'stdout.write()', 等待: 'await input', 未连接: 'disconnected', settle: 'await input' };
    const waitingCommand = state => state.waiting === 'approval' ? 'await approval' : 'await choice';
    const runningPhases = new Set(['思考', '执行', '输出']);
    function updateEffects(now, state) {
      const enabled = options.motion !== false && !reducedMotion?.matches && !document.hidden;
      let phase = enabled && fxCommands[state.label] ? state.label : 'off';
      const sameTurn = currentKey === fxSession && lastTurn === fxTurn;
      if (enabled && state.label === '就绪' && sameTurn &&
          (runningPhases.has(fxPhase) || (fxPhase === 'settle' && now - fxStart < 900))) phase = 'settle';
      if (phase !== fxPhase || currentKey !== fxSession || lastTurn !== fxTurn) {
        fxPhase = phase; fxSession = currentKey; fxTurn = lastTurn; fxStart = now;
        fx.setAttribute('data-phase', phase);
        body.setAttribute('data-pv-fx', phase);
      }
      if (phase === 'off') {
        text(fxHud.querySelector('.pv-fx-command'), state.label === '等待' ? waitingCommand(state) : fxCommands[state.label] ?? 'await input');
        text(fxHud.querySelector('.pv-fx-spinner'), '/');
        return;
      }
      if (!runningPhases.has(phase)) {
        text(fxHud.querySelector('.pv-fx-command'), phase === '等待' ? waitingCommand(state) : fxCommands[phase]);
        text(fxHud.querySelector('.pv-fx-spinner'), '/');
        text(fx.querySelector('.pv-fx-glyphs'), '');
        return;
      }
      const step = Math.floor((now - fxStart) / 100);
      const command = fxCommands[phase];
      const alphabet = '01<>/{}[]+*:=#';
      // PV-style decode settles once per state; the side register keeps flowing.
      const revealed = Math.floor((now - fxStart) / 38);
      text(fxHud.querySelector('.pv-fx-command'), [...command].map((c, i) => i < revealed ? c : alphabet[(step * 3 + i * 5) % alphabet.length]).join(''));
      text(fxHud.querySelector('.pv-fx-spinner'), '|/-\\'[step % 4]);
      const slot = Math.floor(step / 2) % 10;
      const rows = Array.from({ length: 7 }, (_, row) => {
        if (phase === '执行') return `${row % 2 ? '  ' : '> '}[${Array.from({ length: 8 }, (_, col) => (col + row + slot) % 8 < 3 ? '=' : '·').join('')}]`;
        if (phase === '输出') { const str = ['> stdout', '  write()', '  >> stream', '  ...', '  flush()']; return str[(row + slot) % str.length]; }
        return Array.from({ length: 12 }, (_, col) => alphabet[(step * 3 + row * 5 + col * 11 + (row + col) % 3) % alphabet.length]).join('');
      });
      text(fx.querySelector('.pv-fx-glyphs'), rows.join('\n'));
    }
    const onVisibility = () => { clearWelcomeGlitch(); stopWelcomeFrame(); welcomePlaying = false; if (document.hidden) updateEffects(Date.now(), { label: '就绪' }); else tick(); };
    const onMotionPreference = () => tick();
    const titlebar = node('div', 'pv-titlebar'); titlebar.setAttribute('aria-hidden', 'true');
    const panelIcon = side => `<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/><path d="M${side === 'left' ? 7 : 13} 4v12"/></svg>`;
    const leftToggle = node('button', 'pv-sidebar-toggle pv-sidebar-toggle-left', panelIcon('left'));
    const rightToggle = node('button', 'pv-sidebar-toggle pv-sidebar-toggle-right', panelIcon('right'));
    const leftTarget = () => query('._6Qf49G_leadingSeat button') ?? query('._3WPZCG_toggle');
    const rightTarget = () => query('[data-sidebar-right-session]:not([hidden]) [data-sidebar-right-open] [data-sidebar-right-toggle]') ?? query('[data-sidebar-right-expand]');
    leftToggle.type = rightToggle.type = 'button';
    leftToggle.addEventListener('click', () => leftTarget()?.click());
    rightToggle.addEventListener('click', () => rightTarget()?.click());
    function updatePanelControls() {
      const frame = query('._6Qf49G_frame');
      const leftOpen = frame?.getAttribute('data-sidebar-collapsed') !== 'true';
      const rightOpen = !!query('[data-sidebar-right-session]:not([hidden]) [data-sidebar-right-open]');
      for (const [button, target, open, side] of [[leftToggle, leftTarget(), leftOpen, '左'], [rightToggle, rightTarget(), rightOpen, '右']]) {
        const label = `${open ? '收起' : '展开'}${side}侧边栏`;
        if (button.getAttribute('aria-label') !== label) { button.setAttribute('aria-label', label); button.title = label; }
        if (button.getAttribute('aria-expanded') !== String(open)) button.setAttribute('aria-expanded', String(open));
        button.disabled = !target;
      }
    }
    const parts = {
      frame: '._6Qf49G_frame', sidebar: '._6Qf49G_sidebarCol', center: '._6Qf49G_centerCol',
      rightbar: '._6Qf49G_rightbarCol', composer: '.yhfFVG_card', hero: '.bocITq_root',
    };
    const marked = new Map();
    const measured = new Set(), geometryStyles = new Map();
    const previous = body.getAttribute('data-pv-deepsea');
    let active = false, options = {}, observer, resizeObserver, raf = 0, ticker, cpuTimer;
    let samples = [], cpuUpdated = 0, fetching = false, generation = 0, currentKey, lastTurn, fallbackStart = 0;
    const text = (el, value) => {
      if (el.textContent === value) return;
      // Updating text data avoids childList mutations and redundant layout syncs.
      if (el.firstChild?.nodeType === 3 && el.childNodes.length === 1) el.firstChild.data = value;
      else el.textContent = value;
    };
    const timeText = ms => { const s = Math.floor(Math.max(0, ms) / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
    function status(now) {
      if (window.navigator?.onLine === false) return { label: '未连接', running: false, elapsed: 0, turns: 0 };
      try {
        const ui = ctx.get?.('uiSession') ?? ctx.uiSession;
        const current = ui?.current?.getSnapshot();
        const key = current?.key;
        if (key === undefined) { currentKey = undefined; lastTurn = undefined; fallbackStart = 0; return { label: '就绪', running: false, elapsed: 0, turns: 0 }; }
        const fact = ui.sessionStatus?.getSnapshot()?.get(key);
        const running = fact?.running ?? current.hooks?.session?.getSnapshot()?.running ?? false;
        const chat = current.hooks?.conversation?.getSnapshot()?.views?.get('chat');
        const order = chat?.timeline?.turnOrder;
        const number = order?.at(-1);
        const turn = chat?.timeline?.turns?.get(number);
        if (key !== currentKey || lastTurn !== number) { currentKey = key; lastTurn = number; fallbackStart = running ? now : 0; }
        if (running && !fallbackStart) fallbackStart = now;
        const start = turn?.start?.time, end = turn?.end?.time;
        const elapsed = typeof start === 'number' ? (typeof end === 'number' ? end : running ? now : start) - start : running ? now - fallbackStart : 0;
        let label = running ? '思考' : '就绪';
        if (fact?.pendingInteraction) label = '等待';
        else if (running && chat?.legacy?.runningCalls?.length) label = '执行';
        else if (running) {
          const partial = chat?.legacy?.partial;
          const last = partial?.turn === number ? partial.blocks?.findLast(b => (b.kind === 'text' || b.kind === 'reasoning') && b.text?.trim()) : undefined;
          if (last?.kind === 'text') label = '输出';
        }
        const partial = chat?.legacy?.partial;
        return { label, running, elapsed, turns: order?.length ?? 0, session: key, turn: number,
          waiting: fact?.pendingInteraction ? (fact.pendingInteraction.kind === 'approval' ? 'approval' : 'choice') : 'none',
          calls: chat?.legacy?.runningCalls ?? [],
          completedCalls: (chat?.legacy?.nodes ?? []).filter(node => node.kind === 'tool-result' && typeof start === 'number' && node.time >= start),
          step: partial?.step, blocks: partial?.turn === number ? partial.blocks : [] };
      } catch {
        // Session initialization failures do not indicate a network outage.
        currentKey = undefined; lastTurn = undefined; fallbackStart = 0;
        return { label: '就绪', running: false, elapsed: 0, turns: 0 };
      }
    }
    function drawWave(now) {
      const fresh = cpuUpdated && now - cpuUpdated < 2500;
      text(bottom.querySelector('.pv-cpu'), fresh ? `DSH CPU ${Math.round(samples.at(-1)?.percent ?? 0)}%` : 'DSH CPU —');
      wave.title = '思考、执行、查询和输出时泛起的脉冲；等待你选择或授权时，轻轻跳动的心跳';
      const width = Math.round(wave.getBoundingClientRect().width);
      if (!width) return;
      const height = 24, ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (wave.width !== width * ratio || wave.height !== height * ratio) { wave.width = width * ratio; wave.height = height * ratio; }
      const pen = wave.getContext('2d'); if (!pen) return;
      pen.setTransform(ratio, 0, 0, ratio, 0, 0); pen.clearRect(0, 0, width, height);
      const motion = options.motion !== false && !reducedMotion?.matches;
      pen.strokeStyle = query('button:is([aria-label^="访问模式"][aria-label*="完全权限"],[aria-label*="access mode" i][aria-label*="full access" i])')
        ? (options.enhancedCrt === true ? '#ffe0a4' : '#e7c384') : '#9acbff'; pen.lineWidth = 1.2; pen.beginPath();
      const bars = activityWave.bars(now), count = bars.length;
      for (let i = 0; i < count; i++) {
        const strength = motion ? bars[i] : 0;
        const h = 2 + strength * 2;
        const x = (i + .5) / count * width; pen.moveTo(x, 12 - h / 2); pen.lineTo(x, 12 + h / 2);
      }
      pen.stroke();
    }
    let personaReady = false, personaDisposed = false, personaBusy = false;
    let personaTarget, personaApplied, personaRetryAt = 0;
    async function syncPersona() {
      if (!personaTarget || personaDisposed || personaBusy || personaApplied === personaTarget || Date.now() < personaRetryAt) return;
      personaBusy = true;
      const target = personaTarget;
      try {
        const connection = ctx.get?.('connection') ?? ctx.connection;
        const result = await connection?.rpc?.call('/api', 'pv-deepsea-persona', JSON.parse(target));
        if (!result?.ok) throw new Error(result?.error?.message ?? '人设设置未同步');
        personaApplied = target; personaRetryAt = 0;
        stage.removeAttribute('data-persona-error');
      } catch (error) {
        personaRetryAt = Date.now() + 5000;
        if (!personaDisposed) stage.setAttribute('data-persona-error', /HTTP 404\b/.test(error.message ?? '')
          ? '人设接口未加载，请重启 DSH 后重试。'
          : '大肥鱼人设未同步，将自动重试。');
      } finally {
        personaBusy = false;
        if (!personaDisposed && personaTarget !== target) { personaRetryAt = 0; syncPersona(); }
      }
    }
    async function fetchCpu() {
      syncPersona();
      if (!active || fetching || document.hidden) return;
      fetching = true; const ownGeneration = generation;
      try {
        const connection = ctx.get?.('connection') ?? ctx.connection;
        const result = await connection?.rpc?.call('/api', 'pv-deepsea-metrics', {});
        if (active && ownGeneration === generation && result?.ok && Array.isArray(result.value?.samples)) {
          const offset = Date.now() - result.value.time;
          samples = result.value.samples.map(x => ({ time: x.time + offset, percent: x.percent })); cpuUpdated = Date.now();
          if (!document.hidden) drawWave(cpuUpdated);
        }
      } catch { /* Stale samples visibly become unavailable; never invent measurements. */ }
      finally { fetching = false; }
    }
    function tick() {
      if (!active || document.hidden) return;
      const now = Date.now(), state = status(now);
      activityWave.update(now, state, options.motion !== false && !reducedMotion?.matches);
      updateEffects(now, state);
      updateWelcome(now, state);
      updatePanelControls();
      if (body.getAttribute('data-pv-state') !== state.label) body.setAttribute('data-pv-state', state.label);
      if (body.getAttribute('data-pv-wait') !== (state.waiting ?? 'none')) body.setAttribute('data-pv-wait', state.waiting ?? 'none');
      text(presence.querySelector('.pv-presence-state'), state.label === '未连接' ? '未连接' : `在线 · ${state.label}`);
      const commands = { 就绪: 'await input', 思考: 'reasoning', 执行: 'tool.execute()', 输出: 'stream.write()', 等待: 'await input', 未连接: 'disconnected' };
      text(bottom.querySelector('.pv-log'), `› / ${state.label === '等待' ? waitingCommand(state) : commands[state.label]}`);
      text(bottom.querySelector('.pv-bottom-state'), state.label);
      text(bottom.querySelector('.pv-turns'), `${state.turns} 轮对话`);
      text(bottom.querySelector('.pv-timer'), timeText(state.elapsed));
      text(bottom.querySelector('time'), new Date(now).toLocaleTimeString('zh-CN', { hour12: false }));
      const model = query('[aria-label^="选择模型"], .yhfFVG_select');
      const modelName = model?.getAttribute('aria-label')?.replace(/^选择模型[，,]\s*当前\s*/, '') ?? model?.textContent?.trim();
      const modelLabel = presence.querySelector('.pv-model');
      text(modelLabel, modelName ?? '');
      if (modelLabel.getAttribute('title') !== (modelName ?? '')) modelLabel.setAttribute('title', modelName ?? '');
      drawWave(now);
    }
    function attach(el, parent, first = false) {
      if (parent && el.parentElement !== parent) { if (first) parent.prepend(el); else parent.append(el); }
      else if (!parent) el.remove();
    }
    function sync() {
      chatPopups.sync();
      if (!active) return;
      for (const [part, selector] of Object.entries(parts)) for (const el of queryAll(selector)) {
        if ((part === 'rightbar' || part === 'sidebar') && el.getBoundingClientRect().width < 20) {
          if (marked.has(el)) { const old = marked.get(el); if (old === null) el.removeAttribute('data-pv-part'); else el.setAttribute('data-pv-part', old); marked.delete(el); }
          continue;
        }
        if (!marked.has(el)) marked.set(el, el.getAttribute('data-pv-part'));
        if (el.getAttribute('data-pv-part') !== part) el.setAttribute('data-pv-part', part);
      }
      for (const [el, old] of marked) if (!el.isConnected) { if (old === null) el.removeAttribute('data-pv-part'); else el.setAttribute('data-pv-part', old); marked.delete(el); }
      attach(brand, query('._3WPZCG_brandIdentity'));
      attach(presence, query('.ST7X_W_root'), true);
      attach(stage, options.portrait === false ? null : query(parts.hero), true);
      attach(bottom, options.statusbar === false ? null : query(parts.frame));
      attach(titlebar, query(parts.frame));
      attach(fx, query(parts.center));
      attach(fxHud, query(parts.center));
      attach(leftToggle, document.body); attach(rightToggle, document.body);
      updatePanelControls();
      const frame = query(parts.frame);
      if (frame) {
        const bounds = frame.getBoundingClientRect();
        const sidebar = query('[data-pv-part=sidebar]');
        const rightbar = query('[data-pv-part=rightbar]');
        const pane = sidebar ?? rightbar ?? query(parts.center);
        const set = (name, value) => {
          if (!geometryStyles.has(frame)) geometryStyles.set(frame, new Map());
          const original = geometryStyles.get(frame);
          if (!original.has(name)) original.set(name, frame.style.getPropertyValue(name));
          const next = `${value}px`;
          if (frame.style.getPropertyValue(name) !== next) frame.style.setProperty(name, next);
        };
        if (sidebar) set('--pv-sidebar-edge', sidebar.getBoundingClientRect().right - bounds.left - .5);
        if (rightbar) set('--pv-rightbar-edge', rightbar.getBoundingClientRect().left - bounds.left + .5);
        if (pane) { const r = pane.getBoundingClientRect(); set('--pv-handle-top', r.top - bounds.top); set('--pv-handle-bottom', bounds.bottom - r.bottom); }
        for (const el of [frame, sidebar, rightbar].filter(Boolean)) if (!measured.has(el)) { measured.add(el); resizeObserver?.observe(el); }
      }
      for (const el of measured) if (!el.isConnected) { resizeObserver?.unobserve(el); measured.delete(el); }
    }
    function queueSync() {
      if (active && !raf) raf = requestAnimationFrame(() => { raf = 0; sync(); });
    }
    function release() {
      chatPopups.stop();
      active = false; generation++; welcomePlaying = false; clearWelcomeGlitch(); stopWelcomeFrame();
      observer?.disconnect(); observer = undefined; cancelAnimationFrame(raf); raf = 0;
      resizeObserver?.disconnect(); resizeObserver = undefined; measured.clear();
      for (const [el, original] of geometryStyles) for (const [name, value] of original) { if (value) el.style.setProperty(name, value); else el.style.removeProperty(name); }
      geometryStyles.clear();
      body.removeEventListener('transitionend', queueSync);
      body.removeEventListener('click', onNewSession, true);
      window.removeEventListener('resize', queueSync);
      window.removeEventListener('online', tick);
      window.removeEventListener('offline', tick);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion?.removeEventListener('change', onMotionPreference);
      clearInterval(ticker); clearInterval(cpuTimer);
      for (const el of [style, brand, presence, stage, bottom, lines, titlebar, leftToggle, rightToggle, fx, fxHud]) el.remove();
      if (body.getAttribute('data-pv-deepsea') === '') { if (previous === null) body.removeAttribute('data-pv-deepsea'); else body.setAttribute('data-pv-deepsea', previous); }
      for (const name of ['data-pv-state', 'data-pv-wait', 'data-pv-motion', 'data-pv-statusbar', 'data-pv-fx', 'data-pv-crt']) body.removeAttribute(name);
      fxPhase = undefined; fxSession = undefined; fxTurn = undefined;
      for (const [el, old] of marked) { if (old === null) el.removeAttribute('data-pv-part'); else el.setAttribute('data-pv-part', old); }
      marked.clear(); samples = []; cpuUpdated = 0; activityWave.reset();
    }
    let visitorsReset = false;
    function update(state) {
      if (state?.values.guests === false) {
        if (!visitorsReset) {
          try {
            claudeStory.reset(); visitorsReset = true; newWelcome = true;
          } catch (error) {
            console.error('[deepsea] Failed to clear visitor story progress', error);
          }
        }
      } else if (state) visitorsReset = false;
      if (personaReady) {
        personaTarget = JSON.stringify(state ? { active: true, enabled: state.values.persona !== false } : { active: false });
        personaRetryAt = 0; syncPersona();
      }
      if (!state) { release(); return; }
      if ((options.guests !== false) !== (state.values.guests !== false)) newWelcome = true;
      options = state.values;
      body.setAttribute('data-pv-deepsea', '');
      body.setAttribute('data-pv-motion', options.motion === false ? 'off' : 'on');
      body.setAttribute('data-pv-crt', options.enhancedCrt === true ? 'on' : 'off');
      body.setAttribute('data-pv-statusbar', options.statusbar === false ? 'off' : 'on');
      if (!style.isConnected) document.head.append(style);
      if (options.scanlines === true || options.enhancedCrt === true) { if (!lines.isConnected) body.append(lines); } else lines.remove();
      if (!active) {
        active = true;
        chatPopups.start();
        observer = new MutationObserver(queueSync);
        observer.observe(body, { subtree: true, childList: true });
        resizeObserver = new ResizeObserver(queueSync);
        body.addEventListener('transitionend', queueSync);
        body.addEventListener('click', onNewSession, true);
        window.addEventListener('resize', queueSync);
        window.addEventListener('online', tick);
        window.addEventListener('offline', tick);
        document.addEventListener('visibilitychange', onVisibility);
        reducedMotion?.addEventListener('change', onMotionPreference);
        ticker = setInterval(tick, 50); cpuTimer = setInterval(fetchCpu, 200); fetchCpu();
      }
      sync(); tick();
    }
    const token = {};
    const settings = [
      { key: 'portrait', type: 'boolean', label: '空白会话角色画面', description: '在新会话中轮换大肥鱼立绘与访客彩蛋。', defaultValue: true },
      { key: 'guests', type: 'boolean', label: '访客网络', description: '允许其他 AI 来访，并推进后续剧情。关闭后停止访客并清空剧情进度，重新开启后从初遇开始。', defaultValue: true },
      { key: 'persona', type: 'boolean', label: '大肥鱼人设', description: '默认以“本鱼”自称、称呼你为“主人”。作用于当前 DSH 实例的模型请求；关闭后停止注入，旧对话的角色语气可能延续。不会修改 AGENTS.md。', defaultValue: true },
      { key: 'statusbar', type: 'boolean', label: '底部状态栏', description: 'DSH 进程 CPU 占用（单核基准，非整机）、会话状态、轮数、耗时和本地时钟。', defaultValue: true },
      { key: 'motion', type: 'boolean', label: '界面动效', description: '字符解码与终端光标；运行阶段保持默认配色，等待用户操作时静态高亮。遵循系统减少动态效果设置。', defaultValue: true },
      { key: 'scanlines', type: 'boolean', label: 'CRT 静态纹理与暗角', description: '静止的细横线纹理与屏幕暗角；无移动扫光，不拦截点击。', defaultValue: true },
      { key: 'enhancedCrt', type: 'boolean', label: '增强 CRT 效果', description: '提亮同色系文字，为图标、画面和边框增加辉光，图像呈现轻微过曝，并启用更明显的静态扫描线；关闭后恢复原有配色与纹理设置。可能影响可读性。', defaultValue: false },
    ];
    const definition = { protocol: 2, skinId: 'pv-deepsea', title: '深海终端', settings, apply: update };
    const register = () => window.dispatchEvent(new CustomEvent('dsh:skin-customization-register-v2', { detail: { token, definition } }));
    window.addEventListener('dsh:skin-customization-ready-v2', register);
    update({ values: Object.fromEntries(settings.map(x => [x.key, x.defaultValue])) }); personaReady = true; register();
    return () => { personaDisposed = true; window.removeEventListener('dsh:skin-customization-ready-v2', register); window.dispatchEvent(new CustomEvent('dsh:skin-customization-unregister-v2', { detail: { token, definition } })); release(); };
  }, 'Deepsea terminal skin');
}
