import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {coverageRevision,verifyCoverageSources} from '../scripts/check-anatomy-coverage.mjs';
import {projectCoverageView,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';

const snapshot=JSON.parse(readFileSync(new URL('../docs/anatomy-coverage/index.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url)));
const sourcePath='content/posterior-fossa-ultrasound.ts';
const sourceSha='fdf5e8cf8ca9a8babc9053b5007633aab61b3c98f351f7536369d01e530d957a';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('new posterior-fossa draft is an exact source dependency without changed selection counts or approval',()=>{
 assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
 assert.equal(snapshot.sourceRevision,coverageRevision);
 assert.equal(Object.keys(snapshot.evidence.sourceInputs).length,168);
 assert.equal(snapshot.evidence.sourceInputs[sourcePath],sourceSha);
 assert.deepEqual({root:snapshot.scopedCounts.root.rootRepresentations,nested:snapshot.scopedCounts.nested.nestedSelections,
  views:snapshot.scopedCounts.independent.independentViews,selections:snapshot.scopedCounts.independent.independentFrameQualifiedSelectionIds},
 {root:1104,nested:108,views:9,selections:267});
 assert.equal(snapshot.assessment.clinicalApprovalAsserted,false);
 assert.equal(snapshot.assessment.anatomicalCompletenessProven,false);
 assert.equal(snapshot.assessment.patientRegistrationAsserted,false);
});

test('stale source and changed posterior-fossa content fail source verification',()=>{
 const sourceBytes=Buffer.from('source-bound teaching');
 const index={sourceRevision:coverageRevision,evidence:{sourceInputs:{[sourcePath]:sha(sourceBytes)}}};
 const ports={head:()=>coverageRevision,status:()=>'',readSource:()=>sourceBytes,committedSource:()=>sourceBytes};
 assert.equal(verifyCoverageSources(index,ports),index);
 assert.throws(()=>verifyCoverageSources(index,{...ports,head:()=> '3e66d2a7cb1807f792929cbe292a4cfc81e4e79e'}),/stale/);
 assert.throws(()=>verifyCoverageSources(index,{...ports,readSource:()=>Buffer.from('changed draft')}),/working source mismatch/);
 assert.throws(()=>verifyCoverageSources(index,{...ports,committedSource:()=>Buffer.from('changed draft')}),/committed source mismatch/);
});

test('the imported draft and package bind to this snapshot; changed content or import side is unavailable',async()=>{
 assert.equal(sha(JSON.stringify(snapshot)),COVERAGE_SNAPSHOT_REVISION);
 const view=await projectCoverageView(snapshot,manifest);
 assert(view);
 assert.equal(view.sourceRevision,coverageRevision);
 assert.equal(manifest.revision,coverageRevision);
 assert.equal(snapshot.evidence.sourceInputs['package.json'],'5594ae675dae99abe6fa1ac6f1a74af740d802adccd5afa0fc5da1908b6cb5ba');
 const imported=manifest.files.find(f=>f.path===sourcePath);
 assert(imported);
 assert.equal(imported.sourceSha256,sourceSha);
 const old=structuredClone(manifest);old.revision='3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
 assert.equal(await projectCoverageView(snapshot,old),null);
 const content=structuredClone(manifest);content.files.find(f=>f.path===sourcePath).sourceSha256='0'.repeat(64);
 assert.equal(await projectCoverageView(snapshot,content),null);
 const side=structuredClone(manifest);side.files.find(f=>f.path===sourcePath).importedSha256='0'.repeat(64);
 assert.equal(await projectCoverageView(snapshot,side),null);
 const pkg=structuredClone(snapshot);pkg.evidence.sourceInputs['package.json']='0'.repeat(64);
 assert.equal(await projectCoverageView(pkg,manifest),null);
});
