// Pure exact inverse of the bounded save-boundary repair; no corpus/test bundle.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13';
const reviewedPreimageSha='c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa';
const candidateSha='075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a';
const newExports="  \"export {postBodyDecision} from './lib/body-review-api';\",\n  \"export {blankBodyReview} from './lib/body-review-decisions';\",\n";
const displayExtra="    packet=>{packet.topics.find(topic=>topic.tab==='ct').extra='foreign';},\n";
const oldFingerprint="    packet=>{packet.fingerprints.teaching=corpusCtTransition.reviewBefore.teaching;},\n";
function once(text,needle,replacement){
 assert.equal(text.split(needle).length,2,`exact seam: ${needle.slice(0,65)}`);
 return text.replace(needle,replacement);
}
function verify(bytes){
 assert.equal(sha(bytes),candidateSha,'exact proposed postimage');
 let text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'lossless UTF-8/LF candidate');
 assert(!text.includes('\r'),'no EOL normalization in proposed layer');
 const start=text.indexOf('  // A transport fingerprint is not display evidence.');
 const end=text.indexOf('  const { emittedTeaching }',start);
 assert(start>=0&&end>start,'one save-path proof block');
 const block=text.slice(start,end);
 assert.equal(sha(Buffer.from(block)),'19c1c6c8169e9d267a67ede3802bfae78e0d957172d2e5c4510aa778975deb1c',
  'exact trusted-context, 409-before-storage and nonstale-control block');
 for(const assertion of [
  "packet=>{packet.topics.find(topic=>topic.tab==='ct').citations[0]='https://invalid.example/';}",
  "packet=>{packet.topics.find(topic=>topic.tab==='ct').readiness='approved';}",
  "packet=>{packet.topics.find(topic=>topic.tab==='ct').extra='foreign';}",
  'assert.equal(staleCtSave.status,409',
  "assert.equal(storageCalls,0,'stale CT save refused before storage')",
  'assert.equal(currentCtSave.status,503',
  "'oai-authenticated-user-id':'SYNTHETIC_CORPUS_CT_REVIEW'",
 ])assert(text.includes(assertion),`retained proof: ${assertion}`);
 text=text.slice(0,start)+'\n'+text.slice(end);
 text=once(text,displayExtra,displayExtra+oldFingerprint);
 text=once(text,newExports,'');
 assert.equal(sha(Buffer.from(text)),reviewedPreimageSha,'whole reviewed 5082/C0FEE preimage restored');
 assert.equal((text.match(/\btest\(/g)||[]).length,(bytes.toString().match(/\btest\(/g)||[]).length,
  'all original registrations retained');
 const original=readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray-original.raw',import.meta.url));
 assert.equal(sha(original),originalSha,'independent exact original raw historical fixture');
}
test('spinal CT save-boundary repair has exact reviewed inverse and raw original',()=>{
 const bytes=readFileSync(new URL('./atlas-spinal-muscle-xray.test.mjs',import.meta.url));
 verify(bytes);
 for(const [from,to] of [
  ['staleCtSave.status,409','staleCtSave.status,403'],
  ['storageCalls,0','storageCalls,1'],
  ["readiness='approved'","readiness='draft'"],
  ['currentCtSave.status,503','currentCtSave.status,409'],
 ])assert.throws(()=>verify(Buffer.from(bytes.toString().replace(from,to))),`tamper ${from}`);
 assert.throws(()=>verify(Buffer.from('if(false){\n'+bytes+'\n}')),'disabled-body tamper');
});
