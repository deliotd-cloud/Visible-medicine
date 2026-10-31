import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const testsRoot=import.meta.dirname;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cssSeamBytes=readFileSync(resolve(testsRoot,'fixtures/compact-css-discovery-seam-20261024.json'));
assert.equal(sha(cssSeamBytes),'459bfe4f69a040a4b7ef1c4a54ff57bd68a29faa66f2e13135901943904c7ae8','bounded CSS seam fixture');
const cssSeam=JSON.parse(cssSeamBytes);
assert.equal(cssSeam.schema,'vm-compact-css-discovery-seam-1');
assert.equal(cssSeam.sourceReceiptSha256,'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
assert.equal(sha(cssSeam.old),cssSeam.oldBlockSha256,'old complete CSS test block');
assert.equal(sha(cssSeam.new),cssSeam.newBlockSha256,'new complete CSS test block');
const rows=[
  {
    name:'atlas-bodyparts-inventory-correction.test.ts',
    frozen:'b636b01e74ba172be3dc26ee14dd43801a4111564837725481590679798cbbaf',
    seams:[
      ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
      [" const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n"," const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n"],
      ['assert.equal(manifest.sourceCommit,review.revision);','assert.equal(manifest.sourceCommit,runtimeSources[name]);'],
    ],
    uniform:'assert.equal(manifest.sourceCommit,review.revision);',
  },
  {
    name:'atlas-camera-status.test.ts',
    frozen:'9bca328e5ff4a801913459676caf2233fd75ff17ae0c2794de6dcb2bb8ef4b60',
    seams:[
      ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
      ['const learnerRevision=revision;','const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;'],
      ['assert.equal(manifest.sourceCommit,learnerRevision);','assert.equal(manifest.sourceCommit,runtimeSources[name]);'],
    ],
    uniform:'assert.equal(manifest.sourceCommit,revision);',
  },
  {
    name:'atlas-celiac-neck.test.ts',
    frozen:'9f28bffd03be95f4aa7c10f30750d8fe22197f8693ad0cd0a4696e57754a7c2a',
    seams:[
      ["  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));\n","  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));\n  const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n"],
      ['assert.equal(entry.sourceCommit,manifest.sourceCommit);','assert.equal(entry.sourceCommit,runtimeSources[entry.module]);'],
    ],
    uniform:'assert.equal(entry.sourceCommit,manifest.sourceCommit);',
  },
  {
    name:'atlas-compact-study-checks.mjs',
    frozen:'959f23604a11f8563b623526cc1a616f9b5c21272956273484ae0b54cf84f9b3',
    seams:[
      [cssSeam.old,cssSeam.new],
      ['assert.equal(manifest.sourceCommit,liveRevision,name);','assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);'],
    ],
    uniform:'assert.equal(manifest.sourceCommit,liveRevision,name);',
  },
];

function replaceExactlyOnce(source,from,to){
  assert.equal(source.split(from).length,2,'Declared seam missing or ambiguous: '+from);
  return source.replace(from,to);
}
const forward=(source,seams)=>seams.reduce((value,[from,to])=>replaceExactlyOnce(value,from,to),source);
const inverse=(source,seams)=>[...seams].reverse().reduce((value,[from,to])=>replaceExactlyOnce(value,to,from),source);
const check=(row,candidate,raw)=>{
  assert.equal(candidate,forward(raw,row.seams),'Only declared forward seams: '+row.name);
  assert.equal(inverse(candidate,row.seams),raw,'Exact whole-source inverse: '+row.name);
};

test('four frozen originals are authentic, with exact whole-source forwards and inverses',()=>{
  for(const row of rows){
    const raw=readFileSync(resolve(testsRoot,'fixtures/runtime-family-before-20261022',row.name+'.raw'));
    assert.equal(sha(raw),row.frozen,'Immutable original bytes: '+row.name);
    const candidate=readFileSync(resolve(testsRoot,row.name),'utf8');
    check(row,candidate,raw.toString('utf8'));
  }
});

test('deleted assertions, unrelated mutations and uniform-family reintroductions are refused',()=>{
  for(const row of rows){
    const raw=readFileSync(resolve(testsRoot,'fixtures/runtime-family-before-20261022',row.name+'.raw'),'utf8');
    const candidate=readFileSync(resolve(testsRoot,row.name),'utf8');
    assert.throws(()=>check(row,candidate.replace(row.seams.at(-1)[1],''),raw),row.name+': removed assertion');
    assert.throws(()=>check(row,candidate+'\n// unrelated mutation',raw),row.name+': unknown mutation');
    assert.throws(()=>check(row,candidate.replace(row.seams.at(-1)[1],row.uniform),raw),row.name+': uniform runtime regression');
  }
});

test('the archived 2026-10-22 pin distinguishes the original runtime families',()=>{
  const archived=readFileSync(resolve(testsRoot,'fixtures/current-atlas-delivery-before-neck-xray-20261022.json'));
  assert.equal(sha(archived),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d','exact archived pin bytes');
  const pin=JSON.parse(archived);
  assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
  assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
  assert.equal(pin.runtimeSources['head-neck'],pin.source);
  for(const name of ['shoulder','lower-limb','female-pelvis'])
    assert.equal(pin.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.notEqual(pin.runtimeSources.shoulder,pin.runtimeSources['head-neck']);
});

test('the sealed current delivery independently validates each runtime family',()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.runtimeSources['head-neck'],pin.source);
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const manifest=JSON.parse(readFileSync(new URL('../public/atlas-runtime/'+name+'/manifest.json',import.meta.url)));
    assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name+' follows its own admitted source');
    const forged=structuredClone(pin);forged.runtimeSources[name]='0'.repeat(40);
    assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}),name+' rejects an unbound source');
  }
});
