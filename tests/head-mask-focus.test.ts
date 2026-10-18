import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {findHeadMaskFocus,HEAD_MASK_CHUNK_VOXELS} from '../lib/head-mask-focus.ts';
import {HEAD_ASSET_HASH_CHUNK_BYTES} from '../lib/head-asset-checksum.ts';
import {loadHeadEntry,loadHeadStudy,openLocalHeadPackage,type LoadedStudy,type LocalHeadPackage,type HeadEntry} from '../lib/head-atlas-import.ts';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';

// The original flattened KJI search, deliberately independent of the new helper.
function oldFocus(mask:Uint8Array,shape:readonly number[]):number {
  const [K,J,I]=shape;
  let best=-1,bestD=Infinity;
  for(let n=0;n<mask.length;n++)if(mask[n]){
    const i=n%I,j=Math.floor(n/I)%J,k=Math.floor(n/(I*J));
    const d=(i-I/2)**2+(j-J/2)**2+(k-K/2)**2;
    if(d<bestD){best=n;bestD=d;}
  }
  return best;
}

test('chunked focus exactly preserves flattened KJI selection and first-index ties',async()=>{
  assert.equal(HEAD_MASK_CHUNK_VOXELS,262144);
  const cases:[readonly number[],number[]][]=[
    [[1,1,1],[1]],[[1,1,2],[1,1]],[[2,2,2],Array(8).fill(1)],
    [[3,3,3],Array(27).fill(1)],[[2,3,5],[0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]],
    [[5,4,3],Array(60).fill(0)],
  ];
  for(const [shape,values] of cases){
    const mask=Uint8Array.from(values);
    assert.equal(await findHeadMaskFocus(mask,shape),oldFocus(mask,shape),`shape ${shape}`);
  }
  assert.equal(await findHeadMaskFocus(Uint8Array.from(Array(8).fill(1)),[2,2,2]),7);
  assert.equal(await findHeadMaskFocus(Uint8Array.from(Array(27).fill(1)),[3,3,3]),13);
  let seed=0x65f4a091;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;}
  for(let caseIndex=0;caseIndex<30;caseIndex++){
    const shape=[1+random()%7,1+random()%6,1+random()%8];
    const mask=Uint8Array.from({length:shape[0]*shape[1]*shape[2]},()=>random()%5===0?1:0);
    assert.equal(await findHeadMaskFocus(mask,shape),oldFocus(mask,shape),`random case ${caseIndex}`);
  }
  const acrossChunks=new Uint8Array(257*1021);
  acrossChunks[0]=1;acrossChunks[HEAD_MASK_CHUNK_VOXELS+10]=1;
  assert.equal(await findHeadMaskFocus(acrossChunks,[1,257,1021]),oldFocus(acrossChunks,[1,257,1021]));
});

test('shape, byte count, and every binary byte are validated even after a candidate',async()=>{
  for(const shape of [[],[1],[1,1,1,1],[0,1,1],[-1,1,1],[1.5,1,1],[Infinity,1,1],[Number.MAX_SAFE_INTEGER+1,1,1]]){
    await assert.rejects(()=>findHeadMaskFocus(new Uint8Array(1),shape));
  }
  await assert.rejects(()=>findHeadMaskFocus(new Uint8Array(2),[1,1,1]));
  await assert.rejects(()=>findHeadMaskFocus(new Uint8Array(1),[1,1,2]));
  const mask=new Uint8Array(HEAD_MASK_CHUNK_VOXELS+1);
  mask[0]=1;mask[mask.length-1]=2;
  await assert.rejects(()=>findHeadMaskFocus(mask,[1,1,mask.length]),/binary/i);
});

test('zero and small masks finish without scheduling a timer',async()=>{
  for(const [mask,shape,expected] of [
    [new Uint8Array(4),[1,2,2],-1],
    [Uint8Array.from([0,1,0,0]),[1,2,2],1],
  ] as const){
    let timerRan=false;
    const timer=setTimeout(()=>{timerRan=true;},0);
    try{
      assert.equal(await findHeadMaskFocus(mask,shape),expected);
      assert.equal(timerRan,false);
    }finally{clearTimeout(timer);}
  }
});

test('pre-abort and timer abort during a large scan reject with AbortError',async()=>{
  const preAborted=new AbortController();preAborted.abort();
  await assert.rejects(()=>findHeadMaskFocus(Uint8Array.from([1]),[1,1,1],preAborted.signal),{name:'AbortError'});
  const mask=new Uint8Array(HEAD_MASK_CHUNK_VOXELS*3+1);mask[0]=1;
  const controller=new AbortController();let timerRan=false;
  const timer=setTimeout(()=>{timerRan=true;controller.abort();},0);
  try{
    await assert.rejects(()=>findHeadMaskFocus(mask,[1,1,mask.length],controller.signal),{name:'AbortError'});
    assert.equal(timerRan,true,'a queued macrotask must run during the scan');
  }finally{clearTimeout(timer);}
});

const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const affine=[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]];
function folderFile(path:string,bytes:Uint8Array|string){
  const file=new File([bytes as BlobPart],path.split('/').at(-1)!);
  Object.defineProperty(file,'webkitRelativePath',{value:`fixture/${path}`});
  return file;
}
function packageFixture(mask:Uint8Array){
  const image=new Uint8Array(new Float32Array(Array.from({length:120},(_,i)=>i-60)).buffer);
  const imageDefinition={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[4,5,6],ijk_to_ras:affine};
  const entry={id:'test.0',label:'Synthetic crop',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},focus_ras_mm:[7,8,9],mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[2,3,4],offset_kji:[1,1,1],native_shape_kji:[4,5,6],ijk_to_ras:affine}};
  const entries=(length:number)=>Array.from({length},(_,i)=>({...entry,id:`test.${i}`}));
  const manifest={schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageDefinition,entries:entries(355)},MRI:{image:imageDefinition,entries:entries(117)}}};
  const encoded=JSON.stringify(manifest);
  return {files:[folderFile('manifest.json',encoded),folderFile('image.bin',image),folderFile('mask.bin',mask)],pin:hash(encoded)};
}

test('loadHeadEntry keeps verified mask focus coordinates, empty fallback, and mask-only mesh skip',async()=>{
  const mask=new Uint8Array(24);mask[0]=1;mask[18]=1;
  const f=packageFixture(mask),pkg=await openLocalHeadPackage(f.files,f.pin),study=await loadHeadStudy(pkg,'CT');
  const entry=study.definition.entries[0];
  entry.mesh={positions_file:'missing-positions',indices_file:'missing-indices',positions_dtype:'float32',indices_dtype:'uint32',point_count:3,triangle_count:1,positions_sha256:'a'.repeat(64),indices_sha256:'b'.repeat(64)};
  const selected=await loadHeadEntry(pkg,study,entry,undefined,{maskOnly:true});
  assert.deepEqual([...selected.mask!],[...mask]);
  assert.deepEqual(selected.focus,[13,24,36]);
  assert.equal(selected.positions,undefined);
  const empty=new Uint8Array(24);
  pkg.files.set('mask.bin',folderFile('mask.bin',empty));
  await assert.rejects(()=>loadHeadEntry(pkg,study,entry,undefined,{maskOnly:true}),/checksum mismatch/i);
  entry.mask!.sha256=hash(empty);
  const selectedEmpty=await loadHeadEntry(pkg,study,entry,undefined,{maskOnly:true});
  assert.deepEqual(selectedEmpty.focus,[7,8,9]);
  assert.deepEqual([...selectedEmpty.mask!],[...empty]);
});

test('loadHeadEntry processes an asset-read abort timer during verified mask focus',async()=>{
  const shape=[1,257,3073];
  const mask=new Uint8Array(shape[0]*shape[1]*shape[2]);mask[0]=1;
  assert.ok(mask.byteLength<HEAD_ASSET_HASH_CHUNK_BYTES,'checksum must not yield to the abort timer');
  assert.ok(mask.length>HEAD_MASK_CHUNK_VOXELS*3,'focus scan must cross several timer yields');
  const image={file:'unused-image.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:shape,ijk_to_ras:affine};
  const entry:HeadEntry={id:'test.large',label:'Synthetic large crop',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
  const study={definition:{image,entries:[entry]},data:new Uint8Array(mask.length),geometry:createNativeVolumeGeometry(image),range:[0,1]} as LoadedStudy;
  const pkg={files:new Map([['mask.bin',folderFile('mask.bin',mask)]])} as LocalHeadPackage;
  const controller=new AbortController();let timerRan=false,assetRead=false;
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
  }finally{if(timer!==undefined)clearTimeout(timer);}
});
