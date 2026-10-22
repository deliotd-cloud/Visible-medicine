import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const before=p=>read('tests/fixtures/head-surface-before-20261022/'+p.replaceAll('/','__')+'.raw');
const historical=(p,digest)=>{const b=before(p);assert.equal(sha(b),digest,p);return b;};

test('the complete preceding delivery contract survives with only its exact bound-input count updated',()=>{
 const old=historical('tests/current-atlas-delivery.test.mjs','172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e');
 const now=read('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(now.split('assert.equal(inputs,1727)').length,2);
 assert.deepEqual(Buffer.from(now.replace('assert.equal(inputs,1727)','assert.equal(inputs,1726)')),old);
 const pin=JSON.parse(historical('tests/fixtures/current-atlas-delivery.json','90d89bf628c988082db64bb5be0391e147ce25729920eeeb917be6a189159e19'));
 assert.equal(pin.reviewIntegration,'2c8e263eb4bbd04120eb79560314f372a10846f6fd5616477bde18a42e9f7ef3');
 assert.throws(()=>validateCurrentAtlasDelivery({pin}));
 const current=validateCurrentAtlasDelivery();
 for(const k of ['source','sourceTree','runtimeSources','reviewSourceFiles','viewerFiles','viewerPackages'])assert.deepEqual(current[k],pin[k],k);
 const changed=Object.keys(pin.documents).filter(p=>pin.documents[p]!==current.documents[p]).sort();
 assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
});

test('surface validation leaves all preceding import and source gates byte-exact outside its two-loop seam',()=>{
 const old=historical('lib/head-atlas-import.ts','9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57');
 const now=read('lib/head-atlas-import.ts').toString();
 const added="import {validateHeadSurface} from './head-surface-validation.ts';\n";
 assert.equal(now.split(added).length,2);
 const seam='    await validateHeadSurface(positions,indices,mesh.point_count,signal);';
 assert.equal(now.split(seam).length,2);
 const original="    for(const v of positions)if(!Number.isFinite(v)||Math.abs(v)>100000)fail('Invalid world-space surface point.');\n    for(const i of indices)if(i>=mesh.point_count)fail('Surface index is out of bounds.');";
 assert.deepEqual(Buffer.from(now.replace(added,'').replace(seam,original)),old);
 const bindOld=historical('scripts/bind-clinical-review.mjs','0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06');
 const bind=read('scripts/bind-clinical-review.mjs').toString();
 assert.equal(bind.split("'lib/head-surface-validation.ts',").length,2);
 assert.deepEqual(Buffer.from(bind.replace("'lib/head-surface-validation.ts',",'')),bindOld);
});

test('the helper and importer are uniquely source-bound; every other existing Review input remains exact',()=>{
 const old=JSON.parse(historical('atlas-review/integration-inputs.json','4be189a5395054b7bd9dfb3ca4883a13017c9d54d1516dd46ecc7b0dc5992bd6'));
 const current=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(old.inputs.length,1726);assert.equal(current.inputs.length,1727);
 const oldMap=new Map(old.inputs.map(r=>[r.path,r.sha256]));
 assert.deepEqual(current.inputs.filter(r=>!oldMap.has(r.path)).map(r=>r.path),['lib/head-surface-validation.ts']);
 assert.deepEqual(current.inputs.filter(r=>oldMap.has(r.path)&&oldMap.get(r.path)!==r.sha256).map(r=>r.path).sort(),['lib/head-atlas-import.ts','scripts/bind-clinical-review.mjs']);
 for(const r of current.inputs){assert.equal(sha(read(r.path)),r.sha256,r.path);assert.equal(current.inputs.filter(x=>x.path===r.path).length,1,r.path);}
 assert.equal(current.sha256,sha(JSON.stringify(current.inputs)));
 assert.notEqual(current.sha256,old.sha256);
 const helper=read('lib/head-surface-validation.ts').toString();
 assert.doesNotMatch(helper,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB|\.slice\(|\.subarray\(|new (?:Float\d+Array|Uint\d+Array)/);
});
