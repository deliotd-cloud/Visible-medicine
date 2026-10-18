import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as bone from '../lib/head-ct-bone-learning.ts';
import * as comparison from '../lib/head-ct-bone-comparison-review.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as links from '../lib/head-atlas-links.ts';
import {headPracticeGuides} from '../lib/head-practice-learning.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const load=(path:string,imports:Record<string,unknown>,transform=(s:string)=>s)=>{
 const source=transform(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{} as any};new Function('require','module','exports',code)((id:string)=>imports[id]??require(id),module,module.exports);return module.exports;
};
const ids=['bone-left-parietal','bone-right-parietal','bone-occipital','bone-left-nasal','bone-right-nasal','bone-ethmoid'];
const entries=comparison.headCtBoneComparisonPacket().items.map(item=>({...item.ct,family:'skl',color:[1,0,0],opacity:{fill:.2,outline:1}} as HeadEntry));

test('six exact CT-only concepts form two independent ordered draft packets',async()=>{
 const packet=bone.headCtBoneLearningPacket();
 assert.deepEqual(packet.sequences.flatMap(s=>s.concepts),ids);
 assert.equal(packet.comparisonRevision,comparison.HEAD_CT_BONE_COMPARISON_REVISION);
 for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(packet[flag],false);
 assert.match(packet.scope,/partial, not a complete bone/);assert.match(packet.scope,/No exact MRI target/);assert.match(packet.scope,/do not approve a sequence/);
 assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),bone.HEAD_CT_BONE_LEARNING_REVISION);
 assert.equal(await bone.verifiedHeadCtBoneLearningRevision(links.HEAD_LINK_REVISION),bone.HEAD_CT_BONE_LEARNING_REVISION);
 assert.equal(await bone.verifiedHeadCtBoneLearningRevision('stale'),null);
 // Existing packets are not repinned by adding this extension.
 assert.equal(createHash('sha256').update(JSON.stringify(learning.headLearningPacket())).digest('hex'),learning.HEAD_LEARNING_REVISION);
 assert.deepEqual(await comparison.verifiedHeadCtBoneComparisonPacket(links.HEAD_LINK_REVISION),comparison.headCtBoneComparisonPacket());
});

test('every CT and source-pinned 3D step round-trips; MRI never offers these tours',()=>{
 assert.deepEqual(learning.headLearningSequencesForModality('MRI').filter(s=>s.id.startsWith('ct-')),[]);
 for(const sequence of bone.headCtBoneLearningSequences)for(const [index,conceptId]of sequence.concepts.entries()){
  const position={sequenceId:sequence.id,conceptId},dest=learning.headLearningLinks(position);assert(dest?.ctHref&&dest.atlasHref);
  assert.equal(dest.mriHref,undefined);
  assert.equal(headImageHref('CT',conceptId,position,links.HEAD_LINK_REVISION),dest.ctHref);
  assert.equal(headImageHref('MRI',conceptId,position,links.HEAD_LINK_REVISION),null);
  const imageQuery=new URL(dest.ctHref,'https://example.invalid').searchParams;
  assert.deepEqual(parseHeadImageNavigation(imageQuery,links.HEAD_LINK_REVISION,'CT'),{conceptId,position,invalid:false});
  assert.deepEqual(parseHeadImageNavigation(imageQuery,links.HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:null,invalid:true});
  for(const [href,surface]of [[dest.ctHref,'image'],[dest.atlasHref,'atlas']]as const){
   const query=new URL(href,'https://example.invalid').searchParams;
   assert.equal(query.get('headStep'),String(index));assert.equal(query.get('headRevision'),links.HEAD_LINK_REVISION);
   assert.deepEqual(learning.parseHeadLearningIntent(query,surface),position);
   if(surface==='atlas'){assert.equal(query.get('source'),'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4');assert.equal(links.headConceptFromAtlasQuery(query)?.conceptId,conceptId);}
   query.set('headRevision','stale');assert.equal(learning.parseHeadLearningIntent(query,surface),null);
  }
  const nav=learning.headLearningNavigation(position);assert(nav);
  assert.equal(nav.index,index);assert.equal(nav.previous===null,index===0);assert.equal(nav.next===null,index===2);assert.equal(nav.current.mriHref,undefined);
 }
});

test('missing or mismatched masks preserve canonical slots and do not substitute other anatomy',()=>{
 for(const sequence of bone.headCtBoneLearningSequences){
  const ordered=learning.headLearningSteps(entries,sequence.id,'CT',links.HEAD_LINK_REVISION);
  assert.equal(ordered.length,3);assert(ordered.every(s=>s.entry));
  assert.deepEqual(ordered.map(s=>s.conceptId),sequence.concepts);
  const first=ordered[0].entry!,last=ordered[2].entry!;
  const incomplete=learning.headLearningSteps([last,first],sequence.id,'CT',links.HEAD_LINK_REVISION);
  assert.deepEqual(incomplete.map(s=>s.entry),[first,null,last]);assert.deepEqual(incomplete.map(s=>s.index),[0,1,2]);
  assert.equal(learning.headLearningSteps([{...first,laterality:'wrong'}],sequence.id,'CT',links.HEAD_LINK_REVISION)[0].entry,null);
  assert.deepEqual(learning.headLearningSteps(entries,sequence.id,'MRI',links.HEAD_LINK_REVISION),[]);
  assert.deepEqual(learning.headLearningSteps(entries,sequence.id,'CT','stale'),[]);
  assert.deepEqual(headPracticeGuides(first,'CT',links.HEAD_LINK_REVISION).map(s=>s.id),[sequence.id]);
  assert.deepEqual(headPracticeGuides(first,'MRI',links.HEAD_LINK_REVISION),[]);
 }
});

test('altered order, wording, source or invented MRI mapping invalidate independent review',async()=>{
 const imports={'./head-atlas-links.ts':links,'./head-ct-bone-comparison-review.ts':comparison};
 for(const edit of [
  (s:string)=>s.replace("'bone-left-parietal','bone-right-parietal'","'bone-right-parietal','bone-left-parietal'"),
  (s:string)=>s.replace('partial, not a complete bone','complete bone'),
  (s:string)=>s.replace("label:'Nasal and ethmoid coverage · CT only'","label:'Changed tour'"),
 ])assert.equal(await load('lib/head-ct-bone-learning.ts',imports,edit).verifiedHeadCtBoneLearningRevision(links.HEAD_LINK_REVISION),null);
 for(const change of [(b:any)=>({...b,mriHref:'/atlas/mri-head?concept=bone-occipital'}),(b:any)=>({...b,atlasHref:'/atlas/head-neck-3d?source=wrong'})]){
  const altered=load('lib/head-ct-bone-learning.ts',{...imports,'./head-atlas-links.ts':{...links,headConceptById:(id:string)=>change(links.headConceptById(id))}});
  assert.equal(await altered.verifiedHeadCtBoneLearningRevision(links.HEAD_LINK_REVISION),null);
 }
 const stale=load('lib/head-ct-bone-learning.ts',{...imports,'./head-ct-bone-comparison-review.ts':{...comparison,verifiedHeadCtBoneComparisonPacket:async()=>null}});
 assert.equal(await stale.verifiedHeadCtBoneLearningRevision(links.HEAD_LINK_REVISION),null);
});

test('authorized Review evidence is collapsed, independently verified and offers all six exact steps',async()=>{
 const imports={'../lib/head-ct-bone-learning':bone,'../lib/head-atlas-learning':learning};
 const component=load('components/HeadCtBoneLearningReview.tsx',imports).HeadCtBoneLearningReview;
 const html=renderToStaticMarkup(await component({manifestRevision:links.HEAD_LINK_REVISION}));
 assert.match(html,/2 draft sequences/);assert(html.includes(bone.HEAD_CT_BONE_LEARNING_REVISION));
 assert.equal((html.match(/Inspect CT step/g)??[]).length,6);assert.equal((html.match(/Inspect 3D step/g)??[]).length,6);
 assert.doesNotMatch(html,/mri-head|<form|<details open/);assert.match(html,/do not record tour approval/);
 for(const sequence of bone.headCtBoneLearningSequences)for(const conceptId of sequence.concepts){
  const dest=learning.headLearningLinks({sequenceId:sequence.id,conceptId});assert(dest?.atlasHref);
  assert(html.includes(dest.ctHref!.replaceAll('&','&amp;')));assert(html.includes(dest.atlasHref.replaceAll('&','&amp;')));
 }
 const stale=renderToStaticMarkup(await component({manifestRevision:'stale'}));assert.match(stale,/role="alert"/);assert.doesNotMatch(stale,/href=/);
 const review=readFileSync(new URL('../components/HeadCtBoneComparisonReview.tsx',import.meta.url),'utf8');assert.match(review,/<HeadCtBoneLearningReview manifestRevision=\{packet.headRevision\}/);
 const route=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');assert(route.indexOf('await authorizeClinicalReview()')<route.indexOf('await verifiedHeadCtBoneComparisonPacket'));
});
