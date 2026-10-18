import assert from 'node:assert/strict';
import test from 'node:test';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
import type {HeadPracticeReviewItem} from '../lib/head-atlas-practice.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {createHeadPracticeSummary, downloadHeadPracticeSummary, formatHeadPracticeSummary} from '../lib/head-practice-summary.ts';

const secret = 'PRIVATE_PATIENT_FILE_774.nii.gz';
function entry(id: string, label: string, hash = 'a'.repeat(64)): HeadEntry {
  return {id, label, family: secret, laterality: 'midline_or_unpaired', representation: 'partial-mask',
    color: [1, 0, 0], opacity: {fill: .2, outline: .8},
    source: {patient: secret, nested: {filename: secret}},
    mask: {file: secret, sha256: hash, dtype: 'uint8', shape_kji: [1, 1, 1],
      offset_kji: [0, 0, 0], native_shape_kji: [1, 1, 1], ijk_to_ras: [[1, 0, 0, 0]]}};
}
const linked = entry('cth.bst.pons', 'Pons — regional mask');
const unknown = entry(secret, secret, 'b'.repeat(64));
const third = entry('cth.secret.revealed', secret, 'c'.repeat(64));
const fourth = entry('cth.secret.unanswered', secret, 'd'.repeat(64));
const entries = [linked, unknown, third, fourth];
const items: HeadPracticeReviewItem[] = [
  {entry: linked, outcome: 'correct'}, {entry: unknown, outcome: 'incorrect'},
  {entry: third, outcome: 'revealed'}, {entry: fourth, outcome: 'unanswered'},
];
const args = {items, entries, modality: 'CT' as const, revision: HEAD_LINK_REVISION, mode: 'locate' as const};

test('exact native cerebellar concepts retain safe labels without a 3D mapping', () => {
  const ct = {...entry('cth.cer.cerebellar_hemisphere.left', 'Left cerebellar hemisphere — regional mask'),
    laterality: 'left', representation: 'mask'};
  const mri = entry('mrb.cer.cerebellar_vermis', 'Cerebellar vermis — regional mask');
  for (const [native, modality, conceptId, label] of [
    [ct, 'CT', 'cerebellum-left-hemisphere', 'Left cerebellar hemisphere'],
    [mri, 'MRI', 'cerebellum-vermis', 'Cerebellar vermis'],
  ] as const) {
    const input = {items: [{entry: native, outcome: 'correct' as const}], entries: [native],
      modality, revision: HEAD_LINK_REVISION, mode: 'locate' as const};
    const summary = createHeadPracticeSummary(input);
    assert.deepEqual(summary.current.questions.map(question => [question.conceptId, question.label]), [[conceptId, label]]);
    const output = formatHeadPracticeSummary(summary);
    assert(output.includes(label));
    for (const value of [secret, native.id, native.label, native.mask!.sha256, native.mask!.file])
      assert(!JSON.stringify(summary).includes(value) && !output.includes(value));
    const stale = createHeadPracticeSummary({...input, revision: 'stale'});
    assert.equal(stale.current.questions[0].conceptId, null);
    assert.equal(stale.current.questions[0].label, 'Unlinked structure (source label withheld)');
    for (const altered of [{...native, id: native.id + '.extra'}, {...native, label: native.label + ' altered'}]) {
      const withheld = createHeadPracticeSummary({...input, items: [{entry: altered, outcome: 'correct'}], entries: [altered]});
      assert.equal(withheld.current.questions[0].conceptId, null);
      assert.equal(withheld.current.questions[0].label, 'Unlinked structure (source label withheld)');
    }
    assert.throws(() => createHeadPracticeSummary({...input, entries: [native, {...native}]}),
      /Invalid completed practice results/, 'ambiguous duplicate identity must not export a trusted label');
  }
});

test('privacy allowlist preserves every question and excludes source and transport data', () => {
  const before = JSON.stringify({items, entries});
  const summary = createHeadPracticeSummary(args);
  assert.deepEqual(summary.current.questions.map(q => q.outcome), ['correct', 'incorrect', 'revealed', 'unanswered']);
  assert.deepEqual(summary.current.questions.map(q => q.ordinal), [1, 2, 3, 4]);
  assert.deepEqual(summary.current.questions.map(q => q.label), ['Pons', ...Array(3).fill('Unlinked structure (source label withheld)')]);
  assert.deepEqual(summary.current.questions.map(q => q.conceptId), ['brainstem-pons', null, null, null]);
  assert.deepEqual([summary.current.total, summary.current.correct, summary.current.incorrect,
    summary.current.revealed, summary.current.unanswered, summary.current.attempted], [4, 1, 1, 1, 1, 2]);
  const output = formatHeadPracticeSummary(summary);
  assert.match(output, /Attempted score: 1\/2/);
  assert.match(output, /Not certified, clinically approved, or a radiologist sign-off/);
  for (const value of [secret, linked.id, linked.label, linked.mask!.sha256, linked.mask!.file]) {
    assert(!JSON.stringify(summary).includes(value)); assert(!output.includes(value));
  }
  assert.equal(JSON.stringify({items, entries}), before);
});

test('stale revision withholds all names and never emits the supplied revision', () => {
  const summary = createHeadPracticeSummary({...args, revision: secret});
  assert.equal(summary.headLinkRevision, null);
  assert(summary.current.questions.every(q => q.conceptId === null && q.label.startsWith('Unlinked structure')));
  assert(!formatHeadPracticeSummary(summary).includes(secret));
  assert.match(formatHeadPracticeSummary(summary), /revision: unavailable/);
});

test('original first attempts and follow-up scores remain separate', () => {
  const summary = createHeadPracticeSummary({...args,
    items: [{entry: linked, outcome: 'correct'}],
    originalItems: [{entry: linked, outcome: 'incorrect'}, {entry: unknown, outcome: 'revealed'}]});
  assert.equal(summary.original?.incorrect, 1);
  assert.equal(summary.original?.revealed, 1);
  assert.equal(summary.original?.attempted, 1);
  assert.equal(summary.current.correct, 1);
  assert.match(formatHeadPracticeSummary(summary), /Original set · first attempts preserved/);
  assert.match(formatHeadPracticeSummary(summary), /Follow-up set · separate attempts/);
});

test('rejects foreign, duplicate, alias, oversize, and malformed completed results', () => {
  const foreign = {...linked};
  const alias = {...unknown, id: 'alias', mask: {...unknown.mask!, sha256: linked.mask!.sha256}};
  const bad = [
    {...args, items: []}, {...args, originalItems: []},
    {...args, items: [{entry: foreign, outcome: 'correct'}]},
    {...args, items: [items[0], items[0]]},
    {...args, items: [{entry: linked, outcome: 'pending'}]},
    {...args, items: [{entry: linked, outcome: {toString() {return 'correct';}}}]},
    {...args, entries: [linked, linked]},
    {...args, entries: [linked, {...linked}]},
    {...args, entries: [linked, alias], items: [{entry: alias, outcome: 'correct'}]},
    {...args, entries: Array(10001).fill(linked)},
    {...args, items: Array(10001).fill(items[0])},
    {...args, modality: 'PET'}, {...args, mode: 'other'},
  ];
  for (const input of bad) assert.throws(() => createHeadPracticeSummary(input as typeof args), /Invalid completed practice results/);
});

test('browser download uses generic name and defers successful cleanup, but cleans up failure immediately', () => {
  const summary = createHeadPracticeSummary(args);
  const oldDocument = globalThis.document;
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const oldSetTimeout = globalThis.setTimeout;
  const events: string[] = [];
  let scheduled: (() => void) | undefined;
  let failClick = false;
  const anchor = {href: '', download: '', style: {display: ''},
    click() {events.push('click'); if (failClick) throw Error('blocked');},
    remove() {events.push('remove');}};
  try {
    URL.createObjectURL = blob => {assert(blob instanceof Blob); events.push('create'); return 'blob:private';};
    URL.revokeObjectURL = url => {assert.equal(url, 'blob:private'); events.push('revoke');};
    globalThis.setTimeout = ((callback: () => void, delay: number) => {
      assert.equal(delay, 1000); scheduled = callback; events.push('schedule');
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    globalThis.document = {createElement: (tag: string) => {assert.equal(tag, 'a'); return anchor;},
      body: {appendChild: (value: unknown) => {assert.equal(value, anchor); events.push('append');}}} as unknown as Document;
    downloadHeadPracticeSummary(summary);
    assert.equal(anchor.download, 'head-practice-summary.txt');
    assert.deepEqual(events, ['create', 'append', 'click', 'remove', 'schedule']);
    assert(scheduled); scheduled();
    assert.deepEqual(events, ['create', 'append', 'click', 'remove', 'schedule', 'revoke']);
    events.length = 0; scheduled = undefined; failClick = true;
    assert.throws(() => downloadHeadPracticeSummary(summary), /blocked/);
    assert.deepEqual(events, ['create', 'append', 'click', 'revoke', 'remove']);
    assert.equal(scheduled, undefined);
  } finally {
    globalThis.document = oldDocument;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    globalThis.setTimeout = oldSetTimeout;
  }
});
