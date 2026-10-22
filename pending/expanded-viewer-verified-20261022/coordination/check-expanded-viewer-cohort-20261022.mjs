import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync,readFileSync,appendFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const website='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate/website';
const step='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate/expanded-cohort';
assert(!existsSync(step));mkdirSync(step);
const tests=[
 'tests/current-atlas-delivery.test.mjs','tests/expanded-review-delivery-admission.test.mjs',
 'tests/atlas-runtime-frame.test.mjs','tests/atlas-runtime-expansion.test.mjs',
 'tests/atlas-runtime-expansion-binding.test.mjs','tests/atlas-body-learning-component.test.mjs',
 'tests/body-learning-layout-history-preservation.test.mjs','tests/atlas-runtime-expansion-adoption-proof.test.mjs',
 'tests/structure-learning-ui.test.ts','tests/atlas-study-transport.test.ts',
 'tests/atlas-study-transport-migration.test.mjs','tests/live-learning-consumer-loader-preservation.test.mjs',
];
for(const path of tests)assert(existsSync(website+'/'+path),path);
const sha=b=>createHash('sha256').update(b).digest('hex');
const log=step+'/tests.log';writeFileSync(log,'',{flag:'wx'});
const args=['--test','--test-reporter=tap','--experimental-strip-types','--test-concurrency=1',...tests];
const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,env:{...process.env,VM_WEBSITE_ROOT:website,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>appendFileSync(log,b));
const start={at:new Date().toISOString(),pid:child.pid,website,tests,inputs:tests.map(path=>({path,sha256:sha(readFileSync(website+'/'+path))})),log};
writeFileSync(step+'/STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase:'expanded-viewer-native-cohort',pid:child.pid,roots:tests.length,log}));
const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:null,error:String(error)}));child.on('close',(code,signal)=>resolve({code,signal}));});
const output=readFileSync(log,'utf8');const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const match=output.match(new RegExp('^# '+key+' (\\d+)$','m'));counts[key]=match?Number(match[1]):null;}
const receipt={at:new Date().toISOString(),...result,counts,logSha256:sha(Buffer.from(output)),tests,sourceUnchanged:tests.every((path,i)=>sha(readFileSync(website+'/'+path))===start.inputs[i].sha256)};
writeFileSync(step+'/TERMINAL.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));process.exitCode=result.code??1;
