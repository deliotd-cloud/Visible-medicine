import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {separateComparisonAwareRequire} from './head-separate-comparison-test-source.ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire,headFacialHookModule} from './head-facial-hook-loader.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headTeachingForConcept} from '../lib/head-atlas-teaching.ts';
import {headAnatomyCheckForConcept} from '../lib/head-anatomy-checks.ts';
import {headMriOnlyTeachingForConcept} from '../lib/head-mri-only-teaching.ts';
import {headCtBoneTeachingForConcept} from '../lib/head-ct-bone-teaching.ts';
import {headCerebellarTeachingForConcept} from '../lib/head-cerebellar-teaching.ts';
import {headInsulaTeachingForConcept} from '../lib/head-insula-teaching.ts';
import {headOrbitalTeachingForConcept} from '../lib/head-orbital-teaching.ts';

const require=separateComparisonAwareRequire(facialAwareRequire(createRequire(import.meta.url)));
const Link=({href,children,prefetch:_,...props}:any)=>React.createElement('a',{href,...props},children);
function component(path:string,dependencies:Record<string,unknown>={}){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((id:string)=>dependencies[id]??require(id.startsWith('../lib/')&&!id.endsWith('.ts')?id+'.ts':id),module,module.exports);
  return module.exports;
}
function concept(){
  if(!existsSync(new URL('../components/HeadAtlasConceptTeaching.tsx',import.meta.url)))return {HeadAtlasConceptTeaching:()=>null};
  const check=component('../components/HeadAnatomyCheck.tsx');
  return component('../components/HeadAtlasConceptTeaching.tsx',{'./HeadAnatomyCheck':check});
}
function guided(current=true){
  return component('../components/HeadAtlasGuidedLearning.tsx',{
    'next/link':{__esModule:true,default:Link},
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>React.createElement('p',null,'Saved-mask teaching')},
    './HeadAtlasConceptTeaching':concept(),
    '../lib/head-link-availability.ts':{
      headLinksCurrent:()=>current,HEAD_LINK_REVISION_NOTICE:'Stale source revision',
    },
  }).HeadAtlasGuidedLearning;
}
function show(modality:'CT'|'MRI',sequenceId:string,conceptId:string|null,entries:any[]=[],current=true,study=true){
  const Guided=guided(current);
  return renderToStaticMarkup(React.createElement(Guided,{
    study:study?{definition:{entries}}:null,modality,position:{sequenceId,conceptId},
    onPositionChange:()=>assert.fail('render must not navigate'),onSelect:()=>assert.fail('render must not select'),
    onPractice:()=>assert.fail('render must not start mask practice'),onCompare:()=>assert.fail('render must not compare a mask'),
  }));
}

test('CT first gap keeps canonical step and links while showing concept-only facts/check',()=>{
  const id='brainstem-midbrain',html=show('CT','brainstem',id);
  const teaching=headTeachingForConcept(id,'CT',HEAD_LINK_REVISION)!;
  const question=headAnatomyCheckForConcept(id,HEAD_LINK_REVISION)!.question;
  assert.match(html,/Step 1 \/ 3/);
  assert.match(html,/This step is unavailable in the loaded study/);
  assert.match(html,/No matching local mask/);
  assert(html.includes(teaching.note.anatomy.text));
  assert(html.includes(teaching.note.function.text));
  assert(html.includes(question.prompt));
  assert(html.includes(headLearningLinks({sequenceId:'brainstem',conceptId:id})!.atlasHref!.replaceAll('&','&amp;')));
  assert(html.includes(headLearningLinks({sequenceId:'brainstem',conceptId:id})!.mriHref!.replaceAll('&','&amp;')));
  assert.doesNotMatch(html,/Saved-mask teaching|Scroll through the saved mask|Find this structure · quick check|Compare this step beside 3D|Show this step|Clinical correlation/);
  assert.doesNotMatch(html,/Skull-base beam hardening|Try this|reading the image/);
});

test('MRI middle gap uses the requested concept without scan task or scored action',()=>{
  const id='brainstem-pons',html=show('MRI','brainstem',id);
  const teaching=headTeachingForConcept(id,'MRI',HEAD_LINK_REVISION)!;
  assert.match(html,/Step 2 \/ 3/);
  assert(html.includes(teaching.note.anatomy.text));
  assert(html.includes(teaching.note.function.text));
  assert(html.includes(headLearningLinks({sequenceId:'brainstem',conceptId:id})!.ctHref!.replaceAll('&','&amp;')));
  assert.doesNotMatch(html,/Saved-mask teaching|Scroll through the saved mask|Find this structure · quick check|Show this step|MRI pitfall|Try this/);
});

test('modality-only and image-only gaps use exact packet facts and only cited anatomy/function sources',()=>{
  for(const [id,modality,helper] of [
    ['limbic-left-amygdala','MRI',headMriOnlyTeachingForConcept],
    ['bone-left-parietal','CT',headCtBoneTeachingForConcept],
    ['cerebellum-vermis','MRI',headCerebellarTeachingForConcept],
  ] as const){
    const html=renderToStaticMarkup(React.createElement(concept().HeadAtlasConceptTeaching,{conceptId:id,modality,revision:HEAD_LINK_REVISION}));
    const value=helper(id,modality,HEAD_LINK_REVISION)!;
    assert(value,id);
    assert(html.includes(value.note.anatomy.text),id);
    assert(html.includes(value.note.function.text),id);
    assert(html.includes(value.revision),id);
    const cited=new Set([...value.note.anatomy.sources,...value.note.function.sources]);
    for(const source of value.sources)assert.equal(html.includes(source.url),cited.has(source.id),`${id}: ${source.id}`);
    assert.doesNotMatch(html,/Try this|reading the image|Clinical correlation|saved outline|Inspect the native/);
    if(id!=='cerebellum-vermis'){
      const wrong=modality==='MRI'?'CT':'MRI';
      assert.equal(renderToStaticMarkup(React.createElement(concept().HeadAtlasConceptTeaching,{conceptId:id,modality:wrong,revision:HEAD_LINK_REVISION})),'' );
    }
  }
});

test('stale revision, missing study and invalid step fail closed; available step keeps saved-mask teaching',()=>{
  const Concept=concept().HeadAtlasConceptTeaching;
  assert.equal(renderToStaticMarkup(React.createElement(Concept,{conceptId:'brainstem-midbrain',modality:'CT',revision:'0'.repeat(64)})),'' );
  assert.equal(renderToStaticMarkup(React.createElement(Concept,{conceptId:'unknown',modality:'CT',revision:HEAD_LINK_REVISION})),'' );
  assert.doesNotMatch(show('CT','brainstem','brainstem-midbrain',[],false),/No matching local mask|Check understanding/);
  assert.doesNotMatch(show('CT','brainstem','brainstem-midbrain',[],true,false),/No matching local mask|Check understanding/);
  assert.doesNotMatch(show('CT','brainstem','unknown'),/No matching local mask|Check understanding/);
  const pons={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'bst',color:[1,0,0],opacity:{fill:.2,outline:.9}};
  const available=show('CT','brainstem','brainstem-pons',[pons]);
  assert.match(available,/Saved-mask teaching|Scroll through the saved mask/);
  assert.doesNotMatch(available,/No matching local mask/);
});

test('canonical CT/MRI tour slots retain exact general notes, with facial packets withheld until verified',()=>{
  const escaped=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const facialConcepts=headFacialHookModule().FACIAL_CONCEPTS as Set<string>;
  const helpers=[headTeachingForConcept,headMriOnlyTeachingForConcept,headInsulaTeachingForConcept,
    headOrbitalTeachingForConcept,headCtBoneTeachingForConcept,headCerebellarTeachingForConcept];
  let slots=0;
  for(const modality of ['CT','MRI'] as const)for(const sequence of headLearningSequencesForModality(modality)){
    for(const [index,id] of sequence.concepts.entries()){
      const value=helpers.map(helper=>helper(id,modality,HEAD_LINK_REVISION)).find(Boolean);
      if(facialConcepts.has(id)){
        assert.equal(modality,'CT',`facial teaching must not substitute into ${modality}`);
        assert.equal(value,undefined,`${id}: no unverified legacy packet`);
        const html=show(modality,sequence.id,id);
        assert(html.includes(`Step ${index+1} / ${sequence.concepts.length}`));
        assert.doesNotMatch(html,/head-concept-teaching|Teaching packet|Image-reading tasks and scan-based practice/);
        slots++;
        continue;
      }
      assert(value,`${modality}:${sequence.id}:${id}`);
      const html=show(modality,sequence.id,id);
      assert(html.includes(`Step ${index+1} / ${sequence.concepts.length}`));
      assert(html.includes(escaped(value.note.anatomy.text)));
      assert(html.includes(escaped(value.note.function.text)));
      assert(html.includes(value.revision));
      assert(html.includes('Image-reading tasks and scan-based practice are unavailable'));
      assert(html.includes('References to a saved or regional mask describe the original teaching representation'));
      assert(!html.includes(escaped(value.imaging.text)),`${id}: no image guidance`);
      assert(!html.includes(escaped(value.note.task)),`${id}: no saved-mask task`);
      assert.doesNotMatch(html,/Clinical correlation|reading the image|Find this structure · quick check|Show this step|Compare this step beside 3D/);
      assert.match(html,/<details class="head-teaching head-concept-teaching">/);
      assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
      const links=headLearningLinks({sequenceId:sequence.id,conceptId:id})!;
      if(!links.atlasHref)assert(!html.includes('Open this step in the 3D Atlas'));
      slots++;
    }
  }
  assert.equal(slots,77);
});

test('missing first and middle slots in partial studies do not substitute another available mask',()=>{
  const entry=(modality:'CT'|'MRI',name:'midbrain'|'pons'|'medulla_oblongata',label:string)=>({
    id:`${modality==='CT'?'cth':'mrb'}.bst.${name}`,label:label+' — regional mask',family:'bst',
    laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},
  });
  const first=show('CT','brainstem','brainstem-midbrain',[entry('CT','pons','Pons')]);
  const middle=show('MRI','brainstem','brainstem-pons',[
    entry('MRI','midbrain','Midbrain'),entry('MRI','medulla_oblongata','Medulla oblongata')]);
  for(const html of [first,middle]){
    assert(html.includes('No other structure has been substituted'));
    assert(html.includes('Learn this concept · Draft'));
    assert.doesNotMatch(html,/Saved-mask teaching|Scroll through the saved mask|Find this structure · quick check|Show this step|Compare this step beside 3D/);
  }
  assert(first.includes('Step 1 / 3'));assert(middle.includes('Step 2 / 3'));
});
