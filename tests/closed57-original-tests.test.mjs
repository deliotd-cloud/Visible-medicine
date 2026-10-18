import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 ['current-atlas-delivery.test.mjs','7955fd210cb57b94667ae03b025987d196583e49cfbece5f056b44f80089c91c','current-atlas-delivery-57-closed.test.mjs',[
  ["from './current-atlas-delivery.mjs';","from './historical-current-atlas-delivery-57.mjs';\nimport {readRevision57,revision57} from './historical-current-atlas-delivery-57.mjs';"],
  ["const root=fileURLToPath(new URL('../',import.meta.url));","const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));"],
  ["const pin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));","const pin=revision57;"],
  ["const read=path=>readFileSync(root+'/'+path);","const read=path=>readRevision57(path);"],
 ]],
 ['current-atlas-delivery-56-to-57.test.mjs','ffa7568dab4fb717729e5f3628f7ff7e9ff8f4da694e0b2d4908eaafd644bacc','current-atlas-delivery-56-to-57-closed.test.mjs',[
  ["import {readRevision56,revision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';","import {readRevision56,revision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';\nimport {readRevision57} from './historical-current-atlas-delivery-57.mjs';"],
  ["const read=path=>readFileSync(join(root,path));","const read=path=>readRevision57(path);"],
  ["const delivery=await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);","const delivery=await import('./historical-current-atlas-delivery-57.mjs');"],
 ]],
 ['historical-head-toolbar-css-preservation.test.mjs','41882e45c433974ebe10ac4dc489ad84f65e787a0b56500add2e49bab203cb26','historical-head-toolbar-css-preservation-57-closed.test.mjs',[
  ["new URL(`./historical-current-atlas-delivery-${number}.mjs`,import.meta.url)","new URL(`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-${number}.mjs.raw`,import.meta.url)"],
  ["new URL('../components/head-atlas.css',import.meta.url)","new URL('./fixtures/closed57-overrides/components/head-atlas.css',import.meta.url)"],
 ]],
 ['closed56-femoral-epoch.test.mjs','09cc0dc099c4973e401c7672006ac3966a812f12cdcbedc5735f3b9e66a22463','closed56-femoral-epoch.test.mjs',[
  ["for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator'])","for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator','closed56-inputs'])"],
  [" assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);"," assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);\n assert.equal(sha(closed.readRevision56('components/HeadAtlasViewer.tsx',{readLive:()=>{throw Error('isolated reader reached live viewer');}})),'06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');"],
 ]],
];

for(const [name,digest,candidate,edits] of cases)test(name+' preserves every old assertion and expected literal',()=>{
 const original=readFileSync(new URL('./fixtures/closed57-original-tests/'+name+'.raw',import.meta.url));
 assert.equal(sha(original),digest);
 let exact=original.toString('utf8');
 for(const [before,after] of edits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
 assert.equal(readFileSync(new URL('./'+candidate,import.meta.url),'utf8'),exact);
 assert.notEqual(exact+'\n',exact);
});
