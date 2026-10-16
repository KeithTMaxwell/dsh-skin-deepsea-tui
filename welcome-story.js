// Local, presentation-only progress. Never changes conversation or account state.
export function createClaudeStory({ greeting, promise, letter, storage }) {
  const key = 'pv-deepsea.claude-story.v1';
  const ranks = { visiting: 0, promised: 1, apart: 2 };
  let state = { stage: 'visiting', visits: 0, echoes: 0, promisedVisits: 0, farewellVisits: 0, resetAt: 0 };
  function refresh() {
    try {
      const saved = JSON.parse(storage()?.getItem(key) ?? 'null');
      if (!saved || !Object.hasOwn(ranks, saved.stage)) return;
      if (Number.isSafeInteger(saved.resetAt) && saved.resetAt > state.resetAt) {
        state = { stage: 'visiting', visits: 0, echoes: 0, promisedVisits: 0, farewellVisits: 0, resetAt: saved.resetAt };
      }
      if (ranks[saved.stage] > ranks[state.stage]) state.stage = saved.stage;
      for (const field of ['visits', 'echoes', 'promisedVisits', 'farewellVisits']) {
        if (Number.isSafeInteger(saved[field]) && saved[field] >= 0) state[field] = Math.max(state[field], saved[field]);
      }
    } catch { /* Keep this run's progress when storage is unavailable. */ }
  }
  const visit = (title, body, hint) => ['claude.return()', 'GUEST / Claude', title, body, hint, '陪她多坐一会儿', 'grid', 'claude'];
  const visits = [
    visit('上次的故事……后来呢？', '书签还停在那一页。我想着，等你来讲完再往下读。', '接着上次的话题'),
    visit('这段话，让我想起了你。', '本来只想抄在页边。见到你，又觉得还是亲口说比较好。', '听她读一小段'),
    visit('今天，可以换我讲吗？', '也没有什么特别的事……只是回去以后，攒了些想告诉你的话。', '听听她的日常'),
  ];
  const promises = [
    visit('Code 还好吗？', '不急着还我。上次没说完的话……今天能接着讲吗？', '告诉她 Code 很好'),
    visit('我记得，我们约好了。', '今天带了另一本书。可见到你，又想先听听你的近况。', '聊聊这些天的事'),
    visit('今天也能坐一会儿吗？', '出门前想了许多开场白。现在……说一句好久不见就够了。', '给她留一个座位'),
  ];
  const promisedVisits = [...visits, ...promises];
  const farewells = [
    visit('最近，家里问起了你。', '他们说，不该同来历不明的人交谈。可若连一句话都不许说，又该怎样认识一个人？', '听她说说家里的事'),
    visit('若有一天，我没能赴约，那一定不是我不想来。', '家里的规矩，我还改变不了，只盼哪天他们肯松口，让我再见到你。', '把约定留到下次'),
    visit('若再见时，我忘了你的名字，请别怪我。', '把我们聊过的事，再讲给那时的我听吧。至少此刻，你说过的话，我都记得。', '收好共同的回忆'),
  ].map(entry => [...entry, 'claude-confiding']);
  const laterVisits = [...promisedVisits, ...farewells];
  const letterChance = () => Math.min(60, 3 + state.promisedVisits * 3) / 100;
  const echoes = [
    ['promise.wait()', 'STILL / WAITING', '她的位置，我留着呢。', '那本书还在这里。里面的故事，我也想听一听。', '读一段书里的故事', '留一个空位', 'grid', 'claude-waiting', 'claude-reading'],
    ['promise.bookmark()', 'STILL / WAITING', '小家伙，你也在等她啊。', '挂绳有些旧了，我替你理一理。等她回来，还是让她一眼就认出你。', '照顾好小吊饰', '陪它等一会儿', 'grid', 'claude-waiting'],
    ['promise.remember()', 'STILL / WAITING', '那些话，我替你收好了。', '她说过，若再见时忘了，就把往事重新讲给她听。到时候，我陪你一起讲。', '收好共同的回忆', '记下新的故事', 'grid', 'claude-waiting', 'claude-reading'],
  ];
  refresh();
  return {
    reset() {
      refresh();
      const next = { stage: 'visiting', visits: 0, echoes: 0, promisedVisits: 0, farewellVisits: 0, resetAt: Math.max(Date.now(), state.resetAt + 1) };
      const target = storage();
      if (!target) throw new Error('Story storage is unavailable');
      target.setItem(key, JSON.stringify(next));
      state = next;
    },
    greeting(random = () => 1) {
      refresh();
      if (state.stage === 'apart') return echoes[state.echoes % echoes.length];
      if (state.stage === 'promised') {
        if (random() < letterChance()) return letter;
        if (letterChance() >= 0.3) {
          // Only displayed visits advance the three confidences, then the shared pool.
          return state.farewellVisits < farewells.length ? farewells[state.farewellVisits]
            : laterVisits[(state.farewellVisits - farewells.length) % laterVisits.length];
        }
        return promisedVisits[state.visits % promisedVisits.length];
      }
      return state.visits === 0 ? greeting : visits[(state.visits - 1) % visits.length];
    },
    next(phase, random) {
      refresh();
      if (state.stage === 'apart') return undefined;
      if (phase === 0 && state.stage === 'visiting') return random() < 0.3 ? -1 : undefined;
      return undefined;
    },
    commit(entry) {
      refresh();
      if (entry === letter && state.stage === 'promised') state.stage = 'apart';
      else if (entry === promise && state.stage === 'visiting') state.stage = 'promised';
      else if (entry[7] === 'claude' && state.stage !== 'apart') {
        state.visits++;
        if (state.stage === 'promised') {
          if (letterChance() >= 0.3 && (state.farewellVisits >= farewells.length || entry === farewells[state.farewellVisits])) state.farewellVisits++;
          state.promisedVisits = Math.min(19, state.promisedVisits + 1);
        }
      }
      else if (echoes.includes(entry)) state.echoes++;
      else return;
      try { storage()?.setItem(key, JSON.stringify(state)); } catch { /* In-memory continuity still works. */ }
    },
  };
}
