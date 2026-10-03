import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {build as savedBuild,preHepatobiliaryWebsiteEpoch} from './atlas-pre-hepatobiliary-history.ts';

async function teachingApi(historical=false){
  const result=await (historical?savedBuild:build)({stdin:{contents:`
    export {structures} from './atlas-review/app/anatomy-data';
    export {shoulderTour} from './atlas-review/lib/shoulder-tours';
    export {regionalTours,regionalTourStructures,circleWillisTour} from './atlas-review/lib/regional-tours';
    export {bodyLesson} from './atlas-review/app/body-content';
    export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
    import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
    import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
    export const catalog=bodyDisplayCatalog(raw as any);
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('guided imaging notes reach both learners and review without inventing scan access',async()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,'67dd759d40e0c775620964d90e85de659f15d6cf');
  for(const module of ['head-neck','shoulder']){
    const base=`public/atlas-runtime/${module}/`;
    const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
    assert.equal(learner.sourceCommit,'67dd759d40e0c775620964d90e85de659f15d6cf');
    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
    for(const path of ['app/tour-imaging-notes.tsx','app/tour-imaging-notes.css']){
      const f=review.files.find((f:any)=>f.path===path);assert.ok(f,path);
      assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,f.sourceSha256);
      assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),f.importedSha256);
    }
    const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
    for(const label of ['CT / MRI & imaging notes','No scan loaded or spatial alignment','Teaching notes only'])assert.ok(js.includes(label),module+': '+label);
    for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
  }
  // Keep the original 604/564 expectations at their immutable 146-stop epoch.
  // Runtime/source checks above remain live; current teaching is checked below.
  assert.equal(preHepatobiliaryWebsiteEpoch,'bee7d759305803ade07ecd26fc877099b7008ff1');
  const api=await teachingApi(true);
  let checked=0;
  for(const tour of api.regionalTours) for(const step of tour.steps){
    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);
    const packet=await api.bodyReviewMaterial(structure.id);
    assert.equal(packet.approval,false);
    for(const tab of ['ct','mri','xray','ultrasound']){
      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);
      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);
      checked++;
    }
  }
  for(const step of api.shoulderTour.steps){
    const structure=api.structures.find((s:any)=>s.id===step.selectedId);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(api.circleWillisTour.steps.length,10);
  assert.equal(checked,604); // 146 regional stops plus five shoulder stops, four modalities each.
  assert.equal(checked-api.circleWillisTour.steps.length*4,564,'Prior 136 regional/five shoulder stops retained');
  const notes=readFileSync('atlas-review/app/tour-imaging-notes.tsx','utf8');
  assert.ok(notes.includes('paid lectures require their own access'));
  assert.ok(notes.includes('if(event.currentTarget.open)onOpen()'));
  assert.ok(!/fetch\(|imagingBridge|postMessage|<img|<iframe/.test(notes));
  const reader=readFileSync('atlas-review/app/tour-imaging-notes.css','utf8');
  assert.ok(reader.includes('max-height:min(30vh,20rem)'));
  assert.ok(notes.includes('tabIndex={0}'));
});

test('current 177-stop guided imaging notes match unsigned learner/review teaching for every modality',async()=>{
  const api=await teachingApi();let checked=0,handChecks=0,venousChecks=0,handVenousChecks=0;
  const completedHandTours=api.regionalTours.filter((t:any)=>t.id!=='right-lower-limb-venous-orientation'&&!['right-hand-venous-orientation','left-hand-venous-orientation'].includes(t.id));
  assert.equal(completedHandTours.length,27);
  assert.equal(completedHandTours.reduce((n:number,t:any)=>n+t.steps.length,0),157);
  const earlierTours=completedHandTours.filter((t:any)=>t.id!=='right-hand-arterial-orientation');
  assert.equal(earlierTours.length,26);
  assert.equal(earlierTours.reduce((n:number,t:any)=>n+t.steps.length,0),150);
  assert.equal(api.regionalTours.length,30);
  assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),177);
  assert.equal(api.regionalTours.find((t:any)=>t.id==='hepatobiliary-surface-orientation')?.steps.length,4);
  for(const tour of api.regionalTours)for(const step of tour.steps){
    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);
    assert.ok(structure,tour.id+': '+step.selectedId);
    const packet=await api.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);
    for(const tab of ['ct','mri','xray','ultrasound']){
      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);
      assert.ok(topic,structure.id+': '+tab);
      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);
      checked++;
      if(tour.id==='right-hand-arterial-orientation')handChecks++;
      if(tour.id==='right-lower-limb-venous-orientation')venousChecks++;
      if(['right-hand-venous-orientation','left-hand-venous-orientation'].includes(tour.id))handVenousChecks++;
    }
  }
  for(const step of api.shoulderTour.steps){
    const structure=api.structures.find((s:any)=>s.id===step.selectedId);assert.ok(structure);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(handChecks,28);
  assert.equal(venousChecks,24);
  assert.equal(handVenousChecks,56);
  assert.equal(checked-handChecks-venousChecks-handVenousChecks,620); // Original150 regional plus five shoulder stops.
  assert.equal(checked-venousChecks-handVenousChecks,648); // Completed157 regional plus five shoulder stops.
  assert.equal(checked-handVenousChecks,672); // All 163 earlier regional plus five shoulder stops remain covered.
  assert.equal(checked,728); // Current177 regional plus five shoulder stops, four modalities.
  assert.equal(api.circleWillisTour.steps.length,10);
});
