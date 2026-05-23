import assert from 'node:assert/strict';
import test from 'node:test';
import { ERROR } from '../messages/errors.js';
import {
  mapArrivalError,
  mapCheckoutError,
  mapHandoverError,
} from '../messages/rpc.js';
import { mapAuthError } from '../messages/auth.js';
import { mapSupabaseError } from '../supabaseError.js';

test('mapHandoverError maps RPC hints', () => {
  assert.equal(mapHandoverError('order_not_ready'), ERROR.handover.notReady);
  assert.equal(mapHandoverError('code_mismatch'), ERROR.handover.codeMismatch);
});

test('mapArrivalError maps window hints', () => {
  assert.equal(mapArrivalError('not_eligible'), ERROR.arrival.notEligible);
});

test('mapCheckoutError maps sold out', () => {
  assert.equal(mapCheckoutError('sold out'), ERROR.checkout.soldOut);
});

test('mapAuthError maps invalid credentials', () => {
  assert.equal(
    mapAuthError('Invalid login credentials'),
    ERROR.auth.invalidCredentials,
  );
});

test('mapSupabaseError uses catalog fallbacks', () => {
  assert.equal(
    mapSupabaseError({ code: '23505', message: 'duplicate' }),
    ERROR.common.duplicate,
  );
});
