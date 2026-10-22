// Pure source-byte/Git proof; no website test, validator, compiler or model asset is executed/read.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/';
const atlas='F:/VisibleMedicine/atlas';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(p);
const raw=n=>read(stage+'RAW/tests/'+n);
const code=n=>read(stage+'CODE/tests/'+n);
const inverse=(s,a,b,label)=>{assert.equal(s.split(a).length,2,'Unique source inverse: '+label);return s.replace(a,b);};
const names={
 'clinical-review-desktop-study-identity.test.ts':'2a42f352562403b1cee225cc927500cbe2707168ca9b267418941e7d82128a15',
 'clinical-review-guided-learning.test.ts':'51a9cee8891bec49843158d6f34c9070e17456443dceada152014c80f43c8797',
 'clinical-review-digestive-tract-tour.test.ts':'44895bc96595267e82b9ab915bda847b54bc1cef2f9453b99eeac9d70287fc85',
 'clinical-review-facial-bone-xray.test.ts':'8c9cf3f38635d47ac1309dc8e7693f948b04df54840cce7ecb20226b12913247',
 'next-six-admission-contract.test.mjs':'ae1d9bd8bc2d1adb2ddf374c00830fb7f6982518464e38c8443b9a2bb4ee624b',
};
for(const [name,digest] of Object.entries(names)){
 assert.equal(sha(raw(name)),digest,'Frozen preimage hash: '+name);
 assert.deepEqual(raw(name),read(website+'tests/'+name),'Frozen preimage bytes: '+name);
 assert.equal(code(name).includes(13),false,'LF-only source preserved: '+name);
}
let desktop=code('clinical-review-desktop-study-identity.test.ts').toString('utf8');
for(const [a,b,label] of [
 ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'','desktop pin import'],
 ["  const deliveryPin=validateCurrentAtlasDelivery();\n  assert.equal(review.revision,deliveryPin.source,'Review stays bound to current source');\n",'',
  'desktop Review role'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module]);',
  'assert.equal(manifest.sourceCommit,review.revision);','desktop runtime role'],
])desktop=inverse(desktop,a,b,label);
assert.deepEqual(Buffer.from(desktop),raw('clinical-review-desktop-study-identity.test.ts'));
let guided=code('clinical-review-guided-learning.test.ts').toString('utf8');
for(const [a,b,label] of [
 ["import {execFileSync} from 'node:child_process';\n",'','guided Git import'],
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';",'guided pin import'],
 ["  const deliveryPin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string,path:string)=>execFileSync('git',\n    ['--no-replace-objects','-C',sourceRoot,'show',`${revision}:${path}`],\n    {windowsHide:true,maxBuffer:32e6});\n",'',
  'guided strict Git helper'],
 ["  assert.equal(review.revision,deliveryPin.source,'Review stays bound to current source');\n",'',
  'guided Review role'],
 ['assert.equal(learner.sourceCommit,deliveryPin.runtimeSources.shoulder);',
  'assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);','guided family role'],
 ["    assert.equal(entry.sourceSha256,createHash('sha256').update(committed(deliveryPin.source,path)).digest('hex'),\n      `${path}: current Review Git source`);\n    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,\n      createHash('sha256').update(committed(deliveryPin.runtimeSources.shoulder,path)).digest('hex'),\n      `${path}: exact shoulder family Git source`);\n",'',
  'guided independent source roles'],
])guided=inverse(guided,a,b,label);
assert.deepEqual(Buffer.from(guided),raw('clinical-review-guided-learning.test.ts'));
for(const name of [
 'clinical-review-digestive-tract-tour.test.ts',
 'clinical-review-facial-bone-xray.test.ts',
]){
 let text=code(name).toString('utf8');
 text=inverse(text,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'',name+' pin import');
 text=inverse(text,
  " const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(currentRevision,deliveryPin.source,'Review stays bound to current source');\n",'',
  name+' Review role');
 text=inverse(text,'assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
  'assert.equal(manifest.sourceCommit,currentRevision,module);',name+' runtime role');
 assert.deepEqual(Buffer.from(text),raw(name),'Complete original source inverse: '+name);
}
let witness=code('next-six-admission-contract.test.mjs').toString('utf8');
witness=inverse(witness,
 "import {nextSixFamilyNames,restoreNextSixCurrentSource} from './next-six-family-source-adapter.mjs';\n",'',
 'six-case witness import');
witness=inverse(witness,
 " const latest=readFileSync(new URL('./'+name,import.meta.url));\n const admitted=nextSixFamilyNames.includes(name)?restoreNextSixCurrentSource(name,latest):latest;\n const candidate=lf(admitted.toString('utf8'));",
 " const candidate=lf(readFileSync(new URL('./'+name,import.meta.url),'utf8'));",
 'six-case witness composition');
const added="test('two family-source adapters reject unreviewed source and helper edits',()=>{\n";
assert.equal(witness.split(added).length,2,'Unique added refusal test');
assert.ok(witness.endsWith('});\n'),'Complete added refusal test');
witness=witness.slice(0,witness.indexOf(added));
assert.deepEqual(Buffer.from(witness),raw('next-six-admission-contract.test.mjs'),
 'Complete six-case historical witness inverse');
const helper=read(stage+'CODE/tests/next-six-family-source-adapter.mjs');
assert.equal(sha(helper),'3db6a794dd946ccca85227e0faa3f24d617ac19d574ea92154369c4d04b1e8ec');
const actual=await import(new URL('./CODE/tests/next-six-family-source-adapter.mjs',import.meta.url));
assert.deepEqual([...actual.nextSixFamilyNames].sort(),[
 'clinical-review-digestive-tract-tour.test.ts','clinical-review-facial-bone-xray.test.ts']);
for(const name of actual.nextSixFamilyNames){
 const completePrior=read(stage+'CODE/tests/fixtures/next-six-family-current/'+name+'.raw');
 assert.deepEqual(completePrior,raw(name),'Full frozen current fixture: '+name);
 assert.deepEqual(actual.restoreNextSixCurrentSource(name,code(name)),completePrior,
  'Actual authored helper restores complete prior: '+name);
 const current=code(name).toString('utf8');
 const seam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
 assert.equal(current.split(seam).length,2);
 for(const mutant of [current.replace(seam,''),current+seam,current.replace(seam,seam+' /* forged */')])
  assert.throws(()=>actual.restoreNextSixCurrentSource(name,Buffer.from(mutant)),
   'Actual authored helper refuses source mutation: '+name);
}
assert.throws(()=>actual.restoreNextSixCurrentSource('unlisted',Buffer.alloc(0)));
assert.notEqual(sha(Buffer.concat([helper,Buffer.from(' ')])),sha(helper),'Helper mutation fails pinned hash');
const queueHelper=read('F:/VisibleMedicine/staging/20261022-clinical-shared-coronary-admission/proposal/tests/clinical-review-current-admission.mjs');
assert.equal(sha(queueHelper),'181b1df7681ca831a9432559863bc65e7154cd64da8eb8d1686b7108aa56a791');
assert.ok(queueHelper.toString().includes('pin.runtimeSources[name]'),'Queued helper has family manifest role');
const pin=JSON.parse(read(website+'tests/fixtures/current-atlas-delivery.json'));
const review=JSON.parse(read(website+'atlas-review/manifest.json'));
assert.equal(pin.source,review.revision);
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const git=(revision,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',`${revision}:${path}`],
 {windowsHide:true,maxBuffer:32e6});
const guidedPaths=['lib/shoulder-tours.ts','lib/tour-camera.ts','app/shoulder-tour-player.tsx',
 'app/fitted-camera.tsx','lib/guided-playback.ts'];
const featurePaths=['lib/digestive-tract-tour.ts','content/digestive-tract-tour-pins.json','lib/regional-tours.ts',
 'content/facial-bone-xray.ts','lib/facial-bone-xray.ts'];
for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base=`public/atlas-runtime/${name}/`;
 for(const file of ['manifest.json','source-inputs.json'])
  assert.equal(sha(read(website+base+file)),pin.documents[base+file],`Pinned ${base+file}`);
 const manifest=JSON.parse(read(website+base+'manifest.json'));
 const inputs=JSON.parse(read(website+base+'source-inputs.json'));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 for(const path of [...guidedPaths,...featurePaths]){
  const input=inputs.find(x=>x.path===path);
  if(input)assert.equal(input.sha256,sha(git(pin.runtimeSources[name],path)),
   `${name}: exact family Git source ${path}`);
 }
 if(name!=='head-neck')for(const path of ['lib/digestive-tract-tour.ts','content/digestive-tract-tour-pins.json','lib/regional-tours.ts'])
  assert.equal(inputs.find(x=>x.path===path),undefined,`${name}: no root-body tour source ${path}`);
}
for(const path of [...guidedPaths,...featurePaths,'app/atlas-workspace.css']){
 const record=review.files.find(x=>x.path===path);assert(record,path);
 assert.equal(record.sourceSha256,sha(git(pin.source,path)),'Review-current Git source: '+path);
}
assert.equal(JSON.parse(read(website+'public/atlas-review-viewer/manifest.json')).sourceCommit,pin.source);
console.log(JSON.stringify({ok:true,raw:Object.keys(names).length,source:pin.source,
 family:pin.runtimeSources.shoulder,helper:sha(helper)}));
