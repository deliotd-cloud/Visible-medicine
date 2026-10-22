// Pure source-byte and Git-object proof; no website module/test/validator imports.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url));
const root='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/';
const atlas='F:/VisibleMedicine/atlas';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(p);
const json=p=>JSON.parse(read(p));
const git=(revision,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',`${revision}:${path}`],{windowsHide:true,maxBuffer:32e6});
const pin=json(root+'tests/fixtures/current-atlas-delivery.json');
const review=json(root+'atlas-review/manifest.json');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(review.revision,pin.source);
assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const family of ['shoulder','lower-limb','female-pelvis'])
 assert.equal(pin.runtimeSources[family],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const names=[
 ['clinical-review-cardiac-venous-ultrasound.test.ts','6244743f927b0122de884698902df0dcc974eb2eddb29342062251f81bbf4f6d','\r\n'],
 ['clinical-review-central-canal-imaging.test.ts','aa8cffb8e364b7b20aa958bfe0576b99aca3c84e3da50d0d4fe8dfa28b5f62ce','\n'],
 ['clinical-review-central-canal-xray.test.ts','8d233a9e711b0f8fb93002b930dbd6201843363a9ae98d6ddd99c42edfd8887d','\n'],
];
const inverse=(s,from,to,label)=>{
 assert.equal(s.split(from).length,2,'Unique inverse seam: '+label);
 return s.replace(from,to);
};
const undo=(name,changes,eol)=>{
 let code=read(stage+'CODE/tests/'+name).toString('utf8');
 const raw=read(stage+'RAW/tests/'+name),frozen=read(root+'tests/'+name);
 assert.deepEqual(raw,frozen,'Complete raw preimage matches frozen source: '+name);
 assert.equal(sha(raw),names.find(row=>row[0]===name)[1]);
 const nl=x=>x.replaceAll('\n',eol);
 for(const [after,before,label] of changes)code=inverse(code,nl(after),nl(before),label);
 assert.deepEqual(Buffer.from(code),raw,'Complete unique source-byte inverse: '+name);
 assert.equal((read(stage+'CODE/tests/'+name).toString('utf8').match(/\r/g)||[]).length,
  eol==='\r\n'?(read(stage+'CODE/tests/'+name).toString('utf8').match(/\n/g)||[]).length:0,
  'Original EOL convention preserved');
};
undo(names[0][0],[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",'cardiac import'],
 ["  const deliveryPin=validateCurrentAtlasDelivery();\n  assert.equal(revision,deliveryPin.source,'Review remains bound to current Atlas source');\n",'', 'cardiac Review pin'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);','assert.equal(manifest.sourceCommit,revision,name);','cardiac family manifest'],
 ['// retain their pinned family source commits without requiring this teaching in their closure.',
  '// share the source commit, without requiring this teaching in their closure.','cardiac comment'],
],names[0][2]);
undo(names[1][0],[
 ["import {execFileSync} from 'node:child_process';\n",'', 'imaging Git import'],
 ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'', 'imaging pin import'],
 [" const deliveryPin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();\n assert.equal(review.revision,deliveryPin.source,'Review remains bound to current Atlas source');\n",'', 'imaging Review pin'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,review.revision,module);','imaging family manifest'],
 ["   if(regionalModules.has(module)){\n    const familyBytes=execFileSync('git',['--no-replace-objects','-C',sourceRoot,'show',\n     `${deliveryPin.runtimeSources[module]}:${path}`],{windowsHide:true,maxBuffer:32e6});\n    assert.equal(sha(familyBytes),expected,`${module}: exact committed family source ${path}`);\n    assert.equal(input?.sha256,expected,`${module}: ${path}`);\n   }",
  '   if(regionalModules.has(module))assert.equal(input?.sha256,expected,`${module}: ${path}`);','imaging family Git bytes'],
],names[1][2]);
undo(names[2][0],[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",'xray pin import'],
 ['const deliveryPin=validateCurrentAtlasDelivery();\n','', 'xray pin value'],
 ["  assert.equal(liveCommit,deliveryPin.source,'Review remains bound to current Atlas source');\n",'', 'xray Review pin'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);','assert.equal(manifest.sourceCommit,liveCommit,name);','xray family manifest'],
 ["      if(name==='head-neck'||name==='shoulder'){\n        const familySource=committed(deliveryPin.runtimeSources[name],path);\n        assert.equal(input?.sha256,sha(familySource),`${name}: ${path}`);\n      }",
  "      if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,sha(source),`${name}: ${path}`);",'xray family Git bytes'],
],names[2][2]);
for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base=`public/atlas-runtime/${name}/`;
 for(const file of ['manifest.json','source-inputs.json'])
  assert.equal(sha(read(root+base+file)),pin.documents[base+file],`Pinned document: ${base+file}`);
 const manifest=json(root+base+'manifest.json'),inputs=json(root+base+'source-inputs.json');
 assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 for(const path of [
  'content/cardiac-venous-tour-pins.json','content/cardiac-venous-ultrasound.ts','lib/cardiac-venous-ultrasound.ts',
  'content/central-canal-imaging.ts','content/central-canal-imaging-pins.json','lib/central-canal-imaging.ts',
  'content/central-canal-xray.ts','lib/central-canal-xray.ts','app/body-content.ts',
 ]){
  const input=inputs.find(row=>row.path===path);
  if(input)assert.equal(input.sha256,sha(git(pin.runtimeSources[name],path)),`${name}: exact Git source ${path}`);
 }
}
assert.equal(sha(read(root+'atlas-review/manifest.json')),pin.documents['atlas-review/manifest.json']);
assert.equal(sha(read(root+'public/atlas-review-viewer/manifest.json')),pin.documents['public/atlas-review-viewer/manifest.json']);
assert.equal(json(root+'public/atlas-review-viewer/manifest.json').sourceCommit,pin.source);
for(const path of ['content/cardiac-venous-tour-pins.json','content/cardiac-venous-ultrasound.ts','lib/cardiac-venous-ultrasound.ts',
 'content/central-canal-imaging.ts','content/central-canal-imaging-pins.json','lib/central-canal-imaging.ts',
 'content/central-canal-xray.ts','lib/central-canal-xray.ts','app/body-content.ts']){
 const record=review.files.find(row=>row.path===path);
 assert.ok(record,'Review record: '+path);
 assert.equal(record.sourceSha256,sha(git(pin.source,path)),'Current Review Git source: '+path);
}
console.log(JSON.stringify({ok:true,source:pin.source,runtimeSources:pin.runtimeSources,raw:names.map(([name,hash])=>({name,hash}))}));
