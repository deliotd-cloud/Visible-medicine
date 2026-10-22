import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const here=dirname(fileURLToPath(import.meta.url));
const rawDir='fixtures/limb-suprahyoid-before-role-batch-20261021';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Complete exact permitted edits; no diff algorithm runs in this guard.
const allowed=[
  {
    "name": "clinical-review-um-ankle-imaging.test.ts",
    "sha": "e453387dfd045a0dcd744996165fd949d08446ef0afd5b6adaaf4e8c49e9176b",
    "edits": [
      [
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { build } from 'esbuild';\n\ntest('seven ankle drafts reach both learner modules and exact specimen review', async () => {\n  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));\n  assert.equal(review.revision, '9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n  const pins = {\n    'content/um-calf-foot-clinical.ts': '557ae3859bea0db95f70303474d9afa053a8dec0380a6ffc325c070f281c9fd1',\n",
        "import { readFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\nimport { execFileSync } from 'node:child_process';\nimport { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';\nimport { build } from 'esbuild';\n\ntest('seven ankle drafts reach both learner modules and exact specimen review', async () => {\n  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));\n  assert.equal(review.revision, '190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const sourceRoot=currentAtlasDeliveryRoot();\n  const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  const pins = {\n    'content/um-calf-foot-clinical.ts': '557ae3859bea0db95f70303474d9afa053a8dec0380a6ffc325c070f281c9fd1',\n"
      ],
      [
        "    // Both learner runtimes now use the same current teaching bindings.\n    // The original ankle module remains byte-identical despite additive drafts.\n    assert.equal(manifest.sourceCommit, '9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n    for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(manifest[key], false);\n    for (const [path, expected] of Object.entries(pins)) {\n",
        "    // Both learner runtimes now use the same current teaching bindings.\n    // The original ankle module remains byte-identical despite additive drafts.\n    assert.equal(manifest.sourceCommit, '190a63238eadcf906abe89dcbb6a67c88afe70b9');\n    for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(manifest[key], false);\n    for (const [path, expected] of Object.entries(pins)) {\n"
      ],
      [
        "      assert.equal(imported.sourceSha256, expected);\n      assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), imported.importedSha256);\n    }\n  }\n",
        "      assert.equal(imported.sourceSha256, expected);\n      assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), imported.importedSha256);\n      const current=committed(review.revision,path);\n      assert.deepEqual(current,committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path),path+' exact 9f teaching source');\n      assert.equal(createHash('sha256').update(current).digest('hex'),expected,path+' committed source');\n    }\n  }\n"
      ]
    ]
  },
  {
    "name": "clinical-review-upper-limb-completion-quiz.test.ts",
    "sha": "17a3cc58b361390d3e42570a86a9fb2c192c8cf80f985eae523af16e76d84c72",
    "edits": [
      [
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {build} from 'esbuild';\n\n",
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {execFileSync} from 'node:child_process';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\nimport {build} from 'esbuild';\n\n"
      ],
      [
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='cbda5345d2aaa730b0361e7e374e356478f6222d';\nconst pinsHash='ac14b21fdbdd1d5d1671bdd410932e8d87c0ac6bd56226c2e9273ac7f0053e0b';\n",
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='cbda5345d2aaa730b0361e7e374e356478f6222d';\nconst pinsHash='ac14b21fdbdd1d5d1671bdd410932e8d87c0ac6bd56226c2e9273ac7f0053e0b';\n"
      ],
      [
        " const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n assert.equal(review.revision,revision);\n const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n for(const path of ['content/upper-limb-completion-quiz.ts','content/upper-limb-completion-quiz-pins.json','lib/upper-limb-completion-quiz.ts']){\n",
        " const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n assert.equal(review.revision,revision);\n const sourceRoot=currentAtlasDeliveryRoot();\n const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n for(const path of ['content/upper-limb-completion-quiz.ts','content/upper-limb-completion-quiz-pins.json','lib/upper-limb-completion-quiz.ts']){\n"
      ],
      [
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n }\n const pins=JSON.parse(readFileSync('atlas-review/content/upper-limb-completion-quiz-pins.json','utf8'));\n assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);\n",
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n  const current=committed(revision,path);\n  assert.deepEqual(current,committed(historicalRevision,path),path+' exact 9f quiz source');\n  assert.equal(source.sha256,sha(current),path+' committed source');\n }\n const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);\n assert.equal(sha(committed(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');\n const currentDispatch=sha(committed(revision,'app/body-content.ts'));\n assert.equal(currentDispatch,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n assert.equal(dispatch.sourceSha256,currentDispatch);\n assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));\n assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);\n const pins=JSON.parse(readFileSync('atlas-review/content/upper-limb-completion-quiz-pins.json','utf8'));\n assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);\n"
      ]
    ]
  },
  {
    "name": "clinical-review-shoulder-girdle-artery-quiz.test.ts",
    "sha": "31323ff1f752edf060a9ecc335b7338ffb023773e1e76df3796249c5d978ef5c",
    "edits": [
      [
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {build} from 'esbuild';\n\n",
        "import {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {execFileSync} from 'node:child_process';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\nimport {build} from 'esbuild';\n\n"
      ],
      [
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='fa74cf70009f5ad8e21087ab12e4589547ebf741';\nconst pinsHash='4fb745d06a9ee8ec2d920c7472672f5c160439507fcf6fbf6fa82d975f2bdca9';\n",
        "const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));\nconst base='public/atlas-runtime/head-neck/';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst parent='fa74cf70009f5ad8e21087ab12e4589547ebf741';\nconst pinsHash='4fb745d06a9ee8ec2d920c7472672f5c160439507fcf6fbf6fa82d975f2bdca9';\n"
      ],
      [
        " assert.equal(learner.sourceCommit,revision);\n assert.equal(review.revision,revision);\n const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n for(const path of ['content/shoulder-girdle-artery-quiz.ts','content/shoulder-girdle-artery-quiz-pins.json','lib/shoulder-girdle-artery-quiz.ts']){\n",
        " assert.equal(learner.sourceCommit,revision);\n assert.equal(review.revision,revision);\n const sourceRoot=currentAtlasDeliveryRoot();\n const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],\n  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n for(const path of ['content/shoulder-girdle-artery-quiz.ts','content/shoulder-girdle-artery-quiz-pins.json','lib/shoulder-girdle-artery-quiz.ts']){\n"
      ],
      [
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n }\n const pins=JSON.parse(readFileSync('atlas-review/content/shoulder-girdle-artery-quiz-pins.json','utf8'));\n assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);\n",
        "  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);\n  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);\n  const current=committed(revision,path);\n  assert.deepEqual(current,committed(historicalRevision,path),path+' exact 9f quiz source');\n  assert.equal(source.sha256,sha(current),path+' committed source');\n }\n const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);\n assert.equal(sha(committed(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');\n const currentDispatch=sha(committed(revision,'app/body-content.ts'));\n assert.equal(currentDispatch,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n assert.equal(dispatch.sourceSha256,currentDispatch);\n assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));\n assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);\n const pins=JSON.parse(readFileSync('atlas-review/content/shoulder-girdle-artery-quiz-pins.json','utf8'));\n assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);\n"
      ]
    ]
  },
  {
    "name": "clinical-review-suprahyoid-quiz.test.ts",
    "sha": "44f4f13cc6a1feafd40369977b8d4c89f08ab7472387275c36d4ca450c5268a3",
    "edits": [
      [
        "import {build} from 'esbuild';\nimport {emittedTeaching} from './atlas-emitted-teaching.ts';\n\nconst revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst previous='29d0738781d1acff7e2feb097d7ff9a10f35376e';\nconst atlas='F:/VisibleMedicine/atlas';\nconst base='public/atlas-runtime/head-neck/';\nconst paths=['content/suprahyoid-muscle-quiz-pins.json','content/suprahyoid-muscle-quiz.ts','lib/suprahyoid-muscle-quiz.ts'];\n",
        "import {build} from 'esbuild';\nimport {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst previous='29d0738781d1acff7e2feb097d7ff9a10f35376e';\nconst atlas=currentAtlasDeliveryRoot();\nconst base='public/atlas-runtime/head-neck/';\nconst paths=['content/suprahyoid-muscle-quiz-pins.json','content/suprahyoid-muscle-quiz.ts','lib/suprahyoid-muscle-quiz.ts'];\n"
      ],
      [
        " for(const path of paths){\n  const original=source(revision,path),digest=sha(original);\n  const record=review.files.find((file:{path:string})=>file.path===path);\n  assert(record,`Review missing ${path}`);\n",
        " for(const path of paths){\n  const original=source(revision,path),digest=sha(original);\n  assert.deepEqual(original,source(historicalRevision,path),path+' exact 9f quiz source');\n  const record=review.files.find((file:{path:string})=>file.path===path);\n  assert(record,`Review missing ${path}`);\n"
      ],
      [
        "   original.toString().replace(/\\r\\n/g,'\\n'),path);\n }\n const pins=json('atlas-review/'+paths[0]);\n assert.equal(pins.parentCommit,'6d3de0ae013103a2eaf06e1263ecef21c10f0672');\n",
        "   original.toString().replace(/\\r\\n/g,'\\n'),path);\n }\n const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);\n assert.equal(sha(source(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');\n const currentDispatch=sha(source(revision,'app/body-content.ts'));\n assert.equal(currentDispatch,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');\n assert.equal(dispatch.sourceSha256,currentDispatch);\n assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));\n assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);\n const pins=json('atlas-review/'+paths[0]);\n assert.equal(pins.parentCommit,'6d3de0ae013103a2eaf06e1263ecef21c10f0672');\n"
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
test('all original limb and suprahyoid test bodies survive outside explicit role seams',()=>{
 for(const {name,sha:historicalSha,edits} of allowed){
  const original=readFileSync(join(here,rawDir,name+'.raw'));
  assert.equal(sha(original),historicalSha,name+' authenticated original bytes');
  let expected=original.toString('utf8');
  for(const [before,after] of edits)expected=replaceExactlyOnce(expected,before,after,name);
  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');
 }
});
