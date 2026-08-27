'use strict';
/**
 * Hosthub sync recovery: failed-run flag, full tax pull, never persist zeros
 * from a failed calendar-event-gr-taxes fetch. Mirrors SRV 108 helpers.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function applySrv() {
  let src = fs.readFileSync(path.join(root, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; n <= 160; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    const p = path.join(root, 'srv', name);
    if (!fs.existsSync(p)) break;
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const patch of cfg.patches || []) {
      const count = src.split(patch.find).length - 1;
      assert.strictEqual(count, patch.count || 1, name + ' ' + patch.note);
      src = src.split(patch.find).join(patch.replace);
    }
  }
  return src;
}

function extractFn(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('unclosed function ' + name);
}

const srv = applySrv();
new vm.Script(srv, { filename: 'server.effective.js' });
const spec = JSON.parse(fs.readFileSync(path.join(root, 'srv', 'patches-108.json'), 'utf8'));
assert.strictEqual(crypto.createHash('sha256').update(srv).digest('hex'), spec.expectedSha256, 'SRV 108 result hash');
assert(srv.includes("app.post('/api/sync-full'"), 'full pull endpoint');
assert(srv.includes('hosthubSyncFailed'), 'failed-run flag');
assert(srv.includes('function applyStoredGrTaxes('), 'tax reuse helper');
assert(srv.includes('cn <= 141'), 'FE 141 bootstrap');
assert(!srv.includes('if (!prev || !hasTaxData(prev)) return;'), 'wipe-on-missing reuse is gone');

const names = [
  'hasStoredGrTax',
  'applyStoredGrTaxes',
  'mergeGrTaxIntoExisting',
  'hosthubSyncMetaPatch',
  'selectGrTaxTargets',
];
const bundle = names.map(n => extractFn(srv, n)).join('\n');
const sandbox = {};
vm.runInNewContext(bundle + '\n' + names.map(n => n + ' = ' + n + ';').join('\n'), sandbox);

const paid = (id, dateTo) => ({
  id,
  date_to: dateTo,
  guest_paid: { cents: 10000, currency: 'EUR' },
});
const now = Date.parse('2026-08-27T12:00:00Z');

const evs = [];
const prev = {};
for (let i = 0; i < 200; i++) {
  const id = 'future' + i;
  evs.push(paid(id, '2026-09-' + String((i % 28) + 1).padStart(2, '0')));
  prev[id] = { id, ct: 8, bvPrevat: 100, grTaxOk: true };
}
for (let i = 0; i < 600; i++) {
  const id = 'wiped' + i;
  evs.push(paid(id, '2026-08-' + String((i % 27) + 1).padStart(2, '0')));
  prev[id] = { id, ct: 0, vat: 0, at: 0, bvPrevat: 0 };
}

const capped = sandbox.selectGrTaxTargets(evs, prev, now, { full: false });
assert.ok(capped.taxTargets.length <= 500, 'healthy auto-sync stays capped');
assert.strictEqual(capped.missingCount, 600);
assert.strictEqual(capped.taxTargets.filter(e => String(e.id).startsWith('wiped')).length, 450);

const full = sandbox.selectGrTaxTargets(evs, prev, now, { full: true });
assert.strictEqual(full.taxTargets.length, 800, 'full pull takes every paid stay');
assert.strictEqual(full.taxTargets.filter(e => String(e.id).startsWith('wiped')).length, 600, 'full pull includes the whole wiped backlog');
assert.ok(full.taxTargets.slice(0, 600).every(e => String(e.id).startsWith('wiped')), 'full pull still does missing first');

// Failed fetch must not write zeros over stored tax, and must keep wiped zeros
// until a successful GET (so the next full pull still sees them as missing).
const bookings = [
  { id: 'kept', ct: 0, vat: 0, at: 0, bvPrevat: 0 },
  { id: 'wiped1', ct: 0, vat: 0, at: 0, bvPrevat: 0 },
  { id: 'fresh', ct: 0, vat: 0, at: 0, bvPrevat: 0 },
];
const prevBks = {
  kept: { id: 'kept', ct: 64, vat: 10, at: 2, bvPrevat: 200, nbv: 124, trHost: 76, grTaxOk: true },
  wiped1: { id: 'wiped1', ct: 0, vat: 0, at: 0, bvPrevat: 0 },
};
const grTaxMap = { fresh: { climate_tax: 8 } };
sandbox.applyStoredGrTaxes(bookings, prevBks, grTaxMap);
assert.strictEqual(bookings[0].ct, 64, 'unfetched stay keeps previous climate tax');
assert.strictEqual(bookings[0].grTaxOk, true);
assert.strictEqual(bookings[1].ct, 0, 'wiped stay stays 0 until a successful fetch');
assert.ok(!bookings[1].grTaxOk, 'wiped stay is not marked fetched');
assert.strictEqual(bookings[2].grTaxOk, true, 'successful fetch is marked even if mapping already wrote ct');

const merged = sandbox.mergeGrTaxIntoExisting(
  [{ id: 'a', ct: 0 }, { id: 'b', ct: 16, grTaxOk: true }],
  [{ id: 'a', ct: 24, vat: 1, at: 0, bvPrevat: 80, nbv: 55, trHost: 25, grTaxOk: true }]
);
assert.strictEqual(merged[0].ct, 24, 'flagged auto-sync merges new taxes into existing rows');
assert.strictEqual(merged[1].ct, 16, 'untouched rows stay');

const flagged = sandbox.hosthubSyncMetaPatch({}, {
  syncFailed: { reason: 'tax_rate_limited', detail: '429' },
  taxBacklog: 5624,
  taxFetched: 12,
  taxAttempted: 500,
  taxRateLimited: true,
  full: false,
}, '2026-08-27T20:00:00.000Z', 'auto');
assert.strictEqual(flagged.hosthubSyncFailed, true);
assert.strictEqual(flagged.hosthubSyncFailedReason, 'tax_rate_limited');
assert.strictEqual(flagged.hosthubTaxBacklog, 5624);

const cleared = sandbox.hosthubSyncMetaPatch(flagged, {
  taxBacklog: 0,
  taxFetched: 5624,
  taxAttempted: 5624,
  full: true,
}, '2026-08-27T21:00:00.000Z', 'full');
assert.ok(!cleared.hosthubSyncFailed, 'full pull with empty backlog clears the flag');
assert.strictEqual(cleared.lastTaxSync, '2026-08-27T21:00:00.000Z');

const keep = sandbox.hosthubSyncMetaPatch(flagged, {
  taxBacklog: 5200,
  taxFetched: 450,
  full: false,
}, '2026-08-27T20:15:00.000Z', 'auto');
assert.strictEqual(keep.hosthubSyncFailed, true, 'capped cycle does not clear the flag while backlog remains');
assert.strictEqual(keep.hosthubTaxBacklog, 5200);

console.log('hosthub-sync-recovery OK: full pull', full.taxTargets.length, 'paid; flag', flagged.hosthubSyncFailedReason, '→ cleared', !cleared.hosthubSyncFailed);
