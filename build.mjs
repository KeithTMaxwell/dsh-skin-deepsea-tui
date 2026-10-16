import { readFileSync, writeFileSync } from 'node:fs';
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const palette = JSON.parse(read('palette.json'));
const aliases = JSON.parse(read('class-aliases.json'));
// CSS Module hashes differ between the macOS and Windows release builds.
// Keep both selectors; do not alter the application's own class attributes.
const compatibleCss = css => css.replace(/\.([\w-]+)_([A-Za-z][\w-]*)/g,
  (selector, prefix, name) => aliases[prefix]
    ? `:is(${selector},.${aliases[prefix]}_${name})` : selector);
const images = Object.fromEntries(['avatar'].map(name => [name,
  'data:image/png;base64,' + readFileSync(new URL(`assets/${name}.png`, import.meta.url)).toString('base64')]));
for (const expression of ['cheerful', 'serious', 'starry', 'shy', 'confused', 'exasperated', 'angry', 'frightened']) {
  images[expression] = 'data:image/webp;base64,' + readFileSync(new URL(`assets/whale-${expression}.webp`, import.meta.url)).toString('base64');
}
const guestFiles = { claude: 'claude-visit', pushout: 'pushout-v2', 'claude-waiting': 'claude-waiting-v2' };
for (const guest of ['chatgpt', 'claude', 'pushout', 'claude-code', 'claude-letter', 'claude-waiting', 'claude-confiding', 'claude-reading']) {
  images[guest] = 'data:image/webp;base64,' + readFileSync(new URL(`assets/guest-${guestFiles[guest] ?? guest}.webp`, import.meta.url)).toString('base64');
}
const css = '/* PV palette + Desktop 0.2.0-rc.2 surfaces. */\nbody[data-pv-deepsea] {\n' +
  Object.entries(palette).map(([key, value]) => `  ${key}: ${value} !important;`).join('\n') + '\n}\n' + compatibleCss(read('surfaces.css') + '\n' + read('effects.css'));
writeFileSync(new URL('theme.css', import.meta.url), css);
const story = read('welcome-story.js').replace('export function createClaudeStory', 'function createClaudeStory');
const source = read('popup-scope.js').replace('export function createChatPopupScope', 'function createChatPopupScope') + '\n' + read('terminal-scene.js').replaceAll('export function ', 'function ') + '\n' + read('activity-wave.js').replace('export function createActivityWave', 'function createActivityWave') + '\n' + read('client-source.js').replace('export function apply(ctx)', 'function apply(ctx)');
writeFileSync(new URL('lib/client.js', import.meta.url), `window.__ModuleLoader__.load({ id: 'dsh-skin-deepsea-tui', factory: () => {\nconst THEME_CSS = ${JSON.stringify(css)};\nconst CLASS_ALIASES = ${JSON.stringify(aliases)};\nconst IMAGES = ${JSON.stringify(images)};\n${story}\n${source}\nreturn { inject: ['uiSession', 'connection'], apply };\n}});\n`);
console.log('Built PV Deepsea CSS and DSH client bundle.');
