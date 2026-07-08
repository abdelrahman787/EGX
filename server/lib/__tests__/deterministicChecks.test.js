import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionSize, identityConflict } from '../deterministicChecks.js';

// ---- positionSize ----------------------------------------------------------

test('positionSize: valid inputs compute entry % = (risk/stop)*100', () => {
  const r = positionSize(3, 15);
  assert.equal(r.ok, true);
  assert.equal(r.entryPct, 20);
  assert.ok(r.message.ar && r.message.en);
});

test('positionSize: rounds to 2 decimals', () => {
  const r = positionSize(1, 3); // 33.333...
  assert.equal(r.ok, true);
  assert.equal(r.entryPct, 33.33);
});

test('positionSize: zero stop-loss is invalid', () => {
  const r = positionSize(3, 0);
  assert.equal(r.ok, false);
  assert.equal(r.entryPct, null);
  assert.ok(r.message.ar && r.message.en);
});

test('positionSize: zero risk is invalid', () => {
  assert.equal(positionSize(0, 15).ok, false);
});

test('positionSize: negative values are invalid', () => {
  assert.equal(positionSize(-3, 15).ok, false);
  assert.equal(positionSize(3, -15).ok, false);
});

test('positionSize: non-numeric is invalid', () => {
  assert.equal(positionSize('abc', 15).ok, false);
  assert.equal(positionSize(3, undefined).ok, false);
});

// ---- identityConflict ------------------------------------------------------

test('identityConflict: a buy never conflicts', () => {
  const r = identityConflict({ decisionType: 'buy', currentIdentity: 'swing', originalIdentity: 'long_term' });
  assert.equal(r.conflict, false);
});

test('identityConflict: no original identity → no conflict', () => {
  const r = identityConflict({ decisionType: 'sell', currentIdentity: 'swing', originalIdentity: null });
  assert.equal(r.conflict, false);
});

test('identityConflict: matching identity on sell → no conflict', () => {
  const r = identityConflict({ decisionType: 'sell', currentIdentity: 'long_term', originalIdentity: 'long_term' });
  assert.equal(r.conflict, false);
});

test('identityConflict: identity drift on sell → conflict with bilingual message', () => {
  const r = identityConflict({ decisionType: 'sell', currentIdentity: 'scalper', originalIdentity: 'long_term' });
  assert.equal(r.conflict, true);
  assert.equal(r.original, 'long_term');
  assert.equal(r.current, 'scalper');
  assert.ok(r.message.ar && r.message.en);
});

test('identityConflict: empty current identity → no conflict (nothing to compare)', () => {
  const r = identityConflict({ decisionType: 'sell', currentIdentity: '', originalIdentity: 'long_term' });
  assert.equal(r.conflict, false);
});
