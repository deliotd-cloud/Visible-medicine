import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import {restoreAdjacentRegionalQueryLayer} from './adjacent-regional-query-composition.mjs';
// Generated exact inverse data for declared test-only seams.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const adjacentRoleRecords=[
  {
    "name": "tests/tour-playback-source-role.mjs",
    "label": "original-helper-to-reviewed5e75",
    "beforeSha256": "775cc7c79587352fc95d388f23682cac6090218f661d58b08cf0325480780b89",
    "afterSha256": "6811145340655e9cd80c066dc65a8fc8c116906979d978a3c70d5c7017b03546",
    "seams": [
      [
        "const currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';",
        "const currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';\nconst latestSource='5e75b9ce7e46fed291748108edd7565c97dee101';\nconst latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';"
      ],
      [
        " const source=readFileSync(helperSource,'utf8').replaceAll('\\r\\n','\\n');",
        " const source=historicalRenalHelperSource(helperSource);"
      ],
      [
        "export function assertCurrentTourAdditions",
        "function historicalRenalHelperSource(helperSource){\n let source=readFileSync(helperSource,'utf8').replaceAll('\\r\\n','\\n');\n if(sha(source)!==originalHelperSha){\n  assert.equal(String(helperSource),String(new URL('./renal-tour-epoch-admission.mjs',import.meta.url)),\n   'Only the locally composed helper may use the exact preserved historical source');\n  source=readFileSync(new URL('./fixtures/renal-epoch-preimage/renal-tour-epoch-admission.mjs.raw',import.meta.url),'utf8')\n   .replaceAll('\\r\\n','\\n');\n }\n assert.equal(sha(source),originalHelperSha,'Authentic complete original renal helper');\n return source;\n}\n\nexport function assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot,helperSource}){\n const source=historicalRenalHelperSource(helperSource);\n const start='export function assertRenalPortalPrefixEpoch(portal,currentTours){';\n assert.equal(source.split(start).length,2);\n const body=source.slice(source.indexOf(start)).replace(/^export /,'');\n const original=new Function('assert','sha','portalTourSha','newTourSha','oldRevision','newRevision',\n  'assertCurrentRenalSourceBinding',`${body}\\nreturn assertRenalPortalPrefixEpoch;`)(\n  assert,sha,'2766dbafed9e364bffc3c37aa52c1f0e3b7d92e0bb46c62f250d247ae0442b3f',\n  historicalToursSha,'renal-organs-arteries-orientation-v1',\n  'renal-organs-arteries-orientation-20261022-source-bound-draft',\n  ()=>assertHistoricalRenalSource(atlasRoot));\n original(portal,renalEra);\n}\n\nexport function assertCurrentTourAdditions"
      ],
      [
        "export function assertCurrentGuidedReviewAdditions",
        "export function assertLatestTourDelivery(renalEra,current,{atlasRoot,sourceCommit}){\n assert.equal(sourceCommit,latestSource,'Only the bound current Website source is admitted');\n assert.equal(revision(atlasRoot,latestSource),latestSource);\n assert.equal(tree(atlasRoot,latestSource),latestTree);\n assert.equal(git(atlasRoot,'merge-base',currentSource,latestSource).toString().trim(),currentSource,\n  'Reviewed parser epoch is an ancestor of current delivery');\n for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts',\n  'lib/posterior-calf-tour.ts','lib/shoulder-tours.ts','lib/body-review-material.ts',\n  'lib/body-review-context.ts','app/body-content.ts'])\n  assert.deepEqual(blob(atlasRoot,latestSource,path),blob(atlasRoot,currentSource,path),\n   path+': complete reviewed tour and Review source retained');\n return assertCurrentTourAdditions(renalEra,current,{atlasRoot,sourceCommit:currentSource});\n}\n\nexport function assertCurrentGuidedReviewAdditions"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/tour-playback-source-role.mjs.775cc7c79587.raw"
  },
  {
    "name": "tests/renal-tour-epoch-admission.mjs",
    "label": "original-renal-helper-to-reviewed5e75",
    "beforeSha256": "2e0b1a061148daf71317b05c179eef9c1c4dac65cf25d79d7a5b5b3b6e8dbb8c",
    "afterSha256": "38ae31b79ab7d0d307da83c92994d9937e63f175f00c8728b49d8f6f1bbb4188",
    "seams": [
      [
        "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
        "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {assertHistoricalRenalTourEpoch,assertHistoricalRenalPortalPrefixEpoch,\n assertLatestTourDelivery} from './tour-playback-source-role.mjs';"
      ],
      [
        "const current='2381efe43b75f8a7fb768a069eecd7268c508dac';",
        "const current='2381efe43b75f8a7fb768a069eecd7268c508dac';\nconst latest='5e75b9ce7e46fed291748108edd7565c97dee101';\nconst latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';\nconst hamstringIntroduction='7978478992f54ea68e0f53c3d195c459c7b80068';\nconst latestRegionalSha='b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d';\nconst latestRegionalBlob='3c5647f29383ba5699b6d387ff528f6b0f8f57b9';"
      ],
      [
        "export function assertCurrentRenalSourceBinding",
        "function assertLatestRenalSourceBinding(){\n const pin=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();\n assert.equal(CURRENT_ATLAS_REVISION,latest,'Only exact reviewed latest delivery is admitted');\n assert.equal(pin.source,latest);assert.equal(pin.sourceTree,latestTree);\n assert.equal(git(root,'rev-parse','HEAD').toString().trim(),latest);\n assert.equal(git(root,'rev-parse',`${latest}^{tree}`).toString().trim(),latestTree);\n assert.equal(git(root,'rev-parse',`${introduced}^`).toString().trim(),before);\n assert.equal(git(root,'merge-base',current,latest).toString().trim(),current);\n assert.equal(git(root,'merge-base',hamstringIntroduction,latest).toString().trim(),hamstringIntroduction);\n const review=json('atlas-review/manifest.json'),integration=json('atlas-review/integration-inputs.json');\n assert.equal(review.revision,latest);assert.equal(integration.sourceCommit,latest);\n for(const [path,identity] of Object.entries(sourcePins)){\n  const historical=git(root,'show',`${current}:${path}`);\n  assert.equal(sha(historical),identity.current,path+': exact historical renal source');\n  assert.deepEqual(historical,git(root,'show',`${introduced}:${path}`),path+': original renal introduction retained');\n  const expected=path==='lib/regional-tours.ts'?latestRegionalSha:identity.current;\n  const now=git(root,'show',`${latest}:${path}`);\n  assert.equal(sha(now),expected,path+': exact current source');\n  if(path==='lib/regional-tours.ts'){\n   assert.deepEqual(now,git(root,'show',`${hamstringIntroduction}:${path}`),path+': exact later tour introduction');\n   assert.equal(git(root,'rev-parse',`${latest}:${path}`).toString().trim(),latestRegionalBlob);\n  }else assert.deepEqual(now,historical,path+': retained renal source');\n  assert.equal(sha(readFileSync(root+'/'+path)),expected,path+': Atlas checkout');\n  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),expected,path+': Review import');\n  const record=review.files.find(item=>item.path===path);assert(record,path+': Review source record');\n  assert.equal(record.sourceSha256,expected,path+': Review source hash');\n  assert.equal(record.importedSha256,expected,path+': Review import hash');\n  assert.equal(integration.inputs.find(item=>item.path==='atlas-review/'+path)?.sha256,expected,\n   path+': Review integration input');\n }\n const runtime=json('public/atlas-runtime/head-neck/manifest.json');\n const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');\n assert.equal(runtime.sourceCommit,latest);\n assert.equal(inputs.find(item=>item.path==='lib/regional-tours.ts')?.sha256,latestRegionalSha);\n return {sha256:latestRegionalSha,gitBlob:latestRegionalBlob,\n  oldSha256:sourcePins['lib/regional-tours.ts'].old,\n  oldGitBlob:sourcePins['lib/regional-tours.ts'].oldBlob};\n}\n\nexport function assertCurrentRenalSourceBinding"
      ],
      [
        "export function assertCurrentRenalSourceBinding(){\n",
        "export function assertCurrentRenalSourceBinding(){\n if(CURRENT_ATLAS_REVISION===latest)return assertLatestRenalSourceBinding();\n"
      ],
      [
        "export function assertRenalTourEpoch(historical,currentTours){\n",
        "export function assertRenalTourEpoch(historical,currentTours){\n if(CURRENT_ATLAS_REVISION===latest){\n  assertLatestRenalSourceBinding();\n  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();\n  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,\n   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertLatestTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:latest});\n  return;\n }\n"
      ],
      [
        "export function assertRenalPortalPrefixEpoch(portal,currentTours){\n",
        "export function assertRenalPortalPrefixEpoch(portal,currentTours){\n if(CURRENT_ATLAS_REVISION===latest){\n  assertLatestRenalSourceBinding();\n  const renalEra=currentTours.slice(0,51),root=currentAtlasDeliveryRoot();\n  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,\n   helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertLatestTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:latest});\n  return;\n }\n"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/renal-tour-epoch-admission.mjs.2e0b1a061148.raw"
  },
  {
    "name": "tests/arterial-history-preservation.test.mjs",
    "label": "arterial-current-b79",
    "beforeSha256": "772ae526217164d2e24809eec7d29460aff7ed082d35937323c9741b369887df",
    "afterSha256": "c4697cc3a83d1515a434d07e680790a9d494174cd45b801d3db7b67f5471d05e",
    "seams": [
      [
        "independent of current 5e75 delivery.",
        "independent of current b79 delivery."
      ],
      [
        " assert.equal(CURRENT_ATLAS_REVISION,'5e75b9ce7e46fed291748108edd7565c97dee101','Explicit current source remains separately bound');",
        " assert.equal(CURRENT_ATLAS_REVISION,'b79e110d2d28f18993263926ba35aa7a3f478b20','Explicit current source remains separately bound');"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/arterial-history-preservation.test.mjs.772ae5262171.raw"
  },
  {
    "name": "tests/clinical-review-continuous-guided-playback.test.ts",
    "label": "playback-current-b79-and-complete-membership",
    "beforeSha256": "5b6614bf7aa0d511e54a9a38562be8ad6bbfdc03fd79c1d7af0314fe0d3e50f7",
    "afterSha256": "5ee4b4fc3e2bfbf3525d30caf520d6843d3922aca892e6b051802491a26288c0",
    "seams": [
      [
        "import {emittedTeaching} from './atlas-emitted-teaching.ts';",
        "import {emittedTeaching} from './atlas-emitted-teaching.ts';\r\nimport {assertCurrentTourDelivery,assertCompleteGuidedReview} from './adjacent-current-tour-source-role.mjs';"
      ],
      [
        "const reviewedCurrentCommit='5e75b9ce7e46fed291748108edd7565c97dee101';",
        "const reviewedCurrentCommit='b79e110d2d28f18993263926ba35aa7a3f478b20';"
      ],
      [
        "  assertLatestTourDelivery(renal.regionalTours,imported.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});",
        "  assertCurrentTourDelivery(renal.regionalTours,imported.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"
      ],
      [
        "  assertLatestTourDelivery(renal.regionalTours,current.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});",
        "  assertCurrentTourDelivery(renal.regionalTours,current.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"
      ],
      [
        "  const reasoningRevision='aa13c067197cad87bd0a9b2da5549bc4b33bfdf7';",
        "  const reasoningRevision='b79e110d2d28f18993263926ba35aa7a3f478b20';\r\n  assert.deepEqual(committed('5e75b9ce7e46fed291748108edd7565c97dee101','lib/reasoning-questions.ts'),\r\n    committed('aa13c067197cad87bd0a9b2da5549bc4b33bfdf7','lib/reasoning-questions.ts'),\r\n    'The original lower-limb reasoning theorem stays at its genuine5e75/aa13 source');"
      ],
      [
        "    'Current reasoning equals the exact reviewed lower-limb arterial source');",
        "    'Current reasoning equals the separately authenticated b79 source');"
      ],
      [
        "    assert.deepEqual(atPlayback.guidedTours,atEpoch.guidedTours, /* playback epoch only */",
        "    assert.deepEqual(atRenal.guidedTours,atEpoch.guidedTours, /* historical renal membership */"
      ],
      [
        "    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,after.guidedTours,current.regionalTours);",
        "    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,after.guidedTours,current.regionalTours);\r\n    assertCompleteGuidedReview(structure.id,atRenal.guidedTours,after.guidedTours,current.regionalTours);"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/clinical-review-continuous-guided-playback.test.ts.5b6614bf7aa0.raw"
  },
  {
    "name": "tests/renal-tour-epoch-admission.mjs",
    "label": "renal-b79-separate-branch",
    "beforeSha256": "38ae31b79ab7d0d307da83c92994d9937e63f175f00c8728b49d8f6f1bbb4188",
    "afterSha256": "cefd1d05755017e215c3bf116af23c5bcdcea86a571bc1e1c7e5c3c824195276",
    "seams": [
      [
        "import {fileURLToPath} from 'node:url';",
        "import {fileURLToPath} from 'node:url';\nimport {assertCurrentTourSource,assertCurrentTourDelivery} from './adjacent-current-tour-source-role.mjs';"
      ],
      [
        "export function assertCurrentRenalSourceBinding(){",
        "export function assertCurrentRenalSourceBinding(){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20')return assertCurrentTourSource();"
      ],
      [
        "export function assertRenalTourEpoch(historical,currentTours){",
        "export function assertRenalTourEpoch(historical,currentTours){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){\n  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);\n  assertCurrentTourSource({atlasRoot:root});\n  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;\n }"
      ],
      [
        "export function assertRenalPortalPrefixEpoch(portal,currentTours){",
        "export function assertRenalPortalPrefixEpoch(portal,currentTours){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){\n  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);\n  assertCurrentTourSource({atlasRoot:root});\n  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;\n }"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/renal-tour-epoch-admission.mjs.38ae31b79ab7.raw"
  },
  {
    "name": "tests/renal-tour-epoch-admission.test.mjs",
    "label": "renal-consumer-b79-with-real-history-retained",
    "beforeSha256": "704bc9543c5ba904a600048e1a3576ea5b942d5323ea5a6658a9de617c28a97a",
    "afterSha256": "a8868557f21bcd12f1333874211ef4297404c45fcc57c3696683b29ecfe448ee",
    "seams": [
      [
        "import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';",
        "import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';\nimport {assertCurrentTourDelivery} from './adjacent-current-tour-source-role.mjs';"
      ],
      [
        "  sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});",
        "  sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});\n assertCurrentTourDelivery(renalEra.regionalTours,review.regionalTours,{atlasRoot:atlas,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'});"
      ],
      [
        "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck']}),'5e75b9ce7e46fed291748108edd7565c97dee101');",
        "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck']}),'b79e110d2d28f18993263926ba35aa7a3f478b20');"
      ],
      [
        "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes:sharedHashes,learnerModules:['head-neck','shoulder']}),'5e75b9ce7e46fed291748108edd7565c97dee101');",
        "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes:sharedHashes,learnerModules:['head-neck','shoulder']}),'b79e110d2d28f18993263926ba35aa7a3f478b20');"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/renal-tour-epoch-admission.test.mjs.704bc9543c5b.raw"
  },
  {
    "name": "release-to-lower",
    "label": "reviewed-preservation-to-lower-parent",
    "beforeSha256": "bb89e3cc046c21483093e8029ed9a2eca31e9029dd107d29a50af79fd4ab1e24",
    "afterSha256": "0bc8ab0d9928b19bac75b36ffc8a0870d0e6cc4b7aba5fd7487dce553fc49a9a",
    "removals": [
      "import {restoreArterialCurrentRole} from './arterial-current-role-inverse.mjs';\n",
      "import {restoreHandCurrentRole} from './hand-current-role-inverse.mjs';\n",
      "import {restoreShoulderCurrentRole} from './shoulder-current-role-inverse.mjs';\n",
      "import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';\n",
      "if(row.path==='tests/arterial-history-preservation.test.mjs')bytes=restoreArterialCurrentRole(bytes);",
      "if(row.path==='tests/clinical-review-hand-arterial-xray.test.ts')bytes=restoreHandCurrentRole(bytes);",
      "if(['tests/clinical-review-elbow-us-followup.test.ts','tests/clinical-review-forearm-vascular-xray.test.ts'].includes(row.path))bytes=restoreShoulderCurrentRole(row.path.slice(6),bytes);",
      "if(['tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-girdle-muscle-xray.test.ts'].includes(row.path))bytes=restoreClinicalStructureCurrentRole(row.path.slice(6),bytes);"
    ]
  },
  {
    "name": "tests/clinical-review-continuous-guided-playback.test.ts",
    "label": "exact-recorded-renal-revision-only",
    "beforeSha256": "5ee4b4fc3e2bfbf3525d30caf520d6843d3922aca892e6b051802491a26288c0",
    "afterSha256": "bcfce60a62b8a63841badbee0741ff78d5c08d09ba1d9da890d22d5d87098d24",
    "seams": [
      [
        "    assert.deepEqual(atRenal.guidedTours,atEpoch.guidedTours, /* historical renal membership */\r\n      `${structure.id}: historical guide evidence remains exactly the playback epoch`);",
        "    const expectedRenalGuides=atEpoch.guidedTours.map((evidence:any)=>{\r\n      if(evidence.tour.id!=='renal-organs-arteries-orientation')return evidence;\r\n      assert.equal(evidence.tour.revision,'renal-organs-arteries-orientation-v1');\r\n      return {...evidence,tour:{...evidence.tour,revision:'renal-organs-arteries-orientation-20261022-source-bound-draft'}};\r\n    });\r\n    assert.deepEqual(atRenal.guidedTours,expectedRenalGuides,\r\n      `${structure.id}: only the recorded renal tour revision differs from the playback epoch`);"
      ]
    ],
    "preimage": "tests/fixtures/adjacent-reviewed5e75/clinical-review-continuous-guided-playback.test.ts.5ee4b4fc3e2b.raw"
  }
];
export function restoreAdjacentSharedRole(name,bytes){bytes=restoreAdjacentRegionalQueryLayer(name,bytes);bytes=restoreReleaseDiagnosticContext(name,bytes);const rows=adjacentRoleRecords.filter(r=>r.name===name);assert(rows.length,'Declared adjacent role only');for(const r of rows.toReversed()){assert.equal(sha(bytes),r.afterSha256,'Exact complete adjacent current source: '+r.label);let text=bytes.toString();if(r.removals){for(const value of r.removals){assert.equal(text.split(value).length,2);text=text.replace(value,'');}}else for(const [before,after]of r.seams.toReversed()){assert.equal(text.split(after).length,2,'One declared inverse seam');text=text.replace(after,before);}bytes=Buffer.from(text);assert.equal(sha(bytes),r.beforeSha256,'Whole prior adjacent source: '+r.label);}return bytes;}
