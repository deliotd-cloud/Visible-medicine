import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,createWriteStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const results=[];
for(const before of [true,false]){
 const name=before?'before':'after',log=stage+name+'.tap';
 const stream=createWriteStream(log,{flags:'wx'});
 const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};delete env.VM_HEAD_IMPORT_FOCUS_BEFORE;
 if(before)env.VM_HEAD_IMPORT_FOCUS_BEFORE='1';
 const child=spawn(process.execPath,['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap','tests/head-import-focus.test.mjs'],{cwd:stage,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 const terminal=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await new Promise(resolve=>stream.end(resolve));
 const bytes=readFileSync(log),text=bytes.toString(),counts={};for(const field of ['tests','pass','fail','cancelled','skipped','todo']){const match=text.match(new RegExp('^# '+field+' (\\d+)$','m'));assert(match,'Missing native count: '+field);counts[field]=Number(match[1]);}
 results.push({name,...terminal,counts,log,logSha256:sha(bytes)});
 assert.equal(terminal.signal,null);assert.equal(terminal.code,before?1:0);assert.equal(counts.tests,8);assert.equal(counts.cancelled,0);assert.equal(counts.skipped,0);assert.equal(counts.fail,before?2:0);
}
writeFileSync(stage+'NATIVE_RESULT.json',JSON.stringify({schema:'vm-head-import-focus-native/1',results,originalAssertionsPreserved:true,syntheticDomOnly:true,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results));
