import { readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

function defaultStore() {
  const file = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'storages', 'dsh-pv-deepsea', 'persona.json');
  return {
    read() {
      try {
        const data = JSON.parse(readFileSync(file, 'utf8'));
        if (typeof data.enabled !== 'boolean') throw new Error('Invalid persona preference');
        return data.enabled;
      } catch (error) { if (error.code === 'ENOENT') return true; throw error; }
    },
    write(enabled) {
      mkdirSync(dirname(file), { recursive: true });
      const temp = `${file}.${process.pid}.tmp`;
      writeFileSync(temp, JSON.stringify({ enabled }) + '\n', 'utf8');
      renameSync(temp, file);
    },
  };
}

export function installPersona(ctx, store = defaultStore()) {
  const text = readFileSync(new URL('persona.txt', import.meta.url), 'utf8');
  return ctx.effect(() => {
    let enabled = false, active = true, removeSection;
    try { enabled = store.read(); }
    catch (error) { ctx.logger?.warn('Deepsea persona preference could not be read; persona stays off: %o', error); }
    const refresh = () => {
      if (active && enabled && !removeSection) {
        removeSection = ctx.systemPrompt.section({ name: 'pv-deepsea:persona', order: 10, interpolate: false, text });
      } else if ((!active || !enabled) && removeSection) {
        removeSection(); removeSection = undefined;
      }
    };
    refresh();
    const unregister = ctx.connection.fetch.register({
      path: '/api/pv-deepsea-persona', methods: ['POST'], requestBody: 'buffered',
      async fetch(request) {
        const message = await request.json();
        let result;
        try {
          const input = message.payload;
          if (!input || typeof input.active !== 'boolean' || (input.active && typeof input.enabled !== 'boolean')) {
            throw new Error('Expected active and enabled boolean values');
          }
          // Deactivation never overwrites the user's saved preference.
          if (input.active && input.enabled !== enabled) { store.write(input.enabled); enabled = input.enabled; }
          active = input.active; refresh();
          result = { ok: true, value: { enabled, active, applied: !!removeSection } };
        } catch (error) { result = { ok: false, error: { code: 'PV_PERSONA_UPDATE_FAILED', message: String(error.message ?? error), details: {} } }; }
        return Response.json({ type: 'server-response', rpcId: message.rpcId, result });
      },
    });
    return () => { unregister?.(); removeSection?.(); removeSection = undefined; };
  }, 'Deepsea persona');
}
