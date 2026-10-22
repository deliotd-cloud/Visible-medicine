// Source-only V2 -> V1 -> frozen-original proof. Defer execution until regression is terminal.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const stage=fileURLToPath(new URL('.',import.meta.url));
const frozen=resolve('F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/atlas-hand-vessel-xray.test.mjs');
const read=name=>readFileSync(resolve(stage,name));
const originalBytes=read('atlas-hand-vessel-xray.original.mjs.raw');
const v1Bytes=read('atlas-hand-vessel-xray.v1.mjs.raw');
const proposedBytes=read('atlas-hand-vessel-xray.test.mjs');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(originalBytes),'a91e7a1ab980fed3cf96ebe6b1de090502ee1f22c0a5496b83a71fbd457726a8');
assert.equal(sha(v1Bytes),'53f1cb32695f89e582ccfd0c2ef1e6c75733c4196c95fdbba8368d5055958038');
assert.deepEqual(readFileSync(frozen),originalBytes,'Frozen candidate still equals complete original preimage');
const original=originalBytes.toString('utf8'),v1=v1Bytes.toString('utf8'),proposed=proposedBytes.toString('utf8');
for(const [text,bytes] of [[original,originalBytes],[v1,v1Bytes],[proposed,proposedBytes]])
  assert.deepEqual(Buffer.from(text,'utf8'),bytes,'Source is lossless UTF-8');

function once(source,part,from=0){
  const index=source.indexOf(part,from);
  assert(index>=0,`Missing source anchor: ${part.slice(0,60)}`);
  assert.equal(source.indexOf(part,index+part.length),-1,`Repeated source anchor: ${part.slice(0,60)}`);
  return index;
}
const currentCase="test('current 7b delivery binds the complete imported graph and retains protected hand teaching',async()=>{\n";
const loopStart='  for(const region of regions){\n';
const loopEnd='  const catalogPath=';
function runtimeBody(source){
  const start=once(source,loopStart,once(source,currentCase))+loopStart.length;
  const end=once(source,loopEnd,start);
  assert(end>start);
  return {start,end,body:source.slice(start,end)};
}
const prior=runtimeBody(v1),now=runtimeBody(proposed);
assert.equal(sha(Buffer.from(prior.body)),'70ccdf8d81b6f5e60cd5bae9e9ca8b09c75882a4808f360edb97062c33a3b5dc');
assert.equal(sha(Buffer.from(now.body)),'ab9be06856890de00a1ddc7e6092e51ba52976edab22c64023c3a953c6ba7b44');
assert.equal(proposed.slice(0,now.start)+prior.body+proposed.slice(now.end),v1,
  'The exact single V2 runtime source block inverses to the complete V1 proposal');

const validatorStart=once(v1,'const historicalValidatorBytes=');
const validatorEnd=once(v1,'const oldOriginal=');
assert(validatorEnd>validatorStart);
let reconstructed=v1.slice(0,validatorStart)+v1.slice(validatorEnd);
const admissionCase="test('the recovered 589 delivery closes exactly and its selected imported sources match Git',()=>{\n";
const admissionStart=once(reconstructed,admissionCase)+admissionCase.length;
const admissionEnd=once(reconstructed,'  assert.equal(historicalPin.source,historical);',admissionStart);
assert(admissionEnd>admissionStart);
reconstructed=reconstructed.slice(0,admissionStart)
  +'  validateCurrentAtlasDelivery({pin:historicalPin,read:historicalRead});\n'
  +reconstructed.slice(admissionEnd);
assert.equal(reconstructed,original,'The complete 32,537-byte original source reconstructs exactly');
const names=source=>[...source.matchAll(/^test\('([^']+)'/gm)].map(match=>match[1]);
assert.deepEqual(names(proposed),names(original));
assert.equal(names(original).length,3);
assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(proposed));
console.log(JSON.stringify({completeInverse:true,registeredTests:3,originalSha256:sha(originalBytes),
  v1Sha256:sha(v1Bytes),proposedSha256:sha(proposedBytes)}));
