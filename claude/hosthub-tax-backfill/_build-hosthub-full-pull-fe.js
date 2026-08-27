'use strict';
/**
 * FE 141: dashboard "Sync all bookings" is a full Hosthub pull including Greek
 * taxes, reloads from the DB (keeps Hosthub ids), and surfaces hosthubSyncFailed.
 * Run: node scripts/_build-hosthub-full-pull-fe.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyFe(untilName) {
  let src = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (name === untilName) break;
    const file = path.join(root, 'fe', name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (spec.baseSha256 && sha256(src) !== spec.baseSha256) throw new Error(name + ' base drift');
    for (const p of spec.patches || []) {
      const parts = src.split(p.find);
      if (parts.length - 1 !== (p.count || 1)) throw new Error(name + ' anchor: ' + p.note);
      src = parts.join(p.replace);
    }
    if (spec.expectedSha256 && sha256(src) !== spec.expectedSha256) throw new Error(name + ' expected sha');
  }
  return src;
}

const src = applyFe('patches-141.json');
const patches = [];

patches.push({
  note: 'Dashboard button pulls the full database including taxes',
  find: '        <i class="ti ti-refresh"></i> Sync all bookings',
  replace: '        <i class="ti ti-refresh"></i> Pull full database (incl. taxes)',
  count: 1,
});

patches.push({
  note: 'Banner copy names the full tax pull',
  find: '        <div id="sync-banner-status" style="font-size:12px;color:rgba(201,168,76,.7);margin-top:3px">Pull all bookings directly from your Hosthub account</div>',
  replace: '        <div id="sync-banner-status" style="font-size:12px;color:rgba(201,168,76,.7);margin-top:3px">Pull every booking and its Greek taxes (TAKK / VAT / accommodation) from Hosthub</div>',
  count: 1,
});

patches.push({
  note: 'initSyncUI surfaces hosthubSyncFailed',
  find: `    if (last) sub.textContent = \`Last synced: \${new Date(last).toLocaleString('el-GR')}\`;
    else sub.textContent = 'API key configured — click to sync all bookings';`,
  replace: `    if (S.meta && S.meta.hosthubSyncFailed) {
      sub.textContent = 'Hosthub sync failed' + (S.meta.hosthubSyncFailedReason ? (' — ' + S.meta.hosthubSyncFailedReason) : '') + '. Pull the full database including taxes (' + (S.meta.hosthubTaxBacklog || 0) + ' stays missing).';
    } else if (last) sub.textContent = \`Last synced: \${new Date(last).toLocaleString('el-GR')}\`;
    else sub.textContent = 'API key configured — pull the full database including taxes';`,
  count: 1,
});

patches.push({
  note: 'Manual sync requests a full tax pull',
  find: `      body: JSON.stringify({
        apiKey: key,
        rentalsEndpoint:  rentalsResult?.url || null,
        bookingsEndpoint: bookingsResult?.url || null,
      })`,
  replace: `      body: JSON.stringify({
        apiKey: key,
        full: true,
        rentalsEndpoint:  rentalsResult?.url || null,
        bookingsEndpoint: bookingsResult?.url || null,
      })`,
  count: 1,
});

patches.push({
  note: 'Keep Hosthub event ids so tax reuse can match later syncs',
  find: '        id:    gid(),                  // fresh local ID',
  replace: '        id:    b.id || gid(),          // Hosthub event id — gid() broke tax reuse',
  count: 1,
});

patches.push({
  note: 'Reload from DB after the server persists a full pull',
  find: `    if (!finalData) throw new Error('Sync stream ended without data. Check the server console for errors.');

    syncProgress(95);
    syncLog(\`\\nProcessing \${finalData.bookings.length} bookings…\`, 'warn');

    // Import data into state
    const prevApts = S.apts.length;
    S.bks = [];`,
  replace: `    if (!finalData) throw new Error('Sync stream ended without data. Check the server console for errors.');

    syncProgress(95);
    const prevApts = S.apts.length;
    if (finalData.persisted) {
      syncLog('\\nServer saved the full pull (incl. taxes). Reloading from the database…', 'ok');
      _dataInitialized = false;
      await loadFromDb();
      if (typeof initSyncUI === 'function') initSyncUI();
    } else {
    syncLog(\`\\nProcessing \${finalData.bookings.length} bookings…\`, 'warn');

    // Import data into state
    S.bks = [];`,
  count: 1,
});

patches.push({
  note: 'Close the non-persisted client import branch',
  find: `      if (_locFilled) syncLog(\`Location data added for \${_locFilled} properties (auto-categorization).\`, 'ok');
    }


    const nNew = S.apts.length - prevApts;`,
  replace: `      if (_locFilled) syncLog(\`Location data added for \${_locFilled} properties (auto-categorization).\`, 'ok');
    }
    } // else: client-side import when the server did not persist


    const nNew = S.apts.length - prevApts;`,
  count: 1,
});

let out = src;
for (const [i, p] of patches.entries()) {
  const parts = out.split(p.find);
  if (parts.length - 1 !== (p.count || 1)) {
    throw new Error('patch ' + (i + 1) + ' (' + p.note + '): anchor count ' + (parts.length - 1));
  }
  out = parts.join(p.replace);
}

const cfg = {
  baseSha256: sha256(src),
  expectedSha256: sha256(out),
  builtAt: '2026-08-27 Full Hosthub pull including taxes + failed-sync banner',
  patches,
  assertions: [
    { has: 'Pull full database (incl. taxes)', note: 'dashboard button is the full tax pull' },
    { has: 'full: true', note: 'manual sync asks the server for every paid stay\'s taxes' },
    { has: 'hosthubSyncFailed', note: 'banner reads the failed-run flag' },
    { has: 'b.id || gid()', note: 'Hosthub event ids are kept' },
    { has: 'finalData.persisted', note: 'client reloads the server-persisted pull' },
  ],
};

fs.writeFileSync(path.join(root, 'fe', 'patches-141.json'), JSON.stringify(cfg, null, 1) + '\n');
console.log('wrote fe/patches-141.json', cfg.expectedSha256);
