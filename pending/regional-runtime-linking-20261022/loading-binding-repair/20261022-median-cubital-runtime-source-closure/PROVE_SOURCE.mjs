import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-median-cubital-runtime-source-closure';
const previous='F:/VisibleMedicine/staging/20261022-current-head-entrypoint-followups';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const atlas='F:/VisibleMedicine/atlas';
const file='tests/clinical-review-median-cubital-xray.test.ts';
const read=path=>readFileSync(path);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const once=(text,after,before)=>{
  assert.equal(text.split(after).length,2,`exactly one seam: ${after.slice(0,72)}`);
  return text.replace(after,before);
};
const raw=read(`${stage}/RAW/${file}`),code=read(`${stage}/CODE/${file}`);
const v5=read(`${previous}/CODE/${file}`),original=read(`${previous}/RAW/${file}`);
const helperRaw=read(`${stage}/RAW/tests/batch-c-role-inverse.mjs`);
const helperCode=read(`${stage}/CODE/tests/batch-c-role-inverse.mjs`);
assert.deepEqual(helperRaw,read(`${website}/tests/batch-c-role-inverse.mjs`),'V6 Batch-C helper preimage');
assert.equal(sha(helperRaw),'595daaba750d0f6d6a13aa16986ec47cfb2e6dc188c5328bc808ef05417a101b');
let helperRestored=helperCode.toString();
helperRestored=once(helperRestored,
 "const medianRuntimeClosed='d03860ddeaac152fd082530c5661b79076279508a0f67cb308d3cb9de81ebb09';\n",'');
const helperStart='function restoreV6Median(bytes){',helperEnd='function restoreV5LimbNerve(bytes){';
assert.equal(helperRestored.split(helperStart).length,2);
assert.equal(helperRestored.split(helperEnd).length,2);
helperRestored=helperRestored.slice(0,helperRestored.indexOf(helperStart))+
  helperRestored.slice(helperRestored.indexOf(helperEnd));
helperRestored=once(helperRestored,
 " if(name==='clinical-review-median-cubital-xray.test.ts'&&sha(currentBytes)===medianRuntimeClosed)\n  currentBytes=restoreV6Median(currentBytes);\n",'');
assert.deepEqual(Buffer.from(helperRestored),helperRaw,'whole helper CODE→V6 predecessor');
assert.deepEqual(raw,read(`${website}/${file}`),'V6 frozen candidate preimage');
assert.deepEqual(raw,v5,'V6 median source equals selected V5 predecessor');
let restored=code.toString();
restored=once(restored,
`    for(const name of ['head-neck','shoulder']){
      const runtimeSource=committed(current.runtimeSources[name],path);
      assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
        sha(runtimeSource),\`\${name}: \${path} input at its runtime source\`);
    }`,
`    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(currentSource),\`\${name}: \${path} input\`);`);
restored=once(restored,
`    const source=committed(revision,path),runtimeSource=committed(current.runtimeSources[name],path);
    const catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(runtimeSource),\`\${name}: catalog input at its runtime source\`);
    assert.deepEqual(runtimeSource,source,\`\${name}: historical catalog held at the runtime source\`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),\`\${name}: independent catalog\`);
    assert.equal(norm(source),norm(committed(parent,path)),\`\${name}: original specimen source\`);`,
`    const source=committed(revision,path),catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),\`\${name}: catalog input\`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),\`\${name}: independent catalog\`);
    assert.equal(norm(source),norm(committed(parent,path)),\`\${name}: original specimen source\`);`);
assert.deepEqual(Buffer.from(restored),v5,'whole CODE→V6→V5 predecessor');
assert.equal(sha(original),'211e92a61e4e9b7298163c20b90b04b333e9ea741654dfbada106c9537864b1f');
const {restorePriorBatchCRole}=await import(pathToFileURL(`${previous}/CODE/tests/batch-c-role-inverse.mjs`).href);
const prior=restorePriorBatchCRole('clinical-review-median-cubital-xray.test.ts',v5,
  {readPrior:()=>read(`${website}/tests/fixtures/batch-c-role-prior/clinical-review-median-cubital-xray.test.ts.raw`)});
const inverse=JSON.parse(read(`${website}/tests/fixtures/clinical-epoch-batch-c-original/inverse-hunks.json`));
const median=inverse.files.find(item=>item.name==='clinical-review-median-cubital-xray.test.ts');
assert(median);assert.equal(median.hunks.length,5);
let originalText=prior.toString().replaceAll('\r\n','\n');
for(const {before,after} of [...median.hunks].reverse())originalText=once(originalText,after,before);
assert.equal(originalText,
  read(`${website}/tests/fixtures/clinical-epoch-batch-c-original/clinical-review-median-cubital-xray.test.ts.raw`).toString().replaceAll('\r\n','\n'),
  'whole V5→prior→original historical test');
const proposedHelper=await import(pathToFileURL(`${stage}/CODE/tests/batch-c-role-inverse.mjs`).href);
assert.deepEqual(proposedHelper.batchCRoleNames,
  (await import(pathToFileURL(`${website}/tests/batch-c-role-inverse.mjs`).href)).batchCRoleNames,
  'same six Batch-C cases');
const proposedPrior=proposedHelper.restorePriorBatchCRole('clinical-review-median-cubital-xray.test.ts',code,
  {readPrior:()=>read(`${website}/tests/fixtures/batch-c-role-prior/clinical-review-median-cubital-xray.test.ts.raw`)});
assert.deepEqual(proposedPrior,prior,'actual proposed helper CODE→V6→V5→prior');
assert.throws(()=>proposedHelper.restorePriorBatchCRole('clinical-review-median-cubital-xray.test.ts',
  Buffer.from(code.toString().replace('sha(runtimeSource),','sha(currentSource),')),
  {readPrior:()=>read(`${website}/tests/fixtures/batch-c-role-prior/clinical-review-median-cubital-xray.test.ts.raw`)}),
  'new CODE mutation refused by actual proposed helper');
const regional=await import(pathToFileURL(`${website}/tests/regional-tour-role-inverse.mjs`).href);
const witness=read(`${website}/tests/clinical-epoch-batch-c-originals.test.mjs`).toString();
const expected=new Map([...witness.matchAll(/\['([^']+)', \['([a-f0-9]{64})', '([a-f0-9]{64})'\]\]/g)]
 .map(([,name,originalHash,priorHash])=>[name,{originalHash,priorHash}]));
assert.equal(expected.size,8,'all eight frozen original test roles');
assert.deepEqual([...proposedHelper.batchCRoleNames,...regional.regionalTourRoleNames.filter(name=>expected.has(name))].sort(),
  [...expected.keys()].sort(),'complete eight-role virtual graph');
for(const entry of inverse.files){
 const name=entry.name;
 const current=name==='clinical-review-median-cubital-xray.test.ts'?code:read(`${website}/tests/${name}`);
 const frozen=regional.regionalTourRoleNames.includes(name)
  ?regional.restorePriorRegionalTourRole(name,current)
  :proposedHelper.restorePriorBatchCRole(name,current,
    {readPrior:()=>read(`${website}/tests/fixtures/batch-c-role-prior/${name}.raw`)});
 assert.equal(sha(frozen),expected.get(name).priorHash,`${name}: prior full body`);
 const rawOriginal=read(`${website}/tests/fixtures/clinical-epoch-batch-c-original/${name}.raw`);
 assert.equal(sha(rawOriginal),expected.get(name).originalHash,`${name}: original full body`);
 let body=frozen.toString().replaceAll('\r\n','\n');
 for(const {before,after} of [...entry.hunks].reverse())body=once(body,after,before);
 assert.equal(body,rawOriginal.toString().replaceAll('\r\n','\n'),`${name}: all original assertions`);
 const firstAfter=entry.hunks[0].after,match=/[A-Za-z0-9]/.exec(firstAfter);
 assert(match,`${name}: mutation probe`);
 const changed=firstAfter.slice(0,match.index)+(match[0]==='X'?'Y':'X')+firstAfter.slice(match.index+1);
 assert.throws(()=>{
  let mutated=frozen.toString().replaceAll('\r\n','\n').replace(firstAfter,changed);
  for(const {before,after} of [...entry.hunks].reverse())mutated=once(mutated,after,before);
 },`${name}: original-body mutation refused`);
}

const pin=JSON.parse(read(`${website}/tests/fixtures/current-atlas-delivery.json`));
const review=JSON.parse(read(`${website}/atlas-review/manifest.json`));
assert.equal(git('rev-parse','HEAD').toString().trim(),pin.source);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),pin.sourceTree);
assert.equal(review.revision,pin.source);
const rows=[];
for(const [name,paths] of [
  ['head-neck',['integration/head-neck/main.tsx','app/body-content.ts','content/median-cubital-xray-pins.json','content/median-cubital-xray.ts','lib/median-cubital-xray.ts']],
  ['shoulder',['integration/shoulder/main.tsx','app/body-content.ts','content/median-cubital-xray-pins.json','content/median-cubital-xray.ts','lib/median-cubital-xray.ts']],
  ['lower-limb',['integration/lower-limb/main.tsx','public/models/um-limb/catalog.json']],
  ['female-pelvis',['integration/female-pelvis/main.tsx','public/models/hra-pelvis/catalog.json']],
]){
  const manifest=JSON.parse(read(`${website}/public/atlas-runtime/${name}/manifest.json`));
  const inputs=JSON.parse(read(`${website}/public/atlas-runtime/${name}/source-inputs.json`));
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name],`${name}: independent runtime source`);
  for(const path of paths){
    const matches=inputs.filter(row=>row.path===path);
    assert.equal(matches.length,1,`${name}: one checked row ${path}`);
    const expected=sha(git('show',`${manifest.sourceCommit}:${path}`));
    assert.equal(matches[0].sha256,expected,`${name}: source input ${path}`);
    assert.throws(()=>assert.equal('0'.repeat(64),expected),`${name}: forged source row refused`);
    rows.push({name,path,source:manifest.sourceCommit,sha256:expected});
  }
}
for(const path of ['app/body-content.ts','content/median-cubital-xray-pins.json',
  'content/median-cubital-xray.ts','lib/median-cubital-xray.ts']){
  const matches=review.files.filter(row=>row.path===path);
  assert.equal(matches.length,1,`Review one checked row ${path}`);
  assert.equal(matches[0].sourceSha256,sha(git('show',`${pin.source}:${path}`)),`Review ${path}`);
  assert.equal(matches[0].importedSha256,sha(read(`${website}/atlas-review/${path}`)),`Review imported ${path}`);
  assert.throws(()=>assert.equal('0'.repeat(64),matches[0].sourceSha256),`Review ${path}: forged source refused`);
}
assert.equal(rows.find(row=>row.name==='head-neck'&&row.path==='app/body-content.ts').sha256,
  '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
assert.equal(rows.find(row=>row.name==='shoulder'&&row.path==='app/body-content.ts').sha256,
  '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
assert.throws(()=>assert.equal(
  rows.find(row=>row.name==='shoulder'&&row.path==='app/body-content.ts').sha256,
  sha(git('show',`${pin.source}:app/body-content.ts`))),
  'Review epoch presented as shoulder runtime source refused');
const mutate=code.toString().replace('sha(runtimeSource),\`\${name}: \${path} input at its runtime source\`)',
  'sha(currentSource),\`\${name}: \${path} input at its runtime source\`)');
assert.notEqual(mutate,code.toString());
assert.throws(()=>{
  let text=mutate;
  text=once(text,`    for(const name of ['head-neck','shoulder']){
      const runtimeSource=committed(current.runtimeSources[name],path);
      assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
        sha(runtimeSource),\`\${name}: \${path} input at its runtime source\`);
    }`, '');
},'altered source binding refuses inverse');
console.log(JSON.stringify({pass:true,raw:sha(raw),code:sha(code),helperRaw:sha(helperRaw),helperCode:sha(helperCode),
  v5:sha(v5),prior:sha(prior),original:sha(original),eightOriginalBodies:true,
  rows:rows.length,reviewRows:4,headBody:rows.find(row=>row.name==='head-neck'&&row.path==='app/body-content.ts').sha256,
  shoulderBody:rows.find(row=>row.name==='shoulder'&&row.path==='app/body-content.ts').sha256}));
