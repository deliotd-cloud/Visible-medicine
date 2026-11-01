import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration',atlas=root+'/atlas',plan=json(root+'/PREPARED.json');
const originalPins=hash(atlas+'/content/nested-teaching-bindings.v1.json');assert.equal(originalPins,plan.unchangedTeachingPins);
const result=spawnSync(process.execPath,['--max-old-space-size=512','scripts/pin-nested-teaching.mjs','--check'],{cwd:atlas,windowsHide:true,encoding:'utf8',maxBuffer:2e6});
fs.writeFileSync(root+'/logs/nested-teaching-stock-pin-fixed.log',(result.stdout??'')+'\n'+(result.stderr??''),{flag:'wx'});
assert.equal(result.status,0,'Standard pin command failed');assert(!result.error&&!result.signal);
assert.equal(hash(atlas+'/content/nested-teaching-bindings.v1.json'),originalPins);
assert.equal(hash(atlas+'/content/nested-review-bindings.json'),plan.unchangedNestedLinkPins);
const comparison=json(root+'/REVIEW_COMPARISON.json');assert.equal(comparison.changedTeaching,4);assert.equal(comparison.changedGeometryReviewRevisions,108);
const log=fs.readFileSync(root+'/checks/native-finish-v2/runner.stdout.log','utf8');
for(const name of ['nested-teaching-current-and-history','nested-review-context','teaching-audit','teaching-audit-actual','focused-semantic-types','review-materials-before','review-materials-after'])assert(log.includes(name+' passed'));
for(const mode of ['BEFORE','AFTER']){const packet=json(root+'/REVIEW_'+mode+'.json');for(const row of packet.inputs)assert.equal(hash(packet.root+'/'+row.path),row.sha256,row.path);}
fs.writeFileSync(root+'/CHECKS_COMPLETE.json',JSON.stringify({at:new Date().toISOString(),standardPinCommandPassed:true,reviewComparisonPassed:true,scopedTypes:true,wholeAtlasTypes:false,fullBuild:false,installed:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log('Standard nested pin command passes; source bindings remain unchanged.');
