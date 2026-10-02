import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {withoutCircleWillisNotice} from './atlas-circle-willis-history.ts';

const source='55b0e548c6552de3ef6c4e8f432e71d60690e843';
const beforeWebsite='4aa346e7923e3b303ad869d71e0ea36044d61aa6';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>Buffer.from(execFileSync('git',['show',beforeWebsite+':'+p],{maxBuffer:32e6}));
const targetFmas=new Set(['FMA22964','FMA22965','FMA22968','FMA22969']);
async function reviewApi(previous=false,cubitalMilestone=false){
 const output=await build({stdin:{contents:`export {bodyReviewSnapshot,bodyReviewMaterial,bodyReviewSummaries} from './atlas-review/lib/body-review-material';
 export {bodyReviewContext} from './atlas-review/lib/body-review-context';
 export {blankBodyReview,bodyApprovalProblems,bodyReviewStale,bodyDecisionLabel} from './atlas-review/lib/body-review-decisions';
 export {postBodyDecision} from './atlas-review/lib/body-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous||cubitalMilestone?[{name:'exact-before-cubital-teaching-and-renderer',setup(p){
  for(const file of ['app/body-content.ts','content/body-renderer-revision.json'])
   p.onLoad({filter:file.endsWith('.ts')?/[\\/]app[\\/]body-content\.ts$/:/[\\/]content[\\/]body-renderer-revision\.json$/},args=>({contents:(cubitalMilestone?execFileSync('git',['show','167c77f4da6ec16455093008dcacea250b0a6678:atlas-review/'+file],{maxBuffer:32e6}):old('atlas-review/'+file)).toString('utf8'),loader:file.endsWith('.ts')?'ts':'json',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}

test('four exact superficial veins deliver original ultrasound orientation to learner and protected review without new models or access',async()=>{
 const review=json('atlas-review/manifest.json'),priorReview=JSON.parse(old('atlas-review/manifest.json').toString('utf8'));
 assert.equal(review.revision,source);assert.equal(review.files.length,962);assert.deepEqual(review.packages,priorReview.packages);
 // Keep this editorial delta at its saved epoch; current Spread delta is tested separately.
 const cubitalMilestone=JSON.parse(execFileSync('git',['show','167c77f4da6ec16455093008dcacea250b0a6678:atlas-review/manifest.json'],{encoding:'utf8',maxBuffer:32e6}));
 assert.equal(cubitalMilestone.files.length,946);
 assert.deepEqual(cubitalMilestone.files.filter((f:any)=>!priorReview.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/cubital-venous-ultrasound.ts','lib/cubital-venous-ultrasound.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const catalog=json('atlas-review/public/models/bodyparts3d/cubital-veins/catalog.json'),api=await reviewApi();
 assert.deepEqual(new Set(catalog.structures.map((s:any)=>s.fmaId)),targetFmas);
 assert.deepEqual(catalog.structures.map((s:any)=>s.sources[0].file),['FJ2287','FJ2235','FJ2286','FJ2234']);
 const learner=json('public/atlas-runtime/head-neck/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(learner.sourceCommit,source);assert.equal(inputs.length,935);
 const text=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const b=readFileSync('public/atlas-runtime/head-neck/'+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 for(const p of ['content/cubital-venous-ultrasound.ts','lib/cubital-venous-ultrasound.ts'])assert(inputs.some((i:any)=>i.path===p));
 for(const s of catalog.structures){const packet=await api.bodyReviewMaterial(s.id);assert(packet);assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,s);
  const us=packet.topics.find((t:any)=>t.tab==='ultrasound');assert.equal(us.readiness,'draft');assert(us.body.length>100);assert(us.citations.every((u:string)=>u.startsWith('https://')));
  assert(text.includes(us.body.slice(0,90)));assert(text.includes(s.id));assert.match(us.note,/revision-bound radiologist review/);assert.match(us.note,/access remain independent/);
  for(const tab of ['ct','mri'])assert.equal(packet.topics.find((t:any)=>t.tab===tab).readiness,'pending');
  const c=await api.bodyReviewContext(s.id);assert.equal(c.revisions.imaging,null);assert(c.blockers.imaging.length);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString('utf8')).models);
 for(const name of ['head-neck','shoulder','lower-limb']){const now=json('public/atlas-runtime/'+name+'/manifest.json'),prior=JSON.parse(old('public/atlas-runtime/'+name+'/manifest.json').toString('utf8'));
  assert.equal(now.sourceCommit,source);assert.deepEqual(now.files.filter((f:any)=>f.path.startsWith('models/')),prior.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(now[flag],prior[flag]);
  const notice=withoutCircleWillisNotice(readFileSync('public/atlas-runtime/'+name+'/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','')),oldNotice=old('public/atlas-runtime/'+name+'/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8').replaceAll('\r','');
  assert(notice.startsWith(oldNotice));assert.match(notice.slice(oldNotice.length),/Superficial forearm venous ultrasound orientation/);
  assert.deepEqual(readFileSync('public/atlas-runtime/'+name+'/bundled-dependencies.json'),old('public/atlas-runtime/'+name+'/bundled-dependencies.json'));
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,source);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});

test('only four ultrasound topics change; old teaching submissions fail before storage and review tracks stay independent',async()=>{
 const now=await reviewApi(false,true),before=await reviewApi(true),forbidden=new Proxy({},{get(){throw Error('Invalid submission reached storage');}});
 assert.deepEqual(now.bodyReviewSummaries,before.bodyReviewSummaries);assert.equal(now.bodyReviewSummaries.length,1104);
 let changed=0,unchanged=0,teachingChanged=0,teachingPreserved=0,rejected=0;
 for(const row of now.bodyReviewSummaries){const n=now.bodyReviewSnapshot(row.id),b=before.bodyReviewSnapshot(row.id);assert(n&&b);
  const target=targetFmas.has(row.fmaId);assert.deepEqual(n.source,b.source);assert.equal(n.atlasLink,b.atlasLink);
  for(const topic of n.topics){const prior=b.topics.find((t:any)=>t.tab===topic.tab);if(target&&topic.tab==='ultrasound'){assert.equal(prior.readiness,'pending');assert.equal(topic.readiness,'draft');changed++;}else{assert.deepEqual(topic,prior);unchanged++;}}
  const nc=await now.bodyReviewContext(row.id),bc=await before.bodyReviewContext(row.id);assert.equal(nc.sourceHash,bc.sourceHash);assert.equal(nc.revisions.imaging,null);assert.deepEqual(nc.checklists,bc.checklists);assert.deepEqual(nc.blockers,bc.blockers);
  const saved=(track:string)=>({catalogScope:bc.catalogScope,structureId:row.id,checklistVersion:bc.checklistVersion,track,revisionHash:bc.revisions[track],status:'approved'});
  assert.notEqual(nc.revisions.geometry,bc.revisions.geometry);assert(now.bodyReviewStale(saved('geometry'),nc));
  if(!target){assert.equal(nc.teachingHash,bc.teachingHash);assert.equal(nc.revisions.teaching,bc.revisions.teaching);assert.equal(now.bodyDecisionLabel(saved('teaching'),nc),'Approval recorded');teachingPreserved++;continue;}
  assert.notEqual(nc.teachingHash,bc.teachingHash);assert.notEqual(nc.revisions.teaching,bc.revisions.teaching);assert.equal(now.bodyDecisionLabel(saved('teaching'),nc),'Re-review required');teachingChanged++;
  const draft=now.blankBodyReview(nc,'teaching');assert.equal(draft.status,'draft');assert(now.bodyApprovalProblems(draft,nc,'teaching').length);
  const request=(patch:any)=>new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-test-reviewer'},body:JSON.stringify({catalogScope:nc.catalogScope,structureId:row.id,track:'teaching',expectedVersion:0,materialHash:nc.materialHash,revisionHash:nc.revisions.teaching,checklistVersion:nc.checklistVersion,draft,...patch})});
  for(const patch of [{revisionHash:bc.revisions.teaching},{materialHash:bc.materialHash},{revisionHash:bc.revisions.teaching,materialHash:bc.materialHash}]){assert.equal((await now.postBodyDecision(request(patch),forbidden)).status,409);rejected++;}
  assert.equal((await now.postBodyDecision(request({draft:{...draft,status:'approved'}}),forbidden)).status,422);rejected++;
 }
 assert.deepEqual({changed,unchanged,teachingChanged,teachingPreserved,rejected},{changed:4,unchanged:9932,teachingChanged:4,teachingPreserved:1100,rejected:16});
});
