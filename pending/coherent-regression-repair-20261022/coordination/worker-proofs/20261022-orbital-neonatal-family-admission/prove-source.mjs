import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const stage=new URL('.',import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,match=>match.slice(1));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/';
const atlas='F:/VisibleMedicine/atlas';
const head='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const older='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const roleImport=['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'];
const roleConst=['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''];
const seams={
 'neonatal-cranial-us':[
  roleImport,roleConst,
  ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,revision,name'],
  ['sha(committed(runtimeSources[name],path)),`${name}: entrypoint`','sha(source),`${name}: entrypoint`'],
  ['sha(committed(runtimeSources[name],path)),`${name}: ${path} input`','sha(source),`${name}: ${path} input`'],
  ['sha(committed(runtimeSources[name],path)),`${name}: independent catalog input`','sha(source),`${name}: independent catalog input`'],
 ],
 'orbital-apex-ct':[
  roleImport,roleConst,
  ['built.sourceCommit,runtimeSources[name],name','built.sourceCommit,revision,name'],
 ],
 'orbital-ring-ct':[
  roleImport,roleConst,
  ['learner.manifest.sourceCommit,runtimeSources[learner.name],learner.name','learner.manifest.sourceCommit,revision,learner.name'],
  ['input?.sha256,sha(git(runtimeSources[name],path)),`${name}: ${path}`','input?.sha256,digest,`${name}: ${path}`'],
 ],
 'orbital-sensory-mri':[
  roleImport,roleConst,
  ['manifest.sourceCommit,runtimeSources[module],module','manifest.sourceCommit,revision,module'],
  ['input?.sha256,sha(git(runtimeSources[module],path)),`${module}: ${path}`','input?.sha256,expected,`${module}: ${path}`'],
 ],
 'short-ciliary-quiz':[
  ["import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
  ["const liveCommit=CURRENT_ATLAS_REVISION; // Current committed, integrated Review source revision.","const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9'; // Current committed, integrated source revision."],
  roleConst,
  ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,liveCommit,name'],
  ['input?.sha256,sha(committed(runtimeSources[name],path)),`${name}: ${path}`','input?.sha256,sha(source),`${name}: ${path}`'],
 ],
};

// The actual pure complete-byte inverse adapter; all success and mutation calls use it.
export function reconstruct(candidate,changes,originalHash){
 let text=candidate;
 for(const [now,before] of changes){
  assert.equal(text.split(now).length,2,`non-unique inverse seam: ${now}`);
  text=text.replace(now,before);
 }
 assert.equal(sha(Buffer.from(text)),originalHash,'complete recovered original SHA-256');
 return Buffer.from(text);
}

const hashes=[];
for(const [name,changes] of Object.entries(seams)){
 const file=`clinical-review-${name}.test.ts`;
 const original=readFileSync(`${stage}original/tests/${file}`);
 const proposal=readFileSync(`${stage}proposal/tests/${file}`);
 assert.deepEqual(original,readFileSync(`${website}tests/${file}`),`${file}: frozen full RAW preimage`);
 assert.deepEqual(reconstruct(proposal.toString('utf8'),changes,sha(original)),original,`${file}: exact complete inverse`);
 assert.throws(()=>reconstruct(proposal.toString('utf8')+'FOREIGN',changes,sha(original)),`${file}: appended mutant refusal`);
 const last=changes.at(-1)[0];
 const changed=proposal.toString('utf8').replace(last,last+'FOREIGN');
 assert.notEqual(changed,proposal.toString('utf8'));
 assert.throws(()=>reconstruct(changed,changes,sha(original)),`${file}: seam mutant refusal`);
 hashes.push({file,original:sha(original),proposal:sha(proposal),seams:changes.length});
}

const pin=JSON.parse(readFileSync(`${website}tests/fixtures/current-atlas-delivery.json`));
assert.equal(pin.source,head);
assert.deepEqual(pin.runtimeSources,{'head-neck':head,shoulder:older,'lower-limb':older,'female-pelvis':older});
const review=JSON.parse(readFileSync(`${website}atlas-review/manifest.json`));
const viewer=JSON.parse(readFileSync(`${website}public/atlas-review-viewer/manifest.json`));
assert.equal(review.revision,head);
assert.equal(viewer.sourceCommit,head);
const selected=[
 'content/neonatal-cranial-ultrasound-pins.json','content/neonatal-cranial-ultrasound.ts',
 'lib/neonatal-cranial-ultrasound.ts','app/body-content.ts',
 'integration/head-neck/main.tsx','integration/shoulder/main.tsx',
 'integration/lower-limb/main.tsx','integration/female-pelvis/main.tsx',
 'public/models/um-limb/catalog.json','public/models/hra-pelvis/catalog.json',
 'content/orbital-nerve-mri-pins.json','content/orbital-apex-ct.ts','lib/orbital-apex-ct.ts',
 'content/orbital-support-mri-pins.json','content/orbital-ring-ct.ts','lib/orbital-ring-ct.ts',
 'content/orbital-sensory-mri.ts','lib/orbital-sensory-mri.ts',
 'content/orbital-nerve-quiz-pins.json','content/short-ciliary-quiz.ts','lib/short-ciliary-quiz.ts',
];
let authenticated=0;
for(const [name,revision] of Object.entries(pin.runtimeSources)){
 const base=`${website}public/atlas-runtime/${name}/`;
 const manifest=JSON.parse(readFileSync(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,revision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 for(const path of selected){
  const row=inputs.find(input=>input.path===path);
  if(!row)continue;
  const bytes=execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(row.sha256,sha(bytes),`${name}: exact Git-family bytes: ${path}`);
  assert.notEqual(row.sha256,sha(Buffer.concat([bytes,Buffer.from('FOREIGN')])),`${name}: changed source refused`);
  authenticated++;
 }
}
assert(authenticated>0);
console.log(JSON.stringify({hashes,authenticated,review:head,older,sourceOnly:true},null,2));
