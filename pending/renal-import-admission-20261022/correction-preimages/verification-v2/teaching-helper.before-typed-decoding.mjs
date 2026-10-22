// Pure exact inverses for the two current-source consumer transitions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const medianPostimageSha='2849d62d65fe498c4378b9705abf8934138dfe5274283c715550182721ed74f4';
const medianPreimageSha='d03860ddeaac152fd082530c5661b79076279508a0f67cb308d3cb9de81ebb09';
const vocalPostimageSha='2a8564df32041f38ab8f22f368491b04b284abb28f9b5eb442c5942a0450a098';
const vocalPreimageSha='569a15c2566b982410be68f9c221f38662518289e9d2b190cf39caf5016ac9e8';
const medianPatch=Buffer.from("diff --git a/tests/clinical-review-median-cubital-xray.test.ts b/tests/clinical-review-median-cubital-xray.test.ts\nindex 1cc25e4..43931c5 100644\n--- a/tests/clinical-review-median-cubital-xray.test.ts\n+++ b/tests/clinical-review-median-cubital-xray.test.ts\n@@ -13,6 +13,9 @@ import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDeli\n const atlas=currentAtlasDeliveryRoot();\n const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\n const completedEpoch='c57449c1107a912442c6b0af23e270df41032522';\n+const preNeckEpoch='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';\n+const neckAuthoredEpoch='da84654113bdd27dbfabd6879d82740c8407f4db';\n+const neckCurrentEpoch='389bd0ca846a42c7f21055f55904bcf5df81a09f';\n const portalTourEpoch='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';\n const parent='d81bbe14def4249d9d081de6a9f9f823e4fad69a';\n const oldCatalog='1191faa89cb7e314200aaa1c935629b7f634842d772b2ae81ce12d24f55bbcb2';\n@@ -80,6 +83,7 @@ const request=(query='')=>new Request('https://review.invalid/api/atlas-review/i\n test('two exact median cubital X-ray drafts reach protected Review and two learner modules', {timeout:180000}, async()=>{\n   const current=validateCurrentAtlasDelivery();\n   assert.equal(current.source,CURRENT_ATLAS_REVISION);\n+  assert.equal(current.source,neckCurrentEpoch,'exact current neck-source delivery');\n   assert.equal(current.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n   assert.equal(git(['rev-parse','HEAD']).toString().trim(),current.source);\n   assert.equal(git(['merge-base',revision,current.source]).toString().trim(),revision);\n@@ -114,7 +118,26 @@ test('two exact median cubital X-ray drafts reach protected Review and two learn\n     const copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);\n     if(path==='app/body-content.ts'){\n       assert.notDeepEqual(currentSource,source,'later teaching source is a declared current epoch');\n-      assert.equal(sha(currentSource),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');\n+      assert.equal(git(['rev-parse',`${neckAuthoredEpoch}^`]).toString().trim(),preNeckEpoch,\n+        'neck teaching directly succeeds the pre-neck source');\n+      assert.equal(git(['rev-parse',`${neckCurrentEpoch}^`]).toString().trim(),neckAuthoredEpoch,\n+        'current display witness directly succeeds neck teaching');\n+      const preNeckSource=committed(preNeckEpoch,path);\n+      assert.equal(sha(preNeckSource),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc',\n+        'exact pre-neck source remains historical evidence');\n+      const currentText=currentSource.toString('utf8');\n+      assert(Buffer.from(currentText,'utf8').equals(currentSource)&&!currentText.includes('\\r'),\n+        'current committed dispatch has lossless LF bytes');\n+      const neckImport=\"import { neckLandmarkXrayLesson } from '../lib/neck-landmark-xray';\\n\";\n+      const neckBranch='  const neckLandmarkXray = neckLandmarkXrayLesson(s, tab);\\n  if (neckLandmarkXray) return neckLandmarkXray;\\n';\n+      assert.equal(currentText.split(neckImport).length,2,'one exact authored neck import');\n+      assert.equal(currentText.split(neckBranch).length,2,'one exact authored neck branch');\n+      assert.deepEqual(Buffer.from(currentText.replace(neckImport,'').replace(neckBranch,'')),\n+        preNeckSource,'whole pre-neck dispatch restored after exact neck inverse');\n+      assert.deepEqual(currentSource,committed(neckAuthoredEpoch,path),\n+        'display witness retained entire authored dispatch');\n+      assert.equal(sha(currentSource),'ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382',\n+        'exact current source after the authenticated neck transition');\n       assert.equal(sha(committed(current.runtimeSources.shoulder,path)),\n         '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',\n         'Earlier shoulder family keeps the prior exact teaching source');\n",'utf8');
const vocalPatch=Buffer.from("diff --git a/tests/clinical-review-vocal-tissue-teaching.test.ts b/tests/clinical-review-vocal-tissue-teaching.test.ts\nindex 8f49841..dfcaf14 100644\n--- a/tests/clinical-review-vocal-tissue-teaching.test.ts\n+++ b/tests/clinical-review-vocal-tissue-teaching.test.ts\n@@ -9,6 +9,9 @@ import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-a\n const sha=(value:unknown):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');\n const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');\n const parentCommit='169e3aef92e866dd98e97f5394c1d2c908268547';\n+const preNeckEpoch='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';\n+const neckAuthoredEpoch='da84654113bdd27dbfabd6879d82740c8407f4db';\n+const neckCurrentEpoch='389bd0ca846a42c7f21055f55904bcf5df81a09f';\n const fmaIds=['FMA46592','FMA46593','FMA55245','FMA55246'];\n const sourceFiles:Record<string,string>={FMA55245:'FJ2805',FMA55246:'FJ2787',FMA46592:'FJ2806',FMA46593:'FJ2788'};\n const tabs=['anatomy','function'] as const;\n@@ -119,8 +122,12 @@ test('head-neck and shoulder learner bundles bind imported vocal source closure'\n  assert.match(review.revision,/^[a-f0-9]{40}$/);\n  assert.notEqual(review.revision,parentCommit);\n  assert.equal(review.revision,pin.source);\n- assert.equal(pin.runtimeSources['head-neck'],'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');\n+ assert.equal(pin.runtimeSources['head-neck'],neckCurrentEpoch,'exact current head-neck learner source');\n  assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n+ const parentOf=(epoch:string)=>execFileSync('git',['rev-parse',`${epoch}^`],\n+  {cwd:atlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim();\n+ assert.equal(parentOf(neckCurrentEpoch),neckAuthoredEpoch,'current witness succeeds neck authoring');\n+ assert.equal(parentOf(neckAuthoredEpoch),preNeckEpoch,'pre-neck vocal source remains historical ancestor');\n  const paths=['content/vocal-tissue-teaching-pins.json','content/vocal-tissue-teaching.ts',\n   'lib/vocal-tissue-teaching.ts','app/body-content.ts'];\n  for(const name of ['head-neck','shoulder']){\n@@ -139,6 +146,21 @@ test('head-neck and shoulder learner bundles bind imported vocal source closure'\n    assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,runtimeHash,name+' '+path);\n    if(name==='head-neck'||path!=='app/body-content.ts')assert.equal(runtimeHash,record.sourceSha256,name+' '+path);\n    else assert.notEqual(runtimeHash,record.sourceSha256,'Historical shoulder body-content retains its own source');\n+   if(path==='app/body-content.ts'){\n+    assert.equal(rawSha(exactSource(preNeckEpoch,path)),\n+     '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc',\n+     'exact pre-neck dispatch remains historical source evidence');\n+    assert.equal(record.sourceSha256,'ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382',\n+     'current Review binds the authored neck dispatch');\n+    if(name==='shoulder')assert.equal(runtimeHash,\n+     '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',\n+     'historical shoulder retains its own complete dispatch');\n+   }else{\n+    assert.deepEqual(exactSource(preNeckEpoch,path),exactSource(pin.source,path),\n+     'whole vocal feature file retained from pre-neck source: '+path);\n+    assert.deepEqual(exactSource(pin.runtimeSources.shoulder,path),exactSource(pin.source,path),\n+     'whole vocal feature file retained in independent shoulder source: '+path);\n+   }\n    if(path==='content/vocal-tissue-teaching-pins.json')assert.equal(record.importedSha256,record.sourceSha256);\n   }\n   const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{\n",'utf8');

function lines(bytes,label){
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes),label+' lossless UTF-8');
  assert.ok(!text.includes('\r'),label+' LF bytes');
  return text.split('\n');
}
function invert(currentBytes,patchBytes,label){
  const current=lines(currentBytes,label+' current');
  const patch=lines(patchBytes,label+' patch');
  assert.match(patch[0],/^diff --git a\/.+ b\/.+$/);
  assert.match(patch[1],/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/);
  assert.match(patch[2],/^--- a\/.+$/);
  assert.match(patch[3],/^\+\+\+ b\/.+$/);
  let cursor=0,index=4,hunks=0;
  const previous=[];
  while(index<patch.length&&patch[index]){
    const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[index++]);
    assert.ok(head,label+' bounded hunk');
    const oldStart=Number(head[1])-1,oldCount=Number(head[2]??1);
    const newStart=Number(head[3])-1,newCount=Number(head[4]??1);
    assert.ok(newStart>=cursor&&newStart<=current.length,label+' ordered hunk');
    previous.push(...current.slice(cursor,newStart));cursor=newStart;
    assert.equal(previous.length,oldStart,label+' historical hunk position');
    let consumed=0,produced=0;
    while(index<patch.length&&patch[index]&&!patch[index].startsWith('@@')){
      const line=patch[index++],mode=line[0],value=line.slice(1);
      assert.ok(mode===' '||mode==='-'||mode==='+',label+' patch line');
      if(mode!=='-'){assert.equal(current[cursor++],value,label+' exact current line');consumed++;}
      if(mode!=='+'){previous.push(value);produced++;}
    }
    assert.equal(consumed,newCount,label+' complete current hunk');
    assert.equal(produced,oldCount,label+' complete historical hunk');
    hunks++;
  }
  assert.ok(hunks>0,label+' reviewed change');
  assert.ok(patch.slice(index).every(line=>line===''),label+' no trailing data');
  previous.push(...current.slice(cursor));
  return Buffer.from(previous.join('\n'),'utf8');
}
export function inverseMedian(bytes){
  assert.equal(sha(bytes),medianPostimageSha,'exact median consumer postimage');
  const previous=invert(bytes,medianPatch,'median');
  assert.equal(sha(previous),medianPreimageSha,'whole original median test restored');
  return previous;
}
export function inverseVocal(bytes){
  assert.equal(sha(bytes),vocalPostimageSha,'exact vocal consumer postimage');
  const previous=invert(bytes,vocalPatch,'vocal');
  assert.equal(sha(previous),vocalPreimageSha,'whole original vocal test restored');
  return previous;
}
