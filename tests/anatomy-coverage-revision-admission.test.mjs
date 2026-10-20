import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {coverageArtifacts,coverageRevision} from '../scripts/check-anatomy-coverage.mjs';
import {COVERAGE_SOURCE_REVISION,COVERAGE_SNAPSHOT_REVISION,projectCoverageView} from '../lib/anatomy-coverage-view.ts';

const prior='aaa8a6a428e74a2055310630f9dfee8731fe0eee';
const current='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
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

test('all prior desktop assertions reconstruct through only two subsequent coverage-delta declarations',()=>{
 const original=readFileSync(fixture+'clinical-review-desktop-layout.test.mjs.raw');
 assert.equal(sha(original),'c128f73394b93ba40b1580aa07c583aef14449eae3f14368ef7b77ac88b66fc3');
 const source=readFileSync('tests/clinical-review-desktop-layout.test.mjs','utf8');
 const restored=restoreDeclarations(source,[
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
 assert.equal(next.sourceRevision,current);
 assert.equal(review.revision,current);
 assert.equal(coverageRevision,current);
 assert.equal(COVERAGE_SOURCE_REVISION,current);
 assert.equal(sha(JSON.stringify(next)),'c055eb7cdf00ad0937766b4fb1f8dd0f8b1d9d16fc1ed2c4634965da4e7deba7');
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
 assert.equal(next.evidence.sourceInputs['package.json'],'0ebcc8dab3d453a869cf4f9c37515c1c190829c8c9a127e1a9e83aba41eeb091');
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
 const checker=restoreDeclarations(text('scripts/check-anatomy-coverage.mjs'),[
  ["export const coverageRevision='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';","export const coverageRevision='aaa8a6a428e74a2055310630f9dfee8731fe0eee';"],
  ["{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'a7772c4c8089ef476d8966988571d1ad66b887e7f2d89ca8996217dc35a9d34a'}","{scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'1a6a46a3b6464ee874a48e17ead8dd629333fa9364b648d7925f75e023ee64e5'}"],
  ["{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'713490ca374e5733ac04dbb13f43a12b176eec8710f822af7a3853f7d8939687'}","{scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'83b88ef2b6ce2312091f6803364050f0db186d11fa416ae29e36439e5d6fed41'}"],
  ["{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'1bfc349e55eef56ccb15b48e5b8e61276cd4e82d127a664bd1a36520f0b4437b'}","{scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'9a5ce229d84e749252d03b6d90aacbdb6825e2ed7c747681b64de615cf4d243c'}"],
  ["{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'c1bd3e7d1558568575f89c31d3c7e59dd673bb24f7313dc24c4bebc7c320ba41'}","{scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'567b02c0e3557bba28815436b2efcdd3ed94d59e724ac146064bc2b2a5afc088'}"],
 ]);
 const view=restoreDeclarations(text('lib/anatomy-coverage-view.ts'),[
  ["export const COVERAGE_SOURCE_REVISION='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';","export const COVERAGE_SOURCE_REVISION='aaa8a6a428e74a2055310630f9dfee8731fe0eee';"],
  ["export const COVERAGE_SNAPSHOT_REVISION='c055eb7cdf00ad0937766b4fb1f8dd0f8b1d9d16fc1ed2c4634965da4e7deba7';","export const COVERAGE_SNAPSHOT_REVISION='ffcb1c8bb4eea2d8d1af15fb1efc86620ae9720366807a50b0df6f1791bc2801';"],
  ["const coveragePackageSha256='0ebcc8dab3d453a869cf4f9c37515c1c190829c8c9a127e1a9e83aba41eeb091';","const coveragePackageSha256='3fdd2cd598b0014ca2d3b67c6704313759190a5584253d25b7700369e42b89fe';"],
 ]);
 assert.equal(checker,oldChecker);
 assert.equal(view,oldView);
 assert.deepEqual(coverageArtifacts.map(({scope,sha256})=>[scope,sha256]),[
  ['root','a7772c4c8089ef476d8966988571d1ad66b887e7f2d89ca8996217dc35a9d34a'],
  ['nested','713490ca374e5733ac04dbb13f43a12b176eec8710f822af7a3853f7d8939687'],
  ['independent','1bfc349e55eef56ccb15b48e5b8e61276cd4e82d127a664bd1a36520f0b4437b'],
  ['reference','c1bd3e7d1558568575f89c31d3c7e59dd673bb24f7313dc24c4bebc7c320ba41'],
 ]);
});
