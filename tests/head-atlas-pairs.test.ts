import assert from 'node:assert/strict';
import test from 'node:test';
import { HEAD_LINK_REVISION, headAtlasConcept, type HeadEntry, type HeadModality } from '../lib/head-atlas-links.ts';
import { headPairedEntry } from '../lib/head-atlas-pairs.ts';

const pairs = [
  ['ventricle', 'lateral_ventricle', 'lateral ventricle'],
  ['deep', 'caudate_nucleus', 'caudate nucleus'],
  ['deep', 'putamen', 'putamen'],
  ['deep', 'globus_pallidus', 'globus pallidus'],
  ['deep', 'thalamus', 'thalamus'],
] as const;

function entry(modality: HeadModality, family: 'ventricle' | 'deep', sourceName: string, displayName: string, side: 'left' | 'right'): HeadEntry {
  const prefix = modality === 'CT' ? 'cth' : 'mrb';
  const group = family === 'ventricle' ? 'vnt' : 'dgm';
  return {
    id: `${prefix}.${group}.${sourceName}.${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} ${displayName} — regional mask`,
    laterality: side,
    representation: 'mask',
    source: { geometry_alias_of: null },
  };
}

for (const modality of ['CT', 'MRI'] as const) {
  test(`${modality}: all five allowlisted pairs resolve in both directions to the exact same-study object`, () => {
    for (const [family, sourceName, displayName] of pairs) {
      const left = entry(modality, family, sourceName, displayName, 'left');
      const right = entry(modality, family, sourceName, displayName, 'right');
      const entries = Object.freeze([left, right]);
      for (const [current, counterpart] of [[left, right], [right, left]] as const) {
        const found = headPairedEntry(current, entries, modality, HEAD_LINK_REVISION);
        assert.ok(found, `${modality} ${sourceName} ${current.laterality}`);
        assert.equal(found.entry, counterpart, 'must return the manifest object, not a clone or mirror');
        assert.deepEqual(found.concept, headAtlasConcept(counterpart, modality));
      }
    }
  });
}

test('missing, duplicate, forged and stale entries never produce a pair', () => {
  const left = entry('CT', 'deep', 'putamen', 'putamen', 'left');
  const right = entry('CT', 'deep', 'putamen', 'putamen', 'right');
  assert.equal(headPairedEntry(left, [left], 'CT', HEAD_LINK_REVISION), null, 'missing counterpart');
  assert.equal(headPairedEntry(left, [left, right, right], 'CT', HEAD_LINK_REVISION), null, 'ambiguous counterpart');
  assert.equal(headPairedEntry(left, [left, left, right], 'CT', HEAD_LINK_REVISION), null, 'ambiguous current entry');
  assert.equal(headPairedEntry({ ...left }, [left, right], 'CT', HEAD_LINK_REVISION), null, 'forged current object');
  assert.equal(headPairedEntry(null, [left, right], 'CT', HEAD_LINK_REVISION), null);
  assert.equal(headPairedEntry(left, [left, right], 'CT', 'stale-revision'), null);
  assert.equal(headPairedEntry(left, [left, right], 'MRI', HEAD_LINK_REVISION), null, 'wrong modality');
  const mriRight = entry('MRI', 'deep', 'putamen', 'putamen', 'right');
  assert.equal(headPairedEntry(left, [left, mriRight], 'CT', HEAD_LINK_REVISION), null, 'cross-modality counterpart');
});

test('aliases and altered concept fields cannot silently fall back to a nearby structure', () => {
  const left = entry('MRI', 'deep', 'thalamus', 'thalamus', 'left');
  const right = entry('MRI', 'deep', 'thalamus', 'thalamus', 'right');
  const alias = { ...right, source: { geometry_alias_of: left.id } };
  assert.equal(headPairedEntry(left, [left, alias], 'MRI', HEAD_LINK_REVISION), null, 'counterpart alias');
  assert.equal(headPairedEntry(alias, [alias, left], 'MRI', HEAD_LINK_REVISION), null, 'current alias');
  for (const changed of [
    { ...right, id: 'mrb.dgm.putamen.right' },
    { ...right, label: 'Right putamen — regional mask' },
    { ...right, laterality: 'left' },
    { ...right, representation: 'partial-mask' },
  ]) {
    assert.equal(headPairedEntry(left, [left, changed], 'MRI', HEAD_LINK_REVISION), null, JSON.stringify(changed));
  }
  const midline: HeadEntry = { id: 'mrb.vnt.third_ventricle', label: 'Third ventricle — regional mask', laterality: 'midline_or_unpaired', representation: 'mask' };
  assert.equal(headPairedEntry(midline, [midline, left, right], 'MRI', HEAD_LINK_REVISION), null, 'midline is unpaired');
  const unmapped: HeadEntry = { id: 'mrb.dgm.unknown.left', label: 'Left unknown — regional mask', laterality: 'left', representation: 'mask' };
  assert.equal(headPairedEntry(unmapped, [unmapped, right], 'MRI', HEAD_LINK_REVISION), null, 'unmapped is unpaired');
});

test('pair resolution leaves frozen manifest entries and source metadata unchanged', () => {
  const left = Object.freeze({ ...entry('CT', 'ventricle', 'lateral_ventricle', 'lateral ventricle', 'left'), source: Object.freeze({ geometry_alias_of: null }) });
  const right = Object.freeze({ ...entry('CT', 'ventricle', 'lateral_ventricle', 'lateral ventricle', 'right'), source: Object.freeze({ geometry_alias_of: null }) });
  const entries = Object.freeze([left, right]);
  const before = JSON.stringify(entries);
  const found = headPairedEntry(left, entries, 'CT', HEAD_LINK_REVISION);
  assert.equal(found?.entry, right);
  assert.equal(JSON.stringify(entries), before);
});
