import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
for(const phase of process.argv.slice(2)){
 const args=/^types(?:-v\d+)?$/.test(phase)?['--max-old-space-size=128','check-pancreatic-us-website-types-20261024.mjs','--phase='+phase]:['--max-old-space-size=128','run-pancreatic-us-website-20261024.mjs',phase];
 const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});assert.equal(result.code,0,phase+':'+JSON.stringify(result));
}
