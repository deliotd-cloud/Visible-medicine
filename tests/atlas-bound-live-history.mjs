// Test-only exact Atlas replay with its independently verified website renderer adapter.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
export async function boundLiveAtlasHistory(revision,profile='review-security'){
 assert.match(revision,/^[a-f0-9]{40}$/);
 const atlas=checkedAtlasSourceRepo(revision);
 const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(git('rev-parse','HEAD').toString().trim(),revision);
 const manifest=json('atlas-review/manifest.json');assert.equal(manifest.revision,revision);
 const path='content/body-renderer-revision.json',originalBytes=git('show',revision+':'+path);
 const original=JSON.parse(originalBytes),importedBytes=readFileSync('atlas-review/'+path),bound=JSON.parse(importedBytes);
 const file=manifest.files.find(file=>file.path===path);assert(file);
 assert.equal(file.sourceSha256,sha(originalBytes));assert.equal(file.importedSha256,sha(importedBytes));
 assert.equal(bound.sourceRendererSha256,original.sha256);
 assert.equal(bound.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
 assert.equal(bound.sha256,sha(JSON.stringify({source:original.sha256,website:manifest.websiteIntegrationSha256})));
 const restored={...bound,sha256:original.sha256};delete restored.sourceRendererSha256;delete restored.websiteIntegrationSha256;
 assert.deepEqual(restored,original,'Only the declared website renderer binding may differ');
 const integration=json('atlas-review/integration-inputs.json');
 assert.equal(integration.sourceCommit,revision);assert.equal(integration.sha256,manifest.websiteIntegrationSha256);
 assert.equal(sha(JSON.stringify(integration.inputs)),integration.sha256);
 assert.equal(new Set(integration.inputs.map(input=>input.path)).size,integration.inputs.length);
 for(const input of integration.inputs){
  assert(typeof input.path==='string'&&!isAbsolute(input.path));
  assert(!input.path.split('/').some(part=>!part||part==='.'||part==='..'));
  const target=resolve(process.cwd(),input.path),local=relative(process.cwd(),target);
  assert(local&&!local.startsWith('..')&&!isAbsolute(local));
  assert.equal(sha(readFileSync(target)),input.sha256,input.path);
 }
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 return exactSourceHistoryApi(revision,profile,{[path]:importedBytes});
}
