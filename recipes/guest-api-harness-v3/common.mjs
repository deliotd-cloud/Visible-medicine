import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

export const root='F:/VisibleMedicine/staging/20261025-head-search-guest-core-final-website';
export const sourceFile=root+'/SOURCE_CANDIDATE.json';
export const sourceSha='078a315d863ce312d0d3cd28ab4464407ea2a57a9234762cbb5c2c3014400255';
export const buildFile=root+'/checks/build-attempt-1/RESULT.json';
export const suite='F:/VisibleMedicine/staging/20261025-guest-api-negative-v3-suite';
export const specs=Object.freeze({
  embed:{port:3061,inspector:49361,method:'POST',target:'/api/embed/session'},
  pilot:{port:3062,inspector:49362,method:'POST',target:'/api/institutions/pilot'},
});
export function spec(mode){assert(Object.hasOwn(specs,mode),'Allowed modes: embed, pilot');return specs[mode];}
export function stage(mode){spec(mode);return `F:/VisibleMedicine/staging/20261025-head-search-guest-v3-${mode}-preview`;}
export function hash(path){return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');}
export function json(path){return JSON.parse(fs.readFileSync(path,'utf8'));}
export function writeNew(path,value){fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
export function verifySourceBuild(){
  assert.equal(hash(sourceFile),sourceSha,'Source receipt changed');
  const source=json(sourceFile), site=source.website, build=json(buildFile);
  assert.equal(build.passing,true,'Fresh production build has not passed');
  assert.equal(build.source.sha256,sourceSha,'Build source receipt differs');
  assert.equal(build.source.path,sourceFile,'Build source path differs');
  for(const dep of source.dependencies??[]){
    assert.equal(hash(dep.file),dep.sha256,'Dependency package '+dep.name);
    assert.equal(hash(dep.entry),dep.entrySha256,'Dependency entry '+dep.name);
  }
  for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,'Source row '+row.path);
  assert.equal(hash(build.artifacts.path),build.artifacts.sha256,'Build artifact receipt changed');
  const artifactReceipt=json(build.artifacts.path);
  assert(artifactReceipt.files.length>0,'Missing build artifacts');
  for(const row of artifactReceipt.files)assert.equal(hash(site+'/dist/'+row.path),row.sha256,'Build row '+row.path);
  return {source,site,build,buildSha:hash(buildFile),artifactReceiptSha:hash(build.artifacts.path)};
}
