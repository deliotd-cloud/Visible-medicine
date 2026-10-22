import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const here=dirname(fileURLToPath(import.meta.url));
const rawDir='fixtures/clinical-question-before-role-batch-20261021';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// These are the complete, exact allowed hunks. No diff algorithm runs in the guard.
const allowed=[
  {
    "name": "clinical-review-reasoning.test.ts",
    "sha": "43b62ba1b12c400b7ac964aa94e9b317874fef009d0e98ac025f4e6e304491a8",
    "edits": [
      [
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { build } from './review-component-test-build.ts';\n\n",
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { execFileSync } from 'node:child_process';\nimport { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';\nimport { build } from './review-component-test-build.ts';\n\n"
      ],
      [
        "  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));\n  assert.equal(review.revision,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  assert.equal(learner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  for(const path of ['lib/reasoning-questions.ts','lib/thoracic-vessel-reasoning.ts','lib/atlas-practice.ts']) {\n",
        "  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));\n  assert.equal(review.revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  for(const path of ['lib/reasoning-questions.ts','lib/thoracic-vessel-reasoning.ts','lib/atlas-practice.ts']) {\n"
      ],
      [
        "    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);\n  }\n  const result=await build({stdin:{contents:`\n",
        "    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);\n    const sourceRoot=currentAtlasDeliveryRoot();\n    const historical=execFileSync('git',['-C',sourceRoot,'show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:'+path],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n    const current=execFileSync('git',['-C',sourceRoot,'show',review.revision+':'+path],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n    assert.deepEqual(current,historical,path+' retains exact 9f reasoning source bytes');\n    assert.equal(file.sourceSha256,createHash('sha256').update(current).digest('hex'));\n  }\n  const result=await build({stdin:{contents:`\n"
      ]
    ]
  },
  {
    "name": "clinical-review-regional-muscle-completion-quiz.test.ts",
    "sha": "3c8c56aa397436b743f7b0b067bb59cafcb4b89f413a0f21f97e5b2d45047f9c",
    "edits": [
      [
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {build} from 'esbuild';\n\n",
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {execFileSync} from 'node:child_process';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\nimport {build} from 'esbuild';\n\n"
      ],
      [
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='e7608c0719fbf77b0f1a350d648dd695be23be6b';\nconst pinsHash='8ce87e14430874ecf7ccb44545770f9da18545fcb7f31f649d03f47c239ba567';\n",
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='e7608c0719fbf77b0f1a350d648dd695be23be6b';\nconst pinsHash='8ce87e14430874ecf7ccb44545770f9da18545fcb7f31f649d03f47c239ba567';\n"
      ],
      [
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n }\n const pins=JSON.parse(readFileSync('atlas-review/content/regional-muscle-completion-quiz-pins.json','utf8'));\n",
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n  const git=(revision:string)=>execFileSync('git',['-C',currentAtlasDeliveryRoot(),'show',revision+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.deepEqual(git(revision),git(historicalRevision),path+' retains exact 9f quiz source bytes');\n  assert.equal(source.sha256,sha(git(revision)));\n }\n const pins=JSON.parse(readFileSync('atlas-review/content/regional-muscle-completion-quiz-pins.json','utf8'));\n"
      ]
    ]
  },
  {
    "name": "clinical-review-short-ciliary-quiz.test.ts",
    "sha": "784380594d03080efbe80229329dadc93adcf2a09c7602fa35c12fca06f4078c",
    "edits": [
      [
        "const atlas='F:/VisibleMedicine/atlas';\nconst baseline='0a267a65c3855b87d3d01d2ed28279de5415bc93';\nconst liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Committed, integrated source revision.\nconst id='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';\nconst catalogPath='public/models/bodyparts3d/full-body/catalog.json';\n",
        "const atlas='F:/VisibleMedicine/atlas';\nconst baseline='0a267a65c3855b87d3d01d2ed28279de5415bc93';\nconst historicalCommit='280c701c9cc21c540b7b496f58e2d1c4214e7865'; // Exact original quiz epoch.\nconst liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9'; // Current committed, integrated source revision.\nconst id='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';\nconst catalogPath='public/models/bodyparts3d/full-body/catalog.json';\n"
      ],
      [
        "  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);\n  assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);\n  const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);\n  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');\n",
        "  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);\n  assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);\n  assert.equal(git(['merge-base',historicalCommit,liveCommit]).toString().trim(),historicalCommit);\n  assert.equal(git(['rev-parse',historicalCommit+'^']).toString().trim(),baseline,'Exact authored quiz epoch is immediate baseline child');\n  const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);\n  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');\n"
      ],
      [
        "  for(const path of inputPaths){\n    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);\n    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);\n    assert.equal(record.sourceSha256,sha(source),path);\n",
        "  for(const path of inputPaths){\n    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);\n    const historical=committed(historicalCommit,path);\n    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);\n    assert.equal(record.sourceSha256,sha(source),path);\n"
      ],
      [
        "    assert.equal(norm(imported),norm(source),`${path}: imported source`);\n    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: live source`);\n    for(const {name,base} of learners){\n      const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);\n",
        "    assert.equal(norm(imported),norm(source),`${path}: imported source`);\n    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: live source`);\n    if(path!=='app/body-content.ts')assert.deepEqual(source,historical,`${path}: exact historical quiz source retained`);\n    else assert.notDeepEqual(source,historical,'Current dispatcher includes later separately authored drafts');\n    for(const {name,base} of learners){\n      const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);\n"
      ],
      [
        "  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);\n  const old=await exactSourceHistoryApi(baseline,'review-security');\n  const catalog=imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath));\n  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));\n",
        "  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);\n  const old=await exactSourceHistoryApi(baseline,'review-security');\n  const historical=await exactSourceHistoryApi(historicalCommit,'review-security');\n  const catalog=imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath));\n  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));\n"
      ],
      [
        "  const structure=catalog.structures.find((item:{id:string})=>item.id===id);assert(structure);\n  assert.equal(old.bodyLesson(structure,'quiz').readiness,'pending');\n  assert.equal(imported.bodyLesson(structure,'quiz').readiness,'draft');\n  let changed=0,preserved=0;\n  for(const item of catalog.structures)for(const tab of imported.contentTabs){\n    const current=imported.bodyLesson(item,tab);\n    assert.deepEqual(current,live.bodyLesson(item,tab),`${item.id}:${tab}: live`);\n    if(item.id===id&&tab==='quiz'){changed++;continue;}\n    assert.deepEqual(current,old.bodyLesson(item,tab),`${item.id}:${tab}: preserved`);preserved++;\n  }\n  assert.deepEqual([changed,preserved],[1,9935]);\n  const packet=wire(await imported.bodyReviewMaterial(id));\n  const previous=wire(await old.bodyReviewMaterial(id));\n  assert.deepEqual(packet,wire(await live.bodyReviewMaterial(id)));\n  assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,structure);\n  assert.deepEqual(packet.topics.filter((row:any)=>row.tab!=='quiz'),\n    previous.topics.filter((row:any)=>row.tab!=='quiz'));\n  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])\n    assert.deepEqual(packet[key],previous[key],key);\n  assert.deepEqual(packet.topics.find((row:any)=>row.tab==='quiz'),\n    {tab:'quiz',...imported.bodyLesson(structure,'quiz')});\n  assert.equal(packet.fingerprints.source,previous.fingerprints.source);\n  assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);\n  assert.notEqual(packet.materialHash,previous.materialHash);\n  assert.deepEqual(await imported.parseBodyReviewResponse(packet,id),packet);\n  assert.equal(await imported.parseBodyReviewResponse(previous,id),null);\n",
        "  const structure=catalog.structures.find((item:{id:string})=>item.id===id);assert(structure);\n  assert.equal(old.bodyLesson(structure,'quiz').readiness,'pending');\n  assert.equal(historical.bodyLesson(structure,'quiz').readiness,'draft');\n  assert.equal(imported.bodyLesson(structure,'quiz').readiness,'draft');\n  assert.deepEqual(imported.bodyLesson(structure,'quiz'),historical.bodyLesson(structure,'quiz'),'Current quiz retains exact original authored answer');\n  let changed=0,preserved=0;\n  for(const item of catalog.structures)for(const tab of imported.contentTabs){\n    const current=historical.bodyLesson(item,tab);\n    if(item.id===id&&tab==='quiz'){changed++;continue;}\n    assert.deepEqual(current,old.bodyLesson(item,tab),`${item.id}:${tab}: preserved`);preserved++;\n  }\n  assert.deepEqual([changed,preserved],[1,9935]);\n  for(const item of catalog.structures)for(const tab of imported.contentTabs)\n    assert.deepEqual(imported.bodyLesson(item,tab),live.bodyLesson(item,tab),`${item.id}:${tab}: current live`);\n  const packet=wire(await imported.bodyReviewMaterial(id));\n  const historicalPacket=wire(await historical.bodyReviewMaterial(id));\n  const previous=wire(await old.bodyReviewMaterial(id));\n  assert.deepEqual(packet,wire(await live.bodyReviewMaterial(id)));\n  assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,structure);\n  assert.equal(historicalPacket.approval,false);assert.deepEqual(historicalPacket.source.structure,structure);\n  assert.deepEqual(historicalPacket.topics.filter((row:any)=>row.tab!=='quiz'),\n    previous.topics.filter((row:any)=>row.tab!=='quiz'));\n  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])\n    assert.deepEqual(historicalPacket[key],previous[key],key);\n  assert.deepEqual(historicalPacket.topics.find((row:any)=>row.tab==='quiz'),\n    {tab:'quiz',...imported.bodyLesson(structure,'quiz')});\n  assert.equal(historicalPacket.fingerprints.source,previous.fingerprints.source);\n  assert.notEqual(historicalPacket.fingerprints.teaching,previous.fingerprints.teaching);\n  assert.notEqual(historicalPacket.materialHash,previous.materialHash);\n  assert.deepEqual(packet.topics.find((row:any)=>row.tab==='quiz'),\n    {tab:'quiz',...imported.bodyLesson(structure,'quiz')});\n  assert.deepEqual(await imported.parseBodyReviewResponse(packet,id),packet);\n  assert.equal(await imported.parseBodyReviewResponse(previous,id),null);\n"
      ]
    ]
  }
];

function replaceExactlyOnce(source,before,after,label){
 const first=source.indexOf(before);
 assert.notEqual(first,-1,label+' missing original seam');
 assert.equal(source.indexOf(before,first+before.length),-1,label+' ambiguous original seam');
 return source.slice(0,first)+after+source.slice(first+before.length);
}

test('all original clinical-question test bodies survive outside enumerated historical/current seams',()=>{
 for(const {name,sha:historicalSha,edits} of allowed){
  const original=readFileSync(join(here,rawDir,name+'.raw'));
  assert.equal(sha(original),historicalSha,name+' authenticated original bytes');
  let expected=original.toString('utf8');
  for(const [before,after] of edits)expected=replaceExactlyOnce(expected,before,after,name);
  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');
 }
});
