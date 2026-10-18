import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import ts from 'typescript';
import {build} from './workspace-test-build.mjs';import {build as componentBuild} from './workspace-component-test-build.mjs';import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';import {exactSourceHistoryApi} from './exact-source-history-api.mjs';import {snapshot,hash} from './pin-pica-clinical.mjs';
assert(process.argv.slice(2).every(arg=>arg==='--record'));
const pins=JSON.parse(readFileSync('content/abdominal-radial-eus-pins.json'));assert.equal(pins.parentCommit,'c5a09df8939dfaeaf76119ba5507c552721c3a30');assert.equal(hash(pins),'51e343f74b3994e8866d20b7ca5b31522193c3f6933648bc859f627bfb2da69d');
const before=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const compiled=await build({stdin:{contents:`
export {abdominalRadialEusLesson} from './lib/abdominal-radial-eus';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:32e6}).trim(),head=git('rev-parse','HEAD');
const introductions=git('log','--diff-filter=A','--format=%H','HEAD','--','lib/abdominal-radial-eus.ts').split(/\s+/).filter(Boolean);assert(introductions.length<=1);
const introduction=introductions[0];if(introduction){assert.equal(git('merge-base',pins.parentCommit,introduction),pins.parentCommit);assert.equal(git('merge-base',introduction,head),introduction);}else assert.equal(head,pins.parentCommit);
const epoch=introduction?await exactSourceHistoryApi(introduction,'review-security'):now;
const raw=JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')),catalog=now.bodyDisplayCatalog(raw),selected=new Map(pins.entries.map(row=>[row.identity.id,row]));
assert.equal(selected.size,4);assert.equal(catalog.structures.length,1104);assert.equal(catalog.bundles.length,109);assert.equal(now.contentTabs.length,9);
assert.deepEqual(catalog,before.bodyDisplayCatalog(raw));assert.deepEqual(catalog,epoch.bodyDisplayCatalog(raw));
for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs']){assert.deepEqual(now[key],before[key]);assert.deepEqual(epoch[key],before[key]);}
assert.equal(hash(snapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash);
const restored=snapshot(epoch,catalog),changes=[];let changed=0,preserved=0,stale=0,storageCalls=0,forged=0;
for(const row of restored.body){const structure=catalog.structures.find(s=>s.id===row.id),binding=selected.get(row.id);
  for(const tab of now.contentTabs){const prior=before.bodyLesson(structure,tab),lesson=epoch.bodyLesson(structure,tab);
    if(binding&&tab==='ultrasound'){
      assert.deepEqual(structure,binding.identity);assert.deepEqual(prior,binding.previous);assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');
      assert.deepEqual(lesson,now.abdominalRadialEusLesson(structure,tab));assert.deepEqual(now.bodyLesson(structure,tab),lesson,'Later selected teaching needs its own explicit transition');
      const {readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(structure,tab),shown);assert.match(lesson.title,/radial endoscopic ultrasound/i);assert.match(lesson.note,/radiologist review pending/i);
      changes.push({id:structure.id,fmaId:structure.fmaId,previousHash:hash(prior),currentHash:hash(lesson)});row.sections[tab]=prior;changed++;
    }else{assert.deepEqual(lesson,prior,structure.id+'|'+tab);preserved++;}
  }
  const old=await before.bodyReviewMaterial(structure.id),packet=await epoch.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);
  if(!binding){assert.deepEqual(packet,old);continue;}
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(packet[key],old[key]);
  assert.deepEqual(binding.reviewFingerprint,{fingerprints:old.fingerprints,materialHash:old.materialHash});assert.equal(packet.fingerprints.source,old.fingerprints.source);assert.equal(packet.fingerprints.checklist,old.fingerprints.checklist);assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);assert.notEqual(packet.materialHash,old.materialHash);
  const live=await now.bodyReviewMaterial(structure.id);assert.deepEqual(await now.parseBodyReviewResponse(live,structure.id),live);assert.equal(await now.parseBodyReviewResponse(old,structure.id),null);
  for(const mutate of [p=>{p.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},p=>{p.topics.find(t=>t.tab==='ultrasound').citations=['https://foreign.example'];},p=>{p.source.structure.sources[0].sha256='foreign';}]){const bad=structuredClone(live);mutate(bad);assert.equal(await now.parseBodyReviewResponse(bad,structure.id),null);forged++;}
  const oldContext=await before.bodyReviewContext(structure.id),context=await now.bodyReviewContext(structure.id);assert.equal(context.sourceHash,oldContext.sourceHash);assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);assert.equal(context.revisions.imaging,null);
  const save={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
  for(const hashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
    const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_RADIAL_EUS'},body:JSON.stringify({...save,...hashes})}),{prepare(){storageCalls++;throw Error('Stale write reached storage');}});assert.equal(response.status,409);stale++;
  }
}
assert.equal(changed,4);assert.equal(preserved,9932);assert.equal(stale,12);assert.equal(forged,12);assert.equal(storageCalls,0);assert.equal(hash(restored),pins.previousAllLessonsAndRecipesHash);
const priorFile=relative=>execFileSync('git',['show',pins.parentCommit+':'+relative],{windowsHide:true,maxBuffer:64e6});
for(const relative of ['public/models/bodyparts3d/full-body/catalog.json','package-lock.json','LICENSES/dependency-license-audit.json','LICENSES/BODYPARTS3D_FULL_BODY.md','app/body-explorer.tsx','lib/imaging-sync.ts','lib/didanix-atlas-adapter.ts','lib/body-review-api.ts'])assert.equal(readFileSync(relative,'utf8').replaceAll('\r\n','\n'),priorFile(relative).toString().replaceAll('\r\n','\n'),relative);
for(const bundle of catalog.bundles){const relative='public'+bundle.url.split('?')[0],bytes=readFileSync(relative);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);assert.deepEqual(bytes,priorFile(relative));}
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false}),scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(readFileSync('app/body-explorer.tsx','utf8'));
for(const {identity} of pins.entries){const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});const html=render(runInNewContext(code,{React,...scope.exports,ScanLine:require('lucide-react').ScanLine,catalog,side:'both',exam:false,selected:identity,bodyContent:now.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children),openNested(){throw Error('Unexpected navigation');}}));const lesson=now.bodyLesson(identity,'ultrasound');assert(html.includes(render(React.createElement('p',null,lesson.body))));for(const text of lesson.bullets)assert(html.includes(render(React.createElement('li',null,text))));assert(html.includes('24949345'));assert.match(html,/radiologist review|pending/);}
const transition={schema:'vm-abdominal-radial-eus-transition-1',parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,entries:changes,changed,preserved,worksheets:4,staleRefused:stale,forgedPacketsRefused:forged,storageCalls,bundlesUnchanged:109,actualNoteRenders:4,clinicalApproval:false,patientSpaceRegistration:false,websiteIntegrated:false};
const target='content/abdominal-radial-eus-transition.json';if(process.argv.includes('--record'))writeFileSync(target,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});else assert.deepEqual(JSON.parse(readFileSync(target)),transition);
console.log(JSON.stringify({...transition,entries:changes.length,transitionHash:hash(transition)}));
