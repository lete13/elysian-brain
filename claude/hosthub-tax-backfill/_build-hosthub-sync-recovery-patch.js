'use strict';
/**
 * SRV 108: Hosthub failed-run flag + full database pull including Greek taxes.
 * A capped 15-min cycle cannot recover the 22 Aug wipe; a 429 must never
 * persist climate-tax zeros. Run: node scripts/_build-hosthub-sync-recovery-patch.js
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

const src = applySrv('patches-108.json');
const base = sha(src);

const helpersFind = `function selectGrTaxTargets(bookingEvs, prevBkById, nowMs) {
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
}`;

const helpersReplace = `function hasStoredGrTax(b) {
  return !!(b && (b.grTaxOk || (+b.ct || 0) || (+b.vat || 0) || (+b.at || 0) || (+b.bvPrevat || 0)));
}

function applyStoredGrTaxes(bookings, prevBkById, grTaxMap) {
  (bookings || []).forEach(b => {
    if (!b) return;
    if (grTaxMap && Object.prototype.hasOwnProperty.call(grTaxMap, b.id)) {
      b.grTaxOk = true;
      return;
    }
    const prev = prevBkById && prevBkById[b.id];
    if (!prev) return;
    // Always copy previous tax fields when this cycle did not fetch. Writing
    // ct=0 because Hosthub 429'd the separate gr-taxes endpoint is what wiped TAKK.
    b.ct = prev.ct; b.bvPrevat = prev.bvPrevat; b.vat = prev.vat; b.at = prev.at;
    b.nbv = prev.nbv; b.trHost = prev.trHost;
    if (prev.grTaxOk) b.grTaxOk = true;
  });
  return bookings;
}

function mergeGrTaxIntoExisting(existing, incoming) {
  const byId = {};
  (incoming || []).forEach(b => { if (b && b.id != null) byId[b.id] = b; });
  return (existing || []).map(b => {
    const n = byId[b.id];
    if (!n || !hasStoredGrTax(n)) return b;
    return Object.assign({}, b, {
      ct: n.ct, vat: n.vat, at: n.at, bvPrevat: n.bvPrevat,
      nbv: n.nbv, trHost: n.trHost, grTaxOk: n.grTaxOk || b.grTaxOk,
    });
  });
}

function hosthubSyncMetaPatch(meta, result, startedIso, source) {
  const next = Object.assign({}, meta || {});
  next.lastSync = startedIso;
  if (source === 'auto') next.lastAutoSync = startedIso;
  if (source === 'full') next.lastFullSync = startedIso;
  next.hosthubBatchSync = {
    source: source || 'sync',
    full: !!result.full,
    taxIncluded: (result.taxFetched || 0) > 0,
    taxAttempted: result.taxAttempted || 0,
    taxFetched: result.taxFetched || 0,
    taxBacklog: result.taxBacklog || 0,
    taxRateLimited: !!result.taxRateLimited,
    pagesTruncated: !!result.pagesTruncated,
    at: startedIso,
  };
  next.hosthubTaxBacklog = result.taxBacklog || 0;
  if (result.syncFailed) {
    next.hosthubSyncFailed = true;
    next.hosthubSyncFailedAt = startedIso;
    next.hosthubSyncFailedReason = result.syncFailed.reason;
    next.hosthubSyncFailedDetail = result.syncFailed.detail || '';
  } else if (!(result.taxBacklog > 0)) {
    delete next.hosthubSyncFailed;
    delete next.hosthubSyncFailedAt;
    delete next.hosthubSyncFailedReason;
    delete next.hosthubSyncFailedDetail;
    next.lastSuccessfulSync = startedIso;
    next.lastTaxSync = startedIso;
  }
  return next;
}

function selectGrTaxTargets(bookingEvs, prevBkById, nowMs, opts) {
  const money = v => (v && typeof v === 'object') ? (v.cents || 0) / 100 : (parseFloat(v || 0) || 0);
  const paid = ev => (money(ev.total_price) || money(ev.guest_paid) || money(ev.total_reservation_price) || money(ev.booking_value)) > 0;
  const taxCutoff = new Date((nowMs != null ? nowMs : Date.now()) - 90 * 86400 * 1000).toISOString().slice(0, 10);
  const byDateDesc = (a, b) => String(b.date_to || '').localeCompare(String(a.date_to || ''));
  const missing = (bookingEvs || []).filter(ev => paid(ev) && (!prevBkById[ev.id] || !hasStoredGrTax(prevBkById[ev.id])));
  const refresh = (bookingEvs || []).filter(ev => paid(ev) && prevBkById[ev.id] && hasStoredGrTax(prevBkById[ev.id]) && String(ev.date_to || '') >= taxCutoff);
  missing.sort(byDateDesc);
  refresh.sort(byDateDesc);
  if (opts && opts.full) {
    // Manual recovery: every paid stay, missing first, no 500 cap. Hosthub's
    // calendar-event payload has no climate_tax — each stay is a separate GET.
    return { taxTargets: missing.concat(refresh), missingCount: missing.length, refreshCount: refresh.length, full: true };
  }
  // Missing-first: the 22 Aug rate-limit wipe left ct=0 on ~98% of stays. Sorting
  // all 90-day bookings by date_to filled the 500 cap with future stays that
  // already had tax, so the backlog never drained. Keep a small refresh slice
  // for Hosthub revisions; spend the rest of the cap on zeros.
  const refreshTake = refresh.slice(0, 50);
  const missingTake = missing.slice(0, Math.max(0, 500 - refreshTake.length));
  return { taxTargets: missingTake.concat(refreshTake), missingCount: missing.length, refreshCount: refresh.length, full: false };
}`;

const runSyncFind = `async function runSync(apiKey, onLog) {
  const log  = (msg, type='info') => { onLog && onLog(msg, type); };
  const results = { rentals: [], bookings: [], error: false };`;

const runSyncReplace = `async function runSync(apiKey, onLog, opts) {
  opts = opts || {};
  const full = !!opts.full;
  const log  = (msg, type='info') => { onLog && onLog(msg, type); };
  const results = { rentals: [], bookings: [], error: false, full };`;

const fetchPagesFind = `    try { obj = await hhGet(url, key); } catch(e) { console.error('fetchPages:', e.message); break; }
    if (obj._err && (obj.status === 429 || obj.status >= 500) && retries < 3) {
      // Hosthub rate limit: wait for the window to reset, retry the same page.
      retries++; page--;
      await new Promise(r => setTimeout(r, 20000 * retries));
      continue;
    }
    if (obj._err) { console.error(\`fetchPages HTTP \${obj.status}\`); break; }
    retries = 0; // retry budget is per page, not per fetchPages call`;

const fetchPagesReplace = `    try { obj = await hhGet(url, key); } catch(e) {
      console.error('fetchPages:', e.message);
      all._truncated = true; all._errStatus = 0;
      break;
    }
    if (obj._err && (obj.status === 429 || obj.status >= 500) && retries < 3) {
      // Hosthub rate limit: wait for the window to reset, retry the same page.
      retries++; page--;
      await new Promise(r => setTimeout(r, 20000 * retries));
      continue;
    }
    if (obj._err) { console.error(\`fetchPages HTTP \${obj.status}\`); all._truncated = true; all._errStatus = obj.status; break; }
    retries = 0; // retry budget is per page, not per fetchPages call`;

const taxSelectFind = `  const prevBkById = {};
  (currentBksSync || []).forEach(b => { if (b && b.id != null) prevBkById[b.id] = b; });
  const hasTaxData = b => !!(b && ((+b.ct || 0) || (+b.vat || 0) || (+b.at || 0) || (+b.bvPrevat || 0)));
  const { taxTargets, missingCount, refreshCount } = selectGrTaxTargets(bookingEvs, prevBkById);
  log(\`Fetching Greek taxes for \${taxTargets.length}/\${bookingEvs.length} bookings (\${missingCount} missing in backlog, \${refreshCount} recent refresh, missing-first cap)…\`);
  const grTaxMap = {}; const BATCH_SIZE = 20; let fetched = 0;
  for (let i = 0; i < taxTargets.length; i += BATCH_SIZE) {
    const chunk = taxTargets.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async ev => {
      try {
        const r = await fetch(\`\${BASE}/calendar-events/\${ev.id}/calendar-event-gr-taxes\`, { headers: hhH(apiKey) });
        if (r.ok) grTaxMap[ev.id] = await r.json();
      } catch(e) {}
    }));
    fetched += chunk.length;
    if (fetched % 200 === 0 || fetched === taxTargets.length)
      log(\`  Taxes: \${fetched}/\${taxTargets.length} — \${Object.keys(grTaxMap).length} with data\`);
  }`;

const taxSelectReplace = `  const prevBkById = {};
  (currentBksSync || []).forEach(b => { if (b && b.id != null) prevBkById[b.id] = b; });
  const { taxTargets, missingCount, refreshCount } = selectGrTaxTargets(bookingEvs, prevBkById, Date.now(), { full });
  log(full
    ? \`Full tax pull: \${taxTargets.length} paid bookings (\${missingCount} missing Greek tax). Hosthub calendar-events have no climate_tax — each stay is a separate GET.\`
    : \`Fetching Greek taxes for \${taxTargets.length}/\${bookingEvs.length} bookings (\${missingCount} missing in backlog, \${refreshCount} recent refresh, missing-first cap)…\`);
  const grTaxMap = {}; const BATCH_SIZE = full ? 10 : 20; let fetched = 0;
  let taxRateLimited = false; let pagesTruncated = !!(globalEvs && globalEvs._truncated);
  for (let i = 0; i < taxTargets.length; i += BATCH_SIZE) {
    if (taxRateLimited) break;
    const chunk = taxTargets.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async ev => {
      try {
        const r = await fetch(\`\${BASE}/calendar-events/\${ev.id}/calendar-event-gr-taxes\`, { headers: hhH(apiKey) });
        if (r.status === 429) { taxRateLimited = true; return; }
        if (r.ok) grTaxMap[ev.id] = await r.json();
      } catch(e) {}
    }));
    fetched += chunk.length;
    if (fetched % 200 === 0 || fetched === taxTargets.length || taxRateLimited)
      log(\`  Taxes: \${Object.keys(grTaxMap).length} saved / \${fetched} attempted / \${taxTargets.length} targeted\${taxRateLimited ? ' — Hosthub 429, stopping this cycle' : ''}\`);
    if (full && !taxRateLimited) await new Promise(r => setTimeout(r, 400));
  }`;

const reuseFind = `  // Reuse stored Greek tax fields for bookings we did not refetch this cycle.
  bookings.forEach(b => {
    if (grTaxMap[b.id]) return;
    const prev = prevBkById[b.id];
    if (!prev || !hasTaxData(prev)) return;
    b.ct = prev.ct; b.bvPrevat = prev.bvPrevat; b.vat = prev.vat; b.at = prev.at;
    b.nbv = prev.nbv; b.trHost = prev.trHost;
  });

  results.rentals  = rentals;
  results.bookings = bookings;
  log(\`Sync complete — \${rentals.length} properties, \${bookings.length} bookings\`, 'ok');
  return results;
}`;

const reuseReplace = `  // Reuse stored Greek tax fields for bookings we did not refetch this cycle —
  // including stored zeros. A failed gr-taxes GET must not persist ct=0.
  applyStoredGrTaxes(bookings, prevBkById, grTaxMap);

  const afterById = {};
  bookings.forEach(b => { if (b && b.id != null) afterById[b.id] = b; });
  const remaining = selectGrTaxTargets(bookingEvs, afterById, Date.now(), {}).missingCount;

  results.rentals  = rentals;
  results.bookings = bookings;
  results.taxAttempted = taxTargets.length;
  results.taxFetched = Object.keys(grTaxMap).length;
  results.taxBacklog = remaining;
  results.taxRateLimited = !!taxRateLimited;
  results.pagesTruncated = !!pagesTruncated;
  if (pagesTruncated) {
    results.syncFailed = { reason: 'partial_booking_fetch', detail: 'Hosthub calendar-event pages truncated (rate limit or HTTP error)' };
  } else if (taxRateLimited) {
    results.syncFailed = { reason: 'tax_rate_limited', detail: 'Hosthub 429 on calendar-event-gr-taxes — taxes are a separate endpoint from the booking' };
  } else if (full && remaining > 0) {
    results.syncFailed = { reason: 'tax_backlog_remaining', detail: remaining + ' paid stays still missing Greek tax after the full pull' };
  } else if (remaining > 500) {
    results.syncFailed = { reason: 'tax_backlog', detail: remaining + ' paid stays missing Greek tax. Run a full pull of the database including taxes.' };
  }
  log(\`Sync complete — \${rentals.length} properties, \${bookings.length} bookings, \${results.taxFetched} taxes saved, \${remaining} tax backlog\${results.syncFailed ? ' [' + results.syncFailed.reason + ']' : ''}\`, results.syncFailed ? 'warn' : 'ok');
  return results;
}`;

const persistFind = `  return Object.values(byName).filter(a => a.name);
}

// ── Auto-sync scheduler (every 15 minutes: :00, :15, :30, :45) ───────────────`;

const persistReplace = `  return Object.values(byName).filter(a => a.name);
}

async function persistHosthubSync(result, started, source, onLog) {
  if (!pool) return { persisted: false };
  const existing = await pool.query("SELECT data FROM app_data WHERE key = 'main'").catch(() => ({ rows: [] }));
  const current  = existing.rows[0]?.data || {};
  const currentBksGuard = Array.isArray(current.bks) ? current.bks : [];
  const startedIso = (started instanceof Date ? started : new Date(started || Date.now())).toISOString();
  let nextBks = Array.isArray(result.bookings) ? result.bookings : [];
  const log = onLog || (m => console.log(m));

  if (currentBksGuard.length >= 500 && nextBks.length < currentBksGuard.length * 0.7) {
    console.error(\`[\${source}-sync] ✗ got \${nextBks.length} bookings but DB holds \${currentBksGuard.length} — partial Hosthub fetch, keeping existing bookings\`);
    result.syncFailed = result.syncFailed || { reason: 'partial_booking_fetch', detail: 'got ' + nextBks.length + ' vs DB ' + currentBksGuard.length };
    result.pagesTruncated = true;
    nextBks = mergeGrTaxIntoExisting(currentBksGuard, nextBks);
  } else if (source !== 'full' && current.meta && current.meta.hosthubSyncFailed) {
    log('hosthubSyncFailed is set — merging taxes into existing bookings, not replacing the list');
    nextBks = mergeGrTaxIntoExisting(currentBksGuard, nextBks);
  }

  const cancelledCount = nextBks.filter(b => b && b.cancelled).length;
  if (cancelledCount) log('  including ' + cancelledCount + ' cancelled-but-paid booking(s)');

  const merged = {
    ...current,
    bks:  nextBks,
    apts: mergeApts(current.apts || [], result.rentals || []),
    exps: current.exps || [],
    meta: hosthubSyncMetaPatch(current.meta || {}, result, startedIso, source),
  };
  await pool.query(
    \`INSERT INTO app_data (key, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, updated_at = NOW()\`,
    ['main', JSON.stringify(merged)]
  );
  console.log(\`[\${source}-sync] ✓ Done — \${nextBks.length} bookings saved at \${startedIso}\`);
  await saveSnapshot(pool, nextBks, result.rentals || []);
  return { persisted: true, bookings: nextBks, meta: merged.meta };
}

// ── Auto-sync scheduler (every 15 minutes: :00, :15, :30, :45) ───────────────`;

const autoSaveFind = `      const result = await runSync(apiKey, onLog);
      if (!result.error && pool) {
        const existing = await pool.query("SELECT data FROM app_data WHERE key = 'main'").catch(() => ({ rows: [] }));
        const current  = existing.rows[0]?.data || {};
        // Cancelled-but-paid bookings now flow through runSync's main pipeline
        // (with the full gr-taxes pass), so no separate cancelled merge is needed.
        const cancelledCount = result.bookings.filter(b => b.cancelled).length;
        if (cancelledCount) onLog(\`  including \${cancelledCount} cancelled-but-paid booking(s) with tax data\`);

        const currentBksGuard = Array.isArray(current.bks) ? current.bks : [];
        let nextBks = result.bookings;
        if (currentBksGuard.length >= 500 && nextBks.length < currentBksGuard.length * 0.7) {
          console.error(\`[auto-sync] ✗ got \${nextBks.length} bookings but DB holds \${currentBksGuard.length} — partial Hosthub fetch, keeping existing bookings\`);
          nextBks = currentBksGuard;
        }
        const merged   = {
          ...current,
          bks:  nextBks,
          apts: mergeApts(current.apts || [], result.rentals),
          exps: current.exps || [],
          meta: { ...(current.meta || {}), lastAutoSync: started.toISOString(), lastSync: started.toISOString() },
        };
        await pool.query(
          \`INSERT INTO app_data (key, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, updated_at = NOW()\`,
          ['main', JSON.stringify(merged)]
        );
        console.log(\`[auto-sync] ✓ Done — \${nextBks.length} bookings saved at \${started.toISOString()}\`);
        await saveSnapshot(pool, nextBks, result.rentals);
      } else if (result.error) {`;

const autoSaveReplace = `      const result = await runSync(apiKey, onLog, { full: false });
      if (!result.error && pool) {
        await persistHosthubSync(result, started, 'auto', onLog);
      } else if (result.error) {`;

const httpFind = `app.post('/api/sync', async (req, res) => {
  const { apiKey: clientKey } = req.body;
  const apiKey = SERVER_API_KEY || clientKey || '';
  if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });

  res.setHeader('Content-Type', 'application/x-ndjson');
  const writeLine = (obj) => { try { res.write(JSON.stringify(obj) + '\\n'); } catch(e) {} };

  const onLog = (msg, type='info') => writeLine({ type, msg });

  const result = await runSync(apiKey, onLog);
  writeLine({ type: 'done', rentals: result.rentals, bookings: result.bookings, error: result.error });
  res.end();
});`;

const httpReplace = `async function streamHosthubSync(req, res, forceFull) {
  const body = req.body || {};
  const apiKey = SERVER_API_KEY || body.apiKey || '';
  if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });
  const full = forceFull || !!body.full;

  res.setHeader('Content-Type', 'application/x-ndjson');
  const writeLine = (obj) => { try { res.write(JSON.stringify(obj) + '\\n'); } catch(e) {} };
  const onLog = (msg, type='info') => writeLine({ type, msg });

  const started = new Date();
  const result = await runSync(apiKey, onLog, { full });
  let persisted = false;
  if (!result.error && pool) {
    await persistHosthubSync(result, started, full ? 'full' : 'manual', onLog);
    persisted = true;
  }
  writeLine({
    type: 'done',
    rentals: result.rentals,
    bookings: result.bookings,
    error: result.error,
    persisted,
    full: !!result.full,
    syncFailed: result.syncFailed || null,
    taxBacklog: result.taxBacklog || 0,
    taxFetched: result.taxFetched || 0,
  });
  res.end();
}

app.post('/api/sync', async (req, res) => streamHosthubSync(req, res, false));

// Manual recovery: pull every calendar event and every paid stay's Greek taxes
// (climate tax / VAT / accommodation tax). Hosthub does not embed those fields
// on the booking, so this is a separate N+1 pass. Sets/clears hosthubSyncFailed.
app.post('/api/sync-full', async (req, res) => streamHosthubSync(req, res, true));`;

const cfgFind = `app.get('/api/server-config', (req, res) => {
  res.json({
    hasServerKey: !!SERVER_API_KEY,
    hasPassword:  !!APP_PASSWORD,
    hasDatabase:  !!pool,
  });
});`;

const cfgReplace = `app.get('/api/server-config', async (req, res) => {
  let hosthubSyncFailed = false, hosthubSyncFailedReason = '', hosthubTaxBacklog = 0;
  if (pool) {
    try {
      const dbRow = await pool.query("SELECT data FROM app_data WHERE key='main'");
      const meta = (dbRow.rows[0] && dbRow.rows[0].data && dbRow.rows[0].data.meta) || {};
      hosthubSyncFailed = !!meta.hosthubSyncFailed;
      hosthubSyncFailedReason = meta.hosthubSyncFailedReason || '';
      hosthubTaxBacklog = meta.hosthubTaxBacklog || 0;
    } catch (e) {}
  }
  res.json({
    hasServerKey: !!SERVER_API_KEY,
    hasPassword:  !!APP_PASSWORD,
    hasDatabase:  !!pool,
    hosthubSyncFailed,
    hosthubSyncFailedReason,
    hosthubTaxBacklog,
  });
});`;

const feBootFind = `    for (let cn = 2; cn <= 140; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */`;
const feBootReplace = `    for (let cn = 2; cn <= 141; cn++) { /* legacy note: cn <= 40 */ /* cn <= 80 */ /* cn <= 90 */ /* cn <= 100 */ /* cn <= 120 */ /* cn <= 140 */`;

const injectFind = `      'setTimeout(_go,800);})();' +
      '\\n<\\/script>';`;

const injectReplace = `      'setTimeout(_go,800);})();' +
      '(function(){function _hhFailPaint(){fetch("/api/server-config").then(function(r){return r.json();}).then(function(cfg){if(!cfg||!cfg.hosthubSyncFailed)return;var sub=document.getElementById("sync-banner-status");if(sub)sub.textContent="Hosthub sync failed"+(cfg.hosthubSyncFailedReason?(" — "+cfg.hosthubSyncFailedReason):"")+". Pull the full database including taxes ("+(cfg.hosthubTaxBacklog||0)+" stays missing TAKK/VAT).";var btn=document.getElementById("sync-btn");if(btn)btn.innerHTML=\\'<i class="ti ti-refresh"></i> Pull full database (incl. taxes)\\';}).catch(function(){});}setTimeout(_hhFailPaint,1200);})();' +
      '\\n<\\/script>';`;

const patches = [
  { note: 'Helpers: failed-run flag, tax reuse, full-pull target list', find: helpersFind, replace: helpersReplace, count: 1 },
  { note: 'runSync accepts full-pull opts', find: runSyncFind, replace: runSyncReplace, count: 1 },
  { note: 'fetchPages marks truncated page lists', find: fetchPagesFind, replace: fetchPagesReplace, count: 1 },
  { note: 'Tax pass aborts on 429 and full-pulls every paid stay', find: taxSelectFind, replace: taxSelectReplace, count: 1 },
  { note: 'Never persist tax zeros from a failed fetch; set hosthubSyncFailed', find: reuseFind, replace: reuseReplace, count: 1 },
  { note: 'persistHosthubSync writes the failure flag and skips list replace while flagged', find: persistFind, replace: persistReplace, count: 1 },
  { note: 'Auto-sync uses persistHosthubSync', find: autoSaveFind, replace: autoSaveReplace, count: 1 },
  { note: 'POST /api/sync persists; POST /api/sync-full pulls all taxes', find: httpFind, replace: httpReplace, count: 1 },
  { note: '/api/server-config exposes hosthubSyncFailed', find: cfgFind, replace: cfgReplace, count: 1 },
  { note: 'FE bootstrap through patches-141', find: feBootFind, replace: feBootReplace, count: 1 },
  { note: 'Inject failed-sync banner from server-config', find: injectFind, replace: injectReplace, count: 1 },
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
  builtAt: '2026-08-27 Hosthub failed-run flag + full database pull including Greek taxes',
  patches,
  assertions: [
    { has: 'function hosthubSyncMetaPatch(', note: 'failure-flag helper exists' },
    { has: "app.post('/api/sync-full'", note: 'full pull endpoint exists' },
    { has: 'hosthubSyncFailed', note: 'failed-run flag is persisted' },
    { has: 'must not persist ct=0', note: 'failed tax fetch cannot write zeros' },
    { has: 'cn <= 141', note: 'FE bootstrap includes 141' },
  ],
};

fs.writeFileSync(path.join(root, 'srv', 'patches-108.json'), JSON.stringify(spec, null, 1) + '\n');
console.log('wrote srv/patches-108.json');
console.log('base', spec.baseSha256);
console.log('expected', spec.expectedSha256);
console.log('bytes', Buffer.byteLength(out));
console.log('patches', patches.length);
