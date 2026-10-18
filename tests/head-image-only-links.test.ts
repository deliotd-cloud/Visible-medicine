import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION, headAtlasConcept, headConceptById, headConceptFromAtlasQuery, type HeadEntry, type HeadModality} from '../lib/head-atlas-links.ts';
import {headImageConcept, headImageConceptById, headImageOnlyComparisonPacket, resolveHeadImageConcept} from '../lib/head-image-only-links.ts';

const cases = [
  {conceptId:'cerebellum-left-hemisphere', name:'cerebellar_hemisphere.left', label:'Left cerebellar hemisphere — regional mask', side:'left', mriRepresentation:'mask'},
  {conceptId:'cerebellum-right-hemisphere', name:'cerebellar_hemisphere.right', label:'Right cerebellar hemisphere — regional mask', side:'right', mriRepresentation:'mask'},
  {conceptId:'cerebellum-vermis', name:'cerebellar_vermis', label:'Cerebellar vermis — regional mask', side:'midline_or_unpaired', mriRepresentation:'partial-mask'},
] as const;

function entry(item: typeof cases[number], modality: HeadModality): HeadEntry {
  return {
    id:`${modality==='CT'?'cth':'mrb'}.cer.${item.name}`,
    label:item.label,
    laterality:item.side,
    representation:modality==='CT'?'mask':item.mriRepresentation,
  };
}

test('all six exact native image identities round trip through CT and MRI links', () => {
  for (const item of cases) {
    const byId=headImageConceptById(item.conceptId);
    assert.ok(byId, item.conceptId);
    assert.equal(byId.headRevision,HEAD_LINK_REVISION);
    assert.equal(byId.atlasHref,undefined);
    assert.equal('atlasHref' in byId,false);
    assert.match(byId.scopeNote,/Draft/);
    assert.match(byId.scopeNote,/separate, unregistered subjects/);
    assert.match(byId.scopeNote,/No exact matching 3D part, spatial correspondence or clinical approval/);
    for (const modality of ['CT','MRI'] as const) {
      const source=entry(item,modality);
      assert.deepEqual(headImageConcept(source,modality),byId);
      assert.equal(resolveHeadImageConcept([source],item.conceptId,modality),source);
      const href:string|undefined=modality==='CT'?byId.ctHref:byId.mriHref;
      const parsed:URL=new URL(href!,'https://example.invalid');
      assert.equal(parsed.pathname,modality==='CT'?'/atlas/ct-head':'/atlas/mri-head');
      assert.deepEqual([...parsed.searchParams], [['concept',item.conceptId]]);
      assert.equal(headAtlasConcept(source,modality),null);
      assert.equal(headConceptFromAtlasQuery(parsed.searchParams),null);
    }
  }
  assert.match(headImageConceptById('cerebellum-vermis')!.scopeNote,/partial coverage/);
});

test('altered fields, wrong modality, foreign suffixes and ambiguous exact entries are refused', () => {
  for (const item of cases) for (const modality of ['CT','MRI'] as const) {
    const source=entry(item,modality);
    const opposite=modality==='CT'?'MRI':'CT';
    assert.equal(headImageConcept(source,opposite),null);
    assert.equal(resolveHeadImageConcept([source],item.conceptId,opposite),null);
    for (const changed of [
      {...source,id:`${source.id}.extra`},
      {...source,id:`${opposite==='CT'?'cth':'mrb'}.cer.${item.name}`},
      {...source,label:`${item.label} altered`},
      {...source,laterality:item.side==='left'?'right':'left'},
      {...source,representation:source.representation==='mask'?'partial-mask':'mask'},
    ]) {
      assert.equal(headImageConcept(changed,modality),null);
      assert.equal(resolveHeadImageConcept([changed],item.conceptId,modality),null);
    }
    assert.equal(resolveHeadImageConcept([source,{...source}],item.conceptId,modality),null);
  }
  assert.equal(headImageConceptById('cerebellum'),null);
  assert.equal(headImageConceptById('cerebellum-left-hemisphere.extra'),null);
  assert.equal(headImageConcept({id:'mrb.cer.cerebellum',label:'Cerebellum — regional mask',laterality:'midline_or_unpaired',representation:'mask'},'MRI'),null);
});

test('existing 3D mappings and picker admission stay unchanged', () => {
  const pons:HeadEntry={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask'};
  assert.deepEqual(headImageConcept(pons,'CT'),headAtlasConcept(pons,'CT'));
  assert.deepEqual(headImageConceptById('brainstem-pons'),headConceptById('brainstem-pons'));
  assert.equal(resolveHeadImageConcept([pons],'brainstem-pons','CT'),pons);
  for (const item of cases) {
    assert.equal(headConceptById(item.conceptId),null);
    assert.equal(headConceptFromAtlasQuery(new URLSearchParams({concept:item.conceptId})),null);
  }
});

test('draft packet pins exact six image bindings without media or approval', () => {
  const packet=headImageOnlyComparisonPacket();
  assert.equal(packet.schema,'vm-head-image-only-comparison-1');
  assert.equal(packet.headRevision,HEAD_LINK_REVISION);
  assert.equal(packet.status,'draft');
  assert.equal(packet.clinicalApproval,false);
  assert.equal(packet.patientRegistration,false);
  assert.equal(packet.bindings.length,3);
  for (const item of cases) {
    const binding=packet.bindings.find(value=>value.conceptId===item.conceptId);
    assert.deepEqual(binding,{
      conceptId:item.conceptId,
      ct:entry(item,'CT'),
      mri:entry(item,'MRI'),
    });
  }
  assert.doesNotMatch(JSON.stringify(packet),/atlasHref|geometry|coordinate|source|media|approved/i);
});
