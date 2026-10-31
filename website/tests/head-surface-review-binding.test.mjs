import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const before=p=>read('tests/fixtures/head-surface-before-20261022/'+p.replaceAll('/','__')+'.raw');
const historical=(p,digest)=>{const b=before(p);assert.equal(sha(b),digest,p);return b;};
const surfaceRoot='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/website';
const receiptBytes=readFileSync('F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/SOURCE.json');
assert.equal(sha(receiptBytes),'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed','Authenticated post-surface receipt');
const receipt=JSON.parse(receiptBytes);
assert.equal(resolve(receipt.website),resolve(surfaceRoot));
const surfaceRows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
assert.equal(surfaceRows.size,receipt.sourceRows.length,'Unique historical source rows');
const surfaceBytes=path=>{
 const row=surfaceRows.get(path);assert(row,'Authenticated post-surface path: '+path);
 const bytes=readFileSync(surfaceRoot+'/'+path);
 assert.equal(bytes.length,row.bytes,path);assert.equal(sha(bytes),row.sha256,path);return bytes;
};
const surfaceJson=path=>JSON.parse(surfaceBytes(path));

test('the complete preceding delivery contract survives with only its exact bound-input count updated',()=>{
 const old=historical('tests/current-atlas-delivery.test.mjs','172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e');
 const after=surfaceBytes('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(after.split('assert.equal(inputs,1727)').length,2);
 assert.deepEqual(Buffer.from(after.replace('assert.equal(inputs,1727)','assert.equal(inputs,1726)')),old,'Exact original surface-epoch count inverse');
 const pin=JSON.parse(historical('tests/fixtures/current-atlas-delivery.json','90d89bf628c988082db64bb5be0391e147ce25729920eeeb917be6a189159e19'));
 assert.equal(pin.reviewIntegration,'2c8e263eb4bbd04120eb79560314f372a10846f6fd5616477bde18a42e9f7ef3');
 assert.throws(()=>validateCurrentAtlasDelivery({pin}));
 const afterPin=surfaceJson('tests/fixtures/current-atlas-delivery.json');
 for(const k of ['source','sourceTree','runtimeSources','reviewSourceFiles','viewerFiles','viewerPackages'])assert.deepEqual(afterPin[k],pin[k],k);
 const changed=Object.keys(pin.documents).filter(p=>pin.documents[p]!==afterPin.documents[p]).sort();
 assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
 assert.equal(afterPin.source,receipt.atlasHead);assert.equal(afterPin.sourceTree,receipt.atlasTree);
 const current=validateCurrentAtlasDelivery();
 const now=read('tests/current-atlas-delivery.test.mjs').toString();
 assert(now.includes(`assert.equal(CURRENT_ATLAS_REVISION,'${current.source}')`),'Current test names the exact validated source');
 assert(now.includes(`assert.equal(pin.sourceTree,'${current.sourceTree}')`),'Current test names the exact validated tree');
 assert(now.includes('assert.equal(inputs,1866)'),'Current test verifies the complete bound input count');
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])
  assert.equal(JSON.parse(read(`public/atlas-runtime/${name}/manifest.json`)).sourceCommit,current.runtimeSources[name],name);
});

test('surface validation leaves all preceding import and source gates byte-exact outside its two-loop seam',()=>{
 const old=historical('lib/head-atlas-import.ts','9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57');
 const now=surfaceBytes('lib/head-atlas-import.ts').toString();
 const added="import {validateHeadSurface} from './head-surface-validation.ts';\n";
 assert.equal(now.split(added).length,2);
 const seam='    await validateHeadSurface(positions,indices,mesh.point_count,signal);';
 assert.equal(now.split(seam).length,2);
 const original="    for(const v of positions)if(!Number.isFinite(v)||Math.abs(v)>100000)fail('Invalid world-space surface point.');\n    for(const i of indices)if(i>=mesh.point_count)fail('Surface index is out of bounds.');";
 assert.deepEqual(Buffer.from(now.replace(added,'').replace(seam,original)),old,'Exact original two-loop inverse against post-surface source');
 const currentImporter=read('lib/head-atlas-import.ts').toString();
 assert.equal(currentImporter.split(added).length,2);assert.equal(currentImporter.split(seam).length,2);
 assert(!currentImporter.includes(original),'Current importer does not restore the old unchecked loops');
 const bindOld=historical('scripts/bind-clinical-review.mjs','0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06');
 const bind=surfaceBytes('scripts/bind-clinical-review.mjs').toString();
 assert.equal(bind.split("'lib/head-surface-validation.ts',").length,2);
 assert.deepEqual(Buffer.from(bind.replace("'lib/head-surface-validation.ts',",'')),bindOld,'Exact original binder input inverse against post-surface source');
 assert.equal(read('scripts/bind-clinical-review.mjs').toString().split("'lib/head-surface-validation.ts',").length,2);
});

test('the helper and importer are uniquely source-bound; every other existing Review input remains exact',()=>{
 const old=JSON.parse(historical('atlas-review/integration-inputs.json','4be189a5395054b7bd9dfb3ca4883a13017c9d54d1516dd46ecc7b0dc5992bd6'));
 const after=surfaceJson('atlas-review/integration-inputs.json');
 const current=JSON.parse(read('atlas-review/integration-inputs.json'));
 const pin=validateCurrentAtlasDelivery();
 assert.equal(old.inputs.length,1726);assert.equal(after.inputs.length,1727);
 const oldMap=new Map(old.inputs.map(r=>[r.path,r.sha256]));
 assert.equal(oldMap.size,old.inputs.length,'All original input paths were unique');
 assert(!oldMap.has('lib/head-surface-validation.ts'),'The new helper was absent at the authenticated prior epoch');
 assert.deepEqual(after.inputs.filter(r=>!oldMap.has(r.path)).map(r=>r.path),['lib/head-surface-validation.ts']);
 assert.deepEqual(after.inputs.filter(r=>oldMap.has(r.path)&&oldMap.get(r.path)!==r.sha256).map(r=>r.path).sort(),['lib/head-atlas-import.ts','scripts/bind-clinical-review.mjs']);
 for(const r of after.inputs){assert.equal(sha(surfaceBytes(r.path)),r.sha256,r.path);assert.equal(after.inputs.filter(x=>x.path===r.path).length,1,r.path);}
 assert.equal(after.sha256,sha(JSON.stringify(after.inputs)));
 assert.notEqual(after.sha256,old.sha256);
 assert.equal(current.inputs.length,1866);
 assert.equal(current.inputs.filter(r=>r.path==='lib/head-surface-validation.ts').length,1);
 assert.equal(current.inputs.filter(r=>r.path==='lib/head-atlas-import.ts').length,1);
 assert.equal(current.inputs.filter(r=>r.path==='scripts/bind-clinical-review.mjs').length,1);
 for(const r of current.inputs){assert.equal(sha(read(r.path)),r.sha256,r.path);assert.equal(current.inputs.filter(x=>x.path===r.path).length,1,r.path);}
 assert.equal(current.sourceCommit,pin.source);assert.equal(current.sha256,pin.reviewIntegration);
 assert.equal(current.sha256,sha(JSON.stringify(current.inputs)));
 assert.notEqual(current.sha256,old.sha256);
 const helper=read('lib/head-surface-validation.ts').toString();
 assert.doesNotMatch(helper,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB|\.slice\(|\.subarray\(|new (?:Float\d+Array|Uint\d+Array)/);
});
