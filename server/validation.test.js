import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidDateOnly, isValidEmail, isValidLocalDateTime,
  isValidPassword, normalizeEmail, slugify,
} from './validation.js';

test('normalizes email addresses', () => {
  assert.equal(normalizeEmail('  OWNER@Example.COM '), 'owner@example.com');
  assert.equal(isValidEmail(' owner@example.com '), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('requires a strong password within bcrypt UTF-8 byte limits', () => {
  assert.equal(isValidPassword('correct-horse-battery'), true);
  assert.equal(isValidPassword('short'), false);
  assert.equal(isValidPassword('a'.repeat(73)), false);
  assert.equal(isValidPassword('😀'.repeat(19)), false);
});

test('accepts real calendar dates and rejects impossible dates', () => {
  assert.equal(isValidDateOnly('2024-02-29'), true);
  assert.equal(isValidDateOnly('2026-11-22'), true);
  for (const value of ['2026-02-29', '2026-13-01', '2026-04-31', '22-11-2026', '']) {
    assert.equal(isValidDateOnly(value), false, String(value));
  }
});

test('accepts valid local date and time values', () => {
  assert.equal(isValidLocalDateTime('2024-02-29T09:30'), true);
  assert.equal(isValidLocalDateTime('2026-11-22T18:45:30'), true);
});

test('rejects impossible or malformed local date and time values', () => {
  for (const value of ['2026-02-29T09:30', '2026-13-01T09:30', '2026-11-22T24:00', '22-11-2026 09:30', '', null]) {
    assert.equal(isValidLocalDateTime(value), false, String(value));
  }
});

test('creates readable studio slugs', () => {
  assert.equal(slugify('Studio Serein'), 'studio-serein');
  assert.equal(slugify('   '), 'studio');
});
