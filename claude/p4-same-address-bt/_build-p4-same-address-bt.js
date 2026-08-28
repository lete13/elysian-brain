'use strict';
/**
 * FE 142 + SRV 109: Run Tests P4 (leased ⇒ businessTax). Same-address
 * buildings share one levy. Designated carriers: Votsala 1 and Horizon.
 * Votsala 2–8, Panorama and Resilience are exempt.
 * Run: node scripts/_build-p4-same-address-bt.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyChain(kind, untilName) {
  const baseName = kind === 'fe' ? 'index.html' : 'server.js';
  let src = fs.readFileSync(path.join(root, baseName), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (name === untilName) break;
    const file = path.join(root, kind, name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (spec.baseSha256 && sha256(src) !== spec.baseSha256) {
      throw new Error(kind + '/' + name + ' base drift');
    }
    for (const p of spec.patches || []) {
      const parts = src.split(p.find);
      if (parts.length - 1 !== (p.count || 1)) {
        throw new Error(kind + '/' + name + ' anchor: ' + p.note);
      }
      src = parts.join(p.replace);
    }
    if (spec.expectedSha256 && sha256(src) !== spec.expectedSha256) {
      throw new Error(kind + '/' + name + ' expected sha');
    }
  }
  return src;
}

const feFind = `  // ── TEST GROUP 5: Leased Profile invariants ───────────────────────────────
  // Any property with profile='leased' must have these flags set correctly
  if (typeof S !== 'undefined' && S.apts) {
    const leasedApts = S.apts.filter(function(a){ return a.profile === 'leased'; });
    leasedApts.forEach(function(a) {
      const name = a.name.slice(0,20);
      assertEq('P1 '+name+' deductCT',         a.deductCT,         true);
      assertEq('P2 '+name+' deductVAT',         a.deductVAT,        true);
      assertEq('P3 '+name+' municipalityTax',   a.municipalityTax,  true);
      assertEq('P4 '+name+' businessTax',       a.businessTax,      true);
      assertEq('P5 '+name+' vatOnFees=false',   a.vatOnFees,        false);
    });
    if (leasedApts.length === 0) {
      results.push({ name:'P1-P5 Leased profile (no leased properties configured)', pass:true, actual:'skip', expected:'skip' });
    }`;

const feReplace = `  // ── TEST GROUP 5: Leased Profile invariants ───────────────────────────────
  // Any property with profile='leased' must have these flags set correctly
  // P4 (businessTax): same-address buildings share one levy. Designated
  // carriers (must have the flag): Votsala 1, Elysian Lycabettus - Horizon.
  // Exempt: Votsala 2–8, Panorama, Resilience.
  function sameAddressBtGroup(a) {
    const n = String((a && a.name) || '').toLowerCase();
    if (/votsala/.test(n)) return 'votsala';
    if ((/\\bhorizon\\b/.test(n) || /\\bpanorama\\b/.test(n) || /res+ilience/.test(n))
        && /elysian|lycabettus/.test(n)) return 'lycabettus-hpr';
    return '';
  }
  function sameAddressBtCarrier(a) {
    const n = String((a && a.name) || '').toLowerCase();
    if (/votsala\\s*1\\b/.test(n)) return 'votsala';
    if (/\\bhorizon\\b/.test(n) && /elysian|lycabettus/.test(n)
        && !/panorama|res+ilience/.test(n)) return 'lycabettus-hpr';
    return '';
  }
  function sameAddressBtCovered(a, apts) {
    const g = sameAddressBtGroup(a);
    if (!g) return false;
    return (apts || []).some(function(x){ return sameAddressBtCarrier(x) === g && !!x.businessTax; });
  }
  if (typeof S !== 'undefined' && S.apts) {
    const leasedApts = S.apts.filter(function(a){ return a.profile === 'leased'; });
    leasedApts.forEach(function(a) {
      const name = a.name.slice(0,20);
      assertEq('P1 '+name+' deductCT',         a.deductCT,         true);
      assertEq('P2 '+name+' deductVAT',         a.deductVAT,        true);
      assertEq('P3 '+name+' municipalityTax',   a.municipalityTax,  true);
      if (sameAddressBtCarrier(a)) {
        assertEq('P4 '+name+' businessTax (designated carrier)', a.businessTax, true);
      } else if (!sameAddressBtGroup(a)) {
        assertEq('P4 '+name+' businessTax',     a.businessTax,      true);
      }
      assertEq('P5 '+name+' vatOnFees=false',   a.vatOnFees,        false);
    });
    const btGroups = [
      { key:'votsala', label:'Votsala 1' },
      { key:'lycabettus-hpr', label:'Horizon' }
    ];
    btGroups.forEach(function(g){
      const members = leasedApts.filter(function(a){ return sameAddressBtGroup(a) === g.key; });
      if (!members.length) return;
      const carriers = members.filter(sameAddressBtCarrier);
      assertEq('P4 '+g.label+' designated carrier present', carriers.length > 0, true);
      assertEq('P4 '+g.label+' carries businessTax', carriers.some(function(a){ return !!a.businessTax; }), true);
    });
    if (leasedApts.length === 0) {
      results.push({ name:'P1-P5 Leased profile (no leased properties configured)', pass:true, actual:'skip', expected:'skip' });
    }`;

const feSrc = applyChain('fe', 'patches-142.json');
const fePatches = [{
  note: 'P4 same-address groups: only Votsala 1 and Horizon carry businessTax',
  find: feFind,
  replace: feReplace,
  count: 1,
}];
let feOut = feSrc;
for (const [i, p] of fePatches.entries()) {
  const n = feOut.split(p.find).length - 1;
  if (n !== (p.count || 1)) throw new Error('FE patch ' + (i + 1) + ' found ' + n + 'x: ' + p.note);
  feOut = feOut.split(p.find).join(p.replace);
}
const feCfg = {
  baseSha256: sha256(feSrc),
  expectedSha256: sha256(feOut),
  builtAt: '2026-08-28 P4 same-address business tax: only Votsala 1 and Horizon carry the flag',
  patches: fePatches,
  assertions: [
    { has: 'function sameAddressBtCarrier(a)', note: 'designated-carrier helper exists' },
    { has: 'lycabettus-hpr', note: 'Horizon/Panorama/Resilience share one P4 group' },
    { has: "g.label+' carries businessTax", note: 'named carrier assertion' },
    { has: 'businessTax (designated carrier)', note: 'Votsala 1 and Horizon must have the flag' },
    { hasNot: "assertEq('P4 '+name+' businessTax',       a.businessTax,      true);", note: 'old per-apartment P4 is gone' },
  ],
};
fs.writeFileSync(path.join(root, 'fe', 'patches-142.json'), JSON.stringify(feCfg, null, 1) + '\n');
console.log('wrote fe/patches-142.json', feCfg.expectedSha256);

const srvSrc = applyChain('srv', 'patches-109.json');
const srvFind = '    for (let cn = 2; cn <= 141; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */ /* cn <= 140 */';
const srvReplace = '    for (let cn = 2; cn <= 142; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */ /* cn <= 140 */ /* cn <= 141 */';
const srvPatches = [{
  note: 'FE bootstrap through patches-142',
  find: srvFind,
  replace: srvReplace,
  count: 1,
}];
let srvOut = srvSrc;
for (const p of srvPatches) {
  const n = srvOut.split(p.find).length - 1;
  if (n !== p.count) throw new Error('SRV anchor found ' + n + 'x: ' + p.note);
  srvOut = srvOut.split(p.find).join(p.replace);
}
const srvCfg = {
  baseSha256: sha256(srvSrc),
  expectedSha256: sha256(srvOut),
  builtAt: '2026-08-28 FE bootstrap through patches-142 (P4 same-address business tax)',
  patches: srvPatches,
  assertions: [
    { has: 'cn <= 142', note: 'FE bootstrap includes 142' },
  ],
};
fs.writeFileSync(path.join(root, 'srv', 'patches-109.json'), JSON.stringify(srvCfg, null, 1) + '\n');
console.log('wrote srv/patches-109.json', srvCfg.expectedSha256);
