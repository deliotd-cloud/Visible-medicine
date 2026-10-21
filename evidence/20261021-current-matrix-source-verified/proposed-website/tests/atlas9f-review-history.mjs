// Historical Review replay: exact immutable 9f source plus its recorded website renderer binding.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

export const FIRST_DELIVERY='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function atlas9fReviewHistory(profile='review-security'){
 const atlas=currentAtlasDeliveryRoot();
 assert.equal(checkedAtlasHistoryRepo(FIRST_DELIVERY),atlas);
 const path='content/body-renderer-revision.json';
 const binding=JSON.parse(readFileSync(new URL('./fixtures/atlas9f-body-renderer-binding.json',import.meta.url)));
 assert.deepEqual(binding,{
  firstDelivery:FIRST_DELIVERY,path,
  sourceGitObject:'34753556f831f3e16ff46abc34da33d82b4f323b',
  sourceBytesSha256:'5fb911cd62e63452591d7dff7fe474c0dccf80485290c1c7afd60ff0ac08ae33',
  sourceRendererSha256:'111252f62d44d6f713d259d4f6dea25bc68275d8554a9a2f1230fb92ff7c435d',
  websiteIntegrationSha256:'0c720d009ad21e8c8ea518b3a2453609ca431618b12f82ab78dbbbd578ae3dbe',
  boundRendererSha256:'744125926b36a3015adae77e3fcbbe8cf082f0332a4d7254fa3b9abe97eb3b24',
  boundBytesSha256:'8e10d053925c3313fb0a03c7a3b9cb8a4751d06417e409a1b5bc5947fa89cf31',
  boundBytes:206963,serialization:'JSON.stringify(object, null, 2) + LF',
 });
 assert.equal(execFileSync('git',['rev-parse',`${FIRST_DELIVERY}:${path}`],
  {cwd:atlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim(),binding.sourceGitObject);
 const original=execFileSync('git',['show',`${FIRST_DELIVERY}:${path}`],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(sha(original),binding.sourceBytesSha256);
 const source=JSON.parse(original);
 assert.equal(source.sha256,binding.sourceRendererSha256);
 assert.equal(binding.boundRendererSha256,
  sha(JSON.stringify({source:source.sha256,website:binding.websiteIntegrationSha256})));
 const rendered={...source,sha256:binding.boundRendererSha256,
  sourceRendererSha256:source.sha256,websiteIntegrationSha256:binding.websiteIntegrationSha256};
 const bound=Buffer.from(JSON.stringify(rendered,null,2)+'\n');
 assert.equal(bound.length,binding.boundBytes);
 assert.equal(sha(bound),binding.boundBytesSha256,'Exact historical bound renderer bytes reconstructed');
 assert.equal(rendered.sourceRendererSha256,source.sha256);
 assert.equal(rendered.websiteIntegrationSha256,binding.websiteIntegrationSha256);
 const restored={...rendered,sha256:source.sha256};
 delete restored.sourceRendererSha256;delete restored.websiteIntegrationSha256;
 assert.deepEqual(restored,source,'Only the recorded website renderer adaptation differs');
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 return exactSourceHistoryApi(FIRST_DELIVERY,profile,{[path]:bound});
}
