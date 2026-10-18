import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import * as orbital from '../lib/head-orbital-comparison-review.ts';
import {headTeachingForConcept} from '../lib/head-atlas-teaching.ts';
import {headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
const runtime=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const packet=orbital.headOrbitalComparisonPacket();
function compile(path:string,imports:Record<string,unknown>){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(
    name==='./HeadReviewImageLink'?headReviewImageLinkModule:
    name==='./HeadPairedDecisionPanel'?compile('../components/HeadPairedDecisionPanel.tsx',{
      './HeadPairedDecisionForm':{HeadPairedDecisionForm:()=>{throw Error('A closed review panel must not render a decision form.');}},
    }):name.startsWith('../lib/')?require(name+'.ts'):name==='./HeadAtlasTeaching'?{HeadAtlasTeaching:()=>null}:require(name)),mod,mod.exports);return mod.exports;
}

test('both globes resolve exact CT/partial MRI identities to their existing source-pinned 3D eyeballs',()=>{
  assert.equal(packet.items.length,2);
  for(const item of packet.items){
    const binding=links.headConceptById(item.conceptId);assert(binding);
    assert.equal(links.headAtlasConceptOptions().filter(x=>x.conceptId===item.conceptId).length,1);
    assert.deepEqual(links.headAtlasConcept(item.ct,'CT'),binding);
    assert.deepEqual(links.headAtlasConcept(item.mri,'MRI'),binding);
    assert.equal(links.resolveHeadConcept([item.ct],item.conceptId,'CT'),item.ct);
    assert.equal(links.resolveHeadConcept([item.mri],item.conceptId,'MRI'),item.mri);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert.match(binding.scopeNote,/partial MRI/);assert.match(binding.scopeNote,/unregistered/);
    const query=new URL(binding.atlasHref,'https://example.invalid').searchParams;
    assert.deepEqual(Object.fromEntries(query),{study:'1',structure:item.atlas.structureId,side:item.atlas.side,source:item.atlas.sourceHash,concept:item.conceptId});
    assert.deepEqual(links.headConceptFromAtlasQuery(query),binding);
    assert(runtime.regionalIds.includes(item.atlas.structureId));
    const row=catalog.structures.find((x:{id:string})=>x.id===item.atlas.structureId);assert(row);
    assert.equal(row.bundle,'head-neck-organs-recovery');assert.equal(row.laterality,item.atlas.side);
    assert.equal(row.validation.anatomicalReview,false);
    const bundle=runtime.modelBundles.find((x:{id:string})=>x.id===row.bundle);assert.equal(bundle.sha256,item.atlas.sourceHash);
    assert.equal(headTeachingForConcept(item.conceptId,'CT',links.HEAD_LINK_REVISION),null);
    assert.deepEqual(headLearningSequencesForModality().filter(s=>s.concepts.includes(item.conceptId)).map(s=>s.id),['globes'],'only the separately bound draft sequence includes globes');
  }
});

test('no side, modality, lens, orbit, optic nerve or annotation substitutes are accepted',()=>{
  for(const item of packet.items){
    for(const [entry,modality] of [[item.ct,'CT'],[item.mri,'MRI']] as const){
      assert.equal(links.headAtlasConcept(entry,modality==='CT'?'MRI':'CT'),null);
      for(const changed of [
        {...entry,id:entry.id+'.stale'},...['lens','orbit','optic_nerve'].map(name=>({...entry,id:entry.id.replace('globe',name)})),
        {...entry,label:entry.label.replace(' — regional mask','')},
        {...entry,laterality:entry.laterality==='left'?'right':'left'},
        ...['point','curve',entry.representation==='mask'?'partial-mask':'mask'].map(representation=>({...entry,representation})),
      ]){
        assert.equal(links.headAtlasConcept(changed,modality),null);
        assert.equal(links.resolveHeadConcept([changed],item.conceptId,modality),null);
      }
    }
    const query=new URL(item.binding!.atlasHref,'https://example.invalid').searchParams;
    for(const key of ['concept','study','structure','side','source']){
      for(const mode of ['changed','missing','duplicate']){
        const q=new URLSearchParams(query);
        if(mode==='missing')q.delete(key);else if(mode==='changed')q.set(key,'stale');else q.append(key,q.get(key)!);
        assert.equal(links.headConceptFromAtlasQuery(q),null);
      }
    }
    for(const key of ['focus','detail','part','partSource']){const q=new URLSearchParams(query);q.set(key,'extra');assert.equal(links.headConceptFromAtlasQuery(q),null);}
  }
});

test('separate comparison packet verifies exact revision; stale/missing/altered bindings fail closed',async()=>{
  assert.equal(packet.status,'draft');assert.equal(packet.clinicalApproval,false);assert.equal(packet.patientRegistration,false);assert.equal(packet.publicationApproval,false);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),orbital.HEAD_ORBITAL_COMPARISON_REVISION);
  assert.deepEqual(await orbital.verifiedHeadOrbitalComparisonPacket(links.HEAD_LINK_REVISION),packet);
  assert.equal(await orbital.verifiedHeadOrbitalComparisonPacket('stale'),null);
  const isolate=(overrides:Partial<typeof links>)=>compile('../lib/head-orbital-comparison-review.ts',{'./head-atlas-links.ts':{...links,...overrides}}) as typeof orbital;
  for(const overrides of [{headAtlasConcept:()=>null},{headConceptById:()=>null}])assert.equal(await isolate(overrides).verifiedHeadOrbitalComparisonPacket(links.HEAD_LINK_REVISION),null);
  for(const field of ['ctHref','mriHref','atlasHref','scopeNote','headRevision'] as const){
    const change=(link:ReturnType<typeof links.headConceptById>)=>link?{...link,[field]:link[field]+'-changed'}:null;
    const mod=isolate({headConceptById:id=>change(links.headConceptById(id)),headAtlasConcept:(entry,modality)=>change(links.headAtlasConcept(entry,modality))});
    assert.equal(await mod.verifiedHeadOrbitalComparisonPacket(links.HEAD_LINK_REVISION),null,field);
  }
  const mutated=orbital.headOrbitalComparisonPacket();mutated.items[0].ct.label='wrong';mutated.reviewChecks[0]='changed';
  assert.deepEqual(orbital.headOrbitalComparisonPacket(),packet);
});

test('review renders collapsed exact evidence with explicit lazy per-globe review entry',()=>{
  const {HeadOrbitalComparisonReview:Component}=compile('../components/HeadOrbitalComparisonReview.tsx',{'../lib/head-orbital-comparison-review':orbital}) as {HeadOrbitalComparisonReview:React.ComponentType<{packet:typeof packet|null}>};
  const html=renderToStaticMarkup(React.createElement(Component,{packet}));
  assert.match(html,/Globe comparisons/);assert.match(html,/record your private review/);assert.match(html,/partial MRI/);
  assert.match(html,new RegExp(orbital.HEAD_ORBITAL_COMPARISON_REVISION));
  assert.equal((html.match(/<a /g)||[]).length,6);assert.equal((html.match(/<details/g)||[]).length,3);
  assert.doesNotMatch(html,/<form|<input|<details open/);
  assert.equal((html.match(/<button type="button">Review /g)||[]).length,2);
  for(const item of packet.items){assert(html.includes('id="head-orbital-comparison-'+item.conceptId+'"'));assert(html.includes(item.atlas.structureId));assert(html.includes(`Review ${item.binding!.label} comparison`));}
  const absent=renderToStaticMarkup(React.createElement(Component,{packet:null}));assert.match(absent,/role="alert"/);assert.doesNotMatch(absent,/Inspect|<a |<button|<form|46dad07e/);
});
