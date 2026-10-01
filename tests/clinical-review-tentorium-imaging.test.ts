import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('partial tentorium CT/MRI drafts have exact learner/review identity and fail closed on changed evidence', async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const review=json('atlas-review/manifest.json'),runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,'f636891cdcee10aeca20ae684cb04c183fa7600e');
 assert.equal(runtime.sourceCommit,review.revision);
 for(const path of ['app/body-content.ts','content/tentorium-imaging.ts','content/tentorium-imaging-pins.json','lib/tentorium-imaging.ts']){
  const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
  assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,entry.sourceSha256,path);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),entry.importedSha256,path);
 }
 const priorPins=JSON.parse(execFileSync('git',['show','8f041073:atlas-review/content/body-review-display-pins.json'],{encoding:'utf8',maxBuffer:4e6}));
 const pins=json('atlas-review/content/body-review-display-pins.json');
 const tentoriumPins=JSON.parse(execFileSync('git',['show','3316fb7a:atlas-review/content/body-review-display-pins.json'],{encoding:'utf8',maxBuffer:4e6}));
 assert.equal(pins.pins.length,1104);assert.equal(priorPins.pins.length,1104);
 const id='vm:anatomy:body:head-neck:right:connective:tentorium-source-portion';
 // Preserve the exact historical tentorium delta; the later tarsal tour has its own seven-pin regression.
 assert.deepEqual(tentoriumPins.pins.filter((p:any,i:number)=>JSON.stringify(p)!==JSON.stringify(priorPins.pins[i])).map((p:any)=>p.structureId),[id]);
 assert.deepEqual(pins.pins.find((p:any)=>p.structureId===id),tentoriumPins.pins.find((p:any)=>p.structureId===id));
 for(const region of ['head-neck','whole-body'])assert(runtime.regionalScopes.find((s:any)=>s.region===region).regionalIds.includes(id));
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/tentorium-imaging';export * from './atlas-review/content/tentorium-imaging';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const packet=await api.bodyReviewMaterial(id);assert(packet);assert.equal(packet.approval,false);
 const structure=packet.source.structure;
 assert.equal(structure.fmaId,'FMA83966');assert.equal(structure.bundle,'tentorium-partial');assert.equal(structure.laterality,'right');
 assert.match(structure.coverageNote,/Incomplete right-sided/);
 for(const tab of ['ct','mri']){
  const lesson=api.tentoriumImagingLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);
  assert.deepEqual(topic,{tab,...lesson});assert.equal(topic.readiness,'draft');
  assert.equal(topic.body,api.tentoriumImagingTopics[tab].body);
  assert.deepEqual(topic.citations,[api.tentoriumImagingReferences.anatomy,api.tentoriumImagingReferences.anatomyLicense,api.tentoriumImagingReferences[tab]]);
  assert.match(topic.note,/CC BY 3\.0; no endorsement/);assert.match(topic.note,/No mirrored counterpart or patient registration/);
  assert.match(topic.note,/Atlas, imaging-case and paid-lecture access remain independent/);
  for(const [field,value]of [['laterality','left'],['bundle','brain'],['fmaId','FMA1'],['id',id+'-foreign']])assert.equal(api.tentoriumImagingLesson({...structure,[field]:value},tab),undefined);
  const altered=structuredClone(packet);altered.topics.find((t:any)=>t.tab===tab).body+=' altered';
  assert.equal(await api.parseBodyReviewResponse(altered,id),null);
 }
 for(const tab of ['xray','ultrasound'])assert.equal(packet.topics.find((t:any)=>t.tab===tab).readiness,'pending');
 assert.deepEqual(await api.parseBodyReviewResponse(JSON.parse(JSON.stringify(packet)),id),JSON.parse(JSON.stringify(packet)));
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(runtime[flag],false);
 const priorInventory=JSON.parse(execFileSync('git',['show','8f041073:lib/atlas-model-inventory.json'],{encoding:'utf8',maxBuffer:4e6}));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,priorInventory.models);
});
