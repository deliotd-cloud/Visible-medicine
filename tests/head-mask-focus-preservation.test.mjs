import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=readFileSync(new URL('./fixtures/head-mask-focus.before-noble-seam.test.ts.raw',import.meta.url));
const active=readFileSync(new URL('./head-mask-focus.test.ts',import.meta.url));
const originalHash='32ef5c970f74ddececf865b5222468e866b0e6c773d22f78ca59c0a610129790';
const activeHash='216102db4dd1e56236f6dedb8119b8ce71946ada3ba735943aeee3d894df0d62';
const sha=value=>createHash('sha256').update(value).digest('hex');
const oldImport="import {findHeadMaskFocus,HEAD_MASK_CHUNK_VOXELS} from '../lib/head-mask-focus.ts';";
const newImport=oldImport+"\nimport {HEAD_ASSET_HASH_CHUNK_BYTES} from '../lib/head-asset-checksum.ts';";
const oldStart="test('loadHeadEntry processes an abort timer queued after its verified checksum',async t=>{\n  const shape=[1,257,3073];\n  const mask=new Uint8Array(shape[0]*shape[1]*shape[2]);mask[0]=1;";
const newStart="test('loadHeadEntry processes an asset-read abort timer during verified mask focus',async()=>{\n  const shape=[1,257,3073];\n  const mask=new Uint8Array(shape[0]*shape[1]*shape[2]);mask[0]=1;\n  assert.ok(mask.byteLength<HEAD_ASSET_HASH_CHUNK_BYTES,'checksum must not yield to the abort timer');\n  assert.ok(mask.length>HEAD_MASK_CHUNK_VOXELS*3,'focus scan must cross several timer yields');";
const oldEnd=`  const controller=new AbortController();let timerRan=false;
  const originalDigest=crypto.subtle.digest.bind(crypto.subtle);
  t.mock.method(crypto.subtle,'digest',async(algorithm:AlgorithmIdentifier,data:BufferSource)=>{
    const digest=await originalDigest(algorithm,data);
    setTimeout(()=>{timerRan=true;controller.abort();},0);
    return digest;
  });
  await assert.rejects(()=>loadHeadEntry(pkg,study,entry,controller.signal,{maskOnly:true}),{name:'AbortError'});
  assert.equal(timerRan,true,'the mask scan must yield to a timer queued after checksum verification');`;
const newEnd=`  const controller=new AbortController();let timerRan=false,assetRead=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  pkg.files.set('mask.bin',{
    size:mask.byteLength,
    async arrayBuffer(){
      assetRead=true;
      timer=setTimeout(()=>{timerRan=true;controller.abort();},0);
      return mask.slice().buffer as ArrayBuffer;
    },
  });
  try{
    await assert.rejects(()=>loadHeadEntry(pkg,study,entry,controller.signal,{maskOnly:true}),{name:'AbortError'});
    assert.equal(assetRead,true,'the queued abort must come from the consumed mask asset');
    assert.equal(timerRan,true,'the verified mask scan must yield to the queued abort');
  }finally{if(timer!==undefined)clearTimeout(timer);}`;

function replaceOnce(text,before,after){
  assert.equal(text.split(before).length-1,1,`unique reviewed block: ${before.slice(0,55)}`);
  return text.replace(before,after);
}
function verify(originalBytes,activeBytes){
  assert.equal(sha(originalBytes),originalHash,'exact pre-repair test');
  assert.equal(sha(activeBytes),activeHash,'exact proposed test');
  const text=originalBytes.toString('utf8');
  assert.deepEqual(Buffer.from(text,'utf8'),originalBytes,'lossless UTF-8 source');
  const expected=replaceOnce(replaceOnce(replaceOnce(text,oldImport,newImport),oldStart,newStart),oldEnd,newEnd);
  assert.deepEqual(activeBytes,Buffer.from(expected,'utf8'),
    'all other cancellation, refusal, focus, and geometry tests remain byte-exact');
}

test('head mask cancellation repair changes only the exact Noble checksum test seam',()=>{
  verify(original,active);
  const controls=[
    ["await assert.rejects(()=>loadHeadEntry(pkg,study,entry,controller.signal,{maskOnly:true}),{name:'AbortError'})",
      "await assert.rejects(()=>loadHeadEntry(pkg,study,entry,controller.signal,{maskOnly:true}),{name:'Error'})"],
    ["assert.equal(timerRan,true,'the verified mask scan must yield to the queued abort')",
      "assert.equal(timerRan,false,'the verified mask scan must yield to the queued abort')"],
    ["assert.equal(assetRead,true,'the queued abort must come from the consumed mask asset')",
      "assert.equal(assetRead,false,'the queued abort must come from the consumed mask asset')"],
    ['assetRead=true;\n      timer=setTimeout(()=>{timerRan=true;controller.abort();},0);',
      'assetRead=true;\n      timer=setTimeout(()=>{timerRan=true;controller.abort;},0);'],
    ['finally{if(timer!==undefined)clearTimeout(timer);}','finally{}'],
    ["await assert.rejects(()=>findHeadMaskFocus(mask,[1,1,mask.length]),/binary/i)",
      "await findHeadMaskFocus(mask,[1,1,mask.length])"],
  ];
  for(const [from,to] of controls){
    assert.ok(active.toString('utf8').includes(from),`negative control exists: ${from}`);
    assert.throws(()=>verify(original,Buffer.from(active.toString('utf8').replace(from,to))));
  }
  assert.throws(()=>verify(Buffer.from(original.toString('utf8').replace('const preAborted','const alteredPreAborted')),active));
});
