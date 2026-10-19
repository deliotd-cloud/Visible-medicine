import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {revision56,readRevision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const sources={
 arterial:'17dd42ff6588d9d5b5535076ccef162ef9f66e84f6ae559c2d050609d0388b36',
 venous:'4aeaa847abaaa8031678034e24b2efe28a6b17dffe14ca84d0e6064c3fa32180',
};

test('closed56 femoral guards retain exact verified source with only their delivery import redirected',()=>{
 const before="import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
 const after="import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './historical-current-atlas-delivery-56.mjs';";
 for(const [stem,digest] of Object.entries(sources)){
  const original=readFileSync(new URL(`closed56-guard-${stem}.mjs.txt`,fixture));
  assert.equal(sha(original),digest);
  const text=original.toString('utf8');
  assert.equal(text.split(before).length,2);
  assert.equal(readFileSync(new URL(`./clinical-review-femoral-${stem}-admission-56-closed.test.mjs`,import.meta.url),'utf8'),text.replace(before,after));
 }
});

test('closed56 documents and declared inputs refuse tampering and undeclared reads',()=>{
 assert.deepEqual(validateClosed56(),revision56);
 assert.throws(()=>validateClosed56({pin:{...revision56,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateClosed56({pin:{...revision56,documents:{...revision56.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
 assert.throws(()=>readRevision56('../.env.local'));
 assert.throws(()=>readRevision56('tests/not-declared.mjs'));
 const path='components/HeadAtlasComparisonNavigation.tsx';
 assert.throws(()=>readRevision56(path,{readLive:()=>Buffer.from('tampered')}));
 assert.throws(()=>readRevision56(path,{readLive:()=>new Uint8Array(4)}));
 // An unchanged declared input is admitted only if the raw bytes still match.
 const original=readFileSync(new URL(`closed56-inputs/${path}.txt`,fixture));
 assert.equal(sha(readRevision56(path,{readLive:()=>original})),sha(original));
});

test('closed56 shape is independent of live/default documents and rejects changed validator bytes',async t=>{
 const isolated=()=>{
  const root=mkdtempSync(join(tmpdir(),'vm-closed56-proof-'));
  t.after(()=>{
   assert(realpathSync(root).startsWith(resolve(tmpdir())+sep));
   rmSync(root,{recursive:true,force:true});
  });
  const tests=join(root,'tests'),fixtures=join(tests,'fixtures');
  mkdirSync(fixtures,{recursive:true});
  cpSync(new URL('./historical-current-atlas-delivery-56.mjs',import.meta.url),join(tests,'historical-current-atlas-delivery-56.mjs'));
  for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator','closed56-inputs'])cpSync(new URL(name,fixture),join(fixtures,name),{recursive:true});
  writeFileSync(join(tests,'current-atlas-delivery.mjs'),"throw Error('live validator must not load');\n");
  writeFileSync(join(fixtures,'current-atlas-delivery.json'),'{"corrupt":true}\n');
  mkdirSync(join(root,'atlas-review'),{recursive:true});
  writeFileSync(join(root,'atlas-review','manifest.json'),'{"corrupt":true}\n');
  return {root,entry:pathToFileURL(join(tests,'historical-current-atlas-delivery-56.mjs')).href};
 };
 const independent=isolated();
 const closed=await import(independent.entry);
 assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);
 assert.equal(sha(closed.readRevision56('components/HeadAtlasViewer.tsx',{readLive:()=>{throw Error('isolated reader reached live viewer');}})),'06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');
 const tampered=isolated();
 const frozen=join(tampered.root,'tests','fixtures','closed56-validator','tests','current-atlas-delivery.mjs');
 writeFileSync(frozen,readFileSync(frozen,'utf8')+'\n// tampered\n');
 await assert.rejects(import(tampered.entry),/Closed56 fixture changed: closed56-validator\/tests\/current-atlas-delivery.mjs/);
});

test('live femoral admission follows the independently validated current delivery',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,pin.source);
 assert.equal(pin.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url)));
 assert.equal(pin.reviewIntegration,sha(JSON.stringify(inputs.inputs)));
 const review=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url)));
 assert.equal(pin.reviewSourceFiles,review.files.length);
 assert(currentAtlasDeliveryRoot());
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
});
