import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../../public/fracture-review/package.js';
const {parse,sha}=globalThis.VMFracturePackage;
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
async function fixture(){return {schema:'vm-fracture-local-review-v1',contentRevision:'a'.repeat(64),clinicalStatus:'pending',privacyStatus:'pending',reuseStatus:'pending',cases:[{id:'case_'+ 'a'.repeat(32),images:[{id:'asset_'+'b'.repeat(32),mime:'image/png',sha256:await sha(Buffer.from(png,'base64')),base64:png,view:'frontal',laterality:null}],questions:[{id:'question_'+'c'.repeat(32),prompt:'Describe the synthetic image',answer:null,rationale:null,maxMarks:1}]}]};}
async function envelope(p){return JSON.stringify({payload:p,sha256:await sha(new TextEncoder().encode(JSON.stringify(p)))});}
test('pending local package round-trips without inventing answers',async()=>{const p=await fixture();assert.deepEqual(await parse(await envelope(p)),p);});
test('tampered envelope or image is rejected',async()=>{const p=await fixture();const raw=await envelope(p);await assert.rejects(parse(raw.replace('Describe','Altered')));p.cases[0].images[0].base64=png.replace('mP8','mP9');await assert.rejects(parse(await envelope(p)));});
test('approval promotion, unexpected locators and duplicate image hashes rejected',async()=>{
  for(const mutate of [p=>p.clinicalStatus='approved',p=>p.cases[0].images[0].url='https://example.invalid/patient',p=>p.cases[0].images.push({...p.cases[0].images[0],id:'asset_'+'d'.repeat(32)})]){const p=await fixture();mutate(p);await assert.rejects(parse(await envelope(p)));}
});
test('PNG signature, oversized dimensions and non-PNG payloads rejected',async()=>{
  for(const mode of ['signature','dimensions','mime']){const p=await fixture(),im=p.cases[0].images[0],bytes=Buffer.from(png,'base64');if(mode==='signature')bytes[0]=0;if(mode==='dimensions')bytes.writeUInt32BE(20000,16);if(mode==='mime')im.mime='image/svg+xml';im.base64=bytes.toString('base64');im.sha256=await sha(bytes);await assert.rejects(parse(await envelope(p)));}
});
test('offline reader stays network-free and website entry uses the protected Education runtime',()=>{
  const script=readFileSync(new URL('../../public/fracture-review/review.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../../public/fracture-review/index.html',import.meta.url),'utf8');
  const page=readFileSync(new URL('../../app/learn/fracture-review/page.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB|\.innerHTML|postMessage/);
  assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('img-src blob:'));
  assert.ok(page.includes('await authorizeClinicalReview()'));assert.ok(page.includes('EducationRuntime accessMode="fracture-review"'));assert.doesNotMatch(page,/<iframe/);
});
test('generated isolated reader binds the current exact script and stylesheet bytes',async()=>{
  const {createHash}=await import('node:crypto');
  const root=new URL('../../public/fracture-review/',import.meta.url);
  const reader=readFileSync(new URL('reader.html',root),'utf8').replaceAll('\r\n','\n');
  for(const name of ['package.js','review.js','review.css']){
    const source=readFileSync(new URL(name,root),'utf8').replaceAll('\r\n','\n');
    assert.ok(reader.includes(source));
    assert.ok(reader.includes(`'sha256-${createHash('sha256').update(source).digest('base64')}'`));
  }
  assert.doesNotMatch(reader,/<script[^>]+src=|<link[^>]+href=/);
});
