import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261101-renal-native-integration';
const plan=json(root+'/PREPARED.json'),actual=json(root+'/CANDIDATE_TEACHING.json');
const expected=json('G:/VisibleMedicine-temp/proposals/20261101-renal-venous-xray/evidence/after.json');
const git=(where,...args)=>execFileSync('git',['-C',where,...args],{encoding:'utf8',windowsHide:true}).trim();
test('the integrated source exports exactly the verified teaching and all684 topic placements',()=>{
 for(const key of ['nestedConcepts','nestedTeachingReferences','conceptLessons','actual','mutationsRejected'])assert.deepEqual(actual[key],expected[key],key);
 assert.equal(actual.nestedConcepts.length,76);assert.equal(actual.conceptLessons.length*9,684);assert.equal(actual.actual.length,4);assert.equal(actual.mutationsRejected,12);
});
test('all inspected source bytes and admitted overlay changes remain exact',()=>{
 for(const input of actual.inputs){assert.equal(input.origin,'native');assert.equal(hash(input.location),input.sha256,input.path);}
 for(const row of plan.changes)assert.equal(hash(plan.atlas+'/'+row.path),row.sha256,row.path);
 for(const row of json(root+'/VALIDATION_SOURCE.json').files)assert.equal(hash(plan.atlas+'/'+row.path),row.after,row.path);
 assert.equal(hash(plan.atlas+'/content/nested-teaching-bindings.v1.json'),plan.unchangedTeachingPins);
 assert.equal(hash(plan.atlas+'/content/nested-review-bindings.json'),plan.unchangedNestedLinkPins);
});
test('only the four intended source files differ; installed and frozen candidates are retained',()=>{
 const changed=[...git(plan.atlas,'diff','--name-only').split('\n'),...git(plan.atlas,'ls-files','--others','--exclude-standard').split('\n')].filter(Boolean).sort();
 assert.deepEqual(changed,['content/renal-teaching.ts','content/renal-venous-xray.ts','docs/RENAL_VENOUS_XRAY.md','scripts/validate-nested-teaching.mjs']);
 assert.equal(git(plan.source,'rev-parse','HEAD'),plan.parent);assert.equal(git(plan.source,'status','--porcelain'),'');
 assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'f949979e975b6260575a7fd72901bcc2aec0be05');
 assert.equal(hash('G:/VisibleMedicine-temp/staging/20261101-hepatic-website/WEBSITE_SOURCE.json'),'9412dcb2aa53e4732138b622a74a8fe6f14fa0e9a90a03f05ab773cf41829bf7');
 assert.equal(json(plan.atlas+'/content/body-renderer-revision.json').sha256,plan.baselineRenderer,'Renderer regeneration is still pending, not falsely recorded as complete');
});
