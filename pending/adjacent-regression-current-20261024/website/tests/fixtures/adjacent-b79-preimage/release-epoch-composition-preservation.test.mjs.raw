import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';
import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';
import {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';
const rows=[
  {
    "path": "tests/historical-review-ae84.mjs",
    "before": "d6e4bbb9e02ec60d64e685c8565f4d9baa73f9cdf2fa75d6857e83a5ddcd3a37",
    "after": "6296daa02ffc1a1eb8dd3aaf1588ad8caf6f851122809e78bd0b8dcdf954d824",
    "edits": [
      {
        "i": 15,
        "j": 15,
        "before": [],
        "after": [
          " ['lib/atlas-model-inventory.json',['model-inventory.json.raw','a9eb65f2f5645bcc88326dc41f3e5c0a8a37530aa0bc04deefd6bbd6078e8757']],",
          " ['public/atlas-runtime/head-neck/manifest.json',['head-neck-manifest.json.raw','19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b']],",
          " ['public/atlas-runtime/head-neck/source-inputs.json',['head-neck-source-inputs.json.raw','b76525d1b8da433e95b8c9c58af675ef2f4d337c8e6fb35e91cf1e5955ba7dba']],"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/historical-review-ae84.mjs.raw"
  },
  {
    "path": "tests/atlas-label-keyboard.test.ts",
    "before": "34e80eada4c9163021072db22f2a3978c231e0ffbe61e408cc1540835143e4c9",
    "after": "928e48406373c864c961cd87b1146b749a6ef403ac8de509dedc883c5b320515",
    "edits": [
      {
        "i": 57,
        "j": 57,
        "before": [],
        "after": [
          " const ae84KeyboardSource=JSON.parse(sourceBytes('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','content/review-revisions.json').toString());"
        ]
      },
      {
        "i": 66,
        "j": 67,
        "before": [
          " assert.equal(source.sourceRevisions[id].geometry,"
        ],
        "after": [
          " assert.equal(ae84KeyboardSource.revisions[id].geometry,"
        ]
      },
      {
        "i": 68,
        "j": 69,
        "before": [
          "  'Current shoulder display geometry follows committed Atlas source');"
        ],
        "after": [
          "  'Original ae84 shoulder display geometry remains pinned at its immutable source');"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/atlas-label-keyboard.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-axillary-branch-xray.test.ts",
    "before": "3e59090c898f10709b7c9c62f67481fdd51380b2afcadcf64716a9c3afdd957b",
    "after": "ab1425cecf8040d098eb74926b2d3dfcf4a98f25b94c64c3ad3a4ac525444166",
    "edits": [
      {
        "i": 1,
        "j": 1,
        "before": [],
        "after": [
          "import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';"
        ]
      },
      {
        "i": 230,
        "j": 231,
        "before": [
          " assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(live.regionalTours,old.regionalTours);"
        ],
        "after": [
          " assert.deepEqual(current.regionalTours,live.regionalTours);assertRenalTourEpoch(old.regionalTours,live.regionalTours);"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-axillary-branch-xray.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-continuous-guided-playback.test.ts",
    "before": "2910f8ebf8610c3d3870ca069a321fc00e05bb30cc7d099020e41c44aba3bb56",
    "after": "92ffeb69f175623981e443c1d63d43bdb1a6f5a70798553fbadc10999fab1d89",
    "edits": [
      {
        "i": 1,
        "j": 1,
        "before": [],
        "after": [
          "import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';\r"
        ]
      },
      {
        "i": 197,
        "j": 198,
        "before": [
          "  assert.deepEqual(current.regionalTours,old.regionalTours);\r",
          "  assert.deepEqual(current.regionalTours,epoch.regionalTours);\r"
        ],
        "after": [
          "  assertRenalTourEpoch(old.regionalTours,current.regionalTours);\r",
          "  assertRenalTourEpoch(epoch.regionalTours,current.regionalTours);\r"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-continuous-guided-playback.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-girdle-muscle-xray.test.ts",
    "before": "78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288",
    "after": "66d1e61d1708b8bdc70468ae9d757b33ddecca409a9078b1c439d1378d7ea0e1",
    "edits": [
      {
        "i": 1,
        "j": 1,
        "before": [],
        "after": [
          "import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';"
        ]
      },
      {
        "i": 246,
        "j": 247,
        "before": [
          " assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(live.regionalTours,old.regionalTours);"
        ],
        "after": [
          " assert.deepEqual(current.regionalTours,live.regionalTours);assertRenalTourEpoch(old.regionalTours,live.regionalTours);"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-girdle-muscle-xray.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-hand-arterial-xray.test.ts",
    "before": "819ed7fdef7d3b1afc24768a3008b7f3403c5eb8a7581b682639c10526b1e19a",
    "after": "7f2ac953efdd39445c376a7c68c2a15b0c9dd121e33864ba25fb5bb591793a4f",
    "edits": [
      {
        "i": 9,
        "j": 9,
        "before": [],
        "after": [
          "import {assertRenalPortalPrefixEpoch} from './renal-tour-epoch-admission.mjs';\r"
        ]
      },
      {
        "i": 201,
        "j": 202,
        "before": [
          " assert.deepEqual(current.regionalTours.slice(0,27),portal.regionalTours.slice(0,27),\r",
          "  'Earlier historical tours remain exact');\r"
        ],
        "after": [
          " assertRenalPortalPrefixEpoch(portal.regionalTours,current.regionalTours);\r"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-hand-arterial-xray.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-current-admission.mjs",
    "before": "181b1df7681ca831a9432559863bc65e7154cd64da8eb8d1686b7108aa56a791",
    "after": "1300f5856169ded33ada59087360630fee464ab4dbd26d8a42a847c480695da0",
    "edits": [
      {
        "i": 9,
        "j": 9,
        "before": [],
        "after": [
          "import {assertCurrentRenalSourceBinding} from './renal-tour-epoch-admission.mjs';"
        ]
      },
      {
        "i": 44,
        "j": 45,
        "before": [
          "  assert.deepEqual(current,old,path+': unchanged source across epochs');"
        ],
        "after": [
          "  const currentExpected=path==='lib/regional-tours.ts'?",
          "   assertCurrentRenalSourceBinding().sha256:expected;",
          "  if(path==='lib/regional-tours.ts')assert.equal(sha(current),currentExpected,path+': exact later renal admission');",
          "  else assert.deepEqual(current,old,path+': unchanged source across epochs');"
        ]
      },
      {
        "i": 47,
        "j": 51,
        "before": [
          "  assert.equal(record.sourceSha256,expected,path+': Review source');",
          "  assert.equal(record.importedSha256,expected,path+': Review import');",
          "  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),expected,path+': Review bytes');"
        ],
        "after": [
          "  assert.equal(record.sourceSha256,currentExpected,path+': Review source');",
          "  assert.equal(record.importedSha256,currentExpected,path+': Review import');",
          "  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),currentExpected,path+': Review bytes');"
        ]
      },
      {
        "i": 52,
        "j": 56,
        "before": [
          "   assert.equal(sha(family),expected,name+': unchanged source in admitted family '+path);"
        ],
        "after": [
          "   const familyExpected=path==='lib/regional-tours.ts'&&pin.runtimeSources[name]===pin.source?currentExpected:expected;",
          "   assert.equal(sha(family),familyExpected,name+': exact source in admitted family '+path);"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-current-admission.mjs.raw"
  },
  {
    "path": "tests/clinical-review-elbow-us-followup.test.ts",
    "before": "8f16b3d999c5ee2964a5cce9d936debfeb5df51f8b3d50f6fa43183bf46f7776",
    "after": "8c52a386cff7675adf9862592386e28e4167d6e389f7b8a9c1780190e47fbe40",
    "edits": [
      {
        "i": 12,
        "j": 12,
        "before": [],
        "after": [
          "import {assertCurrentRenalSourceBinding,assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';"
        ]
      },
      {
        "i": 266,
        "j": 267,
        "before": [
          "  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');"
        ],
        "after": [
          "  const renalBoundary=assertCurrentRenalSourceBinding();",
          "  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),renalBoundary.gitBlob);"
        ]
      },
      {
        "i": 269,
        "j": 271,
        "before": [
          "  assert.equal(regionalRecord.sourceSha256,'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97');"
        ],
        "after": [
          "  assert.equal(regionalRecord.sourceSha256,renalBoundary.sha256);"
        ]
      },
      {
        "i": 274,
        "j": 276,
        "before": [
          "  assert.deepEqual(currentImport.regionalTours,api.regionalTours,'current delivery retains closed 9f tours');"
        ],
        "after": [
          "  assertRenalTourEpoch(api.regionalTours,currentImport.regionalTours);"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-elbow-us-followup.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-forearm-vascular-xray.test.ts",
    "before": "90b1c26a19220053633a277b10d94b74c4d3c2f6ebc6e3cd8ccf4bccdd2fdda4",
    "after": "03a72a733f624b619737793d7bac519a5e9c2fef47f849be2481ac01f33a88d4",
    "edits": [
      {
        "i": 12,
        "j": 12,
        "before": [],
        "after": [
          "import {assertCurrentRenalSourceBinding,assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';"
        ]
      },
      {
        "i": 226,
        "j": 227,
        "before": [
          "  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');"
        ],
        "after": [
          "  const renalBoundary=assertCurrentRenalSourceBinding();",
          "  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),renalBoundary.gitBlob);"
        ]
      },
      {
        "i": 229,
        "j": 231,
        "before": [
          "  assert.equal(regionalRecord.sourceSha256,'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97');"
        ],
        "after": [
          "  assert.equal(regionalRecord.sourceSha256,renalBoundary.sha256);"
        ]
      },
      {
        "i": 233,
        "j": 235,
        "before": [
          "  assert.deepEqual((await imported()).regionalTours,live.regionalTours,'current delivery retains closed 9f tours');"
        ],
        "after": [
          "  assertRenalTourEpoch(live.regionalTours,(await imported()).regionalTours);"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-forearm-vascular-xray.test.ts.raw"
  },
  {
    "path": "tests/clinical-review-lower-limb-connective-xray.test.ts",
    "before": "7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3",
    "after": "dea27b090f230482979e97ec1ff54b5343f8c830885a0e49d09a69e7e5cc2fa6",
    "edits": [
      {
        "i": 9,
        "j": 9,
        "before": [],
        "after": [
          "import {exactDisplayPinHistory} from './lower-limb-display-pin-history.mjs';"
        ]
      },
      {
        "i": 303,
        "j": 304,
        "before": [
          " const sincePrior=[...newById].filter(([id,digest])=>digest!==priorById.get(id)).map(([id])=>id).sort();"
        ],
        "after": [
          " const displayHistory=exactDisplayPinHistory({readGit:git,revision,currentBytes:readFileSync('atlas-review/'+displayPins)});",
          " assert.deepEqual(displayHistory.currentById,newById,'Current imported display pins retain their complete exact source history');",
          " const sincePrior=[...displayHistory.colicById].filter(([id,digest])=>digest!==priorById.get(id)).map(([id])=>id).sort();"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/clinical-review-lower-limb-connective-xray.test.ts.raw"
  },
  {
    "path": "tests/atlas-learning-loader-preservation.test.mjs",
    "before": "ae9552c5477878b564f6b8a30c78d153acdb3e293b6ea05beafab41441ab91dd",
    "after": "38ecf4e66ea0c91b6a8347be5c42ed676ec2a929f04cdd5dfc401abf5afd512b",
    "edits": [
      {
        "i": 5,
        "j": 5,
        "before": [],
        "after": [
          "import {restoreExtraExpansionSource} from './extra-expansion-adoption-source-proof.mjs';"
        ]
      },
      {
        "i": 10,
        "j": 11,
        "before": [
          "const currentTest=()=>read('./atlas-nonhead-comparison-ui.test.mjs');",
          "const currentMigration=()=>read('./nonhead-frame-migration.test.mjs');"
        ],
        "after": [
          "const currentTest=()=>restoreExtraExpansionSource('atlas-nonhead-comparison-ui.test.mjs',read('./atlas-nonhead-comparison-ui.test.mjs'));",
          "const currentMigration=()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',read('./nonhead-frame-migration.test.mjs'));"
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/atlas-learning-loader-preservation.test.mjs.raw"
  },
  {
    "path": "tests/arterial-history-preservation.test.mjs",
    "before": "60a15827ff4e534d7ce5c534ad14a67dad64dc6d152dea90ae136a7ca6ad92a6",
    "after": "31d98d7601b3a4413d6ef7c62e4694ba7241962f627830913e68802738938cb5",
    "edits": [
      {
        "i": 4,
        "j": 4,
        "before": [],
        "after": [
          "import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';"
        ]
      },
      {
        "i": 29,
        "j": 30,
        "before": [],
        "after": [
          "// Only the declared native-source scalar may differ from the closed6d7 subject.",
          "function nativeSource6d7(bytes){",
          " const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text,'utf8'),bytes);",
          " const currentPin=\"  assert.equal(CURRENT_ATLAS_REVISION,'\"+CURRENT_ATLAS_REVISION+\"');\";",
          " const closedPin=\"  assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');\";",
          " const restored=Buffer.from(replaceUnique(text,currentPin,closedPin));",
          " assert.equal(sha(restored),currentSubjectSha6d7,'Complete closed6d7 subject after only the current native-source scalar inverse');",
          " return restored;",
          "}",
          ""
        ]
      },
      {
        "i": 30,
        "j": 41,
        "before": [
          " const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);"
        ],
        "after": [
          " const originalBytes=readFileSync(original),admittedBytes=nativeSource6d7(readFileSync(admitted));"
        ]
      },
      {
        "i": 86,
        "j": 97,
        "before": [],
        "after": [
          "test('native role restoration refuses source edits outside its one declared scalar',()=>{",
          " const bytes=readFileSync(admitted),text=bytes.toString();",
          " assert.equal(sha(nativeSource6d7(bytes)),currentSubjectSha6d7);",
          " assert.throws(()=>nativeSource6d7(Buffer.concat([bytes,Buffer.from('/* foreign source */')])));",
          " const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>nativeSource6d7(changed));",
          " const originalAssertion='assert.equal(refused,142);';assert(text.includes(originalAssertion));",
          " assert.throws(()=>nativeSource6d7(Buffer.from(text.replace(originalAssertion,'assert.equal(refused,141);'))));",
          "});",
          "",
          "test('a foreign native-source scalar cannot be admitted by the historical inverse',()=>{",
          " const text=readFileSync(admitted).toString(),native=\"assert.equal(CURRENT_ATLAS_REVISION,'\"+CURRENT_ATLAS_REVISION+\"');\";",
          " assert.equal(text.split(native).length,2);",
          " assert.throws(()=>nativeSource6d7(Buffer.from(text.replace(native,\"assert.equal(CURRENT_ATLAS_REVISION,'\"+'0'.repeat(40)+\"');\"))));",
          "});",
          ""
        ]
      }
    ],
    "original": "tests/fixtures/release-epoch-before/arterial-history-preservation.test.mjs.raw"
  }
],sha=b=>createHash('sha256').update(b).digest('hex');
function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);if(row.path==='tests/clinical-review-continuous-guided-playback.test.ts')bytes=restorePlaybackSourceRole(bytes);if(row.path==='tests/clinical-review-lower-limb-connective-xray.test.ts')bytes=restoreLowerLimbCurrentRole(bytes);assert.equal(sha(bytes),row.after,'Exact reviewed composed source');const lines=bytes.toString().split('\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\n'));}
test('all twelve composed repairs retain complete original tests and helpers',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(inverse(row,after),before);}});
test('unknown bytes, removed assertions and source-witness mutation refuse every composed inverse',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>inverse(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const forged=Buffer.from(after);forged[0]^=1;assert.throws(()=>inverse(row,forged));const before=readFileSync(new URL('../'+row.original,import.meta.url)),changed=Buffer.from(before);changed[0]^=1;assert.notEqual(sha(changed),row.before);}});
