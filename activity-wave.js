// Decorative activity drives the bar heights, independently of CPU measurements.
export function createActivityWave() {
  const characterStep = 128, lifetime = 2000, duration = 450, sliceMs = 50;
  const knots = [[0, 0], [60, 1.5], [110, 0], [150, -2], [190, 10], [235, -6], [290, 0], [370, 2.5], [450, 0]];
  let session, turn, step, phase, lengths = [], calls = new Set(), remainder = 0;
  let pulses = [], waitingBeatAt, waitingSecond = false, waitingKind;
  function reset() {
    session = turn = step = phase = undefined;
    lengths = []; calls = new Set(); remainder = 0; pulses = [];
    waitingBeatAt = undefined; waitingSecond = false; waitingKind = undefined;
  }
  function update(now, state, enabled = true) {
    if (session !== state.session) { reset(); session = state.session; }
    if (turn !== state.turn) {
      turn = state.turn; phase = undefined; lengths = []; calls = new Set(); remainder = 0;
      waitingBeatAt = undefined; waitingSecond = false;
    }
    if (step !== state.step) { step = state.step; lengths = []; }
    pulses = pulses.filter(pulse => now - pulse.time < lifetime + duration + sliceMs);
    const nextLengths = (state.blocks ?? []).map(block =>
      block.kind === 'tool-call' ? (block.argsRaw?.length ?? 0) :
      block.kind === 'text' || block.kind === 'reasoning' ? (block.text?.length ?? 0) : 0);
    const nextCalls = new Set([...(state.calls ?? []), ...(state.completedCalls ?? []),
      ...(state.blocks ?? []).filter(block => block.kind === 'tool-call' && block.callId)].map((call, index) =>
      typeof call === 'string' ? call : call.id ?? call.callId ?? call.toolCallId ?? `slot:${index}`));
    let events = state.running && ['思考', '执行', '输出'].includes(state.label) && phase !== state.label ? 1 : 0;
    for (const id of nextCalls) if (!calls.has(id) && phase !== undefined) events++;
    if (state.running && phase !== undefined) {
      remainder += nextLengths.reduce((sum, length, index) => sum + Math.max(0, length - (lengths[index] ?? 0)), 0);
      events += Math.floor(remainder / characterStep); remainder %= characterStep;
    }
    // Coalesce a burst into one beat; do not replay a backlog after pausing motion.
    if (enabled && state.label === '等待') {
      const kind = state.waiting === 'approval' ? 'approval' : 'choice';
      // Schedule only the next live beat, never a future pulse or a hidden-tab backlog.
      if (waitingKind !== kind || waitingBeatAt === undefined || now - waitingBeatAt > 100) {
        waitingBeatAt = now; waitingSecond = false;
      }
      waitingKind = kind;
      if (now >= waitingBeatAt) {
        pulses.push({ time: now, gain: waitingSecond ? .5 : .7 });
        waitingBeatAt = now + (kind === 'approval' ? (waitingSecond ? 900 : 300) : (waitingSecond ? 1250 : 350));
        waitingSecond = !waitingSecond;
      }
    } else {
      waitingBeatAt = undefined; waitingSecond = false; waitingKind = undefined;
      if (enabled && events) pulses.push({ time: now, gain: 1 });
    }
    if (!enabled) pulses = [];
    lengths = nextLengths; for (const id of nextCalls) calls.add(id); phase = state.label;
  }
  function value(time) {
    // A fixed P-QRS-T shaped beat, independent of the measured CPU load.
    let value = 0;
    for (const pulse of pulses) {
      const age = time - pulse.time;
      if (age < 0 || age >= 450) continue;
      const i = knots.findIndex(([t]) => t > age);
      const [a, y] = knots[i - 1], [b, z] = knots[i];
      value += pulse.gain * (y + (z - y) * (age - a) / (b - a));
    }
    return Math.max(-10, Math.min(10, value));
  }
  function bars(now) {
    const end = Math.floor(now / sliceMs) * sliceMs;
    return Array.from({ length: lifetime / sliceMs }, (_, index) => {
      const from = end - lifetime + index * sliceMs, to = from + sliceMs;
      // Exact extrema of the piecewise-linear sum within this fixed time slice.
      const times = [from, to];
      for (const pulse of pulses) for (const [offset] of knots) {
        const time = pulse.time + offset;
        if (time > from && time < to) times.push(time);
      }
      return Math.max(...times.map(time => Math.abs(value(time))));
    });
  }
  return { update, value, bars, reset };
}
