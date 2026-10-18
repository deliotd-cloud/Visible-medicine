import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById,headConceptFromAtlasQuery,resolveHeadConcept,type HeadEntry} from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {HEAD_TEACHING_REVISION,headTeachingForConcept,headTeachingForReference,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket,headLearningSequences} from '../lib/head-atlas-learning.ts';

const runtime=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const deepHash='6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c';
const pituitaryHash='7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915';
const root='vm:anatomy:body:head-neck:';
const cases=[
  {conceptId:'limbic-left-amygdala',entry:{id:'mrb.dgm.amygdala.left',label:'Left amygdala — regional mask',laterality:'left',representation:'mask'},
    atlasId:`${root}left:organ:left-amygdala`,side:'left',source:deepHash,bundle:'head-neck-nerves-deep-brain'},
  {conceptId:'limbic-right-amygdala',entry:{id:'mrb.dgm.amygdala.right',label:'Right amygdala — regional mask',laterality:'right',representation:'mask'},
    atlasId:`${root}right:organ:right-amygdala`,side:'right',source:deepHash,bundle:'head-neck-nerves-deep-brain'},
  {conceptId:'commissure-corpus-callosum',entry:{id:'mrb.wmt.corpus_callosum',label:'Corpus callosum — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask'},
    atlasId:`${root}midline:organ:corpus-callosum`,side:'both',source:deepHash,bundle:'head-neck-nerves-deep-brain'},
  {conceptId:'endocrine-pituitary-gland',entry:{id:'mrb.orb.pituitary_gland',label:'Pituitary gland — regional mask',laterality:'midline_or_unpaired',representation:'mask'},
    atlasId:`${root}unpaired:organ:pituitary-gland`,side:'both',source:pituitaryHash,bundle:'head-neck-organs-recovery'},
] as const;

test('four exact MRI-only entries bind standalone public targets and never gain CT counterparts',()=>{
  assert.equal(cases.length,4);
  for(const item of cases){
    const entry:HeadEntry=item.entry;
    const link=headAtlasConcept(entry,'MRI');assert(link,item.conceptId);
    assert.equal(link.conceptId,item.conceptId);
    assert.deepEqual(link,headConceptById(item.conceptId));
    assert.equal(link.headRevision,HEAD_LINK_REVISION);
    assert.equal(link.ctHref,undefined);
    assert.equal(Object.hasOwn(link,'ctHref'),false);
    assert.equal(link.mriHref,`/atlas/mri-head?concept=${item.conceptId}`);
    assert.match(link.scopeNote,/MRI-only|No exact whole-concept CT comparison/);
    assert.match(link.scopeNote,/unregistered/);
    assert.equal(headAtlasConcept(entry,'CT'),null);
    assert.equal(headAtlasConcept({...entry,id:undefined} as unknown as HeadEntry,'CT'),null,'absent CT binding cannot match an absent malformed entry ID');
    assert.equal(resolveHeadConcept([entry],item.conceptId,'MRI'),entry);
    assert.equal(resolveHeadConcept([entry],item.conceptId,'CT'),null);
    assert.equal(headImageHref('MRI',item.conceptId,null,HEAD_LINK_REVISION),`${link.mriHref}&headRevision=${HEAD_LINK_REVISION}`);
    assert.equal(headImageHref('CT',item.conceptId,null,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref('MRI',item.conceptId,null,'stale'),null);
    const url=new URL(link.atlasHref,'https://example.invalid');
    assert.equal(url.pathname,'/atlas/head-neck-3d');
    assert.deepEqual(Object.fromEntries(url.searchParams),{study:'1',structure:item.atlasId,side:item.side,source:item.source,concept:item.conceptId});
    assert.deepEqual(headConceptFromAtlasQuery(url.searchParams),link);
    const row=catalog.structures.find((value:{id:string})=>value.id===item.atlasId);assert(row);
    assert.equal(row.bundle,item.bundle);
    assert.equal(row.validation.status,'unvalidated');
    assert.equal(row.validation.anatomicalReview,false);
    assert(runtime.regionalIds.includes(item.atlasId));
    const bundle=runtime.modelBundles.find((value:{id:string})=>value.id===item.bundle);assert(bundle);
    assert.equal(bundle.sha256,item.source);
    assert.equal(catalog.bundles.find((value:{id:string})=>value.id===item.bundle)?.sha256,item.source);
  }
});

test('MRI-only mappings reject changed saved identities and nearby CT substitutes',()=>{
  for(const item of cases){
    const entry:HeadEntry=item.entry;
    for(const changed of [
      {...entry,id:`${entry.id}.stale`},
      {...entry,label:entry.label.replace(' — regional mask','')},
      {...entry,laterality:item.side==='both'?'left':item.side==='left'?'right':'left'},
      {...entry,representation:entry.representation==='mask'?'partial-mask':'mask'},
    ]){
      assert.equal(headAtlasConcept(changed,'MRI'),null,JSON.stringify(changed));
      assert.equal(resolveHeadConcept([changed],item.conceptId,'MRI'),null);
    }
    for(const ct of [
      {...entry,id:entry.id.replace(/^mrb\./,'cth.')},
      {...entry,id:'cth.orb.pituitary_fossa'},
      {...entry,id:'cth.wmt.corpus_callosum_genu'},
      {...entry,id:'cth.dgm.amygdala_point.left'},
    ])assert.equal(headAtlasConcept(ct,'CT'),null,JSON.stringify(ct));
    assert.equal(headAtlasConcept(entry,'PET' as 'MRI'),null);
  }
});

test('standalone Atlas return links require the exact whole source tuple',()=>{
  for(const item of cases){
    const valid=new URL(headConceptById(item.conceptId)!.atlasHref,'https://example.invalid').searchParams;
    for(const key of ['concept','study','structure','side','source']){
      const missing=new URLSearchParams(valid);missing.delete(key);assert.equal(headConceptFromAtlasQuery(missing),null,`${item.conceptId} missing ${key}`);
      const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);assert.equal(headConceptFromAtlasQuery(duplicate),null,`${item.conceptId} duplicate ${key}`);
      const stale=new URLSearchParams(valid);stale.set(key,'stale');assert.equal(headConceptFromAtlasQuery(stale),null,`${item.conceptId} stale ${key}`);
    }
    for(const key of ['detail','part','partSource']){
      const extra=new URLSearchParams(valid);extra.set(key,'untrusted');assert.equal(headConceptFromAtlasQuery(extra),null,`${item.conceptId} extra ${key}`);
    }
    const swapped=new URLSearchParams(valid);swapped.set('source',item.source===deepHash?pituitaryHash:deepHash);
    assert.equal(headConceptFromAtlasQuery(swapped),null,`${item.conceptId} wrong bundle`);
  }
});

test('the existing twenty-five teaching and guided slots retain their exact packet identities',()=>{
  const teaching=headTeachingPacket(),guided=headLearningPacket();
  assert.equal(teaching.content.notes.length,25);
  assert.equal(guided.sequences.flatMap(sequence=>sequence.concepts).length,25);
  assert.equal(headLearningSequences.length,5);
  assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
  assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(teaching)).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(guided)).digest('hex'),HEAD_LEARNING_REVISION);
  for(const item of cases){
    assert.equal(headTeachingForConcept(item.conceptId,'MRI'),null);
    assert.equal(headTeachingForReference(item.conceptId,HEAD_LINK_REVISION),null);
    assert(!headLearningSequences.some(sequence=>sequence.concepts.includes(item.conceptId)));
  }
});
