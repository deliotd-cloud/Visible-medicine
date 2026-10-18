import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {HEAD_LINK_REVISION,headAtlasConcept,headAtlasConceptOptions,headConceptById,headConceptFromAtlasQuery,resolveHeadConcept,type HeadEntry} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingForConcept,headTeachingForReference,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket,headLearningSequences} from '../lib/head-atlas-learning.ts';
import {HEAD_MRI_COMPARISON_REVISION,headMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingForConcept,headMriOnlyTeachingForReference,headMriOnlyTeachingPacket} from '../lib/head-mri-only-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION,headMriLearningPacket,headMriLearningSequences} from '../lib/head-mri-learning.ts';

const runtime=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
const root='vm:anatomy:body:head-neck:';
const parent=`${root}midline:organ:brain`;
const parentHash='f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const cerebralHash='7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410';
const cases=(['left','right'] as const).map(side=>({
  side,conceptId:`cortex-${side}-insula`,label:`${side==='left'?'Left':'Right'} insula`,
  part:`${root}${side}:organ:${side}-insula`,
  ct:{id:`cth.ctx.insula.${side}`,label:`${side==='left'?'Left':'Right'} insula — regional mask`,laterality:side,representation:'mask'} as HeadEntry,
  mri:{id:`mrb.ctx.insula.${side}`,label:`${side==='left'?'Left':'Right'} insula — regional mask`,laterality:side,representation:'partial-mask'} as HeadEntry,
}));

test('two insula concepts require exact native CT and partial MRI masks and link to the pinned cerebral target',()=>{
  assert.equal(cases.length,2);
  const options=headAtlasConceptOptions();
  for(const item of cases){
    assert.deepEqual(options.filter(option=>option.conceptId===item.conceptId),[{conceptId:item.conceptId,label:item.label}]);
    const link=headConceptById(item.conceptId);assert(link);
    assert.equal(link.conceptId,item.conceptId);
    assert.equal(link.label,item.label);
    assert.equal(link.headRevision,HEAD_LINK_REVISION);
    assert.equal(link.ctHref,`/atlas/ct-head?concept=${item.conceptId}`);
    assert.equal(link.mriHref,`/atlas/mri-head?concept=${item.conceptId}`);
    assert.deepEqual(headAtlasConcept(item.ct,'CT'),link);
    assert.deepEqual(headAtlasConcept(item.mri,'MRI'),link);
    assert.equal(resolveHeadConcept([item.ct],item.conceptId,'CT'),item.ct);
    assert.equal(resolveHeadConcept([item.mri],item.conceptId,'MRI'),item.mri);
    assert.match(link.scopeNote,/MRI.*partial|partial.*MRI|MRI.*regional portion|regional portion.*MRI/i);
    assert.match(link.scopeNote,/CT/);
    assert.match(link.scopeNote,/different|separate/i);
    assert.match(link.scopeNote,/unregistered/);
    assert.match(link.scopeNote,/no .*clinical.*sign.off/i);

    const url=new URL(link.atlasHref,'https://example.invalid');
    assert.equal(url.pathname,'/atlas/head-neck-3d');
    assert.deepEqual(Object.fromEntries(url.searchParams),{
      study:'2',structure:parent,side:item.side,source:parentHash,
      detail:'cerebral',part:item.part,partSource:cerebralHash,concept:item.conceptId,
    });
    assert.deepEqual(headConceptFromAtlasQuery(url.searchParams),link);
    const targets=runtime.nestedTargets.filter((target:{structureId:string;study:string})=>target.structureId===item.part&&target.study==='cerebral');
    assert.deepEqual(targets,[{parentId:parent,parentHash,study:'cerebral',title:'Cerebral regions',structureId:item.part,sourceHash:cerebralHash}]);
    const bundle=runtime.modelBundles.find((value:{id:string})=>value.id==='cerebral');assert(bundle);
    assert.equal(bundle.sha256,cerebralHash);
  }
});

test('insula allowlist rejects swapped modality, side, representation, labels and point or curve substitutes',()=>{
  for(const item of cases){
    assert.equal(headAtlasConcept(item.ct,'MRI'),null);
    assert.equal(headAtlasConcept(item.mri,'CT'),null);
    assert.equal(resolveHeadConcept([item.ct],item.conceptId,'MRI'),null);
    assert.equal(resolveHeadConcept([item.mri],item.conceptId,'CT'),null);
    for(const [entry,modality] of [[item.ct,'CT'],[item.mri,'MRI']] as const){
      for(const changed of [
        {...entry,id:`${entry.id}.stale`},
        {...entry,id:entry.id.replace(/\.insula\./,'.insula_point.')},
        {...entry,id:entry.id.replace(/\.insula\./,'.insula_curve.')},
        {...entry,label:item.label},
        {...entry,label:entry.label.replace(' — regional mask',' — point locator')},
        {...entry,laterality:item.side==='left'?'right':'left'},
        {...entry,representation:entry.representation==='mask'?'partial-mask':'mask'},
      ]){
        assert.equal(headAtlasConcept(changed,modality),null,JSON.stringify(changed));
        assert.equal(resolveHeadConcept([changed],item.conceptId,modality),null);
      }
    }
    const valid=new URL(headConceptById(item.conceptId)!.atlasHref,'https://example.invalid').searchParams;
    for(const key of ['concept','study','structure','side','source','detail','part','partSource']){
      const stale=new URLSearchParams(valid);stale.set(key,'stale');assert.equal(headConceptFromAtlasQuery(stale),null,key);
      const absent=new URLSearchParams(valid);absent.delete(key);assert.equal(headConceptFromAtlasQuery(absent),null,key);
      const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);assert.equal(headConceptFromAtlasQuery(duplicate),null,key);
    }
    const swapped=new URLSearchParams(valid);swapped.set('part',cases.find(other=>other.side!==item.side)!.part);
    assert.equal(headConceptFromAtlasQuery(swapped),null,'opposite insula part cannot be returned');
  }
});

test('existing teaching and guided packets retain their verified revisions; insula has no inherited teaching or approval',()=>{
  const original=headTeachingPacket(),guided=headLearningPacket();
  assert.equal(original.content.notes.length,25);
  assert.equal(guided.sequences.length,5);
  assert.equal(headLearningSequences.length,5);
  assert.equal(guided.sequences.flatMap(sequence=>sequence.concepts).length,25);
  assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
  assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(guided)).digest('hex'),HEAD_LEARNING_REVISION);

  const comparison=headMriComparisonPacket(),mriTeaching=headMriOnlyTeachingPacket(),mriGuided=headMriLearningPacket();
  assert.equal(comparison.items.length,4);
  assert.equal(mriTeaching.content.notes.length,4);
  assert.equal(headMriLearningSequences.length,2);
  assert.equal(mriGuided.sequences.flatMap(sequence=>sequence.concepts).length,4);
  for(const [packet,revision,expected] of [
    [comparison,HEAD_MRI_COMPARISON_REVISION,'599dcb6159ba58b16bd26d67810238155911c4d011dd03f7172faa554f6b531f'],
    [mriTeaching,HEAD_MRI_ONLY_TEACHING_REVISION,'fc36d805260460f51b5be65a074a4d70624b7f63e77039f2b670d10c96b5004c'],
    [mriGuided,HEAD_MRI_LEARNING_REVISION,'252282ae46e9485bc6fc43d2674c792083d75bb71828750c3e27ee42ad8bff47'],
  ] as const){
    assert.equal(revision,expected);
    assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),revision);
  }
  for(const id of cases.map(item=>item.conceptId)){
    assert.equal(headTeachingForConcept(id,'CT',HEAD_LINK_REVISION),null);
    assert.equal(headTeachingForConcept(id,'MRI',HEAD_LINK_REVISION),null);
    assert.equal(headTeachingForReference(id,HEAD_LINK_REVISION),null);
    assert.equal(headMriOnlyTeachingForConcept(id,'MRI',HEAD_LINK_REVISION),null);
    assert.equal(headMriOnlyTeachingForReference(id,HEAD_LINK_REVISION),null);
    assert(!guided.sequences.some(sequence=>sequence.concepts.includes(id)));
    assert(!mriGuided.sequences.some(sequence=>sequence.concepts.includes(id)));
    assert(!comparison.items.some(item=>item.conceptId===id));
  }
  for(const packet of [comparison,mriTeaching.content,mriGuided]){
    assert.equal(packet.status,'draft');
    assert.equal(packet.clinicalApproval,false);
    assert.equal(packet.publicationApproval,false);
  }
});
