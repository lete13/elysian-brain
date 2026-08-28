'use strict';
/**
 * P4 same-address business tax (FE 142 / SRV 109).
 * Only Votsala 1 and Horizon carry the flag; other units in those buildings
 * are exempt. Other leased apartments still require their own flag.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => require('crypto').createHash('sha256').update(s).digest('hex');

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
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('unclosed function ' + name);
}

const fe = applyKind('fe');
const srv = applyKind('srv');
assert.strictEqual(fe.last, 'patches-142.json', 'FE 142 is the tip of the chain');
assert.strictEqual(srv.last, 'patches-109.json', 'SRV 109 is the tip of the chain');
assert(srv.src.includes('cn <= 142'), 'FE 142 is in the server bootstrap');
assert(fe.src.includes('function sameAddressBtCarrier(a)'), 'carrier helper is in the effective frontend');
assert(fe.src.includes('businessTax (designated carrier)'), 'carriers get an explicit P4 line');
assert(fe.src.includes("label:'Votsala 1'"), 'Votsala 1 is the named Votsala carrier');
assert(fe.src.includes("label:'Horizon'"), 'Horizon is the named Lycabettus carrier');

const fe142 = JSON.parse(fs.readFileSync(path.join(root, 'fe', 'patches-142.json'), 'utf8'));
const fe141 = JSON.parse(fs.readFileSync(path.join(root, 'fe', 'patches-141.json'), 'utf8'));
assert.strictEqual(fe142.baseSha256, fe141.expectedSha256, 'FE 142 continues FE 141');
const srv109 = JSON.parse(fs.readFileSync(path.join(root, 'srv', 'patches-109.json'), 'utf8'));
const srv108 = JSON.parse(fs.readFileSync(path.join(root, 'srv', 'patches-108.json'), 'utf8'));
assert.strictEqual(srv109.baseSha256, srv108.expectedSha256, 'SRV 109 continues SRV 108');

const helpers = [
  extractFn(fe.src, 'sameAddressBtGroup'),
  extractFn(fe.src, 'sameAddressBtCarrier'),
  extractFn(fe.src, 'sameAddressBtCovered'),
].join('\n');
const box = {};
vm.runInNewContext(
  helpers +
    '\nsameAddressBtGroup = sameAddressBtGroup;\nsameAddressBtCarrier = sameAddressBtCarrier;\nsameAddressBtCovered = sameAddressBtCovered;',
  box
);

assert.strictEqual(box.sameAddressBtCarrier({ name: 'Votsala 1 Luxury Stay with Patio' }), 'votsala');
assert.strictEqual(box.sameAddressBtCarrier({ name: 'Votsala 2 Luxury Stay with Patio' }), '');
assert.strictEqual(box.sameAddressBtCarrier({ name: 'Votsala 10 Deluxe' }), '', 'Votsala 10 is not Votsala 1');
assert.strictEqual(box.sameAddressBtCarrier({ name: 'Elysian Lycabettus - Horizon' }), 'lycabettus-hpr');
assert.strictEqual(box.sameAddressBtCarrier({ name: 'Elysian Lycabettus - Panorama' }), '', 'Panorama is not a carrier');
assert.strictEqual(box.sameAddressBtCarrier({ name: 'Elysian Lycabettus Resilience' }), '', 'Resilience is not a carrier');
assert.strictEqual(box.sameAddressBtGroup({ name: 'Elysian Lycabettus - Panorama' }), 'lycabettus-hpr');
assert.strictEqual(box.sameAddressBtGroup({ name: 'Elysian Lycabettus Ressilience' }), 'lycabettus-hpr');
assert.strictEqual(box.sameAddressBtGroup({ name: 'Horizon Test Apt' }), '');
assert.strictEqual(box.sameAddressBtGroup({ name: 'Birdhouse Apartment' }), '');

const policy = [
  { name: 'Votsala 1 Luxury Stay with Patio', profile: 'leased', businessTax: true },
  { name: 'Votsala 2 Luxury Stay with Patio', profile: 'leased', businessTax: false },
  { name: 'Votsala 5 Luxury Studio with Balcony in Piraeus', profile: 'leased', businessTax: false },
  { name: 'Elysian Lycabettus - Horizon', profile: 'leased', businessTax: true },
  { name: 'Elysian Lycabettus - Panorama', profile: 'leased', businessTax: false },
  { name: 'Elysian Lycabettus Resilience', profile: 'leased', businessTax: false },
  { name: 'Birdhouse Apartment', profile: 'leased', businessTax: true },
  { name: 'Acropolis Skyline Sunset', profile: 'private', businessTax: false },
];

assert.strictEqual(box.sameAddressBtCovered(policy[1], policy), true, 'Votsala 2 is covered by Votsala 1');
assert.strictEqual(box.sameAddressBtCovered(policy[4], policy), true, 'Panorama is covered by Horizon');
assert.strictEqual(box.sameAddressBtCovered(policy[5], policy), true, 'Resilience is covered by Horizon');
assert.strictEqual(box.sameAddressBtCovered(policy[6], policy), false, 'Birdhouse is not in a same-address group');

function runP4(apts) {
  const results = [];
  function assertEq(name, actual, expected) {
    results.push({ name, pass: actual === expected, actual, expected });
  }
  const leasedApts = apts.filter(function (a) { return a.profile === 'leased'; });
  leasedApts.forEach(function (a) {
    const name = a.name.slice(0, 20);
    if (box.sameAddressBtCarrier(a)) {
      assertEq('P4 ' + name + ' businessTax (designated carrier)', a.businessTax, true);
    } else if (!box.sameAddressBtGroup(a)) {
      assertEq('P4 ' + name + ' businessTax', a.businessTax, true);
    }
  });
  [
    { key: 'votsala', label: 'Votsala 1' },
    { key: 'lycabettus-hpr', label: 'Horizon' },
  ].forEach(function (g) {
    const members = leasedApts.filter(function (a) { return box.sameAddressBtGroup(a) === g.key; });
    if (!members.length) return;
    const carriers = members.filter(box.sameAddressBtCarrier);
    assertEq('P4 ' + g.label + ' designated carrier present', carriers.length > 0, true);
    assertEq('P4 ' + g.label + ' carries businessTax', carriers.some(function (a) { return !!a.businessTax; }), true);
  });
  return results;
}

const passPolicy = runP4(policy);
assert(passPolicy.every((r) => r.pass), 'policy P4 all pass:\n' + JSON.stringify(passPolicy.filter((r) => !r.pass), null, 2));
assert.strictEqual(passPolicy.filter((r) => /Votsala 2/.test(r.name)).length, 0, 'Votsala 2 has no individual P4');
assert.strictEqual(passPolicy.filter((r) => /Panorama/.test(r.name)).length, 0, 'Panorama has no individual P4');
assert.strictEqual(passPolicy.filter((r) => /Resilience/.test(r.name)).length, 0, 'Resilience has no individual P4');
assert(passPolicy.some((r) => /Votsala 1/.test(r.name) && /carrier/.test(r.name) && r.pass));
assert(passPolicy.some((r) => r.name === 'P4 Horizon carries businessTax' && r.pass));
assert(passPolicy.some((r) => /Birdhouse/.test(r.name) && r.pass));

const votsala2Only = policy.map((a) => {
  if (/votsala\s*1\b/i.test(a.name)) return Object.assign({}, a, { businessTax: false });
  if (/votsala\s*2\b/i.test(a.name)) return Object.assign({}, a, { businessTax: true });
  return a;
});
const failWrongVotsala = runP4(votsala2Only);
assert(failWrongVotsala.some((r) => /Votsala 1/.test(r.name) && !r.pass), 'Votsala 2 having the flag does not cover a missing Votsala 1');

const panoramaOnly = policy.map((a) => {
  if (/\bhorizon\b/i.test(a.name)) return Object.assign({}, a, { businessTax: false });
  if (/\bpanorama\b/i.test(a.name)) return Object.assign({}, a, { businessTax: true });
  return a;
});
const failWrongHpr = runP4(panoramaOnly);
assert(failWrongHpr.some((r) => /Horizon/.test(r.name) && !r.pass), 'Panorama having the flag does not cover a missing Horizon');

const birdOff = policy.map((a) => (/Birdhouse/.test(a.name) ? Object.assign({}, a, { businessTax: false }) : a));
assert(runP4(birdOff).some((r) => /Birdhouse/.test(r.name) && !r.pass), 'ungrouped leased still fails without its own flag');

console.log('p4-same-address-bt: ok');
