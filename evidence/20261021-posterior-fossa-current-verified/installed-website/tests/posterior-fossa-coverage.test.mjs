import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {coverageRevision,verifyCoverageSources,checkCoverage} from '../scripts/check-anatomy-coverage.mjs';
import {projectCoverageView,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const snapshot=JSON.parse(readFileSync(new URL('../docs/anatomy-coverage/index.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url)));
const sourcePath='content/posterior-fossa-ultrasound.ts';
const sourceSha='fdf5e8cf8ca9a8babc9053b5007633aab61b3c98f351f7536369d01e530d957a';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('new posterior-fossa draft is an exact source dependency without changed selection counts or approval',()=>{
 assert.equal(coverageRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
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
 assert.equal(snapshot.evidence.sourceInputs['package.json'],'f06fbc874ff751d1ef2fdf5b0cae85a906660e7ff5177c351c2962917449fbc6');
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

test('the complete prior posterior-fossa contract retains its exact historical source and package seams',()=>{
 const original=readFileSync(new URL('./fixtures/posterior-fossa-coverage-before190-20261021.mjs.raw',import.meta.url));
 assert.equal(sha(original),'cf6646f82345a08a843fd621b5ef3ce612c1a685f92bffe99235f4c84d315ad8');
 const current=readFileSync(new URL('./posterior-fossa-coverage.test.mjs',import.meta.url),'utf8');
 const marker="\ntest('the complete prior posterior-fossa contract retains its exact historical source and package seams'";
 const at=current.indexOf(marker);assert(at>0&&current.lastIndexOf(marker)===at);
 const edits=[
  ["import {coverageRevision,verifyCoverageSources} from '../scripts/check-anatomy-coverage.mjs';","import {coverageRevision,verifyCoverageSources,checkCoverage} from '../scripts/check-anatomy-coverage.mjs';"],
  ["import {projectCoverageView,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';","import {projectCoverageView,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
  ["assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');","assert.equal(coverageRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
  ["assert.equal(snapshot.evidence.sourceInputs['package.json'],'5594ae675dae99abe6fa1ac6f1a74af740d802adccd5afa0fc5da1908b6cb5ba');","assert.equal(snapshot.evidence.sourceInputs['package.json'],'f06fbc874ff751d1ef2fdf5b0cae85a906660e7ff5177c351c2962917449fbc6');"],
 ];
 const once=(text,from,to)=>{assert.equal(text.split(from).length,2);return text.replace(from,to);};
 let forward=original.toString();for(const[from,to]of edits)forward=once(forward,from,to);
 assert.equal(current.slice(0,at),forward,'All original count, privacy, import-side and mutation assertions stay exact');
 let inverse=forward;for(const[from,to]of edits.toReversed())inverse=once(inverse,to,from);
 assert.equal(inverse,original.toString());
 const changed=forward.replace("const pkg=structuredClone(snapshot)","const pkg=structuredClone(manifest)");
 assert.notEqual(changed,forward);assert.throws(()=>assert.equal(changed,forward));
});

test('current coverage verifies actual committed and working Atlas inputs, not the separate Website package',()=>{
 const sourceRoot=currentAtlasDeliveryRoot();
 assert.deepEqual(checkCoverage({sourceRoot}),snapshot);
 assert.equal(sha(readFileSync(sourceRoot+'/package.json')),snapshot.evidence.sourceInputs['package.json']);
});
