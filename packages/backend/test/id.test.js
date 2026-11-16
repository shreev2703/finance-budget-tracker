import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DB_INTEGER, parseId } from '../src/domain/id.js';

test('parseId accepts positive whole numbers, from strings or numbers', () => {
  assert.equal(parseId('42'), 42);
  assert.equal(parseId(7), 7);
  assert.equal(parseId(String(MAX_DB_INTEGER)), MAX_DB_INTEGER);
});

test('parseId rejects anything Postgres would refuse as an INTEGER id', () => {
  for (const bad of [
    'abc',
    '1.5',
    '-1',
    '0',
    '',
    ' 4',
    '1e3',
    String(MAX_DB_INTEGER + 1),
    undefined,
    null,
    1.5,
  ]) {
    assert.equal(parseId(bad), undefined, String(bad));
  }
});
