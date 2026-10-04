import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const fixtureSha='d79374101546887907e9ef166263716ea73c946d35ea836e7d18a076f20a6ce7';
const source='8c4bcccaf9d0bb5ed3da8d974df7e4d6035430c5';
const sha=(value:any)=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sourceAt=(path:string)=>execFileSync('git',['show',source+':'+path],{
 cwd:'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',
 maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

async function load(){
 const built=await build({stdin:{contents:[
  "export {bodyReviewMaterial,bodyReviewSummaries} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';",
  "export {specimenReviewRows,specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {currentRevision,staleReview,decisionLabel,blankReview} from './atlas-review/lib/review-workspace';",
  "export {blankBodyReview,bodyReviewStale,bodyDecisionLabel} from './atlas-review/lib/body-review-decisions';",
  "export {bodyDraftsFromPage} from './atlas-review/lib/body-review-client';",
  "export {blankNestedReview,nestedReviewStale,nestedDecisionLabel} from './atlas-review/lib/nested-review';",
  "export {nestedDraftFromSaved} from './atlas-review/lib/nested-review-client';",
  "export {blankSpecimenReview,specimenReviewStale,specimenDecisionLabel} from './atlas-review/lib/specimen-review';",
  "export {specimenDraftFromSaved} from './atlas-review/lib/specimen-review-client';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {postNestedReview} from './atlas-review/lib/nested-review-api';",
  "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
  "export {POST as postShoulderReview} from './atlas-review/app/api/reviews/route';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
 let storageCalls=0;
 const baseRequire=createRequire(join(process.cwd(),'package.json'));
 const require=(id:string)=>id==='cloudflare:workers'?{env:{get DB(){storageCalls++;throw Error('Stale shoulder save reached storage');}}}:baseRequire(id);
 const module={exports:{} as any};
 runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,crypto,Request,Response,
  URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout});
 return {api:module.exports,storageCalls:()=>storageCalls};
}

function oldApproval(api:any,c:any,b:any,track:'geometry'|'teaching',kind:'body'|'nested'|'specimen'){
 const blank=kind==='body'?api.blankBodyReview(c,track):kind==='nested'?api.blankNestedReview(c,track):api.blankSpecimenReview(c,track);
 return {...blank,eventSchema:`vm-${kind==='body'?'body':kind}-review-event-1`,
  catalogScope:c.catalogScope,nestedKey:c.nestedKey,specimenKey:c.specimenKey,sourceFrame:c.sourceFrame,
  structureId:c.structureId,track,version:1,savedAt:'2026-10-03T00:00:00.000Z',
  reviewedAt:'2026-10-03T00:00:00.000Z',revisionHash:track==='geometry'?b.geometryRevision:b.teachingRevision,
  checklistVersion:c.checklistVersion,checklist:c.checklists[track],status:'approved',attested:true,
  reviewer:'SYNTHETIC TEST ONLY',qualification:'Synthetic',scope:'Synthetic prior review only',
  evidence:[{title:'Synthetic',url:'https://example.test/evidence',note:'No clinical evidence'}],
  checks:Object.fromEntries(c.checklists[track].map((item:any)=>[item.id,true]))};
}

function request(url:string,c:any,old:any,track:string,draft:any){
 return new Request('https://review.test'+url,{method:'POST',headers:{origin:'https://review.test',
  'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_LABEL_TEST'},
  body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,specimenKey:c.specimenKey,
   sourceFrame:c.sourceFrame,structureId:c.structureId,checklistVersion:c.checklistVersion,
   track,expectedVersion:0,materialHash:old.materialHash,revisionHash:old.geometryRevision,draft})});
}

test('selected-label renderer preserves every source and teaching packet while expiring geometry/display approvals',async()=>{
 const baseline=json('tests/atlas-selected-label-baseline.json');
 assert.equal(sha(baseline),fixtureSha,'pre-import baseline was edited');
 assert.deepEqual(baseline.provenance,{atlasSourceCommit:'b4be1f0f343e54ee0fc021bcebac7bb62e978deb',
  websiteCommit:'f232847c2d78013508bbd572258fbc35e133ea46',
  manifestSha:'e01bad9bfc1d241afd6b9a032076aa9c754d88ed1b50305d0c2049e3cefa7ec9',
  capture:'Public pre-import Review material only; no private histories, scans or account data'});
 assert.deepEqual([baseline.root.length,baseline.nested.length,baseline.specimens.length,baseline.shoulder.length],
  [1104,108,356,9]);
 const manifest=json('atlas-review/manifest.json'),receipt=json('atlas-review/integration-inputs.json');
 assert.equal(manifest.revision,source);assert.equal(receipt.sourceCommit,source);
 const renderer=json('atlas-review/content/body-renderer-revision.json');
 assert.notEqual(renderer.sha256,baseline.rendererSha);
 const rendererEntry=manifest.files.find((entry:any)=>entry.path==='content/body-renderer-revision.json');
 assert(rendererEntry);
 assert.equal(rendererEntry.sourceSha256,sha(sourceAt('content/body-renderer-revision.json')));
 assert.equal(rendererEntry.importedSha256,sha(readFileSync('atlas-review/content/body-renderer-revision.json')));
 assert.equal(renderer.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
 assert.equal(renderer.websiteIntegrationSha256,receipt.sha256);
 assert(!receipt.inputs.some((entry:any)=>entry.path==='atlas-review/content/body-renderer-revision.json'));
 const revisions=json('atlas-review/content/review-revisions.json');
 assert.notEqual(sha(revisions.display),baseline.displaySha);
 const display=new Map<string,string>(revisions.display);
 for(const helper of ['lib/scene-label-size.ts','lib/scene-label-focus.ts'])
  assert.equal(display.get(helper),sha(sourceAt(helper)),helper+': shoulder display source pin');
 const paths=['app/scene-label-layer.tsx','app/scene-label-layer.css','lib/scene-label-size.ts','lib/scene-label-focus.ts'];
 for(const path of paths){
  const file=manifest.files.find((entry:any)=>entry.path===path);assert(file,path);
  assert.equal(file.sourceSha256,sha(sourceAt(path)),path+': exact source bytes');
  assert.equal(sha(readFileSync('atlas-review/'+path)),file.importedSha256,path+': imported Review bytes');
  assert.equal(receipt.inputs.find((entry:any)=>entry.path==='atlas-review/'+path)?.sha256,file.importedSha256,path+': receipt');
  for(const folder of ['female-pelvis','head-neck','lower-limb','shoulder']){
   const inputs=json('public/atlas-runtime/'+folder+'/source-inputs.json');
   assert.equal(inputs.find((entry:any)=>entry.path===path)?.sha256,file.sourceSha256,folder+': '+path);
   assert.equal(json('public/atlas-runtime/'+folder+'/manifest.json').sourceCommit,source,folder);
  }
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,receipt.sha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const {api,storageCalls}=await load();
 const forbidden={prepare(){throw Error('Stale save reached storage');}};
 let rootCount=0,nestedCount=0,specimenCount=0,shoulderCount=0,staleSaves=0;
 const priorRoot=new Map(baseline.root.map((row:any)=>[row.id,row]));
 for(const row of api.bodyReviewSummaries){
  const p=await api.bodyReviewMaterial(row.id),c=await api.bodyReviewContext(row.id),b=priorRoot.get(row.id) as any;
  assert(p&&c&&b,row.id);rootCount++;
  assert.equal(sha(p.source),b.sourceSha,row.id+': source');
  assert.equal(sha({topics:p.topics,reasoning:p.reasoning,guidedTours:p.guidedTours}),b.teachingSha,row.id+': teaching');
  assert.equal(c.sourceHash,b.sourceHash);assert.equal(c.teachingHash,b.teachingHash);
  assert.equal(c.revisions.teaching,b.teachingRevision);assert.notEqual(c.revisions.geometry,b.geometryRevision);
  assert.equal(c.materialHash,b.materialHash);assert.equal(c.rendererHash,renderer.sha256);
  const old=oldApproval(api,c,b,'geometry','body');
  assert(api.bodyReviewStale(old,c));assert.equal(api.bodyDecisionLabel(old,c),'Re-review required');
  if(rootCount===1){
   assert.equal(api.bodyDecisionLabel(undefined,c),'Not started');
   assert.equal(api.blankBodyReview(c,'geometry').status,'draft');
   assert.equal(api.bodyDecisionLabel(oldApproval(api,c,b,'teaching','body'),c),'Approval recorded');
   const drafts=api.bodyDraftsFromPage({context:c,reviews:[old],history:[],track:'geometry',nextBefore:null});
   assert.equal(drafts.geometry.status,'draft');assert.equal(drafts.geometry.attested,false);
   assert(Object.values(drafts.geometry.checks).every(value=>value===false));
   const response=await api.postBodyDecision(request('/api/atlas-review/body-decision',c,b,'geometry',api.blankBodyReview(c,'geometry')),forbidden);
   assert.equal(response.status,409);staleSaves++;
  }
 }
 assert.equal(rootCount,priorRoot.size);
 const priorNested=new Map(baseline.nested.map((row:any)=>[row.key+'|'+row.id,row]));
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const p=await api.nestedReviewMaterial(group.key,row.id),b=priorNested.get(group.key+'|'+row.id) as any;
  assert(p&&b,row.id);nestedCount++;
  const c=p.context;
  assert.equal(sha(p.source),b.sourceSha,row.id+': source');assert.equal(sha(p.teaching),b.teachingSha,row.id+': teaching');
  assert.equal(c.sourceHash,b.sourceHash);assert.equal(c.teachingHash,b.teachingHash);
  assert.equal(c.revisions.teaching,b.teachingRevision);assert.notEqual(c.revisions.geometry,b.geometryRevision);
  assert.notEqual(c.materialHash,b.materialHash);assert.equal(c.rendererHash,renderer.sha256);
  const old=oldApproval(api,c,b,'geometry','nested');
  assert(api.nestedReviewStale(old,c));assert.equal(api.nestedDecisionLabel(old,c),'Re-review required');
  if(nestedCount===1){
   assert.equal(api.nestedDecisionLabel(undefined,c),'Not started');
   assert.equal(api.blankNestedReview(c,'geometry').status,'draft');
   assert.equal(api.nestedDecisionLabel(oldApproval(api,c,b,'teaching','nested'),c),'Approval recorded');
   const draft=api.nestedDraftFromSaved(old,c,'geometry');
   assert.equal(draft.status,'draft');assert.equal(draft.attested,false);
   assert(Object.values(draft.checks).every(value=>value===false));
   const response=await api.postNestedReview(request('/api/atlas-review/nested-review',c,b,'geometry',api.blankNestedReview(c,'geometry')),forbidden);
   assert.equal(response.status,409);staleSaves++;
  }
 }
 assert.equal(nestedCount,priorNested.size);
 const priorSpecimens=new Map(baseline.specimens.map((row:any)=>[row.key+'|'+row.id,row]));
 for(const group of api.specimenReviewRows)for(const row of group.surfaces){
  const p=await api.specimenReviewMaterial(group.key,row.id),b=priorSpecimens.get(group.key+'|'+row.id) as any;
  assert(p&&b,row.id);specimenCount++;
  const c=p.context;
  assert.equal(sha(p.source),b.sourceSha,row.id+': source');assert.equal(sha(p.teaching),b.teachingSha,row.id+': teaching');
  assert.equal(c.sourceHash,b.sourceHash);assert.equal(c.teachingHash,b.teachingHash);
  assert.equal(c.revisions.teaching,b.teachingRevision);assert.notEqual(c.revisions.geometry,b.geometryRevision);
  assert.notEqual(c.materialHash,b.materialHash);assert.equal(c.rendererHash,renderer.sha256);
  const old=oldApproval(api,c,b,'geometry','specimen');
  assert(api.specimenReviewStale(old,c));assert.equal(api.specimenDecisionLabel(old,c),'Re-review required');
  if(specimenCount===1){
   assert.equal(api.specimenDecisionLabel(undefined,c),'Not started');
   assert.equal(api.blankSpecimenReview(c,'geometry').status,'draft');
   assert.equal(api.specimenDecisionLabel(oldApproval(api,c,b,'teaching','specimen'),c),'Approval recorded');
   const draft=api.specimenDraftFromSaved(old,c,'geometry');
   assert.equal(draft.status,'draft');assert.equal(draft.attested,false);
   assert(Object.values(draft.checks).every(value=>value===false));
   const response=await api.postSpecimenReview(request('/api/atlas-review/specimen-review',c,b,'geometry',api.blankSpecimenReview(c,'geometry')),forbidden);
   assert.equal(response.status,409);staleSaves++;
  }
 }
 assert.equal(specimenCount,priorSpecimens.size);
 const priorShoulder=new Map(baseline.shoulder.map((row:any)=>[row.id,row]));
 for(const s of api.structures){
  const b=priorShoulder.get(s.id) as any;assert(b,s.id);shoulderCount++;
  const {sections,...identity}=s;
  assert.equal(sha(identity),b.sourceSha,s.id+': source');assert.equal(sha(sections),b.teachingSha,s.id+': teaching');
  assert.notEqual(revisions.sourceRevisions[s.id].geometry,b.sourceRevisions.geometry,s.id+': source display revision');
  assert.equal(revisions.sourceRevisions[s.id].teaching,b.sourceRevisions.teaching,s.id+': source teaching revision');
  assert.equal(revisions.sourceRevisions[s.id].imaging,b.sourceRevisions.imaging,s.id+': imaging boundary');
  // The existing shoulder binder includes the website integration hash in both
  // review tracks. Source teaching stays exact even though this review hash rolls.
  assert.notEqual(api.currentRevision(s.id,'teaching'),b.teachingRevision);
  assert.notEqual(api.currentRevision(s.id,'geometry'),b.geometryRevision);
  const old={...api.blankReview(s.id,'geometry'),structureId:s.id,track:'geometry',version:1,
   savedAt:'2026-10-03T00:00:00.000Z',reviewedAt:'2026-10-03T00:00:00.000Z',
   revisionHash:b.geometryRevision,checklistVersion:'shoulder-review-2-guided',status:'approved',attested:true};
  assert(api.staleReview(old));assert.equal(api.decisionLabel(old),'Re-review required');
  if(shoulderCount===1){
   assert.equal(api.decisionLabel(undefined),'Not started');
   assert.equal(api.blankReview(s.id,'geometry').status,'draft');
   assert.equal(api.decisionLabel({...old,track:'teaching',revisionHash:b.teachingRevision}),'Re-review required');
   const response=await api.postShoulderReview(request('/api/reviews',
    {structureId:s.id,checklistVersion:old.checklistVersion},b,'geometry',api.blankReview(s.id,'geometry')));
   assert.equal(response.status,409);staleSaves++;
  }
 }
 assert.deepEqual({rootCount,nestedCount,specimenCount,shoulderCount,staleSaves,storageCalls:storageCalls()},
  {rootCount:1104,nestedCount:108,specimenCount:356,shoulderCount:9,staleSaves:4,storageCalls:0});
});
