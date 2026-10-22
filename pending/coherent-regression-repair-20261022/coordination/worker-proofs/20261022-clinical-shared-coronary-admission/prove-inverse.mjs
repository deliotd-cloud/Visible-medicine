// Source-only proof: no website modules, test runner, validator, bundler or model bytes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {reconstructCoronaryD57} from './proposal/tests/coronary-current-lifecycle-inverse.mjs';

const stage='F:/VisibleMedicine/staging/20261022-clinical-shared-coronary-admission';
const frozen='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const once=(text,newText,oldText)=>{
 assert.equal(text.split(newText).length,2,`Expected unique inverse: ${newText.slice(0,75)}`);
 return text.replace(newText,oldText);
};
function check(name,expectedBefore,expectedAfter,invert){
 const original=readFileSync(`${stage}/original/tests/${name}`);
 const proposal=readFileSync(`${stage}/proposal/tests/${name}`);
 const current=readFileSync(`${frozen}/tests/${name}`);
 assert.equal(sha(original),expectedBefore);
 assert.equal(sha(proposal),expectedAfter);
 assert.deepEqual(original,current,`${name}: frozen candidate unchanged`);
 assert.deepEqual(Buffer.from(invert(proposal.toString())),original,`${name}: complete byte inverse`);
 console.log(`${name}: raw, frozen and unique full inverse passed`);
}

check('clinical-review-current-admission.mjs',
 '535b41a4b24b4d93ee15b8f271108fbff53ade3a08e4debf9e7a0cdf4177a223',
 '181b1df7681ca831a9432559863bc65e7154cd64da8eb8d1686b7108aa56a791',text=>{
 text=once(text,'assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,pin.source,name);');
 return once(text,
  "  for(const [name,inputs] of learners){\n   const family=git('show',pin.runtimeSources[name]+':'+path);\n   assert.equal(sha(family),expected,name+': unchanged source in admitted family '+path);\n   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(family),name+': '+path);\n  }",
  "  for(const [name,inputs] of learners)\n   assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,name+': '+path);");
});

check('clinical-review-coronary-sinus-xray.test.ts',
 '4be201ff8982d64de4e62c007da0dc797e5e819077b9fcb78be0b399988396f1',
 '23d17b87699b6fef26dd8555f6aa5e2678a28ea03ae7e590e272f908a3a5b84e',text=>{
 text=once(text,"import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';");
 text=once(text,' const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n','');
 return once(text,
  '  assert.equal(manifest.sourceCommit,runtimeSources[name],name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);',
  '  assert.equal(manifest.sourceCommit,currentRevision,name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);');
});

check('coronary-current-lifecycle-preservation.test.mjs',
 '2f66f67cb54657af1368f21fa37982c6b15ed370031f47f40119b464ad209204',
 'd745f82ad5ddd71dd7d94f6b68752efb2931fced102e34f293e4166434e60f8d',text=>{
 text=once(text,"import {reconstructCoronaryD57} from './coronary-current-lifecycle-inverse.mjs';\n",'');
 text=once(text,
  "const d57Url=new URL('./fixtures/clinical-review-coronary-sinus-xray-prior-d57.ts.raw',import.meta.url);\n",'');
 text=once(text,
  "const nextSha='23d17b87699b6fef26dd8555f6aa5e2678a28ea03ae7e590e272f908a3a5b84e';",
  "const nextSha='d57fb041284d07658aa0276c82c403c19805130eed09bae2c2d85307a7dcc5c1';");
 text=once(text," assert.equal(sha(nextBytes),nextSha,'Exact proposed coronary candidate');\n const d57=reconstructCoronaryD57(nextBytes,readFileSync(d57Url));",
  " assert.equal(sha(nextBytes),nextSha,'Exact reviewed candidate including all new proof');");
 text=once(text," const nextLines=d57.toString().replaceAll('\\r\\n','\\n').split('\\n');",
  " const nextLines=nextBytes.toString().replaceAll('\\r\\n','\\n').split('\\n');");
 return once(text,
  ",[\'manifest.sourceCommit,runtimeSources[name]\',\'manifest.sourceCommit,currentRevision\']",
  '');
});

const d57=readFileSync(`${stage}/proposal/tests/fixtures/clinical-review-coronary-sinus-xray-prior-d57.ts.raw`);
assert.equal(sha(d57),'d57fb041284d07658aa0276c82c403c19805130eed09bae2c2d85307a7dcc5c1');
assert.deepEqual(d57,readFileSync('F:/VisibleMedicine/staging/20261020-late-regression-contexts/review/before/tests/clinical-review-coronary-sinus-xray.test.ts'));
const newCoronary=readFileSync(`${stage}/proposal/tests/clinical-review-coronary-sinus-xray.test.ts`);
assert.deepEqual(reconstructCoronaryD57(newCoronary,d57),d57,'Direct call of authored pure inverse on full source');
for(const [from,to] of [
 ['manifest.sourceCommit,runtimeSources[name]','manifest.sourceCommit,currentRevision'],
 ['assert.equal(earlier.length,76,','assert.equal(earlier.length,75,'],
 ['assert.equal(response.status,409);staleRejected++','assert.equal(response.status,200);staleRejected++'],
]){
 const text=newCoronary.toString();
 assert.equal(text.split(from).length,2,`Unique coronary mutant point: ${from}`);
 assert.throws(()=>reconstructCoronaryD57(Buffer.from(text.replace(from,to)),d57),`Mutant refused: ${from}`);
}
assert.throws(()=>reconstructCoronaryD57(Buffer.from('if(false){\n'+newCoronary+'\n}'),d57),
 'Unreachable wrapper refused');
console.log('Exact raw d57 historical candidate authenticated');

const old76=readFileSync(`${frozen}/tests/fixtures/clinical-review-coronary-sinus-xray-before-lifecycle.ts.raw`);
assert.equal(sha(old76),'76ace4b4682bf3ba0f9a3e41e1ce140a03dac19801d9c045a59467b0def9b19b');
const oldLines=old76.toString().replaceAll('\r\n','\n').split('\n');
const d57Lines=d57.toString().replaceAll('\r\n','\n').split('\n');
const historicalSeams=[
 " assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);",
 ' assert.equal(review.revision,revision);assert.equal(viewer.sourceCommit,revision);',
 '  assert.equal(manifest.sourceCommit,revision,name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);',
 '  const expected=sha(git(revision,path)),record=review.files.find((file:any)=>file.path===path);',
 " const rendererPath='content/body-renderer-revision.json',sourceRenderer=JSON.parse(git(revision,rendererPath).toString());",
 ' assert.equal(rendererRecord.sourceSha256,sha(git(revision,rendererPath)));',
 ' assert.deepEqual(Object.keys(refs).filter(key=>!Object.hasOwn(oldRefs,key)),[referenceKey]);',
 ' assert.deepEqual(Object.fromEntries(Object.entries(refs).filter(([key])=>key!==referenceKey)),oldRefs);',
];
for(const line of historicalSeams){
 assert.equal(oldLines.filter(row=>row===line).length,1);
 assert.equal(d57Lines.includes(line),false);
}
const retained=oldLines.filter(line=>!historicalSeams.includes(line));
let cursor=0;
for(const line of d57Lines)if(cursor<retained.length&&line===retained[cursor])cursor++;
assert.equal(retained.length,199);
assert.equal(cursor,retained.length,'Every other original line retained in order');
console.log('Original 76ace eight-seam/199-line source theorem preserved through d57');

const pin=JSON.parse(readFileSync(`${frozen}/tests/fixtures/current-atlas-delivery.json`));
const audit=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json'));
assert.equal(pin.source,audit.source);
assert.deepEqual(pin.runtimeSources,audit.familySources);
assert.deepEqual(audit.familyMismatch,[]);
assert.equal(audit.auditedTextRows,2874);
assert.equal(audit.differingFamilyVersusCurrentRows,3);
for(const [name,source] of Object.entries(pin.runtimeSources)){
 const manifest=JSON.parse(readFileSync(`${frozen}/public/atlas-runtime/${name}/manifest.json`));
 assert.equal(manifest.sourceCommit,source,`${name}: admitted runtime source`);
}
const helper=readFileSync(`${stage}/proposal/tests/clinical-review-current-admission.mjs`,'utf8');
for(const gate of ['manifest.sourceCommit,pin.runtimeSources[name]','const family=git(\'show\',pin.runtimeSources[name]+\':\'+path);','assert.equal(sha(family),expected','inputs.find(row=>row.path===path)?.sha256,sha(family)']){
 assert.equal(helper.split(gate).length,2,`Unique strict family gate: ${gate}`);
}
assert.notEqual(pin.runtimeSources.shoulder,pin.source,'A current-Review substitution cannot admit shoulder');
const atlas='F:/VisibleMedicine/atlas';
const gitSource=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6});
const coronaryInputs=JSON.parse(readFileSync(`${frozen}/public/atlas-runtime/head-neck/source-inputs.json`));
const review=JSON.parse(readFileSync(`${frozen}/atlas-review/manifest.json`));
for(const [path,expected] of [
 ['content/coronary-venous-teaching.ts','4b4e26e170b17d6cd6bdbb42dccf1860eaa185517cf312038b0cfec83da349b3'],
 ['lib/nested-teaching.ts','3fe0bbfd7078554e013c00e2e58c70aa96af34074540bf4e959b8269941a356f'],
]){
 assert.equal(sha(gitSource('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path)),expected,`${path}: historical Git`);
 assert.equal(sha(gitSource(pin.runtimeSources['head-neck'],path)),expected,`${path}: admitted family Git`);
 assert.equal(coronaryInputs.find(row=>row.path===path)?.sha256,expected,`${path}: runtime input`);
 const record=review.files.find(row=>row.path===path);
 assert.equal(record?.sourceSha256,expected,`${path}: Review source`);
 assert.equal(record?.importedSha256,expected,`${path}: Review import`);
}
console.log('Pinned family roles, complete text-input audit, and unique family gates checked');
