import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const attempt=process.argv[2]??'website-build';
assert(['website-build','website-build-after-test-types'].includes(attempt));
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate',website=root+'/website',step=root+'/'+attempt;
assert(!existsSync(step));mkdirSync(step);
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=JSON.parse(readFileSync(root+'/CEREBRAL_ADMISSION.json'));
const paths=[...new Set([...source.sourceRows.map(row=>row.path),'tests/expanded-review-delivery-admission.test.mjs','tests/fixtures/expanded-review-admission/current-atlas-delivery.json.raw','tests/fixtures/expanded-review-admission/current-atlas-delivery.test.mjs.raw'])].sort();
const before=paths.map(path=>({path,sha256:sha(readFileSync(website+'/'+path))}));
writeFileSync(step+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),before},null,2)+'\n',{flag:'wx'});
const commands=[['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['build',['node_modules/vinext/dist/cli.js','build']]];
const results=[];
for(const [label,args]of commands){
 const log=step+'/'+label+'.log';writeFileSync(log,'',{flag:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
 for(const stream of[child.stdout,child.stderr])stream.on('data',b=>appendFileSync(log,b));
 writeFileSync(step+'/'+label+'-STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,command:['node',...args],log},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase:label+'-running',pid:child.pid,log}));
 const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:null,error:String(error)}));child.on('close',(code,signal)=>resolve({code,signal}));});
 const terminal={at:new Date().toISOString(),label,...result,log,logSha256:sha(readFileSync(log))};results.push(terminal);
 writeFileSync(step+'/'+label+'-TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(terminal));if(result.code!==0){process.exitCode=result.code??1;break;}
}
const changed=before.filter(row=>sha(readFileSync(website+'/'+row.path))!==row.sha256);
const final={at:new Date().toISOString(),results,changedInputs:changed,sourceUnchanged:changed.length===0,ownerPreviewChanged:false};
writeFileSync(step+'/RESULT.json',JSON.stringify(final,null,2)+'\n',{flag:'wx'});
assert.equal(changed.length,0,'Build changed a controlled source input; retain evidence and investigate');
