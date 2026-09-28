import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('guided imaging notes reach both learners and review without inventing scan access',async()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,'d3d3a750db64c6d10bad1632d68151c871cc8b96');
  for(const module of ['head-neck','shoulder']){
    const base=`public/atlas-runtime/${module}/`;
    const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
    assert.equal(learner.sourceCommit,review.revision);
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
  const result=await build({stdin:{contents:`
    export {structures} from './atlas-review/app/anatomy-data';
    export {shoulderTour} from './atlas-review/lib/shoulder-tours';
    export {regionalTours,regionalTourStructures} from './atlas-review/lib/regional-tours';
    export {bodyLesson} from './atlas-review/app/body-content';
    export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
    import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
    import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
    export const catalog=bodyDisplayCatalog(raw as any);
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
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
  assert.equal(checked,272);
  const notes=readFileSync('atlas-review/app/tour-imaging-notes.tsx','utf8');
  assert.ok(notes.includes('paid lectures require their own access'));
  assert.ok(notes.includes('if(event.currentTarget.open)onOpen()'));
  assert.ok(!/fetch\(|imagingBridge|postMessage|<img|<iframe/.test(notes));
  const reader=readFileSync('atlas-review/app/tour-imaging-notes.css','utf8');
  assert.ok(reader.includes('max-height:min(30vh,20rem)'));
  assert.ok(notes.includes('tabIndex={0}'));
});
