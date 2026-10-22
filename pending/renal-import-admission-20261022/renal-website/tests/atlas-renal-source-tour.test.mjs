import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
const root=resolve(process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('..',import.meta.url)));
const previous='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor/website';
const atlas=process.env.VM_ATLAS_SOURCE_REPO;
const source='4f20ae0b62b9e0dab5936b430575a983dcdd934e',before='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const revision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);
const git=(epoch,p)=>execFileSync('git',['-C',atlas,'show',epoch+':'+p],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
async function api(site){
 const require=createRequire(resolve(site,'package.json')),{build}=require('esbuild');
 const built=await build({stdin:{contents:[
  "export * from './atlas-review/lib/regional-tours';",
  "export {renalTourMatches} from './atlas-review/lib/renal-tour';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join(''),resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
 const module={exports:{}};runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,crypto,Request,Response,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone});return module.exports;
}
function emitted(base,manifest){
 const files=new Map(manifest.files.map(r=>[r.path,r])),seen=new Set();
 function visit(p){if(seen.has(p))return;const r=files.get(p);assert(r,'Manifested reachable output '+p);const b=read(base+p);assert.equal(sha(b),r.sha256,p);seen.add(p);
  for(const m of b.toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+m[1]);}
 visit('index.html');return [...seen].filter(p=>p.endsWith('.js')).map(p=>read(base+p).toString()).join('\n');
}
test('renal source-bound tour reaches the actual learner and protected Review without changing anatomy or other teaching',async()=>{
 assert(atlas);const review=json('atlas-review/manifest.json'),binding=json('atlas-review/integration-inputs.json'),viewer=json('public/atlas-review-viewer/manifest.json');
 const runtime=json('public/atlas-runtime/head-neck/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,source);assert.equal(binding.sourceCommit,source);assert.equal(runtime.sourceCommit,source);assert.equal(viewer.sourceCommit,source);
 assert.equal(review.files.length,1561);assert.equal(binding.inputs.length,1728);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
 same(viewer.packages,JSON.parse(readFileSync(previous+'/public/atlas-review-viewer/manifest.json')).packages);
 assert.equal(binding.sha256,viewer.websiteIntegrationSha256);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 const graph=new Map([
  ['lib/renal-tour.ts',{binding:true,runtime:true}],['lib/regional-tours.ts',{binding:true,runtime:true}],
  ['content/renal-tour-pins.json',{binding:true,runtime:true}],['content/body-review-display-pins.json',{binding:true,runtime:false}],
  ['content/body-renderer-revision.json',{binding:false,runtime:false}],
 ]);
 for(const[p,owner]of graph){const rows=review.files.filter(r=>r.path===p);assert.equal(rows.length,1,p);assert.equal(rows[0].sourceSha256,sha(git(source,p)),p);assert.equal(rows[0].importedSha256,sha(read('atlas-review/'+p)),p);
  same(binding.inputs.filter(r=>r.path==='atlas-review/'+p),owner.binding?[{path:'atlas-review/'+p,sha256:rows[0].importedSha256}]:[],p+' protected role');
  same(inputs.filter(r=>r.path===p),owner.runtime?[{path:p,sha256:rows[0].sourceSha256}]:[],p+' learner role');}
 for(const p of ['public/models/bodyparts3d/full-body/catalog.json','public/models/bodyparts3d/manifest.json','app/body-content.ts']){
  assert.deepEqual(git(source,p),git(before,p),p+' whole source unchanged');assert.deepEqual(read('atlas-review/'+p),git(source,p),p+' imported bytes');}
 const now=await api(root),old=await api(previous),catalog=now.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const oldCatalog=old.bodyDisplayCatalog(JSON.parse(readFileSync(previous+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
 same(catalog,oldCatalog);assert.equal(catalog.structures.length,1104);assert.equal(now.regionalTours.length,51);assert.equal(now.regionalTours.reduce((n,t)=>n+t.steps.length,0),309);
 same(now.regionalTours.filter(t=>t.id!==now.renalTour.id),old.regionalTours.filter(t=>t.id!==old.renalTour.id));
 same({...now.renalTour,revision:old.renalTour.revision},old.renalTour);assert.equal(now.renalTour.revision,revision);assert.equal(now.renalTour.status,'draft');
 assert.equal(now.renalTourMatches(catalog,now.renalTour),true);
 const selected=now.regionalTourStructures(catalog,now.renalTour),affected=new Set(selected.map(s=>s.id));assert.equal(affected.size,5);
 same(now.regionalTourStepFrames(catalog,now.renalTour),old.regionalTourStepFrames(oldCatalog,old.renalTour),'same flowing camera frames');
 let substitutions=0;
 for(const s of selected)for(const patch of [{fmaId:'FMA-unrelated'},{bounds:{min:[0,0,0],max:[1,1,1]}},{sources:[{...s.sources[0],sha256:'0'.repeat(64)}]}]){
  const altered={...catalog,structures:catalog.structures.map(r=>r.id===s.id?{...r,...patch}:r)};
  assert.equal(old.regionalTourStructures(altered,old.renalTour).length,5,'Negative control: previous ID-only source accepts this substitution');
  assert.throws(()=>now.regionalTourStructures(altered,now.renalTour),/renal guided tour/);substitutions++;
 }
 for(const patch of [{license:'unlicensed'},{credit:'changed attribution'},{sourceVersion:'different-source'}])assert.equal(now.renalTourMatches({...catalog,...patch},now.renalTour),false);
 let changed=0,unchanged=0,topics=0,packetRefusals=0;
 for(const s of catalog.structures){const current=await now.bodyReviewMaterial(s.id),prior=await old.bodyReviewMaterial(s.id);assert(current&&prior);topics+=current.topics.length;
  same(current.source,prior.source);same(current.topics,prior.topics);same(current.reasoning,prior.reasoning);assert.equal(current.approval,false);
  if(!affected.has(s.id)){same(current,prior,s.id+' whole packet unchanged');unchanged++;continue;}
  changed++;assert.equal(current.fingerprints.source,prior.fingerprints.source);assert.equal(current.fingerprints.checklist,prior.fingerprints.checklist);assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);
  assert(await now.parseBodyReviewResponse(current,s.id));assert.equal(await now.parseBodyReviewResponse(prior,s.id),null,'Old tour evidence needs fresh review');
  const i=current.guidedTours.findIndex(e=>e.tour.id===now.renalTour.id);assert(i>=0);const e=current.guidedTours[i];
  assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);same(e.continuousPlayback,prior.guidedTours.find(e=>e.tour.id===old.renalTour.id).continuousPlayback);
  for(const mutate of [p=>{p.guidedTours[i].tour.revision=old.renalTour.revision;},p=>{p.guidedTours[i].tour.steps[0].caption+=' altered';},p=>{p.guidedTours[i].structures[0].sources[0].sha256='0'.repeat(64);},p=>{p.guidedTours[i].transitionMs=0;},p=>p.guidedTours.splice(i,1)]){
   const p=structuredClone(current);mutate(p);assert.equal(await now.parseBodyReviewResponse(p,s.id),null);packetRefusals++;
  }
 }
 assert.equal(changed,5);assert.equal(unchanged,1099);assert.equal(topics,9936);assert.equal(substitutions,15);assert.equal(packetRefusals,25);
 for(const[base,manifest]of [['public/atlas-runtime/head-neck/',runtime],['public/atlas-review-viewer/',viewer]]){
  const code=emitted(base,manifest);assert(code.includes(revision),base+' reaches current tour revision');assert(code.includes('The renal guided tour does not match the available anatomy source.'),base+' reaches refusal guard');
  assert.equal(manifest.patientDataIncluded??false,false);assert.equal(manifest.clinicalApproved??false,false);
 }
 console.log(JSON.stringify({source,review:binding.sha256,affectedReviewPackets:changed,unchangedReviewPackets:unchanged,unchangedTeachingPlacements:topics,substitutionsRefused:substitutions,packetRefusals,clinicalApproval:false,spatialRegistration:false}));
});
