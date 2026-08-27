'use strict';
/**
 * Hosthub Greek-tax target selection: missing/wiped stays fill the 500 cap
 * before recent stays that already have tax data. Mirrors selectGrTaxTargets
 * in srv/patches-107.json (full-pull / failed-run flag live in SRV 108).
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
assert(srv.includes('function selectGrTaxTargets('), 'helper landed');
assert(srv.includes('missing-first cap'), 'missing-first log landed');
assert(srv.includes('retry budget is per page'), 'per-page 429 reset landed');
assert(!srv.includes('const taxTargets = needTax.slice(0, 500);'), 'starving slice removed');

const fn = extractFn(srv, 'hasStoredGrTax') + '\n' + extractFn(srv, 'selectGrTaxTargets');
const sandbox = { selectGrTaxTargets: null, hasStoredGrTax: null };
vm.runInNewContext(fn + '\nhasStoredGrTax = hasStoredGrTax;\nselectGrTaxTargets = selectGrTaxTargets;', sandbox);
const select = sandbox.selectGrTaxTargets;

const paid = (id, dateTo) => ({
  id,
  date_to: dateTo,
  guest_paid: { cents: 10000, currency: 'EUR' },
});
const free = (id, dateTo) => ({ id, date_to: dateTo, guest_paid: { cents: 0, currency: 'EUR' } });
const now = Date.parse('2026-08-27T12:00:00Z');

// Reproduce the 22 Aug starvation: future already-taxed stays + unpaid
// preparations (date_to in 2027) fill a newest-first 500 cap, so wiped
// August revenue stays never get fetched.
const evs = [];
const prev = {};
for (let i = 0; i < 200; i++) {
  const id = 'future' + i;
  evs.push(paid(id, '2026-09-' + String((i % 28) + 1).padStart(2, '0')));
  prev[id] = { id, ct: 8, bvPrevat: 100 };
}
for (let i = 0; i < 400; i++) {
  const id = 'wiped' + i;
  evs.push(paid(id, '2026-08-' + String((i % 27) + 1).padStart(2, '0')));
  prev[id] = { id, ct: 0, vat: 0, at: 0, bvPrevat: 0 };
}
for (let i = 0; i < 400; i++) evs.push(free('prep' + i, '2027-01-01'));

const old = (() => {
  const hasTaxData = b => !!(b && ((+b.ct || 0) || (+b.vat || 0) || (+b.at || 0) || (+b.bvPrevat || 0)));
  const taxCutoff = new Date(now - 90 * 86400 * 1000).toISOString().slice(0, 10);
  const needTax = evs.filter(ev => {
    const p = prev[ev.id];
    if (!p || !hasTaxData(p)) return true;
    return String(ev.date_to || '') >= taxCutoff;
  });
  needTax.sort((a, b) => String(b.date_to || '').localeCompare(String(a.date_to || '')));
  return needTax.slice(0, 500);
})();
assert.strictEqual(old.filter(e => String(e.id).startsWith('wiped')).length, 0, 'old cap took zero wiped August stays');
assert.strictEqual(old.filter(e => String(e.id).startsWith('prep')).length, 400, 'old cap spent 400 slots on unpaid 2027 preparations');
assert.strictEqual(old.filter(e => String(e.id).startsWith('future')).length, 100, 'old cap filled the rest with already-taxed future stays');

const { taxTargets, missingCount, refreshCount } = select(evs, prev, now);
assert.strictEqual(missingCount, 400, '400 paid wiped stays are the backlog');
assert.strictEqual(refreshCount, 200, '200 already-taxed recent stays are refresh-only');
assert.ok(taxTargets.length <= 500, 'never exceeds the 500 cap');
const wiped = taxTargets.filter(e => String(e.id).startsWith('wiped')).length;
const future = taxTargets.filter(e => String(e.id).startsWith('future')).length;
const preps = taxTargets.filter(e => String(e.id).startsWith('prep')).length;
assert.strictEqual(preps, 0, '€0 preparations do not consume tax slots');
assert.strictEqual(wiped, 400, 'missing-first fetches every wiped paid stay before idling');
assert.strictEqual(future, 50, 'at most 50 slots refresh stays that already have tax');
assert.ok(taxTargets.slice(0, 400).every(e => String(e.id).startsWith('wiped')), 'wiped stays are fetched first');

// When the backlog is larger than the cap, still leave 50 refresh slots.
const big = [];
const bigPrev = {};
for (let i = 0; i < 80; i++) {
  const id = 'r' + i;
  big.push(paid(id, '2026-09-10'));
  bigPrev[id] = { id, ct: 16, bvPrevat: 80 };
}
for (let i = 0; i < 600; i++) {
  const id = 'm' + i;
  big.push(paid(id, '2026-07-15'));
  bigPrev[id] = { id, ct: 0 };
}
const bigSel = select(big, bigPrev, now);
assert.strictEqual(bigSel.taxTargets.length, 500, 'full cap when backlog is huge');
assert.strictEqual(bigSel.taxTargets.filter(e => String(e.id).startsWith('m')).length, 450, '450 missing');
assert.strictEqual(bigSel.taxTargets.filter(e => String(e.id).startsWith('r')).length, 50, '50 refresh');

console.log('hosthub-tax-targets OK: missing-first sends', wiped, 'wiped +', future, 'refresh; old cap sent', old.filter(e => String(e.id).startsWith('wiped')).length, 'wiped');
