import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const baseline='e9542886d8db5ab02d9575f49990569e7ba7dc2f';
// Coordinator replaces this after the separately versioned Atlas source is saved.
const revision='ed3d7a1ebaa11edc5bea4c918e43b6019b93d521';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const normalized=(s:string)=>s.replaceAll('\r\n','\n');
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/shoulder-girdle-imaging';
 export * from './atlas-review/lib/body-system-toggle';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-before-projection',setup(api){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('sixteen exact-source shoulder-girdle drafts reach the regional learner and protected Review; all four runtimes preserve models and access',async()=>{
 assert.match(revision,/^[a-f0-9]{40}$/,'Set saved Atlas source commit before import verification');
 const api=await load(),review=json('atlas-review/manifest.json'),epoch=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,979);assert.deepEqual(review.packages,epoch.packages);
 assert.deepEqual(review.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/shoulder-girdle-imaging-pins.json','content/shoulder-girdle-imaging.ts','lib/body-system-toggle.ts','lib/shoulder-girdle-imaging.ts']);
 assert.deepEqual(review.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/body-content.ts','app/body-explorer.tsx','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['package.json','package-lock.json','components/AtlasExplorer.tsx'])assert.equal(normalized(readFileSync(p,'utf8')),normalized(old(p)),p);
 for(const p of ['LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-practice.ts','lib/reasoning-questions.ts','lib/anatomy-practice.ts'])assert.equal(normalized(readFileSync('atlas-review/'+p,'utf8')),normalized(old('atlas-review/'+p)),p);
 const pins=json('atlas-review/content/shoulder-girdle-imaging-pins.json');assert.equal(pins.parentCommit,'732f5f56ff3708b9200b25f18ac3f6f175a438e5');
 assert.equal(sha(JSON.stringify(pins)),'f93a2d2efebd7619547c54f177a6046d8580ca36795818f006ce2ecc1cf2faa6');
 assert.equal(pins.entries.length,16);assert.equal(pins.entries.reduce((n:number,e:any)=>n+e.topics.length,0),32);
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),before=JSON.parse(old(base+'manifest.json'));
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),before.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,base+f.path);
  const inputs=json(base+'source-inputs.json');assert.equal(inputs.length,({'head-neck':952,shoulder:631,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  if(['head-neck','shoulder'].includes(name)){
   // Regional Shoulder & arm uses head-neck. The dedicated shoulder entry has
   // a different teaching panel; an orphan chunk is not learner reachability.
   if(name==='head-neck'){
    const code=emittedTeaching(base,manifest.files,true);
    for(const entry of pins.entries)for(const tab of entry.topics){
     const lesson=api.shoulderGirdleImagingLesson(entry.identity,tab);assert(lesson);
     for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${name}: ${value}`);
    }
   }
   const shared=['app/body-content.ts','content/shoulder-girdle-imaging-pins.json','content/shoulder-girdle-imaging.ts','lib/shoulder-girdle-imaging.ts'];
   if(name==='head-neck')shared.push('app/body-explorer.tsx','lib/body-system-toggle.ts');
   for(const p of shared)assert.equal(inputs.find((f:any)=>f.path===p).sha256,review.files.find((f:any)=>f.path===p).sourceSha256);
  }else assert.equal(inputs.some((f:any)=>f.path==='app/body-content.ts'),false);
 }
 const reviewBase='public/atlas-review-viewer/',viewer=json(reviewBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync(reviewBase+f.path)),f.sha256);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(reviewBase+f.path,'utf8')).join('\n');
 for(const entry of pins.entries)for(const tab of entry.topics){
  const lesson=api.shoulderGirdleImagingLesson(entry.identity,tab);assert(lesson);
  for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(reviewCode.includes(value)||reviewCode.includes(JSON.stringify(value).slice(1,-1)),value);
 }
 assert.deepEqual(api.bodySystemToggle(0,true,false),{available:false,checked:false,disabled:true});
 assert.deepEqual(api.bodySystemToggle(1,true,false),{available:true,checked:true,disabled:false});
 assert.deepEqual(api.bodySystemToggle(1,false,true),{available:true,checked:false,disabled:true});
});

test('all 9936 topics change only at 32 pinned CT/MRI placements; 16 Review packets advance and stale requests fail closed',async()=>{
 const current=await load(),previous=await load(true),catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/shoulder-girdle-imaging-pins.json'),targets=new Map(pins.entries.map((e:any)=>[e.identity.id,e]));
 assert.equal(catalog.structures.length,1104);assert.equal(pins.entries.length,16);assert.equal(new Set(targets.keys()).size,16);
 const identities=new Map([
  ['FMA3992',['FJ2307','right']],['FMA4084',['FJ2255','left']],['FMA5039',['FJ2276','right']],['FMA4086',['FJ2224','left']],
  ['FMA4057',['FJ2284','right']],['FMA10552',['FJ2232','left']],['FMA50859',['FJ2302','right']],['FMA50860',['FJ2250','left']],
  ['FMA66563',['FJ2304','right']],['FMA66564',['FJ2252','left']],['FMA23063',['FJ2361','right']],['FMA23064',['FJ2330','left']],
  ['FMA23068',['FJ2263','right']],['FMA23069',['FJ2211','left']],['FMA23072',['FJ2282','right']],['FMA23073',['FJ2230','left']],
 ]);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId).sort(),[...identities.keys()].sort());
 for(const e of pins.entries){const [file,side]=identities.get(e.identity.fmaId)!;
  assert.equal(e.identity.laterality,side);assert.deepEqual(e.identity.sources.map((s:any)=>s.file),[file]);
  assert.deepEqual(e.topics,['ct','mri']);assert.deepEqual(catalog.structures.find((s:any)=>s.id===e.identity.id),e.identity);
 }
 const previousTopics=catalog.structures.map((s:any)=>({id:s.id,topics:current.contentTabs.map((tab:string)=>({tab,...previous.bodyLesson(s,tab)}))}));
 assert.equal(sha(JSON.stringify(previousTopics)),pins.previousAllTopicsHash);
 let changed=0,unchanged=0,packets=0,unchangedWorksheets=0,rejected=0,mutations=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const s of [...catalog.structures].sort((a:any,b:any)=>Number(targets.has(b.id))-Number(targets.has(a.id)))){
  const entry=targets.get(s.id) as any;
  for(const tab of current.contentTabs){
   const a=previous.bodyLesson(s,tab),b=current.bodyLesson(s,tab);
   if(!entry||!entry.topics.includes(tab)){assert.deepEqual(b,a,s.id+'|'+tab);unchanged++;continue;}
   changed++;assert.deepEqual(s,entry.identity);assert.deepEqual(a,entry.previous[tab]);
   assert.equal(a.readiness,'pending');assert.equal(b.readiness,'draft');assert.deepEqual(b,current.shoulderGirdleImagingLesson(s,tab));
   assert.match(b.note,/radiologist review pending/);assert.match(b.note,/No patient images/);
   if(entry.group==='suprascapular-vein')assert(b.bullets.some((p:string)=>p.includes(tab==='ct'?'arterial-phase CTA is not a complete venous drainage map':'arterial MRA is not a complete venous drainage map')));
   const copy=structuredClone(b);b.bullets.push('Foreign');b.citations.push('Foreign');assert.deepEqual(current.bodyLesson(s,tab),copy);
  }
  const a=await previous.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(b.source,a.source);assert.deepEqual(b.guidedTours,a.guidedTours);assert.deepEqual(b.reasoning,a.reasoning);
  assert.equal(b.fingerprints.source,a.fingerprints.source);assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  if(!entry){assert.equal(b.fingerprints.teaching,a.fingerprints.teaching);unchangedWorksheets++;continue;}
  packets++;assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);assert(await current.parseBodyReviewResponse(b,s.id));
  const foreign=structuredClone(b);foreign.topics.find((t:any)=>t.tab==='ct').body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const c=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);
  assert.notEqual(c.revisions.teaching,prior.revisions.teaching);assert.equal(c.revisions.imaging,null);
  for(const delta of [{materialHash:a.materialHash},{revisionHash:prior.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SHOULDER_GIRDLE_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:current.blankBodyReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  }
  for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:s.laterality==='left'?'right':'left'},{regions:['head-neck']},{region:'head-neck'},{sourceTree:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map((f:any)=>({...f,sha256:'0'.repeat(64)}))}]){
   const altered={...s,...patch};if(JSON.stringify(altered)===JSON.stringify(s))continue;
   for(const tab of entry.topics){assert.equal(current.shoulderGirdleImagingLesson(altered,tab),undefined);mutations++;}
  }
 }
 assert.deepEqual({changed,unchanged,packets,unchangedWorksheets,rejected,mutations},{changed:32,unchanged:9904,packets:16,unchangedWorksheets:1088,rejected:32,mutations:416});
});
