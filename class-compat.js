// DSH exposes stable module identities on its style elements. Resolve exact
// class tokens within those modules, never global *_root / *_card suffixes.
export const CLASS_MODULES = [
  ['layout/AppFrame', ['_6Qf49G']],
  ['sidebar/SidebarRoot', ['_3WPZCG']],
  ['conversation/ConversationRoot', ['ST7X_W']],
  ['conversation/HeroShell', ['bocITq']],
  ['conversation/InputBar', ['yhfFVG', 'uV2eYG']],
  ['sidebar-right/SidebarRight', ['irMxjq']],
  ['permission-presets/PermissionSelect', ['cl2Rlq']],
  ['chat/MessageItem', ['IzP3Va', 'Sixlwa']],
  ['goal/GoalCommandInputView', ['rcAy0q']],
  ['user-questions/QuestionReplyView', ['Dh9Boq']],
  ['tool/bash-sample', ['CY-8Ka']],
  ['tool/ToolRow', ['o3BgMG']],
  ['chat/ReasoningRow', ['lcKema']],
];

export function createClassCompatibility(document, aliases = {}) {
  let classes = new Map();
  const cached = new Map();
  const classPattern = /\.([\w-]+)_([A-Za-z][\w-]*)/g;
  const selector = source => source.replace(classPattern,
    (token, prefix, name) => classes.get(`${prefix}_${name}`) ?? token);
  const windowsSelector = source => source.replace(classPattern,
    (token, prefix, name) => aliases[prefix] ? `.${aliases[prefix]}_${name}` : token);
  function refresh() {
    let changed = false;
    const next = new Map();
    for (const [module, prefixes] of CLASS_MODULES) {
      const id = `@deepseek-ai/dsh-client-ui-${module}.module.css`;
      const css = document.querySelector(`style[data-plugin-css="${id}"]`)?.textContent ?? '';
      if (cached.get(id)?.css !== css) {
        const tokens = [...new Map([...css.matchAll(classPattern)].map(match => [match[0], match])).values()];
        cached.set(id, { css, tokens });
        changed = true;
      }
      for (const [token, , name] of cached.get(id).tokens) {
        for (const prefix of prefixes) {
          next.set(`${prefix}_${name}`, token);
          if (aliases[prefix]) next.set(`${aliases[prefix]}_${name}`, token);
        }
      }
    }
    if (changed) classes = next;
    return changed;
  }
  const candidates = source => [...new Set([selector(source), source, windowsSelector(source)])];
  return {
    refresh, selector,
    query: source => {
      for (const candidate of candidates(source)) {
        const element = document.querySelector(candidate);
        if (element) return element;
      }
      return null;
    },
    queryAll: source => [...new Set(candidates(source).flatMap(candidate => [...document.querySelectorAll(candidate)]))],
    closest: (element, source) => {
      for (const candidate of candidates(source)) {
        const match = element?.closest?.(candidate);
        if (match) return match;
      }
      return null;
    },
  };
}
