'use strict';
/**
 * Configuration Fiscal contact (Oxygen): clicking a search hit must link
 * the contact even while the search input is still focused.
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

function extractAssignFn(source, name) {
  const start = source.indexOf('window.' + name + '=function');
  assert(start >= 0, 'missing window.' + name);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 2);
  }
  throw new Error('unclosed window.' + name);
}

const fe = applyKind('fe');
assert.strictEqual(fe.last, 'patches-145.json', 'FE 145 is the tip');
assert(fe.src.includes("f==='oxyContactId'||f==='oxyContactName'"), 'setApt skips rebuild for oxygen fields');
assert(fe.src.includes('event.preventDefault();_oxyPick('), 'mousedown preventDefault');
assert(fe.src.includes('window._oxyPicking=true'), 'pick flag');
assert(fe.src.includes('a.oxyContactId=cid; a.oxyContactName=nm;'), 'direct write');
assert(
  !fe.src.includes("if(typeof setApt==='function'){ setApt(aptId,'oxyContactId',id); setApt(aptId,'oxyContactName',nm);} var res=document.getElementById('oxy-res-'+aptId); if(res)res.style.display='none'; if(typeof renderCfg==='function')renderCfg();"),
  'old pick-via-setApt-while-focused path is gone'
);

const apt = { id: 'v1uwni2', name: 'P & G Apartment', oxyContactId: '', oxyContactName: '' };
let rendered = 0;
const els = {
  'oxy-res-v1uwni2': { style: { display: 'block' }, value: '' },
  'oxy-in-v1uwni2': { style: {}, value: 'pan', blur: function () { this.blurred = true; } },
};
const ctx = {
  window: { _oxyContacts: [{ id: 4412, name: 'Owner Example' }], _oxyPicking: false },
  S: { apts: [apt] },
  document: { getElementById: function (id) { return els[id] || null; } },
  toast: function () {},
  save: function () { ctx.saved = true; },
  renderCfg: function () { rendered++; },
  setTimeout: function (fn) { fn(); },
};
ctx.window._oxyContacts = ctx.window._oxyContacts;
vm.runInNewContext(extractAssignFn(fe.src, '_oxyPick'), ctx);

ctx.window._oxyPick('v1uwni2', 4412);
assert.strictEqual(String(apt.oxyContactId), '4412', 'id is stored');
assert.strictEqual(apt.oxyContactName, 'Owner Example', 'name is stored');
assert.strictEqual(ctx.saved, true, 'save scheduled');
assert.strictEqual(rendered, 1, 'Configuration refreshes after the pick');
assert.strictEqual(els['oxy-in-v1uwni2'].value, 'Owner Example', 'search box shows the linked name');
assert.strictEqual(els['oxy-in-v1uwni2'].blurred, true, 'search box blurs so renderCfg is allowed');

// setApt must find the apartment when the id is a string vs number
const setCtx = {
  S: { apts: [{ id: 'aa', name: 'X' }] },
  save: function () {},
  renderCfg: function () { setCtx.n = (setCtx.n || 0) + 1; },
};
vm.runInNewContext(extractFn(fe.src, 'setApt'), setCtx);
setCtx.setApt('aa', 'mgmtFee', 12);
assert.strictEqual(setCtx.S.apts[0].mgmtFee, 12, 'setApt matches string ids');
setCtx.setApt('aa', 'oxyContactId', '99');
assert.strictEqual(setCtx.n, 1, 'oxygen fields do not rebuild Configuration');

console.log('oxy-fiscal-pick.test.js: ok');
