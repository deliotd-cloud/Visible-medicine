// Pure-text, complete-buffer inverse proof for the three staged test proposals.
// Does not load website code, run a test, or write any file.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sharedImport="import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
const currentImport="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const sharedRevision="const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';";
const historicalRevision="const historicalRuntimeRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';";
const currentStart=" const pin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;\n assert.equal(pin.source,currentSource);\n";
const cases=[
 {
  name:'clinical-review-regional-muscle-completion-quiz.test.ts',
  preimage:'2a5735e0b62b7845ba73afa18c87a9e6c673dc2959f30abc7111995fe7a9a63e',
  patches:[
   [sharedImport,currentImport],
   [sharedRevision,historicalRevision],
   ["test('twelve regional muscle selections share exact learner and protected Review draft questions',async()=>{\n",
    "test('twelve regional muscle selections share exact learner and protected Review draft questions',async()=>{\n"+currentStart],
   ['assert.equal(manifest.sourceCommit,revision,module);','assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);'],
   ['assert.equal(review.revision,revision);','assert.equal(review.revision,currentSource);'],
   ["assert.deepEqual(git(revision),git(historicalRevision),path+' retains exact 9f quiz source bytes');\n  assert.equal(source.sha256,sha(git(revision)));",
    "assert.deepEqual(git(historicalRuntimeRevision),git(historicalRevision),path+' retains exact 9f quiz source bytes at 190a');\n  assert.deepEqual(git(currentSource),git(historicalRuntimeRevision),path+' current quiz source retains exact historical bytes');\n  assert.equal(source.sha256,sha(git(currentSource)));"],
  ],
 },
 {
  name:'clinical-review-thoracic-eus.test.ts',
  preimage:'ec671a5e732fc1919c746dc9ffd79b8b26e622ac971289976039733e813e89ca',
  patches:[
   ["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';",
    "import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
   [sharedRevision,historicalRevision],
   ["test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{\n const sourceRoot=checkedAtlasSourceRepo(revision);",
    "test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{\n"+currentStart+" const sourceRoot=checkedAtlasSourceRepo(currentSource);"],
   ["const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);",
    "const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(currentSource);"],
   ['assert.equal(review.revision,revision);','assert.equal(review.revision,currentSource);'],
   ["assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);",
    "assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);\n  assert.equal(sha(execFileSync('git',['show',historicalRuntimeRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact 190a source '+path);\n  assert.equal(sha(execFileSync('git',['show',currentSource+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact current source '+path);"],
   ['assert.equal(manifest.sourceCommit,revision,module);','assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);'],
   ['assert.equal(viewer.sourceCommit,revision);','assert.equal(viewer.sourceCommit,currentSource);'],
  ],
 },
 {
  name:'clinical-review-upper-limb-completion-quiz.test.ts',
  preimage:'3f8b770eed2ed466fa233a6a93b659ed17fed1e1158cd486df74d0ef66fc71d3',
  patches:[
   [sharedImport,currentImport],
   [sharedRevision,historicalRevision],
   ["test('ten upper-limb selections share exact learner and protected Review draft questions',async()=>{\n",
    "test('ten upper-limb selections share exact learner and protected Review draft questions',async()=>{\n"+currentStart],
   ['assert.equal(manifest.sourceCommit,revision,module);','assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);'],
   ['assert.equal(review.revision,revision);','assert.equal(review.revision,currentSource);'],
   ["const current=committed(revision,path);\n  assert.deepEqual(current,committed(historicalRevision,path),path+' exact 9f quiz source');",
    "const historicalRuntime=committed(historicalRuntimeRevision,path);\n  assert.deepEqual(historicalRuntime,committed(historicalRevision,path),path+' exact 9f quiz source at 190a');\n  const current=committed(currentSource,path);\n  assert.deepEqual(current,historicalRuntime,path+' current quiz source retains exact historical bytes');"],
   ["const currentDispatch=sha(committed(revision,'app/body-content.ts'));\n assert.equal(currentDispatch,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');",
    "assert.equal(sha(committed(historicalRuntimeRevision,'app/body-content.ts')),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n const currentDispatch=sha(committed(currentSource,'app/body-content.ts'));\n assert.equal(currentDispatch,'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');"],
  ],
 },
];

for(const item of cases){
 const original=readFileSync(root+'raw-preimages/'+item.name);
 const proposed=readFileSync(root+'tests/'+item.name);
 assert.equal(sha(original),item.preimage,item.name+' raw preimage hash');
 const source=original.toString('utf8');
 assert.deepEqual(Buffer.from(source,'utf8'),original,item.name+' UTF-8 roundtrip');
 const eol=source.includes('\r\n')?'\r\n':'\n';
 assert(!source.includes(eol==='\r\n'?'\n\n':'\r\n'),item.name+' mixed line endings');
 let rebuilt=source;
 for(const [oldText,newText] of item.patches){
  const old=oldText.replaceAll('\n',eol),next=newText.replaceAll('\n',eol);
  const first=rebuilt.indexOf(old);
  assert(first>=0,item.name+' missing exact patch anchor: '+old.slice(0,80));
  assert.equal(rebuilt.indexOf(old,first+old.length),-1,item.name+' patch anchor not unique');
  rebuilt=rebuilt.slice(0,first)+next+rebuilt.slice(first+old.length);
 }
 assert.deepEqual(Buffer.from(rebuilt,'utf8'),proposed,item.name+' complete proposed buffer differs from allowed patches');
 console.log(item.name+' original='+sha(original)+' proposed='+sha(proposed)+' exact-inverse=PASS');
}
