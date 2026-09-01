'use strict';
/**
 * Monthly Close: an apartment marked Not needed this month counts as
 * sent/complete in the month total and progress bar.
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyKind(kind) {
  const baseName = kind === 'fe' ? 'index.html' : 'server.js';
  let src = fs.readFileSync(path.join(root, baseName), 'utf8').replace(/\r\n/g, '\n');
  let sha = sha256(src);
  let last = 'base';
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    const file = path.join(root, kind, name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.strictEqual(spec.baseSha256, sha, kind + '/' + name + ' continues the chain');
    for (const [i, p] of (spec.patches || []).entries()) {
      const count = src.split(p.find).length - 1;
      assert.strictEqual(count, p.count || 1, kind + '/' + name + ' patch ' + (i + 1) + ' (' + p.note + ')');
      src = src.split(p.find).join(p.replace);
    }
    sha = sha256(src);
    assert.strictEqual(sha, spec.expectedSha256, kind + '/' + name + ' hash');
    last = name;
  }
  return { src, sha, last };
}

const fe = applyKind('fe');
assert.strictEqual(fe.last, 'patches-146.json', 'FE 146 is the tip');
assert(fe.src.includes("(typeof mcSkipped === 'function' && mcSkipped(a.id)) || nextIdx(a)"), 'complete includes skipped');
assert(fe.src.includes('if (mcSkipped(a.id)) skipN += n;   // still shown as not needed'), 'skip chip still tallied');
assert(!fe.src.includes('if (mcSkipped(a.id)) { skipN += n; return; }'), 'skipped no longer leave the sent count');
assert(fe.src.includes('var _need = tot;   // skipped apartments count as sent/complete'), 'progress uses the full month');
assert(fe.src.includes("' + (tot - done - doing) + ' not started</span>'"), 'not-started is not double-subtracted');
assert(fe.src.includes("statusFilter === 'todo' && (started(a) || complete(a))"), 'list Not started excludes complete');

// Same tally the header uses: skipped increment skipN and, via complete(), done.
function tally(rows) {
  let done = 0, doing = 0, tot = 0, skipN = 0;
  const complete = (a) => !!a.skipped || !!a.sent;
  const started = (a) => !!a.started;
  rows.forEach(function (a) {
    const n = (a.members || [a.id]).length;
    tot += n;
    if (a.skipped) skipN += n;
    if (complete(a)) done += n;
    else if (started(a)) doing += n;
  });
  const need = tot;
  const pct = need ? Math.round(done / need * 100) : 0;
  const notStarted = tot - done - doing;
  return { done, doing, tot, skipN, need, pct, notStarted };
}

const month = tally([
  { id: 'a', sent: true },
  { id: 'b', sent: true },
  { id: 'c', started: true },
  { id: 'd' },
  { id: 'e', skipped: true },
  { id: 'f', skipped: true, members: ['f1', 'f2'] },
]);
assert.strictEqual(month.tot, 7, 'group members count');
assert.strictEqual(month.skipN, 3, 'two skipped units, one of them a 2-member group');
assert.strictEqual(month.done, 5, '2 sent + 3 not-needed = 5 complete');
assert.strictEqual(month.doing, 1, 'one in progress');
assert.strictEqual(month.notStarted, 1, 'one not started');
assert.strictEqual(month.pct, 71, '5/7 → 71%');
assert.strictEqual(month.need, month.tot, 'denominator is every apartment');

const allSkip = tally([
  { id: 'x', skipped: true },
  { id: 'y', skipped: true },
]);
assert.strictEqual(allSkip.done, 2, 'all not-needed → all complete');
assert.strictEqual(allSkip.pct, 100, 'month is 100% when every unit is not-needed');

console.log('mc-skip-counts-complete.test.js: ok');
