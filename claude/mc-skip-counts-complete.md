# Monthly Close: Not needed this month counts as sent

Lefteris, 1 Sep 2026. Clearing FE **146**. No new SRV file — the tip stays **107**.

## What Lefteris said

An apartment marked Not needed this month should count as sent/complete in a month.

## Why

FE 2 treated “Not needed this month” as a third bucket. Those apartments left the work queue (correct) but were also removed from the sent count and from the progress denominator (`_need = tot − skipN`). The month meter did not move when a unit was marked not needed.

## Fix

- `complete()` is true when the apartment is marked not needed, or when every stage in its flow is done.
- The header **sent** number includes those apartments. The gray **not needed** chip remains as a breakdown.
- Progress is `sent ÷ every apartment` (skipped stay in the denominator as complete, so they cannot push the bar over 100%).
- List filter **Sent** includes them. **Not started** excludes them.
- They still leave the Focus queue. Private TAKK reminder is unchanged. Undo still puts the apartment back.

Do not change payout. Never store ΑΦΜ. The skip action stays password-gated so a real clearing cannot be quietly bypassed.

## How to apply

1. Repo: `lete13/elysian-clearing`, after FE 145.
2. Add `fe/patches-146.json` from `claude/mc-skip-counts-complete/patches-146.json`.
3. Copy `tests/mc-skip-counts-complete.test.js` and add it to `package.json` `test`. Bump chain-tip assertions to **146**.
4. `npm test`.
5. Deploy (`railway up`). `cursor[bot]` cannot push the public clearing repo.
6. Live `/api/fe-info` `sha256` = `74f76991b5a93a65b73b1ea6108466a34f5a83d84ba49ca10d8dd9ea39073fb5`.
