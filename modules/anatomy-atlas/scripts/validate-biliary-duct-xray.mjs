import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};

const baseline='6b82cba2129c17500526b927869f825e97aa2215';
const references=[
  'https://www.radiologyinfo.org/en/info/biliary',
  'https://www.sages.org/publications/guidelines/clinical-spotlight-review-laparoscopic-common-bile-duct-exploration/',
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBytes=path=>execFileSync('git',['show',`${baseline}:${path}`],{
  maxBuffer:16e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,
});
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinPath='content/thoracoabdominal-organ-imaging-pins.json';
for(const path of [catalogPath,pinPath,'public/models/bodyparts3d/manifest.json',
  'app/anatomy-data.ts','app/dissection-data.ts','content/review-revisions.json']){
  assert.deepEqual(await readFile(path),gitBytes(path),'Existing source or shoulder data changed: '+path);
}
const selected=pins.entries.filter(e=>['FMA14539','FMA14668'].includes(e.identity.fmaId));
assert.deepEqual(selected.map(e=>e.identity.fmaId),['FMA14539','FMA14668']);
assert.equal(new Set(selected.map(e=>e.identity.id)).size,2);
for(const bundle of pins.bundles){
  const path='public'+new URL(bundle.url,'https://local.invalid').pathname;
  const bytes=await readFile(path);
  assert.deepEqual(bytes,gitBytes(path),'Source model changed: '+path);
  assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);
}

const context=await contentContext(),api=context.api;
const old=await exactSourceHistoryApi(baseline,'display-review');
const display=api.bodyDisplayCatalog(context.catalog),oldDisplay=old.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display,oldDisplay);
assert.deepEqual(api.structures,old.structures);
assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);
assert.deepEqual(api.contentTabs,old.contentTabs);
assert.deepEqual((await readFile('lib/regional-tours.ts')),gitBytes('lib/regional-tours.ts'));
const currentTours=await build({stdin:{contents:"export {regionalTours} from './lib/regional-tours.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const tours=(await import('data:text/javascript;base64,'+Buffer.from(currentTours.outputFiles[0].text).toString('base64'))).regionalTours;
assert.deepEqual(tours,old.regionalTours);
assert.equal(tours.length,42);
assert.equal(tours.reduce((count,tour)=>count+tour.steps.length,0),250);
assert.equal(display.structures.length*api.contentTabs.length,9936);

const compiled=await build({stdin:{
  contents:"export {biliaryDuctXrayLesson} from './lib/biliary-duct-xray.ts';export {biliaryDuctXrayFacts,biliaryDuctXrayReferences} from './content/biliary-duct-xray.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir:process.cwd(),loader:'ts',
},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(typeof helper.biliaryDuctXrayLesson,'function');
assert.deepEqual(helper.biliaryDuctXrayReferences,references);
assert.deepEqual(Object.keys(helper.biliaryDuctXrayFacts),['FMA14539','FMA14668']);
assert.equal(typeof helper.parseBodyReviewResponse,'function');

const currentRecords=api.bodyContentRecords(display),oldRecords=old.bodyContentRecords(oldDisplay);
assert.equal(currentRecords.length,1104);assert.equal(oldRecords.length,1104);
const currentById=new Map(currentRecords.map(r=>[r.id,r]));
const oldById=new Map(oldRecords.map(r=>[r.id,r]));
assert.equal(currentById.size,1104);assert.equal(oldById.size,1104);
const registry=new Map([...context.shoulder,...currentRecords].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
const targets=new Map(selected.map(e=>[e.identity.id,e]));
// Render the current viewer callback with the real bodyContent response.
const require=createRequire(import.meta.url),React=require('react');
const render=require('react-dom/server').renderToStaticMarkup;
const presentation=await componentBuild({stdin:{
  contents:"export {teachingHeading} from './lib/teaching-heading.ts';export {SourceDisplayNotes} from './app/source-display-notes.tsx';",
  resolveDir:process.cwd(),loader:'tsx',
},bundle:true,write:false,platform:'node',format:'cjs'});
const presentationScope={exports:{}};
runInNewContext(presentation.outputFiles[0].text,{
  module:presentationScope,exports:presentationScope.exports,require,
});
const {teachingHeading,SourceDisplayNotes}=presentationScope.exports;
assert.equal(typeof teachingHeading,'function');
assert.equal(typeof SourceDisplayNotes,'function');
const noteSource=await readFile('app/body-explorer.tsx','utf8');
const callback=bodyNoteRenderCallback(noteSource);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,validated=0,rendered=0;
for(const structure of display.structures){
  const current=currentById.get(structure.id),previous=oldById.get(structure.id);
  assert(current&&previous);assert(validate(current));validated++;
  const expected=structuredClone(previous),target=targets.get(structure.id);
  if(target)assert.deepEqual(structure,target.identity);
  for(const tab of api.contentTabs){
    const before=old.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
    const taught=helper.biliaryDuctXrayLesson(structure,tab);
    if(!target||tab!=='xray'){
      assert.deepEqual(now,before,structure.id+'|'+tab);
      assert.equal(taught,undefined);unchanged++;continue;
    }
    assert.equal(before.readiness,'pending');assert.equal(now.readiness,'draft');
    assert.deepEqual(now,taught);assert.deepEqual(current.content[tab],now);
    const {readiness,...learner}=now;assert.deepEqual(api.bodyContent(structure,tab),learner);
    assert(typeof now.body==='string'&&now.body.length>0);
    assert(now.bullets?.length>0);
    for(const reference of references)assert(now.citations?.includes(reference));
    assert.match(now.note,/review pending/i);
    assert.match(now.note,/no acquired (?:imaging )?study/i);
    assert.match(now.note,/(?:unregistered|no registration)/i);
    const jsx=runInNewContext(callbackJs+';renderNote(topic)',{
      React,topic:tab,bodyContent:api.bodyContent,selected:structure,
      teachingHeading,SourceDisplayNotes,
      WorkspaceModeButton:({children})=>React.createElement('button',null,children),
      ComponentImagingNotes:()=>null,ScanLine:()=>null,
      catalog:display,side:'both',exam:false,
      openNested(){throw Error('No automatic specimen navigation');},
    });
    const html=render(jsx);
    assert(html.includes(render(React.createElement('p',null,now.body))));
    for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
    assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
    for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
    rendered++;
    assert.equal(current.validation.clinicalApproval,'not-included');
    assert.equal(current.validation.materialRevisions.imaging,null);
    expected.content[tab]=now;changed++;
  }
  assert.deepEqual(current,expected,structure.id+' exported packet changed outside target topic');
}
assert.equal(changed,2);assert.equal(unchanged,9934);assert.equal(validated,1104);assert.equal(rendered,2);

// Exercise every identity value and every nested field or array shape. The
// matcher must reject a plausible identity with one altered source detail.
const nodes=(value,path=[])=>{
  if(value===null||typeof value!=='object')return [{path,value}];
  return [{path,value},...Object.entries(value).flatMap(([key,part])=>nodes(part,[...path,key]))];
};
const at=(root,path)=>path.reduce((part,key)=>part[key],root);
let identityRejections=0;
for(const entry of selected){
  const identity=entry.identity;
  for(const {path,value} of nodes(identity).slice(1)){
    if(path.length&&!(value&&typeof value==='object')){
      const bad=structuredClone(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1);
      parent[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
      assert.equal(helper.biliaryDuctXrayLesson(bad,'xray'),undefined,'mutated '+path.join('.'));
      identityRejections++;
    }
    const absent=structuredClone(identity),parent=at(absent,path.slice(0,-1));
    if(Array.isArray(parent))parent.splice(Number(path.at(-1)),1);
    else delete parent[path.at(-1)];
    assert.equal(helper.biliaryDuctXrayLesson(absent,'xray'),undefined,'missing '+path.join('.'));
    identityRejections++;
    if(Array.isArray(value)){
      const extra=structuredClone(identity),array=at(extra,path);
      array.push(array.length?structuredClone(array[0]):'foreign');
      assert.equal(helper.biliaryDuctXrayLesson(extra,'xray'),undefined,'array size '+path.join('.'));
      identityRejections++;
      if(value.length>1){
        const reordered=structuredClone(identity);at(reordered,path).reverse();
        assert.equal(helper.biliaryDuctXrayLesson(reordered,'xray'),undefined,'array order '+path.join('.'));
        identityRejections++;
      }
    }
  }
  const lesson=helper.biliaryDuctXrayLesson(identity,'xray'),pristine=structuredClone(lesson);
  lesson.bullets.push('foreign');lesson.citations.length=0;
  assert.deepEqual(helper.biliaryDuctXrayLesson(identity,'xray'),pristine);
}

let changedPackets=0,unchangedPackets=0,staleRefusals=0,tamperedRefusals=0;
for(const structure of display.structures){
  const prior=await old.bodyReviewMaterial(structure.id);
  const current=await api.bodyReviewMaterial(structure.id);
  assert(prior&&current);assert.equal(current.approval,false);
  assert.equal(current.status,'worksheet-not-submitted');
  const entry=targets.get(structure.id);
  if(!entry){assert.deepEqual(current,prior,structure.id+' unaffected review packet');unchangedPackets++;continue;}
  const expected=structuredClone(prior);
  expected.topics=current.topics;
  expected.fingerprints.teaching=current.fingerprints.teaching;
  expected.materialHash=current.materialHash;
  assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
  assert.notEqual(current.materialHash,prior.materialHash);
  assert.deepEqual(current,expected);
  assert.deepEqual(current.topics.find(t=>t.tab==='xray'),{tab:'xray',...api.bodyLesson(structure,'xray')});
  assert.deepEqual(await helper.parseBodyReviewResponse(current,structure.id),current);
  assert.equal(await helper.parseBodyReviewResponse(prior,structure.id),null);staleRefusals++;
  const tampered=structuredClone(current);
  tampered.topics.find(t=>t.tab==='xray').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(tampered,structure.id),null);tamperedRefusals++;
  changedPackets++;
}
assert.equal(changedPackets,2);assert.equal(unchangedPackets,1102);
assert.equal(staleRefusals,2);assert.equal(tamperedRefusals,2);
console.log(JSON.stringify({baseline,changedTopics:changed,unchangedTopics:unchanged,
  changedReviewPackets:changedPackets,unchangedReviewPackets:unchangedPackets,
  staleRefusals,tamperedRefusals,identityRejections,validatedRecords:validated,actualNoteRenders:rendered,
  regionalTours:tours.length,tourSteps:250,sourceGeometryChanged:false,
  clinicalApproval:false,imagesImported:false,imagingRegistered:false}));
