import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {reconstructClosed56BeforeFamily} from './closed56-family-source-inverse.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const here=fileURLToPath(new URL('.',import.meta.url));
const root=process.env.VM_CLOSED56_SOURCE_ROOT??resolve(here,'..');
const current=readFileSync(new URL('./fixtures/closed56-femoral-epoch-current-2381.mjs.raw',import.meta.url),'utf8').replaceAll('\r\n','\n');
const candidate=readFileSync(resolve(root,'tests/closed56-femoral-epoch.test.mjs'),'utf8').replaceAll('\r\n','\n');
const currentHash='d15ee270c69672f141592ab25b9ce48e1cd4fa969b31177e3d8c047a2ced92f7';
const priorHash='1e2111111f5c9798a778710e65057680928c18ae79f954fc40796c4ca01fde4a';

test('authenticated 2381 consumer has one exact four-role inverse to its old whole theorem',()=>{
 assert.equal(sha(current),currentHash);
 const prior=reconstructClosed56BeforeFamily(current);
 assert.equal(sha(prior),priorHash);
 assert.equal(reconstructClosed56BeforeFamily(current,prior),prior);
 assert.match(prior,/assert\.equal\(pin\.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'\)/);
 assert.match(prior,/assert\.equal\(inputs\.inputs\.length,1723\)/);
});

test('successor root retains every 2381 assertion behind authenticated replay',()=>{
 assert.equal(sha(candidate),'5070234e61e56cc367f23d94a5f34c53a8c9fbd593d30c52f5ec74f16a274d14');
 const added="import {replayFemoral2381} from './closed56-femoral-epoch-history-1031.mjs';\n";
 assert.equal(candidate.split(added).length,2);
 const seam="test('complete 2381 femoral admission runs at its authenticated historical source'";
 const oldSeam="test('live femoral admission follows the independently validated current delivery'";
 assert.equal(candidate.split(seam).length,2);assert.equal(current.split(oldSeam).length,2);
 assert.equal(candidate.replace(added,'').slice(0,candidate.replace(added,'').indexOf(seam)),current.slice(0,current.indexOf(oldSeam)));
 assert.match(candidate,/replayFemoral2381\(\)/);
});

test('old complete helper restores after only the new authenticated role block',()=>{
 const prior=readFileSync(new URL('./fixtures/closed56-family-source-inverse-before-current.mjs.raw',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const candidate=readFileSync(new URL('./closed56-family-source-inverse.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
 assert.equal(sha(prior),'a7a21ced5b6e8661de3a26937b73c451bb27cbb2b8056a97a6e5ccf830661398');
 const start=' const after=';
 const end=" assert(!prior.includes('familyRefusal')";
 const a=prior.indexOf(start),b=prior.indexOf(end,a);
 const c=candidate.indexOf(' const currentRole=['),d=candidate.indexOf(end,c);
 assert(a>=0&&b>a&&c>=0&&d>c);
 const oldBlock=prior.slice(a,b),newBlock=candidate.slice(c,d);
 assert.equal(sha(newBlock),'9f638639248463236e2dd34dc876080058f8683c44a0e102fbc9a9861a45fa0c');
 assert.equal(candidate.slice(0,c)+oldBlock+candidate.slice(d),prior);
});

test('missing, duplicated, foreign, or changed current roles and unrelated code fail closed',()=>{
 const prior=reconstructClosed56BeforeFamily(current);
 const role=" assert.equal(inputs.inputs.length,1729);";
 assert.equal(current.split(role).length,2);
 for(const bad of [
  current.replace(role,''),
  current.replace(role,role+'\n'+role),
  current.replace(role," assert.equal(inputs.inputs.length,1730);"),
  current.replace('2381efe43b75f8a7fb768a069eecd7268c508dac','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'),
  current.replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:revision56}));",''),
  current+'\n// unknown future consumer source\n',
 ])assert.throws(()=>reconstructClosed56BeforeFamily(bad,prior));
});
