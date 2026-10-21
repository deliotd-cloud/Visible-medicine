import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-global-body-search-proposal';
const pointer=json('CURRENT_CHECKPOINT.json'),previous=pointer.activeWork;
assert.equal(sha(read(previous.sourceSnapshot)),previous.sourceSnapshotSha256);
const baseline=json(previous.sourceSnapshot);
for(const row of baseline)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
assert.equal(baseline.length,5490);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const paths=['lib/platform-governance.ts','tests/unified-search-concepts.test.ts'];
for(const name of paths)for(const folder of ['preimages','candidate']){
 const target=stage+'/'+folder+'/'+name;assert(!fs.existsSync(target));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(site+'/'+name,target,fs.constants.COPYFILE_EXCL);
}
const fixture=stage+'/candidate/tests/fixtures/global-body-search/platform-governance.before.txt';
fs.mkdirSync(path.dirname(fixture),{recursive:true});fs.copyFileSync(site+'/lib/platform-governance.ts',fixture,fs.constants.COPYFILE_EXCL);
const prepared={at:new Date().toISOString(),site,stage,baseline:previous.sourceSnapshot,baselineSha256:previous.sourceSnapshotSha256,preserved:previous.preservedSourcePaths.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))})),review:previous.review,existing:paths.map(p=>({path:p,sha256:sha(read(site+'/'+p))})),canonicalUnchanged:true};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:stage+'/PREPARATION.json',baseline:baseline.length,canonicalUnchanged:true}));
