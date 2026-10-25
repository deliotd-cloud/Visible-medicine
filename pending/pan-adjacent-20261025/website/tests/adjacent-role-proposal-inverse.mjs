import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const records=[
  {
    "name": "adjacent-current-tour-source-roles.test.mjs",
    "beforeSha256": "6182e1fa105c7755e2b56a1c6b1cec9e88b88ec97f83945ded1d09c6b9cd2135",
    "afterSha256": "66cb2d654960cb270564da64478a21672ff84fddba89b6b56f6a56d2450eb99c",
    "seams": [
      {
        "from": "import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';",
        "to": "import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';\nimport {adjacentRolePath} from './adjacent-role-context.mjs';\nimport {restoreAdjacentPortableRole} from './adjacent-role-proposal-inverse.mjs';"
      },
      {
        "from": "from 'file:///F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/adjacent-current-tour-source-role.mjs'",
        "to": "from './adjacent-b79-tour-source-role.mjs'"
      },
      {
        "from": "const stage='F:/VisibleMedicine/staging/20261024-adjacent-regression-current';\nconst transitionBytes=readFileSync(stage+'/MAIN_TRANSITION.v2.json');",
        "to": "const transitionBytes=readFileSync(adjacentRolePath('VM_ADJACENT_TRANSITION'));"
      },
      {
        "from": "readFileSync('F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/adjacent-current-tour-source-role.mjs')",
        "to": "readFileSync(new URL('./fixtures/adjacent-portable-before/adjacent-b79-tour-source-role.mjs.raw',import.meta.url))"
      },
      {
        "from": "const historicalAtlas='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/atlas';",
        "to": "const historicalAtlas=adjacentRolePath('VM_ADJACENT_B79_ATLAS');"
      },
      {
        "from": "",
        "to": "\ntest('portable setup seams retain every complete original root and b79 helper',()=>{\n for(const name of ['adjacent-current-tour-source-roles.test.mjs','adjacent-shoulder-source-roles.test.mjs','adjacent-clinical-source-roles.test.mjs','adjacent-b79-tour-source-role.mjs']){\n  const bytes=read(name),original=read('fixtures/adjacent-portable-before/'+name+'.raw');\n  assert.deepEqual(restoreAdjacentPortableRole(name,bytes),original);const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>restoreAdjacentPortableRole(name,changed));\n }\n});\n",
        "append": true
      }
    ]
  },
  {
    "name": "adjacent-shoulder-source-roles.test.mjs",
    "beforeSha256": "b90d6c6f0b5f58150528ba874aac043a7e2150b173ae252940251c40e0d16c32",
    "afterSha256": "00a8f433689d35e859d1b9c52856f96b100fb0e136b5ae693ffb3a9e8ccbff4e",
    "seams": [
      {
        "from": "import {assertHistoricalShoulderSourceRole} from './historical-shoulder-source-role.mjs';",
        "to": "import {assertHistoricalShoulderSourceRole as assertSavedShoulderSourceRole} from './historical-shoulder-source-role.mjs';\nimport {adjacentRolePath,adjacentB79Context} from './adjacent-role-context.mjs';\nfunction assertHistoricalShoulderSourceRole(current,options={}){\n const root=adjacentRolePath('VM_ADJACENT_190A_EXPORT');\n return assertSavedShoulderSourceRole(current,{exportManifestBytes:readFileSync(root+'/manifest.json'),exportInputsBytes:readFileSync(root+'/source-inputs.json'),checkpointBytes:readFileSync(adjacentRolePath('VM_ADJACENT_190A_CHECKPOINT')),...options});\n}"
      },
      {
        "from": "const b79Stage='F:/VisibleMedicine/staging/20261024-cervical-vascular-website';\nconst b79Site=b79Stage+'/website',b79Root=b79Stage+'/atlas';",
        "to": "const {site:b79Site,atlas:b79Root}=adjacentB79Context();"
      },
      {
        "from": "readFileSync(b79Stage+'/SOURCE_BOUND.json')",
        "to": "readFileSync(adjacentRolePath('VM_ADJACENT_B79_RECEIPT'))"
      },
      {
        "from": "",
        "to": "\ntest('current 727 delivery stays independently pinned beside the original 190a and b79 roles',()=>{\n const current=validateDelivery();assert.equal(current.source,'727ed5b451ae940a01e56272c8fbc703ea3b0095');assert.equal(current.sourceTree,'6940282a3ae0462961b9b99a690c70f282ab8ce7');\n for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(current.runtimeSources[name],current.source);\n assert.notEqual(current.source,historical);assert.notEqual(current.source,'b79e110d2d28f18993263926ba35aa7a3f478b20');\n});\n",
        "append": true
      }
    ]
  },
  {
    "name": "adjacent-clinical-source-roles.test.mjs",
    "beforeSha256": "1378915ab875655be05a97cf507791b74793a36cdd56bf67100e4ae3f8c5e1a6",
    "afterSha256": "7836321166a9a461fe57199bd76bc9f62a13df834b6d748f45dbb8e07df083da",
    "seams": [
      {
        "from": "import assert from 'node:assert/strict';",
        "to": "import assert from 'node:assert/strict';\nimport {adjacentRolePath} from './adjacent-role-context.mjs';"
      },
      {
        "from": "const parent='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current';\nconst proofBytes=readFileSync(parent+'/PROOF_BOUND.json');",
        "to": "const parent=adjacentRolePath('VM_ADJACENT_CLINICAL_WEBSITE');\nconst proofBytes=readFileSync(adjacentRolePath('VM_ADJACENT_CLINICAL_PROOF'));"
      },
      {
        "from": "readFileSync(parent+'/website/'+path)",
        "to": "readFileSync(parent+'/'+path)"
      }
    ]
  },
  {
    "name": "adjacent-b79-tour-source-role.mjs",
    "beforeSha256": "56534358796baebd68291bda23afa5e19f01c47462f6c4ff14a132499d93db8f",
    "afterSha256": "cad6309ff971fd83ff8b96c7220e30878543650cd5a448bfe1a69440436ccbbd",
    "seams": [
      {
        "from": "import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",
        "to": "import {validateCurrentAtlasDelivery as validateDelivery} from './current-atlas-delivery.mjs';\nimport {adjacentB79Context} from './adjacent-role-context.mjs';"
      },
      {
        "from": "const site=fileURLToPath(new URL('../',import.meta.url));",
        "to": "const {site,atlas:historicalAtlasRoot,receiptPath}=adjacentB79Context();\nfunction validateCurrentAtlasDelivery(){const pin=JSON.parse(readFileSync(site+'/tests/fixtures/current-atlas-delivery.json'));return validateDelivery({pin,root:site,read:path=>readFileSync(site+'/'+path)});}"
      },
      {
        "from": "atlasRoot=currentAtlasDeliveryRoot()",
        "to": "atlasRoot=historicalAtlasRoot"
      },
      {
        "from": "readFileSync('F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json')",
        "to": "readFileSync(receiptPath)"
      }
    ]
  }
];
const sha=b=>createHash('sha256').update(b).digest('hex');
export function restoreAdjacentPortableRole(name,bytes){const r=records.find(r=>r.name===name);assert(r,'Declared portable test role');assert.equal(sha(bytes),r.afterSha256,'Exact portable test source');let s=bytes.toString();for(const e of r.seams.toReversed()){if(e.append){assert(s.endsWith(e.to));s=s.slice(0,-e.to.length);}else{assert.equal(s.split(e.to).length,2);s=s.replace(e.to,e.from);}}const original=Buffer.from(s);assert.equal(sha(original),r.beforeSha256,'Complete original source restored');return original;}
