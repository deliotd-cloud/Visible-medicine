import assert from 'node:assert/strict';
import test from 'node:test';
import { selectAtlasEncoding } from '../lib/atlas-content-encoding.ts';

type Encoding = 'gzip' | 'identity' | null;
function check(cases: readonly (readonly [string | null, Encoding])[], allowGzip = true) {
  for (const [header, expected] of cases) {
    assert.equal(selectAtlasEncoding(header, allowGzip), expected, `${JSON.stringify(header)}, allowGzip=${allowGzip}`);
  }
}

// Primary syntax/acceptability reference; duplicate/malformed handling and ties
// are deliberate local policies, not extra requirements attributed to the RFC.
// https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.3
test('absent, empty and empty-list fields choose identity', () => {
  check([[null, 'identity'], ['', 'identity'], [' \t ', 'identity'], [', ,\t,', 'identity']]);
});

test('coding and q names are case-insensitive and HTTP whitespace is accepted', () => {
  check([['GZIP', 'gzip'], [' \tGZip\t;\tQ=1.000\t, IDENTITY;q=0.5 ', 'gzip'], [',gzip,,', 'gzip']]);
});

test('quality preference includes implicit identity and gzip wins positive ties', () => {
  check([
    ['gzip;q=0.8', 'identity'], ['gzip;q=0.8,identity;q=0.5', 'gzip'],
    ['gzip;q=0.5,identity;q=0.8', 'identity'], ['gzip;q=0.5,identity;q=0.5', 'gzip'],
    ['gzip;q=0,identity;q=0', null], ['br', 'identity'], ['br,identity;q=0', null],
  ]);
});

test('explicit codings override wildcard and identity is excluded only as specified', () => {
  check([
    ['*', 'gzip'], ['*;q=0.5', 'identity'], ['*;q=0', null],
    ['gzip;q=0,*;q=1', 'identity'], ['gzip;q=1,*;q=0', 'gzip'],
    ['identity;q=0,*;q=1', 'gzip'], ['identity;q=0.5,*;q=0', 'identity'],
    ['gzip;q=0,*;q=0,identity', 'identity'],
  ]);
});

test('qvalues accept only RFC decimal forms with at most three places', () => {
  for (const q of ['0', '0.', '0.0', '0.000']) check([[`gzip;q=${q},identity;q=0`, null]]);
  for (const q of ['0.001', '0.01', '0.123', '1', '1.', '1.0', '1.000']) {
    check([[`gzip;q=${q},identity;q=0`, 'gzip']]);
  }
});

test('invalid weights and unsupported parameters cannot enable gzip', () => {
  for (const parameter of [
    'q=', 'q=.5', 'q=01', 'q=+1', 'q=-1', 'q=2', 'q=1.001', 'q=0.1234',
    'q=1e0', 'q=NaN', 'q=Infinity', 'q="1"', 'q =1', 'q= 1', 'q=1; q=1',
    'level=1', 'q=1;level=1', '',
  ]) {
    check([[`gzip;${parameter}`, 'identity'], [`gzip;${parameter},*;q=1,identity;q=0`, null]]);
  }
});

test('malformed identity and wildcard parameters also fail conservatively', () => {
  check([['identity;q=bad', null], ['*;q=bad', null], ['*;q=bad,identity', 'identity'], ['gzip,identity;q=bad', 'gzip']]);
});

test('duplicate coding qualities take the minimum regardless of order or case', () => {
  check([
    ['gzip,gzip;q=0', 'identity'], ['gzip;q=0,GZIP', 'identity'],
    ['gzip;q=bad,gzip,identity;q=0', null], ['gzip,gzip;q=0.4,identity;q=0.3', 'gzip'],
    ['identity,IDENTITY;q=0', null], ['*,*;q=0', null], ['*;q=0,*', null],
  ]);
});

test('invalid coding syntax cannot be rescued by a wildcard', () => {
  for (const coding of ['"gzip"', 'gz ip', 'gzip/deflate', 'gzi\np', 'gzi\rp', 'gzi\u0000p', 'gzi\u00a0p']) {
    check([[`${coding},*`, null]]);
  }
});

test('identity-only delivery never returns gzip and respects identity exclusion', () => {
  check([
    [null, 'identity'], ['', 'identity'], ['gzip', 'identity'], ['gzip,identity;q=0.001', 'identity'],
    ['gzip,identity;q=0', null], ['*;q=0', null], ['identity;q=0,*', null],
    ['*;q=0,identity;q=0.5', 'identity'], ['gzip;q=1,identity;q=bad', null],
  ], false);
});

test('field length is bounded before parsing, including whitespace-only fields', () => {
  check([[' '.repeat(8192), 'identity'], [' '.repeat(8193), null], ['gzip'.padEnd(8192), 'gzip'], ['gzip'.padEnd(8193), null]]);
  check([['gzip'.padEnd(8193), null]], false);
});
