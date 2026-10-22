import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor';
const website=root+'/website',prepared=json(root+'/PREPARED.json');
const previous=json(prepared.previousSource),proposal=json(prepared.bindingProposal);
const terminal=json(root+'/quality/types.TERMINAL.json');
assert.equal(terminal.code,2);
assert.equal(sha(read(root+'/quality/types.stdout.log')),terminal.stdoutSha256);
assert.equal(read(root+'/quality/types.stdout.log').toString().trim(),"tests/tongue-palate-delivery.test.ts(77,23): error TS2339: Property 'equals' does not exist on type 'NonSharedBuffer'.");
assert(!fs.existsSync(root+'/BUILT_SOURCE.json'));
const allowed=new Set([...proposal.files.map(r=>r.path),'tests/fixtures/current-atlas-delivery.json']);
for(const row of previous.sourceRows){
 assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,'Frozen V6: '+row.path);
 if(!allowed.has(row.path)&&!row.path.startsWith('public/atlas-review-viewer/'))
  assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Unrelated successor source: '+row.path);
}
for(const row of proposal.files)assert.equal(sha(read(website+'/'+row.path)),row.afterSha256);
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 assert(!e.isSymbolicLink());return e.isDirectory()?walk(dir+'/'+e.name,prefix+e.name+'/'):[prefix+e.name];
});
const paths=new Set([...previous.sourceRows.map(r=>r.path),...walk(website+'/public/atlas-review-viewer').map(p=>'public/atlas-review-viewer/'+p)]);
const rows=[...paths].sort().map(p=>({path:p,bytes:read(website+'/'+p).length,sha256:sha(read(website+'/'+p))}));
const stage=root+'/type-source-repair';assert(!fs.existsSync(stage));
fs.mkdirSync(stage+'/RAW/tests',{recursive:true});
fs.copyFileSync(website+'/tests/tongue-palate-delivery.test.ts',stage+'/RAW/tests/tongue-palate-delivery.test.ts',fs.constants.COPYFILE_EXCL);
const receipt={at:new Date().toISOString(),website,sourceRows:rows,sourcePaths:rows.length,
 review:proposal.proposedReview,boundInputs:1724,importedSources:1558,
 typesPassed:false,websiteBuildRun:false,nativeAccepted:false,ownerPreviewChanged:false,
 failedTerminal:root+'/quality/types.TERMINAL.json',failedTerminalSha256:sha(read(root+'/quality/types.TERMINAL.json'))};
fs.writeFileSync(root+'/POST_BIND_TYPE_FAILURE_SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');
Object.assign(pointer.activeWork.current.bindingRepair,{phase:'types-terminal-failure-preserved',pid:null,heavyJobRunning:false,
 sourceReceipt:root+'/POST_BIND_TYPE_FAILURE_SOURCE.json',sourceReceiptSha256:sha(read(root+'/POST_BIND_TYPE_FAILURE_SOURCE.json')),
 typesPassed:false,websiteBuildRun:false,applied:true,canonicalInstalled:false,ownerPreviewChanged:false});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/POST_BIND_TYPE_FAILURE_SOURCE.json',sha256:sha(read(root+'/POST_BIND_TYPE_FAILURE_SOURCE.json')),sourcePaths:rows.length,failedTypesPreserved:true}));
