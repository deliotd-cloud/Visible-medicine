import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const root='F:/VisibleMedicine/staging/20261022-css-notice-admission-proposal',atlas='F:/VisibleMedicine/atlas';
assert(!existsSync(root));
const files=['tests/atlas-contextual-undo.test.ts','tests/atlas-current-history-wave4-contract.test.mjs'];
const rows=files.map(path=>({path,bytes:read(website+'/'+path).length,sha256:sha(read(website+'/'+path))}));
const git=(source,path)=>runGit(['-C',atlas,'show',source+':'+path]);
const previous=git('190a63238eadcf906abe89dcbb6a67c88afe70b9','app/body-explorer.css');
const current=git('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','app/body-explorer.css');
assert.equal(sha(previous),'9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca');
assert.equal(sha(current),'9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904');
assert.deepEqual(current.subarray(0,previous.length),previous);
mkdirSync(root+'/tests/fixtures',{recursive:true});mkdirSync(root+'/before');
for(const row of rows){copyFileSync(website+'/'+row.path,root+'/'+row.path);copyFileSync(website+'/'+row.path,root+'/before/'+row.path.slice(6)+'.raw');}
const append=current.subarray(previous.length);writeFileSync(root+'/tests/fixtures/drawable-space-css-append.css.raw',append,{flag:'wx'});
const receipt={at:new Date().toISOString(),website,source:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',review:json(website+'/atlas-review/integration-inputs.json').sha256,files:rows,css:{previousSource:'190a63238eadcf906abe89dcbb6a67c88afe70b9',previousSha256:sha(previous),currentSha256:sha(current),appendBytes:append.length,appendSha256:sha(append)},canonicalOrFrozenCandidateEdited:false};
writeFileSync(root+'/PREPARED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
