import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('shoulder guided learning reaches learner and review with exact source identity', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const base='public/atlas-runtime/shoulder/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(review.revision,'03da432b035d1dca7cc9f3344ee2722af627d859');
  assert.equal(learner.sourceCommit,'03da432b035d1dca7cc9f3344ee2722af627d859');
  for(const path of ['lib/shoulder-tours.ts','lib/tour-camera.ts','app/shoulder-tour-player.tsx','app/fitted-camera.tsx']) {
    const entry=review.files.find((f:any)=>f.path===path);
    assert.ok(entry,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,entry.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),entry.importedSha256,path);
  }
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
  const result=await build({stdin:{contents:"export { shoulderTour, shoulderTourStepView } from './atlas-review/lib/shoulder-tours';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const {shoulderTour,shoulderTourStepView}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  assert.equal(shoulderTour.status,'draft');
  assert.equal(shoulderTour.steps.length,5);
  for(const [index,step] of shoulderTour.steps.entries()){
    const view=shoulderTourStepView(index);
    assert.equal(view.selectedId,step.selectedId);
    assert.equal(view.revision,shoulderTour.sourceRevision);
    assert.ok(step.caption.length>60);assert.ok(step.references.length>0);
  }
  const host=readFileSync('atlas-review/app/shoulder-explorer.tsx','utf8');
  assert.ok(host.includes('transitionMs={tourActive && !reducedMotion ? 1800 : 0}'));
  const dashboard=readFileSync('atlas-review/app/review/review-dashboard.tsx','utf8');
  assert.ok(dashboard.includes('shoulderTour.steps.map'));
  assert.ok(readFileSync('atlas-review/lib/review-workspace.ts','utf8').includes('shoulder-review-2-guided'));
  const bundle=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const text of ['Guided learning','Shoulder surface tour','Exit tour'])assert.ok(bundle.includes(text),text);
});
