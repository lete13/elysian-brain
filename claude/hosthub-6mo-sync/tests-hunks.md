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
this.mergeRollingBookings = mergeRollingBookings;
this.hosthubRollingWindow = hosthubRollingWindow;
this.hosthubInRollingWindow = hosthubInRollingWindow;
this.shouldRunFullHosthubSync = shouldRunFullHosthubSync;
this.estimateHosthubPullSavings = estimateHosthubPullSavings;
```

After the `bookingHotelId` assert, add the block that starts `const win = mergeCtx.hosthubRollingWindow(new Date('2026-08-27T12:00:00Z'));` (six-month window, merge keeps pre-window stays, full pull only at `AUTO_SYNC_HOUR` once per day, savings ratio > 90% event HTTP and 0 stored-DB cut).

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
assert(srv107.patches.some((p) => (p.replace || '').includes('function mergeRollingBookings(')), 'SRV rolling Hosthub sync keeps older stays');
const fe141 = JSON.parse(fs.readFileSync(path.join(root, 'fe', 'patches-141.json'), 'utf8'));
assert.strictEqual(fe141.baseSha256, fe140.expectedSha256, 'FE 141 continues FE 140');
assert(fe141.patches.some((p) => (p.replace || '').includes('Sync last 6 months')), 'FE regular sync is last 6 months');
```
