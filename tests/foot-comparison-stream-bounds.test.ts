import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){return specifier==='server-only'?{url:'data:text/javascript,export%20%7B%7D',shortCircuit:true}:next(specifier,context);}});
const {deliverFootComparison}=await import('../lib/foot-comparison-delivery.ts');

const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const revision='b'.repeat(64),name='model-99.json';
const payload=Buffer.from('{"structures":[]}');
const packet={purpose:'held-v3-foot-source-inspection',revision,admissions:0,
  clinicalValidation:false,registered:false,sourceGeometryChanged:false,
  files:[{name,bytes:payload.length,sha256:sha(payload)}]};
const href=`https://review.test/api/atlas-review/source-comparisons/foot/${name}?revision=${revision}`;
const call=(bytes:Uint8Array,declared=payload.length,method='GET')=>deliverFootComparison(
  new Request(href,{method}),{...packet,files:[{...packet.files[0],bytes:declared}]},
  {[name]:gzipSync(bytes).toString('base64')});

test('GET and HEAD verify the complete bounded gzip content without an extra response copy',async()=>{
  const response=await call(payload);assert.equal(response.status,200);
  assert.equal(await response.text(),payload.toString());
  const head=await call(payload,payload.length,'HEAD');assert.equal(head.status,200);
  assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),String(payload.length));
  assert.equal(head.headers.get('x-source-asset-sha256'),sha(payload));
});

test('both methods reject short, oversized, invalid and same-length altered payloads',async()=>{
  for(const method of ['GET','HEAD']){
    for(const bytes of [payload.subarray(0,-1),Buffer.concat([payload,Buffer.from('x')]),
      Buffer.alloc(2*1024*1024,65),Buffer.alloc(payload.length,65)])
      assert.equal((await call(bytes,payload.length,method)).status,503);
    for(const declared of [0,-1,1.1,Number.NaN,Number.MAX_SAFE_INTEGER,16*1024*1024+1])
      assert.equal((await call(payload,declared,method)).status,503);
    const invalid=await deliverFootComparison(new Request(href,{method}),packet,{[name]:'not gzip'});
    assert.equal(invalid.status,503);
  }
});
