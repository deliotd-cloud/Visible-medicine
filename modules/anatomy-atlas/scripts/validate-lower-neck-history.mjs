import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';
import {preLowerNeckProfiles,beforeLowerNeckStudy} from './lower-neck-study-history.mjs';
const compiled=await build({stdin:{contents:"export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const before=preLowerNeckProfiles(api.dissectionProfiles);assert.equal(preLowerNeckProfiles(before),before);
assert.deepEqual(beforeLowerNeckStudy(api).dissectionProfiles,before);
let rejected=0;
for(const region of ['head-neck','whole-body']){
 const missing=structuredClone(api.dissectionProfiles);missing[region].focuses=missing[region].focuses.filter(f=>f.id!=='lower-neck-vessels-scalenes');
 assert.throws(()=>preLowerNeckProfiles(missing));rejected++;
 const changed=structuredClone(api.dissectionProfiles);changed[region].focuses.find(f=>f.id==='lower-neck-vessels-scalenes').description+=' altered';
 assert.throws(()=>preLowerNeckProfiles(changed));rejected++;
}
const foreign=structuredClone(api.dissectionProfiles);foreign.hand.focuses[0].title+=' altered';assert.throws(()=>preLowerNeckProfiles(foreign));rejected++;
console.log(JSON.stringify({exactHistory:true,idempotent:true,mixedOrForeignHistoryRejected:rejected}));
