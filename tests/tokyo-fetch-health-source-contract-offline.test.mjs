import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Characterization of real source; tests describe gaps, not a fix.
const src = readFileSync(new URL('../lib/tokyo-life-events.ts', import.meta.url), 'utf8');
function section(start, end) {
  const i = src.indexOf(start);
  assert.ok(i >= 0, 'missing ' + start);
  const j = src.indexOf(end, i + start.length);
  assert.ok(j > i, 'missing boundary ' + end);
  return src.slice(i, j);
}
const text = section('async function fetchText(', 'async function fetchJson<');
const json = section('async function fetchJson<', 'function isRecent(');
const quake = section('async function getEarthquakeEvents()', 'async function getWeatherWarningEvents()');
const forecast = section('async function getKotoWeatherForecastEvents()', 'function getTrainSection(');
const train = section('async function getTrainEvents()', 'function hasHanedaDisruption(');
const haneda = section('async function getHanedaEvents()', 'export async function getTokyoLifeEvents()');
const aggregate = section('export async function getTokyoLifeEvents()', 'export function createTokyoLifeEventsGuide(');

test('text fetch loses HTTP and network error distinction by returning null', () => {
  assert.match(text, /!response\.ok/);
  assert.match(text, /catch\s*\(error\)/);
  assert.match(text, /return null;/);
});
test('JSON fetch loses HTTP and network error distinction by returning null', () => {
  assert.match(json, /!response\.ok/);
  assert.match(json, /catch\s*\(error\)/);
  assert.match(json, /return null;/);
});
test('earthquake feed null is collapsed to zero events', () => {
  assert.match(quake, /if\s*\(!feed\)\s*\{\s*return \[\];/);
});
test('forecast null or missing hourly data is collapsed to zero events', () => {
  assert.match(forecast, /!data\?\.hourly/);
  assert.match(forecast, /return \[\];/);
});
test('rail source intentionally skips in Vercel and returns empty', () => {
  assert.match(train, /if\s*\(process\.env\.VERCEL\)\s*\{\s*return \[\];/);
});
test('Haneda uses two fetches and maps missing HTML to false', () => {
  assert.match(haneda, /HANEDA_DOMESTIC_URL/);
  assert.match(haneda, /HANEDA_INTERNATIONAL_URL/);
  assert.match(haneda, /:\s*false;/);
});
test('aggregate has no source-health result contract', () => {
  assert.match(aggregate, /Promise\.all/);
  assert.match(aggregate, /Promise<\s*TokyoLifeEvent\[\]\s*>/);
  assert.doesNotMatch(aggregate, /aggregateTokyoSourceResults|classifyTokyoEventResult/);
});
