import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const [label,...numbers]=process.argv.slice(2);assert(/^[a-z0-9-]+$/.test(label??''));
const lanes=numbers.map(Number);assert(lanes.length>0&&new Set(lanes).size===lanes.length&&lanes.every(n=>Number.isInteger(n)&&n>=1&&n<=9));
const base='F:/VisibleMedicine/staging/20261026-nine-root-epoch-runner-v6-proposal',runner=base+'/nine-root-epoch-runner.mjs',runnerSha='39b6caa5208c8c3379c1f82daf146a47263c31b5f699487f69e51de0219d11d2';
const config=json(base+'/CONTEXTS.json'),dir='F:/VisibleMedicine/staging/20261026-nine-root-'+label;
assert.equal(hash(runner),runnerSha);assert.equal(hash(base+'/CONTEXTS.json'),'c8b714e06bbe67f14677732d2dcbc625154150f7af7f24168ba92a0f1aa21489');assert(!fs.existsSync(dir));
const sourceFile='F:/VisibleMedicine/staging/20261026-title-tour-website/SOURCE_CANDIDATE_V3.json',source=json(sourceFile);
function verify(){assert.equal(hash(runner),runnerSha);assert.equal(hash(sourceFile),'01264592ba332c3ad0f124c5ee9f1f517a231b4a927dda2a8f7e831da5f7c51d');for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);}
const code=fs.readFileSync(runner,'utf8'),start=code.indexOf('const env={'),end=code.indexOf('function counts(',start);assert(start>0&&end>start);const roleEnv=Function('h',code.slice(start,end)+'return env;')(config.historical);
verify();const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);fs.mkdirSync(dir);
const save=(name,value)=>fs.writeFileSync(dir+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
index.activeWork.current.activeExecutionSessions=[{kind:'authentic-whole-source-epoch-roots',driverPid:process.pid,evidence:dir,lanes,phase:'Whole declared roots only; earlier failed attempts retained; no complete-suite/currenta01 claim'}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
save('STARTED.json',{at:new Date().toISOString(),pid:process.pid,runner,runnerSha256:runnerSha,lanes,stopOnFirstFailure:true});
const results=[];
try{
 for(const number of lanes){
  const i=number-1,lane=config.lanes[i],site=config[lane.site],evidence=dir+'/'+String(number).padStart(2,'0')+'-'+lane.root.replace('.test.mjs','');global.gc();
  console.log(JSON.stringify({lane:number,root:lane.root,site:lane.site,started:true}));
  const run=await guarded({site:site.website,dir:evidence,command:runner+' '+evidence+' child '+i,heap:768,aggregate:2048,minimum:4096,extraEnv:{...roleEnv,...(lane.site==='current'?{VM_CURRENT_SOURCE_RECEIPT:config.current.receipt,VM_CURRENT_SOURCE_SHA256:config.current.sha256}:{}),VM_NINE_ROOT_RUNNER_SHA:runnerSha,VM_ATLAS_SOURCE_REPO:site.native,ATLAS_SOURCE_REPO:site.native,VM_WEBSITE_ROOT:site.website}});
  verify();const root=fs.existsSync(evidence+'/ROOT_RESULT.json')?json(evidence+'/ROOT_RESULT.json'):null;const result={lane:number,site:lane.site,root:lane.root,run,rootResult:root,passing:run.passing&&root?.passing===true};save('lane-'+number+'.json',result);results.push(result);
  console.log(JSON.stringify({lane:number,passing:result.passing,observed:root?.observed}));if(!result.passing)break;
 }
 const passing=results.length===lanes.length&&results.every(r=>r.passing);
 const result={at:new Date().toISOString(),passing,plannedLanes:lanes,attempted:results.length,results:results.map(r=>({lane:r.lane,site:r.site,root:r.root,passing:r.passing,counts:r.rootResult?.observed})),priorFailuresRetained:true,wholeNineRootsPassing:false,wholeStockSuitePassing:false,currentA01Coverage:false,primarySourceUnchanged:true,ownerPreviewChanged:false,clinicalApproval:false};
 save('RESULT.json',result);console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing}));process.exitCode=passing?0:1;
}finally{const current=json('CURRENT_CHECKPOINT.json');current.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(current,null,2)+'\n');}
