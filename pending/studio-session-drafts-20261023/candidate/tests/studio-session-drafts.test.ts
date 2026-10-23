import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  readStudioSessionDraft, retainStudioSessionDraft, dropStudioSessionDraft,
  type StudioSessionDraft,
} from '../lib/studio-session-drafts.ts';

const key = (actor = 'edu:writer', org = 'org:alpha', form = 'new-course') =>
  JSON.stringify(['v1', actor, org, form]);
const raw = (value: string) => JSON.stringify({ title: value, tags: ['one', 'two'] });
const save = (owner: object, scopedKey: string, expected: StudioSessionDraft | null,
  content = raw('draft'), known = false, baselineRaw: string | null = null) =>
  retainStudioSessionDraft(owner, scopedKey, expected, content, { known, raw: baselineRaw });

test('exact document and actor, organization, form boundaries isolate entries', () => {
  const first = {}, second = {};
  const keys = [key(), key('edu:other'), key('edu:writer', 'org:other'), key('edu:writer', 'org:alpha', 'lecture')];
  const tokens = keys.map((scoped, index) => save(first, scoped, null, raw(String(index))));
  assert(tokens.every(Boolean));
  keys.forEach((scoped, index) => {
    assert.strictEqual(readStudioSessionDraft(first, scoped), tokens[index]);
    assert.equal(readStudioSessionDraft(second, scoped), null);
  });
  assert.notStrictEqual(save(second, key(), null), null);
  assert.strictEqual(readStudioSessionDraft(first, key()), tokens[0]);
});

test('canonical scoped key rejects malformed and ambiguous namespaces', () => {
  const owner = {};
  for (const invalid of [
    '', 'new-course', '["v1","edu:writer","org:alpha"]',
    '[ "v1","edu:writer","org:alpha","new-course"]',
    JSON.stringify(['v2', 'edu:writer', 'org:alpha', 'new-course']),
    JSON.stringify(['v1', 'writer', 'org:alpha', 'new-course']),
    JSON.stringify(['v1', 'edu:', 'org:alpha', 'new-course']),
    JSON.stringify(['v1', 'edu: writer', 'org:alpha', 'new-course']),
    JSON.stringify(['v1', 'edu:writer', 'org:\nalpha', 'new-course']),
    JSON.stringify(['v1', 'edu:writer', 'org:alpha', ' new-course']),
    JSON.stringify(['v1', 'edu:writer', 'org:alpha', 'x'.repeat(257)]),
  ]) {
    assert.equal(save(owner, invalid, null), null, invalid);
    assert.equal(readStudioSessionDraft(owner, invalid), null, invalid);
    assert.equal(dropStudioSessionDraft(owner, invalid, null), false, invalid);
  }
});

test('rejects empty, nested, non-string, and prototype-key form content', () => {
  const owner = {};
  for (const content of [
    '', 'invalid', 'null', '[]', '{}', '"text"',
    '{"title":42}', '{"title":null}', '{"title":true}',
    '{"title":{}}', '{"tags":["safe",4]}',
    '{"__proto__":"bad"}', '{"constructor":"bad"}', '{"prototype":"bad"}',
  ]) assert.equal(save(owner, key(), null, content), null, content);
  assert.equal(readStudioSessionDraft(owner, key()), null);
  assert(save(owner, key(), null, '{"title":"","tags":[]}'));
});

test('baseline preserves bounded exact bytes, even malformed storage content', () => {
  const owner = {};
  assert.equal(save(owner, key(), null, raw('current'), false, raw('old')), null);
  assert.equal(save(owner, key(), null, raw('current'), true, null)?.baselineKnown, true);
  const current = readStudioSessionDraft(owner, key());
  assert.strictEqual(save(owner, key(), current, raw('current'), true, '{not json')?.baselineRaw, '{not json');
  assert.strictEqual(save(owner, key(), readStudioSessionDraft(owner, key()), raw('current'), true, '')?.baselineRaw, '');
});

test('strict identity CAS rejects stale and foreign clones for replace and drop', () => {
  const owner = {}, another = {};
  const first = save(owner, key(), null, raw('first'))!;
  const foreign = save(another, key(), null, raw('foreign'))!;
  const clone = { ...first };
  assert.equal(save(owner, key(), null, raw('overwrite')), null);
  assert.equal(save(owner, key(), clone, raw('overwrite')), null);
  assert.equal(save(owner, key(), foreign, raw('overwrite')), null);
  assert.equal(dropStudioSessionDraft(owner, key(), clone), false);
  assert.equal(dropStudioSessionDraft(owner, key(), foreign), false);
  const second = save(owner, key(), first, raw('second'))!;
  assert.notStrictEqual(first, second);
  assert.equal(save(owner, key(), first, raw('stale')), null);
  assert.equal(dropStudioSessionDraft(owner, key(), first), false);
  assert.strictEqual(readStudioSessionDraft(owner, key()), second);
  assert.equal(dropStudioSessionDraft(owner, key(), second), true);
  assert.equal(dropStudioSessionDraft(owner, key(), second), false);
  assert.equal(readStudioSessionDraft(owner, key()), null);
  assert(save(owner, key(), null, raw('after drop')));
});

test('a token cannot mutate a different form or document', () => {
  const owner = {}, other = {};
  const token = save(owner, key(), null)!;
  assert.equal(save(owner, key('edu:writer', 'org:alpha', 'lecture'), token), null);
  assert.equal(dropStudioSessionDraft(owner, key('edu:writer', 'org:alpha', 'lecture'), token), false);
  assert.equal(save(other, key(), token), null);
  assert.equal(dropStudioSessionDraft(other, key(), token), false);
  assert.strictEqual(readStudioSessionDraft(owner, key()), token);
});

test('UTF-8 byte bound applies to raw and baseline independently', () => {
  const owner = {};
  const exact = JSON.stringify({ title: 'é'.repeat((512 * 1024 - 12) / 2) });
  assert.equal(new TextEncoder().encode(exact).byteLength, 512 * 1024);
  const over = JSON.stringify({ title: 'é'.repeat((512 * 1024 - 12) / 2 + 1) });
  const token = save(owner, key(), null, exact, true, exact);
  assert(token);
  assert.equal(save(owner, key(), token, over, true, exact), null);
  assert.equal(save(owner, key(), token, exact, true, over), null);
  assert.strictEqual(readStudioSessionDraft(owner, key()), token);
});

test('document cap rejects ninth entry and total over 2 MiB without eviction', () => {
  const countOwner = {};
  const entries = Array.from({ length: 8 }, (_, index) => save(countOwner, key('edu:writer', 'org:alpha', `form-${index}`), null));
  assert(entries.every(Boolean));
  assert.equal(save(countOwner, key('edu:writer', 'org:alpha', 'form-8'), null), null);
  assert.strictEqual(readStudioSessionDraft(countOwner, key('edu:writer', 'org:alpha', 'form-0')), entries[0]);
  assert.equal(dropStudioSessionDraft(countOwner, key('edu:writer', 'org:alpha', 'form-0'), entries[0]), true);
  assert(save(countOwner, key('edu:writer', 'org:alpha', 'form-8'), null));

  const bytesOwner = {};
  const half = JSON.stringify({ title: 'x'.repeat(512 * 1024 - 12) });
  assert.equal(new TextEncoder().encode(half).byteLength, 512 * 1024);
  const one = save(bytesOwner, key('edu:writer', 'org:alpha', 'a'), null, half, true, half)!;
  const two = save(bytesOwner, key('edu:writer', 'org:alpha', 'b'), null, half, true, half)!;
  assert(one && two);
  assert.equal(save(bytesOwner, key('edu:writer', 'org:alpha', 'c'), null), null);
  const replacement = save(bytesOwner, key('edu:writer', 'org:alpha', 'a'), one, half, true, half)!;
  assert(replacement);
  assert.notStrictEqual(replacement, one);
  assert.equal(dropStudioSessionDraft(bytesOwner, key('edu:writer', 'org:alpha', 'a'), one), false);
  const smaller = save(bytesOwner, key('edu:writer', 'org:alpha', 'a'), replacement, half, true, null)!;
  assert(smaller);
  assert.equal(save(bytesOwner, key('edu:writer', 'org:alpha', 'c'), null, half, true, half), null);
  assert.strictEqual(readStudioSessionDraft(bytesOwner, key('edu:writer', 'org:alpha', 'a')), smaller);
  assert(save(bytesOwner, key('edu:writer', 'org:alpha', 'c'), null, half, true, null));
  assert.equal(save(bytesOwner, key('edu:writer', 'org:alpha', 'a'), smaller, half, true, half), null);
  assert.strictEqual(readStudioSessionDraft(bytesOwner, key('edu:writer', 'org:alpha', 'b')), two);
});

test('returned token and its baseline metadata are frozen', () => {
  const owner = {};
  const token = save(owner, key(), null, raw('current'), true, raw('initial'))!;
  assert(Object.isFrozen(token));
  assert.throws(() => { (token as { raw: string }).raw = raw('tampered'); }, TypeError);
  assert.throws(() => { (token as { baselineKnown: boolean }).baselineKnown = false; }, TypeError);
  assert.strictEqual(readStudioSessionDraft(owner, key()), token);
});

test('store source contains only in-memory APIs and no browser side effects', () => {
  const source = readFileSync(new URL('../lib/studio-session-drafts.ts', import.meta.url), 'utf8');
  assert.match(source, /new WeakMap<object, Map<string, StudioSessionDraft>>/);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|window|document|fetch|setTimeout|setInterval|indexedDB)\s*[.(]/);
});
