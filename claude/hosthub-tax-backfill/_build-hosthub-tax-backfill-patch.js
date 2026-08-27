'use strict';
/**
 * SRV 107: Hosthub Greek-tax fetch prefers the wiped/missing backlog so climate
 * tax (TAKK) drains across 15-minute cycles instead of starving behind future
 * stays that already have tax data. Also resets fetchPages 429 retries per page.
 * Run: node scripts/_build-hosthub-tax-backfill-patch.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sha = (s) => crypto.createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex');

function applySrv(stopAt) {
  let src = fs.readFileSync(path.join(root, 'server.js'), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (stopAt && name === stopAt) break;
    const p = path.join(root, 'srv', name);
    if (!fs.existsSync(p)) break;
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const patch of cfg.patches || []) {
      const count = src.split(patch.find).length - 1;
      if (count !== (patch.count || 1)) throw new Error('miss ' + name + ' :: ' + patch.note + ' x' + count);
      src = src.split(patch.find).join(patch.replace);
    }
  }
  return src;
}

const src = applySrv('patches-107.json');
const base = sha(src);

const helperFind = '// ── Core sync function (shared by HTTP endpoint + auto-scheduler) ─────────────\nasync function runSync(apiKey, onLog) {';
const helperReplace = `function selectGrTaxTargets(bookingEvs, prevBkById, nowMs) {
  const hasTaxData = b => !!(b && ((+b.ct || 0) || (+b.vat || 0) || (+b.at || 0) || (+b.bvPrevat || 0)));
  const money = v => (v && typeof v === 'object') ? (v.cents || 0) / 100 : (parseFloat(v || 0) || 0);
  const paid = ev => (money(ev.total_price) || money(ev.guest_paid) || money(ev.total_reservation_price) || money(ev.booking_value)) > 0;
  const taxCutoff = new Date((nowMs != null ? nowMs : Date.now()) - 90 * 86400 * 1000).toISOString().slice(0, 10);
  const byDateDesc = (a, b) => String(b.date_to || '').localeCompare(String(a.date_to || ''));
  const missing = (bookingEvs || []).filter(ev => paid(ev) && (!prevBkById[ev.id] || !hasTaxData(prevBkById[ev.id])));
  const refresh = (bookingEvs || []).filter(ev => paid(ev) && prevBkById[ev.id] && hasTaxData(prevBkById[ev.id]) && String(ev.date_to || '') >= taxCutoff);
  missing.sort(byDateDesc);
  refresh.sort(byDateDesc);
  // Missing-first: the 22 Aug rate-limit wipe left ct=0 on ~98% of stays. Sorting
  // all 90-day bookings by date_to filled the 500 cap with future stays that
  // already had tax, so the backlog never drained. Keep a small refresh slice
  // for Hosthub revisions; spend the rest of the cap on zeros.
  const refreshTake = refresh.slice(0, 50);
  const missingTake = missing.slice(0, Math.max(0, 500 - refreshTake.length));
  return { taxTargets: missingTake.concat(refreshTake), missingCount: missing.length, refreshCount: refresh.length };
}

// ── Core sync function (shared by HTTP endpoint + auto-scheduler) ─────────────
async function runSync(apiKey, onLog) {`;

const selectFind = `  const taxCutoff = new Date(Date.now() - 90 * 86400 * 1000).toISOString().slice(0, 10);
  const needTax = bookingEvs.filter(ev => {
    const prev = prevBkById[ev.id];
    if (!prev || !hasTaxData(prev)) return true;
    return String(ev.date_to || '') >= taxCutoff;
  });
  needTax.sort((a, b) => String(b.date_to || '').localeCompare(String(a.date_to || '')));
  const taxTargets = needTax.slice(0, 500);
  log(\`Fetching Greek taxes for \${taxTargets.length}/\${bookingEvs.length} bookings (rest reuse stored values)…\`);`;

const selectReplace = `  const { taxTargets, missingCount, refreshCount } = selectGrTaxTargets(bookingEvs, prevBkById);
  log(\`Fetching Greek taxes for \${taxTargets.length}/\${bookingEvs.length} bookings (\${missingCount} missing in backlog, \${refreshCount} recent refresh, missing-first cap)…\`);`;

const retryFind = `    if (obj._err) { console.error(\`fetchPages HTTP \${obj.status}\`); break; }
    const items = obj.data || [];`;
const retryReplace = `    if (obj._err) { console.error(\`fetchPages HTTP \${obj.status}\`); break; }
    retries = 0; // retry budget is per page, not per fetchPages call
    const items = obj.data || [];`;

const patches = [
  {
    note: 'selectGrTaxTargets prefers wiped/missing climate-tax stays',
    find: helperFind,
    replace: helperReplace,
    count: 1,
  },
  {
    note: 'Tax fetch uses missing-first cap instead of newest-checkout sort',
    find: selectFind,
    replace: selectReplace,
    count: 1,
  },
  {
    note: 'fetchPages 429 retry budget resets after each successful page',
    find: retryFind,
    replace: retryReplace,
    count: 1,
  },
];

let out = src;
for (const p of patches) {
  const n = out.split(p.find).length - 1;
  if (n !== p.count) throw new Error('anchor ' + p.note + ' found ' + n + 'x');
  out = out.split(p.find).join(p.replace);
}

const spec = {
  baseSha256: base,
  expectedSha256: sha(out),
  builtAt: '2026-08-27 Hosthub tax fetch: missing-first cap so the TAKK backlog drains',
  patches,
  assertions: [
    { has: 'function selectGrTaxTargets(', note: 'tax target helper exists' },
    { has: 'missing-first cap', note: 'log names the missing-first policy' },
    { has: 'retry budget is per page', note: '429 retries reset per page' },
    { hasNot: 'const taxTargets = needTax.slice(0, 500);', note: 'starving newest-first slice is gone' },
  ],
};

fs.writeFileSync(path.join(root, 'srv', 'patches-107.json'), JSON.stringify(spec, null, 1) + '\n');
console.log('wrote srv/patches-107.json');
console.log('base', spec.baseSha256);
console.log('expected', spec.expectedSha256);
console.log('bytes', Buffer.byteLength(out));
