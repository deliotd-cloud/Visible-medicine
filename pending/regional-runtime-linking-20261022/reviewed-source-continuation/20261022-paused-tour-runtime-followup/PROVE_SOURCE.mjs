import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-paused-tour-runtime-followup';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const atlas='F:/VisibleMedicine/atlas';
const relative='tests/atlas-paused-tour-imaging-checks.mjs';
const raw=readFileSync(join(stage,'RAW',relative));
const code=readFileSync(join(stage,'CODE',relative));
const candidate=readFileSync(join(website,relative));
const importer=readFileSync(join(website,'tests/atlas-paused-tour-imaging.test.ts'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawSha='cf877a8edb29119f3b9d382ceb50f51ea9d748586b77d2dd0eefa4f7ae3f0e97';
const codeSha='31a271ce64e1460e701d25a5cf6cd633bf58676a20f9be6c44855903da244020';
assert.equal(sha(raw),rawSha);assert.deepEqual(candidate,raw,'V5 helper is still the exact preimage');
assert.equal(sha(code),codeSha);
assert.equal(importer.toString('utf8'),"// Exact imported source delivery and the production root Education handoff.\nimport './atlas-paused-tour-imaging-checks.mjs';\n",'unchanged importer');
const source=code.toString('utf8'),before=raw.toString('utf8');
const begin="\r\ntest('current paused-tour source closes separately over Review/head and the three earlier runtimes',()=>{\r\n";
const end='async function productionApi(){';
assert.equal(source.split(begin).length,2,'one exact new theorem');
const start=source.indexOf(begin),stop=source.indexOf(end,start);
assert(start>=0&&stop>start,'new theorem is bounded before original API');
const inserted=source.slice(start,stop);
assert.equal(source.slice(0,start)+source.slice(stop),before,'full CODE-to-RAW inverse restores every original byte and assertion');
assert.equal((before.match(/\btest\(/g)||[]).length+1,(source.match(/\btest\(/g)||[]).length,'only one test added');
for(const mutated of [source.replace('190a63238eadcf906abe89dcbb6a67c88afe70b9','0'.repeat(40)),source.replace('assert.notEqual(earlierRuntime,pin.source','assert.equal(earlierRuntime,pin.source'),source.replace('swapped.runtimeSources.shoulder=pin.source','swapped.runtimeSources.shoulder=earlierRuntime')]){
 assert.notEqual(mutated,source);
 assert.notEqual(sha(Buffer.from(mutated)),codeSha,'source mutation refused by exact CODE hash');
 assert.notEqual(mutated.slice(start,stop),inserted,'source mutation refused by exact declared hunk');
}
const pin=JSON.parse(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json')));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources['head-neck'],pin.source);
const earlier='190a63238eadcf906abe89dcbb6a67c88afe70b9';
for(const name of ['shoulder','female-pelvis','lower-limb'])assert.equal(pin.runtimeSources[name],earlier);
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),pin.source);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),pin.sourceTree);
assert.equal(git('status','--porcelain').toString().trim(),'');
for(const revision of [pin.source,earlier])assert.equal(git('rev-parse',`${revision}^{commit}`).toString().trim(),revision);
const inputs=['lib/paused-tour-imaging.ts','app/paused-tour-imaging-link.tsx','app/body-education-link.ts','app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx'];
const review=JSON.parse(readFileSync(join(website,'atlas-review/manifest.json')));
assert.equal(review.revision,pin.source);
for(const path of inputs){
 const bytes=git('show',`${pin.source}:${path}`);
 assert.deepEqual(readFileSync(join(atlas,path)),bytes,`checkout ${path}`);
 const row=review.files.find(x=>x.path===path);assert(row);
 assert.equal(row.sourceSha256,sha(bytes),`Review source ${path}`);
 assert.equal(row.importedSha256,sha(readFileSync(join(website,'atlas-review',path))),`Review imported ${path}`);
}
const closure=[];
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const runtime=pin.runtimeSources[name],base=`public/atlas-runtime/${name}/`;
 const manifest=JSON.parse(readFileSync(join(website,base,'manifest.json')));
 assert.equal(manifest.sourceCommit,runtime);
 const rows=JSON.parse(readFileSync(join(website,base,'source-inputs.json')));
 let checked=0;
 for(const row of rows){
  assert.equal(row.sha256,sha(git('show',`${runtime}:${row.path}`)),`${name}:${row.path}`);checked++;
 }
 if(name==='head-neck')for(const path of inputs)assert(rows.some(x=>x.path===path));
 closure.push({name,sourceCommit:runtime,checkedSourceInputRows:checked});
}
const output={at:new Date().toISOString(),sourceReceiptSha256:'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f',rawPath:join(stage,'RAW',relative),rawSha256:rawSha,codePath:join(stage,'CODE',relative),codeSha256:codeSha,importerUnchanged:true,exactFullInverse:true,originalTestCount:(before.match(/\btest\(/g)||[]).length,proposedTestCount:(source.match(/\btest\(/g)||[]).length,mutationRefusals:3,currentCheckout:{commit:pin.source,tree:pin.sourceTree,clean:true},reviewImportedRelevantInputs:inputs.length,runtimeClosure:closure,limits:['Pure source/Git proof only: no native test, esbuild, typecheck, build or browser run','Main must review and run affected original roots after current heavy job terminal','No candidate, canonical, pin, validator, medical, approval or preview change']};
writeFileSync(join(stage,'SOURCE_PROOF.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({rawSha,codeSha,closure,originalTests:output.originalTestCount,proposedTests:output.proposedTestCount}));
