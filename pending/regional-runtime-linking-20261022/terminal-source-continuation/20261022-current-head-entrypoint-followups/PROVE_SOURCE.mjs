import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-current-head-entrypoint-followups';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const limb='F:/VisibleMedicine/staging/20261022-limb-nerve-entrypoint-followup';
const atlas='F:/VisibleMedicine/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(root,path)=>readFileSync(`${root}/tests/${path}`);
const names=['clinical-review-median-cubital-xray.test.ts','clinical-review-neonatal-cranial-us.test.ts',
 'batch-c-role-inverse.mjs'];
const raw=names.map(name=>read(`${stage}/RAW`,name));
const code=names.map(name=>read(`${stage}/CODE`,name));
for(let i=0;i<names.length;i++)assert.deepEqual(raw[i],read(website,names[i]),`${names[i]} V5 RAW`);
const predecessor=read(`${stage}/PREDECESSOR`,'batch-c-role-inverse.mjs');
assert.deepEqual(predecessor,read(`${limb}/CODE`,'batch-c-role-inverse.mjs'),'Selected limb helper predecessor');
assert.equal(sha(predecessor),'9430a62ffbdc34903db792d3f81760827063f3b2f82e04737ef5ec7190bb9879');
const once=(text,after,before)=>{
 assert.equal(text.split(after).length,2,`One exact source seam: ${after.slice(0,48)}`);
 return text.replace(after,before);
};
const removeBetween=(text,start,end)=>{
 assert.equal(text.split(start).length,2,`One start ${start}`);
 assert.equal(text.split(end).length,2,`One end ${end}`);
 const a=text.indexOf(start),b=text.indexOf(end,a);assert(b>a);
 return text.slice(0,a)+text.slice(b);
};

const helper=code[2].toString();
const medianPure=helper.slice(helper.indexOf('const medianNew='),helper.indexOf('function restoreV5LimbNerve(bytes){'))
 +helper.slice(helper.indexOf('function restoreV5Median(bytes){'),helper.indexOf('const cases={'));
const restoreV5Median=new Function('assert','sha',`${medianPure}\nreturn restoreV5Median;`)(assert,sha);
assert.deepEqual(restoreV5Median(code[0]),raw[0],'Exact median CODE→V5 RAW');
let helperPrior=helper;
helperPrior=once(helperPrior,
 "const medianNew='4e2a4a78f39f8aa4f9f1dc69304f963541c5a60e77d7d2b97d7bb45cfad894a0';\nconst medianV5='211e92a61e4e9b7298163c20b90b04b333e9ea741654dfbada106c9537864b1f';\n",'');
helperPrior=removeBetween(helperPrior,'function restoreV5Median(bytes){','const cases={');
helperPrior=once(helperPrior,
 " if(name==='clinical-review-median-cubital-xray.test.ts'&&sha(currentBytes)===medianNew)\n  currentBytes=restoreV5Median(currentBytes);\n",'');
assert.deepEqual(Buffer.from(helperPrior),predecessor,'Whole combined helper CODE→selected limb predecessor');
let helperV5=helperPrior;
helperV5=removeBetween(helperV5,'const limbNew=','const cases={');
helperV5=once(helperV5,
 " if(name==='clinical-review-limb-nerve-quiz.test.ts'&&sha(currentBytes)===limbNew)\n  currentBytes=restoreV5LimbNerve(currentBytes);\n",'');
assert.deepEqual(Buffer.from(helperV5),raw[2],'Selected limb predecessor→V5 helper RAW');

let neonatal=code[1].toString();
neonatal=removeBetween(neonatal,'const currentHeadEntrypoint=(historical:string)=>{',
 'type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string;bytes?:number};');
neonatal=once(neonatal,
 '    const source=committed(revision,path),historicalSource=committed(historicalRevision,path);\n    const runtimeSource=committed(runtimeSources[name],path);\n',
 '    const source=committed(revision,path);\n');
neonatal=once(neonatal,
 "    if(name==='head-neck')assert.equal(norm(source),currentHeadEntrypoint(norm(historicalSource)),\n      'Current head entrypoint adds only the exact learning-selection channel');\n    else assert.deepEqual(source,historicalSource,`${name}: immutable channel entrypoint`);\n    assert.deepEqual(runtimeSource,source,`${name}: current source agrees with independent runtime family`);",
 '    assert.deepEqual(source,committed(historicalRevision,path),`${name}: immutable channel entrypoint`);');
neonatal=once(neonatal,'sha(runtimeSource),`${name}: entrypoint`',
 'sha(committed(runtimeSources[name],path)),`${name}: entrypoint`');
neonatal=once(neonatal,
 'assert.equal(norm(historicalSource),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);',
 'assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);');
assert.deepEqual(Buffer.from(neonatal),raw[1],'Exact neonatal CODE→V5 RAW');

const {batchCRoleNames,restorePriorBatchCRole}=await import(pathToFileURL(`${stage}/CODE/tests/batch-c-role-inverse.mjs`).href);
const {regionalTourRoleNames,restorePriorRegionalTourRole}=await import(pathToFileURL(`${website}/tests/regional-tour-role-inverse.mjs`).href);
const witness=read(website,'clinical-epoch-batch-c-originals.test.mjs').toString();
const expected=new Map([...witness.matchAll(/\['([^']+)', \['([a-f0-9]{64})', '([a-f0-9]{64})'\]\]/g)]
 .map(([,file,original,prior])=>[file,{original,prior}]));
assert.equal(expected.size,8,'All eight unchanged Batch-C original cases');
const inverseBytes=read(website,'fixtures/clinical-epoch-batch-c-original/inverse-hunks.json');
assert.equal(sha(inverseBytes),'a302b465f4caf1b89898bee80ea175e04e9cf15b6bd15fca0ccfbe807129ecce');
const inverse=JSON.parse(inverseBytes);
assert.deepEqual(inverse.files.map(x=>x.name).sort(),[...expected.keys()].sort());
assert.deepEqual([...batchCRoleNames,...regionalTourRoleNames.filter(x=>expected.has(x))].sort(),[...expected.keys()].sort());
for(const file of inverse.files){
 const current=file.name===names[0]?code[0]
  :file.name==='clinical-review-limb-nerve-quiz.test.ts'
   ?read(`${limb}/CODE`,file.name):read(website,file.name);
 const prior=regionalTourRoleNames.includes(file.name)
  ?restorePriorRegionalTourRole(file.name,current)
  :restorePriorBatchCRole(file.name,current,{readPrior:()=>read(website,`fixtures/batch-c-role-prior/${file.name}.raw`)});
 assert.equal(sha(prior),expected.get(file.name).prior,`${file.name}: exact prior`);
 const original=read(website,`fixtures/clinical-epoch-batch-c-original/${file.name}.raw`);
 assert.equal(sha(original),expected.get(file.name).original,`${file.name}: exact original`);
 let text=prior.toString().replaceAll('\r\n','\n');
 for(const {before,after} of [...file.hunks].reverse())text=once(text,after,before);
 assert.equal(text,original.toString().replaceAll('\r\n','\n'),`${file.name}: complete prior→original`);
 const probe=/[A-Za-z0-9]/.exec(file.hunks[0].after);assert(probe);
 const changed=file.hunks[0].after.slice(0,probe.index)+(probe[0]==='X'?'Y':'X')+file.hunks[0].after.slice(probe.index+1);
 assert.throws(()=>{
  let mutated=prior.toString().replaceAll('\r\n','\n').replace(file.hunks[0].after,changed);
  for(const {before,after} of [...file.hunks].reverse())mutated=once(mutated,after,before);
 },`${file.name}: historical mutation refusal`);
}

const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const pin=JSON.parse(read(website,'fixtures/current-atlas-delivery.json'));
assert.equal(git('rev-parse','HEAD').toString().trim(),pin.source);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),pin.sourceTree);
const historical='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const seams=[
 ["import {BodySelectionChannel} from '../../app/body-selection-channel';",
  "import {BodySelectionChannel} from '../../app/body-selection-channel';\nimport {AtlasLearningSelectionChannel} from '../../app/atlas-learning-selection-channel';"],
 [": <HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel",
  ": <AtlasLearningSelectionChannel revision={__VM_HEAD_SOURCE_REVISION__} region={region}><HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel"],
 ['assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel>',
  'assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel></AtlasLearningSelectionChannel>'],
];
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const path=`integration/${module}/main.tsx`,runtime=pin.runtimeSources[module];
 const old=git('show',`${historical}:${path}`),now=git('show',`${runtime}:${path}`);
 const current=git('show',`${pin.source}:${path}`);
 const input=JSON.parse(readFileSync(`${website}/public/atlas-runtime/${module}/source-inputs.json`));
 assert.equal(input.filter(x=>x.path===path).length,1);
 assert.equal(input.find(x=>x.path===path).sha256,sha(now),`${module}: current input Git closure`);
 assert.deepEqual(current,now,`${module}: current checkout family matches runtime input`);
 if(module==='head-neck'){
  let transformed=old.toString().replaceAll('\r\n','\n');
  for(const [before,after] of seams){assert.equal(transformed.split(before).length,2);transformed=transformed.replace(before,after);}
  assert.equal(now.toString().replaceAll('\r\n','\n'),transformed,'Exact three head learning-channel additions');
  assert.deepEqual(readFileSync(`${atlas}/${path}`),now,'Current head checkout source');
 }else assert.deepEqual(now,old,`${module}: unchanged historical entrypoint`);
 console.log(`${module}: historical ${sha(old)} runtime ${sha(now)} source ${runtime}`);
}
console.log(`SOURCE PASS: median ${sha(code[0])}→${sha(raw[0])}; neonatal ${sha(code[1])}→${sha(raw[1])}; helper ${sha(code[2])}→${sha(predecessor)}→${sha(raw[2])}; eight original theorems`);
