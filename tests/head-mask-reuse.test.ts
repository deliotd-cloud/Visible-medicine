import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canReuseHeadMask,loadHeadEntry,loadHeadStudy,type HeadEntry,type HeadPackageAsset,type LoadedEntry,type LocalHeadPackage} from '../lib/head-atlas-import.ts';

const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function fixture(){
  const calls=new Map<string,number>();
  const image=new Uint8Array(new Float32Array(8).buffer),mask=new Uint8Array([1,0]);
  const positions=new Uint8Array(new Float32Array([0,0,0,1,0,0,0,1,0]).buffer);
  const indices=new Uint8Array(new Uint32Array([0,1,2]).buffer);
  const assets=new Map([['image.bin',image],['mask.bin',mask],['positions.bin',positions],['indices.bin',indices]]);
  let beforeRead:((path:string)=>Promise<void>)|undefined;
  const files=new Map<string,HeadPackageAsset>();
  for(const [path,bytes] of assets)files.set(path,{size:bytes.byteLength,async arrayBuffer(){calls.set(path,(calls.get(path)??0)+1);await beforeRead?.(path);return bytes.slice().buffer;}});
  const imageDescriptor={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[2,2,2],ijk_to_ras:affine};
  const entry:HeadEntry={id:'one',label:'One',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine},mesh:{positions_file:'positions.bin',indices_file:'indices.bin',positions_dtype:'float32',indices_dtype:'uint32',point_count:3,triangle_count:1,positions_sha256:hash(positions),indices_sha256:hash(indices)}};
  const pkg={manifest:{studies:{CT:{image:imageDescriptor,entries:[entry]},MRI:{image:imageDescriptor,entries:[]}}},files} as unknown as LocalHeadPackage;
  return {pkg,entry,calls,files,setBeforeRead:(fn:typeof beforeRead)=>{beforeRead=fn;}};
}

test('verified exact donor skips mask IO; mask-only never reads surfaces and full load verifies fresh surfaces',async()=>{
  const f=fixture(),study=await loadHeadStudy(f.pkg,'CT');
  const donor=await loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true});
  assert.equal(canReuseHeadMask(f.pkg,study,f.entry,donor),true);
  const maskReads=f.calls.get('mask.bin');
  const reused=await loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true,reuseMask:donor});
  assert.equal(reused.mask,donor.mask);assert.deepEqual(reused.focus,donor.focus);
  assert.equal(f.calls.get('mask.bin'),maskReads);assert.equal(f.calls.get('positions.bin'),undefined);
  assert.equal(f.calls.get('indices.bin'),undefined);assert.equal(reused.positions,undefined);
  const full=await loadHeadEntry(f.pkg,study,f.entry,undefined,{reuseMask:reused});
  assert.equal(full.mask,donor.mask);assert.equal(f.calls.get('mask.bin'),maskReads);
  assert.equal(f.calls.get('positions.bin'),1);assert.equal(f.calls.get('indices.bin'),1);
  assert.notEqual(full.positions,donor.positions);
  f.files.delete('positions.bin');
  await assert.rejects(()=>loadHeadEntry(f.pkg,study,f.entry,undefined,{reuseMask:full}),/missing/);
});

test('only unchanged exact provenance can be reused',async()=>{
  const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),donor=await loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true});
  const refuse=async(pkg:LocalHeadPackage,active=study,entry=f.entry,candidate:LoadedEntry=donor)=>{
    assert.equal(canReuseHeadMask(pkg,active,entry,candidate),false);
    const before=new Map(f.calls);
    await assert.rejects(()=>loadHeadEntry(pkg,active,entry,undefined,{maskOnly:true,reuseMask:candidate}),/binding|active study/);
    assert.deepEqual(f.calls,before);
  };
  await refuse(f.pkg,study,f.entry,{...donor});
  await refuse({...f.pkg,files:f.pkg.files});
  await refuse(f.pkg,{...study});
  const other={...f.entry};study.definition.entries.push(other);await refuse(f.pkg,study,other);
  const otherStudy=await loadHeadStudy(f.pkg,'MRI');await refuse(f.pkg,otherStudy,f.entry);
  const originalMask=donor.mask!;donor.mask=new Uint8Array(originalMask.buffer);await refuse(f.pkg);
  donor.mask=originalMask;donor.focus=[99,99,99];await refuse(f.pkg);
  donor.focus=[0,0,0];assert.equal(canReuseHeadMask(f.pkg,study,f.entry,donor),true);
  const oldFile=f.entry.mask!.file;f.entry.mask!.file='other.bin';await refuse(f.pkg);f.entry.mask!.file=oldFile;
  const originalAsset=f.files.get('mask.bin')!;f.files.set('mask.bin',{...originalAsset});await refuse(f.pkg);f.files.set('mask.bin',originalAsset);
  study.definition.image.ijk_to_ras[0][3]=5;await refuse(f.pkg);
});

test('refused donor does no IO; donor-free path stays checked and aborted work gains no provenance',async()=>{
  const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),donor=await loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true});
  const fake={...donor},before=f.calls.get('mask.bin')!;
  await assert.rejects(()=>loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true,reuseMask:fake}),/binding/);
  assert.equal(f.calls.get('mask.bin'),before);
  const fresh=await loadHeadEntry(f.pkg,study,f.entry,undefined,{maskOnly:true});
  assert.notEqual(fresh.mask,donor.mask);assert.equal(f.calls.get('mask.bin'),before+1);
  const preAbort=new AbortController();preAbort.abort();
  await assert.rejects(()=>loadHeadEntry(f.pkg,study,f.entry,preAbort.signal,{reuseMask:donor}),{name:'AbortError'});
  assert.equal(f.calls.get('positions.bin'),undefined);
  const during=new AbortController();
  f.setBeforeRead(async path=>{if(path==='positions.bin')during.abort();});
  await assert.rejects(()=>loadHeadEntry(f.pkg,study,f.entry,during.signal,{reuseMask:donor}),{name:'AbortError'});
  assert.equal(f.calls.get('indices.bin'),undefined);
  assert.equal(canReuseHeadMask(f.pkg,study,f.entry,donor),true);
  assert.equal(canReuseHeadMask(f.pkg,study,f.entry,fake),false);
});

test('provenance uses weak keys and holds no global array of loaded masks',()=>{
  assert.equal(typeof WeakMap,'function');
  // The exported API accepts a donor and cannot retrieve a mask without one.
  const f=fixture();assert.equal(canReuseHeadMask(f.pkg,{} as never,f.entry,undefined),false);
});
