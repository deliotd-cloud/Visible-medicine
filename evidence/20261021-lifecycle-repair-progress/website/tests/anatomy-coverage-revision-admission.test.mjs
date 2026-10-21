import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {coverageArtifacts,coverageRevision} from '../scripts/check-anatomy-coverage.mjs';
import {COVERAGE_SOURCE_REVISION,COVERAGE_SNAPSHOT_REVISION,projectCoverageView} from '../lib/anatomy-coverage-view.ts';
import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

const prior='aaa8a6a428e74a2055310630f9dfee8731fe0eee';
const previousCurrent='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const current=CURRENT_ATLAS_REVISION;
const fixture='tests/fixtures/coverage-before-6036/';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const text=path=>readFileSync(path,'utf8').replaceAll('\r\n','\n');
const sha=value=>createHash('sha256').update(value).digest('hex');
function restoreDeclarations(source,replacements){
 let restored=source;
 for(const [currentDeclaration,priorDeclaration] of replacements){
  assert.equal(restored.split(currentDeclaration).length,2,'Exact declared binding must occur once');
  restored=restored.replace(currentDeclaration,priorDeclaration);
 }
 return restored;
}

test('desktop source restores its exact pre-repair body, then its raw original through the two coverage declarations',()=>{
 const original=readFileSync(fixture+'clinical-review-desktop-layout.test.mjs.raw');
 assert.equal(sha(original),'c128f73394b93ba40b1580aa07c583aef14449eae3f14368ef7b77ac88b66fc3');
 const currentSource=readFileSync('tests/clinical-review-desktop-layout.test.mjs','utf8');
 assert.equal(sha(currentSource),'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf','exact current desktop source');
 const source=readFileSync('tests/fixtures/current-delivery-before-inbox485/clinical-review-desktop-layout.test.mjs.raw','utf8');
 assert.equal(sha(source),'400c50faf155feb09658c081f6db9ef35c598e7b83872f6d1e85f5847913891a','exact repaired desktop source');
 const inverseAddition=[
  ' inverse("import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from \'./current-atlas-delivery.mjs\';",',
  '  "import {validateCurrentAtlasDelivery} from \'./current-atlas-delivery.mjs\';");',
  ' inverse("// Independently restored, source-only 6036 recovery; absence or byte drift fails closed.\\nconst historicalRoot=\'F:/VisibleMedicine/recovery/checkpoints/20261020-checkout-history-website-backup/remote-source-restored\';\\nconst readHistorical=p=>readFileSync(historicalRoot+\'/\'+p);\\n",\'\');',
 ].join('\n')+'\n';
 const currentProof=[
  "test('current 87ed delivery remains separately bound to the clean Atlas source',()=>{",
  ' const current=validateCurrentAtlasDelivery();',
  " assert.equal(current.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
  " assert.equal(current.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');",
  " assert.equal(current.reviewIntegration,'b10311bfc3de1b628eb3d124d47c317ac4db2f7226e7ad1616e838d009af39d5');",
  ' assert.equal(current.reviewSourceFiles,1548);',
  " const bindingBytes=read('atlas-review/integration-inputs.json');",
  " assert.equal(sha(bindingBytes),'acbad30ecf452317221384c708022b3f5f2d4c3e8042ca82e572f91507bb43d7');",
  ' assert.equal(JSON.parse(bindingBytes).inputs.length,1696);',
  ' currentAtlasDeliveryRoot();',
  '});',
  '',
 ].join('\n')+'\n';
 const beforeRepair=restoreDeclarations(source,[
  [inverseAddition,''],
  ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["// Independently restored, source-only 6036 recovery; absence or byte drift fails closed.\nconst historicalRoot='F:/VisibleMedicine/recovery/checkpoints/20261020-checkout-history-website-backup/remote-source-restored';\nconst readHistorical=p=>readFileSync(historicalRoot+'/'+p);\n",''],
  [" const historicalPinBytes=readHistorical('tests/fixtures/current-atlas-delivery.json');\n assert.equal(sha(historicalPinBytes),'0ee28eaffe4fc13e32f124d7d48eea18e90b34f3cfaf1a55959fdabba90e573a');\n const current=validateCurrentAtlasDelivery({pin:JSON.parse(historicalPinBytes),root:historicalRoot,read:readHistorical});"," const current=validateCurrentAtlasDelivery();"],
  [" const historicalBindingBytes=readHistorical('atlas-review/integration-inputs.json');\n assert.equal(sha(historicalBindingBytes),'db650d87553c6e5f7830c4a19ad503a2ebdc4d8013d8344221ae03517357d0f7');\n const binding=JSON.parse(historicalBindingBytes);"," const binding=JSON.parse(read('atlas-review/integration-inputs.json'));"],
  [" for(const row of binding.inputs)assert.equal(row.sha256,sha(readHistorical(row.path)),row.path);"," for(const row of binding.inputs)assert.equal(row.sha256,sha(read(row.path)),row.path);"],
  [currentProof,''],
 ]);
 assert.equal(sha(beforeRepair),'6694611b999fa994aede297093d129c93c66983e66db48accdcc86c6a955cf6f','exact pre-repair desktop source');
 const restored=restoreDeclarations(beforeRepair,[
  ["  'docs/anatomy-coverage/index.json','lib/anatomy-coverage-view.ts',\n",''],
  ['assert.equal(before.inputs.length-changed.filter(row=>oldRows.has(row.path)).length,1675);','assert.equal(before.inputs.length-changed.filter(row=>oldRows.has(row.path)).length,1677);'],
 ]);
 assert.equal(restored,original.toString(),'All preceding layout, current-source, historical inverse and refusal bodies retained exactly');
});

test('current coverage pins admit the regenerated source and reject the prior snapshot',async()=>{
 const oldBytes=readFileSync(fixture+'index.json.raw');
 assert.equal(sha(oldBytes),'e7eae41738e3887eda3e84c11faab53fd4ac75cab1713b04c21f4b08c24bad8f');
 const old=JSON.parse(oldBytes),next=json('docs/anatomy-coverage/index.json'),review=json('atlas-review/manifest.json');
 assert.equal(old.sourceRevision,prior);
 assert.equal(current,'485df97c2530e8e81a8d39a5ee61073ce76d93db','exact current source epoch');
 assert.equal(next.sourceRevision,current);
 assert.equal(review.revision,current);
 assert.equal(coverageRevision,current);
 assert.equal(COVERAGE_SOURCE_REVISION,current);
 assert.equal(sha(JSON.stringify(next)),'443eeaa198c30e88d73aa6d89f37376715ccd23bb6c27c5c904a075c39cbe31c');
 assert.equal(COVERAGE_SNAPSHOT_REVISION,sha(JSON.stringify(next)));
 assert.equal(await projectCoverageView(old,review),null);
 assert.equal(await projectCoverageView(old,{...review,revision:prior}),null);
 const view=await projectCoverageView(next,review);
 assert(view);
 assert.equal(view.sourceRevision,current);
 assert.deepEqual(view.counts,{root:1104,nested:108,specimenViews:9,specimenMemberships:356,specimenSelections:267,shoulder:9});
 assert.equal(view.targets.length,7);
 assert.deepEqual(view.targets.map(({id,state,regions})=>({id,state,regions})),old.documentedRootTargetGroups.map(({id,state,regions})=>({id,state,regions})));
});

test('regeneration changes evidence identity without changing factual inventory or relaxing holds',()=>{
 const old=json(fixture+'index.json.raw'),next=json('docs/anatomy-coverage/index.json'),review=json('atlas-review/manifest.json');
 for(const key of ['schema','scopedCounts','documentedRootTargetGroups','independentWithheldSourceCatalogs','referenceBacklog','assessment','remainingScope','countingRules'])
  assert.deepEqual(next[key],old[key],key);
 assert.deepEqual(Object.keys(next.evidence.sourceInputs),Object.keys(old.evidence.sourceInputs));
 assert.deepEqual(Object.keys(next.evidence.sourceInputs).filter(path=>next.evidence.sourceInputs[path]!==old.evidence.sourceInputs[path]),['package.json']);
 assert.equal(next.evidence.sourceInputs['package.json'],'9786b30019f418881824a20026ee66c2d3e16d4a3231f6cea85975687cbe6d1a');
 const beforeMra=structuredClone(next);
 beforeMra.sourceRevision=previousCurrent;
 beforeMra.evidence.sourceInputs['package.json']='0ebcc8dab3d453a869cf4f9c37515c1c190829c8c9a127e1a9e83aba41eeb091';
 beforeMra.sourceArtifacts=[
  {scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'a7772c4c8089ef476d8966988571d1ad66b887e7f2d89ca8996217dc35a9d34a'},
  {scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'713490ca374e5733ac04dbb13f43a12b176eec8710f822af7a3853f7d8939687'},
  {scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'1bfc349e55eef56ccb15b48e5b8e61276cd4e82d127a664bd1a36520f0b4437b'},
  {scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'c1bd3e7d1558568575f89c31d3c7e59dd673bb24f7313dc24c4bebc7c320ba41'},
 ];
 const beforeInbox=structuredClone(next);
 beforeInbox.sourceRevision='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
 beforeInbox.evidence.sourceInputs['package.json']='92354287efdd18168d92cef9157503a73dde54aafe63bd9fbcc49555b0be3f23';
 beforeInbox.sourceArtifacts=[
  {scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'d64eb4aea86cc086180e3412bacd9b874cc2c894e4bc5b99c089b8ad8221098d'},
  {scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'08d9848e8e40364c11825ef643fb7598ab107481df83f7103715d6dd0f15f7b0'},
  {scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'e83d5d34b5c76d3f149a02c96c9abd51f83a90dcccf7edc28baac95177f063f8'},
  {scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'3a9ffe23e34e845b2708e44d1c8ecd140939996ab0ecf360683cc614addf7fab'},
 ];
 assert.equal(sha(JSON.stringify(beforeInbox)),'f21e422407b8ca000441c2d924b54fa2fccfef03f409cb20579e451412473201','exact preceding delivery snapshot reconstructs');
 assert.equal(sha(JSON.stringify(beforeMra)),'c055eb7cdf00ad0937766b4fb1f8dd0f8b1d9d16fc1ed2c4634965da4e7deba7','exact preceding coverage snapshot reconstructs');
 const byPath=new Map(review.files.map(file=>[file.path,file]));
 const names=Object.keys(next.evidence.sourceInputs).sort();
 const imported=names.flatMap(path=>{const file=byPath.get(path);return file?[{path,sourceSha256:file.sourceSha256,importedSha256:file.importedSha256}]:[];});
 assert.equal(names.length,168);
 assert.equal(imported.length,142);
 assert.equal(names.length-imported.length,26);
 for(const {path,sourceSha256} of imported)assert.equal(sourceSha256,next.evidence.sourceInputs[path],path);
 assert.equal(sha(JSON.stringify(imported)),'236d059ce1e3c0442b4006abacf2ccd3f4de52bf2be92a3c644f62b8f49f30bf');
 assert.equal(next.assessment.anatomicalCompletenessProven,false);
 assert.equal(next.assessment.clinicalApprovalAsserted,false);
 assert.equal(next.assessment.patientRegistrationAsserted,false);
});

test('checker and view retain their entire prior bodies with only declared pins changed',()=>{
 const oldChecker=text(fixture+'check-anatomy-coverage.mjs.raw');
 const oldView=text(fixture+'anatomy-coverage-view.ts.raw');
 assert.equal(sha(oldChecker),'56f946facacfdeb5f6ebbf31805a81b6c041de25225ca7d0d4814f1d78c27e28');
 assert.equal(sha(oldView),'4a3d424146bf91f954a3db1c75fa1ce1179ef505f58327b197461dfd4c519770');
 const checkerBeforeMra=restoreDeclarations(text('scripts/check-anatomy-coverage.mjs'),[
  ["export const coverageRevision='485df97c2530e8e81a8d39a5ee61073ce76d93db';","export const coverageRevision='87ed7e343260c7df48a40d53503f25bbfd34cfa5';"],
  ["{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'025f45fcb4cd83c5feddeb89e0583f348f3ac021f96f9b08fe0a4571458e527b'}","{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'d64eb4aea86cc086180e3412bacd9b874cc2c894e4bc5b99c089b8ad8221098d'}"],
  ["{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'6bee2b34ca9be16548680e24b85d0fa0dcb9a9529b24a503bd79564706c327a9'}","{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'08d9848e8e40364c11825ef643fb7598ab107481df83f7103715d6dd0f15f7b0'}"],
  ["{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'fa41d4c8cf5a91b2512ae5e585e6ee134220e8c944703ceeac8e1a1a66dd1ae6'}","{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'e83d5d34b5c76d3f149a02c96c9abd51f83a90dcccf7edc28baac95177f063f8'}"],
  ["{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'eeaa4def25b332a3f7817625008f0476ffd825905d5a6a1515dbbd3735970d71'}","{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'3a9ffe23e34e845b2708e44d1c8ecd140939996ab0ecf360683cc614addf7fab'}"],
  ["export const coverageRevision='87ed7e343260c7df48a40d53503f25bbfd34cfa5';","export const coverageRevision='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';"],
  ["{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'d64eb4aea86cc086180e3412bacd9b874cc2c894e4bc5b99c089b8ad8221098d'}","{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'a7772c4c8089ef476d8966988571d1ad66b887e7f2d89ca8996217dc35a9d34a'}"],
  ["{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'08d9848e8e40364c11825ef643fb7598ab107481df83f7103715d6dd0f15f7b0'}","{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'713490ca374e5733ac04dbb13f43a12b176eec8710f822af7a3853f7d8939687'}"],
  ["{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'e83d5d34b5c76d3f149a02c96c9abd51f83a90dcccf7edc28baac95177f063f8'}","{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'1bfc349e55eef56ccb15b48e5b8e61276cd4e82d127a664bd1a36520f0b4437b'}"],
  ["{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'3a9ffe23e34e845b2708e44d1c8ecd140939996ab0ecf360683cc614addf7fab'}","{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'c1bd3e7d1558568575f89c31d3c7e59dd673bb24f7313dc24c4bebc7c320ba41'}"],
 ]);
 assert.equal(sha(checkerBeforeMra),'2132f253dd79468916692ef32043e11ef35109598de62e9e0aac0d7faceed814','exact pre-MRA checker');
 const checker=restoreDeclarations(checkerBeforeMra,[
  ["export const coverageRevision='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';","export const coverageRevision='aaa8a6a428e74a2055310630f9dfee8731fe0eee';"],
  ["{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'a7772c4c8089ef476d8966988571d1ad66b887e7f2d89ca8996217dc35a9d34a'}","{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'1a6a46a3b6464ee874a48e17ead8dd629333fa9364b648d7925f75e023ee64e5'}"],
  ["{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'713490ca374e5733ac04dbb13f43a12b176eec8710f822af7a3853f7d8939687'}","{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'83b88ef2b6ce2312091f6803364050f0db186d11fa416ae29e36439e5d6fed41'}"],
  ["{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'1bfc349e55eef56ccb15b48e5b8e61276cd4e82d127a664bd1a36520f0b4437b'}","{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'9a5ce229d84e749252d03b6d90aacbdb6825e2ed7c747681b64de615cf4d243c'}"],
  ["{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'c1bd3e7d1558568575f89c31d3c7e59dd673bb24f7313dc24c4bebc7c320ba41'}","{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'567b02c0e3557bba28815436b2efcdd3ed94d59e724ac146064bc2b2a5afc088'}"],
 ]);
 const viewBeforeMra=restoreDeclarations(text('lib/anatomy-coverage-view.ts'),[
  ["export const COVERAGE_SOURCE_REVISION='485df97c2530e8e81a8d39a5ee61073ce76d93db';","export const COVERAGE_SOURCE_REVISION='87ed7e343260c7df48a40d53503f25bbfd34cfa5';"],
  ["export const COVERAGE_SNAPSHOT_REVISION='443eeaa198c30e88d73aa6d89f37376715ccd23bb6c27c5c904a075c39cbe31c';","export const COVERAGE_SNAPSHOT_REVISION='f21e422407b8ca000441c2d924b54fa2fccfef03f409cb20579e451412473201';"],
  ["const coveragePackageSha256='9786b30019f418881824a20026ee66c2d3e16d4a3231f6cea85975687cbe6d1a';","const coveragePackageSha256='92354287efdd18168d92cef9157503a73dde54aafe63bd9fbcc49555b0be3f23';"],
  ["export const COVERAGE_SOURCE_REVISION='87ed7e343260c7df48a40d53503f25bbfd34cfa5';","export const COVERAGE_SOURCE_REVISION='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';"],
  ["export const COVERAGE_SNAPSHOT_REVISION='f21e422407b8ca000441c2d924b54fa2fccfef03f409cb20579e451412473201';","export const COVERAGE_SNAPSHOT_REVISION='c055eb7cdf00ad0937766b4fb1f8dd0f8b1d9d16fc1ed2c4634965da4e7deba7';"],
  ["const coveragePackageSha256='92354287efdd18168d92cef9157503a73dde54aafe63bd9fbcc49555b0be3f23';","const coveragePackageSha256='0ebcc8dab3d453a869cf4f9c37515c1c190829c8c9a127e1a9e83aba41eeb091';"],
 ]);
 assert.equal(sha(viewBeforeMra),'6fbdd52cab62b5f28870d95eca988d03e16c7db735ccf2967e461b5179808c0c','exact pre-MRA view');
 const view=restoreDeclarations(viewBeforeMra,[
  ["export const COVERAGE_SOURCE_REVISION='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';","export const COVERAGE_SOURCE_REVISION='aaa8a6a428e74a2055310630f9dfee8731fe0eee';"],
  ["export const COVERAGE_SNAPSHOT_REVISION='c055eb7cdf00ad0937766b4fb1f8dd0f8b1d9d16fc1ed2c4634965da4e7deba7';","export const COVERAGE_SNAPSHOT_REVISION='ffcb1c8bb4eea2d8d1af15fb1efc86620ae9720366807a50b0df6f1791bc2801';"],
  ["const coveragePackageSha256='0ebcc8dab3d453a869cf4f9c37515c1c190829c8c9a127e1a9e83aba41eeb091';","const coveragePackageSha256='3fdd2cd598b0014ca2d3b67c6704313759190a5584253d25b7700369e42b89fe';"],
 ]);
 assert.equal(checker,oldChecker);
 assert.equal(view,oldView);
 assert.deepEqual(coverageArtifacts.map(({scope,sha256})=>[scope,sha256]),[
  ['root','025f45fcb4cd83c5feddeb89e0583f348f3ac021f96f9b08fe0a4571458e527b'],
  ['nested','6bee2b34ca9be16548680e24b85d0fa0dcb9a9529b24a503bd79564706c327a9'],
  ['independent','fa41d4c8cf5a91b2512ae5e585e6ee134220e8c944703ceeac8e1a1a66dd1ae6'],
  ['reference','eeaa4def25b332a3f7817625008f0476ffd825905d5a6a1515dbbd3735970d71'],
 ]);
});
