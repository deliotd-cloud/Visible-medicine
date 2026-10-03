import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {regionalSpreadMilestoneBytes} from './atlas-lumbar-sacral-history.ts';

const revision='c78e383a37976e2e459fd41504eac6281241af1d';
const baseline='167c77f4da6ec16455093008dcacea250b0a6678';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6});
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');

test('bounded regional Spread reaches learner and protected review without model, licence or access changes',async()=>{
 const review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json').toString());
 const ultrasoundInputs=['content/hyoid-epiglottis-ultrasound-pins.json','content/hyoid-epiglottis-ultrasound.ts','lib/hyoid-epiglottis-ultrasound.ts'];
 assert.equal(review.revision,revision);assert.equal(review.files.length,1018+ultrasoundInputs.length);assert.deepEqual(review.packages,prior.packages);
 assert.deepEqual(review.files.filter((f:any)=>ultrasoundInputs.includes(f.path)).map((f:any)=>f.path).sort(),ultrasoundInputs);
 // Preserve the exact Spread epoch; the lumbar regression proves the later delta.
 const spreadEpoch=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(spreadEpoch.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path),['lib/body-spread.ts']);
 assert.deepEqual(spreadEpoch.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),['app/body-explorer.tsx','app/body-scene.tsx','content/body-renderer-revision.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 for(const [name,count,added] of [['head-neck',991,true],['shoulder',664,false],['lower-limb',100,true]] as const){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),previous=JSON.parse(old(base+'manifest.json').toString()),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,revision);assert.equal(inputs.length,count+(name==='lower-limb'?0:ultrasoundInputs.length));assert.equal(inputs.some((f:any)=>f.path==='lib/body-spread.ts'),added);
  assert.deepEqual(inputs.filter((f:any)=>ultrasoundInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:ultrasoundInputs);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],previous[flag]);
  const noticePath=base+'LICENSES/THIRD_PARTY_NOTICES.md';
  const completed=execFileSync('git',['show','d6c37e4df4065fb832bf89b3a1a825de0d3033ff:'+noticePath],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  const current=readFileSync(noticePath,'utf8');
  assert.deepEqual(regionalSpreadMilestoneBytes(noticePath),old(noticePath),'Spread did not change preceding licence bytes');
  const header='# Third-party notices\n\n',circle='## Circle of Willis guided orientation (2 October 2026)\n';
  const spinal='\n## Spinal-bone ultrasound orientation — 3 October 2026\n';
  assert(current.startsWith(header+'## Hyoid and epiglottis ultrasound teaching (3 October 2026)\n'));
  const previousNotice=execFileSync('git',['show','452f36b1ca5d86bdac8b7ce4c2bfc42da22fb712:'+noticePath],{maxBuffer:32e6}).toString();
  assert(previousNotice.startsWith(header+'## Open3DModel upper-limb candidate (3 October 2026, offline only)\n'));
  assert(current.endsWith(previousNotice.slice(header.length)),'All prior licence bytes are preserved after the new factual-teaching disclosure');
  const circleAt=current.indexOf(circle),spinalAt=current.indexOf(spinal,circleAt);
  assert(circleAt>header.length&&spinalAt>circleAt);
  assert.equal(current.lastIndexOf(circle),circleAt);assert.equal(current.lastIndexOf(spinal),spinalAt);
  assert.equal(header+current.slice(circleAt,spinalAt),completed,'Every completed notice byte remains in the delivery');
  assert.equal(current,readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8'),'Learner and protected Review notices agree');
  const noticeEntry=manifest.files.find((f:any)=>f.path==='LICENSES/THIRD_PARTY_NOTICES.md');
  assert(noticeEntry);assert.equal(sha(Buffer.from(current)),noticeEntry.sha256,'Delivered notice matches its manifest');
  for(const p of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])assert.deepEqual(readFileSync(base+p),old(base+p));
 }
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 const text=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8')).join('\n');
 assert(text.includes('Spread adds more space across narrow regions'));
 const scene=readFileSync('atlas-review/app/body-scene.tsx','utf8'),explorer=readFileSync('atlas-review/app/body-explorer.tsx','utf8');
 assert.match(scene,/adaptiveSpread\?: boolean/);assert.match(scene,/props\.adaptiveSpread \? bodySpreadScale\(frame\)/);assert.match(scene,/layout === 'spatial' && props\.adaptiveSpread/);
 assert.match(explorer,/\sadaptiveSpread\s/);
 const result=await build({stdin:{contents:"export * from './atlas-review/lib/body-spread';export {Box3,Vector3} from 'three';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const frame=new api.Box3(new api.Vector3(-1,-4,-.5),new api.Vector3(1,4,.5)),gain=api.bodySpreadScale(frame);
 assert.deepEqual(gain.toArray(),[3,1,3]);
 const origin=new api.Vector3();for(const amount of [0,NaN])assert.deepEqual(api.bodySpreadOffset([1,2,3],origin,amount,false,gain).toArray(),[0,0,0]);
 assert.deepEqual(api.bodySpreadOffset([1,2,3],origin,100,true,gain).toArray(),[0,0,0]);assert.deepEqual(origin.toArray(),[0,0,0]);
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const f of viewer.files)assert.equal(sha(readFileSync('public/atlas-review-viewer/'+f.path)),f.sha256);
});

async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:previous?[{name:'prior-website-renderer-only',setup(p){p.onLoad({filter:/body-renderer-revision\.json$/},()=>({contents:old('atlas-review/content/body-renderer-revision.json').toString(),loader:'json'}));}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('Spread preserves all teaching and rejects stale root/nested geometry before touching storage',async()=>{
 const now=await load(),before=await load(true),storage=new Proxy({},{get(){throw Error('Invalid submission touched storage');}});
 const request=(body:any)=>new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SPREAD_TEST'},body:JSON.stringify(body)});
 assert.deepEqual(now.bodyReviewSummaries,before.bodyReviewSummaries);assert.equal(now.bodyReviewSummaries.length,1104);
 let roots=0,nested=0,rejected=0;
 for(const row of now.bodyReviewSummaries){
  assert.deepEqual(now.bodyReviewSnapshot(row.id),before.bodyReviewSnapshot(row.id));
  const n=await now.bodyReviewContext(row.id),b=await before.bodyReviewContext(row.id);
  assert.equal(n.sourceHash,b.sourceHash);assert.equal(n.teachingHash,b.teachingHash);assert.equal(n.revisions.teaching,b.revisions.teaching);assert.equal(n.revisions.imaging,null);
  assert.deepEqual(n.checklists,b.checklists);assert.deepEqual(n.blockers,b.blockers);assert.notEqual(n.revisions.geometry,b.revisions.geometry);
  assert(now.bodyReviewStale({catalogScope:b.catalogScope,structureId:row.id,track:'geometry',checklistVersion:b.checklistVersion,revisionHash:b.revisions.geometry},n));
  assert.equal((await now.postBodyDecision(request({catalogScope:n.catalogScope,structureId:row.id,track:'geometry',expectedVersion:0,materialHash:n.materialHash,revisionHash:b.revisions.geometry,checklistVersion:n.checklistVersion,draft:now.blankBodyReview(n,'geometry')}),storage)).status,409);roots++;rejected++;
 }
 assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){
  const n=await now.nestedReviewMaterial(group.key,row.id),b=await before.nestedReviewMaterial(group.key,row.id),c=n.context,p=b.context;
  assert.deepEqual(n.source,b.source);assert.deepEqual(n.teaching,b.teaching);assert.equal(n.atlasLink,b.atlasLink);
  assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.equal(c.revisions.imaging,null);
  assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
  for(const [track,delta] of [['teaching',{materialHash:p.materialHash}],['geometry',{materialHash:p.materialHash}],['geometry',{revisionHash:p.revisions.geometry}]] as const){
   assert.equal((await now.postNestedReview(request({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...(delta as Record<string,string>)}),storage)).status,409);rejected++;
  }nested++;
 }
 assert.deepEqual({roots,nested,rejected},{roots:1104,nested:108,rejected:1428});
 for(const p of ['content/body-review-display-pins.json','content/shoulder-arm-muscle-imaging.ts','content/shoulder-arm-muscle-imaging-pins.json','content/shoulder-arterial-ct.ts','content/shoulder-arterial-mri.ts','LICENSES/THIRD_PARTY_NOTICES.md'])assert.deepEqual(regionalSpreadMilestoneBytes('atlas-review/'+p),old('atlas-review/'+p));
 // The host binder conservatively fingerprints the whole review integration.
 // Preserve the exact Spread milestone's source invariants; the later guided
 // keyboard fix changes display geometry revisions, not authored teaching.
 const shoulder=json('atlas-review/content/review-revisions.json'),priorShoulder=JSON.parse(old('atlas-review/content/review-revisions.json').toString());
 const spreadShoulder=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/content/review-revisions.json').toString());
 assert.deepEqual(spreadShoulder.sourceRevisions,priorShoulder.sourceRevisions);
 const {revisions:_n,websiteIntegrationSha256:_nh,...stable}=spreadShoulder;
 const {revisions:_b,websiteIntegrationSha256:_bh,...priorStable}=priorShoulder;
 assert.deepEqual(stable,priorStable);
 assert.equal(shoulder.modelHash,spreadShoulder.modelHash);
 assert.deepEqual(Object.keys(shoulder.sourceRevisions),Object.keys(spreadShoulder.sourceRevisions));
 const previousDisplay=new Map<string,string>(spreadShoulder.display),currentDisplay=new Map<string,string>(shoulder.display);
 assert.deepEqual([...currentDisplay.keys()],[...previousDisplay.keys()]);
 assert.deepEqual([...currentDisplay].filter(([path,hash])=>previousDisplay.get(path)!==hash).map(([path])=>path),['app/fitted-camera.tsx']);
 assert.equal(currentDisplay.get('app/fitted-camera.tsx'),'5b645a3e14cc8792bdab2be9e5369d40add37005b53a6aa9b40dd39123fa96d9');
 for(const [id,tracks] of Object.entries(shoulder.sourceRevisions) as [string,Record<string,string|null>][]){
  assert.equal(tracks.teaching,spreadShoulder.sourceRevisions[id].teaching);
  assert.notEqual(tracks.geometry,spreadShoulder.sourceRevisions[id].geometry);
  for(const track of ['geometry','teaching']){
   assert.notEqual(shoulder.revisions[id][track],priorShoulder.revisions[id][track]);
   assert.equal(shoulder.revisions[id][track],sha(Buffer.from(JSON.stringify({source:tracks[track],website:shoulder.websiteIntegrationSha256}))));
  }assert.equal(shoulder.revisions[id].imaging,null);
 }
});
