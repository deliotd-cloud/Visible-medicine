// Local recovery witness for the exact installed website register52 source.
// No path missing from its independently pinned source manifest falls back to current.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const manifestPath='F:/VisibleMedicine/recovery/checkpoints/20261018-radial-eus-web-installed/website-final-source-manifest.json';
const sourceRoot='F:/VisibleMedicine/staging/20261018-radial-eus-web-integration/candidate';
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifestBytes=readFileSync(manifestPath);
assert.equal(sha(manifestBytes),'ea67c2c23aa605b3b2ead5e53b85f34c0b6ccb1c1108aa132758fc4ffef2b332');
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.websiteHead,'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(manifest.atlasSource,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(manifest.review,'d2ef89f23e700eebea3dce1d7507926ad7c5fdbccdfbf9941f06cd4739644d79');
assert.equal(manifest.register,52);
assert.equal(manifest.sourceFiles.length,4432);
const records=new Map(manifest.sourceFiles.map(row=>[row.path,row]));
assert.equal(records.size,manifest.sourceFiles.length);

export function readNative52(path){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 const row=records.get(path);
 assert(row,`No authenticated native52 source path: ${path}`);
 const file=join(sourceRoot,...path.split('/'));
 assert(lstatSync(file).isFile(),`Native52 file required: ${path}`);
 const bytes=readFileSync(file);
 if(row.bytes!==undefined)assert.equal(bytes.length,row.bytes,`Native52 byte count: ${path}`);
 assert.equal(sha(bytes),row.sha256,`Native52 source hash: ${path}`);
 return bytes;
}

export const jsonNative52=path=>JSON.parse(readNative52(path));

export function verifyNative52AtlasGit(repo){
 const git=(...args)=>execFileSync('git',args,{cwd:repo,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:20e6});
 const commit=manifest.atlasSource;
 assert.equal(git('rev-parse',commit+'^{commit}').toString().trim(),commit);
 assert.equal(git('rev-parse',commit+'^{tree}').toString().trim(),'4ce7882a2748d2f190e4b4f8783af6416c7cf44b');
 const reviewPaths=['app/body-content.ts','lib/body-display-catalog.ts','lib/content-types.ts','lib/body-review-material.ts','lib/body-review-response.ts','lib/body-review-context.ts','lib/body-review-decisions.ts','lib/body-review-api.ts'];
 for(const path of reviewPaths){
  const bytes=readNative52('atlas-review/'+path);
  assert.deepEqual(git('show',commit+':'+path),bytes,`Imported Review must equal source Git: ${path}`);
 }
 return commit;
}
