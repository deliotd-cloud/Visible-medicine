// Pure six-file forward/inverse proof; actual Review/learner tests run separately.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const families=[
 ['lacrimal','2134305fe2af059f405b463dfa6158a5c2e05396628fde97ddd24210df695abe','3b51b64724f350e97be48685e093ad5c1db12b4feb0b7a66a6acace7fd92815e',2,true,null],
 ['laryngeal-framework','63cc3f0c56b554f6a7ca0030eaeef44ff919dc7ec3f0d3c66ac8354f57e91deb','b214fbac93ea5d89394ad35e2ad1eea2ee4a02cca74b9fdd2aaf643b33776d62',2,false,null],
 ['laryngeal-muscle','806646d125fa5772174a46f3976c162a095755e257d15b961536536eff8f0aec','bb5bc9c86e1e18ccbaae4a66a6e5d3f68a2ece9db2f4018e4d688989bc07ec8f',2,false,{
  'content/laryngeal-muscle-quiz.ts':'dbdb404d146122b6b979d23c6b1927e2ae69270ee665a266c08870e9c2e6e544',
  'content/laryngeal-muscle-quiz-pins.json':'a1280030197cb6b9216f836185e221eaee42c5ca2a8ea716fc082642ebe967b8',
  'lib/laryngeal-muscle-quiz.ts':'90e2c9c98057b6aa890447b6a4dbbe842d31779df8b771fc25a8166eda6dc522',
 }],
 ['neuro-organ','b9d7df5eea3dff6c4c363f9cd1fdbaceec472566c30bf81b4aa04ed2a6518e4b','81d41673fce49bca55901ccb9d374ae1fa8a62847563c2597b594be9729c10ef',2,false,{
  'content/neuro-organ-quiz.ts':'5198331dbe903efe8408f88b881f67dbdb1ec31882ebca586d6e69eec7bd32ed',
  'content/neuro-organ-quiz-pins.json':'5fea7e06899c62f131f3274bdeb977e52f78c0b57e1527ec5d9aaecaa4884e4d',
  'lib/neuro-organ-quiz.ts':'c458d3f4050a510a60c068eee141491a482c9e538d4faf70f06c3399f144ffc2',
 }],
 ['ocular-support','a29ccee61b27faf00d925fafc8b00e0d5b64eda4ebd6481b8b1ff4d16b7e5101','c0b8e103a75f6e1cc4dfbcb120aabeb272fc2b1d5ac63d69695c5b4059845701',3,false,null],
 ['scapular-muscle','f85cabca7802609c6fd339256b87422922862a6cd235b75f8b7cbba8d9720b1a','2ef7cd0048c472defaee2062e510be0008dd9c88d3151fbd4f0738eb3b7c8f15',2,false,{
  'content/scapular-muscle-quiz.ts':'9d1288e2611816528b49404ac1abe1f2eef5e58f371206e59d60d63c6984139e',
  'content/scapular-muscle-quiz-pins.json':'43102b2839f14317a63d714ea17f6bd8673ba0437a163d8ae8a00dabead09e78',
  'lib/scapular-muscle-quiz.ts':'0938996ac8d1acc5b581c69a83151bdcf49b2933f8d964fd7510536afcfe3736',
 }],
];
const literal="const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\n";
const historical="const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\n";
const admissionImport="import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n";
const gate=/assert\.equal\((?:manifest\.sourceCommit|review\.revision|learner\.sourceCommit|viewer\.sourceCommit),revision(?=[,)])/g;
function once(text,needle,replacement){assert.equal(text.split(needle).length,2,`one seam: ${needle.slice(0,65)}`);return text.replace(needle,replacement);}
function injected(hashes){return hashes?'const sourceHashes={\n'+Object.entries(hashes).map(([p,h])=>` '${p}':'${h}',\n`).join('')+'};\n':'';}
function transform(old,{count,map,hashes}){
 const importEnd=old.indexOf('\n\n');assert(importEnd>0,'imports boundary');
 let text=old.slice(0,importEnd)+'\n'+admissionImport+old.slice(importEnd+1);
 text=once(text,literal,historical+injected(hashes));
 const header=text.match(/^test\([^\n]*\{\n/m)?.[0];assert(header,'one-line registered test header');
 const line=` const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes${map?':Object.fromEntries(sourceHashes)':''},learnerModules:['head-neck','shoulder']});\n`;
 text=once(text,header,header+line);
 assert.equal((text.match(gate)||[]).length,count,'all and only expected moving-revision assertions');
 return text.replace(gate,match=>match.replace(',revision',',currentRevision'));
}
function inverse(candidate,{count,map,hashes}){
 let text=candidate;
 const currentGate=/assert\.equal\((?:manifest\.sourceCommit|review\.revision|learner\.sourceCommit|viewer\.sourceCommit),currentRevision(?=[,)])/g;
 assert.equal((text.match(currentGate)||[]).length,count);
 text=text.replace(currentGate,match=>match.replace(',currentRevision',',revision'));
 const line=` const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes${map?':Object.fromEntries(sourceHashes)':''},learnerModules:['head-neck','shoulder']});\n`;
 text=once(text,line,'');
 text=once(text,historical+injected(hashes),literal);
 return once(text,admissionImport,'');
}
function verify(family,bytes){
 const [name,candidateSha,originalSha,count,map,hashes]=family;
 const file=`clinical-review-${name}-quiz.test.ts`,fixture=`fixtures/clinical-review-${name}-quiz.original.ts.raw`;
 const originalBytes=readFileSync(new URL(fixture,import.meta.url));
 assert.equal(sha(originalBytes),originalSha,`${name}: raw original SHA`);
 assert.equal(sha(bytes),candidateSha,`${name}: exact candidate SHA`);
 const old=originalBytes.toString(),candidate=bytes.toString();
 assert.equal(originalBytes.length,Buffer.byteLength(old));assert.equal(bytes.length,Buffer.byteLength(candidate));
 assert(!old.includes('\r')&&!candidate.includes('\r'),`${name}: original/proposal LF scope`);
 assert.equal((old.match(/^test\(/gm)||[]).length,1);
 assert.equal((candidate.match(/^test\(/gm)||[]).length,1);
 assert.equal(transform(old,{count,map,hashes}),candidate,`${name}: complete controlled forward edit`);
 assert.equal(sha(Buffer.from(inverse(candidate,{count,map,hashes}))),originalSha,`${name}: complete byte inverse`);
 assert(candidate.includes('historicalFeature'));assert(candidate.includes("learnerModules:['head-neck','shoulder']"));
 return file;
}
test('six current quiz seams preserve complete original tests and reject tampering',()=>{
 for(const family of families){
  const name=family[0],file=`clinical-review-${name}-quiz.test.ts`,candidate=readFileSync(new URL(file,import.meta.url));
  verify(family,candidate);
  for(const [from,to] of [
   ["learnerModules:['head-neck','shoulder']","learnerModules:['head-neck']"],
   ['currentRevision','revision'],
   ['historicalFeature','futureFeature'],
  ])assert.throws(()=>verify(family,Buffer.from(candidate.toString().replace(from,to))),`${name}: tamper ${from}`);
  assert.throws(()=>verify(family,Buffer.from('if(false){\n'+candidate+'\n}')),`${name}: wrapper tamper`);
 }
});
