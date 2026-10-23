// Offline-only result envelope. Not connected to live Tokyo event fetching.
// Never equate a failed fetch with a verified absence of events.
export function classifyTokyoEventResult({ events, failures = [], attempted = 0 }) {
  if (!Array.isArray(events) || !Array.isArray(failures) || !Number.isInteger(attempted) || attempted < 0) {
    throw new TypeError('Invalid Tokyo event result input');
  }
  if (attempted === 0) return { status: 'not_checked', events: [], hasVerifiedEvents: false };
  if (failures.length > 0) {
    return { status: events.length > 0 ? 'partial' : 'unavailable', events: [...events], hasVerifiedEvents: events.length > 0 };
  }
  return { status: events.length > 0 ? 'available' : 'empty', events: [...events], hasVerifiedEvents: events.length > 0 };
}
export function emptyTokyoEventGuideState(result) {
  if (!result || !Array.isArray(result.events)) throw new TypeError('Invalid Tokyo event result');
  if (result.events.length > 0) return 'events_present';
  if (result.status === 'empty') return 'no_confirmed_events';
  if (result.status === 'unavailable' || result.status === 'partial') return 'fetch_unverified';
  return 'not_checked';
}
