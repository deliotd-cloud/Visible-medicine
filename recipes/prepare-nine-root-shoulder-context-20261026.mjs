import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const before='F:/VisibleMedicine/staging/20261026-nine-root-epoch-runner-v4-proposal';
const after='F:/VisibleMedicine/staging/20261026-nine-root-epoch-runner-v5-proposal';
assert.equal(hash(before+'/nine-root-epoch-runner.mjs'),'b19b8f257456955cefe4fa9b7523b1fd5fa7675b3998c4e3ee55460e0cab62f0');
assert.equal(hash(before+'/CONTEXTS.json'),'1cfb68e49992c4e6eaaeb670503f64462a57c00c2e5e92942725a214a74548fd');
assert(!fs.existsSync(after));fs.mkdirSync(after);
const replace=(text,a,b)=>{assert.equal(text.split(a).length,2,a);return text.replace(a,b);};
const oldConfig=fs.readFileSync(before+'/CONTEXTS.json','utf8');
const oldLane='{"site": "current", "root": "adjacent-shoulder-source-roles.test.mjs"';
const newLane='{"site": "role727", "root": "adjacent-shoulder-source-roles.test.mjs"';
const nextConfig=replace(oldConfig,oldLane,newLane);
fs.writeFileSync(after+'/CONTEXTS.json',nextConfig,{flag:'wx'});
assert.equal(replace(nextConfig,newLane,oldLane),oldConfig);
const c=json(after+'/CONTEXTS.json'),lane=c.lanes[2];
assert.equal(lane.expectedCases,5);
for(const role of ['current','role727'])assert.equal(hash(c[role].website+'/tests/'+lane.root),lane.rootSha256);
const oldRunner=fs.readFileSync(before+'/nine-root-epoch-runner.mjs','utf8');
const changes=[
 ["const configSha='1cfb68e49992c4e6eaaeb670503f64462a57c00c2e5e92942725a214a74548fd';",`const configSha='${hash(after+'/CONTEXTS.json')}';`],
 ["assert.equal(config.lanes.filter(l=>l.site==='current').length,7);","assert.equal(config.lanes.filter(l=>l.site==='current').length,6);"],
 ["assert.equal(config.lanes.filter(l=>l.site==='role727').length,2);","assert.equal(config.lanes.filter(l=>l.site==='role727').length,3);"],
];
let nextRunner=oldRunner;for(const [a,b]of changes)nextRunner=replace(nextRunner,a,b);
fs.writeFileSync(after+'/nine-root-epoch-runner.mjs',nextRunner,{flag:'wx'});
let restored=nextRunner;for(const [a,b]of changes.toReversed())restored=replace(restored,b,a);assert.equal(restored,oldRunner);
const failure=json('F:/VisibleMedicine/staging/20261026-nine-root-remaining-seven/lane-3.json');assert.equal(failure.rootResult.observed.fail,1);assert.equal(failure.rootResult.observed.pass,4);
const report={at:new Date().toISOString(),schema:'vm-authentic-shoulder-context-correction/1',before:{runner:before+'/nine-root-epoch-runner.mjs',sha256:hash(before+'/nine-root-epoch-runner.mjs')},after:{runner:after+'/nine-root-epoch-runner.mjs',sha256:hash(after+'/nine-root-epoch-runner.mjs'),configSha256:hash(after+'/CONTEXTS.json')},reason:'Whole fifth original purpose explicitly requires727 current delivery; original source bytes exist unchanged in authenticated727 role. Earlier e216 execution retained4pass/1fail.',proof:{wholeConfigInverse:true,wholeRunnerInverse:true,testSourcesUnchanged:true,expectedCases:5,rootSha256:lane.rootSha256,rootIdenticalInBothContexts:true,originalExpectedPinsUnchanged:true},executionPending:true,wholeSuitePassing:false,currentA01Coverage:false,ownerPreviewChanged:false};
fs.writeFileSync(after+'/MAIN_ADMISSION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({runner:report.after,admission:after+'/MAIN_ADMISSION.json',sha256:hash(after+'/MAIN_ADMISSION.json')}));
