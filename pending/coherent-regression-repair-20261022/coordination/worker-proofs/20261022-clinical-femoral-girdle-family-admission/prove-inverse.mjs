// Read-only source/Git-byte proof. No website imports, validator, test runner or model reads.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {reconstructFamilyPrior} from './proposal/tests/clinical-family-prior-current-inverse.mjs';

const stage='F:/VisibleMedicine/staging/20261022-clinical-femoral-girdle-family-admission';
const site='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function undo(text,newText,oldText){
 assert.equal(text.split(newText).length,2,`Exactly one inverse seam: ${newText.slice(0,80)}`);
 return text.replace(newText,oldText);
}
function check(name,beforeHash,afterHash,invert){
 const before=readFileSync(`${stage}/original/tests/${name}`);
 const after=readFileSync(`${stage}/proposal/tests/${name}`);
 const frozen=readFileSync(`${site}/tests/${name}`);
 assert.equal(sha(before),beforeHash);
 assert.equal(sha(after),afterHash);
 assert.deepEqual(before,frozen,'Frozen website source unchanged');
 assert.deepEqual(Buffer.from(invert(after.toString())),before,'Unique inverse reconstructs complete original bytes');
 console.log(`${name}: complete inverse and frozen byte equality passed`);
}
const importNew="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const importOld="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
for(const [name,beforeHash,afterHash] of [
 ['clinical-review-femoral-arterial-xray.test.ts','f9078eadbc4e32a6f6f99e8e6ca0f8e8230bb9ceecc766210b50e45564256e7c','79f3d0da5c4a192719522bc5979f03b0ec48add178c0071bc152d9c7354a67a8'],
 ['clinical-review-femoral-venous-xray.test.ts','00cde16bc349a8e6921094f56db467f95c35694d7163c4fb47c21d8485f7f16f','4faaa1d2a8b97ae3933f5acb889d5c5447dee2487d23676e21650b889fabef0e'],
])check(name,beforeHash,afterHash,text=>{
 text=undo(text,importNew,importOld);
 text=undo(text,'  const admission=validateCurrentAtlasDelivery();\n  assert.equal(admission.source,liveCommit);\n','');
 return undo(text,'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,revision,name);');
});
check('clinical-review-girdle-muscle-xray.test.ts',
 'aad3d4eb21f3fe6f2c8a5bffce816f140276d8582142667f2aab25e3f88be339',
 '78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288',text=>{
 text=undo(text,importNew,importOld);
 text=undo(text,' const admission=validateCurrentAtlasDelivery();\n assert.equal(admission.source,liveCommit);\n','');
 text=undo(text,'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,liveCommit,name);');
 return undo(text,
  'if(inLearner)assert.equal(input?.sha256,\n    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);',
  'if(inLearner)assert.equal(input?.sha256,sha(original),`${name}: ${path}`);');
});

const families=[
 ['arterial','clinical-review-femoral-arterial-xray.test.ts'],
 ['venous','clinical-review-femoral-venous-xray.test.ts'],
 ['girdle','clinical-review-girdle-muscle-xray.test.ts'],
];
for(const [family,name] of families){
 const proposed=readFileSync(`${stage}/proposal/tests/${name}`);
 const raw=readFileSync(`${stage}/proposal/tests/fixtures/${name}.prior-current.raw`);
 assert.deepEqual(raw,readFileSync(`${stage}/original/tests/${name}`),`${family}: authentic full raw prior`);
 assert.deepEqual(reconstructFamilyPrior(family,proposed,raw),raw,
  `${family}: direct call to actual pure byte adapter succeeds`);
 const text=proposed.toString('utf8');
 for(const [from,to] of [
  ['manifest.sourceCommit,admission.runtimeSources[name]','manifest.sourceCommit,liveCommit'],
  [family==='girdle'?'assert.equal(catalog.structures.length,1104)':'assert.equal(entries.length,6)',
   family==='girdle'?'assert.equal(catalog.structures.length,1103)':'assert.equal(entries.length,5)'],
 ]){
  assert.equal(text.split(from).length,2,`${family}: unique mutant seam`);
  assert.throws(()=>reconstructFamilyPrior(family,Buffer.from(text.replace(from,to)),raw),
   `${family}: authored adapter rejects mutant`);
 }
 assert.throws(()=>reconstructFamilyPrior(family,Buffer.from('if(false){\n'+text+'\n}'),raw),
  `${family}: authored adapter rejects disabled wrapper`);
}
console.log('Actual pure adapter passed all full-source fixtures and refused scoped/count/wrapper mutants');

function undoAddedTest(text,start,expectedHash){
 assert.equal(text.split(start).length,2,'Exactly one newly authored preservation test');
 const at=text.indexOf(start),added=text.slice(at);
 assert.equal(sha(Buffer.from(added)),expectedHash,'Exact added preservation test block');
 return text.slice(0,at);
}
for(const [family,name,beforeHash,afterHash,addedStart,addedHash] of [
 ['arterial','clinical-review-femoral-arterial-admission-56-closed.test.mjs','e4b06a02ec8835c464af27b0d53238c7403907e3f31d2ef9ea5cc690ccc30aeb','e842d64d7efb589fb116368e1b7e405204901b30380922d68307b550ae1bd1e3',"test('arterial family admission",'adcc7224a162b55aa4cdf755f363ccde355d9e96ce3e18ef67fff18772648b66'],
 ['venous','clinical-review-femoral-venous-admission-56-closed.test.mjs','ac23ebb3283399696a90ebff42892e5448e6a30756d302e978734f72c73710de','1685d607c7ab4d7622ce868525c28f09c6709c172e098dfa8ff09e474a884bbf',"test('venous family admission",'8888690fe5d9d492a043ff49bfb91770b6d7c103fdfaba10f4ef656135a64c21'],
 ['girdle','clinical-review-girdle-history-preservation.test.mjs','d9f795ed98c2c58be3cfa3ec6cc0d3b39d5926607cde4b7251ee530095a2a011','2bc36a30b6e8871571cb799f2663c20505555bd5f6d5494d9e3756f953c0d89c',"test('girdle family admission",'27a3caeef35f19d4725660fdd0bb6d62f0e4c66c2e5cfd8f3b295a9b3dde8061'],
])check(name,beforeHash,afterHash,text=>{
 text=undo(text,"import {reconstructFamilyPrior} from './clinical-family-prior-current-inverse.mjs';\n",'');
 if(family==='girdle'){
  text=undo(text,
   "const admitted=readFileSync(new URL('./clinical-review-girdle-muscle-xray.test.ts',import.meta.url));\nconst prior=readFileSync(new URL('./fixtures/clinical-review-girdle-muscle-xray.test.ts.prior-current.raw',import.meta.url));\nconst proposed=reconstructFamilyPrior('girdle',admitted,prior);",
   "const proposed=readFileSync(new URL('./clinical-review-girdle-muscle-xray.test.ts',import.meta.url));");
 }else{
  text=undo(text,
   `const admittedBytes=readFileSync(new URL('./clinical-review-femoral-${family}-xray.test.ts',import.meta.url));\nconst priorBytes=readFileSync(new URL('./fixtures/clinical-review-femoral-${family}-xray.test.ts.prior-current.raw',import.meta.url));\nconst candidate=reconstructFamilyPrior('${family}',admittedBytes,priorBytes).toString('utf8');`,
   `const candidate=readFileSync(new URL('./clinical-review-femoral-${family}-xray.test.ts',import.meta.url),'utf8');`);
 }
 return undoAddedTest(text,addedStart,addedHash);
});

const pin=JSON.parse(readFileSync(`${site}/tests/fixtures/current-atlas-delivery.json`));
const audit=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json'));
assert.equal(pin.source,audit.source);
assert.deepEqual(pin.runtimeSources,audit.familySources);
assert.deepEqual(audit.familyMismatch,[]);
assert.equal(audit.auditedTextRows,2874);
for(const [name,revision] of Object.entries(pin.runtimeSources)){
 const manifest=JSON.parse(readFileSync(`${site}/public/atlas-runtime/${name}/manifest.json`));
 assert.equal(manifest.sourceCommit,revision,name);
}
const gitSource=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6});
const shoulderInputs=JSON.parse(readFileSync(`${site}/public/atlas-runtime/shoulder/source-inputs.json`));
const path='app/body-content.ts';
const family=sha(gitSource(pin.runtimeSources.shoulder,path));
const current=sha(gitSource(pin.source,path));
assert.notEqual(family,current,'Shoulder body-content authentically differs from current Review source');
assert.equal(shoulderInputs.find(row=>row.path===path)?.sha256,family);
console.log(`Family Git/input proof passed; shoulder ${path} ${family}, Review ${current}`);
