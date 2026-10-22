// Exact, fixture-bound inverse from the current dental proposal to preserved
// historical spinal test byte sources. No test is disabled or regenerated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const shoulderPostimageSha='9ce897d60b62261f9ed75918700cba2580fdc58ca99bf9a487618a70a1c82e6d';
const shoulderInversePatch=Buffer.from("diff --git a/tests/atlas-spinal-muscle-xray.test.mjs b/tests/atlas-spinal-muscle-xray.test.mjs\nindex 9938661..77656a8 100644\n--- a/tests/atlas-spinal-muscle-xray.test.mjs\n+++ b/tests/atlas-spinal-muscle-xray.test.mjs\n@@ -178,6 +178,10 @@ const shoulderFamilyDifferences = new Map([\n     '9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904']],\n   ['content/regional-teaching/abdomen.json', ['19f318f4d3e342ee0f1b68c7232cbf9249e828fa9802d264a20f0aa6cd9eaff0',\n     '214bed8b53ed3db2b6ea81ed61028ff1b5f4520afb5a02c38850811189a5dd67']],\n+  ['content/regional-teaching/head-neck.json', ['e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25',\n+    '574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd']],\n+  ['content/review-revisions.json', ['e13145d687b09df0557311d40ed7a24d05ad98157236d0b289b0e21ddb5367b3',\n+    'c8b54068f843b5995eec9d89ae48b9f0a78b643fcaaefc80297ca6b53669f946']],\n ]);\n const wanted = new Set(review.files.map(row => row.path));\n for (const region of regions) for (const row of json(`public/atlas-runtime/${region}/source-inputs.json`)) wanted.add(row.path);\n@@ -275,6 +279,7 @@ async function importedApi() {\n }\n \n test('spinal X-ray source, Review, four runtime manifests and emitted teaching remain exact', async () => {\n+  const shoulderDifferenceHits=new Set();\n   assert.equal(review.revision, source.source);\n   assert.equal(new Set(review.files.map(row => row.path)).size, review.files.length);\n   const required = ['app/body-content.ts', 'lib/spinal-muscle-xray.ts', 'content/spinal-muscle-xray.ts',\n@@ -319,6 +324,19 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n           assert.equal(sha(committed), hashes[0], `${input.path} exact shoulder family`);\n           assert.equal(sha(working), hashes[1], `${input.path} exact current checkout`);\n           assert.ok(working.equals(blob(source.source, input.path)), `${input.path} current Git checkout`);\n+          shoulderDifferenceHits.add(input.path);\n+          if(input.path==='content/regional-teaching/head-neck.json'||\n+            input.path==='content/review-revisions.json'){\n+            batch(colicEpoch,[input.path]);batch(neckAuthoredEpoch,[input.path]);\n+            assert.ok(committed.equals(blob(colicEpoch,input.path)),\n+              `${input.path} historical shoulder retains pre-neck source`);\n+            assert.ok(working.equals(blob(input.path.endsWith('head-neck.json')?\n+              neckAuthoredEpoch:neckEpoch,input.path)),\n+              `${input.path} exact authored transition source`);\n+            if(input.path==='content/review-revisions.json')\n+              assert.ok(blob(neckAuthoredEpoch,input.path).equals(blob(colicEpoch,input.path)),\n+                'review witness follows neck teaching without changing authored lesson');\n+          }\n         }\n       }\n       assert.equal(input.sha256, sha(committed), `${region} source input ${input.path}`);\n@@ -329,6 +347,8 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n     for (const flag of ['clinicalApproved', 'patientDataIncluded', 'standaloneReviewConnection', 'imagingConnection'])\n       assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${region} ${flag}`);\n   }\n+  assert.deepEqual([...shoulderDifferenceHits].sort(),[...shoulderFamilyDifferences.keys()].sort(),\n+    'exact five historical shoulder inputs differ from current Atlas checkout');\n \n   const pins = json('atlas-review/content/spinal-muscle-xray-pins.json');\n   assert.equal(pins.baseline, source.baseline);\n",'utf8');
function inverseNewestShoulder(bytes){
  assert.equal(sha(bytes),'887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308',
    'exact neck-row test adapter postimage');
  const adapted="    [new Map([...neckSelected].map(([id,identity])=>[id,{identity}])),'xray',api.neckLandmarkXrayLesson],";
  const text=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(text),bytes,'lossless test source');
  assert.equal(text.split(adapted).length,2,'one explicit neck-only identity wrapper');
  bytes=Buffer.from(text.replace(adapted,"    [neckSelected,'xray',api.neckLandmarkXrayLesson],"));
  assert.equal(sha(bytes),shoulderPostimageSha,'exact five-input shoulder history postimage');
  const previous=invertPatch(bytes,shoulderInversePatch,'shoulder-history');
  assert.equal(sha(previous),'724867c87729d6c1768f49afe850b77610caa753e8b075573cdf1b7c4210be47',
    'complete prior neck-consumer source restored');
  return previous;
}
const neckPostimageSha='724867c87729d6c1768f49afe850b77610caa753e8b075573cdf1b7c4210be47';
const neckInversePatch=Buffer.from("diff --git a/tests/atlas-spinal-muscle-xray.test.mjs b/tests/atlas-spinal-muscle-xray.test.mjs\nindex deabc09..9938661 100644\n--- a/tests/atlas-spinal-muscle-xray.test.mjs\n+++ b/tests/atlas-spinal-muscle-xray.test.mjs\n@@ -53,6 +53,8 @@ const dentalParent='485df97c2530e8e81a8d39a5ee61073ce76d93db';\n const dentalEpoch='30135cdd1849115a75c036dd6897d76e3d91e231';\n const colicParent='fa1bf9a233c6989fef42b533bbbac9d6ab034311';\n const colicEpoch='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';\n+const neckAuthoredEpoch='da84654113bdd27dbfabd6879d82740c8407f4db';\n+const neckEpoch='389bd0ca846a42c7f21055f55904bcf5df81a09f';\n assert.match(source.source, /^[a-f0-9]{40}$/);\n assert.match(source.sourceTree, /^[a-f0-9]{40}$/);\n assert.equal(source.baseline, '4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad');\n@@ -152,10 +154,18 @@ assert.equal(git('rev-parse',`${dentalParent}^{tree}`).toString().trim(),\n assert.equal(git('rev-parse',`${dentalEpoch}^{tree}`).toString().trim(),\n   'e20a6fbe8e29adf50fc1ae3e2005438479ddc04c');\n assert.equal(git('merge-base',dentalEpoch,source.source).toString().trim(),dentalEpoch);\n-assert.equal(source.source,colicEpoch,'installed Atlas is the authored colic introduction');\n+assert.equal(source.source,neckEpoch,'current Atlas is the authored neck X-ray successor');\n assert.equal(git('rev-parse',`${colicEpoch}^`).toString().trim(),colicParent);\n assert.equal(git('rev-parse',`${colicEpoch}^{tree}`).toString().trim(),\n   'e9165d7122361f809a267af1414b337b69097fe2','authored colic tree');\n+assert.equal(git('rev-parse',`${neckAuthoredEpoch}^`).toString().trim(),colicEpoch,\n+  'neck X-ray introduction directly succeeds the colic epoch');\n+assert.equal(git('rev-parse',`${neckAuthoredEpoch}^{tree}`).toString().trim(),\n+  'f73310397e88aec992300bbe509bc218f35727cc','authored neck X-ray tree');\n+assert.equal(git('rev-parse',`${neckEpoch}^`).toString().trim(),neckAuthoredEpoch,\n+  'current source adds the stock display witness after neck authoring');\n+assert.equal(git('rev-parse',`${neckEpoch}^{tree}`).toString().trim(),\n+  '25acdee40ee57e0253cdcca924aa64b4b38586c8','authored neck X-ray tree');\n for (const [before,after] of [[priorSource,ultrasoundEpoch],[ultrasoundEpoch,footEpoch],\n   [footEpoch,evidenceEpoch],[evidenceEpoch,pharyngealEpoch],[pharyngealEpoch,source.source]])\n   assert.equal(git('merge-base',before,after).toString().trim(),before,`${before} precedes ${after}`);\n@@ -163,7 +173,7 @@ const review = json('atlas-review/manifest.json');\n const regions = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];\n const shoulderFamilyDifferences = new Map([\n   ['app/body-content.ts', ['3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',\n-    '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc']],\n+    'ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382']],\n   ['app/body-explorer.css', ['9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca',\n     '9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904']],\n   ['content/regional-teaching/abdomen.json', ['19f318f4d3e342ee0f1b68c7232cbf9249e828fa9802d264a20f0aa6cd9eaff0',\n@@ -178,7 +188,7 @@ const treeByCommit = new Map([[source.source, currentTree], [source.baseline, pr\n     lacrimalEpoch,abdominalEusEpoch,superficialPlantarEpoch,\n     checkMriParent,checkMriEpoch,archXrayEpoch,corpusXrayEpoch,thyroidMraEpoch,corpusCtEpoch,tonguePalateEpoch,\n     ileocolicParent,ileocolicEpoch]\n-    .concat([dentalParent,dentalEpoch,colicParent,colicEpoch])\n+    .concat([dentalParent,dentalEpoch,colicParent,colicEpoch,neckAuthoredEpoch,neckEpoch])\n     .map(epoch=>[epoch,tree(epoch)])]);\n for (const family of new Set(Object.values(currentPin.runtimeSources)))\n   if (!treeByCommit.has(family)) treeByCommit.set(family, tree(family));\n@@ -228,6 +238,7 @@ const apiEntry = [\n   \"export {contentTabs} from './lib/content-types';\",\n   \"export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';\",\n   \"export {spinalMuscleXrayLesson} from './lib/spinal-muscle-xray';\",\n+  \"export {neckLandmarkXrayLesson} from './lib/neck-landmark-xray';\",\n   \"export * from './content/spinal-muscle-xray';\",\n   \"export {handVesselXrayLesson} from './lib/hand-vessel-xray';\",\n   \"export {intracranialArterialUsLesson} from './lib/intracranial-arterial-us';\",\n@@ -421,6 +432,7 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   const dentalDispatchPath='app/body-content.ts';\n   batch(dentalParent,[dentalDispatchPath]);\n   batch(dentalEpoch,[dentalDispatchPath]);\n+  batch(colicEpoch,[dentalDispatchPath]);\n   const dentalPreimage=blob(dentalParent,dentalDispatchPath).toString().replaceAll('\\r\\n','\\n');\n   const dentalIntroduced=blob(dentalEpoch,dentalDispatchPath).toString().replaceAll('\\r\\n','\\n');\n   const dentalImport=\"import {dentalMriLesson} from '../lib/dental-mri';\\n\";\n@@ -432,9 +444,16 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   const currentDentalDispatch=blob(source.source,dentalDispatchPath).toString();\n   const colicImport=\"import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\\n\";\n   const colicBranch=\"  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\\n  if (colicUltrasound) return colicUltrasound;\\n\";\n-  assert.equal(currentDentalDispatch.split(colicImport).length,2,'one later colic import');\n-  assert.equal(currentDentalDispatch.split(colicBranch).length,2,'one later colic dispatch branch');\n-  assert.ok(Buffer.from(currentDentalDispatch.replace(colicImport,'').replace(colicBranch,'')).equals(\n+  const neckImport=\"import { neckLandmarkXrayLesson } from '../lib/neck-landmark-xray';\\n\";\n+  const neckBranch=\"  const neckLandmarkXray = neckLandmarkXrayLesson(s, tab);\\n  if (neckLandmarkXray) return neckLandmarkXray;\\n\";\n+  assert.equal(currentDentalDispatch.split(neckImport).length,2,'one authored neck import');\n+  assert.equal(currentDentalDispatch.split(neckBranch).length,2,'one authored neck dispatch branch');\n+  assert.ok(Buffer.from(currentDentalDispatch.replace(neckImport,'').replace(neckBranch,'')).equals(\n+    blob(colicEpoch,dentalDispatchPath)),'neck inverse restores exact complete colic dispatch');\n+  const colicDispatch=blob(colicEpoch,dentalDispatchPath).toString();\n+  assert.equal(colicDispatch.split(colicImport).length,2,'one later colic import');\n+  assert.equal(colicDispatch.split(colicBranch).length,2,'one later colic dispatch branch');\n+  assert.ok(Buffer.from(colicDispatch.replace(colicImport,'').replace(colicBranch,'')).equals(\n     blob(dentalEpoch,dentalDispatchPath)),'current dental dispatch restores exact introduction source after colic inverse');\n   const dentalBefore=await sourceHistory.exactSourceHistoryApi(dentalParent,'review-security');\n   const dentalAtCommit=await sourceHistory.exactSourceHistoryApi(dentalEpoch,'review-security');\n@@ -460,6 +479,20 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   });\n   assert.deepEqual(colicRows.map(row=>row.identity.fmaId),['FMA14810','FMA14811']);\n   const colicSelected=new Map(colicRows.map(row=>[row.identity.id,row]));\n+  const neckIds=new Set([\n+    'vm:anatomy:body:head-neck:midline:bone:hyoid-bone',\n+    'vm:anatomy:body:head-neck:unpaired:organ:epiglottis',\n+    'vm:anatomy:body:head-neck:midline:cartilage:cricoid-cartilage',\n+  ]);\n+  const neckSelected=new Map(catalog.structures.filter(row=>neckIds.has(row.id))\n+    .map(row=>[row.id,row]));\n+  assert.equal(neckSelected.size,3,'three exact committed neck X-ray identities');\n+  assert.deepEqual([...neckSelected.values()].map(row=>row.fmaId).sort(),\n+    ['FMA52749','FMA55130','FMA9615'].sort());\n+  for(const path of ['content/neck-landmark-xray.ts','lib/neck-landmark-xray.ts']){\n+    batch(neckAuthoredEpoch,[path]);batch(source.source,[path]);\n+    same(blob(source.source,path),blob(neckAuthoredEpoch,path),`${path} exact authored Git bytes`);\n+  }\n   const footPins=exactPins('content/foot-arterial-projection-xray-pins.json',footEpoch);\n   assert.equal(footPins.parentCommit,ultrasoundEpoch);\n   assert.equal(footPins.entries.length,12);\n@@ -754,13 +787,18 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n     ...tonguePalateCells,ileocolicCell,`${corpusId}/xray`,`${corpusId}/ct`,\n     ...dentalCells,...colicCells]).size,118+18+6+8+1+1+1+28+2,\n     'only two distinct later colic ultrasound cells are introduced');\n+  const neckCells=[...neckSelected.keys()].map(id=>`${id}/xray`);\n+  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells,\n+    ...tonguePalateCells,ileocolicCell,`${corpusId}/xray`,`${corpusId}/ct`,\n+    ...dentalCells,...colicCells,...neckCells]).size,118+18+6+8+1+1+1+28+2+3,\n+    'three neck X-ray cells are distinct from every earlier transition');\n   const spine = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/spine.json'), 'spine');\n   let changed = 0, preserved = 0, changedWorksheets = 0, handChanges=0, handWorksheets=0;\n   let usChanges=0,usWorksheets=0,currentPreserved=0,currentVsOldPreserved=0;\n   let footChanges=0,evidenceChanges=0,mriChanges=0;\n   let ctChanges=0,medianChanges=0,additionalUsChanges=0,checkMriChanges=0,archXrayChanges=0;\n   let tonguePalateChanges=0,ileocolicChanges=0,corpusXrayChanges=0,corpusCtChanges=0,thyroidMraExpanded=0;\n-  let dentalChanges=0,colicChanges=0;\n+  let dentalChanges=0,colicChanges=0,neckChanges=0;\n   const additionalUsCounts=new Map(additionalUsEpochs.map(group=>[group.name,0]));\n   for (const structure of catalog.structures) {\n     const oldWorksheet = await old.bodyReviewMaterial(structure.id);\n@@ -787,6 +825,7 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n       const archXrayRow=archXraySelected.get(structure.id);\n       const tonguePalateRow=tonguePalateSelected.get(structure.id);\n       const colicRow=colicSelected.get(structure.id);\n+      const neckRow=neckSelected.get(structure.id);\n       if (!((selected.has(structure.id)||handSelected.has(structure.id))&&tab==='xray')&&\n         !(usSelected.has(structure.id)&&tab==='ultrasound')) {\n         same(historicalLesson,before,`${structure.id}/${tab} original 589 lesson preserved`);\n@@ -1112,6 +1151,32 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n         assert.equal(worksheet.status,'worksheet-not-submitted');\n         assert.notDeepEqual(topic,priorCurrentTopic);\n         colicChanges++;\n+      }else if(neckRow&&tab==='xray'){\n+        same(structure,neckRow,`${structure.id} complete neck X-ray source identity`);\n+        const predecessor=colicAtCommit.bodyLesson(structure,tab);\n+        const predecessorPacket=await colicAtCommit.bodyReviewMaterial(structure.id);\n+        same(predecessor,priorLesson,`${structure.id} pre-neck lesson retains original source`);\n+        same(before,predecessor,`${structure.id} original pending X-ray lesson`);\n+        assert.equal(predecessor.readiness,'pending');\n+        assert.equal(after.readiness,'draft');\n+        same(after,api.neckLandmarkXrayLesson(structure,tab),\n+          `${structure.id} exact authored neck X-ray lesson`);\n+        assert.match(after.note,/revision-bound radiologist review pending/);\n+        same(topic,{tab,...after},`${structure.id} exact current Review topic`);\n+        same(predecessorPacket.topics.find(item=>item.tab===tab),{tab,...predecessor},\n+          `${structure.id} exact pre-neck worksheet`);\n+        assert.equal(worksheet.approval,false);\n+        assert.equal(worksheet.status,'worksheet-not-submitted');\n+        assert.equal(await api.parseBodyReviewResponse(predecessorPacket,structure.id),null,\n+          `${structure.id} stale pre-neck Review packet refused`);\n+        assert.ok(await api.parseBodyReviewResponse(worksheet,structure.id),\n+          `${structure.id} current neck Review packet parses`);\n+        const altered=structuredClone(worksheet);\n+        altered.topics.find(item=>item.tab===tab).body+=' altered';\n+        assert.equal(await api.parseBodyReviewResponse(altered,structure.id),null,\n+          `${structure.id} tampered neck Review packet refused`);\n+        assert.notDeepEqual(topic,priorCurrentTopic);\n+        neckChanges++;\n       }else{\n         same(after,priorLesson,`${structure.id}/${tab} current lesson unchanged since f1`);\n         same(topic,priorCurrentTopic,`${structure.id}/${tab} current worksheet unchanged since f1`);\n@@ -1158,7 +1223,7 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n         (tonguePalateRow&&tab==='quiz')||(structure.id===ileocolicId&&tab==='ultrasound')||\n         (structure.id===corpusId&&(tab==='xray'||tab==='ct'))||\n         (dentalSelected.has(structure.id)&&tab==='mri')||\n-        (colicRow&&tab==='ultrasound')) {\n+        (colicRow&&tab==='ultrasound')||(neckRow&&tab==='xray')) {\n         // Each exact feature transition and its worksheet were checked above.\n       } else {\n         same(after,before,`${structure.id}/${tab} current lesson preserved versus baseline`);\n@@ -1187,18 +1252,19 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   assert.equal(corpusCtChanges,1);\n   assert.equal(dentalChanges,28);\n   assert.equal(colicChanges,2);\n+  assert.equal(neckChanges,3);\n   assert.equal(thyroidMraExpanded,2,'Two expanded MRA cells already counted in the original four evidence changes');\n   for(const group of additionalUsEpochs)assert.equal(additionalUsCounts.get(group.name),group.count,\n     `${group.name} exact introduced cells visited`);\n-  assert.equal(currentPreserved,9845);\n+  assert.equal(currentPreserved,9842);\n   assert.equal(currentPreserved+ctChanges+medianChanges+additionalUsChanges+\n-    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9910,\n-    '9910 current-preservation cells include exact dental and colic transitions');\n+    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges+neckChanges,9910,\n+    '9910 current-preservation cells include exact dental, colic and neck transitions');\n   assert.equal(preserved, 9836);\n-  assert.equal(currentVsOldPreserved,9753);\n+  assert.equal(currentVsOldPreserved,9750);\n   assert.equal(currentVsOldPreserved+ctChanges+medianChanges+additionalUsChanges+\n-    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9818,\n-    '9818 baseline-preservation cells include exact dental and colic transitions');\n+    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges+neckChanges,9818,\n+    '9818 baseline-preservation cells include exact dental, colic and neck transitions');\n   assert.equal(changedWorksheets, 56);\n   assert.equal(handWorksheets,36);\n   assert.equal(usWorksheets,8);\n@@ -1225,6 +1291,7 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   for(const [selectedSet,tab,resolver] of [\n     [dentalSelected,'mri',api.dentalMriLesson],\n     [colicSelected,'ultrasound',api.colicArteryUltrasoundLesson],\n+    [neckSelected,'xray',api.neckLandmarkXrayLesson],\n     [ctSelected,'ct',api.craniofacialCalcificationCtLesson],\n     [medianSelected,'xray',api.medianAntebrachialXrayLesson],\n     [checkMriSelected,'mri',api.orbitalSupportMriLesson],\n@@ -1244,8 +1311,8 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n     const altered=structuredClone(packet);\n     altered.topics.find(topic=>topic.tab===tab).body+=' altered';\n     assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id} tampered teaching refused`);\n-    if(id===ileocolicId||id===corpusId||colicSelected.has(id)){\n-      const stale=await (colicSelected.has(id)?colicBefore:\n+    if(id===ileocolicId||id===corpusId||colicSelected.has(id)||neckSelected.has(id)){\n+      const stale=await (neckSelected.has(id)?colicAtCommit:colicSelected.has(id)?colicBefore:\n         id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);\n       assert.equal(await api.parseBodyReviewResponse(stale,id),null,\n         'pre-introduction ileocolic worksheet cannot carry approval');\n@@ -1342,8 +1409,8 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n           assert.ok(chunk.includes(line)||chunk.includes(JSON.stringify(line).slice(1,-1)),\n             `${row.identity.id}/${tab} exact introduced teaching emitted`);\n     }\n-  assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,colicEpoch);\n-  assert.equal(json('public/atlas-review-viewer/manifest.json').sourceCommit,colicEpoch);\n+  assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,neckEpoch);\n+  assert.equal(json('public/atlas-review-viewer/manifest.json').sourceCommit,neckEpoch);\n   for(const row of colicSelected.values()){\n     const lesson=api.bodyLesson(row.identity,'ultrasound');\n     for(const line of [lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])\n@@ -1351,6 +1418,13 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n         assert.ok(chunk.includes(line)||chunk.includes(JSON.stringify(line).slice(1,-1)),\n           `${row.identity.id}/ultrasound exact current colic teaching emitted`);\n   }\n+  for(const row of neckSelected.values()){\n+    const lesson=api.bodyLesson(row,'xray');\n+    for(const line of [lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])\n+      for(const chunk of [emittedCurrent[0],emittedCurrent[2]])\n+        assert.ok(chunk.includes(line)||chunk.includes(JSON.stringify(line).slice(1,-1)),\n+          `${row.id}/xray exact current neck teaching emitted`);\n+  }\n \n   const modelPaths = [...currentTree.keys()].filter(path => /^public\\/models\\/bodyparts3d\\/full-body\\/[^/]+\\.glb$/.test(path));\n   assert.equal(modelPaths.length, 86);\n@@ -1369,7 +1443,7 @@ test('spinal X-ray source, Review, four runtime manifests and emitted teaching r\n   }\n   console.log(JSON.stringify({ source: source.source, sourceTree: source.sourceTree, changed,\n     preserved, changedWorksheets, handChanges, handWorksheets,usChanges,usWorksheets,currentPreserved,\n-    footChanges,evidenceChanges,mriChanges,ctChanges,medianChanges,additionalUsChanges,dentalChanges,colicChanges,\n+    footChanges,evidenceChanges,mriChanges,ctChanges,medianChanges,additionalUsChanges,dentalChanges,colicChanges,neckChanges,\n     checkMriChanges,archXrayChanges,tonguePalateChanges,ileocolicChanges,corpusXrayChanges,corpusCtChanges,thyroidMraExpanded,\n     additionalUsCounts:Object.fromEntries(additionalUsCounts),currentVsOldPreserved,\n     families: 32, pins: 56, cervicalUnchanged: 6,\n",'utf8');
function inverseNewestNeck(bytes){
  assert.equal(sha(bytes),neckPostimageSha,'exact source389 spinal test postimage');
  const previous=invertPatch(bytes,neckInversePatch,'neck-Xray');
  assert.equal(sha(previous),'1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce',
    'complete preceding colic-source spinal test restored');
  return previous;
}
const semanticPostimageSha='1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce';
const currentColicSha='7a39e919130ce257d590f564b0a9839857df9b2a1c3c786cf2805527fe79e01b';
function inverseCurrentColicSemantics(bytes){
  assert.equal(sha(bytes),semanticPostimageSha,'exact two-colic-cell semantic postimage');
  let text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes)&&!text.includes('\r'),'lossless LF semantic source');
  const once=(from,to,label)=>{
    assert.equal(text.split(from).length,2,`${label}: unique exact inverse seam`);
    text=text.replace(from,to);
  };
  const drop=(start,end,label)=>{
    assert.equal(text.split(start).length,2,`${label}: unique start`);
    assert.equal(text.split(end).length,2,`${label}: unique end`);
    const first=text.indexOf(start),last=text.indexOf(end,first+start.length);
    assert.ok(last>first,`${label}: ordered source boundaries`);
    text=text.slice(0,first)+text.slice(last);
  };
  once("const colicParent='fa1bf9a233c6989fef42b533bbbac9d6ab034311';\n"+
    "const colicEpoch='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';\n",'',
    'authored colic commits');
  drop("assert.equal(source.source,colicEpoch,'installed Atlas is the authored colic introduction');\n",
    'for (const [before,after] of [[priorSource,ultrasoundEpoch]',
    'authored colic ancestry and tree');
  once('.concat([dentalParent,dentalEpoch,colicParent,colicEpoch])',
    '.concat([dentalParent,dentalEpoch])','historical tree cache');
  once('  "export {colicArteryUltrasoundLesson} from \'./lib/colic-artery-ultrasound\';",\n',
    '','colic resolver export');
  drop('  const colicBefore=await sourceHistory.exactSourceHistoryApi(colicParent,\'review-security\');\n',
    "  const footPins=exactPins('content/foot-arterial-projection-xray-pins.json',footEpoch);",
    'complete authored source and pin block');
  drop('  const colicCells=[...colicSelected.keys()].map(id=>`${id}/ultrasound`);\n',
    "  const spine = api.decodeRegionalTeachingSnapshot(",
    'two distinct modality cells');
  once('  let dentalChanges=0,colicChanges=0;','  let dentalChanges=0;',
    'semantic change counter');
  once('      const colicRow=colicSelected.get(structure.id);\n','',
    'source-bound selected row');
  drop("      }else if(colicRow&&tab==='ultrasound'){\n",
    "      }else{\n        same(after,priorLesson,",
    'complete colic lesson and Review transition');
  once("        (dentalSelected.has(structure.id)&&tab==='mri')||\n"+
    "        (colicRow&&tab==='ultrasound')) {",
    "        (dentalSelected.has(structure.id)&&tab==='mri')) {",
    'baseline comparison partition');
  once('  assert.equal(colicChanges,2);\n','','two current colic visits');
  once('  assert.equal(currentPreserved,9845);','  assert.equal(currentPreserved,9847);',
    'current unchanged count');
  once('corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9910,\n'+
    "    '9910 current-preservation cells include exact dental and colic transitions');",
    'corpusXrayChanges+corpusCtChanges+dentalChanges,9910,\n'+
    "    '9910 current-preservation cells include exact dental MRI transition');",
    'full current partition');
  once('  assert.equal(currentVsOldPreserved,9753);','  assert.equal(currentVsOldPreserved,9755);',
    'baseline unchanged count');
  once('corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9818,\n'+
    "    '9818 baseline-preservation cells include exact dental and colic transitions');",
    'corpusXrayChanges+corpusCtChanges+dentalChanges,9818,\n'+
    "    '9818 baseline-preservation cells include exact dental MRI transition');",
    'full baseline partition');
  once("    [colicSelected,'ultrasound',api.colicArteryUltrasoundLesson],\n",'',
    'Review refusal selected set');
  once("    if(id===ileocolicId||id===corpusId||colicSelected.has(id)){\n"+
    "      const stale=await (colicSelected.has(id)?colicBefore:\n"+
    "        id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);",
    "    if(id===ileocolicId||id===corpusId){\n"+
    "      const stale=await (id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);",
    'original stale packet refusal');
  drop("  assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,colicEpoch);\n",
    '  const modelPaths = [...currentTree.keys()].filter(path =>',
    'current-source emitted teaching');
  once('  const modelPaths = [...currentTree.keys()].filter(path =>',
    '\n  const modelPaths = [...currentTree.keys()].filter(path =>',
    'retained blank line before original model proof');
  once('medianChanges,additionalUsChanges,dentalChanges,colicChanges,',
    'medianChanges,additionalUsChanges,dentalChanges,',
    'diagnostic count output');
  const previous=Buffer.from(text,'utf8');
  assert.equal(sha(previous),currentColicSha,'complete V6 preimage restored before prior inverses');
  return previous;
}
const dentalPostimageSha='46feb48a3d91439396e47fa739df407ea95a3eacca0900c742fd4fe1ed6adf44';
const previousDentalCheck="  assert.equal(blob(source.source,dentalDispatchPath).toString().replaceAll('\\r\\n','\\n'),\n    dentalIntroduced,'current dental dispatch retains exact introduction source');\n";
const currentColicCheck="  const currentDentalDispatch=blob(source.source,dentalDispatchPath).toString();\n  const colicImport=\"import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\\n\";\n  const colicBranch=\"  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\\n  if (colicUltrasound) return colicUltrasound;\\n\";\n  assert.equal(currentDentalDispatch.split(colicImport).length,2,'one later colic import');\n  assert.equal(currentDentalDispatch.split(colicBranch).length,2,'one later colic dispatch branch');\n  assert.ok(Buffer.from(currentDentalDispatch.replace(colicImport,'').replace(colicBranch,'')).equals(\n    blob(dentalEpoch,dentalDispatchPath)),'current dental dispatch restores exact introduction source after colic inverse');\n";
function inverseNewestColic(bytes){
  assert.equal(sha(bytes),currentColicSha,'newest exact colic-dispatch test postimage');
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes),'newest postimage lossless UTF-8');
  assert.equal(text.split(currentColicCheck).length,2,'one newest colic source-check seam');
  const previous=Buffer.from(text.replace(currentColicCheck,previousDentalCheck),'utf8');
  assert.equal(sha(previous),dentalPostimageSha,'full prior dental source restored');
  return previous;
}
const familyPreimageSha='6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc';
function inverseV5Family(bytes){
  assert.equal(sha(bytes),dentalPostimageSha,'exact admitted V5 family postimage');
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes)&&!text.includes('\r'),'lossless LF V5 family postimage');
  let lines=text.split('\n');
  function restore(anchor,offset,count,original,label){
    const hits=lines.flatMap((line,index)=>line===anchor?[index]:[]);
    assert.equal(hits.length,1,`${label}: unique exact V5 seam`);
    const start=hits[0]+offset;
    assert.ok(start>=0&&start+count<lines.length,`${label}: bounded V5 hunk`);
    lines.splice(start,count,...original);
  }
  restore('const shoulderFamilyDifferences = new Map([',0,8,[],'three exact shoulder-family source differences');
  restore('for (const family of new Set(Object.values(currentPin.runtimeSources)))',0,2,[],'runtime family tree cache');
  restore('  const paths = regions.filter(region => currentPin.runtimeSources[region] === family)',-2,6,[],'runtime family batch');
  restore('    const runtimeSource = currentPin.runtimeSources[region];',0,2,
    ['    assert.equal(manifest.sourceCommit, source.source, `${region} source`);'],'runtime manifest pin');
  restore('      const committed = blob(runtimeSource, input.path);',0,24,[
    '      const committed = blob(source.source, input.path);',
    '      if (!working.equals(committed)) {',
    '        assert.ok(!working.includes(0) && !committed.includes(0));',
    "        assert.ok(working.includes(Buffer.from('\\r\\n')));",
    "        assert.ok(Buffer.from(working.toString('utf8').replaceAll('\\r\\n', '\\n')).equals(committed));",
    '      }',
    '      assert.equal(input.sha256, sha(working), `${region} source input ${input.path}`);',
  ],'family-specific input and license EOL checks');
  const previous=Buffer.from(lines.join('\n'),'utf8');
  assert.equal(sha(previous),familyPreimageSha,'complete 6c202 dental-era source restored');
  return previous;
}
const stages=[
  {name:'tongue-palate',before:'3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865',
    after:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    patch:'01-tongue-palate.patch.raw',patchSha:'c0b2f371ca8f918a5c5ebebbea0a40039ac9e4c3aa2dc025693c3951d0d0c144'},
  {name:'ileocolic',before:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    after:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    patch:'02-ileocolic.patch.raw',patchSha:'ad6e3d2a0d6b331d7e273cc95e81edf1bfed54d85c3c2d222e0bf15194429a78'},
  {name:'corpus-current',before:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    after:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    patch:'03-corpus-current.patch.raw',patchSha:'ff3a9d6a93c7a4053b611e21abad10603bbad42471a8406a9d738f6de97c6519'},
  {name:'corpus-ct',before:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    after:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    patch:'04-corpus-ct.patch.raw',patchSha:'d9cc55c0486228e18a8b768596a17c578e42caf7d7e4b5e0a98293d0e1210cc2'},
  {name:'ct-save',before:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    after:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    patch:'05-ct-save.patch.raw',patchSha:'fe2b28f5b14c26bbffd869965542c9bab13f955cc97ad3f094acc8165bd960ba'},
  {name:'dental',before:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    after:'6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc',
    patch:'06-dental.patch.raw',patchSha:'dcf154ab70f4b1a0df353d816ab227814471d189179d254f58ffafbeb2e42dcd'},
];

function exactLf(bytes,label){
  const value=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(value,'utf8'),bytes,`${label} lossless UTF-8`);
  assert(!value.includes('\r'),`${label} LF byte source`);
  return value.split('\n');
}

function invertPatch(currentBytes,patchBytes,name){
  const current=exactLf(currentBytes,`${name} postimage`);
  const patch=exactLf(patchBytes,`${name} reviewed patch`);
  assert.match(patch[0],/^diff --git a\/.+ b\/.+$/);
  assert.match(patch[1],/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/);
  assert.match(patch[2],/^--- a\/.+$/);
  assert.match(patch[3],/^\+\+\+ b\/.+$/);
  let cursor=0,i=4,hunks=0;
  const old=[];
  while(i<patch.length&&patch[i]){
    const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[i++]);
    assert.ok(head,`${name} bounded unified hunk`);
    const oldStart=Number(head[1])-1,oldCount=Number(head[2]??1);
    const newStart=Number(head[3])-1,newCount=Number(head[4]??1);
    assert.ok(newStart>=cursor&&newStart<=current.length,`${name} ordered hunk`);
    old.push(...current.slice(cursor,newStart));cursor=newStart;
    assert.equal(old.length,oldStart,`${name} historical hunk position`);
    let consumed=0,produced=0;
    while(i<patch.length&&patch[i]&&!patch[i].startsWith('@@')){
      const line=patch[i++],mode=line[0],value=line.slice(1);
      assert.ok(mode===' '||mode==='-'||mode==='+',`${name} patch line`);
      if(mode!== '-'){
        assert.equal(current[cursor++],value,`${name} exact current line`);
        consumed++;
      }
      if(mode!=='+'){old.push(value);produced++;}
    }
    assert.equal(consumed,newCount,`${name} complete postimage hunk`);
    assert.equal(produced,oldCount,`${name} complete historical hunk`);
    hunks++;
  }
  assert.ok(hunks>0,`${name} has a reviewed change`);
  assert.ok(patch.slice(i).every(line=>line===''),`${name} no trailing patch data`);
  old.push(...current.slice(cursor));
  return Buffer.from(old.join('\n'),'utf8');
}

function inverseStage(bytes,stage){
  assert.equal(sha(bytes),stage.after,`${stage.name} exact postimage`);
  const patch=readFileSync(new URL(`./fixtures/${stage.patch}`,import.meta.url));
  assert.equal(sha(patch),stage.patchSha,`${stage.name} exact reviewed patch bytes`);
  const previous=invertPatch(bytes,patch,stage.name);
  assert.equal(sha(previous),stage.before,`${stage.name} complete original byte preimage`);
  return previous;
}

export function inverseCurrentDental(bytes){
  return inverseStage(inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(inverseNewestNeck(inverseNewestShoulder(bytes))))),stages.at(-1));
}

export function inverseCurrentToLaterSix(bytes){
  let previous=inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(inverseNewestNeck(inverseNewestShoulder(bytes)))));
  for(const stage of [...stages].reverse())previous=inverseStage(previous,stage);
  const preserved=readFileSync(new URL('./fixtures/spinal-later-six-current-3824.mjs.raw',import.meta.url));
  assert.equal(sha(preserved),stages[0].before,'preserved exact 3824 historical source');
  assert.deepEqual(previous,preserved,'all current feature inverses restore full later-six source');
  return previous;
}

export {inverseNewestShoulder,inverseNewestNeck};
