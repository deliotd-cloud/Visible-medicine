import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const here=dirname(fileURLToPath(import.meta.url));
const rawDir='fixtures/clinical-imaging-before-role-batch-20261021';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Complete exact permitted edits; no diff algorithm runs in this guard.
const allowed=[
  {
    "name": "clinical-review-shoulder-ct.test.ts",
    "sha": "00be69c54d4d6fe7cf98a089d7b0e444efd508452a9e3a5f11fc95e86391b3a7",
    "edits": [
      [
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { build } from 'esbuild';\n\n",
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { execFileSync } from 'node:child_process';\nimport { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';\nimport { build } from 'esbuild';\n\n"
      ],
      [
        "  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));\n  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));\n  assert.equal(review.revision, '9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  assert.equal(learner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  for (const path of ['content/shoulder-arterial-ct-pins.json', 'content/shoulder-arterial-ct.ts', 'lib/shoulder-arterial-ct.ts']) {\n    const file = review.files.find((f: any) => f.path === path); assert(file);\n    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);\n  }\n  // Pin the current imported dispatch source explicitly alongside its audited review copy.\n  assert.equal(inputs.find((f: any) => f.path === 'app/body-content.ts')?.sha256,\n    '92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');\n  const dispatch = review.files.find((f: any) => f.path === 'app/body-content.ts');\n  assert.equal(dispatch.sourceSha256, '92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');\n  assert.equal(createHash('sha256').update(readFileSync('atlas-review/app/body-content.ts')).digest('hex'), dispatch.sourceSha256);\n  for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(learner[key], false);\n",
        "  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));\n  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));\n  assert.equal(review.revision, '190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const sourceRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  for (const path of ['content/shoulder-arterial-ct-pins.json', 'content/shoulder-arterial-ct.ts', 'lib/shoulder-arterial-ct.ts']) {\n    const file = review.files.find((f: any) => f.path === path); assert(file);\n    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);\n    const current=committed(review.revision,path);\n    assert.deepEqual(current,committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path),path+' exact 9f source retained');\n    assert.equal(file.sourceSha256,createHash('sha256').update(current).digest('hex'));\n  }\n  // Pin the current imported dispatch source explicitly alongside its audited review copy.\n  assert.equal(createHash('sha256').update(committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','app/body-content.ts')).digest('hex'),\n    '92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f','original 9f dispatcher source');\n  const currentDispatchSha=createHash('sha256').update(committed(review.revision,'app/body-content.ts')).digest('hex');\n  assert.equal(currentDispatchSha,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n  assert.equal(inputs.find((f: any) => f.path === 'app/body-content.ts')?.sha256,currentDispatchSha);\n  const dispatch = review.files.find((f: any) => f.path === 'app/body-content.ts');\n  assert.equal(dispatch.sourceSha256, currentDispatchSha);\n  assert.equal(createHash('sha256').update(readFileSync('atlas-review/app/body-content.ts')).digest('hex'), dispatch.sourceSha256);\n  for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(learner[key], false);\n"
      ]
    ]
  },
  {
    "name": "clinical-review-spinal-disc-ultrasound.test.ts",
    "sha": "36cef6295314eaafe9413a01ff0568e63c4369032edfbb2af49661d4c13ac4ee",
    "edits": [
      [
        "import {createHash} from 'node:crypto';\nimport {readFileSync} from 'node:fs';\nimport test from 'node:test';\nimport {build} from 'esbuild';\n\nconst revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst sourceCommit='59a567c7fb76c954cf3d91eeec62124e207bbbf9';\nconst sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');\n",
        "import {createHash} from 'node:crypto';\nimport {readFileSync} from 'node:fs';\nimport {execFileSync} from 'node:child_process';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\nimport test from 'node:test';\nimport {build} from 'esbuild';\n\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst sourceCommit='59a567c7fb76c954cf3d91eeec62124e207bbbf9';\nconst sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');\n"
      ],
      [
        " }\n for(const [path,expected] of Object.entries(sourceHashes)){\n  const record=review.files.find((file:{path:string})=>file.path===path);\n  assert(record,`Review missing ${path}`);\n",
        " }\n for(const [path,expected] of Object.entries(sourceHashes)){\n  const sourceRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n   {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.deepEqual(committed(revision),committed(historicalRevision),path+' exact 9f source retained');\n  assert.equal(sha(committed(revision)),expected,path+' committed source');\n  const record=review.files.find((file:{path:string})=>file.path===path);\n  assert(record,`Review missing ${path}`);\n"
      ]
    ]
  },
  {
    "name": "clinical-review-thoracic-quiz.test.ts",
    "sha": "87acd111d474a2791105f841b6e9e431869d22b29b7b851df05701b0f829b630",
    "edits": [
      [
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { build } from './review-component-test-build.ts';\n\n",
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { execFileSync } from 'node:child_process';\nimport { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';\nimport { build } from './review-component-test-build.ts';\n\n"
      ],
      [
        "  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));\n  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));\n  assert.equal(review.revision, '9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  assert.equal(learner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  assert.equal(learner.patientDataIncluded, false);\n  assert.equal(learner.clinicalApproved, false);\n  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));\n  for (const path of ['content/thoracic-quiz.ts', 'content/thoracic-quiz-pins.json', 'lib/thoracic-quiz.ts']) {\n    const file = review.files.find((f: any) => f.path === path);\n",
        "  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));\n  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));\n  assert.equal(review.revision, '190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(learner.patientDataIncluded, false);\n  assert.equal(learner.clinicalApproved, false);\n  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));\n  const sourceRoot=currentAtlasDeliveryRoot();\n  for (const path of ['content/thoracic-quiz.ts', 'content/thoracic-quiz-pins.json', 'lib/thoracic-quiz.ts']) {\n    const file = review.files.find((f: any) => f.path === path);\n"
      ],
      [
        "    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);\n  }\n  const result = await build({\n",
        "    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);\n    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);\n    const committed=(revision:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n      {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n    assert.deepEqual(committed(review.revision),committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2'),path+' exact 9f source retained');\n    assert.equal(file.sourceSha256,createHash('sha256').update(committed(review.revision)).digest('hex'));\n  }\n  const result = await build({\n"
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
test('all original clinical imaging/quiz bodies survive outside explicit historical/current seams',()=>{
 for(const {name,sha:historicalSha,edits} of allowed){
  const original=readFileSync(join(here,rawDir,name+'.raw'));
  assert.equal(sha(original),historicalSha,name+' authenticated original bytes');
  let expected=original.toString('utf8');
  for(const [before,after] of edits)expected=replaceExactlyOnce(expected,before,after,name);
  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');
 }
});
