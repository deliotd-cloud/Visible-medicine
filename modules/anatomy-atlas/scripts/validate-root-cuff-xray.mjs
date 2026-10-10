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
import pins from '../content/root-cuff-xray-pins.json' with {type:'json'};

const baseline='707da881415d2d9dd763bc0de7e3cc04ceafdd56';
const specifications=[
  ['infraspinatus','FMA32547','right','FJ1500'],
  ['infraspinatus','FMA32548','left','FJ1500M'],
  ['subscapularis','FMA13414','right','FJ1504'],
  ['subscapularis','FMA13415','left','FJ1504M'],
  ['supraspinatus','FMA32544','right','FJ1506'],
  ['supraspinatus','FMA32545','left','FJ1506M'],
  ['teresMinor','FMA32553','right','FJ1508'],
  ['teresMinor','FMA32554','left','FJ1508M'],
];
const references=[
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  'https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears',
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitBytes=path=>execFileSync('git',['show',`${baseline}:${path}`],{
  maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,
});
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
for(const path of [catalogPath,'public/models/bodyparts3d/manifest.json',
  'app/anatomy-data.ts','app/dissection-data.ts','content/review-revisions.json']){
  assert.deepEqual(await readFile(path),gitBytes(path),'Existing source or shoulder data changed: '+path);
}
const old=await exactSourceHistoryApi(baseline,'display-review');
const baselineCatalog=JSON.parse(gitBytes(catalogPath));
const oldDisplay=old.bodyDisplayCatalog(baselineCatalog);
const expectedEntries=specifications.map(([family,fma,laterality,file])=>{
  const matches=oldDisplay.structures.filter(structure=>structure.fmaId===fma);
  assert.equal(matches.length,1,'Baseline identity: '+fma);
  const identity=matches[0];
  assert.equal(identity.region,'shoulder-arm');
  assert.equal(identity.category,'muscle');
  assert.equal(identity.laterality,laterality);
  assert.deepEqual(identity.sources.map(source=>source.file),[file]);
  const previous=old.bodyLesson(identity,'xray');
  assert.equal(previous.readiness,'pending');
  return {family,identity,previous};
});
const expectedBundles=oldDisplay.bundles.filter(bundle=>
  expectedEntries.some(entry=>entry.identity.bundle===bundle.id));
assert.deepEqual(pins,{
  baseline,sourceVersion:oldDisplay.sourceVersion,license:oldDisplay.license,
  coordinateSystem:oldDisplay.coordinateSystem,bundles:expectedBundles,entries:expectedEntries,
},'Pin file must reproduce exact baseline identities, prior lessons and bundle metadata');
assert.equal(new Set(expectedEntries.map(entry=>entry.identity.id)).size,8);
for(const bundle of expectedBundles){
  const path='public'+new URL(bundle.url,'https://local.invalid').pathname;
  const bytes=await readFile(path);
  assert.deepEqual(bytes,gitBytes(path),'Source model changed: '+path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(hash(bytes),bundle.sha256);
}

const context=await contentContext(),api=context.api;
const display=api.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display,oldDisplay);
assert.deepEqual(api.structures,old.structures);
assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);
assert.deepEqual(api.contentTabs,old.contentTabs);
assert.deepEqual(await readFile('lib/regional-tours.ts'),gitBytes('lib/regional-tours.ts'));
const currentTours=await build({stdin:{
  contents:"export {regionalTours} from './lib/regional-tours.ts';",
  resolveDir:process.cwd(),loader:'ts',
},bundle:true,write:false,platform:'node',format:'esm'});
const tours=(await import('data:text/javascript;base64,'+
  Buffer.from(currentTours.outputFiles[0].text).toString('base64'))).regionalTours;
assert.deepEqual(tours,old.regionalTours);
assert.equal(tours.length,42);
assert.equal(tours.reduce((count,tour)=>count+tour.steps.length,0),250);
assert.equal(display.structures.length*api.contentTabs.length,9936);

const compiled=await build({stdin:{
  contents:"export {rootCuffXrayLesson} from './lib/root-cuff-xray.ts';export {rootCuffXrayFacts,rootCuffXrayReferences} from './content/root-cuff-xray.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir:process.cwd(),loader:'ts',
},bundle:true,write:false,platform:'node',format:'esm'});
const helper=await import('data:text/javascript;base64,'+
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(typeof helper.rootCuffXrayLesson,'function');
assert.deepEqual(helper.rootCuffXrayReferences,references);
assert.deepEqual(Object.keys(helper.rootCuffXrayFacts),
  ['infraspinatus','subscapularis','supraspinatus','teresMinor']);
for(const [family,facts] of Object.entries(helper.rootCuffXrayFacts)){
  assert(typeof facts.body==='string'&&facts.body.length>0,family+' body');
  assert(typeof facts.distinction==='string'&&facts.distinction.length>0,family+' distinction');
}
assert.equal(typeof helper.parseBodyReviewResponse,'function');

const currentRecords=api.bodyContentRecords(display),oldRecords=old.bodyContentRecords(oldDisplay);
assert.equal(currentRecords.length,1104);assert.equal(oldRecords.length,1104);
const currentById=new Map(currentRecords.map(record=>[record.id,record]));
const oldById=new Map(oldRecords.map(record=>[record.id,record]));
assert.equal(currentById.size,1104);assert.equal(oldById.size,1104);
const registry=new Map([...context.shoulder,...currentRecords].map(record=>
  [record.representationScope+'|'+record.id,record]));
const validate=await contentValidator(registry);
const targets=new Map(expectedEntries.map(entry=>[entry.identity.id,entry]));
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
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
const callbackJs=ts.transpile('const renderNote='+callback,{
  target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,
});
let changed=0,unchanged=0,validated=0,rendered=0;
for(const structure of display.structures){
  const current=currentById.get(structure.id),previous=oldById.get(structure.id);
  assert(current&&previous);assert(validate(current));validated++;
  const expected=structuredClone(previous),target=targets.get(structure.id);
  if(target)assert.deepEqual(structure,target.identity);
  for(const tab of api.contentTabs){
    const before=old.bodyLesson(structure,tab),now=api.bodyLesson(structure,tab);
    const taught=helper.rootCuffXrayLesson(structure,tab);
    if(!target||tab!=='xray'){
      assert.deepEqual(now,before,structure.id+'|'+tab);
      assert.equal(taught,undefined);unchanged++;continue;
    }
    assert.deepEqual(before,target.previous);
    assert.equal(before.readiness,'pending');assert.equal(now.readiness,'draft');
    assert.deepEqual(now,taught);assert.deepEqual(current.content[tab],now);
    const {readiness,...learner}=now;
    assert.deepEqual(api.bodyContent(structure,tab),learner);
    assert(typeof now.body==='string'&&now.body.length>0);
    assert(now.bullets?.length>=2);
    for(const reference of references)assert(now.citations?.includes(reference));
    assert.match(now.note,/review pending/i);
    assert.match(now.note,/Revision-bound radiologist review pending/);
    assert.match(now.note,/No acquired study, patient-to-atlas registration or diagnosis is supplied/);
    assert.match(now.note,/Atlas, imaging-case and lecture access remain independent/);
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
    assert(html.includes('No imaging study loaded'));
    assert(html.includes('review pending'));
    for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
    rendered++;
    assert.equal(current.validation.clinicalApproval,'not-included');
    assert.equal(current.validation.materialRevisions.imaging,null);
    expected.content[tab]=now;changed++;
  }
  assert.deepEqual(current,expected,structure.id+' exported packet changed outside target topic');
}
assert.equal(changed,8);assert.equal(unchanged,9928);
assert.equal(validated,1104);assert.equal(rendered,8);

// A valid-looking identity must fail if any nested source detail is changed.
const nodes=(value,path=[])=>{
  if(value===null||typeof value!=='object')return [{path,value}];
  return [{path,value},...Object.entries(value).flatMap(([key,part])=>nodes(part,[...path,key]))];
};
const at=(root,path)=>path.reduce((part,key)=>part[key],root);
let identityRejections=0;
for(const entry of expectedEntries){
  const identity=entry.identity;
  for(const {path,value} of nodes(identity).slice(1)){
    if(path.length&&!(value&&typeof value==='object')){
      const bad=structuredClone(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1);
      parent[key]=typeof value==='number'?value+.01:
        typeof value==='boolean'?!value:String(value)+'-foreign';
      assert.equal(helper.rootCuffXrayLesson(bad,'xray'),undefined,'mutated '+path.join('.'));
      identityRejections++;
    }
    const absent=structuredClone(identity),parent=at(absent,path.slice(0,-1));
    if(Array.isArray(parent))parent.splice(Number(path.at(-1)),1);
    else delete parent[path.at(-1)];
    assert.equal(helper.rootCuffXrayLesson(absent,'xray'),undefined,'missing '+path.join('.'));
    identityRejections++;
    if(Array.isArray(value)){
      const extra=structuredClone(identity),array=at(extra,path);
      array.push(array.length?structuredClone(array[0]):'foreign');
      assert.equal(helper.rootCuffXrayLesson(extra,'xray'),undefined,'array size '+path.join('.'));
      identityRejections++;
      if(value.length>1){
        const reordered=structuredClone(identity);at(reordered,path).reverse();
        assert.equal(helper.rootCuffXrayLesson(reordered,'xray'),undefined,'array order '+path.join('.'));
        identityRejections++;
      }
    }
  }
  const lesson=helper.rootCuffXrayLesson(identity,'xray'),pristine=structuredClone(lesson);
  lesson.bullets.push('foreign');lesson.citations.length=0;
  assert.deepEqual(helper.rootCuffXrayLesson(identity,'xray'),pristine);
}

let changedPackets=0,unchangedPackets=0,staleRefusals=0,tamperedRefusals=0;
for(const structure of display.structures){
  const prior=await old.bodyReviewMaterial(structure.id);
  const current=await api.bodyReviewMaterial(structure.id);
  assert(prior&&current);assert.equal(current.approval,false);
  assert.equal(current.status,'worksheet-not-submitted');
  const entry=targets.get(structure.id);
  if(!entry){
    assert.deepEqual(current,prior,structure.id+' unaffected review packet');
    unchangedPackets++;continue;
  }
  const expected=structuredClone(prior);
  expected.topics=current.topics;
  expected.fingerprints.teaching=current.fingerprints.teaching;
  expected.materialHash=current.materialHash;
  assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
  assert.notEqual(current.materialHash,prior.materialHash);
  assert.deepEqual(current,expected);
  assert.deepEqual(current.topics.find(topic=>topic.tab==='xray'),
    {tab:'xray',...api.bodyLesson(structure,'xray')});
  assert.deepEqual(await helper.parseBodyReviewResponse(current,structure.id),current);
  assert.equal(await helper.parseBodyReviewResponse(prior,structure.id),null);staleRefusals++;
  const tampered=structuredClone(current);
  tampered.topics.find(topic=>topic.tab==='xray').body+=' foreign';
  assert.equal(await helper.parseBodyReviewResponse(tampered,structure.id),null);
  tamperedRefusals++;changedPackets++;
}
assert.equal(changedPackets,8);assert.equal(unchangedPackets,1096);
assert.equal(staleRefusals,8);assert.equal(tamperedRefusals,8);
console.log(JSON.stringify({baseline,changedTopics:changed,unchangedTopics:unchanged,
  changedReviewPackets:changedPackets,unchangedReviewPackets:unchangedPackets,
  staleRefusals,tamperedRefusals,identityRejections,validatedRecords:validated,
  actualNoteRenders:rendered,regionalTours:tours.length,tourSteps:250,
  sourceGeometryChanged:false,clinicalApproval:false,imagesImported:false,
  imagingRegistered:false}));
