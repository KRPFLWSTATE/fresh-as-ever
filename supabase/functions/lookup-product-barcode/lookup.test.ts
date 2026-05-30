/**
 * Barcode normalization helpers (run with deno test locally).
 */
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const BARCODE_RE = /^[0-9]{8,14}$/;

Deno.test('valid barcode', () => {
  assertEquals(BARCODE_RE.test('5012345678901'), true);
});

Deno.test('invalid barcode', () => {
  assertEquals(BARCODE_RE.test('abc'), false);
});
