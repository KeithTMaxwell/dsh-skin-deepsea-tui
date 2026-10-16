import { installPersona } from './persona.js';
export const name = 'dsh-skin-deepsea-tui';
export const inject = ['connection', 'webServer', 'systemPrompt'];
export function apply(ctx) {
  installPersona(ctx);
  ctx.effect(() => {
    let previous = process.cpuUsage();
    let previousTime = process.hrtime.bigint();
    const samples = [];
    const timer = setInterval(() => {
      const usage = process.cpuUsage();
      const time = process.hrtime.bigint();
      const elapsed = Number(time - previousTime) / 1000;
      samples.push({ time: Date.now(), percent: Math.max(0,
        (usage.user - previous.user + usage.system - previous.system) / elapsed * 100) });
      previous = usage;
      previousTime = time;
      while (samples.length > 32) samples.shift();
    }, 200);
    timer.unref?.();
    const unregister = ctx.connection.fetch.register({
      path: '/api/pv-deepsea-metrics', methods: ['POST'], requestBody: 'buffered',
      async fetch(request) {
        const message = await request.json();
        return Response.json({ type: 'server-response', rpcId: message.rpcId,
          result: { ok: true, value: { time: Date.now(), samples: [...samples] } } });
      },
    });
    return () => { clearInterval(timer); if (typeof unregister === 'function') unregister(); };
  }, 'Deepsea local CPU samples');
}
