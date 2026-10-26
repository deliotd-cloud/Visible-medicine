import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';

const stage='F:/VisibleMedicine/staging/20261026-review-count-website',sourceFile=stage+'/SOURCE_CANDIDATE.json',source=json(sourceFile),sourceSha=hash(sourceFile),site=source.website;
const phase=process.argv[2];assert(['tests','types'].includes(phase));
const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));
const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);assert.equal(i.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
let command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='tests')command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 tests/clinical-review-integration.test.ts tests/atlas-glottic-muscle-imaging.test.ts';
else{
  assert(json(stage+'/checks/tests/RESULT.json').passing);
  const folder=stage+'/types';fs.mkdirSync(folder);
  fs.copyFileSync('F:/VisibleMedicine/staging/20261026-surface-recovery-website/types-1/checker.mjs',folder+'/checker.mjs',fs.constants.COPYFILE_EXCL);
  command='--max-old-space-size=3072 '+folder+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;
}
i.activeWork.current.activeExecutionSessions=[{kind:'review-count-'+phase,driverPid:process.pid,evidence:dir,sourceSha256:sourceSha}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
process.once('exit',code=>{if(code!==75||fs.existsSync(dir))return;const j=json('CURRENT_CHECKPOINT.json');if(j.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');}});
try{
  global.gc();const run=await (phase==='types'?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
  assert.equal(hash(sourceFile),sourceSha);for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
  const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');
  const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
  const typeFile=stage+'/types/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(typeFile)?json(typeFile):null;
  const passing=run.passing&&(phase==='tests'?counts.tests===5&&counts.pass===5&&counts.fail+counts.skipped+counts.todo+counts.cancelled===0:types?.diagnosticCount===0&&types.fullProjectTypes);
  const result={at:new Date().toISOString(),source:{path:sourceFile,sha256:sourceSha},phase,run,counts,types:types?{path:typeFile,sha256:hash(typeFile),roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null,passing,allSealedSourceAndDependenciesStillExact:true,wholeStockSuitePassing:false,normalPreviewChanged:false,realAccountAcceptance:false};
  fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing,counts,types:result.types}));process.exitCode=passing?0:1;
}finally{
  const j=json('CURRENT_CHECKPOINT.json');assert.equal(j.activeWork.current.activeExecutionSessions[0]?.driverPid,process.pid);j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');
}
