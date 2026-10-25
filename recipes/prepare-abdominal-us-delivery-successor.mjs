// Create-only source proposal. Run after main has installed a coherent 27b
// Review binding and default current-delivery pin in the prepared Website.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,lstatSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const proposal='F:/VisibleMedicine/staging/20261025-abdominal-us-delivery-proposal';
const website='F:/VisibleMedicine/staging/20261025-abdominal-us-website/website';
const parent='F:/VisibleMedicine/staging/20261025-model-preflight-website/website';
const atlas='F:/VisibleMedicine/staging/20261025-abdominal-arterial-us-native/atlas';
const source='27b341001718b7d5bb4f45aad0c8d8784e287c3b';
const tree='32d418c517d3959089d443e2d374e362dc723157';
const oldSource='665c53a4d21667d14f12cf2e81a200d5da3df3ac';
const oldTree='dfbba5b89ba5c496fb83cbda410a4426a68b7409';
const oldRootSha='d873c8ce430f9b11aab234e406dbd6cf98a8a47403bc8e1021fe80059a2b7c96';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=p=>readFileSync(p);
const json=p=>JSON.parse(read(p));
const output=path.join(proposal,'prepared');
assert(!existsSync(output),'Use a fresh proposal for create-only preparation');
for(const root of [proposal,website,parent,atlas])assert(lstatSync(root).isDirectory()&&!lstatSync(root).isSymbolicLink(),`Untrusted root: ${root}`);
for(const [file,expected]of [
 ['F:/VisibleMedicine/staging/20261025-model-preflight-website/SOURCE_CANDIDATE.json','886881a62de80e046022182f2b92f4f122b8c39092d33ed138fab4b49e7b8c4f'],
 ['F:/VisibleMedicine/staging/20261025-abdominal-arterial-us-native/SOURCE_CANDIDATE.json','3ab3744296035502165d3b3b2439338306533a15dffdd72d4e6103aafdc6f75a'],
 ['F:/VisibleMedicine/staging/20261025-abdominal-us-website/PREPARATION.json','b26c6059a35ac212d800e9f0112d853c750c46e509618b22e1dd345b9e573e23'],
 [path.join(proposal,'successor-case.mjs.raw'),'eb6da76da9b4b6e24ffb32b9361111632946d769cb1c018f2fd6aecfb8cd5f7d'],
])assert.equal(sha(read(file)),expected,`Source receipt or template changed: ${file}`);

const old=read(path.join(proposal,'witness/current-atlas-delivery.44.mjs.raw'));
assert.equal(sha(old),oldRootSha);
assert.deepEqual(read(path.join(website,'tests/current-atlas-delivery.test.mjs')),old,
 'The complete 44-case source changed');
assert.equal(sha(read(path.join(website,'tests/fixtures/current-atlas-delivery-before-model-preflight-665c.mjs.raw'))),
 '791926fad49169daca4f2f49f1afcd7af8bca4de35699e1ee2a20a46fb8b7988',
 'Authentic complete 43-case predecessor changed');
assert.equal(sha(read(path.join(parent,'tests/current-atlas-delivery.test.mjs'))),oldRootSha,
 'The named parent 44-case root changed');
assert.equal(sha(read(path.join(website,'tests/current-atlas-delivery.mjs'))),
 '02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e',
 'Current-delivery validator source changed');
assert.equal(sha(read(path.join(website,'scripts/bind-clinical-review.mjs'))),
 '1c43d98bd38117d371eafc48e13d37511951f8bfc7b180641f5c1a78c635fec0',
 'Review binder formula source changed');
assert.equal(process.env.VM_ATLAS_SOURCE_REPO&&path.resolve(process.env.VM_ATLAS_SOURCE_REPO),path.resolve(atlas),
 'Main must select the explicit new Atlas source repository');

// The helper validates all default-pin documents and the clean exact Atlas tree.
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(
 path.join(website,'tests/current-atlas-delivery.mjs')).href);
const pin=validateCurrentAtlasDelivery();
assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
assert.equal(path.resolve(currentAtlasDeliveryRoot()),path.resolve(atlas));
assert.equal(pin.runtimeSources['head-neck'],source);
for(const module of ['shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[module],source);
const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).toString().trim();
assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
assert.equal(git('status','--porcelain','--untracked-files=all'),'');

const review=json(path.join(website,'atlas-review/manifest.json'));
const previous=json(path.join(parent,'atlas-review/manifest.json'));
const binding=json(path.join(website,'atlas-review/integration-inputs.json'));
const priorBinding=json(path.join(parent,'atlas-review/integration-inputs.json'));
assert.equal(previous.files.length,1610);assert.equal(priorBinding.inputs.length,1814);
assert.equal(review.revision,source);assert.equal(review.files.length,pin.reviewSourceFiles);
assert.equal(binding.sourceCommit,source);assert.equal(binding.sha256,pin.reviewIntegration);
assert.equal(sha(Buffer.from(JSON.stringify(binding.inputs))),pin.reviewIntegration);
assert.equal(new Set(binding.inputs.map(row=>row.path)).size,binding.inputs.length);
const prior=new Map(previous.files.map(row=>[row.path,row]));
const current=new Map(review.files.map(row=>[row.path,row]));
assert.equal(prior.size,previous.files.length);assert.equal(current.size,review.files.length);
const changed=new Map(Object.entries({
 'app/body-content.ts':{
  before:['a4685fc37cf77c65d8544d8e231ff7087bbddcd6401e0dcca2eb2b6de6854019','a4685fc37cf77c65d8544d8e231ff7087bbddcd6401e0dcca2eb2b6de6854019'],
  after:['af999bbdc4dc5336f61c92ca23173f0ab47475fa54ee9eaa2756a549814adef3','af999bbdc4dc5336f61c92ca23173f0ab47475fa54ee9eaa2756a549814adef3']},
 'content/body-renderer-revision.json':{
  before:['6f2e624822cb6fd7316b00f6d93deda40d5155e724d404b316f286ba47159ef2','88d201f6e358220ae55b594c68867808cec0e749eb713b3375167cb507628bc3'],
  after:['f60eaaee0e3c7d41a7a0bb443e3f5bc3a57e6f06aa2578c923e69e9ce8081a7c','e4ca470a2a98c3b0d3032eb65b1bef66cf0272fe1c205238ee21a8db8dd2f9f9']},
 'content/body-review-display-pins.json':{
  before:['e4156c84705cfd95f8a1fe46f6f9abce0c1da198283b9241985a2bbe1379e330','e4156c84705cfd95f8a1fe46f6f9abce0c1da198283b9241985a2bbe1379e330'],
  after:['52511d9a079fba2f98fb61aa41603323b28e4a7b4aa70e8010d9ed1e8c9d1552','52511d9a079fba2f98fb61aa41603323b28e4a7b4aa70e8010d9ed1e8c9d1552']},
 'content/regional-teaching/abdomen.json':{
  before:['aee2a6bf8d6f88e8129de039fb898f0ffe2d307c985ed8bbeaa0e8cfe9d1b5a5','aee2a6bf8d6f88e8129de039fb898f0ffe2d307c985ed8bbeaa0e8cfe9d1b5a5'],
  after:['2c7b1f8d2f158ef50d0a65ebe5afc6d588385bb1c6ae84540270e7acfa6a464d','2c7b1f8d2f158ef50d0a65ebe5afc6d588385bb1c6ae84540270e7acfa6a464d']},
}));
const reviewRevisionPath='content/review-revisions.json';
const reviewRevisionIdentity={
 source:'3d58dee8ecaa2419330f70bc1f3846ced39277a282591ac8cbb96628ec2910f8',
 before:'a7664ada32d3de718221a80d13f0ed0adcbc0e8d806ca553433585623be01daf',
 after:'1440a29cb56209f0f6efaeec1cc1a359869ebbd53957f9a81068754ca195d9c6',
};
const sourceChangedPaths=[...changed.keys()].sort();
const importedChangedPaths=[...sourceChangedPaths,reviewRevisionPath].sort();
const importResultPath='F:/VisibleMedicine/staging/20261025-abdominal-us-website/checks/import-attempt-1/RESULT.json';
assert.equal(sha(read(importResultPath)),'ca19bdb795ea052db329be09143eade0d47a4c707febf77d8c3786195a98bd7f');
const importResult=json(importResultPath);
assert.equal(importResult.passing,true);assert.equal(importResult.phase,'import');
assert.equal(importResult.sourceHead,source);
assert.deepEqual([...importResult.imported.changed].sort(),sourceChangedPaths);
assert.deepEqual([...importResult.imported.added].sort(),[
 'content/abdominal-arterial-ultrasound.ts','lib/abdominal-arterial-ultrasound.ts']);
assert.equal(importResult.imported.allOldSourcePathsRetained,true);
assert.equal(importResult.imported.allCommittedNativeAndAdaptedBytesVerified,true);
assert.equal(importResult.changedAuthored.length,0);
assert.equal(importResult.privateDecisionsReadOrMigrated,false);
const buildResultPath='F:/VisibleMedicine/staging/20261025-abdominal-us-website/checks/review-build-attempt-1/RESULT.json';
assert.equal(sha(read(buildResultPath)),'5fda33ebf57d772726a00d7d3c7c335269c2d1c5234cd01cb8527c1776a92a3d');
const buildResult=json(buildResultPath);
assert.equal(buildResult.passing,true);
assert.equal(buildResult.stockCoverageBindProductionViewerReviewAndProjectionExecuted,true);
assert.equal(buildResult.details.reviewSourceFiles,pin.reviewSourceFiles);
assert.equal(buildResult.details.protectedIntegrationInputs,binding.inputs.length);
assert.equal(buildResult.details.integrationSha256,pin.reviewIntegration);
assert.equal(buildResult.details.sourceRevisionFormulasAndShoulderOriginalTracksPreserved,true);
assert.equal(buildResult.privateDecisionsReadOrMigrated,false);
const sourceBytes=p=>execFileSync('git',['show',`${source}:${p}`],{cwd:atlas,windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}});
const oldSourceBytes=p=>execFileSync('git',['show',`${oldSource}:${p}`],{cwd:atlas,windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}});
const actualSourceChanges=[],actualImportedChanges=[];
for(const [p,row]of prior){
 const now=current.get(p);assert(now,`Removed Review source: ${p}`);
 assert(!path.isAbsolute(p)&&p.split('/').every(part=>part&&part!=='.'&&part!=='..'),`Unsafe Review path: ${p}`);
 const before=read(path.join(parent,'atlas-review',p));
 const after=read(path.join(website,'atlas-review',p));
 assert.equal(sha(before),row.importedSha256,`Parent imported bytes: ${p}`);
 assert.equal(sha(after),now.importedSha256,`Current imported bytes: ${p}`);
 if(now.sourceSha256!==row.sourceSha256)actualSourceChanges.push(p);
 if(now.importedSha256!==row.importedSha256)actualImportedChanges.push(p);
 const intentional=changed.get(p);
 if(intentional){
  assert.deepEqual([row.sourceSha256,row.importedSha256],intentional.before,`Parent identity: ${p}`);
  assert.deepEqual([now.sourceSha256,now.importedSha256],intentional.after,`Current identity: ${p}`);
  assert.equal(sha(oldSourceBytes(p)),intentional.before[0],`Parent committed source: ${p}`);
  assert.equal(sha(sourceBytes(p)),intentional.after[0],`New committed source: ${p}`);
  assert.equal(sha(read(path.join(atlas,p))),intentional.after[0],`New working source: ${p}`);
 }else if(p===reviewRevisionPath){
  assert.equal(row.sourceSha256,reviewRevisionIdentity.source);
  assert.equal(now.sourceSha256,reviewRevisionIdentity.source);
  assert.equal(row.importedSha256,reviewRevisionIdentity.before);
  assert.equal(now.importedSha256,reviewRevisionIdentity.after);
  assert.equal(sha(oldSourceBytes(p)),reviewRevisionIdentity.source);
  assert.equal(sha(sourceBytes(p)),reviewRevisionIdentity.source);
  assert.equal(sha(read(path.join(atlas,p))),reviewRevisionIdentity.source);
  const native=JSON.parse(sourceBytes(p));
  assert(!Object.hasOwn(native,'websiteIntegrationSha256'));
  const transformed=(integration)=>{
   const expected=structuredClone(native);
   expected.sourceRevisions ??= structuredClone(expected.revisions);
   expected.websiteIntegrationSha256=integration;
   for(const [id,tracks]of Object.entries(expected.sourceRevisions))
    for(const track of ['geometry','teaching'])
     expected.revisions[id][track]=tracks[track]===null?null:
      sha(Buffer.from(JSON.stringify({source:tracks[track],website:integration})));
   return expected;
  };
  const oldAdapted=JSON.parse(before),newAdapted=JSON.parse(after);
  assert.deepEqual(oldAdapted.sourceRevisions,native.revisions,'Parent original source revisions');
  assert.deepEqual(newAdapted.sourceRevisions,native.revisions,'Current original source revisions');
  assert.deepEqual(oldAdapted,transformed(priorBinding.sha256),'Exact parent binder transform');
  assert.deepEqual(newAdapted,transformed(pin.reviewIntegration),'Exact new binder transform');
 }else{
  assert.equal(now.sourceSha256,row.sourceSha256,`Changed Review source: ${p}`);
  assert.equal(now.importedSha256,row.importedSha256,`Changed Review import: ${p}`);
  assert.deepEqual(after,before,`Changed Review bytes: ${p}`);
 }
}
assert.deepEqual(actualSourceChanges.sort(),sourceChangedPaths,'Exact four native Review source changes');
assert.deepEqual(actualImportedChanges.sort(),importedChangedPaths,'Exact five imported Review changes');
const additions=[...current.keys()].filter(p=>!prior.has(p)).sort();
assert.deepEqual(additions,[
 'content/abdominal-arterial-ultrasound.ts','lib/abdominal-arterial-ultrasound.ts']);
const nativeReceipt=json('F:/VisibleMedicine/staging/20261025-abdominal-arterial-us-native/SOURCE_CANDIDATE.json');
const nativeRows=new Map(nativeReceipt.sourceRows.map(row=>[row.path,row.sha256]));
assert.equal(nativeRows.size,nativeReceipt.sourceRows.length);
for(const [p,identity]of changed)assert.equal(nativeRows.get(p),identity.after[0],
 `Native receipt for changed Review source: ${p}`);
assert.equal(nativeRows.get(reviewRevisionPath),reviewRevisionIdentity.source);
const direct={};
for(const p of additions){
 const fingerprint=nativeRows.get(p);assert.match(fingerprint,/^[a-f0-9]{64}$/);
 const row=current.get(p);assert.equal(row.sourceSha256,fingerprint);assert.equal(row.importedSha256,fingerprint);
 assert.equal(sha(read(path.join(atlas,p))),fingerprint,`Native working source: ${p}`);
 assert.equal(sha(sourceBytes(p)),fingerprint,`Native commit source: ${p}`);
 assert.equal(sha(read(path.join(website,'atlas-review',p))),fingerprint,`Review import: ${p}`);
 const input=binding.inputs.filter(row=>row.path==='atlas-review/'+p);
 assert.equal(input.length,1);assert.equal(input[0].sha256,fingerprint);
 direct[p]=fingerprint;
}
assert.equal(review.files.length,previous.files.length+2,'Exactly two new Review sources');
assert.equal(binding.inputs.length,priorBinding.inputs.length+2,'Exactly two new protected Review inputs');

const one=(text,from,to)=>{
 assert.notEqual(from,to);assert.equal(text.split(from).length,2,`Missing or duplicate exact seam: ${from}`);
 const next=text.replace(from,to);assert.equal(next.replace(to,from),text,'Non-invertible source seam');return next;
};
const oldText=old.toString();let candidate=oldText;
const seams=[
 ["\n assert.equal(CURRENT_ATLAS_REVISION,'"+oldSource+"');",
  "\n assert.equal(CURRENT_ATLAS_REVISION,'"+source+"');"],
 ["\n assert.equal(pin.sourceTree,'"+oldTree+"');",
  "\n assert.equal(pin.sourceTree,'"+tree+"');"],
 ...["'head-neck'",'shoulder',"'lower-limb'","'female-pelvis'"].map(name=>[
  `\n  ${name}:'${oldSource}'`,`\n  ${name}:'${source}'`]),
 ["\n assert.equal(sourceFiles,1610);assert.equal(inputs,1814);assert(artifacts>100);",
  `\n assert.equal(sourceFiles,${pin.reviewSourceFiles});assert.equal(inputs,${binding.inputs.length});assert(artifacts>100);`],
 ["\n const current=read('tests/current-atlas-delivery.test.mjs').toString();",
  "\n const current=read('tests/fixtures/current-atlas-delivery-before-abdominal-us-27b.mjs.raw').toString();"],
];
for(const [from,to]of seams)candidate=one(candidate,from,to);
let newCase=read(path.join(proposal,'successor-case.mjs.raw')).toString();
for(const [key,value]of Object.entries({
 SOURCE:source,TREE:tree,REVIEW_COUNT:pin.reviewSourceFiles,INPUT_COUNT:binding.inputs.length,
 HASH_LIB:direct['lib/abdominal-arterial-ultrasound.ts'],
 HASH_CONTENT:direct['content/abdominal-arterial-ultrasound.ts'],ROOT_HASH:oldRootSha,
})){
 const marker=`@${key}@`;assert(newCase.includes(marker),`Missing successor placeholder: ${key}`);
 newCase=newCase.replaceAll(marker,String(value));
}
assert(!/@[A-Z_]+@/.test(newCase),'Unfilled successor placeholder');
const marker="\ntest('current 27b abdominal ultrasound delivery preserves all 44 predecessor cases'";
assert.equal(candidate.split(marker).length,1);
candidate+=newCase;
assert.equal(candidate.split(marker).length,2,'Exactly one added successor case');
let inverse=candidate.slice(0,candidate.indexOf(marker));
for(const [from,to]of [...seams].reverse())inverse=one(inverse,to,from);
assert.equal(inverse,oldText,'Whole 44-case source inverse');

const fixture='tests/fixtures/current-atlas-delivery-before-abdominal-us-27b.mjs.raw';
const target='tests/current-atlas-delivery.test.mjs';
mkdirSync(path.join(output,'tests/fixtures'),{recursive:true});
writeFileSync(path.join(output,fixture),old,{flag:'wx'});
writeFileSync(path.join(output,target),candidate,{flag:'wx'});
const receipt={schema:'vm-abdominal-us-delivery-successor/1',source,tree,
 baselineCases:44,successorCases:45,rootInverseSha256:oldRootSha,
 reviewSourceFiles:pin.reviewSourceFiles,protectedInputs:binding.inputs.length,
 direct,files:[{path:fixture,sha256:sha(old)},{path:target,sha256:sha(Buffer.from(candidate))}],
 sourceInverse:true,installed:false,clinicalApproval:false};
writeFileSync(path.join(output,'RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({prepared:output,source,cases:45,installed:false})+'\n');
