import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as facial from '../lib/head-ct-facial-learning.ts';
import * as comparison from '../lib/head-ct-facial-comparison-review.ts';
import * as bone from '../lib/head-ct-bone-learning.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as links from '../lib/head-atlas-links.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const load=(transform:(source:string)=>string,imports:Record<string,unknown>={})=>{
  const source=transform(readFileSync(new URL('../lib/head-ct-facial-learning.ts',import.meta.url),'utf8'));
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as any};
  new Function('require','module','exports',code)((id:string)=>imports[id]??require(id),module,module.exports);
  return module.exports;
};
const imports={'./head-atlas-links.ts':links,'./head-ct-facial-comparison-review.ts':comparison};
const ids=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];

test('facial guide is a separately pinned, detached CT-only draft',async()=>{
  const packet=facial.headCtFacialLearningPacket();
  assert.equal(packet.sequences.length,1);
  assert.equal(packet.sequences[0].id,'ct-facial-coverage');
  assert.equal(packet.sequences[0].label,'Facial bone coverage · CT only');
  assert.deepEqual(packet.sequences[0].concepts,ids);
  assert.equal(packet.comparisonRevision,comparison.HEAD_CT_FACIAL_COMPARISON_REVISION);
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(packet[flag],false);
  for(const phrase of ['zygomatic masks cover limited regions','mandible regional mask is not evidence of a complete whole bone','native orientation markers','adjacent slices','hide overlays','generic 3D bones separately','No exact MRI target','not a continuous anatomical pathway','spatial registration','diagnosis','quiz scores','do not approve the sequence'])assert(packet.scope.includes(phrase),phrase);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),facial.HEAD_CT_FACIAL_LEARNING_REVISION);
  assert.equal(await facial.verifiedHeadCtFacialLearningRevision(links.HEAD_LINK_REVISION),facial.HEAD_CT_FACIAL_LEARNING_REVISION);
  assert.equal(await facial.verifiedHeadCtFacialLearningRevision('stale'),null);
  for(const binding of packet.sequences[0].bindings){assert(binding?.ctHref&&binding.atlasHref);assert.equal(binding.mriHref,undefined);}
  packet.sequences[0].concepts.reverse();packet.sequences[0].bindings[0]!.label='changed';
  assert.deepEqual(facial.headCtFacialLearningPacket().sequences[0].concepts,ids);
  assert.deepEqual(facial.headCtFacialLearningPacket().sequences[0].bindings,comparison.headCtFacialComparisonPacket().items.map(item=>item.binding));
  assert.equal(createHash('sha256').update(JSON.stringify(comparison.headCtFacialComparisonPacket())).digest('hex'),comparison.HEAD_CT_FACIAL_COMPARISON_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(bone.headCtBoneLearningPacket())).digest('hex'),bone.HEAD_CT_BONE_LEARNING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(learning.headLearningPacket())).digest('hex'),learning.HEAD_LEARNING_REVISION);
});

test('stale or altered concept, order, wording, scope and revision fail closed',async()=>{
  for(const transform of [
    (s:string)=>s.replace("'bone-left-zygomatic','bone-right-zygomatic'","'bone-right-zygomatic','bone-left-zygomatic'"),
    (s:string)=>s.replace("id:'ct-facial-coverage'","id:'ct-facial-changed'"),
    (s:string)=>s.replace('Both zygomatic masks cover limited regions','Both zygomatic masks cover whole bones'),
    (s:string)=>s.replace("HEAD_CT_FACIAL_LEARNING_REVISION='c3c4b999e726c585c96a989dc3c1a2cf2b5991e2160c138b2977c7e06dbaae83'","HEAD_CT_FACIAL_LEARNING_REVISION='forged'"),
  ])assert.equal(await load(transform,imports).verifiedHeadCtFacialLearningRevision(links.HEAD_LINK_REVISION),null);
  const stale=load(s=>s,{...imports,'./head-ct-facial-comparison-review.ts':{...comparison,verifiedHeadCtFacialComparisonPacket:async()=>null}});
  assert.equal(await stale.verifiedHeadCtFacialLearningRevision(links.HEAD_LINK_REVISION),null);
});

test('altered source binding and invented MRI route fail closed',async()=>{
  for(const change of [
    (b:any)=>({...b,ctHref:'/atlas/ct-head?concept=bone-occipital'}),
    (b:any)=>({...b,atlasHref:'/atlas/head-neck-3d?source=wrong'}),
    (b:any)=>({...b,mriHref:'/atlas/mri-head?concept=bone-mandible'}),
  ]){
    const altered=load(s=>s,{...imports,'./head-atlas-links.ts':{...links,headConceptById:(id:string)=>change(links.headConceptById(id))}});
    assert.equal(await altered.verifiedHeadCtFacialLearningRevision(links.HEAD_LINK_REVISION),null);
  }
});

test('registered CT guide preserves missing canonical slots and has no MRI route',()=>{
  const sequence=learning.headLearningSequencesForModality('CT').find(item=>item.id==='ct-facial-coverage');
  assert.deepEqual(sequence?.concepts,ids);
  assert.equal(learning.headLearningSequencesForModality('MRI').some(item=>item.id==='ct-facial-coverage'),false);
  const entries=comparison.headCtFacialComparisonPacket().items.map(item=>({...item.ct,family:'fac',color:[1,0,0],opacity:{fill:.2,outline:1}} as HeadEntry));
  const steps=learning.headLearningSteps([entries[2],entries[0]],'ct-facial-coverage','CT',links.HEAD_LINK_REVISION);
  assert.deepEqual(steps.map(step=>step.conceptId),ids);
  assert.deepEqual(steps.map(step=>step.index),[0,1,2]);
  assert.deepEqual(steps.map(step=>step.entry),[entries[0],null,entries[2]]);
  assert.deepEqual(learning.headLearningSteps(entries,'ct-facial-coverage','MRI',links.HEAD_LINK_REVISION),[]);
  assert.deepEqual(learning.headLearningSteps(entries,'ct-facial-coverage','CT','stale'),[]);
  for(const conceptId of ids){
    const linksForStep=learning.headLearningLinks({sequenceId:'ct-facial-coverage',conceptId});
    assert(linksForStep?.ctHref&&linksForStep.atlasHref);
    assert.equal(linksForStep.mriHref,undefined);
  }
});
