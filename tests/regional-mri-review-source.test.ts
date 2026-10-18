import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {randomUUID} from 'node:crypto';

const valid={revision:'a'.repeat(64),label:'Synthetic private MRI inspection',region:'knee'};
async function source(binding:unknown,development=true){
  const result=await build({entryPoints:['lib/regional-mri-review-source.ts'],absWorkingDir:process.cwd(),bundle:true,write:false,format:'esm',platform:'neutral',
    define:{'import.meta.env.DEV':String(development)},plugins:[{name:'synthetic-regional-binding',setup(b){
      b.onResolve({filter:/^virtual:visible-medicine-regional-review$/},()=>({path:'binding',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export default '+JSON.stringify(binding)+';'}));
    }}]});
  const module=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text+'\n//'+randomUUID()).toString('base64'));
  return {value:module.regionalMriReviewSource(),code:result.outputFiles[0].text};
}
test('valid local development binding is an immutable exact metadata projection',async()=>{
  const output=await source(valid);assert.deepEqual(output.value,valid);assert(Object.isFrozen(output.value));
});
test('production helper cannot enable a supplied local binding',async()=>{
  assert.equal((await source(valid,false)).value,null);
});
test('missing or malformed metadata remains locked',async()=>{
  for(const v of [null,undefined,false,[],{},'a'.repeat(64),{...valid,revision:'0'},{...valid,revision:'A'.repeat(64)},
    {...valid,label:' '},{...valid,label:'\nprivate'},{...valid,label:'x'.repeat(161)},{...valid,region:'unknown'},
    {...valid,sourcePath:'private-path'},{...valid,approved:true}]){
    assert.equal((await source(v??null)).value,null,JSON.stringify(v));
  }
});
test('query or self-pinned folder details are not accepted as source metadata',async()=>{
  assert.equal((await source({revision:valid.revision,label:valid.label,region:'knee',manifest:{revision:valid.revision}})).value,null);
});
