import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';

assert.equal(process.argv.length,2,'No fixture/acceptance override arguments');
const baseline='9e1407629bd6f85061537c9f013fd72e4543e0da';
const expected=new Set(['FMA85096','FMA85097','FMA85098','FMA85099','FMA85100','FMA85101']);
const read=p=>fs.readFileSync(p);
const sha=b=>createHash('sha256').update(b).digest('hex');
const original=p=>execFileSync('git',['show',baseline+':'+p],{windowsHide:true,maxBuffer:16e6});
const before=original('app/body-content.ts').toString();
const importLine="import { digitalVeinUltrasoundLesson } from '../lib/digital-vein-ultrasound';\n";
const resolver="  const digitalVeinUltrasound = digitalVeinUltrasoundLesson(s, tab);\n  if (digitalVeinUltrasound) return digitalVeinUltrasound;\n";
const moduleText=read('app/body-content.ts').toString();
const out=fs.mkdtempSync(path.resolve('.local/digital-vein-us-'));
const exportsText=`export {digitalVeinUltrasoundLesson} from './lib/digital-vein-ultrasound';
export {digitalVeinUltrasoundTeaching} from './content/digital-vein-ultrasound';
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
export * from './lib/body-review-decisions';`;
async function api(name,old){
 const result=await build({stdin:{contents:exportsText,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:old?[{name:'whole-original-resolver',setup(b){
  const inverse=new Map(['app/body-content.ts','content/body-review-display-pins.json','content/body-renderer-revision.json'].map(p=>[p,original(p).toString()]));
  b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
   const p=path.relative(process.cwd(),args.path).replaceAll('\\','/');
   if(inverse.has(p))return{contents:inverse.get(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:path.dirname(args.path)};
  });
 }}]:[]});
 const file=out+'/'+name+'.mjs';fs.writeFileSync(file,result.outputFiles[0].contents,{flag:'wx'});
 return import(pathToFileURL(file).href);
}
const old=await api('before',true),now=await api('after',false);
const raw=JSON.parse(read('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=now.bodyDisplayCatalog(raw),pins=JSON.parse(read('content/hand-venous-imaging-pins.json'));
const selected=pins.entries.filter(e=>expected.has(e.identity.fmaId));
const ids=new Set(selected.map(e=>e.identity.id));
const counts={changed:0,preserved:0,worksheets:0,mutations:0,forgeries:0,stale:0,storage:0,rendered:0};

test('the whole resolver inverse restores the exact baseline, with no existing dispatch changed',()=>{
 assert.equal(moduleText.split(importLine).length,2);assert.equal(moduleText.split(resolver).length,2);
 assert.equal(moduleText.replace(importLine,'').replace(resolver,''),before);
 assert.equal(sha(read('content/hand-venous-imaging-pins.json')),sha(original('content/hand-venous-imaging-pins.json')));
 assert.equal(selected.length,6);assert.deepEqual(new Set(selected.map(e=>e.identity.fmaId)),expected);
 for(const e of selected){assert.equal(e.group,'proper-digital-venous-detail');assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity);}
});

test('exactly six pending ultrasound placements become explicit case comparisons; all 9930 others survive',()=>{
 assert.equal(catalog.structures.length,1104);assert.equal(now.contentTabs.length,9);
 assert.deepEqual(now.bodyDisplayCatalog(raw),old.bodyDisplayCatalog(raw));
 for(const s of catalog.structures)for(const tab of now.contentTabs){
  const a=old.bodyLesson(s,tab),b=now.bodyLesson(s,tab);
  if(ids.has(s.id)&&tab==='ultrasound'){
   assert.equal(a.readiness,'pending');assert.equal(b.readiness,'draft');
   assert.match(b.title,/Ultrasound case comparison · draft$/);
   assert.deepEqual(b,now.digitalVeinUltrasoundLesson(s,tab));
   const {readiness,...shown}=b;assert.deepEqual(now.bodyContent(s,tab),shown);counts.changed++;
  }else{assert.deepEqual(b,a,s.id+':'+tab);assert.equal(now.digitalVeinUltrasoundLesson(s,tab),undefined);counts.preserved++;}
 }
 assert.equal(counts.changed,6);assert.equal(counts.preserved,9930);
 assert.deepEqual(now.structures,old.structures);assert.deepEqual(now.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(now.regionalTours,old.regionalTours);assert.deepEqual(now.contentTabs,old.contentTabs);
});

test('wording never turns abnormal case evidence into normal visibility, protocol or mesh validation',()=>{
 const t=now.digitalVeinUltrasoundTeaching;
 assert.deepEqual(t.references,['https://pubmed.ncbi.nlm.nih.gov/23396654/','https://www.siumb.it/files/journal/2008/6/Art4-06-08.pdf']);
 assert.match(t.body,/one patient/);assert.match(t.body,/abnormal case/);assert.match(t.body,/not a study of normal/);
 assert.match(t.body,/superficial to the flexor tendons/);assert.match(t.body,/compression/);
 assert.match(t.bullets.join(' '),/does not identify/);assert.match(t.bullets.join(' '),/does not establish ultrasound visibility/);
 assert.match(t.note,/revision-bound radiologist review pending/);assert.match(t.note,/access remain independent/);
 assert.match(t.note,/not evidence that this normal source vein/);
 assert(!/https?:\/\/[^ ]+\.(?:png|jpg|jpeg|webp|mp4)/i.test(JSON.stringify(t)));
});

const pathsWhere=(v,p,at=[])=>[...(p(v)?[at]:[]),...(v&&typeof v==='object'?Object.entries(v).flatMap(([k,c])=>pathsWhere(c,p,[...at,k])):[])];
const at=(v,p)=>p.reduce((x,k)=>x[k],v);
test('every source primitive/array/object mutation, aliases, opposite sides and extra fields fail closed',()=>{
 for(const {identity} of selected){
  for(const p of pathsWhere(identity,v=>v===null||typeof v!=='object')){
   const changed=structuredClone(identity),owner=at(changed,p.slice(0,-1)),key=p.at(-1),value=owner[key];
   owner[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;
   assert.equal(now.digitalVeinUltrasoundLesson(changed,'ultrasound'),undefined,p.join('.'));counts.mutations++;
  }
  for(const p of pathsWhere(identity,Array.isArray)){
   const changed=structuredClone(identity);at(changed,p).push('foreign');
   assert.equal(now.digitalVeinUltrasoundLesson(changed,'ultrasound'),undefined);counts.mutations++;
  }
  for(const p of pathsWhere(identity,v=>v&&typeof v==='object'&&!Array.isArray(v))){
   const changed=structuredClone(identity);at(changed,p).unexpected=true;
   assert.equal(now.digitalVeinUltrasoundLesson(changed,'ultrasound'),undefined);counts.mutations++;
  }
 }
 // Six exact pinned records, each with 47 primitive/array/object locations.
 assert.equal(counts.mutations,282);
});

test('lesson arrays are fresh; consumers cannot mutate the next learner or review payload',()=>{
 for(const {identity} of selected){
  const a=now.digitalVeinUltrasoundLesson(identity,'ultrasound'),clean=structuredClone(a);
  a.bullets.push('foreign');a.citations.push('https://foreign.example');
  assert.deepEqual(now.digitalVeinUltrasoundLesson(identity,'ultrasound'),clean);
 }
});

test('review material changes only six teaching hashes; source identity survives and new presentation revisions are not migrated',async()=>{
 for(const s of catalog.structures){
  const a=await old.bodyReviewMaterial(s.id),b=await now.bodyReviewMaterial(s.id);
  if(!ids.has(s.id)){assert.deepEqual(b,a,s.id);continue;}
  assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  for(const k of ['source','reasoning','guidedTours','checklist','atlasLink','limits','reviewerNotes'])assert.deepEqual(b[k],a[k]);
  assert.equal(b.fingerprints.source,a.fingerprints.source);assert.equal(b.fingerprints.checklist,a.fingerprints.checklist);
  assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);assert.notEqual(b.materialHash,a.materialHash);
  const ac=await old.bodyReviewContext(s.id),bc=await now.bodyReviewContext(s.id);
  assert.notEqual(bc.revisions.geometry,ac.revisions.geometry);assert.notEqual(bc.rendererHash,ac.rendererHash);
  assert.notEqual(bc.revisions.teaching,ac.revisions.teaching);
  assert.equal(bc.revisions.imaging,null);assert.deepEqual(bc.blockers,ac.blockers);
  assert.deepEqual(await now.parseBodyReviewResponse(b,s.id),b);assert.equal(await now.parseBodyReviewResponse(a,s.id),null);
  counts.worksheets++;
 }
 assert.equal(counts.worksheets,6);
});

test('forged or stale teaching is rejected before any storage call; no decision is migrated',async()=>{
 for(const {identity:s} of selected){
  const material=await now.bodyReviewMaterial(s.id),a=await old.bodyReviewContext(s.id),b=await now.bodyReviewContext(s.id);
  for(const change of [
   p=>{p.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},
   p=>{p.topics.find(t=>t.tab==='ultrasound').citations=['https://foreign.example'];},
   p=>{p.topics.find(t=>t.tab==='ultrasound').readiness='approved';},
   p=>{p.source.structure.sources=[];},
   p=>{p.topics=p.topics.filter(t=>t.tab!=='ultrasound');},
  ]){const forged=structuredClone(material);change(forged);assert.equal(await now.parseBodyReviewResponse(forged,s.id),null);counts.forgeries++;}
  const decision={catalogScope:b.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:b.materialHash,revisionHash:b.revisions.teaching,checklistVersion:b.checklistVersion,draft:now.blankBodyReview(b,'teaching')};
  for(const stale of [{materialHash:a.materialHash},{revisionHash:a.revisions.teaching},{materialHash:a.materialHash,revisionHash:a.revisions.teaching}]){
   const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DIGITAL_VEIN_CASE_TEST'},body:JSON.stringify({...decision,...stale})}),{prepare(){counts.storage++;throw Error('Stale teaching reached storage');}});
   assert.equal(response.status,409);counts.stale++;
  }
 }
 assert.equal(counts.forgeries,30);assert.equal(counts.stale,18);assert.equal(counts.storage,0);
});

test('actual learner note callback renders case limitations and reading links, without suggesting an acquired scan',async()=>{
 const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
 const result=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
 const scope={exports:{}};runInNewContext(result.outputFiles[0].text,{module:scope,exports:scope.exports,require});
 const callback=bodyNoteRenderCallback(read('app/body-explorer.tsx').toString());
 const js=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
 for(const {identity} of selected){
  const tree=runInNewContext(js+';renderNote("ultrasound")',{React,bodyContent:now.bodyContent,selected:identity,SourceDisplayNotes:scope.exports.SourceDisplayNotes,teachingHeading:scope.exports.teachingHeading,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('Unexpected navigation');}});
  const html=render(tree),lesson=now.bodyLesson(identity,'ultrasound');
  assert(html.includes(render(React.createElement('p',null,lesson.body))));
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of lesson.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('No imaging study loaded'));counts.rendered++;
 }
 assert.equal(counts.rendered,6);
});

test('actual producers change only six display pins/hand snapshots and the exact renderer dependency formula',()=>{
 const hand='content/regional-teaching/hand.json',pinsPath='content/body-review-display-pins.json',rendererPath='content/body-renderer-revision.json';
 const oldHand=JSON.parse(original(hand)),newHand=JSON.parse(read(hand)),wantedHand=structuredClone(oldHand);
 let lessons=0;for(const entry of wantedHand.entries){const id=JSON.parse(entry.identity).id;if(ids.has(id)){entry.lessons.ultrasound=now.bodyLesson(selected.find(e=>e.identity.id===id).identity,'ultrasound');lessons++;}}
 assert.equal(lessons,6);assert.deepEqual(newHand,wantedHand);
 const oldPins=JSON.parse(original(pinsPath)),newPins=JSON.parse(read(pinsPath)),wantedPins=structuredClone(oldPins);let changed=0;
 for(const p of wantedPins.pins)if(ids.has(p.structureId)){const n=newPins.pins.find(q=>q.structureId===p.structureId);assert.notEqual(n.sha256,p.sha256);p.sha256=n.sha256;changed++;}
 assert.equal(changed,6);assert.deepEqual(newPins,wantedPins);assert.equal(newPins.pins.length,1104);
 const prior=JSON.parse(original(rendererPath)),renderer=JSON.parse(read(rendererPath));
 const changedPaths=new Set(['app/body-content.ts',hand,pinsPath]);
 const newPaths=['content/digital-vein-ultrasound.ts','lib/digital-vein-ultrasound.ts'];
 const dependencies=[...prior.dependencies.map(r=>changedPaths.has(r.path)?{...r,sha256:sha(read(r.path).toString().replaceAll('\r\n','\n'))}:r),...newPaths.map(p=>({path:p,sha256:sha(read(p).toString().replaceAll('\r\n','\n'))}))].sort((a,b)=>a.path.localeCompare(b.path));
 assert.deepEqual(renderer,{...prior,dependencies,sha256:sha(JSON.stringify(dependencies))});
 assert.notEqual(renderer.sha256,prior.sha256);
});

test('all other tracked bytes stay baseline-identical, including licences and model bundles',()=>{
 const list=execFileSync('git',['ls-tree','-r','-z','--full-tree',baseline],{windowsHide:true,maxBuffer:16e6}).toString().split('\0').filter(Boolean);
 for(const row of list){
  const m=/^100(?:644|755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);assert(m,'Only regular tracked files');
  if(['app/body-content.ts','content/regional-teaching/hand.json','content/body-review-display-pins.json','content/body-renderer-revision.json'].includes(m[2]))continue;
  const bytes=read(m[2]);assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),m[1],m[2]);
 }
 for(const p of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])assert.equal(sha(read(p)),sha(original(p)));
 console.log(JSON.stringify({...counts,baseline,sourceLabelsUnchanged:true,geometryUnchanged:true,clinicalApproval:false,normalVeinVisibilityValidated:false,websiteIntegration:false}));
});
