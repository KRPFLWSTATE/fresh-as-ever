import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapSupabaseError } from '../supabaseError.js';

describe('mapSupabaseError', () => {
  it('maps RLS / permission errors', () => {
    const msg = mapSupabaseError({ code: '42501', message: 'permission denied' });
    assert.match(msg, /permission/i);
  });

  it('maps PGRST116 without leaking raw message in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.equal(
      mapSupabaseError({ code: 'PGRST116', message: '0 rows' }),
      'We could not find that. It may have been removed.',
    );
    process.env.NODE_ENV = prev;
  });
});
