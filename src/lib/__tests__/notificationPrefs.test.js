import test from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_PREFS = { push: true, email: true, sms: false };

test('notification_prefs default shape matches mobile', () => {
  assert.deepEqual(DEFAULT_PREFS, { push: true, email: true, sms: false });
});
