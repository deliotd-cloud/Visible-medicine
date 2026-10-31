import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const website = process.env.VM_WEBSITE_ROOT ?? root;
const require = createRequire(`${website}/package.json`);
const ts = require('typescript');
const source = readFileSync(process.env.VM_QUICK_START_HELPER ?? `${root}/lib/clinical-review-quick-start.ts`, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
runInNewContext(compiled, { module, exports: module.exports });
const { selectQuickReview } = module.exports;
const revision = 'a'.repeat(64);
const make = (key, status = 'not-started', overrides = {}) => ({
  key, title: `Structure ${key}`, area: 'structures', scopeLabel: 'Right shoulder · Right',
  href: `/workspace/atlas-review/body?selection=${key}&revision=${revision}`,
  trackLabel: 'Anatomy', revision, status, capability: 'decision', ...overrides,
});

test('groups use exact source scope labels and retain exact href, track and revision', () => {
  const left = make('left', 'in-progress', { scopeLabel: 'Left shoulder · Left',
    trackLabel: 'Teaching', href: `/workspace/atlas-review/body?selection=left&revision=${revision}&t=teaching` });
  const right = make('right', 'changes-required');
  const result = selectQuickReview([left, right], 'Teaching', null, null, true);
  assert.deepEqual([...result.groups], ['Left shoulder · Left']);
  assert.equal(result.count, 1);
  assert.strictEqual(result.item, left);
  assert.equal(result.item.href, left.href);
  assert.equal(result.item.revision, revision);
  assert.equal(selectQuickReview([left, right], 'Anatomy', null, 'Left shoulder · Left', true).count, 0);
});

test('priority is changes required, re-review, in progress, then not started', () => {
  const rows = ['not-started', 'in-progress', 're-review', 'changes-required'].map((status, i) => make(String(i), status));
  for (let index = 3; index >= 0; index--) {
    const result = selectQuickReview(rows.slice(0, index + 1), 'Anatomy', null, null, true);
    assert.strictEqual(result.item, rows[index]);
  }
});

test('excludes recorded, unavailable, inspection, corrections, missing revisions and other areas', () => {
  const excluded = [
    make('approved', 'approval-recorded'), make('unavailable', 'unavailable', { revision: null }),
    make('inspection', 'inspection-required'), make('inspection-capability', 'changes-required', { capability: 'inspection-only' }),
    make('corrections', 'changes-required', { capability: 'corrections' }),
    make('null', 'changes-required', { revision: null }),
    make('bad-revision', 'changes-required', { revision: 'not-a-revision' }),
    make('short-revision', 'changes-required', { revision: 'a'.repeat(63) }),
    make('head', 'changes-required', { area: 'head-learning' }),
  ];
  const result = selectQuickReview(excluded, 'Anatomy', null, null, true);
  assert.equal(result.count, 0);
  assert.equal(result.item, null);
  assert.deepEqual([...result.groups], []);
});

test('loaded count stays partial until scan completion', () => {
  const rows = [make('one'), make('two')];
  const partial = selectQuickReview(rows, 'Anatomy', null, null, false);
  assert.equal(partial.count, 2);
  assert.equal(partial.groups[0], 'Right shoulder · Right');
  assert.equal(partial.partial, true);
  assert.equal(selectQuickReview(rows, 'Anatomy', null, null, true).partial, false);
});


test('whole-body FMA scopes collapse into known regions without changing exact groups or hrefs', () => {
  const rows = Array.from({ length: 120 }, (_, index) => make(`fma-${index}`, 'not-started', {
    scopeLabel: `Whole body · ${index % 2 ? 'head-neck' : 'thorax'} · nerves · FMA${10000 + index} · right`,
    href: `/workspace/atlas-review/body?structure=fma-${index}&revision=${revision}`,
  }));
  const all = selectQuickReview(rows, 'Anatomy', null, null, true);
  assert.equal(all.groups.length, 120);
  assert.deepEqual([...all.regions.map(region => region.id)], ['body:head-neck', 'body:thorax']);
  const head = selectQuickReview(rows, 'Anatomy', 'body:head-neck', null, true);
  assert.equal(head.groups.length, 60);
  assert.equal(head.count, 60);
  assert.strictEqual(head.item, rows[1]);
  assert.equal(head.item.href, rows[1].href);
  assert.equal(selectQuickReview(rows, 'Anatomy', 'body:head-neck', rows[0].scopeLabel, true).count, 0);
});

test('known source areas, multi-region rows and Other fallback retain every eligible row', () => {
  const rows = [
    make('shoulder', 'in-progress', { href: '/workspace/atlas-review/shoulder?structure=shoulder', scopeLabel: 'Dedicated shoulder · Rotator cuff · muscles · FMA123 · right' }),
    make('nested', 're-review', { href: '/workspace/atlas-review/nested?parent=eye', scopeLabel: 'Eye · internal study · right' }),
    make('specimen', 'changes-required', { href: '/workspace/atlas-review/specimens?specimen=renal', scopeLabel: 'Renal specimen · donor · right' }),
    make('both', 'not-started', { scopeLabel: 'Whole body · spine · thorax · nervous · FMA567 · midline' }),
    make('future', 'not-started', { scopeLabel: 'Whole body · future-region · nervous · FMA999 · right' }),
    make('missing', 'not-started', { scopeLabel: '' }),
  ];
  const all = selectQuickReview(rows, 'Anatomy', null, null, false);
  assert.equal(all.count, rows.length); assert.equal(all.partial, true);
  assert.deepEqual([...all.regions.map(r => r.id)], ['shoulder', 'body:thorax', 'body:spine', 'nested', 'specimens', 'other']);
  for (const region of ['shoulder', 'nested', 'specimens', 'body:thorax', 'body:spine']) {
    const selected = selectQuickReview(rows, 'Anatomy', region, null, true);
    assert.equal(selected.count, 1);
    assert.equal(selected.item.href, rows.find(row => row === selected.item).href);
  }
  assert.equal(selectQuickReview(rows, 'Anatomy', 'other', null, true).count, 2);
  assert.equal(selectQuickReview(rows, 'Anatomy', 'other', '', true).item.key, 'missing');
});



test('every current whole-body catalogue region has its human-readable option', () => {
  // Exact IDs and names from the full-body public catalogue (1,022 structures).
  const expected = [
    ['head-neck', 'Head & neck'], ['thorax', 'Thorax'], ['abdomen', 'Abdomen'],
    ['pelvis', 'Pelvis & hip'], ['shoulder-arm', 'Shoulder & arm'],
    ['forearm', 'Elbow & forearm'], ['hand', 'Wrist & hand'],
    ['thigh', 'Hip & thigh'], ['leg', 'Knee & leg'], ['foot', 'Ankle & foot'],
    ['spine', 'Spine & back'],
  ];
  const rows = expected.map(([id]) => make(id, 'not-started', {
    scopeLabel: `Whole body · ${id} · nerves · FMA123 · right`,
  }));
  const selected = selectQuickReview(rows, 'Anatomy', null, null, true);
  assert.deepEqual([...selected.regions.map(region => [region.id, region.label])], expected.map(([id, label]) => [`body:${id}`, label]));
  assert.equal(selected.count, expected.length);
  for (const [id] of expected) assert.equal(selectQuickReview(rows, 'Anatomy', `body:${id}`, null, true).count, 1);
});

test('group options use structure titles and source context while exact keys still filter', () => {
  const left = make('left', 'in-progress', { title: 'Renal artery (source group)',
    scopeLabel: 'Whole body · abdomen · vessels · FMA3789 · left' });
  const right = make('right', 'changes-required', { title: 'Renal artery (source group)',
    scopeLabel: 'Whole body · abdomen · vessels · FMA3790 · right' });
  const selected = selectQuickReview([left, right], 'Anatomy', 'body:abdomen', null, false);
  assert.deepEqual([...selected.groupOptions.map(option => option.key)], [...selected.groups]);
  assert.equal(selected.partial, true);
  assert.match(selected.groupOptions[0].label, /Renal artery \(source group\)/);
  assert.match(selected.groupOptions[0].label, /Abdomen/);
  assert.doesNotMatch(selected.groupOptions[0].label, /FMA\d+/);
  assert.notEqual(selected.groupOptions[0].label, selected.groupOptions[1].label);
  assert.strictEqual(selectQuickReview([left, right], 'Anatomy', 'body:abdomen', left.scopeLabel, true).item, left);
  assert.strictEqual(selectQuickReview([left, right], 'Anatomy', 'body:abdomen', right.scopeLabel, true).item, right);
});

test('colliding readable labels retain original scope and never merge groups', () => {
  const first = make('first', 'not-started', { title: 'Artery', scopeLabel: 'Whole body · abdomen · vessels · FMA101 · right' });
  const second = make('second', 'changes-required', { title: 'Artery', scopeLabel: 'Whole body · abdomen · vessels · FMA102 · right' });
  const result = selectQuickReview([first, second], 'Anatomy', 'body:abdomen', null, true);
  assert.equal(result.groups.length, 2);
  assert.equal(result.groupOptions.length, 2);
  for (const option of result.groupOptions) assert.match(option.label, new RegExp(option.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.notEqual(result.groupOptions[0].label, result.groupOptions[1].label);
  assert.equal(selectQuickReview([first, second], 'Anatomy', null, first.scopeLabel, true).count, 1);
});

test('unknown scopes and every title qualifier stay explicit', () => {
  const unknown = make('unknown', 'not-started', { title: 'Partial structure', scopeLabel: 'Whole body · future-region · nerves · FMA999 · right' });
  const missing = make('missing', 'not-started', { title: 'Independent specimen', scopeLabel: '' });
  const shared = make('shared', 'not-started', { title: 'Second source-group structure', scopeLabel: '' });
  const result = selectQuickReview([unknown, missing, shared], 'Anatomy', 'other', null, true);
  assert.match(result.groupOptions.find(option => option.key === unknown.scopeLabel).label, /Unrecognized source scope: Whole body · future-region · nerves · FMA999 · right/);
  const unspecified = result.groupOptions.find(option => option.key === '');
  assert.match(unspecified.label, /Independent specimen/);
  assert.match(unspecified.label, /Second source-group structure/);
  assert.match(unspecified.label, /Unspecified group/);
});

test('same-group qualifiers survive and malformed known scopes retain their original tokens', () => {
  const group = 'Whole body · abdomen · vessels · FMA3789 · right';
  const rows = [
    make('artery', 'not-started', { title: 'Renal artery (source group)', scopeLabel: group }),
    make('branch', 'in-progress', { title: 'Partial branch', scopeLabel: group }),
    make('malformed', 'not-started', { title: 'Uncertain vessel', scopeLabel: 'Whole body · abdomen · vessels · FMA3789 · right · extra' }),
  ];
  const options = selectQuickReview(rows, 'Anatomy', 'body:abdomen', null, true).groupOptions;
  const shared = options.find(option => option.key === group);
  assert.match(shared.label, /Renal artery \(source group\)/);
  assert.match(shared.label, /Partial branch/);
  assert.doesNotMatch(shared.label, /FMA3789/);
  const malformed = options.find(option => option.key === rows[2].scopeLabel);
  assert.match(malformed.label, /Unrecognized source scope: Whole body · abdomen · vessels · FMA3789 · right · extra/);
  assert.equal(selectQuickReview(rows, 'Anatomy', 'body:abdomen', group, true).count, 2);
});

test('dedicated shoulder multi-ID source groups have readable labels without losing exact review context', () => {
  // clinical-review-index builds shoulder context with sourceFmaIds.join(' ').
  const scope = 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34682 FMA34684 · right';
  for (const track of ['Anatomy', 'Teaching']) {
    const source = make('deltoid', 're-review', { title: 'Deltoid · source group', scopeLabel: scope,
      href: '/workspace/atlas-review/shoulder?structure=deltoid' + (track === 'Teaching' ? '&t=teaching' : ''), trackLabel: track });
    const result = selectQuickReview([source], track, 'shoulder', scope, false);
    assert.equal(result.groupOptions[0].label, 'Deltoid · source group · Dedicated shoulder · Lateral shoulder · muscles · right');
    assert.equal(result.groupOptions[0].key, scope);
    assert.strictEqual(result.item, source);
    assert.equal(result.item.revision, revision);
    assert.equal(result.partial, true);
    assert.equal(result.count, 1);
  }
});

test('different multi-ID source groups with identical titles remain individually selectable', () => {
  const first = make('first', 'not-started', { title: 'Deltoid', scopeLabel: 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34682 · right', href: '/workspace/atlas-review/shoulder?structure=one' });
  const second = make('second', 'changes-required', { title: 'Deltoid', scopeLabel: 'Dedicated shoulder · Lateral shoulder · muscles · FMA34680 FMA34684 · right', href: '/workspace/atlas-review/shoulder?structure=two' });
  const all = selectQuickReview([first, second], 'Anatomy', 'shoulder', null, true);
  assert.equal(all.groupOptions.length, 2);
  for (const option of all.groupOptions) {
    assert(!option.label.includes('Unrecognized source scope'));
    assert(option.label.includes(option.key), 'Collisions retain the exact source scope');
    assert.strictEqual(selectQuickReview([first, second], 'Anatomy', 'shoulder', option.key, true).item, [first, second].find(row => row.scopeLabel === option.key));
  }
  assert.strictEqual(all.item, second);
});

test('malformed source ID lists remain explicit and whole-body single-ID schema stays strict', () => {
  for (const ids of ['', 'FMA123,FMA456', 'FMA123  FMA456', 'FMA123 FM456', 'FMA123 note', 'FMA123\tFMA456', ' FMA123', 'FMA123 ']) {
    const scope = `Dedicated shoulder · Lateral shoulder · muscles · ${ids} · right`;
    const item = make(ids || 'empty', 'not-started', { scopeLabel: scope, href: '/workspace/atlas-review/shoulder?structure=one' });
    const result = selectQuickReview([item], 'Anatomy', 'shoulder', null, true);
    assert(result.groupOptions[0].label.includes(`Unrecognized source scope: ${scope}`));
    assert.strictEqual(result.item, item);
  }
  const body = make('body', 'not-started', { scopeLabel: 'Whole body · shoulder-arm · muscles · FMA34680 FMA34682 · right' });
  assert(selectQuickReview([body], 'Anatomy', null, null, true).groupOptions[0].label.includes('Unrecognized source scope'));
});
