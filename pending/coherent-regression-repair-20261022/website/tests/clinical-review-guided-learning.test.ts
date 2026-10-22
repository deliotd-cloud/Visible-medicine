import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import ts from 'typescript';
import {GUIDED_PLAYBACK_RATES,guidedSweepDuration} from '../atlas-review/lib/guided-playback.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

test('shoulder guided learning reaches learner and review with exact source identity', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const base='public/atlas-runtime/shoulder/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const deliveryPin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
  const committed=(revision:string,path:string)=>execFileSync('git',
    ['--no-replace-objects','-C',sourceRoot,'show',`${revision}:${path}`],
    {windowsHide:true,maxBuffer:32e6});
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  assert.equal(review.revision,deliveryPin.source,'Review stays bound to current source');
  assert.equal(learner.sourceCommit,deliveryPin.runtimeSources.shoulder);
  for(const path of ['lib/shoulder-tours.ts','lib/tour-camera.ts','app/shoulder-tour-player.tsx','app/fitted-camera.tsx','lib/guided-playback.ts']) {
    const entry=review.files.find((f:any)=>f.path===path);
    assert.ok(entry,path);
    assert.equal(entry.sourceSha256,createHash('sha256').update(committed(deliveryPin.source,path)).digest('hex'),
      `${path}: current Review Git source`);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,
      createHash('sha256').update(committed(deliveryPin.runtimeSources.shoulder,path)).digest('hex'),
      `${path}: exact shoulder family Git source`);
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
  const ast=ts.createSourceFile('shoulder-explorer.tsx',host,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const transitions:ts.Expression[]=[];
  const visit=(node:ts.Node)=>{
    if(ts.isJsxAttribute(node)&&node.name.getText(ast)==='transitionMs'){
      assert(node.initializer&&ts.isJsxExpression(node.initializer)&&node.initializer.expression);
      transitions.push(node.initializer.expression);
    }
    ts.forEachChild(node,visit);
  };
  visit(ast);
  assert.equal(transitions.length,1,'One actual shoulder camera transition');
  const evaluate=new Function('tourActive','reducedMotion','tourContinuous','tourRate','guidedSweepDuration',
    `return (${transitions[0].getText(ast)});`) as (active:boolean,reduced:boolean,continuous:boolean,rate:number,sweep:typeof guidedSweepDuration)=>number;
  for(const rate of GUIDED_PLAYBACK_RATES){
    assert.equal(evaluate(true,false,true,rate,guidedSweepDuration),guidedSweepDuration(rate),`continuous ${rate}x`);
    assert.equal(evaluate(true,false,false,rate,guidedSweepDuration),1800,`manual ${rate}x`);
    for(const continuous of [false,true]){
      assert.equal(evaluate(false,false,continuous,rate,guidedSweepDuration),0,`inactive ${rate}x`);
      assert.equal(evaluate(true,true,continuous,rate,guidedSweepDuration),0,`reduced motion ${rate}x`);
      assert.equal(evaluate(false,true,continuous,rate,guidedSweepDuration),0,`inactive reduced motion ${rate}x`);
    }
  }
  const dashboard=readFileSync('atlas-review/app/review/review-dashboard.tsx','utf8');
  assert.ok(dashboard.includes('shoulderTour.steps.map'));
  assert.ok(readFileSync('atlas-review/lib/review-workspace.ts','utf8').includes('shoulder-review-2-guided'));
  const bundle=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const text of ['Guided learning','Shoulder surface tour','Exit tour'])assert.ok(bundle.includes(text),text);
});
