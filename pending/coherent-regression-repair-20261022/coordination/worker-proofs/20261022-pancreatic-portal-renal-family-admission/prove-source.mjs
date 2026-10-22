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
 'pancreatic-arterial-tour':[
  ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
  roleConst,
  ["json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,runtimeSources[module]","json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,review.revision"],
 ],
 'pancreatic-arterial-xray':[
  roleImport,roleConst,
  ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,revision,name'],
 ],
 'pancreatic-vessel-teaching':[
  ["import {execFileSync} from 'node:child_process';\n",''],
  roleImport,
  [" const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n",''],
  ['learner.sourceCommit,runtimeSources[name]','learner.sourceCommit,review.revision'],
  ["   const familySource=execFileSync('git',['show',`${runtimeSources[name]}:${path}`],\n    {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n   const learnerSourceSha=rawSha(familySource);",
   '   const learnerSourceSha=record.sourceSha256;'],
 ],
 'portal-venous-xray':[
  roleImport,roleConst,
  ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,revision,name'],
  ['// keep independent family commits, without requiring this teaching in their closure.','// share the source commit, without requiring this teaching in their closure.'],
 ],
 'renal-xray':[
  ["import {execFileSync} from 'node:child_process';\n",''],
  ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
  [" const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();\n assert.equal(review.revision,delivery.source);\n",''],
  ['learner.sourceCommit,delivery.runtimeSources[name]','learner.sourceCommit,review.revision'],
  ["   const committed=(revision:string)=>execFileSync('git',['show',`${revision}:${path}`],\n    {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n   assert.equal(record.sourceSha256,rawSha(committed(delivery.source)),`${path}: current Review source`);\n   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,rawSha(committed(delivery.runtimeSources[name])),`${name}: exact family source`);",
   '   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256);'],
 ],
};

// Actual pure adapter used for every complete-source success and mutant call.
export function reconstruct(candidate,changes,originalHash){
 let text=candidate;
 for(const [now,before] of changes){
  assert.equal(text.split(now).length,2,`non-unique inverse seam: ${now}`);
  text=text.replace(now,before);
 }
 const bytes=Buffer.from(text);
 assert.equal(sha(bytes),originalHash,'complete original byte hash');
 return bytes;
}

const hashes=[];
for(const [name,changes] of Object.entries(seams)){
 const file=`clinical-review-${name}.test.ts`;
 const original=readFileSync(`${stage}original/tests/${file}`);
 const proposal=readFileSync(`${stage}proposal/tests/${file}`);
 assert.deepEqual(original,readFileSync(`${website}tests/${file}`),`${file}: complete authentic frozen RAW`);
 assert.deepEqual(reconstruct(proposal.toString('utf8'),changes,sha(original)),original,`${file}: exact complete inverse`);
 assert.throws(()=>reconstruct(proposal.toString('utf8')+'FOREIGN',changes,sha(original)),`${file}: appended mutant refusal`);
 const first=changes[0][0];
 const mutated=proposal.toString('utf8').replace(first,first+'FOREIGN');
 assert.notEqual(mutated,proposal.toString('utf8'));
 assert.throws(()=>reconstruct(mutated,changes,sha(original)),`${file}: changed seam refusal`);
 hashes.push({file,original:sha(original),proposal:sha(proposal),seams:changes.length});
}

const pin=JSON.parse(readFileSync(`${website}tests/fixtures/current-atlas-delivery.json`));
assert.equal(pin.source,head);
assert.deepEqual(pin.runtimeSources,{'head-neck':head,shoulder:older,'lower-limb':older,'female-pelvis':older});
assert.equal(JSON.parse(readFileSync(`${website}atlas-review/manifest.json`)).revision,head);
assert.equal(JSON.parse(readFileSync(`${website}public/atlas-review-viewer/manifest.json`)).sourceCommit,head);
const selected=[
 'lib/pancreatic-arterial-tour.ts','content/pancreatic-arterial-tour-pins.json','lib/regional-tours.ts',
 'content/pancreatic-arterial-xray.ts','lib/pancreatic-arterial-xray.ts',
 'content/pancreatic-vessel-teaching.ts','lib/pancreatic-vessel-teaching.ts',
 'content/abdominal-branch-imaging-pins.json','app/body-content.ts',
 'content/portal-venous-xray.ts','lib/portal-venous-xray.ts',
 'content/abdominal-organ-imaging.ts','lib/abdominal-organ-imaging.ts',
];
let authenticated=0;
for(const [name,revision] of Object.entries(pin.runtimeSources)){
 const base=`${website}public/atlas-runtime/${name}/`;
 assert.equal(JSON.parse(readFileSync(base+'manifest.json')).sourceCommit,revision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 for(const path of selected){
  const row=inputs.find(input=>input.path===path);
  if(!row)continue;
  const bytes=execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(row.sha256,sha(bytes),`${name}: exact family Git bytes: ${path}`);
  assert.notEqual(row.sha256,sha(Buffer.concat([bytes,Buffer.from('FOREIGN')])),`${name}: source mutation refused`);
  authenticated++;
 }
}
assert(authenticated>0);
console.log(JSON.stringify({hashes,authenticated,review:head,older,sourceOnly:true},null,2));
