'use strict';
/**
 * Monthly Close / owner email must not continue when a private or B2B
 * apartment has no linked Oxygen contact (the ΑΠΥ/ΤΠΥ is then not issued).
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function extractFn(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unclosed function ' + name);
}

const fe = applyKind('fe');
assert.strictEqual(fe.last, 'patches-144.json', 'FE 144 is the tip');
assert(fe.src.includes('function mcOxyMissing(a)'), 'helper present');
assert(fe.src.includes('The invoice is not issued, so the email was not sent.'), 'send aborts');
assert(fe.src.includes("key !== 'receipt' && key !== 'invoice'"), 'manual tick ignored for invoice');
assert(fe.src.includes('Link Oxygen contact'), 'focus card blocked action');
assert(fe.src.includes('mcOpenCfg'), 'opens Configuration');
assert(
  !fe.src.includes("Link a Fiscal contact (Oxygen) in Config to issue the ' + _label + '.;"),
  'old warn-and-continue note gone'
);
assert(fe.src.includes("if (batchStage === 'receipt' || batchStage === 'invoice')"), 'batch clear blocked');
assert(
  fe.src.includes("if (key === 'email') {\n      if (mcOxyMissing(a)) { toast(mcOxyBlockMsg(a), 'err'); save(); renderMt(); return; }"),
  'email pill blocked without contact'
);

const ctx = {
  S: {
    apts: [
      { id: 'p1', name: 'Skyline', profile: 'private', oxyContactId: '' },
      { id: 'p2', name: 'Horizon', profile: 'leased', oxyContactId: '' },
      { id: 'p3', name: 'Cozy', profile: 'b2b', oxyContactId: 'c-1' },
      { id: 'p4', name: 'Veranda 1', profile: 'b2b', oxyContactId: '' },
      { id: 'p5', name: 'Veranda 2', profile: 'b2b', oxyContactId: 'c-2' },
    ],
  },
  toast: function () {},
  showTab: function () {},
};
vm.runInNewContext(extractFn(fe.src, 'mcOxyMissing'), ctx);

assert.strictEqual(ctx.mcOxyMissing({ id: 'p1', type: 'private' }), 'Skyline', 'private without contact is blocked');
assert.strictEqual(ctx.mcOxyMissing({ id: 'p2', type: 'leased' }), '', 'leased does not need a contact');
assert.strictEqual(ctx.mcOxyMissing({ id: 'p3', type: 'b2b' }), '', 'b2b with a contact is fine');
assert.strictEqual(
  ctx.mcOxyMissing({ id: 'p4', type: 'b2b', members: ['p4', 'p5'] }),
  'Veranda 1',
  'group is blocked when any member lacks a contact'
);
assert.strictEqual(
  ctx.mcOxyMissing({ id: 'p3', type: 'b2b', members: ['p3', 'p5'] }),
  '',
  'group is fine when every member that needs a document is linked'
);

console.log('oxy-contact-gate.test.js: ok');
