// Portal nodes live outside the chat pane. Remember their interaction origin,
// but never recolour pre-existing or unassociated global surfaces.
export function createChatPopupScope(document, now = Date.now) {
  const surfaces = '[data-menu-material],[data-menu-backing],[role=dialog],[role=tooltip],[style*="--dsh-hover-preview-fade"]';
  const owned = new Set();
  let seen = new Set(), origin = false, expires = 0;
  const inChat = node => !!node?.closest?.('[data-pv-part=center],[data-pv-chat-popup]');
  function sync() {
    const current = new Set(document.querySelectorAll(surfaces));
    for (const node of owned) if (!current.has(node)) {
      node.removeAttribute('data-pv-chat-popup'); owned.delete(node);
    }
    for (const node of current) {
      if (seen.has(node)) continue;
      const labelledBy = (node.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      const labels = labelledBy.map(id => document.getElementById?.(id)).filter(Boolean);
      const controllers = [...document.querySelectorAll('[aria-controls],[aria-describedby]')].filter(el =>
        node.id && ['aria-controls', 'aria-describedby'].some(attr =>
          (el.getAttribute(attr) || '').split(/\s+/).includes(node.id)));
      const anchors = controllers.length ? controllers : labels;
      const belongs = inChat(node) || (anchors.length ? anchors.some(inChat) : origin && now() < expires);
      if (belongs) { node.setAttribute('data-pv-chat-popup', ''); owned.add(node); }
    }
    seen = current;
  }
  function interaction(event) {
    sync();
    // Keyboard navigation and submenu hover retain the marked portal's origin.
    origin = inChat(event.target);
    expires = now() + 1500;
  }
  function start() {
    seen = new Set(document.querySelectorAll(surfaces));
    for (const type of ['pointerdown', 'keydown', 'pointerover']) document.addEventListener(type, interaction, true);
  }
  function stop() {
    for (const type of ['pointerdown', 'keydown', 'pointerover']) document.removeEventListener(type, interaction, true);
    for (const node of owned) node.removeAttribute('data-pv-chat-popup');
    owned.clear(); seen.clear(); origin = false; expires = 0;
  }
  return { start, sync, stop };
}
