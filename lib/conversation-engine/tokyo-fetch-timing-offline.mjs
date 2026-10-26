// Offline-only latency instrumentation helper; does not fetch or log user data.
export async function measureTokyoSources(tasks, now = () => performance.now()) {
  if (!Array.isArray(tasks) || tasks.length !== 5) throw new TypeError('Five source tasks required');
  const names = ['earthquake', 'warning', 'forecast', 'train', 'haneda'];
  if (new Set(tasks.map(t => t?.source)).size !== 5 ||
      tasks.some(t => !names.includes(t?.source) || typeof t.run !== 'function')) {
    throw new TypeError('Unknown, missing or duplicate source task');
  }
  const start = now();
  const measurements = await Promise.all(tasks.map(async task => {
    const begin = now();
    try {
      const value = await task.run();
      return { source: task.source, status: 'fulfilled', elapsedMs: Math.max(0, now() - begin), value };
    } catch {
      return { source: task.source, status: 'rejected', elapsedMs: Math.max(0, now() - begin) };
    }
  }));
  return {
    totalMs: Math.max(0, now() - start),
    measurements,
    // This measures wrapper completion, not cache hits or external HTTP durations.
    hasNetworkBreakdown: false,
  };
}
