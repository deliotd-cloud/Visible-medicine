import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {HEAD_LINK_REVISION, headAtlasConcept, headConceptById, headConceptFromAtlasQuery, resolveHeadConcept, type HeadEntry} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION, headTeachingForConcept, headTeachingForReference, headTeachingPacket} from '../lib/head-atlas-teaching.ts';

const runtime = JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json', import.meta.url), 'utf8'));
const brain = 'vm:anatomy:body:head-neck:midline:organ:brain';
const brainHash = 'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const lobeHash = '7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410';
const hippocampusHash = '11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e';
const cases = (['left', 'right'] as const).flatMap(side => [
  ...(['frontal', 'parietal', 'temporal', 'occipital'] as const).map(lobe => ({
    conceptId: `cortex-${side}-${lobe}-lobe`, side, imageStem: `ctx.${lobe}_lobe.${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} ${lobe} lobe — regional mask`,
    part: `vm:anatomy:body:head-neck:${side}:organ:${side}-${lobe}-lobe`, partHash: lobeHash,
  })),
  {conceptId: `limbic-${side}-hippocampus`, side, imageStem: `dgm.hippocampus.${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} hippocampus — regional mask`,
    part: `vm:anatomy:body:head-neck:${side}:organ:${side}-hippocampus`, partHash: hippocampusHash},
]);

test('ten cerebral concepts bind exactly to twenty CT/MRI entries and nested public sources', () => {
  assert.equal(cases.length, 10);
  assert.equal(new Set(cases.map(item => item.conceptId)).size, 10);
  for (const item of cases) {
    const target = runtime.nestedTargets.find((row: {structureId: string; study: string}) => row.structureId === item.part && row.study === 'cerebral');
    assert.ok(target, item.conceptId);
    assert.equal(target.parentId, brain);
    assert.equal(target.parentHash, brainHash);
    assert.equal(target.sourceHash, item.partHash);
    assert.ok(runtime.modelBundles.some((bundle: {sha256: string}) => bundle.sha256 === item.partHash));
    for (const modality of ['CT', 'MRI'] as const) {
      const entry: HeadEntry = {id: `${modality === 'CT' ? 'cth' : 'mrb'}.${item.imageStem}`,
        label: item.label, laterality: item.side, representation: 'mask'};
      const link = headAtlasConcept(entry, modality);
      assert.ok(link, `${modality} ${item.conceptId}`);
      assert.equal(link.conceptId, item.conceptId);
      assert.equal(link.headRevision, HEAD_LINK_REVISION);
      assert.deepEqual(headConceptById(item.conceptId), link);
      assert.equal(resolveHeadConcept([entry], item.conceptId, modality), entry);
      assert.equal(resolveHeadConcept([entry], item.conceptId, modality === 'CT' ? 'MRI' : 'CT'), null);
      assert.equal(link.ctHref, `/atlas/ct-head?concept=${item.conceptId}`);
      assert.equal(link.mriHref, `/atlas/mri-head?concept=${item.conceptId}`);
      assert.match(link.scopeNote, /unregistered/);
      const url = new URL(link.atlasHref, 'https://example.invalid');
      assert.equal(url.pathname, '/atlas/head-neck-3d');
      assert.deepEqual(Object.fromEntries(url.searchParams), {study: '2', structure: brain, side: item.side,
        source: brainHash, detail: 'cerebral', part: item.part, partSource: item.partHash, concept: item.conceptId});
      assert.equal(headConceptFromAtlasQuery(url.searchParams)?.conceptId, item.conceptId);
      for (const changed of [
        {...entry, id: `${entry.id}.stale`},
        {...entry, label: entry.label.replace(' — regional mask', '')},
        {...entry, laterality: item.side === 'left' ? 'right' : 'left'},
        {...entry, representation: 'partial-mask'},
      ]) {
        assert.equal(headAtlasConcept(changed, modality), null, JSON.stringify(changed));
        assert.equal(resolveHeadConcept([changed], item.conceptId, modality), null);
      }
    }
  }
});

test('cerebral return links reject stale, duplicate and swapped source fields', () => {
  for (const item of cases) {
    const valid = new URL(headConceptById(item.conceptId)!.atlasHref, 'https://example.invalid').searchParams;
    for (const key of ['concept', 'study', 'structure', 'side', 'source', 'detail', 'part', 'partSource']) {
      const duplicate = new URLSearchParams(valid);
      duplicate.append(key, duplicate.get(key)!);
      assert.equal(headConceptFromAtlasQuery(duplicate), null, `${item.conceptId} duplicate ${key}`);
      const stale = new URLSearchParams(valid);
      stale.set(key, 'stale');
      assert.equal(headConceptFromAtlasQuery(stale), null, `${item.conceptId} stale ${key}`);
    }
    const swapped = new URLSearchParams(valid);
    swapped.set('partSource', item.partHash === lobeHash ? hippocampusHash : lobeHash);
    assert.equal(headConceptFromAtlasQuery(swapped), null, `${item.conceptId} wrong cerebral source`);
  }
});

test('ten cerebral notes extend the packet while preserving all original notes and bindings', () => {
  const packet = headTeachingPacket();
  assert.equal(packet.content.notes.length, 25);
  assert.equal(packet.bindings.length, 25);
  assert.equal(createHash('sha256').update(JSON.stringify(packet.content.notes.slice(0, 15))).digest('hex'),
    'bdac4360127cea2befbc4165b9b88c4c7049c3ecd129e3793d33c12c7664609e');
  assert.equal(createHash('sha256').update(JSON.stringify(packet.bindings.slice(0, 15))).digest('hex'),
    '4307e599cd1a494b9c749a6ca52ac252096887758e6e1cf7cda7cc66586fe95b');
  assert.notEqual(HEAD_TEACHING_REVISION, 'a3ac202362d22f451fcf8638c8e9b480fd869208ca689caaed65a447711e832e');
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'), HEAD_TEACHING_REVISION);
  assert.deepEqual(packet.content.notes.slice(15).map(note => note.conceptId).sort(), cases.map(item => item.conceptId).sort());
  for (const item of cases) {
    assert.ok(headTeachingForConcept(item.conceptId, 'CT'));
    assert.ok(headTeachingForConcept(item.conceptId, 'MRI'));
    assert.ok(headTeachingForReference(item.conceptId, HEAD_LINK_REVISION));
  }
});
