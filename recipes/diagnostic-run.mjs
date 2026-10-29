import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {prepareHistoricalEnvironment} from 'file:///F:/VisibleMedicine/staging/20261030-head-tour-speed-release/historical-environment.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-lecture-regression';
const sourcePath='G:/VisibleMedicine-temp/staging/20261029-foot-selection-followup/SOURCE_CANDIDATE.json';
const sourceSha256='ac038232b0b4cf2cb0d2963d791fcd3ca287c6b1c85ba821637a7284cbb27961';
const source=json(sourcePath),site=source.website;
const ref=p=>({path:p,sha256:hash(p)}),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
function verify(){
  assert.equal(hash(sourcePath),sourceSha256);
  for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  for(const r of source.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}
}
verify();
const planPath='F:/VisibleMedicine/staging/20261027-context-runner-v4-proposal/plan-03/plan.json';
const original=json(planPath).batches.find(r=>r.index===51);assert.equal(original.context,'current');assert.equal(original.roots.length,20);
const roots=[...original.roots];for(const p of roots)assert(source.sourceRows.some(r=>r.path===p),p);
assert.equal(roots.filter(p=>p.startsWith('tests/lecture-')).length,16);
write(root+'/TEST_SCOPE.json',{at:new Date().toISOString(),source:ref(sourcePath),originalPlan:ref(planPath),originalPartition:51,roots,allOriginal20RootsRetained:true,description:'All original batch51 roots: lecture multi-anatomy, editing/preservation, PPTX/slides, tour navigation, limb role and live-learning access/loader boundaries. New run on current source, not a reuse of historical results.',wholeSuitePassing:false});
const environment=prepareHistoricalEnvironment(sourcePath,sourceSha256);write(root+'/HISTORICAL_ENVIRONMENT.json',environment);fs.mkdirSync(root+'/temp',{recursive:true});
const command='--max-old-space-size=512 --experimental-strip-types --test --test-concurrency=1 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=tap --test-reporter-destination='+root+'/batch/child.tap '+roots.join(' ');
const run=await guarded({site,dir:root+'/batch',command,heap:512,aggregate:2048,minimum:4096,extraEnv:{...environment.environment,TEMP:root+'/temp',TMP:root+'/temp'}});
verify();const result={at:new Date().toISOString(),source:ref(sourcePath),scope:ref(root+'/TEST_SCOPE.json'),roots:roots.length,run,passing:run.passing,sourceExactAfter:true,wholeSuitePassing:false,installed:false,normalPreviewChanged:false};write(root+'/RESULT.json',result);console.log(JSON.stringify(result));process.exitCode=result.passing?0:1;
