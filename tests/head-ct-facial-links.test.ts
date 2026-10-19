import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById,headConceptFromAtlasQuery,resolveHeadConcept} from '../lib/head-atlas-links.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {conceptForHeadSelection} from '../lib/head-live-selection.ts';
import {headTeachingForConcept} from '../lib/head-atlas-teaching.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import * as facial from '../lib/head-ct-facial-comparison-review.ts';

const sourceHash='c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4';
const rows=[
  ['bone-left-zygomatic','cth.fac.zygomatic_bone.left','Left zygomatic bone — limited region','left','partial-mask','left:bone:left-zygomatic-bone'],
  ['bone-right-zygomatic','cth.fac.zygomatic_bone.right','Right zygomatic bone — limited region','right','partial-mask','right:bone:right-zygomatic-bone'],
  ['bone-mandible','cth.fac.mandible','Mandible — regional mask','midline_or_unpaired','mask','midline:bone:mandible'],
] as const;
const entries=rows.map(([,id,label,laterality,representation])=>({id,label,laterality,representation}));
const require=createRequire(import.meta.url);
function loadAltered(transform:(source:string)=>string,links:unknown={HEAD_LINK_REVISION,headAtlasConcept,headConceptById}){
  const source=transform(readFileSync(new URL('../lib/head-ct-facial-comparison-review.ts',import.meta.url),'utf8'));
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as any};
  new Function('require','module','exports',code)((id:string)=>id==='./head-atlas-links.ts'?links:require(id),mod,mod.exports);
  return mod.exports;
}

test('three facial CT concepts bind the actual generic skeleton bundle and exact native identities',()=>{
  const runtime=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
  const catalog=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
  const bytes=readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/head-neck-skeleton.glb',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sourceHash);
  assert.equal(HEAD_LINK_REVISION,'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5');
  assert.deepEqual([...facial.CT_FACIAL_COMPARISON_CONCEPTS],rows.map(row=>row[0]));
  rows.forEach(([conceptId,, ,laterality,,suffix],index)=>{
    const structureId='vm:anatomy:body:head-neck:'+suffix;
    const structure=catalog.structures.find((item:{id:string})=>item.id===structureId);assert(structure);
    assert.equal(structure.bundle,'head-neck-skeleton');assert(runtime.regionalIds.includes(structureId));
    assert.equal(runtime.modelBundles.find((item:{id:string})=>item.id===structure.bundle).sha256,sourceHash);
    const link=headConceptById(conceptId)!;assert(link);assert.equal(link.headRevision,HEAD_LINK_REVISION);
    assert.equal(link.ctHref,`/atlas/ct-head?concept=${conceptId}`);assert(!Object.hasOwn(link,'mriHref'));
    const query=new URLSearchParams({study:'1',structure:structureId,side:laterality==='midline_or_unpaired'?'both':laterality,source:sourceHash,concept:conceptId});
    assert.equal(link.atlasHref,`/atlas/head-neck-3d?${query}`);
    assert.equal(headConceptFromAtlasQuery(query)?.conceptId,conceptId);
    assert.deepEqual(headAtlasConcept(entries[index],'CT'),link);
    assert.equal(resolveHeadConcept(entries,conceptId,'CT'),entries[index]);
    assert.equal(resolveHeadConcept([...entries,entries[index]],conceptId,'CT'),null,'Duplicate native target stays unresolved');
    for(const key of ['label','laterality','representation'])
      assert.equal(resolveHeadConcept([...entries,{...entries[index],[key]:'changed'}],conceptId,'CT'),null,'Same native ID with conflicting metadata stays unresolved');
    assert.equal(headAtlasConcept(entries[index],'MRI'),null);
    assert.equal(resolveHeadConcept(entries,conceptId,'MRI'),null);
    assert.match(link.scopeNote,/unregistered|different subjects/i);
    assert.equal(conceptForHeadSelection({kind:'root',id:structureId,source:sourceHash,laterality:structure.laterality})?.conceptId,conceptId);
    assert.equal(conceptForHeadSelection({kind:'root',id:structureId,source:'a'.repeat(64),laterality:structure.laterality}),null);
    for(const key of ['source','structure','side','study','concept']){
      const changed=new URLSearchParams(query);changed.set(key,'changed');assert.equal(headConceptFromAtlasQuery(changed),null);
      const duplicate=new URLSearchParams(query);duplicate.append(key,query.get(key)!);assert.equal(headConceptFromAtlasQuery(duplicate),null);
    }
    for(const key of ['id','label','laterality','representation'])assert.equal(headAtlasConcept({...entries[index],[key]:'changed'},'CT'),null);
  });
  assert.equal(headAtlasConcept(entries[0],'CT')?.conceptId,'bone-left-zygomatic');
});

test('facial navigation is CT only and creates no MRI, teaching or tour inference',()=>{
  for(const [conceptId] of rows){
    const query=new URLSearchParams({concept:conceptId});
    assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION,'CT'),{conceptId,position:null,invalid:false});
    assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:null,invalid:true});
    assert.equal(headImageHref('MRI',conceptId,null,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref('CT',conceptId,null,HEAD_LINK_REVISION),`${headConceptById(conceptId)!.ctHref}&headRevision=${HEAD_LINK_REVISION}`);
    assert.equal(parseHeadImageNavigation(query,'stale','CT').invalid,true);
    const duplicate=new URLSearchParams(query);duplicate.append('concept',conceptId);assert.equal(parseHeadImageNavigation(duplicate,HEAD_LINK_REVISION,'CT').invalid,true);
    assert.equal(headTeachingForConcept(conceptId,'CT',HEAD_LINK_REVISION),null);
    assert.equal(headLearningLinks({sequenceId:'brainstem',conceptId}),null);
  }
  for(const concept of ['bone-left-frontal','bone-left-temporal','cerebellum'])assert.equal(headConceptById(concept),null);
});

test('independent facial comparison packet is exact, source pinned and revision gated',async()=>{
  const packet=facial.headCtFacialComparisonPacket();
  assert.equal(packet.packetId,'head-ct-facial-comparisons');assert.equal(packet.items.length,3);
  assert.equal(packet.headRevision,HEAD_LINK_REVISION);
  assert.equal(packet.patientRegistration,false);assert.equal(packet.clinicalApproval,false);assert.equal(packet.publicationApproval,false);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),facial.HEAD_CT_FACIAL_COMPARISON_REVISION);
  assert.deepEqual(await facial.verifiedHeadCtFacialComparisonPacket(HEAD_LINK_REVISION),packet);
  assert.equal(await facial.verifiedHeadCtFacialComparisonPacket('stale'),null);
  rows.forEach(([conceptId,id,label,laterality,representation,suffix],index)=>{
    const item=packet.items[index];assert.equal(item.conceptId,conceptId);
    assert.deepEqual(item.ct,{id,label,laterality,representation});
    assert.deepEqual(item.atlas,{structureId:'vm:anatomy:body:head-neck:'+suffix,sourceHash,study:'1',side:laterality==='midline_or_unpaired'?'both':laterality});
    assert.deepEqual(item.binding,headConceptById(conceptId));
  });
  for(const edit of [
    (s:string)=>s.replace('cth.fac.zygomatic_bone.left','cth.fac.zygomatic_bone.right'),
    (s:string)=>s.replace("sourceHash='c1b950", "sourceHash='a1b950"),
    (s:string)=>s.replace('head-ct-facial-comparisons','head-ct-bone-comparisons'),
    (s:string)=>s.replace("['bone-right-zygomatic','cth.fac.zygomatic_bone.right'", "['bone-left-zygomatic','cth.fac.zygomatic_bone.left'"),
  ]){
    const source=readFileSync(new URL('../lib/head-ct-facial-comparison-review.ts',import.meta.url),'utf8');
    assert.notEqual(edit(source),source,'Mutation fixture must change source');
    assert.equal(await loadAltered(edit).verifiedHeadCtFacialComparisonPacket(HEAD_LINK_REVISION),null);
  }
});
