import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { HEAD_LINK_REVISION, headAtlasConcept, headConceptById, headConceptFromAtlasQuery, parseHeadConcept, resolveHeadConcept, type HeadEntry } from '../lib/head-atlas-links.ts';

const runtime = JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));

const pons: HeadEntry = { id: 'cth.bst.pons', label: 'Pons — regional mask', laterality: 'midline_or_unpaired', representation: 'partial-mask' };
const leftCaudate: HeadEntry = { id: 'mrb.dgm.caudate_nucleus.left', label: 'Left caudate nucleus — regional mask', laterality: 'left', representation: 'mask' };
const conceptIds = [
  'brainstem-midbrain', 'brainstem-pons', 'brainstem-medulla',
  'ventricle-left-lateral', 'ventricle-right-lateral', 'ventricle-third', 'ventricle-fourth',
  ...['left', 'right'].flatMap((side) => ['caudate', 'putamen', 'globus-pallidus', 'thalamus'].map((name) => `deep-${side}-${name}`)),
  ...['left', 'right'].flatMap((side) => ['frontal', 'parietal', 'temporal', 'occipital'].map((lobe) => `cortex-${side}-${lobe}-lobe`)),
  ...['left', 'right'].map((side) => `limbic-${side}-hippocampus`),
];

test('head concepts use exact source-pinned nested and direct Atlas study links', () => {
  const nested = headAtlasConcept(pons, 'CT');
  assert.equal(nested?.conceptId, 'brainstem-pons');
  assert.equal(nested?.headRevision, HEAD_LINK_REVISION);
  assert.match(nested!.scopeNote, /regional portion only/);
  const nestedQuery = Object.fromEntries(new URL(nested!.atlasHref, 'https://example.invalid').searchParams);
  assert.equal(nestedQuery.study, '2');
  assert.equal(nestedQuery.detail, 'brainstem');
  assert.equal(nestedQuery.side, 'both');
  const target = runtime.nestedTargets.find((item: { structureId: string }) => item.structureId === nestedQuery.part);
  assert.equal(nestedQuery.structure, target.parentId);
  assert.equal(nestedQuery.source, target.parentHash);
  assert.equal(nestedQuery.partSource, target.sourceHash);

  const direct = headAtlasConcept(leftCaudate, 'MRI');
  assert.equal(direct?.conceptId, 'deep-left-caudate');
  const directQuery = Object.fromEntries(new URL(direct!.atlasHref, 'https://example.invalid').searchParams);
  const structure = catalog.structures.find((item: { id: string }) => item.id === directQuery.structure);
  const bundle = catalog.bundles.find((item: { id: string }) => item.id === structure.bundle);
  assert.equal(directQuery.source, bundle.sha256);
  assert.equal(directQuery.study, '1');
});

test('all 25 concepts resolve to pinned public Atlas targets', () => {
  assert.equal(conceptIds.length, 25);
  for (const id of conceptIds) {
    const link = headConceptById(id);
    assert.ok(link, id);
    const url = new URL(link.atlasHref, 'https://example.invalid');
    assert.equal(url.pathname, '/atlas/head-neck-3d');
    assert.equal(url.searchParams.get('concept'), id);
    assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId, id);
    const query = Object.fromEntries(url.searchParams);
    if (query.study === '2') {
      const target = runtime.nestedTargets.find((item: { structureId: string; study: string }) => item.structureId === query.part && item.study === query.detail);
      assert.ok(target, id);
      assert.equal(query.structure, target.parentId, id);
      assert.equal(query.source, target.parentHash, id);
      assert.equal(query.partSource, target.sourceHash, id);
    } else {
      assert.equal(query.study, '1', id);
      const structure = catalog.structures.find((item: { id: string }) => item.id === query.structure);
      assert.ok(structure, id);
      const bundle = catalog.bundles.find((item: { id: string }) => item.id === structure.bundle);
      assert.equal(query.source, bundle.sha256, id);
      assert.equal(query.side, structure.laterality, id);
    }
  }
  assert.equal(headConceptById('cerebellum'), null);
});

test('Atlas return contract rejects duplicate and stale source fields', () => {
  const valid = new URL(headConceptById('brainstem-pons')!.atlasHref, 'https://example.invalid').searchParams;
  const withUnrelated = new URLSearchParams(valid);
  withUnrelated.set('view', 'teaching');
  assert.equal(headConceptFromAtlasQuery(withUnrelated)?.conceptId, 'brainstem-pons');
  for (const key of ['concept', 'study', 'structure', 'side', 'source', 'detail', 'part', 'partSource']) {
    const duplicate = new URLSearchParams(valid);
    duplicate.append(key, duplicate.get(key)!);
    assert.equal(headConceptFromAtlasQuery(duplicate), null, key);
    const stale = new URLSearchParams(valid);
    stale.set(key, 'stale');
    assert.equal(headConceptFromAtlasQuery(stale), null, key);
  }
  assert.equal(headConceptFromAtlasQuery({ ...Object.fromEntries(valid), concept: ['brainstem-pons'] }), null);
  assert.equal(headConceptFromAtlasQuery(new URLSearchParams('concept=brainstem-pons')), null);
  const extraFocus=new URLSearchParams(valid);extraFocus.set('focus','other-focus');
  assert.equal(headConceptFromAtlasQuery(extraFocus),null,'An unsupported focus must not produce named return links for a rejected nested study');
});

test('reverse links accept one allowlisted concept and an exact present entry', () => {
  assert.equal(parseHeadConcept(new URLSearchParams('concept=brainstem-pons')), 'brainstem-pons');
  assert.equal(parseHeadConcept(new URLSearchParams('concept=brainstem-pons&concept=brainstem-pons')), null);
  assert.equal(parseHeadConcept({ concept: 'unknown' }), null);
  assert.equal(resolveHeadConcept([pons], 'brainstem-pons', 'CT'), pons);
  assert.equal(resolveHeadConcept([pons], 'brainstem-pons', 'MRI'), null);
  assert.equal(resolveHeadConcept([{ ...pons, representation: 'mask' }], 'brainstem-pons', 'CT'), null);
});

test('no fuzzy or whole-structure assertion for unsupported or altered entries', () => {
  assert.equal(headAtlasConcept({ ...pons, label: 'Pons' }, 'CT'), null);
  assert.equal(headAtlasConcept({ ...pons, id: 'cth.bst.brainstem' }, 'CT'), null);
  assert.equal(headAtlasConcept({ ...pons, representation: 'mask' }, 'CT'), null);
  assert.equal(headAtlasConcept({ id: 'mrb.cer.cerebellum', label: 'Cerebellum — regional mask', laterality: 'midline_or_unpaired', representation: 'mask' }, 'MRI'), null);
});
