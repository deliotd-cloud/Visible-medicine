// Pure staged-source proof. No website, runtime, build, or native test writes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=[
 'clinical-review-cranial-teaching-batch.test.ts',
 'clinical-review-dorsal-hand-ultrasound.test.ts',
 'clinical-review-elbow-arterial-ultrasound.test.ts',
 'clinical-review-foot-variant-quiz.test.ts',
 'clinical-review-foot-venous-arch-imaging.test.ts',
 'next-five-admission-contract.test.mjs',
 'next-six-admission-contract.test.mjs',
];
const before={
 'clinical-review-cranial-teaching-batch.test.ts':'33d3ac3fd9c057ea49644e58cfbbbff13a3e3cf0f4e7069ed1699e27360f4225',
 'clinical-review-dorsal-hand-ultrasound.test.ts':'87d29750351caaf50c1a2781ab5c248a92f711483fcece79b7f15de69853c3c1',
 'clinical-review-elbow-arterial-ultrasound.test.ts':'8c7d6cfa63436615f4ace28125163796b5d55a80702ca7075b8c24ce63dc2182',
 'clinical-review-foot-variant-quiz.test.ts':'7edc338eae04a62d73767c52ed7e5e1586a3dd2f907021cb5c4c61e150e8c938',
 'clinical-review-foot-venous-arch-imaging.test.ts':'fd7b184fac2e89e4dc8b76c03c47e365686e55db23479f8d885d350c0e32b957',
 'next-five-admission-contract.test.mjs':'370f887910a9a92bd25e1487ebd7533ee729d4d098c248122fa8f00f65ee90b9',
 'next-six-admission-contract.test.mjs':'9620e31d9882dfa21338e3eba223e5f2309efd9130dcb59c00a64c35910c2e9d',
};
function one(source,from,to,label){
 assert.equal(source.split(from).length,2,label+': unique inverse seam');
 return source.replace(from,to);
}
const runtimeImport="import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n";
const runtimePin=' const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(deliveryPin.source,currentRevision);\n';
const runtimeNew='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
const runtimeOld='assert.equal(manifest.sourceCommit,currentRevision,module);';
function sourceInverse(source){
 source=one(source,runtimeImport,'','runtime import');
 source=one(source,runtimePin,'','Review pin');
 return one(source,runtimeNew,runtimeOld,'module runtime');
}
const fivePrefix=` if(name==='clinical-review-cranial-teaching-batch.test.ts'||name==='clinical-review-elbow-arterial-ultrasound.test.ts'){
  result=one(result,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\\n",'',name+': exact runtime import');
  result=one(result,' const deliveryPin=validateCurrentAtlasDelivery();\\n assert.equal(deliveryPin.source,currentRevision);\\n','',name+': current Review pin');
  result=one(result,'assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
   'assert.equal(manifest.sourceCommit,currentRevision,module);',name+': independent runtime family');
 }
`;
const fiveSuffix=` if(name==='clinical-review-cranial-teaching-batch.test.ts'||name==='clinical-review-elbow-arterial-ultrasound.test.ts'){
  const runtimeSeam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
  assert.equal(candidate.split(runtimeSeam).length,2,name+': one exact runtime-family check');
  for(const mutant of [candidate.replace(runtimeSeam,''),candidate+runtimeSeam,
   candidate.replace(runtimeSeam,'assert.equal(manifest.sourceCommit,currentRevision,module);')])
   assert.throws(()=>reconstruct(name,mutant),name+': runtime-family mutation refused');
 }
`;
const sixNames=`const runtimeFamilyNames=new Set([
 'clinical-review-dorsal-hand-ultrasound.test.ts',
 'clinical-review-foot-variant-quiz.test.ts',
 'clinical-review-foot-venous-arch-imaging.test.ts',
]);
`;
const sixPrefix=` if(runtimeFamilyNames.has(name)){
  const one=(current,prior,label)=>{
   assert.equal(candidate.split(current).length,2,name+': one '+label);
   candidate=candidate.replace(current,prior);
  };
  one("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\\n",'','runtime import');
  one(' const deliveryPin=validateCurrentAtlasDelivery();\\n assert.equal(deliveryPin.source,currentRevision);\\n','','current Review pin');
  one('assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
   'assert.equal(manifest.sourceCommit,currentRevision,module);','independent runtime family');
 }
`;
const sixSuffix=` if(runtimeFamilyNames.has(name)){
  const runtimeSeam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
  const latest=lf(readFileSync(new URL('./'+name,import.meta.url),'utf8'));
  assert.equal(latest.split(runtimeSeam).length,2,name+': one runtime-family check');
  for(const mutant of [latest.replace(runtimeSeam,''),latest+runtimeSeam,
   latest.replace(runtimeSeam,'assert.equal(manifest.sourceCommit,currentRevision,module);')])
   assert.throws(()=>reconstruct(name,mutant),name+': runtime-family mutation refused');
 }
`;
function witnessInverse(name,source){
 if(name.startsWith('next-five')){
  source=one(source,fivePrefix,'','five source inverse');
  return one(source,fiveSuffix,'','five refusal inverse');
 }
 source=one(source,sixNames,'','six family declaration inverse');
 source=one(source,sixPrefix,'','six source inverse');
 return one(source,sixSuffix,'','six refusal inverse');
}
for(const name of names){
 const raw=readFileSync(new URL('./RAW/tests/'+name,import.meta.url));
 const code=readFileSync(new URL('./CODE/tests/'+name,import.meta.url));
 assert.equal(sha(raw),before[name],name+': immutable V5 preimage');
 assert.deepEqual(Buffer.from(code.toString('utf8')),code,name+': lossless UTF-8 CODE');
 const recovered=Buffer.from(name.startsWith('next-')?witnessInverse(name,code.toString('utf8')):sourceInverse(code.toString('utf8')));
 assert.deepEqual(recovered,raw,name+': complete CODE to RAW inverse');
 console.log(name+' RAW '+sha(raw)+' CODE '+sha(code)+' inverse OK');
}
