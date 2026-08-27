# Clearing-side test / boot hunks

Copy these into `lete13/elysian-clearing` together with the JSON patches. They are not in the hash chain.

## `srv-boot.js`

```
for (let n = 1; n <= 140; n++) { /* legacy note: n <= 100 */
```

→

```
for (let n = 1; n <= 180; n++) { /* legacy note: n <= 100 */ /* n <= 140 */
```

## `tests/monthly-close-patches.test.js`

Both chain-walk loops (`n <= 140`) → `n <= 180`.

After `this.mergeAptsProtect = mergeAptsProtect;` add:

```
this.rejectStaleClientWrite = rejectStaleClientWrite;
```

After the `bookingHotelId` assert, add:

```
const dbAt = '2026-08-14T10:49:00.000Z';
assert.strictEqual(mergeCtx.rejectStaleClientWrite(dbAt, { _baseSavedAt: '2026-08-14T10:43:00.000Z' }).stale, true, 'six-minute-old Daily Ops tab is rejected');
assert.strictEqual(mergeCtx.rejectStaleClientWrite(dbAt, {}).stale, true, 'unpatched client with no generation token is rejected');
assert.strictEqual(mergeCtx.rejectStaleClientWrite(dbAt, { _baseSavedAt: dbAt }), null, 'matching generation is accepted');
assert.strictEqual(mergeCtx.rejectStaleClientWrite(dbAt, { _baseSavedAt: '2026-08-14T10:48:59.000Z' }), null, 'sub-second skew is accepted');
assert.strictEqual(mergeCtx.rejectStaleClientWrite(dbAt, { _forceStale: true }), null, 'emergency force still writes');
```

## `tests/payments-check-votsala-group.test.js`

Tip asserts:

```
assert.strictEqual(fe.last, 'patches-141.json', 'FE 141 is the tip of the chain');
assert.strictEqual(srv.last, 'patches-107.json', 'SRV 107 is the tip of the chain');
```

(Bump the numbers if the builder produced a later tip.)

## `tests/platform-invoice-agent.test.js`

After the FE 140 / SRV 106 continues-chain asserts:

```
const srv107 = JSON.parse(fs.readFileSync(path.join(root, 'srv', 'patches-107.json'), 'utf8'));
assert.strictEqual(srv107.baseSha256, srv106.expectedSha256, 'SRV 107 continues SRV 106');
assert(srv107.patches.some((p) => (p.replace || '').includes('function rejectStaleClientWrite(')), 'SRV rejects stale full-document saves');
const fe141 = JSON.parse(fs.readFileSync(path.join(root, 'fe', 'patches-141.json'), 'utf8'));
assert.strictEqual(fe141.baseSha256, fe140.expectedSha256, 'FE 141 continues FE 140');
assert(fe141.patches.some((p) => (p.replace || '').includes('_baseSavedAt: _lastDbSave || null')), 'FE sends the generation token');
```
