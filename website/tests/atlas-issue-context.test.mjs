import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAtlasIssueDetails,
  sameAtlasIssueContext,
  UNCONFIRMED_CONTEXT,
  validateAtlasIssueContext,
} from '../lib/atlas-issue-context.ts';

const commit = 'a'.repeat(40);
const digest = 'b'.repeat(64);
const base = { atlas: '3D', region: 'head-neck', sourceRevision: commit, structure: { id: 'node_17', label: 'Internal carotid artery' } };

test('only bounded 40 or 64 character lowercase source revisions and exact context fields are accepted', () => {
  assert.deepEqual(validateAtlasIssueContext(base), base);
  assert.equal(validateAtlasIssueContext({ atlas: 'CT', region: 'head-neck', sourceRevision: digest }).sourceRevision, digest);
  for (const sourceRevision of ['A'.repeat(40), 'a'.repeat(39), 'a'.repeat(41), 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(40)]) {
    assert.equal(validateAtlasIssueContext({ ...base, sourceRevision }), null);
  }
  for (const input of [null, [], { ...base, sessionId: 'secret' }, { ...base, atlas: 'US' }, { ...base, region: 'head/neck' },
    { ...base, region: 'https://example.test' }, { ...base, region: 'x'.repeat(65) }, { ...base, structure: null },
    { ...base, structure: { ...base.structure, filename: 'scan.dcm' } },
    { ...base, structure: { ...base.structure, id: 'file.dcm' } },
    { ...base, structure: { ...base.structure, label: 'Line\npatient' } },
    { ...base, structure: { ...base.structure, label: 'x'.repeat(241) } }]) {
    assert.equal(validateAtlasIssueContext(input), null);
  }
});

test('canonical anatomy IDs and Unicode labels pass within strict bounds', () => {
  const canonical = { ...base, structure: { id: 'vm:anatomy:head-neck:internal_carotid-artery', label: 'Artère carotide interne – tête' } };
  assert.deepEqual(validateAtlasIssueContext(canonical), canonical);
  assert.equal(validateAtlasIssueContext({ ...base, structure: { id: 'a'.repeat(240), label: 'É'.repeat(240) } }).structure.label.length, 240);
  for (const id of ['vm:anatomy/head', 'vm:anatomy:\nhead', 'a'.repeat(241)]) {
    assert.equal(validateAtlasIssueContext({ ...canonical, structure: { ...canonical.structure, id } }), null);
  }
  for (const label of [' bad', 'bad\nlabel', 'bad\u0085label', 'bad\u202Elabel', 'bad\u2067label', 'bad\u2028label', 'x'.repeat(241)]) {
    assert.equal(validateAtlasIssueContext({ ...canonical, structure: { ...canonical.structure, label } }), null);
  }
});

test('formatted template contains fixed fields and prompts, no unsolicited metadata or entered notes', () => {
  const text = formatAtlasIssueDetails(base);
  assert.match(text, /Atlas: 3D\nRegion: head-neck\nSource revision: a{40}\nStructure: Internal carotid artery \(node_17\)/);
  assert.match(text, /What happened:\nWhat you expected:$/);
  assert.doesNotMatch(text, /patient|session|https?:|filename|result/i);
  assert.equal(formatAtlasIssueDetails({ ...base, notes: 'private' }), null);
  assert.equal(formatAtlasIssueDetails(null), null);
  assert.match(UNCONFIRMED_CONTEXT, /Select it again, then reopen this panel/);
});

test('source, structure, atlas or region changes refuse a prior snapshot', () => {
  const snapshot = validateAtlasIssueContext(base);
  assert.equal(sameAtlasIssueContext(snapshot, validateAtlasIssueContext({ ...base })), true);
  for (const changed of [
    { ...base, sourceRevision: 'c'.repeat(40) },
    { ...base, structure: { ...base.structure, id: 'node_18' } },
    { ...base, structure: { ...base.structure, label: 'Different label' } },
    { ...base, atlas: 'CT' },
    { ...base, region: 'thorax' },
  ]) assert.equal(sameAtlasIssueContext(snapshot, validateAtlasIssueContext(changed)), false);
  assert.equal(sameAtlasIssueContext(snapshot, null), false);
});

test('prototypes, accessors, symbols and hidden fields are refused without reading getters', () => {
  let getterCalls = 0;
  const accessor = { ...base };
  Object.defineProperty(accessor, 'region', { enumerable: true, get() { getterCalls++; return 'head-neck'; } });
  assert.equal(validateAtlasIssueContext(accessor), null);
  assert.equal(getterCalls, 0);

  const nestedAccessor = { ...base, structure: { ...base.structure } };
  Object.defineProperty(nestedAccessor.structure, 'label', { enumerable: true, get() { getterCalls++; return 'Safe'; } });
  assert.equal(validateAtlasIssueContext(nestedAccessor), null);
  assert.equal(getterCalls, 0);

  const hidden = { ...base };
  Object.defineProperty(hidden, 'sessionId', { value: 'hidden', enumerable: false });
  const symbol = { ...base, [Symbol('secret')]: 'hidden' };
  const inherited = Object.assign(Object.create({ sessionId: 'inherited' }), base);
  const nullPrototype = Object.assign(Object.create(null), base);
  for (const input of [hidden, symbol, inherited, nullPrototype]) assert.equal(validateAtlasIssueContext(input), null);

  const hiddenNested = { ...base, structure: { ...base.structure } };
  Object.defineProperty(hiddenNested.structure, 'filename', { value: 'scan.dcm', enumerable: false });
  const symbolNested = { ...base, structure: { ...base.structure, [Symbol('secret')]: 'hidden' } };
  for (const input of [hiddenNested, symbolNested]) assert.equal(validateAtlasIssueContext(input), null);
});
