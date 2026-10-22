import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const prior='F:/VisibleMedicine/staging/20261022-teaching-question-family-admission';
const names=[
 'clinical-review-nested-duct-xray.test.ts',
 'clinical-review-pharyngeal-muscle-teaching.test.ts',
 'clinical-review-pelvic-tributary-xray.test.ts',
 'clinical-review-thigh-avulsion-xray.test.ts',
 'clinical-review-reasoning.test.ts',
 'clinical-question-role-preservation-20261021.test.mjs',
];
const changed=new Set([names[0],names[2],names[3]]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const swap=(source,current,priorText)=>{
 assert.equal(source.split(current).length,2,`unique V2 inverse seam: ${current.slice(0,80)}`);
 return source.replace(current,priorText);
};
function inverse(name,bytes){
 let source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(!changed.has(name))return bytes;
 source=swap(source,' const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n','');
 source=swap(source,'manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,validateCurrentAtlasDelivery().runtimeSources[name],name');
 if(name!==names[0]){
  source=swap(source,'input?.sha256,sha(committed(runtimeSources[name],path))','input?.sha256,sha(committed(validateCurrentAtlasDelivery().runtimeSources[name],path))');
  source=swap(source,'input.sha256,sha(committed(runtimeSources[name],input.path))','input.sha256,sha(committed(validateCurrentAtlasDelivery().runtimeSources[name],input.path))');
 }
 return Buffer.from(source);
}
const expectedPrior={
 [names[0]]:'2e421c57d0fd2bd44e28c85e8ef523fbc3cfb8862de34de5fe4fe7983e92e5cb',
 [names[1]]:'1c110a0ce29251f1336c1d93edb0676784f5cfa157796f02374b8b4916da3102',
 [names[2]]:'3f2e68df8039aea6da4490bbca623e1379f637a4307cd2f8de528b65662bb15f',
 [names[3]]:'364d9cc7d00e83f86f577192843cda07d08474fbbcf762cabc18399697323207',
 [names[4]]:'36a5c8cc982e41db700cd9d805ac175c3375f0af61bee4fd14f31de9c255a958',
 [names[5]]:'311b3c9e87f5ffa069330dafe1c41fc07fed5ca144974655e97ed34814c61392',
};
for(const name of names){
 const code=readFileSync(join(stage,'proposal','tests',name));
 const v1=readFileSync(join(stage,'v1','tests',name));
 const original=readFileSync(join(stage,'original','tests',name));
 assert.equal(sha(v1),expectedPrior[name],`${name}: authenticated V1 candidate`);
 assert.deepEqual(v1,readFileSync(join(prior,'proposal','tests',name)),`${name}: full V1 preimage`);
 assert.deepEqual(original,readFileSync(join(prior,'original','tests',name)),`${name}: full frozen/selected preimage`);
 assert.deepEqual(inverse(name,code),v1,`${name}: V2 reconstructs complete V1`);
 if(changed.has(name)){
  const source=code.toString('utf8');
  assert.equal(source.split('validateCurrentAtlasDelivery()').length,2,`${name}: exactly one strict validation`);
  assert.equal(source.split('runtimeSources[name]').length,name===names[0]?2:4,`${name}: all runtime assertions retained`);
  assert.notDeepEqual(inverse(name,Buffer.concat([code,Buffer.from('\n// appended mutant\n')])),v1,`${name}: append mutant refused`);
  assert.throws(()=>inverse(name,Buffer.from(source.replace('const runtimeSources=','const mutatedRuntimeSources='))),/unique V2 inverse seam/,`${name}: seam mutant refused`);
 }
 process.stdout.write(`${name} V2=${sha(code)} V1=${sha(v1)} original=${sha(original)} inverse=PASS\n`);
}
for(const name of ['clinical-teaching-question-composition.mjs'])
 assert.deepEqual(readFileSync(join(stage,'proposal','tests',name)),readFileSync(join(prior,'proposal','tests',name)),`${name}: prior pure adapter unchanged`);
const fixture=['fixtures','teaching-question-frozen','clinical-review-reasoning.test.ts.raw'];
assert.deepEqual(readFileSync(join(stage,'proposal','tests',...fixture)),readFileSync(join(prior,'proposal','tests',...fixture)),'reasoning full frozen CODE fixture unchanged');
const witness=names[5];
assert.deepEqual(readFileSync(join(stage,'historical','tests',witness)),readFileSync(join(prior,'historical','tests',witness)),'complete historical witness unchanged');
const priorProof=join(prior,'prove-source.mjs');
assert.equal(sha(readFileSync(priorProof)),'f7c15d8f54048f2247ef901c2cd698831c80bef85057abe2d8e78370d70a079a','authenticated full V1 proof');
const result=execFileSync(process.execPath,[priorProof],{windowsHide:true,maxBuffer:16e6,encoding:'utf8'});
assert.match(result,/SOURCE-ONLY Git role audit and actual pure adapter mutants PASS/,'V1 complete original inverse, historical composition, pure adapter and mutants');
process.stdout.write('V2→V1 full inverses and mutants PASS; authenticated V1→original complete source proof PASS\n');
