'use strict';
/**
 * Build srv/patches-107.json + fe/patches-141.json:
 * Regular Hosthub sync pulls a rolling 6-month stay window (plus the next
 * 6 months so Daily Ops still sees future arrivals). The whole database is
 * pulled once a day at AUTO_SYNC_HOUR (default 04:00 server time).
 *
 * Run from the elysian-clearing repo root:
 *   node scripts/_build-hosthub-6mo-sync.js
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

const helpersFind = 'function mergeAptsProtect(dbApts, inApts) {';
const helpersReplace =
  'const HOSTHUB_ROLL_MONTHS = 6;\n' +
  'function hosthubIsoDay(d) {\n' +
  '  const x = d instanceof Date ? d : new Date(d);\n' +
  '  if (!isFinite(x.getTime())) return \'\';\n' +
  '  return x.toISOString().slice(0, 10);\n' +
  '}\n' +
  'function hosthubShiftMonths(from, months) {\n' +
  '  const d = new Date(from.getTime());\n' +
  '  d.setUTCMonth(d.getUTCMonth() + months);\n' +
  '  return d;\n' +
  '}\n' +
  'function hosthubRollingWindow(now) {\n' +
  '  const n = now || new Date();\n' +
  '  return {\n' +
  '    from: hosthubIsoDay(hosthubShiftMonths(n, -HOSTHUB_ROLL_MONTHS)),\n' +
  '    to: hosthubIsoDay(hosthubShiftMonths(n, HOSTHUB_ROLL_MONTHS)),\n' +
  '  };\n' +
  '}\n' +
  'function hosthubEventsUrl(path, window) {\n' +
  '  let url = BASE + path + \'?is_visible=all\';\n' +
  '  if (window && window.from && window.to) {\n' +
  '    url += \'&date_from=\' + encodeURIComponent(window.from) + \'&date_to=\' + encodeURIComponent(window.to);\n' +
  '  }\n' +
  '  return url;\n' +
  '}\n' +
  'function hosthubCheckoutIso(b) {\n' +
  '  if (!b) return \'\';\n' +
  '  if (b.date_to) return String(b.date_to).slice(0, 10);\n' +
  '  const co = String(b.checkOut || \'\');\n' +
  '  const m = co.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);\n' +
  '  if (m) return m[3] + \'-\' + String(m[2]).padStart(2, \'0\') + \'-\' + String(m[1]).padStart(2, \'0\');\n' +
  '  if (b.yr != null && b.mo != null) {\n' +
  '    const y = +b.yr, mo = +b.mo + 1;\n' +
  '    return y + \'-\' + String(mo).padStart(2, \'0\') + \'-01\';\n' +
  '  }\n' +
  '  return \'\';\n' +
  '}\n' +
  'function hosthubInRollingWindow(b, fromIso) {\n' +
  '  if (!fromIso) return true;\n' +
  '  const iso = hosthubCheckoutIso(b);\n' +
  '  return !iso || iso >= fromIso;\n' +
  '}\n' +
  'function mergeRollingBookings(existing, incoming, fromIso) {\n' +
  '  const incomingIds = {};\n' +
  '  (incoming || []).forEach(function (b) { if (b && b.id != null) incomingIds[b.id] = true; });\n' +
  '  const byId = {};\n' +
  '  (existing || []).forEach(function (b) {\n' +
  '    if (!b || b.id == null) return;\n' +
  '    if (hosthubInRollingWindow(b, fromIso) && !incomingIds[b.id]) return;\n' +
  '    byId[b.id] = b;\n' +
  '  });\n' +
  '  (incoming || []).forEach(function (b) { if (b && b.id != null) byId[b.id] = b; });\n' +
  '  return Object.keys(byId).map(function (k) { return byId[k]; });\n' +
  '}\n' +
  'function shouldRunFullHosthubSync(now, lastFullIso, hour) {\n' +
  '  const n = now || new Date();\n' +
  '  const h = hour == null ? parseInt(process.env.AUTO_SYNC_HOUR || \'4\', 10) : hour;\n' +
  '  if (n.getHours() !== h) return false;\n' +
  '  const day = hosthubIsoDay(n);\n' +
  '  const last = lastFullIso ? String(lastFullIso).slice(0, 10) : \'\';\n' +
  '  return last !== day;\n' +
  '}\n' +
  'function estimateHosthubPullSavings(totalEvents, rollingEvents, rentalCount, pageSize) {\n' +
  '  pageSize = pageSize || 2000;\n' +
  '  rentalCount = rentalCount == null ? 57 : rentalCount;\n' +
  '  const fullHttp = Math.max(1, Math.ceil(totalEvents / pageSize)) + rentalCount;\n' +
  '  const rollHttp = Math.max(1, Math.ceil(rollingEvents / pageSize));\n' +
  '  const cycles = 96;\n' +
  '  const dayBefore = cycles * fullHttp;\n' +
  '  const dayAfter = (cycles - 1) * rollHttp + fullHttp;\n' +
  '  return {\n' +
  '    eventHttpPerCycleFull: fullHttp,\n' +
  '    eventHttpPerCycleRolling: rollHttp,\n' +
  '    eventHttpPerCycleCut: (fullHttp - rollHttp) / fullHttp,\n' +
  '    payloadPerCycleCut: totalEvents ? (totalEvents - rollingEvents) / totalEvents : 0,\n' +
  '    eventHttpPerDayBefore: dayBefore,\n' +
  '    eventHttpPerDayAfter: dayAfter,\n' +
  '    eventHttpPerDayCut: dayBefore ? (dayBefore - dayAfter) / dayBefore : 0,\n' +
  '    storedDbCut: 0,\n' +
  '  };\n' +
  '}\n' +
  'async function persistHosthubSync(result, started, source) {\n' +
  '  if (!pool || !result || result.error) return { ok: false, bookings: (result && result.bookings) || [] };\n' +
  '  const existing = await pool.query("SELECT data FROM app_data WHERE key = \'main\'").catch(function () { return { rows: [] }; });\n' +
  '  const current = existing.rows[0] && existing.rows[0].data ? existing.rows[0].data : {};\n' +
  '  const currentBksGuard = Array.isArray(current.bks) ? current.bks : [];\n' +
  '  const full = !!result.full;\n' +
  '  let nextBks;\n' +
  '  if (full) {\n' +
  '    nextBks = result.bookings;\n' +
  '    if (currentBksGuard.length >= 500 && nextBks.length < currentBksGuard.length * 0.7) {\n' +
  '      console.error(\'[\' + source + \'] ✗ got \' + nextBks.length + \' bookings but DB holds \' + currentBksGuard.length + \' — partial Hosthub fetch, keeping existing bookings\');\n' +
  '      nextBks = currentBksGuard;\n' +
  '    }\n' +
  '  } else {\n' +
  '    nextBks = mergeRollingBookings(currentBksGuard, result.bookings, result.window && result.window.from);\n' +
  '  }\n' +
  '  const prevMeta = current.meta || {};\n' +
  '  const merged = Object.assign({}, current, {\n' +
  '    bks: nextBks,\n' +
  '    apts: mergeApts(current.apts || [], result.rentals || []),\n' +
  '    exps: current.exps || [],\n' +
  '    meta: Object.assign({}, prevMeta, {\n' +
  '      lastSync: started.toISOString(),\n' +
  '      lastHosthubMode: full ? \'full\' : \'rolling\',\n' +
  '      lastFullHosthubSync: full ? started.toISOString() : prevMeta.lastFullHosthubSync,\n' +
  '    }),\n' +
  '  });\n' +
  '  if (source === \'auto-sync\') merged.meta.lastAutoSync = started.toISOString();\n' +
  '  await pool.query(\n' +
  '    `INSERT INTO app_data (key, data) VALUES ($1, $2::jsonb)\\n' +
  '     ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,\n' +
  '    [\'main\', JSON.stringify(merged)]\n' +
  '  );\n' +
  '  await saveSnapshot(pool, nextBks, result.rentals);\n' +
  '  return { ok: true, bookings: nextBks, full: full, window: result.window || null };\n' +
  '}\n' +
  'function mergeAptsProtect(dbApts, inApts) {';

const runSyncFind =
  'async function runSync(apiKey, onLog) {\n' +
  '  const log  = (msg, type=\'info\') => { onLog && onLog(msg, type); };\n' +
  '  const results = { rentals: [], bookings: [], error: false };';
const runSyncReplace =
  'async function runSync(apiKey, onLog, opts) {\n' +
  '  opts = opts || {};\n' +
  '  const full = !!opts.full;\n' +
  '  const log  = (msg, type=\'info\') => { onLog && onLog(msg, type); };\n' +
  '  const results = { rentals: [], bookings: [], error: false, full: full, window: null };';

const calFind =
  '  // 3. Calendar events\n' +
  '  log(\'Fetching all bookings…\');\n' +
  '  const allEvents = []; const seen = new Set();\n' +
  '  const addEvents = (evs) => { for (const e of evs) { if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e); } } };\n' +
  '\n' +
  '  const globalEvs = await fetchPages(`${BASE}/calendar-events?is_visible=all`, apiKey,\n' +
  '    (total, pageLen, page) => { if (pageLen > 0) log(`  Global page ${page}: +${pageLen} (${total} total)`); }\n' +
  '  ).catch(() => []);\n' +
  '  addEvents(globalEvs);\n' +
  '\n' +
  '  log(`  Per-rental fetch for ${rentals.length} properties…`);\n' +
  '  for (const rental of rentals) {\n' +
  '    const evs = await fetchPages(`${BASE}/rentals/${rental.id}/calendar-events?is_visible=all`, apiKey).catch(() => []);\n' +
  '    const before = allEvents.length; addEvents(evs);\n' +
  '    const added = allEvents.length - before;\n' +
  '    if (added > 0) log(`  ${rental.name}: +${added}`);\n' +
  '  }';
const calReplace =
  '  // 3. Calendar events — rolling 6 months on the regular cycle; full list once a day\n' +
  '  const rollWin = full ? null : hosthubRollingWindow(new Date());\n' +
  '  results.window = rollWin;\n' +
  '  log(full\n' +
  '    ? \'Fetching all bookings (daily full database)…\'\n' +
  '    : (\'Fetching last \' + HOSTHUB_ROLL_MONTHS + \' months + next 6 (\' + rollWin.from + \' → \' + rollWin.to + \')…\'));\n' +
  '  const allEvents = []; const seen = new Set();\n' +
  '  const addEvents = (evs) => { for (const e of evs) { if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e); } } };\n' +
  '\n' +
  '  const globalEvs = await fetchPages(hosthubEventsUrl(\'/calendar-events\', rollWin), apiKey,\n' +
  '    (total, pageLen, page) => { if (pageLen > 0) log(`  Global page ${page}: +${pageLen} (${total} total)`); }\n' +
  '  ).catch(() => []);\n' +
  '  addEvents(globalEvs);\n' +
  '\n' +
  '  if (full) {\n' +
  '    log(`  Per-rental fetch for ${rentals.length} properties…`);\n' +
  '    for (const rental of rentals) {\n' +
  '      const evs = await fetchPages(hosthubEventsUrl(\'/rentals/\' + rental.id + \'/calendar-events\', null), apiKey).catch(() => []);\n' +
  '      const before = allEvents.length; addEvents(evs);\n' +
  '      const added = allEvents.length - before;\n' +
  '      if (added > 0) log(`  ${rental.name}: +${added}`);\n' +
  '    }\n' +
  '  } else {\n' +
  '    log(\'  Rolling sync skips the per-rental walk — daily full pull covers older stays\');\n' +
  '  }';

const windowFind =
  '  log(`${allEvents.length} total events → ${bookingEvs.length} active bookings`, \'ok\');\n';
const windowReplace =
  '  if (rollWin) {\n' +
  '    const beforeW = bookingEvs.length;\n' +
  '    for (let i = bookingEvs.length - 1; i >= 0; i--) {\n' +
  '      if (!hosthubInRollingWindow(bookingEvs[i], rollWin.from)) bookingEvs.splice(i, 1);\n' +
  '    }\n' +
  '    log(\'  Window \' + rollWin.from + \' → \' + rollWin.to + \': \' + bookingEvs.length + \'/\' + beforeW + \' stays\', \'ok\');\n' +
  '  }\n' +
  '  log(`${allEvents.length} total events → ${bookingEvs.length} active bookings`, \'ok\');\n';

const httpFind =
  'app.post(\'/api/sync\', async (req, res) => {\n' +
  '  const { apiKey: clientKey } = req.body;\n' +
  '  const apiKey = SERVER_API_KEY || clientKey || \'\';\n' +
  '  if (!apiKey) return res.status(400).json({ error: \'Missing apiKey\' });\n' +
  '\n' +
  '  res.setHeader(\'Content-Type\', \'application/x-ndjson\');\n' +
  '  const writeLine = (obj) => { try { res.write(JSON.stringify(obj) + \'\\n\'); } catch(e) {} };\n' +
  '\n' +
  '  const onLog = (msg, type=\'info\') => writeLine({ type, msg });\n' +
  '\n' +
  '  const result = await runSync(apiKey, onLog);\n' +
  '  writeLine({ type: \'done\', rentals: result.rentals, bookings: result.bookings, error: result.error });\n' +
  '  res.end();\n' +
  '});';
const httpReplace =
  'app.post(\'/api/sync\', async (req, res) => {\n' +
  '  const b = req.body || {};\n' +
  '  const { apiKey: clientKey } = b;\n' +
  '  const apiKey = SERVER_API_KEY || clientKey || \'\';\n' +
  '  if (!apiKey) return res.status(400).json({ error: \'Missing apiKey\' });\n' +
  '  const full = !!(b.full === true || b.full === \'true\');\n' +
  '\n' +
  '  res.setHeader(\'Content-Type\', \'application/x-ndjson\');\n' +
  '  const writeLine = (obj) => { try { res.write(JSON.stringify(obj) + \'\\n\'); } catch(e) {} };\n' +
  '\n' +
  '  const onLog = (msg, type=\'info\') => writeLine({ type, msg });\n' +
  '\n' +
  '  const result = await runSync(apiKey, onLog, { full: full });\n' +
  '  let persisted = null;\n' +
  '  if (!result.error && pool) {\n' +
  '    try { persisted = await persistHosthubSync(result, new Date(), full ? \'sync-full\' : \'sync\'); }\n' +
  '    catch (ePersist) { console.error(\'[sync] persist\', ePersist.message); }\n' +
  '  }\n' +
  '  writeLine({ type: \'done\', rentals: result.rentals, bookings: (persisted && persisted.bookings) || result.bookings, error: result.error, mode: full ? \'full\' : \'rolling\', persisted: !!(persisted && persisted.ok), window: result.window || null });\n' +
  '  res.end();\n' +
  '});\n' +
  'app.post(\'/api/sync-full\', async (req, res) => {\n' +
  '  req.body = Object.assign({}, req.body || {}, { full: true });\n' +
  '  return app._router.handle(Object.assign(req, { url: \'/api/sync\', method: \'POST\' }), res, function () {});\n' +
  '});';

// The sync-full router trampoline is fragile. Better duplicate a thin wrapper.
// I'll replace with a simple call: run the same handler by rewriting url is ugly.
// Use a shared inner function instead... that needs more finds.
// Simplest: /api/sync-full just documents that POST /api/sync {full:true} is the full pull.
// Skip the trampoline — FE sends full:true.

const httpReplaceNoTrampoline =
  'app.post(\'/api/sync\', async (req, res) => {\n' +
  '  const b = req.body || {};\n' +
  '  const { apiKey: clientKey } = b;\n' +
  '  const apiKey = SERVER_API_KEY || clientKey || \'\';\n' +
  '  if (!apiKey) return res.status(400).json({ error: \'Missing apiKey\' });\n' +
  '  const full = !!(b.full === true || b.full === \'true\');\n' +
  '\n' +
  '  res.setHeader(\'Content-Type\', \'application/x-ndjson\');\n' +
  '  const writeLine = (obj) => { try { res.write(JSON.stringify(obj) + \'\\n\'); } catch(e) {} };\n' +
  '\n' +
  '  const onLog = (msg, type=\'info\') => writeLine({ type, msg });\n' +
  '\n' +
  '  const result = await runSync(apiKey, onLog, { full: full });\n' +
  '  let persisted = null;\n' +
  '  if (!result.error && pool) {\n' +
  '    try { persisted = await persistHosthubSync(result, new Date(), full ? \'sync-full\' : \'sync\'); }\n' +
  '    catch (ePersist) { console.error(\'[sync] persist\', ePersist.message); }\n' +
  '  }\n' +
  '  writeLine({ type: \'done\', rentals: result.rentals, bookings: (persisted && persisted.bookings) || result.bookings, error: result.error, mode: full ? \'full\' : \'rolling\', persisted: !!(persisted && persisted.ok), window: result.window || null });\n' +
  '  res.end();\n' +
  '});';

const autoFind =
  '    const started = new Date();\n' +
  '    console.log(`[auto-sync] Starting sync at ${started.toISOString()}`);\n' +
  '    const onLog = msg => console.log(\'[auto-sync]\', msg);\n' +
  '\n' +
  '    try {\n' +
  '      const result = await runSync(apiKey, onLog);\n' +
  '      if (!result.error && pool) {\n' +
  '        const existing = await pool.query("SELECT data FROM app_data WHERE key = \'main\'").catch(() => ({ rows: [] }));\n' +
  '        const current  = existing.rows[0]?.data || {};\n' +
  '        // Cancelled-but-paid bookings now flow through runSync\'s main pipeline\n' +
  '        // (with the full gr-taxes pass), so no separate cancelled merge is needed.\n' +
  '        const cancelledCount = result.bookings.filter(b => b.cancelled).length;\n' +
  '        if (cancelledCount) onLog(`  including ${cancelledCount} cancelled-but-paid booking(s) with tax data`);\n' +
  '\n' +
  '        const currentBksGuard = Array.isArray(current.bks) ? current.bks : [];\n' +
  '        let nextBks = result.bookings;\n' +
  '        if (currentBksGuard.length >= 500 && nextBks.length < currentBksGuard.length * 0.7) {\n' +
  '          console.error(`[auto-sync] ✗ got ${nextBks.length} bookings but DB holds ${currentBksGuard.length} — partial Hosthub fetch, keeping existing bookings`);\n' +
  '          nextBks = currentBksGuard;\n' +
  '        }\n' +
  '        const merged   = {\n' +
  '          ...current,\n' +
  '          bks:  nextBks,\n' +
  '          apts: mergeApts(current.apts || [], result.rentals),\n' +
  '          exps: current.exps || [],\n' +
  '          meta: { ...(current.meta || {}), lastAutoSync: started.toISOString(), lastSync: started.toISOString() },\n' +
  '        };\n' +
  '        await pool.query(\n' +
  '          `INSERT INTO app_data (key, data) VALUES ($1, $2::jsonb)\n' +
  '           ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,\n' +
  '          [\'main\', JSON.stringify(merged)]\n' +
  '        );\n' +
  '        console.log(`[auto-sync] ✓ Done — ${nextBks.length} bookings saved at ${started.toISOString()}`);\n' +
  '        await saveSnapshot(pool, nextBks, result.rentals);\n' +
  '      } else if (result.error) {\n' +
  '        console.error(\'[auto-sync] Sync error:\', result.error);\n' +
  '      }';
const autoReplace =
  '    const started = new Date();\n' +
  '    let lastFull = null;\n' +
  '    if (pool) {\n' +
  '      try {\n' +
  '        const peek = await pool.query("SELECT data FROM app_data WHERE key = \'main\'");\n' +
  '        lastFull = peek.rows[0] && peek.rows[0].data && peek.rows[0].data.meta && peek.rows[0].data.meta.lastFullHosthubSync;\n' +
  '      } catch (ePeek) {}\n' +
  '    }\n' +
  '    const full = shouldRunFullHosthubSync(started, lastFull);\n' +
  '    console.log(`[auto-sync] Starting ${full ? \'FULL\' : \'rolling 6-month\'} sync at ${started.toISOString()}`);\n' +
  '    const onLog = msg => console.log(\'[auto-sync]\', msg);\n' +
  '\n' +
  '    try {\n' +
  '      const result = await runSync(apiKey, onLog, { full: full });\n' +
  '      if (!result.error && pool) {\n' +
  '        const cancelledCount = result.bookings.filter(b => b.cancelled).length;\n' +
  '        if (cancelledCount) onLog(`  including ${cancelledCount} cancelled-but-paid booking(s) with tax data`);\n' +
  '        const persisted = await persistHosthubSync(result, started, \'auto-sync\');\n' +
  '        console.log(`[auto-sync] ✓ Done — ${persisted.bookings.length} bookings saved (${full ? \'full\' : \'rolling\'}) at ${started.toISOString()}`);\n' +
  '      } else if (result.error) {\n' +
  '        console.error(\'[auto-sync] Sync error:\', result.error);\n' +
  '      }';

const capFind = 'for (let cn = 2; cn <= 140; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */';
const capReplace = 'for (let cn = 2; cn <= 180; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */ /* cn <= 140 */';

writePatch('srv', 107, srv.sha, [
  { note: 'Rolling-window helpers + persistHosthubSync', find: helpersFind, replace: helpersReplace, count: 1 },
  { note: 'runSync accepts {full} for the daily whole-database pull', find: runSyncFind, replace: runSyncReplace, count: 1 },
  { note: 'Regular sync fetches the 6-month window and skips per-rental', find: calFind, replace: calReplace, count: 1 },
  { note: 'Client-side window filter if Hosthub ignores date_from/date_to', find: windowFind, replace: windowReplace, count: 1 },
  { note: 'POST /api/sync persists a rolling merge; full:true pulls the whole database', find: httpFind, replace: httpReplaceNoTrampoline, count: 1 },
  { note: '15-minute auto-sync is rolling; AUTO_SYNC_HOUR runs the daily full pull', find: autoFind, replace: autoReplace, count: 1 },
  { note: 'FE bootstrap through patches-180 so FE 141 applies', find: capFind, replace: capReplace, count: 1 },
], '2026-08-27 Regular Hosthub sync is last 6 months; full database once a day at AUTO_SYNC_HOUR', [
  { has: 'function mergeRollingBookings(', note: 'rolling merge keeps older stays' },
  { has: 'function shouldRunFullHosthubSync(', note: 'daily full pull gate' },
  { has: 'Rolling sync skips the per-rental walk', note: 'regular cycle skips 57 rental walks' },
  { has: 'hosthubEventsUrl(\'/calendar-events\', rollWin)', note: 'date-windowed global list' },
  { has: 'shouldRunFullHosthubSync(started, lastFull)', note: 'auto-sync chooses full vs rolling' },
  { has: 'cn <= 180', note: 'FE chain cap raised for patches-141' },
]);

const feBtnFind =
  '      <button class="btn gold" id="sync-btn" onclick="startSync()" style="font-size:14px;padding:10px 22px;font-weight:600">\n' +
  '        <i class="ti ti-refresh"></i> Sync all bookings\n' +
  '      </button>';
const feBtnReplace =
  '      <button class="btn gold" id="sync-btn" onclick="startSync()" style="font-size:14px;padding:10px 22px;font-weight:600">\n' +
  '        <i class="ti ti-refresh"></i> Sync last 6 months\n' +
  '      </button>\n' +
  '      <button class="btn sm" id="sync-full-btn" onclick="startSync(true)" style="font-size:12px;padding:10px 14px">Full database</button>';

const feStartFind = 'async function startSync() {';
const feStartReplace = 'async function startSync(full) {\n  full = !!full;';

const feLogFind = '  syncLog(`Starting full sync  key: ${key.slice(0,8)}…`);';
const feLogReplace = '  syncLog(`Starting ${full ? \'FULL database\' : \'last-6-months\'} sync  key: ${key.slice(0,8)}…`);';

const feFetchFind = '    syncLog(\'\\nFetching full database…\', \'warn\');';
const feFetchReplace = '    syncLog(full ? \'\\nFetching full database…\' : \'\\nFetching last 6 months + upcoming stays…\', \'warn\');';

const feBodyFind =
  '      body: JSON.stringify({\n' +
  '        apiKey: key,\n' +
  '        rentalsEndpoint:  rentalsResult?.url || null,\n' +
  '        bookingsEndpoint: bookingsResult?.url || null,\n' +
  '      })';
const feBodyReplace =
  '      body: JSON.stringify({\n' +
  '        apiKey: key,\n' +
  '        full: !!full,\n' +
  '        rentalsEndpoint:  rentalsResult?.url || null,\n' +
  '        bookingsEndpoint: bookingsResult?.url || null,\n' +
  '      })';

const feWipeFind =
  '    syncProgress(95);\n' +
  '    syncLog(`\\nProcessing ${finalData.bookings.length} bookings…`, \'warn\');\n' +
  '\n' +
  '    // Import data into state\n' +
  '    const prevApts = S.apts.length;\n' +
  '    S.bks = [];';
const feWipeReplace =
  '    syncProgress(95);\n' +
  '    syncLog(`\\nProcessing ${finalData.bookings.length} bookings…`, \'warn\');\n' +
  '\n' +
  '    // Import data into state. A rolling sync has already been merged+saved\n' +
  '    // on the server — reload so older-than-6-month stays are not wiped.\n' +
  '    const prevApts = S.apts.length;\n' +
  '    if (finalData.persisted) {\n' +
  '      syncLog(\'\\nServer saved the merge — reloading from the database (older stays kept)…\', \'ok\');\n' +
  '      _dataInitialized = false;\n' +
  '      await loadFromDb();\n' +
  '      localStorage.setItem(\'hh_last_sync\', new Date().toISOString());\n' +
  '      save();\n' +
  '      syncProgress(100);\n' +
  '      renderDash(); populateBkF(); renderBk(); renderCfg(); updBkBadge();\n' +
  '      document.getElementById(\'sync-spinner\').style.display = \'none\';\n' +
  '      document.getElementById(\'sync-done\').style.display = \'block\';\n' +
  '      document.getElementById(\'sync-done-msg\').textContent = `✓ ${S.bks.length} bookings in the database`;\n' +
  '      document.getElementById(\'sync-done-sub\').textContent = (finalData.mode === \'full\' ? \'Full database pull\' : \'Last 6 months merged\') + \' · \' + S.apts.length + \' properties · \' + new Date().toLocaleTimeString(\'el-GR\');\n' +
  '      document.getElementById(\'sync-modal-title\').textContent = \'Sync complete\';\n' +
  '      document.getElementById(\'sync-modal-sub\').textContent = \'\';\n' +
  '      initSyncUI();\n' +
  '      return;\n' +
  '    }\n' +
  '    S.bks = [];';

const feBannerFind = '    else sub.textContent = \'API key configured — click to sync all bookings\';';
const feBannerReplace = '    else sub.textContent = \'API key configured — regular sync is last 6 months; full database once a day overnight\';';

writePatch('fe', 141, fe.sha, [
  { note: 'Dashboard: last-6-months button + full-database button', find: feBtnFind, replace: feBtnReplace, count: 1 },
  { note: 'startSync(full) sends full:true for the whole-database pull', find: feStartFind, replace: feStartReplace, count: 1 },
  { note: 'Sync log says rolling vs full', find: feLogFind, replace: feLogReplace, count: 1 },
  { note: 'Fetching copy matches the window', find: feFetchFind, replace: feFetchReplace, count: 1 },
  { note: 'POST /api/sync carries full flag', find: feBodyFind, replace: feBodyReplace, count: 1 },
  { note: 'After a persisted rolling/full sync, reload S from DB (do not wipe older stays)', find: feWipeFind, replace: feWipeReplace, count: 1 },
  { note: 'Banner status describes the rolling window', find: feBannerFind, replace: feBannerReplace, count: 1 },
], '2026-08-27 Hosthub regular sync is last 6 months; Full database is the daily pull', [
  { has: 'Sync last 6 months', note: 'dashboard rolling button' },
  { has: 'startSync(true)', note: 'full-database button' },
  { has: 'full: !!full', note: 'client sends the full flag' },
  { has: 'finalData.persisted', note: 'reload from DB after server merge' },
]);
