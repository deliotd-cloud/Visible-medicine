import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';

const [sourceFile,sourceSha,dir,mode,rootSpec]=process.argv.slice(2);
assert(sourceFile&&/^[a-f0-9]{64}$/.test(sourceSha)&&dir?.startsWith('F:/VisibleMedicine/staging/'));
const source=json(sourceFile),site=source.website;
const roots=rootSpec?json(rootSpec):[['completion-checklist.test.mjs',null],['completion-checklist-local-import.test.mjs',null],['completion-checklist-current-transition.test.mjs',null]];
function verify(){
  assert.equal(hash(sourceFile),sourceSha);
  for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
  for(const dep of source.dependencies){assert.equal(hash(dep.file),dep.sha256);assert.equal(hash(dep.entry),dep.entrySha256);}
}
if(mode==='child'){
  verify();
  const {assertCompleteOriginal}=await import(pathToFileURL(site+'/tests/deepbrain-foot-roles.mjs'));
  const rows=[];
  for(const [root,expected] of roots){
    const prefix=dir+'/'+root;
    const run=spawnSync(process.execPath,['--max-old-space-size=1536','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/'+root],{cwd:site,windowsHide:true,shell:false,maxBuffer:32e6,encoding:'utf8',env:process.env});
    fs.writeFileSync(prefix+'.tap',run.stdout??'',{flag:'wx'});
    fs.writeFileSync(prefix+'.stderr.log',run.stderr??'',{flag:'wx'});
    let counts=null,error=null;const actual=[...(run.stdout??'').matchAll(/^# tests (\d+)\r?$/gm)];assert.equal(actual.length,1);const required=expected??Number(actual[0][1]);assert(required>0);
    try{counts=assertCompleteOriginal({code:run.status,signal:run.signal,...(run.error?{error:String(run.error)}:{})},run.stdout,required);}catch(e){error=String(e);}
    const observed={};
    for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
      const matches=[...(run.stdout??'').matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
      if(matches.length===1)observed[key]=+matches[0][1];
    }
    rows.push({root:'tests/'+root,rootSha256:hash(site+'/tests/'+root),expected,code:run.status,signal:run.signal,counts,observed,error,passing:error===null,failedPoints:[...(run.stdout??'').matchAll(/^not ok .+$/gm)].map(m=>m[0]),evidence:prefix});
    console.log(JSON.stringify(rows.at(-1)));
  }
  verify();
  fs.writeFileSync(dir+'/ROOT_RESULTS.json',JSON.stringify({at:new Date().toISOString(),rows,passing:rows.every(r=>r.passing),allWholeRootsUnfiltered:true},null,2)+'\n',{flag:'wx'});
  process.exitCode=rows.every(r=>r.passing)?0:1;
}else{
  verify();assert(!fs.existsSync(dir));
  const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);
  i.activeWork.current.activeExecutionSessions=[{kind:'navigation-regression-whole-roots',driverPid:process.pid,evidence:dir,sourceSha256:sourceSha}];
  fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
  try{
    global.gc();
    const run=await guarded({site,dir,command:'--max-old-space-size=256 '+process.argv[1].replaceAll('\\','/')+' '+sourceFile+' '+sourceSha+' '+dir+' child'+(rootSpec?' '+rootSpec:''),heap:1536,aggregate:3072,minimum:5120,extraEnv:{VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_WEBSITE_ROOT:site}});
    verify();
    const raw=fs.existsSync(dir+'/ROOT_RESULTS.json')?json(dir+'/ROOT_RESULTS.json'):null;
    const result={at:new Date().toISOString(),source:{path:sourceFile,sha256:sourceSha},run,passing:run.passing&&raw?.passing===true,rows:raw?.rows,expectedWholeCases:raw?.rows.reduce((n,r)=>n+(r.counts?.tests??r.observed?.tests??0),0),allSourceAndDependencyBytesUnchanged:true,ownerPreviewChanged:false,fullStockSuitePassing:false,realSignedInOrBackendAcceptance:false};
    fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing:result.passing,rows:result.rows}));
    process.exitCode=result.passing?0:1;
  }finally{
    const now=json('CURRENT_CHECKPOINT.json');now.activeWork.current.activeExecutionSessions=[];
    fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(now,null,2)+'\n');
  }
}
