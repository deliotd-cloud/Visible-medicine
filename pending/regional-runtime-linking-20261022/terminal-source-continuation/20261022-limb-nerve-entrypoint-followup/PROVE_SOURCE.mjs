import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-limb-nerve-entrypoint-followup';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const atlas='F:/VisibleMedicine/atlas';
const name='clinical-review-limb-nerve-quiz.test.ts';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path);
const v5=read(join(stage,'RAW/tests',name));
const code=read(join(stage,'CODE/tests',name));
const witnessRaw=read(join(stage,'RAW/tests/batch-c-role-inverse.mjs'));
const witnessCode=read(join(stage,'CODE/tests/batch-c-role-inverse.mjs'));
assert.equal(sha(v5),'fa3ff34ae74397b4f84835e0a5f5364493136114f004c26ce9d7a41acdd9d9a7');
assert.deepEqual(read(join(website,'tests',name)),v5,'exact immutable V5 input');
assert.equal(sha(code),'cffd85f99710eab36bf0df7d71f8dd86ded3cf8634a960028e94cf1c517ce8f6');
assert.deepEqual(read(join(website,'tests/batch-c-role-inverse.mjs')),witnessRaw,'exact immutable witness input');
const restore=(text,start,end,replacement)=>{
 assert.equal(text.split(start).length,2,'Unique start');assert.equal(text.split(end).length,2,'Unique end');
 const a=text.indexOf(start),b=text.indexOf(end,a);assert(b>a);return text.slice(0,a)+replacement+text.slice(b);
};
const limbText=code.toString('utf8'),v5Text=v5.toString('utf8');
const helperStart='const once=(source:string,before:string,after:string)=>{';
const helperEnd='type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};';
const loopStart='    const historicalSource=committed(revision,entry),runtimeSource=committed(current.runtimeSources[name],entry),inputs=learnerInputs.get(name)!;';
const loopEnd='  }\n  for(const path of sourcePaths){';
const priorLoopStart='    const source=committed(revision,entry),inputs=learnerInputs.get(name)!;';
const v5Loop=v5Text.slice(v5Text.indexOf(priorLoopStart),v5Text.indexOf(loopEnd,v5Text.indexOf(priorLoopStart)));
let restored=restore(limbText,helperStart,helperEnd,'');
restored=restore(restored,loopStart,loopEnd,v5Loop);
assert.deepEqual(Buffer.from(restored),v5,'full proposed→V5 inverse');
const changed=limbText.replace('190a63238eadcf906abe89dcbb6a67c88afe70b9','0'.repeat(40));
assert.notEqual(changed,limbText);assert.notEqual(sha(Buffer.from(changed)),sha(code),'mutated proposed source refused');
let witnessRestored=restore(witnessCode.toString('utf8'),'const limbNew=','const cases={','');
const branch=" if(name==='clinical-review-limb-nerve-quiz.test.ts'&&sha(currentBytes)===limbNew)\n  currentBytes=restoreV5LimbNerve(currentBytes);\n";
assert.equal(witnessRestored.split(branch).length,2,'one exact limb witness branch');
witnessRestored=witnessRestored.replace(branch,'');
assert.deepEqual(Buffer.from(witnessRestored),witnessRaw,'full proposed witness→V5 inverse');

const {batchCRoleNames,restorePriorBatchCRole}=await import(pathToFileURL(join(stage,'CODE/tests/batch-c-role-inverse.mjs')).href);
const {regionalTourRoleNames,restorePriorRegionalTourRole}=await import(pathToFileURL(join(website,'tests/regional-tour-role-inverse.mjs')).href);
const witnessText=read(join(website,'tests/clinical-epoch-batch-c-originals.test.mjs')).toString('utf8');
const expected=new Map([...witnessText.matchAll(/\['([^']+)', \['([a-f0-9]{64})', '([a-f0-9]{64})'\]\]/g)]
 .map(([,file,original,prior])=>[file,{original,prior}]));
assert.equal(expected.size,8,'all eight Batch-C original cases');
const inverseBytes=read(join(website,'tests/fixtures/clinical-epoch-batch-c-original/inverse-hunks.json'));
assert.equal(sha(inverseBytes),'a302b465f4caf1b89898bee80ea175e04e9cf15b6bd15fca0ccfbe807129ecce');
const inverse=JSON.parse(inverseBytes.toString('utf8'));
assert.deepEqual(inverse.files.map(x=>x.name).sort(),[...expected.keys()].sort());
assert.deepEqual([...batchCRoleNames,...regionalTourRoleNames.filter(x=>expected.has(x))].sort(),[...expected.keys()].sort());
const closures=[];
for(const file of inverse.files){
 const current=file.name===name?code:read(join(website,'tests',file.name));
 const frozenPath=join(website,'tests/fixtures/batch-c-role-prior',file.name+'.raw');
 const prior=regionalTourRoleNames.includes(file.name)
  ?restorePriorRegionalTourRole(file.name,current)
  :restorePriorBatchCRole(file.name,current,{readPrior:()=>read(frozenPath)});
 assert.equal(sha(prior),expected.get(file.name).prior,`${file.name}: entire prior proposal`);
 const original=read(join(website,'tests/fixtures/clinical-epoch-batch-c-original',file.name+'.raw'));
 assert.equal(sha(original),expected.get(file.name).original,`${file.name}: entire original fixture`);
 let text=prior.toString('utf8').replaceAll('\r\n','\n');
 for(const {before,after} of [...file.hunks].reverse()){
  assert.equal(text.split(after).length,2,`${file.name}: unique historical seam`);
  text=text.replace(after,before);
 }
 assert.equal(text,original.toString('utf8').replaceAll('\r\n','\n'),`${file.name}: complete prior→original theorem`);
 const firstAfter=file.hunks[0].after,probe=/[A-Za-z0-9]/.exec(firstAfter);
 assert(probe,`${file.name}: mutation probe`);
 const replacement=probe[0]==='X'?'Y':'X';
 const mutatedAfter=firstAfter.slice(0,probe.index)+replacement+firstAfter.slice(probe.index+1);
 const mutated=prior.toString('utf8').replaceAll('\r\n','\n').replace(firstAfter,mutatedAfter);
 assert.notEqual(mutated,prior.toString('utf8').replaceAll('\r\n','\n'));
 assert.throws(()=>{
  let result=mutated;
  for(const {before,after} of [...file.hunks].reverse()){
   assert.equal(result.split(after).length,2);
   result=result.replace(after,before);
  }
 },`${file.name}: historical mutation refused`);
 closures.push({path:'tests/'+file.name,currentSha256:sha(current),priorSha256:sha(prior),originalSha256:sha(original)});
}

const pin=JSON.parse(read(join(website,'tests/fixtures/current-atlas-delivery.json')));
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),pin.source);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),pin.sourceTree);
assert.equal(git('status','--porcelain').toString().trim(),'');
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const entrypoints=[];
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const path=`integration/${module}/main.tsx`,revision=pin.runtimeSources[module];
 const old=git('show',`${historical}:${path}`),current=git('show',`${revision}:${path}`);
 const inputs=JSON.parse(read(join(website,`public/atlas-runtime/${module}/source-inputs.json`)));
 assert.equal(inputs.filter(x=>x.path===path).length,1,`${module}: one current input`);
 assert.equal(inputs.find(x=>x.path===path).sha256,sha(current),`${module}: current input matches Git`);
 if(module==='head-neck'){
  assert.equal(revision,pin.source);
  assert.deepEqual(read(join(atlas,path)),current,'current head checkout source');
  let expectedHead=old.toString('utf8').replaceAll('\r\n','\n');
  const swap=(before,after)=>{assert.equal(expectedHead.split(before).length,2);expectedHead=expectedHead.replace(before,after);};
  swap("import {BodySelectionChannel} from '../../app/body-selection-channel';",
   "import {BodySelectionChannel} from '../../app/body-selection-channel';\nimport {AtlasLearningSelectionChannel} from '../../app/atlas-learning-selection-channel';");
  swap(": <HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel",
   ": <AtlasLearningSelectionChannel revision={__VM_HEAD_SOURCE_REVISION__} region={region}><HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel");
  swap('assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel>',
   'assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel></AtlasLearningSelectionChannel>');
  assert.equal(current.toString('utf8').replaceAll('\r\n','\n'),expectedHead,'only exact later head learning-channel addition');
 }else{
  assert.equal(revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.deepEqual(current,old,`${module}: earlier source retained`);
 }
 entrypoints.push({module,runtimeSource:revision,historicalSha256:sha(old),currentSha256:sha(current)});
}
const output={at:new Date().toISOString(),sourceReceiptSha256:'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f',limbRawSha256:sha(v5),limbCodeSha256:sha(code),witnessRawSha256:sha(witnessRaw),witnessCodeSha256:sha(witnessCode),fullProposedToV5Inverse:true,fullWitnessToV5Inverse:true,fullEightHistoricalTheorems:true,mutationRefusal:true,entrypoints,closures,limits:['Pure source and bounded Git proof only; no native tests, esbuild, build, typecheck or browser run','Main review/integration and native affected-root rerun remain required','No candidate, strict pin, validator, medical data or owner preview edited']};
writeFileSync(join(stage,'SOURCE_PROOF.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({proposedToV5:true,originalTheorems:closures.length,entrypoints}));
