import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CLASS_MODULES, createClassCompatibility } from './class-compat.js';

const fixture = JSON.parse(fs.readFileSync(new URL('test/fixtures/dsh-0.2.1-rc.3-classes.json', import.meta.url), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(new URL('class-aliases.json', import.meta.url), 'utf8'));
const nodes = new Map();
const document = { querySelector: key => nodes.get(key) ?? null, querySelectorAll: key => nodes.has(key) ? [nodes.get(key)] : [] };
const compat = createClassCompatibility(document, aliases);
compat.refresh();
assert.equal(compat.selector('._6Qf49G_frame'), '._6Qf49G_frame', 'missing styles retain legacy selectors');
assert.equal(compat.refresh(), false, 'unchanged styles do not rebuild the skin');

function install(modules) {
  for (const [id, tokens] of Object.entries(modules)) nodes.set(`style[data-plugin-css="${id}"]`, {
    textContent: tokens.map(token => `.${token}{}`).join(''),
  });
}
install(fixture.modules);
assert.equal(compat.refresh(), true, 'late plugin styles are discovered');
assert.equal(compat.refresh(), false);
for (const [module, prefixes] of CLASS_MODULES) {
  const tokens = fixture.modules[`@deepseek-ai/dsh-client-ui-${module}.module.css`];
  assert.ok(tokens?.length, `real host module exists: ${module}`);
  for (const token of tokens) {
    const name = token.match(/^[\w-]+_([A-Za-z][\w-]*)$/)[1];
    for (const prefix of prefixes) {
      assert.equal(compat.selector(`.${prefix}_${name}`), `.${token}`);
      if (aliases[prefix]) assert.equal(compat.selector(`.${aliases[prefix]}_${name}`), `.${token}`);
    }
  }
}
assert.equal(compat.selector('.ST7X_W_root .bocITq_root .yhfFVG_card'), '.kiGsTW_root ._8tPydW_root .JZLxKW_card');
assert.equal(compat.selector('.foreign_root .foreign_card .pv-stage'), '.foreign_root .foreign_card .pv-stage', 'unrelated plugins and skin classes stay untouched');
assert.equal(compat.selector('.yhfFVG_noLongerExists'), '.yhfFVG_noLongerExists', 'do not invent removed host classes');
const frame = {};
nodes.set('.PIRFFq_frame', frame);
nodes.set('._6Qf49G_frame', frame);
assert.equal(compat.query('._6Qf49G_frame'), frame);
assert.deepEqual(compat.queryAll('._6Qf49G_frame'), [frame], 'fallback queries deduplicate nodes');
const clicked = { closest: selector => selector === '.kB3qhq_newSession' ? frame : null };
assert.equal(compat.closest(clicked, '._3WPZCG_newSession'), frame, 'new-session click uses the same compatibility mapping');
const css = compat.selector(fs.readFileSync(new URL('theme.css', import.meta.url), 'utf8'));
for (const token of ['.PIRFFq_handle', '.kB3qhq_brandIdentity', '._8tPydW_headline', '.JZLxKW_card', '.AkCqbG_bubble', '.IaWXUa_bubble', '.RZvdfa_bubble', '.Dv5QdW_panel', '.BFlR-G_card', '.UHhYua_root', '.ijfCxa_root']) {
  assert.ok(css.includes(token), `built skin styles target current host: ${token}`);
}

// A different platform/build can change every hash without a new hardcoded map.
const rehashed = Object.fromEntries(Object.entries(fixture.modules).map(([id, tokens], i) => [id,
  tokens.map(token => token.replace(/^[\w-]+_([A-Za-z][\w-]*)$/, `next-${i}_$1`)),
]));
install(rehashed);
assert.equal(compat.refresh(), true);
assert.equal(compat.selector('._6Qf49G_frame'), '.next-0_frame');
assert.equal(compat.selector('.ST7X_W_root'), '.next-2_root');
assert.equal(compat.selector('.yhfFVG_card'), '.next-4_card');
assert.equal(compat.refresh(), false);
nodes.delete('style[data-plugin-css="@deepseek-ai/dsh-client-ui-layout/AppFrame.module.css"]');
assert.equal(compat.refresh(), true);
nodes.delete('._6Qf49G_frame');
nodes.set('.BynINW_frame', frame);
assert.equal(compat.query('._6Qf49G_frame'), frame, 'legacy Windows fallback remains after style unload');
assert.equal(compat.selector('._6Qf49G_frame'), '._6Qf49G_frame', 'unloaded modules do not retain stale mappings');
console.log('PASS: DSH 0.2.1-rc.3 modules, CSS and DOM parity, delayed loading, hash changes, unload, legacy fallbacks and plugin isolation.');
