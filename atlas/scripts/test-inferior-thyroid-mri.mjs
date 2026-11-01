import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {inferiorThyroidMriLesson as lesson} from '../lib/inferior-thyroid-mri.ts';
import {inferiorThyroidMriContent, inferiorThyroidMriReferences} from '../content/inferior-thyroid-mri.ts';

const pins = JSON.parse(fs.readFileSync(new URL('../content/inferior-thyroid-mri-pins.json', import.meta.url)));
const snapshot = JSON.parse(execFileSync('git', ['show', pins.baseline + ':content/regional-teaching/head-neck.json'], {encoding:'utf8', windowsHide:true, maxBuffer:16e6, env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const currentSnapshot = JSON.parse(fs.readFileSync(new URL('../content/regional-teaching/head-neck.json', import.meta.url)));
const selected = new Set(['FMA10697', 'FMA10680']);
const snapshotTargets = snapshot.entries.filter(e => selected.has(JSON.parse(e.identity).fmaId));
const clone = value => structuredClone(value);

test('exactly two current source identities receive normal-example MRI drafts', () => {
  assert.equal(pins.baseline, '0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66');
  assert.deepEqual(pins.entries.map(e => e.identity.fmaId).sort(), [...selected].sort());
  assert.equal(snapshotTargets.length, 2);
  for (const e of pins.entries) {
    const row = snapshotTargets.find(r => JSON.parse(r.identity).id === e.identity.id);
    assert(row);
    assert.deepEqual(e.identity, JSON.parse(row.identity));
    assert.deepEqual(e.previousMRI, row.lessons.mri);
    assert.equal(e.previousMRI.readiness, 'pending');
    const draft = lesson(e.identity, 'mri');
    assert.equal(draft.readiness, 'draft');
    assert(draft.title.startsWith(e.identity.name + ' ·'));
    assert.equal(draft.body, inferiorThyroidMriContent.body);
    assert.deepEqual(draft.bullets, [...inferiorThyroidMriContent.bullets]);
    assert.deepEqual(draft.citations, [...inferiorThyroidMriReferences]);
    assert.match(draft.bullets.join(' '), /left artery on a flow image/);
    assert.match(draft.note, /revision-bound radiologist review/);
    assert.match(draft.note, /No images, scan registration/);
    assert.equal(e.identity.validation.anatomicalReview, false);
  }
  assert.deepEqual([...inferiorThyroidMriReferences], [
    'https://doi.org/10.2214/ajr.157.4.1892022',
    'https://pubmed.ncbi.nlm.nih.gov/1892022/',
  ]);
});

test('non-MRI tabs and every unrelated snapshot identity are refused', () => {
  for (const e of pins.entries) {
    for (const tab of ['anatomy', 'function', 'ct', 'ultrasound', 'xray', 'pathology', 'clinical', 'quiz'])
      assert.equal(lesson(e.identity, tab), undefined);
  }
  for (const row of snapshot.entries) {
    const identity = JSON.parse(row.identity);
    if (!selected.has(identity.fmaId)) assert.equal(lesson(identity, 'mri'), undefined);
  }
});

function primitivePaths(value, path = []) {
  if (value === null || typeof value !== 'object') return [path];
  return Object.entries(value).flatMap(([key, child]) =>
    primitivePaths(child, [...path, Array.isArray(value) ? Number(key) : key]));
}

function changed(value) {
  if (typeof value === 'string') return value + '-changed';
  if (typeof value === 'number') return value + 1;
  if (typeof value === 'boolean') return !value;
  if (value === null) return 'changed';
  throw Error('not a primitive');
}

test('every primitive identity leaf and added property invalidates the binding', () => {
  for (const e of pins.entries) {
    const paths = primitivePaths(e.identity);
    assert(paths.length > 30);
    for (const path of paths) {
      const mutated = clone(e.identity);
      let owner = mutated;
      for (const segment of path.slice(0, -1)) owner = owner[segment];
      const key = path.at(-1);
      owner[key] = changed(owner[key]);
      assert.equal(lesson(mutated, 'mri'), undefined, `accepted changed ${e.identity.fmaId} ${path.join('.')}`);
    }
    const extra = clone(e.identity);
    extra.unreviewedAddition = true;
    assert.equal(lesson(extra, 'mri'), undefined);
    const nestedExtra = clone(e.identity);
    nestedExtra.validation.unreviewedAddition = true;
    assert.equal(lesson(nestedExtra, 'mri'), undefined);
    const extraSource = clone(e.identity);
    extraSource.sources.push(clone(extraSource.sources[0]));
    assert.equal(lesson(extraSource, 'mri'), undefined);
  }
});

test('key order does not affect binding and returned arrays are independent', () => {
  const reorder = value => Array.isArray(value) ? value.map(reorder) :
    value && typeof value === 'object' ?
      Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reorder(v)])) : value;
  for (const e of pins.entries) {
    const original = lesson(e.identity, 'mri');
    assert.deepEqual(lesson(reorder(e.identity), 'mri'), original);
    const another = lesson(e.identity, 'mri');
    another.bullets.push('foreign');
    another.citations.push('foreign');
    assert.deepEqual(lesson(e.identity, 'mri'), original);
  }
});

test('generated current lessons match drafts while exact predecessor evidence remains pending', () => {
  assert.equal(currentSnapshot.entries.length, snapshot.entries.length);
  let changed = 0;
  for (const row of snapshot.entries) {
    const s = JSON.parse(row.identity);
    const current = currentSnapshot.entries.find(r => r.identity === row.identity);
    assert(current);
    for (const [tab, previous] of Object.entries(row.lessons)) {
      if (selected.has(s.fmaId) && tab === 'mri') {
        assert.equal(previous.readiness, 'pending');
        assert.deepEqual(current.lessons[tab], lesson(s, tab));
        changed++;
      } else assert.deepEqual(current.lessons[tab], previous);
    }
  }
  assert.equal(changed, 2);
});
