import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {verifyAnatomyCoverageView} from '../scripts/verify-anatomy-coverage-view.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const snapshot=JSON.parse(read('docs/anatomy-coverage/index.json'));
const manifest=JSON.parse(read('atlas-review/manifest.json'));

test('production Review verification checks the actual current coverage projection',async()=>{
 const result=await verifyAnatomyCoverageView();
 assert.equal(result.sourceRevision,manifest.revision);
 assert.equal(result.scopes,4);
 assert.equal(result.clinicalApprovalAsserted,false);
 assert.equal(result.anatomicalCompletenessProven,false);
 const command=read('scripts/verify-clinical-review.mjs').toString();
 assert(command.includes("import { verifyAnatomyCoverageView } from './verify-anatomy-coverage-view.mjs';"));
 assert(command.includes('await verifyAnatomyCoverageView({manifest:source})'));
 assert(JSON.parse(read('package.json')).scripts.prebuild.includes('node scripts/verify-clinical-review.mjs'));
});

test('the formerly silent old coverage and mixed or forged current inputs are refused',async()=>{
 const old=JSON.parse(read('tests/fixtures/coverage-before-6036/index.json.raw'));
 assert.equal(old.sourceRevision,'aaa8a6a428e74a2055310630f9dfee8731fe0eee');
 await assert.rejects(verifyAnatomyCoverageView({snapshot:old,manifest}),/coverage is unavailable/);
 const mixed=structuredClone(manifest);mixed.revision=old.sourceRevision;
 await assert.rejects(verifyAnatomyCoverageView({snapshot,manifest:mixed}),/coverage is unavailable/);
 const changed=structuredClone(snapshot);changed.scopedCounts.root.rootRepresentations++;
 await assert.rejects(verifyAnatomyCoverageView({snapshot:changed,manifest}),/coverage is unavailable/);
 const forged=structuredClone(manifest);const path=Object.keys(snapshot.evidence.sourceInputs).find(p=>forged.files.some(row=>row.path===p));
 assert(path);forged.files.find(row=>row.path===path).importedSha256='0'.repeat(64);
 await assert.rejects(verifyAnatomyCoverageView({snapshot,manifest:forged}),/coverage is unavailable/);
 assert.deepEqual(JSON.parse(read('docs/anatomy-coverage/index.json')),snapshot,'No verification may regenerate or repair evidence');
});
