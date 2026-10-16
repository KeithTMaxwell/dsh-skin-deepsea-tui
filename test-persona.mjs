import assert from 'node:assert/strict';
import { installPersona } from './lib/persona.js';

let saved = true, failWrite = false;
const store = { read: () => saved, write: value => { if (failWrite) throw new Error('disk full'); saved = value; } };
function mount(storage = store) {
  let cleanup, route, removals = 0, unregistered = false;
  const sections = new Map();
  const ctx = {
    effect: f => { cleanup = f(); return cleanup; },
    logger: { warn() {} },
    systemPrompt: { section: section => {
      assert.ok(!sections.has(section.name), 'never duplicate a prompt section');
      sections.set(section.name, section);
      return () => { sections.delete(section.name); removals++; };
    } },
    connection: { fetch: { register: value => { route = value; return () => { unregistered = true; }; } } },
  };
  installPersona(ctx, storage);
  return {
    sections, cleanup: () => cleanup(), removed: () => removals, unregistered: () => unregistered,
    async send(payload) {
      const response = await route.fetch({ json: async () => ({ type: 'client-request', method: 'pv-deepsea-persona', rpcId: 'persona-test', payload }) });
      const result = await response.json();
      assert.equal(result.rpcId, 'persona-test');
      return result.result;
    },
  };
}
let host = mount();
assert.equal(host.sections.size, 1, 'enabled by default');
const section = [...host.sections.values()][0];
assert.equal(section.interpolate, false);
assert.match(section.text, /自称「本鱼」/);
assert.match(section.text, /不许跳过验证/);
assert.equal(section.complete, undefined, 'augment rather than replace harness instructions');
await host.send({ active: true, enabled: true });
assert.equal(host.removed(), 0, 'idempotent updates');
assert.equal((await host.send({ active: true, enabled: false })).value.applied, false);
assert.equal(saved, false); assert.equal(host.sections.size, 0);
host.cleanup(); assert.ok(host.unregistered());
host = mount(); assert.equal(host.sections.size, 0, 'disabled preference survives restart');
await host.send({ active: true, enabled: true }); assert.equal(host.sections.size, 1);
await host.send({ active: false }); assert.equal(host.sections.size, 0); assert.equal(saved, true, 'switching skins retains preference');
await host.send({ active: true, enabled: true }); assert.equal(host.sections.size, 1);
failWrite = true;
const failure = await host.send({ active: true, enabled: false });
assert.equal(failure.ok, false); assert.equal(failure.error.message, 'disk full');
assert.equal(saved, true); assert.equal(host.sections.size, 1, 'failed persistence leaves applied state unchanged');
failWrite = false;
assert.equal((await host.send({ active: true, enabled: 'false' })).ok, false);
assert.equal(host.sections.size, 1);
host.cleanup(); assert.equal(host.sections.size, 0, 'unload removes persona');
host = mount({ read() { throw new Error('invalid JSON'); }, write() {} });
assert.equal(host.sections.size, 0, 'unreadable preferences do not silently enable persona');
host.cleanup();
console.log('PASS: persona default, persistence, disable/re-enable, skin switch, unload, literal prompt, validation and storage errors.');
