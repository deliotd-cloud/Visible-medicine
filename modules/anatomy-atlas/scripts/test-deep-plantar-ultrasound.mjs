import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';

assert(process.argv.slice(2).every(arg=>arg==='--record'));
const pins=JSON.parse(readFileSync('content/deep-plantar-ultrasound-pins.json'));
assert.equal(pins.parentCommit,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
assert.equal(hash(pins),'8d0491edb994897c63a32dfb2aeefc380890af3356531ec2623e7848dab5c1a3');
const before=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const compiled=await build({stdin:{contents:`
export {deepPlantarUltrasoundLesson} from './lib/deep-plantar-ultrasound';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,resolveDir:process.cwd(),loader:'ts'},
bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const display=now.bodyDisplayCatalog(raw),entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
assert.equal(display.structures.length,1104);assert.equal(now.contentTabs.length,9);
assert.deepEqual(display,before.bodyDisplayCatalog(raw));
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
for(const key of ['structures','dissectionProfiles','regionalTours'])assert.deepEqual(now[key],before[key]);
assert.deepEqual(display.bundles.filter(b=>pins.bundles.some(p=>p.id===b.id)),pins.bundles);
const restored=snapshot(now,display),transitionEntries=[];
let changed=0,preserved=0,worksheets=0,stale=0,storageCalls=0;
for(const row of restored.body){
 const structure=display.structures.find(s=>s.id===row.id),entry=entries.get(row.id);
 for(const tab of now.contentTabs){
  const prior=before.bodyLesson(structure,tab),current=now.bodyLesson(structure,tab);
  if(entry&&tab==='ultrasound'){
   assert.deepEqual(structure,entry.identity);assert.deepEqual(prior,entry.previous);
   assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');
   assert.deepEqual(current,now.deepPlantarUltrasoundLesson(structure,tab));
   const{readiness,...shown}=current;assert.deepEqual(now.bodyContent(structure,tab),shown);
   transitionEntries.push({id:structure.id,fmaId:structure.fmaId,tab,previousHash:hash(prior),currentHash:hash(current)});
   row.sections[tab]=prior;changed++;
  }else{assert.deepEqual(current,prior,structure.id+'|'+tab);preserved++;}
 }
 const prior=await before.bodyReviewMaterial(structure.id),current=await now.bodyReviewMaterial(structure.id);
 assert.equal(current.approval,false);
 for(const key of ['source','reasoning','guidedTours','checklist'])assert.deepEqual(current[key],prior[key]);
 assert.equal(current.fingerprints.source,prior.fingerprints.source);
 assert.equal(current.fingerprints.checklist,prior.fingerprints.checklist);
 if(!entry){assert.deepEqual(current,prior);continue;}
 assert.deepEqual(entry.reviewFingerprint,{fingerprints:prior.fingerprints,materialHash:prior.materialHash});
 assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
 assert.notEqual(current.materialHash,prior.materialHash);
 assert.deepEqual(current.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...now.bodyLesson(structure,'ultrasound')});
 assert.deepEqual(await now.parseBodyReviewResponse(current,structure.id),current);
 for(const mutate of [
  packet=>{packet.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},
  packet=>{packet.topics.find(t=>t.tab==='ultrasound').readiness='approved';},
  packet=>{packet.source.structure.sources[0].sha256='foreign';},
 ]){const forged=structuredClone(current);mutate(forged);assert.equal(await now.parseBodyReviewResponse(forged,structure.id),null);}
 const oldContext=await before.bodyReviewContext(structure.id),context=await now.bodyReviewContext(structure.id);
 assert.equal(context.sourceHash,oldContext.sourceHash);assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
 assert.equal(context.revisions.imaging,null);
 const packet={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
  materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
  draft:now.blankBodyReview(context,'teaching')};
 for(const hashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},
  {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DEEP_PLANTAR_US'},
   body:JSON.stringify({...packet,...hashes}),
  }),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
  assert.equal(response.status,409);stale++;
 }
 worksheets++;
}
assert.equal(changed,2);assert.equal(preserved,9934);assert.equal(worksheets,2);assert.equal(stale,6);assert.equal(storageCalls,0);
assert.equal(hash(restored),pins.previousAllLessonsAndRecipesHash);
for(const fma of ['FMA43937','FMA43938']){
 const structure=display.structures.find(s=>s.fmaId===fma);assert(structure);
 assert.equal(now.bodyLesson(structure,'ultrasound').readiness,'pending');
 assert.equal(now.deepPlantarUltrasoundLesson(structure,'ultrasound'),undefined);
}
const original=path=>execFileSync('git',['show',`${pins.parentCommit}:${path}`],{windowsHide:true,maxBuffer:32e6});
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','package-lock.json',
 'LICENSES/dependency-license-audit.json','LICENSES/BODYPARTS3D_FULL_BODY.md','app/body-explorer.tsx',
 'lib/imaging-sync.ts','lib/didanix-atlas-adapter.ts','lib/independent-study-links.ts','lib/body-review-api.ts'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),original(path).toString().replaceAll('\r\n','\n'),path);
for(const bundle of display.bundles){
 const path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
 assert.deepEqual(bytes,original(path),path);
}
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(readFileSync('app/body-explorer.tsx','utf8'));
for(const{identity}of pins.entries){
 const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
 const html=render(runInNewContext(code,{React,...scope.exports,ScanLine:require('lucide-react').ScanLine,
  catalog:display,side:'both',exam:false,selected:identity,bodyContent:now.bodyContent,
  WorkspaceModeButton:({children})=>React.createElement('button',null,children),openNested(){throw Error('Unexpected navigation');}}));
 const lesson=now.bodyLesson(identity,'ultrasound');
 assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const text of lesson.bullets)assert(html.includes(render(React.createElement('li',null,text))));
 assert(html.includes('radiologist review'));assert(html.includes('pending'));
 assert(html.includes('href="https://doi.org/10.1016/S1078-5884(98)80086-5"'));
}
const transition={schema:'vm-deep-plantar-ultrasound-transition-1',parentCommit:pins.parentCommit,
 pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,entries:transitionEntries,
 changed,preserved,worksheets,staleRefused:stale,clinicalApproval:false,patientSpaceRegistration:false,sourceAssetsUnchanged:true};
const path='content/deep-plantar-ultrasound-transition.json';
if(process.argv.includes('--record'))writeFileSync(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(readFileSync(path)),transition);
console.log(JSON.stringify({...transition,entries:transitionEntries.length,transitionHash:hash(transition),actualNoteRenders:2,bundlesUnchanged:display.bundles.length,websiteIntegrated:false}));
