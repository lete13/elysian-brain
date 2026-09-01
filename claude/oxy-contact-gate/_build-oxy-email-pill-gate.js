'use strict';
/**
 * Build fe/patches-144.json:
 * Clicking Email / Mark done still opened the report compose when the Oxygen
 * contact was missing. Block that path the same way as Receipt/Invoice.
 * Run: node scripts/_build-oxy-email-pill-gate.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyKind(kind, untilName) {
  const baseName = kind === 'fe' ? 'index.html' : 'server.js';
  let src = fs.readFileSync(path.join(root, baseName), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (name === untilName) break;
    const file = path.join(root, kind, name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (spec.baseSha256 && sha256(src) !== spec.baseSha256) throw new Error(kind + '/' + name + ' base drift');
    for (const p of spec.patches || []) {
      const parts = src.split(p.find);
      if (parts.length - 1 !== (p.count || 1)) throw new Error(kind + '/' + name + ' anchor: ' + p.note);
      src = parts.join(p.replace);
    }
    if (spec.expectedSha256 && sha256(src) !== spec.expectedSha256) throw new Error(kind + '/' + name + ' expected sha');
  }
  return src;
}

function writePatch(kind, filename, src, patches, builtAt, assertions) {
  let out = src;
  for (const [i, p] of patches.entries()) {
    const parts = out.split(p.find);
    if (parts.length - 1 !== (p.count || 1)) {
      throw new Error(kind + ' patch ' + (i + 1) + ' (' + p.note + '): anchor count ' + (parts.length - 1));
    }
    out = parts.join(p.replace);
  }
  const cfg = {
    baseSha256: sha256(src),
    expectedSha256: sha256(out),
    builtAt: builtAt,
    patches: patches,
    assertions: assertions,
  };
  fs.writeFileSync(path.join(root, kind, filename), JSON.stringify(cfg, null, 1) + '\n');
  console.log('wrote', kind + '/' + filename, cfg.expectedSha256);
  return out;
}

const feSrc = applyKind('fe', 'patches-144.json');

writePatch(
  'fe',
  'patches-144.json',
  feSrc,
  [
    {
      note: 'Email pill: do not open Send email when the Oxygen contact is missing',
      find: '    // Email is not a checkbox - it is the action that sends and issues the document.\n    if (key === \'email\') { save(); mcOpenReport(id, true); return; }',
      replace: '    // Email is not a checkbox - it is the action that sends and issues the document.\n    if (key === \'email\') {\n      if (mcOxyMissing(a)) { toast(mcOxyBlockMsg(a), \'err\'); save(); renderMt(); return; }\n      save(); mcOpenReport(id, true); return;\n    }',
      count: 1,
    },
    {
      note: 'Mark done / list Send email: do not open the report when the Oxygen contact is missing',
      find: '    if (key === \'email\') { save(); mcOpenReport(id, true); return; }\n    // Report cannot be ticked from here - it has to be confirmed on the report itself.',
      replace: '    if (key === \'email\') {\n      if (mcOxyMissing(a)) { toast(mcOxyBlockMsg(a), \'err\'); save(); renderMt(); return; }\n      save(); mcOpenReport(id, true); return;\n    }\n    // Report cannot be ticked from here - it has to be confirmed on the report itself.',
      count: 1,
    },
  ],
  '2026-09-01 Email/Mark done also blocked when Oxygen contact is missing',
  [
    { has: 'if (key === \'email\') {\n      if (mcOxyMissing(a)) { toast(mcOxyBlockMsg(a), \'err\'); save(); renderMt(); return; }', note: 'email continue blocked without contact' },
  ]
);
