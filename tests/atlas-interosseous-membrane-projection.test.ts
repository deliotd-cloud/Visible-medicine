import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
const membraneEpoch='ac7e99c7b6068020c90446628091782181d6c485';
const epochBytes=(p:string)=>execFileSync('git',['show',membraneEpoch+':'+p],{maxBuffer:32e6});
function readFileSync(p:string,encoding:'utf8'):string;
function readFileSync(p:string):Buffer;
function readFileSync(p:string,encoding?:'utf8'):Buffer|string{const bytes=epochBytes(p);return encoding?bytes.toString():bytes;}
const membraneEpochPlugin={name:'immutable-completed-membrane-epoch',setup(api:import('esbuild').PluginBuild){api.onLoad({filter:/\.(?:ts|json)$/},args=>{
 const path=relative(process.cwd(),args.path).replaceAll('\\','/');
 if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json'].includes(path))return;
 return{contents:epochBytes(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
});}};
const baseline='0b85c1ab71c8557f0869b272d20a75db5864e5f4';
const revision='24e82d38d226eac294ffa5f3a922448f4904cec0';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/interosseous-membrane-projection';
 export * from './atlas-review/content/interosseous-membrane-projection';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:[...(previous?[{name:'exact-before-projection',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[]),membraneEpochPlugin]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('historical membrane delivery: eight source-pinned membrane topics reach learners and protected Review without extra controls, assets or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),epoch=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,969);assert.deepEqual(review.packages,epoch.packages);
 assert.deepEqual(review.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/interosseous-membrane-projection-pins.json','content/interosseous-membrane-projection.ts','lib/interosseous-membrane-projection.ts']);
 assert.deepEqual(review.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['package.json','package-lock.json','components/AtlasExplorer.tsx','lib/atlas-delivery-policy.ts']){
  if(p.endsWith('atlas-delivery-policy.ts'))continue; // only its current inventory digest changes, verified by the import audit.
  assert.equal(readFileSync(p,'utf8').replaceAll('\r\n','\n'),old(p).replaceAll('\r\n','\n'),p);
 }
 for(const p of ['LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-practice.ts','lib/reasoning-questions.ts','lib/anatomy-practice.ts'])assert.equal(readFileSync('atlas-review/'+p,'utf8').replaceAll('\r\n','\n'),old('atlas-review/'+p).replaceAll('\r\n','\n'));
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),JSON.parse(old(base+'manifest.json')).files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256);
 }
 const base='public/atlas-runtime/head-neck/',manifest=json(base+'manifest.json'),code=emittedTeaching(base,manifest.files,true,epochBytes);
 const reviewBase='public/atlas-review-viewer/',viewer=json(reviewBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync(reviewBase+f.path)),f.sha256);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(reviewBase+f.path,'utf8')).join('\n');
 for(const group of Object.values(api.interosseousMembraneProjectionTopics) as any[])for(const topic of Object.values(group) as any[]){
  const values=[topic.body,...topic.bullets,...api.interosseousMembraneProjectionShared,...topic.references.map((key:string)=>api.interosseousMembraneProjectionReferences[key].url)];
  for(const value of values)for(const artifact of [code,reviewCode])assert(artifact.includes(value)||artifact.includes(JSON.stringify(value).slice(1,-1)),value);
 }
 const inputs=json(base+'source-inputs.json');assert.equal(inputs.length,942);
 for(const p of ['app/body-content.ts','content/interosseous-membrane-projection-pins.json','content/interosseous-membrane-projection.ts','lib/interosseous-membrane-projection.ts'])assert.equal(inputs.find((f:any)=>f.path===p).sha256,review.files.find((f:any)=>f.path===p).sourceSha256);
});
test('historical membrane teaching: all9936 topics retain exactly8 changes and four review packets advance; foreign sources and stale decisions fail closed',async()=>{
 const current=await load(),previous=await load(true),catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/interosseous-membrane-projection-pins.json'),targets=new Map(pins.entries.map((e:any)=>[e.identity.id,e]));
 assert.equal(catalog.structures.length,1104);assert.equal(pins.entries.length,4);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId).sort(),['FMA23707','FMA23708','FMA35192','FMA35193']);
 let changed=0,unchanged=0,packets=0,rejected=0,mutations=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const s of [...catalog.structures].sort((a:any,b:any)=>Number(targets.has(b.id))-Number(targets.has(a.id)))){
  const entry=targets.get(s.id) as any;
  for(const tab of current.contentTabs){
   const a=previous.bodyLesson(s,tab),b=current.bodyLesson(s,tab);
   if(!entry||!entry.topics.includes(tab)){assert.deepEqual(b,a,s.id+'|'+tab);unchanged++;continue;}
   changed++;assert.deepEqual(s,entry.identity);assert.deepEqual(a,entry.previous[tab]);
   assert.equal(a.readiness,'pending');assert.equal(b.readiness,'draft');assert.deepEqual(b,current.interosseousMembraneProjectionLesson(s,tab));
   assert(b.bullets.some((p:string)=>/membrane integrity|membrane injury|whole membrane|whole-membrane integrity/.test(p)));
   assert.match(b.note,/review pending/);assert.match(b.note,/No patient images/);
   const copy=structuredClone(b);b.bullets.push('Foreign');b.citations.push('Foreign');assert.deepEqual(current.bodyLesson(s,tab),copy);
  }
  const a=await previous.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(b.source,a.source);assert.deepEqual(b.guidedTours,a.guidedTours);assert.deepEqual(b.reasoning,a.reasoning);
  assert.equal(b.fingerprints.source,a.fingerprints.source);assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  if(!entry){assert.equal(b.fingerprints.teaching,a.fingerprints.teaching);continue;}
  packets++;assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);assert(await current.parseBodyReviewResponse(b,s.id));
  const foreign=structuredClone(b);foreign.topics.find((t:any)=>t.tab==='ct').body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const c=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);
  assert.notEqual(c.revisions.teaching,prior.revisions.teaching);assert.equal(c.revisions.imaging,null);
  for(const delta of [{materialHash:a.materialHash},{revisionHash:prior.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_MEMBRANE_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:current.blankBodyReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  }
  for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:s.laterality==='left'?'right':'left'},{regions:['head-neck']},{region:'head-neck'},{sourceTree:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map((f:any)=>({...f,sha256:'0'.repeat(64)}))}]){
   const altered={...s,...patch};if(JSON.stringify(altered)===JSON.stringify(s))continue;
   for(const tab of entry.topics)assert.equal(current.interosseousMembraneProjectionLesson(altered,tab),undefined);mutations++;
  }
 }
 assert.deepEqual({changed,unchanged,packets,rejected,mutations},{changed:8,unchanged:9928,packets:4,rejected:8,mutations:52});
});
