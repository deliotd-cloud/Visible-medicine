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
const pins=JSON.parse(readFileSync('content/lacrimal-drainage-ultrasound-pins.json'));
assert.equal(pins.parentCommit,'70260f13b1878272c6b0797dd72395ed10bc4f29');
assert.equal(hash(pins),'d561de407f41bb9ee71be2f8e906c516b685afefae70f5f4162abc8c5d31f790');
assert.equal(pins.entries.length,4);assert.equal(pins.excluded.length,2);
assert.deepEqual(pins.entries.map(e=>e.group).sort(),['canaliculus','canaliculus','sac','sac']);
const before=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const compiled=await build({stdin:{contents:`
export {lacrimalDrainageUltrasoundLesson} from './lib/lacrimal-drainage-ultrasound';
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
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
const head=git('rev-parse','HEAD');
const additions=git('log','--diff-filter=A','--format=%H','HEAD','--','lib/lacrimal-drainage-ultrasound.ts').split(/\s+/).filter(Boolean);
assert(additions.length<=1,'The helper has more than one introduction in this ancestry');
const introduction=additions[0];
if(introduction){
 assert.equal(git('merge-base',pins.parentCommit,introduction),pins.parentCommit,'Introduction must descend from the pinned parent');
 assert.equal(git('merge-base',introduction,head),introduction,'Introduction must precede HEAD');
 assert.equal(git('diff-tree','--no-commit-id','--name-only','--diff-filter=A','-r',introduction,'--','lib/lacrimal-drainage-ultrasound.ts'),'lib/lacrimal-drainage-ultrasound.ts');
}else assert.equal(head,pins.parentCommit,'Working-tree epoch proof is allowed only at the pinned parent');
const epoch=introduction?await exactSourceHistoryApi(introduction,'review-security'):now;
const raw=JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const display=now.bodyDisplayCatalog(raw),entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
assert.equal(entries.size,4);assert.equal(display.structures.length,1104);assert.equal(now.contentTabs.length,9);
assert.deepEqual(display,before.bodyDisplayCatalog(raw));
assert.deepEqual(epoch.bodyDisplayCatalog(raw),display);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
for(const key of ['structures','dissectionProfiles','regionalTours'])assert.deepEqual(now[key],before[key]);
for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs'])assert.deepEqual(epoch[key],before[key]);
assert.deepEqual(display.bundles.filter(b=>pins.bundles.some(p=>p.id===b.id)),pins.bundles);
const restored=snapshot(epoch,display),transitionEntries=[];
let changed=0,preserved=0,worksheets=0,stale=0,storageCalls=0;
for(const row of restored.body){
 const structure=display.structures.find(s=>s.id===row.id),entry=entries.get(row.id);
 for(const tab of epoch.contentTabs){
  const prior=before.bodyLesson(structure,tab),current=epoch.bodyLesson(structure,tab);
  if(entry&&tab==='ultrasound'){
   assert.deepEqual(structure,entry.identity);assert.deepEqual(prior,entry.previous);
   assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');
   assert.deepEqual(current,now.lacrimalDrainageUltrasoundLesson(structure,tab));
   assert.deepEqual(now.bodyLesson(structure,tab),current,'A later selected lesson requires an explicit transition');
   const{readiness,...shown}=current;assert.deepEqual(now.bodyContent(structure,tab),shown);
   transitionEntries.push({id:structure.id,fmaId:structure.fmaId,tab,previousHash:hash(prior),currentHash:hash(current)});
   row.sections[tab]=prior;changed++;
  }else{assert.deepEqual(current,prior,structure.id+'|'+tab);preserved++;}
 }
 const prior=await before.bodyReviewMaterial(structure.id),current=await epoch.bodyReviewMaterial(structure.id);
 assert.equal(current.approval,false);
 for(const key of ['source','reasoning','guidedTours','checklist'])assert.deepEqual(current[key],prior[key]);
 assert.equal(current.fingerprints.source,prior.fingerprints.source);
 assert.equal(current.fingerprints.checklist,prior.fingerprints.checklist);
 if(!entry){assert.deepEqual(current,prior);continue;}
 assert.deepEqual(entry.reviewFingerprint,{fingerprints:prior.fingerprints,materialHash:prior.materialHash});
 assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
 assert.notEqual(current.materialHash,prior.materialHash);
 assert.deepEqual(current.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...epoch.bodyLesson(structure,'ultrasound')});
 const live=await now.bodyReviewMaterial(structure.id);
 assert.equal(live.approval,false);
 assert.deepEqual(live.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...now.bodyLesson(structure,'ultrasound')});
 assert.deepEqual(await now.parseBodyReviewResponse(live,structure.id),live);
 for(const mutate of [
  packet=>{packet.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},
  packet=>{packet.topics.find(t=>t.tab==='ultrasound').readiness='approved';},
  packet=>{packet.source.structure.sources[0].sha256='foreign';},
 ]){const forged=structuredClone(live);mutate(forged);assert.equal(await now.parseBodyReviewResponse(forged,structure.id),null);}
 const oldContext=await before.bodyReviewContext(structure.id),context=await now.bodyReviewContext(structure.id);
 assert.equal(context.sourceHash,oldContext.sourceHash);assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
 assert.equal(context.revisions.imaging,null);
 const packet={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
  materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
  draft:now.blankBodyReview(context,'teaching')};
 for(const hashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},
  {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_LACRIMAL_US'},
   body:JSON.stringify({...packet,...hashes}),
  }),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
  assert.equal(response.status,409);stale++;
 }
 worksheets++;
}
assert.equal(changed,4);assert.equal(preserved,9932);assert.equal(worksheets,4);assert.equal(stale,12);assert.equal(storageCalls,0);
assert.equal(hash(restored),pins.previousAllLessonsAndRecipesHash);
for(const {identity,previous} of pins.excluded){
 const structure=display.structures.find(s=>s.id===identity.id);assert.deepEqual(structure,identity);
 assert.deepEqual(now.bodyLesson(structure,'ultrasound'),previous);
 assert.equal(now.lacrimalDrainageUltrasoundLesson(structure,'ultrasound'),undefined);
}
for(const {identity} of pins.entries){
 for(const mutated of [{...identity,fmaId:'FMA00000'},
  {...identity,sources:[{...identity.sources[0],sha256:'foreign'}]},
  {...identity,name:identity.name+' changed'},
  {...identity,laterality:identity.laterality==='left'?'right':'left'},
  {...identity,nodeName:'FMA00000'},
  {...identity,center:identity.center.map((n,i)=>i===0?n+0.001:n)},
  {...identity,anchor:identity.anchor.map((n,i)=>i===0?n+0.001:n)}])
  assert.equal(now.lacrimalDrainageUltrasoundLesson(mutated,'ultrasound'),undefined);
 for(const tab of now.contentTabs.filter(t=>t!=='ultrasound'))
  assert.equal(now.lacrimalDrainageUltrasoundLesson(identity,tab),undefined);
}
const original=path=>execFileSync('git',['show',`${pins.parentCommit}:${path}`],{windowsHide:true,maxBuffer:32e6});
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','package-lock.json',
 'LICENSES/dependency-license-audit.json','LICENSES/BODYPARTS3D_FULL_BODY.md','app/body-explorer.tsx',
 'lib/imaging-sync.ts','lib/didanix-atlas-adapter.ts','lib/independent-study-links.ts','lib/body-review-api.ts'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),original(path).toString().replaceAll('\r\n','\n'),path);
for(const bundle of display.bundles){
 const path='public'+bundle.url.split('?')[0];assert.deepEqual(readFileSync(path),original(path),path);
}
assert.equal(display.bundles.length,109);
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
 assert.match(html,/https:\/\/(?:doi\.org|pubmed\.ncbi\.nlm\.nih\.gov|link\.springer\.com)/);
 assert.match(html,/registration/i);
}
const transition={schema:'vm-lacrimal-drainage-ultrasound-transition-1',parentCommit:pins.parentCommit,
 pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,entries:transitionEntries,
 changed,preserved,worksheets,staleRefused:stale,clinicalApproval:false,patientSpaceRegistration:false,sourceAssetsUnchanged:true};
const path='content/lacrimal-drainage-ultrasound-transition.json';
if(process.argv.includes('--record'))writeFileSync(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(readFileSync(path)),transition);
console.log(JSON.stringify({...transition,entries:transitionEntries.length,transitionHash:hash(transition),actualNoteRenders:4,bundlesUnchanged:display.bundles.length,websiteIntegrated:false}));
