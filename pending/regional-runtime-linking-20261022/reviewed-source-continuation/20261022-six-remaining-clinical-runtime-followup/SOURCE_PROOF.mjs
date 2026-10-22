// Pure exact-source and historical-witness proof; no test runner or esbuild.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-six-remaining-clinical-runtime-followup/';
const baseline='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawHashes={
 'clinical-review-lacrimal-quiz.test.ts':'2134305fe2af059f405b463dfa6158a5c2e05396628fde97ddd24210df695abe',
 'clinical-review-laryngeal-muscle-quiz.test.ts':'806646d125fa5772174a46f3976c162a095755e257d15b961536536eff8f0aec',
 'clinical-review-laryngeal-framework-quiz.test.ts':'63cc3f0c56b554f6a7ca0030eaeef44ff919dc7ec3f0d3c66ac8354f57e91deb',
 'clinical-review-ocular-support-quiz.test.ts':'a29ccee61b27faf00d925fafc8b00e0d5b64eda4ebd6481b8b1ff4d16b7e5101',
 'clinical-review-orbital-support-quiz.test.ts':'fe12516289eb6a2c6d971d3d0e44b186d6cfba00beda3deda7bc95150a436954',
 'clinical-review-pectoral-ultrasound.test.ts':'3d243b0041685bcaac16eb271be4f7d6891a2485f7fbfeff406e53b83ba0d1fc',
 'clinical-current-quiz-preservation.test.mjs':'b7ef46cdeb1c22340ce0f007b18cf02743fa5c81c21d58067743b2f0548587af',
 'clinical-current-imaging-preservation.test.mjs':'4a975560f129067bc08d572efe500209363d8107a234df861214edd32824b56c',
};
function one(text,from,to,label){
 assert.equal(text.split(from).length,2,label+': unique inverse seam');
 return text.replace(from,to);
}
function clinicalInverse(name,source){
 source=one(source,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'',name+': import');
 const indent=name==='clinical-review-pectoral-ultrasound.test.ts'?'  ':' ';
 source=one(source,indent+'const deliveryPin=validateCurrentAtlasDelivery();\n'+
  indent+'assert.equal(deliveryPin.source,currentRevision);\n','',name+': Review source');
 return one(source,'assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
  'assert.equal(manifest.sourceCommit,currentRevision,module);',name+': runtime source');
}
function removeSection(source,start,next,label){
 const a=source.indexOf(start),b=source.indexOf(next,a);
 assert(a>=0&&b>a&&source.indexOf(start,a+1)===-1,label+': unique section');
 return source.slice(0,a)+source.slice(b);
}
function witnessInverse(name,source){
 source=removeSection(source,'const runtimeCodeHashes={','const '+(name.includes('quiz')?'families':'historical')+'=',name+': CODE hash map');
 source=removeSection(source,'function restoreRuntimeSource(name,bytes,rawHash){',
  name.includes('quiz')?'function injected(hashes){':'function inverse(candidate,',name+': runtime inverse');
 source=one(source,name.includes('quiz')?
  ' if(Object.hasOwn(runtimeCodeHashes,name))bytes=restoreRuntimeSource(name,bytes,candidateSha);\n':
  ' if(Object.hasOwn(runtimeCodeHashes,name))bytes=restoreRuntimeSource(name,bytes,newHash);\n',
  '',name+': verify pre-step');
 return source;
}
for(const [name,hash] of Object.entries(rawHashes)){
 const raw=readFileSync(stage+'RAW/tests/'+name),code=readFileSync(stage+'CODE/tests/'+name);
 assert.equal(sha(raw),hash,name+': immutable V5 preimage');
 assert.deepEqual(Buffer.from(code.toString('utf8')),code,name+': lossless CODE UTF-8');
 const restored=Buffer.from(name.startsWith('clinical-current-')?
  witnessInverse(name,code.toString('utf8')):clinicalInverse(name,code.toString('utf8')));
 assert.deepEqual(restored,raw,name+': entire CODE to RAW inverse');
 console.log(name+' RAW '+sha(raw)+' CODE '+sha(code)+' full inverse OK');
}
function actualWitness(name,start,end,result){
 const source=readFileSync(stage+'CODE/tests/'+name,'utf8');
 const a=source.indexOf(start),b=source.indexOf(end);
 assert(a>=0&&b>a&&source.indexOf(start,a+1)===-1&&source.indexOf(end,b+1)===-1,name+': unique witness code');
 const baselineUrl=pathToFileURL(baseline+name).href;
 const pure=source.slice(a,b).replaceAll('import.meta.url',JSON.stringify(baselineUrl));
 return Function('assert','readFileSync','createHash','Buffer',pure+'\nreturn '+result+';')(
  assert,readFileSync,createHash,Buffer);
}
const quiz=actualWitness('clinical-current-quiz-preservation.test.mjs','const sha=','test(\'six current quiz seams',
 '{families,verify}');
const imaging=actualWitness('clinical-current-imaging-preservation.test.mjs','const sha=','test(\'five current imaging seams',
 '{cases,verify}');
for(const [name,witness,family] of [
 ['lacrimal',quiz,true],['laryngeal-framework',quiz,true],['laryngeal-muscle',quiz,true],
 ['ocular-support',quiz,true],['orbital-support-quiz',imaging,false],['pectoral-ultrasound',imaging,false],
]){
 const row=(family?witness.families:witness.cases).find(item=>item[0]===name);
 assert(row,name+': actual historical witness row');
 const file=family?`clinical-review-${name}-quiz.test.ts`:`clinical-review-${name}.test.ts`;
 const code=readFileSync(stage+'CODE/tests/'+file);
 witness.verify(row,code);
 const seam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
 assert.equal(code.toString('utf8').split(seam).length,2,name+': one family seam');
 for(const mutant of [code.toString('utf8').replace(seam,''),code.toString('utf8')+seam,
  code.toString('utf8').replace(seam,'assert.equal(manifest.sourceCommit,currentRevision,module);')])
  assert.throws(()=>witness.verify(row,Buffer.from(mutant)),name+': runtime-family tamper refused');
 console.log(name+': actual V5 and original historical witness inverse, tamper refusals OK');
}
