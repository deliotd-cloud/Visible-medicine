import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {reconstructCoronaryD57} from './coronary-current-lifecycle-inverse.mjs';
const oldUrl=new URL('./fixtures/clinical-review-coronary-sinus-xray-before-lifecycle.ts.raw',import.meta.url);
const d57Url=new URL('./fixtures/clinical-review-coronary-sinus-xray-prior-d57.ts.raw',import.meta.url);
const candidateUrl=new URL('./clinical-review-coronary-sinus-xray.test.ts',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldSha='76ace4b4682bf3ba0f9a3e41e1ce140a03dac19801d9c045a59467b0def9b19b';
const nextSha='23d17b87699b6fef26dd8555f6aa5e2678a28ea03ae7e590e272f908a3a5b84e';
const seams=[
 " assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);",
 ' assert.equal(review.revision,revision);assert.equal(viewer.sourceCommit,revision);',
 '  assert.equal(manifest.sourceCommit,revision,name);assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);',
 '  const expected=sha(git(revision,path)),record=review.files.find((file:any)=>file.path===path);',
 " const rendererPath='content/body-renderer-revision.json',sourceRenderer=JSON.parse(git(revision,rendererPath).toString());",
 ' assert.equal(rendererRecord.sourceSha256,sha(git(revision,rendererPath)));',
 ' assert.deepEqual(Object.keys(refs).filter(key=>!Object.hasOwn(oldRefs,key)),[referenceKey]);',
 ' assert.deepEqual(Object.fromEntries(Object.entries(refs).filter(([key])=>key!==referenceKey)),oldRefs);',
];
function verify(oldBytes,nextBytes){
 assert.equal(sha(oldBytes),oldSha,'Byte-exact original before normalization');
 assert.equal(sha(nextBytes),nextSha,'Exact proposed coronary candidate');
 const d57=reconstructCoronaryD57(nextBytes,readFileSync(d57Url));
 const oldLines=oldBytes.toString().replaceAll('\r\n','\n').split('\n');
 const nextLines=d57.toString().replaceAll('\r\n','\n').split('\n');
 for(const line of seams){assert.equal(oldLines.filter(row=>row===line).length,1);assert.equal(nextLines.includes(line),false);}
 const retained=oldLines.filter(line=>!seams.includes(line));let cursor=0;
 for(const line of nextLines)if(cursor<retained.length&&line===retained[cursor])cursor++;
 assert.equal(retained.length,199);assert.equal(cursor,retained.length,'Every other original assertion retained in order');
 for(const marker of ['historicalSharedSha=','currentSharedSha=','genuine coronary introduction','genuine posterior-fossa introduction','all 76 posterior-fossa concepts survive to current Review','genuine posterior-fossa reference introduction','exact later ultrasound teaching/reference emitted','assert.equal(response.status,409);staleRejected++','assert.equal(rejected.status,422);unsupportedRejected++'])assert(nextBytes.toString().includes(marker),marker);
}
test('coronary original remains frozen and only eight explicit lifecycle seams change',()=>{
 verify(readFileSync(oldUrl),readFileSync(candidateUrl));
});
test('altered coronary facts, populations, references and unreachable wrappers are refused',()=>{
 const original=readFileSync(oldUrl),candidate=readFileSync(candidateUrl),text=candidate.toString();
 for(const [from,to] of [['assert.equal(response.status,409);staleRejected++','assert.equal(response.status,200);staleRejected++'],['assert.equal(earlier.length,76,','assert.equal(earlier.length,75,'],["posteriorReferences,'genuine posterior-fossa reference introduction'","[],'genuine posterior-fossa reference introduction'"],['manifest.sourceCommit,runtimeSources[name]','manifest.sourceCommit,currentRevision']]){
  assert.equal(text.split(from).length,2,from);assert.throws(()=>verify(original,Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.concat([original,Buffer.from('\n')]),candidate));
 assert.throws(()=>verify(original,Buffer.from('if(false){\n'+text+'\n}')));
});
