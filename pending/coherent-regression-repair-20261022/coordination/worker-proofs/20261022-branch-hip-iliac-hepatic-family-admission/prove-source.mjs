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
const rows={
 'forearm-branch':[
  ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
  ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
  ['assert.equal(manifest.sourceCommit,runtimeSources[name],name);','assert.equal(manifest.sourceCommit,liveCommit,name);'],
  ['input?.sha256,sha(committed(runtimeSources[name],path))','input?.sha256,digest'],
  ['input.sha256,sha(committed(runtimeSources[name],input.path)),`${name}: family exact source ${input.path}`','input.sha256,sha(committed(liveCommit,input.path)),`${name}: current exact source ${input.path}`'],
 ],
 'hepatic-arterial':[
  ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
  ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
  ['assert.equal(manifest.sourceCommit,runtimeSources[name],name);','assert.equal(manifest.sourceCommit,revision,name);'],
 ],
 'hip-muscle':[
  ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
  ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
  ['item.manifest.sourceCommit,runtimeSources[item.name]','item.manifest.sourceCommit,liveCommit'],
  ['input?.sha256,sha(committed(runtimeSources[name],path))','input?.sha256,digest'],
  ['input.sha256,sha(committed(runtimeSources[name],input.path)),name+\': family clean source input\'','input.sha256,sha(committed(liveCommit,input.path)),name+\': current clean source input\''],
 ],
 'iliac-venous':[
  ["current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9'"],
  ['runtime.sourceCommit,current.runtimeSources[runtimeNames[index]]','runtime.sourceCommit,current.source'],
 ],
 'intracranial-arterial':[
  ["current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9'"],
  ['for(const [index,runtime] of runtimes.entries()){','for(const runtime of runtimes){'],
  ['runtime.sourceCommit,current.runtimeSources[runtimeNames[index]]','runtime.sourceCommit,current.source'],
 ],
};

// This is the actual pure inverse adapter, called on each complete proposed source.
export function reconstruct(candidate,seams,expectedHash){
 let text=candidate;
 for(const [now,before] of seams){
  assert.equal(text.split(now).length,2,`non-unique inverse seam: ${now}`);
  text=text.replace(now,before);
 }
 assert.equal(sha(Buffer.from(text)),expectedHash,'complete original byte hash');
 return text;
}

const hashes=[];
for(const [name,seams] of Object.entries(rows)){
 const file=`clinical-review-${name}-xray.test.ts`;
 const original=readFileSync(`${stage}original/tests/${file}`);
 const proposal=readFileSync(`${stage}proposal/tests/${file}`);
 const frozen=readFileSync(`${website}tests/${file}`);
 assert.deepEqual(original,frozen,`${file}: complete frozen RAW preimage`);
 assert.deepEqual(Buffer.from(reconstruct(proposal.toString('utf8'),seams,sha(original))),original,`${file}: complete exact inverse`);
 assert.throws(()=>reconstruct(proposal.toString('utf8')+'foreign',seams,sha(original)),`${file}: appended mutant refused`);
 const mutated=proposal.toString('utf8').replace(seams.at(-1)[0],seams.at(-1)[0]+'FOREIGN');
 assert.throws(()=>reconstruct(mutated,seams,sha(original)),`${file}: changed seam refused`);
 hashes.push({file,original:sha(original),proposal:sha(proposal),seams:seams.length});
}

const pin=JSON.parse(readFileSync(`${website}tests/fixtures/current-atlas-delivery.json`));
assert.equal(pin.source,head);
assert.deepEqual(pin.runtimeSources,{'head-neck':head,shoulder:older,'lower-limb':older,'female-pelvis':older});
for(const [name,revision] of Object.entries(pin.runtimeSources)){
 const manifest=JSON.parse(readFileSync(`${website}public/atlas-runtime/${name}/manifest.json`));
 assert.equal(manifest.sourceCommit,revision);
}
const review=JSON.parse(readFileSync(`${website}atlas-review/manifest.json`));
const viewer=JSON.parse(readFileSync(`${website}public/atlas-review-viewer/manifest.json`));
assert.equal(review.revision,head);
assert.equal(viewer.sourceCommit,head);
const selected=[
 'content/forearm-arterial-imaging-pins.json','content/forearm-arterial-ct-pins.json',
 'content/elbow-arterial-ct-pins.json','content/forearm-branch-xray.ts',
 'lib/forearm-branch-xray.ts','app/body-content.ts',
 'content/abdominal-arterial-pins.json','content/hepatic-arterial-xray.ts',
 'lib/hepatic-arterial-xray.ts','content/hip-imaging-pins.json',
 'lib/hip-muscle-xray.ts','content/iliac-venous-imaging-pins.json',
 'content/iliac-venous-xray.ts','lib/iliac-venous-xray.ts',
 'content/cerebral-arterial-quiz-pins.json',
 'public/models/bodyparts3d/cranial-arteries/catalog.json',
 'content/intracranial-arterial-xray.ts','lib/intracranial-arterial-xray.ts',
];
let authenticated=0;
for(const [name,revision] of Object.entries(pin.runtimeSources)){
 const inputs=JSON.parse(readFileSync(`${website}public/atlas-runtime/${name}/source-inputs.json`));
 for(const path of selected){
  const row=inputs.find(input=>input.path===path);
  if(!row)continue;
  const bytes=execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(row.sha256,sha(bytes),`${name}: ${path}: exact family Git bytes`);
  assert.notEqual(sha(Buffer.concat([bytes,Buffer.from('foreign')])),row.sha256,`${name}: ${path}: mutant refused`);
  authenticated++;
 }
}
assert(authenticated>0);
console.log(JSON.stringify({hashes,authenticated,review:head,older,websiteSourceOnly:true},null,2));
