import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const proposal='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal';
const stage=proposal+'/native-check';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';
const snapshot=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const sourceRows=new Map(snapshot.map(r=>[r.path,r]));assert.equal(sourceRows.size,5107);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const copies=[];
function copy(from,p,expected=null){
 const b=read(from);if(expected)assert.equal(sha(b),expected,p);assert(b.length<2e6&&!b.includes(0));
 const to=stage+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});
 copies.push({path:p,bytes:b.length,sha256:sha(b)});
}
copy(proposal+'/historical-485-coverage.test.mjs','tests/anatomy-coverage-revision-admission.test.mjs');
copy(proposal+'/current-190-coverage.test.mjs','tests/current-190-coverage.test.mjs');
copy(proposal+'/tests/fixtures/closed485-original/anatomy-coverage-revision-admission.test.mjs.raw',
 'tests/fixtures/closed485-original/anatomy-coverage-revision-admission.test.mjs.raw',
 '8ee56ade2e3b70c5e5b50ee6a629d411635da3c5ff5b89a5670181a47b80edb1');
for(const p of ['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json','package.json']){
 assert(sourceRows.has(p));copy(candidate+'/'+p,p,sourceRows.get(p).sha256);
}
// Retained, read-only references for two metadata-only native tests. No scan,
// mask, private state, dependency install, renderer or build is involved. Never
// run broad discovery, package or recursively delete this linked test harness.
const links=[];
for(const p of ['scripts','lib','docs','atlas-review','public']){
 const target=path.resolve(candidate,p),link=path.resolve(stage,p);
 assert(target.startsWith(path.resolve(candidate)+path.sep));
 fs.symlinkSync(target,link,'junction');assert.equal(fs.realpathSync(link),fs.realpathSync(target));links.push({path:link,target});
}
const prep={stage,site:stage,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',
 source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',actualCandidate:candidate,copies,links,
 scope:'Exact proposed native coverage tests; imports read the unchanged actual candidate library/checker through retained junctions. Historical child executes all four unchanged original tests in the closed485 root. Only metadata/JSON/Node builtin logic, not broad/heavy validation.',
 caution:'Retain harness. Do not recursively remove or package through these junctions. Candidate/full-suite inputs must remain unchanged.',
 candidateEdited:false,canonicalEdited:false,privateDataCopied:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copies:copies.length,readOnlyJunctions:links.length,candidateEdited:false}));
