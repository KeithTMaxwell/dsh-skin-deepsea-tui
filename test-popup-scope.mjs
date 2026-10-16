import assert from 'node:assert/strict';
import { createChatPopupScope } from './popup-scope.js';
const listeners = new Map();
let surfaces = [], controllers = [], time = 0;
const element = (chat = false, attrs = {}) => ({
  id: attrs.id, attrs: new Map(Object.entries(attrs)),
  closest() { return chat || this.attrs.has('data-pv-chat-popup') ? this : null; },
  getAttribute(key) { return this.attrs.get(key) ?? null; },
  setAttribute(key, value) { this.attrs.set(key, value); },
  removeAttribute(key) { this.attrs.delete(key); },
});
const document = {
  querySelectorAll(selector) { return selector === '[aria-controls],[aria-describedby]' ? controllers : surfaces; },
  addEventListener(type, fn) { listeners.set(type, fn); },
  removeEventListener(type) { listeners.delete(type); },
};
const scope = createChatPopupScope(document, () => time);
const marked = node => node.attrs.has('data-pv-chat-popup');
const chat = element(true), settings = element();
const existing = element(); surfaces.push(existing); scope.start();
listeners.get('pointerdown')({ target: chat });
const menu = element(); surfaces.push(menu); scope.sync();
assert.equal(marked(menu), true);
assert.equal(marked(existing), false);
listeners.get('pointerover')({ target: menu });
const submenu = element(); surfaces.push(submenu); scope.sync();
assert.equal(marked(submenu), true);
listeners.get('pointerdown')({ target: settings });
const dialog = element(); surfaces.push(dialog); scope.sync();
assert.equal(marked(dialog), false, 'settings stays blue while chat menu exists');
listeners.get('keydown')({ target: chat });
const unrelated = element(false, { id: 'settings-dialog' });
controllers = [element(false, { 'aria-controls': 'settings-dialog' })];
surfaces.push(unrelated); scope.sync();
assert.equal(marked(unrelated), false, 'explicit outside owner overrides recent chat input');
time = 2000;
const delayed = element(); surfaces.push(delayed); scope.sync();
assert.equal(marked(delayed), false, 'unassociated delayed surface stays unchanged');
const linked = element(false, { id: 'chat-tooltip' });
controllers = [element(true, { 'aria-describedby': 'chat-tooltip' })];
surfaces.push(linked); scope.sync(); assert.equal(marked(linked), true);
surfaces = surfaces.filter(node => node !== menu); scope.sync(); assert.equal(marked(menu), false);
scope.stop(); assert.equal(marked(linked), false); assert.equal(listeners.size, 0);
console.log('PASS: chat popup ownership, nested menus, global isolation, expiry and cleanup.');
