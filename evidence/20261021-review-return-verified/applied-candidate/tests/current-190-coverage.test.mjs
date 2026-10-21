// PROPOSAL ONLY: relocate this file under candidate/tests after the live suite ends.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {coverageArtifacts,coverageRevision} from '../scripts/check-anatomy-coverage.mjs';
import {COVERAGE_SOURCE_REVISION,COVERAGE_SNAPSHOT_REVISION,projectCoverageView} from '../lib/anatomy-coverage-view.ts';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const source='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const oldSource='485df97c2530e8e81a8d39a5ee61073ce76d93db';
const oldIndexPath='F:/VisibleMedicine/staging/20261020-combined-website-ui/website/docs/anatomy-coverage/index.json';
const oldIndexSha='9020eac8ed2fee77ef04b63357eabd23471f99e3e966d5b2c427010ee3478579';
const currentIndexSha='7f9f872a80e7b45f33f73377d73671ca5d9ddcc08cf8a6fc072a6681b6424d68';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path));

test('source 190 coverage is byte-bound to the delivered Atlas and Review input epoch',async()=>{
 const pin=validateCurrentAtlasDelivery();
 const bytes=readFileSync('docs/anatomy-coverage/index.json');
 assert.equal(sha(bytes),currentIndexSha);
 const index=JSON.parse(bytes),manifest=json('atlas-review/manifest.json');
 for(const revision of [pin.source,CURRENT_ATLAS_REVISION,coverageRevision,COVERAGE_SOURCE_REVISION,index.sourceRevision,manifest.revision])
  assert.equal(revision,source);
 assert.equal(sha(JSON.stringify(index)),COVERAGE_SNAPSHOT_REVISION);
 assert.deepEqual(index.sourceArtifacts,coverageArtifacts);
 for(const artifact of index.sourceArtifacts)
  assert.equal(sha(readFileSync(artifact.path)),artifact.sha256,artifact.path);
 const byPath=new Map(manifest.files.map(file=>[file.path,file]));
 assert.equal(byPath.size,manifest.files.length,'unique Review source paths');
 let imported=0,metadataOnly=0;
 for(const [path,sourceSha256] of Object.entries(index.evidence.sourceInputs)){
  const file=byPath.get(path);
  if(file){assert.equal(file.sourceSha256,sourceSha256,path);imported++;}
  else metadataOnly++;
 }
 assert.equal(imported,142);
 assert.equal(metadataOnly,26);
 const view=await projectCoverageView(index,manifest);
 assert(view,'actual 190 coverage must project');
 assert.equal(view.sourceRevision,source);
 assert.deepEqual(view.counts,{root:1104,nested:108,specimenViews:9,specimenMemberships:356,specimenSelections:267,shoulder:9});
 assert.equal(view.targets.length,7);
 assert.equal(index.assessment.anatomicalCompletenessProven,false);
 assert.equal(index.assessment.clinicalApprovalAsserted,false);
 assert.equal(index.assessment.patientRegistrationAsserted,false);
});

test('old coverage and forged current inputs are refused without changing factual holds',async()=>{
 const oldBytes=readFileSync(oldIndexPath);
 assert.equal(sha(oldBytes),oldIndexSha,'exact closed 485 coverage index');
 const old=JSON.parse(oldBytes),current=json('docs/anatomy-coverage/index.json'),manifest=json('atlas-review/manifest.json');
 assert.equal(old.sourceRevision,oldSource);
 assert.equal(await projectCoverageView(old,manifest),null,'old snapshot with current Review');
 assert.equal(await projectCoverageView(old,{...manifest,revision:oldSource}),null,'old snapshot with old revision label');
 assert.equal(await projectCoverageView(current,{...manifest,revision:oldSource}),null,'current snapshot with old Review label');
 const forged=structuredClone(current);forged.evidence.sourceInputs['package.json']='0'.repeat(64);
 assert.equal(await projectCoverageView(forged,manifest),null,'forged package input');
 const forgedManifest=structuredClone(manifest);
 const imported=Object.keys(current.evidence.sourceInputs).find(path=>forgedManifest.files.some(file=>file.path===path));
 assert(imported,'must select an imported coverage input');
 forgedManifest.files.find(file=>file.path===imported).sourceSha256='0'.repeat(64);
 assert.equal(await projectCoverageView(current,forgedManifest),null,'Review/source input mismatch');
 for(const key of ['schema','scopedCounts','documentedRootTargetGroups','independentWithheldSourceCatalogs','referenceBacklog','assessment','remainingScope','countingRules'])
  assert.deepEqual(current[key],old[key],key);
 assert.deepEqual(Object.keys(current.evidence.sourceInputs),Object.keys(old.evidence.sourceInputs));
 assert.deepEqual(Object.keys(current.evidence.sourceInputs).filter(path=>current.evidence.sourceInputs[path]!==old.evidence.sourceInputs[path]),['package.json']);
});
