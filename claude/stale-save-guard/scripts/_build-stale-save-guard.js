'use strict';
/**
 * Build srv/patches-107.json + fe/patches-141.json:
 * reject a POST /api/db/data whose _baseSavedAt is missing or older than
 * the DB row. That is the 14 Aug Michalakopoulou class of bug (stale Daily
 * Ops tab last-write-wins over Configuration).
 *
 * Run from the elysian-clearing repo root:
 *   node scripts/_build-stale-save-guard.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyKind(kind, stopAt) {
  const baseName = kind === 'fe' ? 'index.html' : 'server.js';
  let src = fs.readFileSync(path.join(root, baseName), 'utf8').replace(/\r\n/g, '\n');
  let sha = sha256(src);
  let last = 'base';
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (stopAt && name === stopAt) break;
    const file = path.join(root, kind, name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (spec.baseSha256 !== sha) throw new Error(kind + '/' + name + ' base drift have=' + sha.slice(0, 12));
    for (const p of spec.patches || []) {
      const count = src.split(p.find).length - 1;
      if (count !== (p.count || 1)) throw new Error(kind + '/' + name + ' ' + p.note + ' found ' + count);
      src = src.split(p.find).join(p.replace);
    }
    sha = sha256(src);
    if (sha !== spec.expectedSha256) throw new Error(kind + '/' + name + ' expected sha mismatch');
    last = name;
  }
  return { src, sha, last };
}

function writePatch(kind, n, baseSha, patches, builtAt, assertions) {
  let src = applyKind(kind, 'patches-' + n + '.json').src;
  for (const p of patches) {
    const count = src.split(p.find).length - 1;
    if (count !== (p.count || 1)) throw new Error('precheck ' + kind + ' ' + p.note + ': found ' + count);
    src = src.split(p.find).join(p.replace);
  }
  const expected = sha256(src);
  const out = {
    baseSha256: baseSha,
    expectedSha256: expected,
    builtAt: builtAt,
    patches: patches,
    assertions: assertions || [],
  };
  fs.writeFileSync(path.join(root, kind, 'patches-' + n + '.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('wrote', kind + '/patches-' + n + '.json', expected.slice(0, 12));
  return { expected, src };
}

const srv = applyKind('srv', 'patches-107.json');
const fe = applyKind('fe', 'patches-141.json');
console.log('bases', srv.last, srv.sha.slice(0, 12), fe.last, fe.sha.slice(0, 12));

const srvSelectFind =
  '    // Read current DB state\n' +
  '    const cur = await pool.query("SELECT data FROM app_data WHERE key = \'main\'");\n' +
  '    const existing = cur.rows[0]?.data;\n' +
  '\n' +
  '    if (existing) {';

const srvSelectReplace =
  '    // Read current DB state (updated_at is the generation token)\n' +
  '    const cur = await pool.query("SELECT data, updated_at FROM app_data WHERE key = \'main\'");\n' +
  '    const existing = cur.rows[0]?.data;\n' +
  '    const dbUpdatedAt = cur.rows[0] && cur.rows[0].updated_at;\n' +
  '    const clientBase = payload && (payload._baseSavedAt || payload._savedAt);\n' +
  '    const stale = rejectStaleClientWrite(dbUpdatedAt, payload);\n' +
  '    if (stale) {\n' +
  '      console.warn(\'[db] BLOCKED stale write: client base\', clientBase, \'db\', dbUpdatedAt);\n' +
  '      logEvent(req, \'data\', \'⚠ blocked stale\', \'client base \' + String(clientBase || \'(none)\') + \' vs db \' + String(dbUpdatedAt || \'\'));\n' +
  '      return res.status(409).json(stale);\n' +
  '    }\n' +
  '\n' +
  '    if (existing) {';

const srvHelperFind = 'function mergeAptsProtect(dbApts, inApts) {';
const srvHelperReplace =
  'function rejectStaleClientWrite(dbUpdatedAt, payload) {\n' +
  '  const force = !!(payload && payload._forceStale === true);\n' +
  '  const base = payload && (payload._baseSavedAt || payload._savedAt);\n' +
  '  if (payload) {\n' +
  '    delete payload._baseSavedAt;\n' +
  '    delete payload._savedAt;\n' +
  '    delete payload._forceStale;\n' +
  '  }\n' +
  '  if (force || !dbUpdatedAt) return null;\n' +
  '  const dbMs = new Date(dbUpdatedAt).getTime();\n' +
  '  if (!isFinite(dbMs)) return null;\n' +
  '  const baseMs = base ? new Date(base).getTime() : NaN;\n' +
  '  // Missing token = unpatched / never-loaded tab (14 Aug class).\n' +
  '  // Older token = tab loaded a previous generation. 1.5s covers debounce + clock.\n' +
  '  if (!isFinite(baseMs) || dbMs - baseMs > 1500) {\n' +
  '    return {\n' +
  '      ok: false,\n' +
  '      stale: true,\n' +
  '      blocked: true,\n' +
  '      error: \'Stale client: reload before saving. A newer save already landed.\',\n' +
  '      savedAt: dbUpdatedAt,\n' +
  '    };\n' +
  '  }\n' +
  '  return null;\n' +
  '}\n' +
  'function mergeAptsProtect(dbApts, inApts) {';

const srvCapFind = 'for (let cn = 2; cn <= 140; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */';
const srvCapReplace = 'for (let cn = 2; cn <= 180; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */ /* cn <= 140 */';

const srvPatches = [
  { note: 'POST /api/db/data: reject a client that did not load the current generation', find: srvSelectFind, replace: srvSelectReplace, count: 1 },
  { note: 'rejectStaleClientWrite helper (missing/old _baseSavedAt → 409)', find: srvHelperFind, replace: srvHelperReplace, count: 1 },
  { note: 'FE bootstrap through patches-180 so FE 141 applies', find: srvCapFind, replace: srvCapReplace, count: 1 },
];

writePatch('srv', 107, srv.sha, srvPatches, '2026-08-27 Reject stale full-document saves so Configuration cannot drift', [
  { has: 'function rejectStaleClientWrite(', note: 'stale-write helper' },
  { has: 'SELECT data, updated_at FROM app_data WHERE key', note: 'generation token is read with the blob' },
  { has: "logEvent(req, 'data', '⚠ blocked stale'", note: 'changelog row on a blocked stale save' },
  { has: 'cn <= 180', note: 'FE chain cap raised for patches-141' },
]);

const fePayloadFind =
  '      keyHubs: S.keyHubs || {},\n' +
  '      keyLabels: S.keyLabels || {},\n' +
  '      keyLockbox: S.keyLockbox || {}\n' +
  '    };';

const fePayloadReplace =
  '      keyHubs: S.keyHubs || {},\n' +
  '      keyLabels: S.keyLabels || {},\n' +
  '      keyLockbox: S.keyLockbox || {},\n' +
  '      _baseSavedAt: _lastDbSave || null\n' +
  '    };';

const feResultFind =
  '    if (result.ok) {\n' +
  '      _lastDbSave = result.savedAt;\n' +
  '      updateDbBadge();\n' +
  '    } else if (result.blocked) {\n' +
  "      console.warn('[db] Write blocked by server:', result.error);\n" +
  '    }';

const feResultReplace =
  '    if (result.ok) {\n' +
  '      _lastDbSave = result.savedAt;\n' +
  '      updateDbBadge();\n' +
  '    } else if (result.stale) {\n' +
  "      console.warn('[db] stale save rejected — reloading', result.error);\n" +
  '      const keepDaily = JSON.parse(JSON.stringify(S.daily || {}));\n' +
  '      const keepCleaners = JSON.parse(JSON.stringify(S.cleaners || []));\n' +
  '      const keepRoles = JSON.parse(JSON.stringify(S.cleanerRoles || {}));\n' +
  '      const keepHubs = JSON.parse(JSON.stringify(S.keyHubs || {}));\n' +
  '      const keepLabels = JSON.parse(JSON.stringify(S.keyLabels || {}));\n' +
  '      const keepLock = JSON.parse(JSON.stringify(S.keyLockbox || {}));\n' +
  '      await loadFromDb();\n' +
  '      if (!window._dbStaleRetry) {\n' +
  '        window._dbStaleRetry = true;\n' +
  '        S.daily = keepDaily;\n' +
  '        S.cleaners = keepCleaners;\n' +
  '        S.cleanerRoles = keepRoles;\n' +
  '        S.keyHubs = keepHubs;\n' +
  '        S.keyLabels = keepLabels;\n' +
  '        S.keyLockbox = keepLock;\n' +
  '        if (typeof renderOps === "function" && document.getElementById("tab-ops") && document.getElementById("tab-ops").classList.contains("active")) {\n' +
  '          try { renderOps(); } catch (eOps) {}\n' +
  '        }\n' +
  '        try { await saveToDb(_saveGen); }\n' +
  '        finally { window._dbStaleRetry = false; }\n' +
  '      } else if (typeof toast === \'function\') {\n' +
  "        toast('Newer data on the server — page reloaded. Re-apply the last change if it vanished.', 'warn');\n" +
  '      }\n' +
  '    } else if (result.blocked) {\n' +
  "      console.warn('[db] Write blocked by server:', result.error);\n" +
  '    }';

const fePatches = [
  { note: 'Every save carries the generation the tab last loaded', find: fePayloadFind, replace: fePayloadReplace, count: 1 },
  { note: 'On 409 stale: reload, re-apply Daily Ops slices, retry once', find: feResultFind, replace: feResultReplace, count: 1 },
];

writePatch('fe', 141, fe.sha, fePatches, '2026-08-27 Send _baseSavedAt; reload+retry Daily Ops on a stale 409', [
  { has: '_baseSavedAt: _lastDbSave || null', note: 'generation token on every save' },
  { has: 'result.stale', note: 'stale 409 handler' },
  { has: 'window._dbStaleRetry', note: 'one retry after reload' },
]);

console.log('done');
