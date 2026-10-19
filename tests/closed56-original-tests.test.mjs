import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 ['current-atlas-delivery.test.mjs','b27deaa67d4ea9aa6908abb5a3324efb43bcc2f8344e01c9a4d3ed9424ef0d41',[
  ["from './current-atlas-delivery.mjs';","from './historical-current-atlas-delivery-56.mjs';\nimport {readRevision56,revision56} from './historical-current-atlas-delivery-56.mjs';"],
  ["const root=fileURLToPath(new URL('../',import.meta.url));","const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));"],
  ["const pin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));","const pin=revision56;"],
  ["const read=path=>readFileSync(root+'/'+path);","const read=path=>readRevision56(path);"],
 ]],
 ['head-manual-recovery-current-transition.test.mjs','d7af3829a0cd884858dbe8188e9409679828e31ad58e8643180bce74f97b7920',[
  ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery,readRevision56} from './historical-current-atlas-delivery-56.mjs';"],
  ["const read=path=>readFileSync(new URL('../'+path,import.meta.url));","const read=path=>readRevision56(path);"],
 ]],
 ['shoulder-us-renderer-migration.test.mjs','b4700123c95cdf38f85cb5b48236428642e10fb94782c866ef6c28101f209171',[
  ["const root=process.cwd(),sha=value=>createHash('sha256').update(value).digest('hex');","import {readRevision56} from './historical-current-atlas-delivery-56.mjs';\nconst root=process.cwd(),sha=value=>createHash('sha256').update(value).digest('hex');"],
  ["const delivery=await import(pathToFileURL(resolve(root,'tests/current-atlas-delivery.mjs')).href);","const delivery=await import('./historical-current-atlas-delivery-56.mjs');"],
  ["await execute(readFileSync);","await execute(readRevision56);"],
  ["const input=JSON.parse(readFileSync(file));","const input=JSON.parse(readRevision56(file));"],
  ["return readFileSync(file,...args);","return readRevision56(file);"],
 ]],
];

for(const [name,digest,edits] of cases)test(name+' preserves all backup assertions with only declared read seams',()=>{
 const original=readFileSync(new URL('./fixtures/closed56-original-tests/'+name+'.txt',import.meta.url));
 assert.equal(sha(original),digest);
 let exact=original.toString('utf8');
 for(const [before,after] of edits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
 const candidate=readFileSync(new URL('./'+name.replace('.test.mjs','-56-closed.test.mjs'),import.meta.url),'utf8');
 assert.equal(candidate,exact);
 assert.notEqual(candidate+'\n',exact);
});

for(const [name,before,after] of [
 ['current-atlas-delivery.test.mjs',"assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read('atlas-review/integration-inputs.json')).inputs)));"],
 ['shoulder-us-renderer-migration.test.mjs',"assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)));"],
])test(name+' live copy changes only its current Review expectation',()=>{
 const original=readFileSync(new URL('./fixtures/closed56-original-tests/'+name+'.txt',import.meta.url),'utf8');
 assert.equal(original.split(before).length,2);
 const live=readFileSync(new URL('./'+name,import.meta.url),'utf8');
 assert.equal(live,original.replace(before,after));
});
