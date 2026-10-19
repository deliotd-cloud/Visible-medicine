import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
type Entry={id:string;fmaId:string;bundle:string;bounds:{min:number[];max:number[]};validation:{anatomicalReview:boolean}};
type File={path:string;sha256:string;sourceSha256?:string};

test('pulmonary guided tour binds eight exact sources, paired frames and draft Review evidence to the learner',async()=>{
 const base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json'),review=json('atlas-review/manifest.json');
 assert.equal(learner.patientDataIncluded,false);assert.equal(review.revision,learner.sourceCommit);
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])
  assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,review.revision);
 const inputs:File[]=json(base+'source-inputs.json');
 for(const path of ['lib/pulmonary-venous-tour.ts','content/pulmonary-venous-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find(f=>f.path===path),imported=review.files.find((f:File)=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
 }
 const pins=json('atlas-review/content/pulmonary-venous-tour-pins.json');
 assert.equal(sha(JSON.stringify(pins)),'82a8ffd83173093067aa32cb289536f111c9ef8e9948a2bfbcbc999357f40132');
 assert.equal(pins.baseline,'74a9c14258969ae33324d3f680be0f364e270463');
 assert.equal(pins.tourRevision,'pulmonary-venous-hilar-relationships-20261011-r1');
 assert.deepEqual(pins.entries.map((e:Entry)=>e.fmaId),['FMA49914','FMA49911','FMA49916','FMA49913']);
 assert.deepEqual(pins.contextEntries.map((e:Entry)=>e.fmaId),['FMA7395','FMA50872','FMA7396','FMA50873']);
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['thorax-organs-inventory','thorax-vessels-recovery']);
 const compiled=await build({stdin:{contents:"export {pulmonaryVenousTour,pulmonaryVenousTourMatches} from './atlas-review/lib/pulmonary-venous-tour';export {regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';export {bodyReviewMaterial,bodyReviewSummaries} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.pulmonaryVenousTour;
 const entries:Entry[]=pins.entries,context:Entry[]=pins.contextEntries,resolved=[...context,...entries];
 assert.equal(catalog.structures.length,1104);assert.equal(api.bodyReviewSummaries.length*api.contentTabs.length,9936);
 assert.equal(api.pulmonaryVenousTourMatches(catalog,tour),true);
 assert.deepEqual(api.regionalTourStructures(catalog,tour),resolved);
 assert.equal(tour.id,'pulmonary-venous-hilar-relationships');assert.equal(tour.region,'thorax');
 assert.equal(tour.revision,pins.tourRevision);assert.equal(tour.status,'draft');
 assert.deepEqual(tour.contextIds,context.map(s=>s.id));
 assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),entries.map(s=>s.id));
 assert.deepEqual(tour.steps.map((s:{view:string})=>s.view),['anterior','right','anterior','left']);
 const frames=api.regionalTourStepFrames(catalog,tour);assert.equal(frames.length,4);
 for(const [i,step] of tour.steps.entries()){
  const offset=Math.floor(i/2)*2,local=[...entries.slice(offset,offset+2),...context.slice(offset,offset+2)];
  assert.deepEqual(step.frameIds,local.map(s=>s.id));
  assert.deepEqual(frames[i],{min:[0,1,2].map(a=>Math.min(...local.map(s=>s.bounds.min[a]))),max:[0,1,2].map(a=>Math.max(...local.map(s=>s.bounds.max[a])))});
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/schemes/lungs_ans.html']);
 }
 const learnerJs=learner.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
  const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
 }).join('\n');
 for(const step of tour.steps)assert(learnerJs.includes(step.caption),step.id);
 for(const entry of resolved){
  assert.equal(entry.validation.anatomicalReview,false);
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.topics.length,9);
  assert.deepEqual(packet.source.structure,entry);
  const guided=packet.guidedTours.filter((g:{tour:{id:string}})=>g.tour.id===tour.id);assert.equal(guided.length,1);
  const evidence=guided[0];
  assert.deepEqual(evidence.tour,wire(tour));assert.deepEqual(evidence.structures,resolved);
  assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['removed','caption','source','context','frame','revision','registration','approval']){
   const bad=wire(packet),item=bad.guidedTours.find((g:{tour:{id:string}})=>g.tour.id===tour.id);
   if(change==='removed')bad.guidedTours.splice(bad.guidedTours.indexOf(item),1);
   if(change==='caption')item.tour.steps[0].caption='Altered';
   if(change==='source')item.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='context')item.tour.contextIds=[];
   if(change==='frame')item.stepFrames[0].max[0]+=0.1;
   if(change==='revision')item.tour.revision='foreign';
   if(change==='registration')item.patientRegistered=true;
   if(change==='approval')bad.approval=true;
   assert.equal(await api.parseBodyReviewResponse(bad,entry.id),null,`${entry.id}: ${change}`);
  }
 }
});
