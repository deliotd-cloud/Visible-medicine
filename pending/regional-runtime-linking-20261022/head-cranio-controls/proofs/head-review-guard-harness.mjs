import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Pure byte evidence only: do not import website, TypeScript, guard or test modules.
const stage=dirname(fileURLToPath(import.meta.url));
const frozen='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={
 'head-cerebellar-review.test.ts':['e296846aea3e46e42c373d01ae3934c06adae223e7789f413b0b494ca8ffbdc8','7b9e809990724a602c2adceba0f4eea0a2c6d5601af2a3b69e8bb55fb8fc3d71'],
 'head-deep-grey-review.test.ts':['bcf97aa6433919540e40960b65f4f7e069fb2cbb5a0573195c092e55d78e8915','073ca72872b56f38f0acbce4b23f91253b2de422fb1538d984525073c24af8d0'],
 'head-hippocampal-clinical.test.ts':['3866730ce1998d887379736e2ff5a922b89bbcbf59b770300e6dac7958d39f15','16e89c02fe367c8066e087781d51ed7335ce66e2888faa61b228c0af50407df5'],
 'head-lobar-review.test.ts':['478aa7bd74b9dabafc358b160002fe6fecf134954cd83243520977553f4fceb3','abd52938aabb0e1e3853163f36562366709ff1a4f1be7fc06cc3497917e715b1'],
 'head-ventricular-review.test.ts':['a9ae1ea7a1770cf5c8a1a4fb3393f5bd3a1cb5d76412b59fab995eb218e54bec','7135359a56e5b3e67f0a6753925cead4851e1a3e15eff8e3681e1e2f46b06d9f'],
};
const importLine="import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';\n";
const loaderPrior='const load=(id:string)=>';
const loaderCurrent="const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:";
function uniqueSwap(source,current,prior){
 assert.equal(source.split(current).length,2,`exactly one inverse seam: ${current}`);
 return source.replace(current,prior);
}
function inverse(bytes){
 let source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 source=uniqueSwap(source,importLine,'');
 source=uniqueSwap(source,loaderCurrent,loaderPrior);
 return Buffer.from(source);
}
const component=readFileSync(join(frozen,'components','HeadTeachingReviewNotes.tsx'),'utf8');
assert.equal(component.split("import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';").length,2,'real production guard import');
const guard=readFileSync(join(frozen,'lib','clinical-review-navigation-guard.ts'),'utf8');
assert.match(guard,/export function registerClinicalReviewNavigationGuard\(/,'real guard module present');
const precedent=readFileSync(join(frozen,'tests','head-teaching-review-notes.test.ts'),'utf8');
assert.equal(precedent.split(importLine.trimEnd()).length,2,'approved real-helper import precedent');
assert.equal(precedent.split(loaderCurrent).length,2,'approved emitted require-ID precedent');
for(const [name,[rawSha,codeSha]] of Object.entries(files)){
 const raw=readFileSync(join(stage,'RAW','tests',name));
 const code=readFileSync(join(stage,'CODE','tests',name));
 assert.equal(sha(raw),rawSha,`${name}: complete preimage hash`);
 assert.equal(sha(code),codeSha,`${name}: immutable CODE hash`);
 assert.deepEqual(raw,readFileSync(join(frozen,'tests',name)),`${name}: frozen input`);
 assert.deepEqual(raw,readFileSync(join(candidate,'tests',name)),`${name}: current candidate input`);
 assert.deepEqual(inverse(code),raw,`${name}: whole original source restored`);
 assert.notDeepEqual(inverse(Buffer.concat([code,Buffer.from('\n// append mutant\n')])),raw,`${name}: append mutant refused`);
 const source=code.toString('utf8');
 assert.throws(()=>inverse(Buffer.from(source.replace(loaderCurrent,"const load=(id:string)=>id==='../lib/altered-guard'?navigationGuard:"))),/exactly one inverse seam/,`${name}: substituted require-ID refused`);
 assert.throws(()=>inverse(Buffer.from(source.replace(importLine,importLine+importLine))),/exactly one inverse seam/,`${name}: duplicate helper import refused`);
 assert.notDeepEqual(code,Buffer.concat([raw,Buffer.from('\n')]));
 console.log(`${name} RAW=${rawSha} CODE=${codeSha} inverse+mutants=PASS`);
}
console.log('SOURCE-ONLY five real-guard harness inverses PASS; native tests and validator not run.');
