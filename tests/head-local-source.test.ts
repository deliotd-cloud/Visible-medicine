import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openHeadPackageFromLocalSource} from '../lib/head-local-source.ts';
import {loadHeadEntry,loadHeadStudy,openLocalHeadPackage} from '../lib/head-atlas-import.ts';

const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const affine=[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]];
const origin='http://127.0.0.1:3000';
function fixture(){
  const image=new Uint8Array(new Float32Array(Array.from({length:24},(_,i)=>i-12)).buffer),mask=new Uint8Array([1,0]);
  const asset={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[2,3,4],ijk_to_ras:affine};
  const entry={id:'test',label:'Fixture',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[1,1,1],native_shape_kji:[2,3,4],ijk_to_ras:affine}};
  const entries=(n:number)=>Array.from({length:n},(_,i)=>({...entry,id:`test.${i}`}));
  const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:asset,entries:entries(355)},MRI:{image:asset,entries:entries(117)}}});
  return {manifest,image,mask,pin:hash(manifest)};
}
function response(bytes:Uint8Array|string,status=200,headers:Record<string,string>={'x-visible-medicine-local':'1'}){
  return new Response(bytes as BodyInit,{status,headers});
}
function source(f:ReturnType<typeof fixture>,calls:string[],overrides:Record<string,()=>Response|Promise<Response>>={}){
  return (async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=String(input);calls.push(url);
    assert.equal(init?.credentials,'same-origin');assert.equal(init?.mode,'same-origin');assert.equal(init?.redirect,'error');assert.equal(init?.cache,'no-store');
    assert.equal(new Headers(init?.headers).get('X-Visible-Medicine-Local'),'1');
    const path=new URL(url).pathname,asset=new URL(url).searchParams.get('path');
    if(overrides[path+(asset??'')])return overrides[path+(asset??'')]();
    if(path.endsWith('/manifest.json'))return response(f.manifest);
    if(asset==='image.bin')return response(f.image);
    if(asset==='mask.bin')return response(f.mask);
    return response('',404,{});
  }) as typeof fetch;
}
function folderFile(path:string,bytes:Uint8Array|string){const file=new File([bytes as BlobPart],path);Object.defineProperty(file,'webkitRelativePath',{value:`fixture/${path}`});return file;}

test('unconfigured 404 is quiet and a wrong release hash refuses before asset requests',async()=>{
  const f=fixture(),calls:string[]=[];
  assert.equal(await openHeadPackageFromLocalSource(source(f,calls,{'/__vm-local-head/manifest.json':()=>response('',404,{})}),origin,f.pin),null);
  assert.equal(calls.length,1);
  calls.length=0;
  await assert.rejects(()=>openHeadPackageFromLocalSource(source(f,calls),origin,'0'.repeat(64)),/selected approved release/);
  assert.equal(calls.length,1);
});
test('verified manifest makes lazy assets; existing loaders verify their bytes',async()=>{
  const f=fixture(),calls:string[]=[],pkg=await openHeadPackageFromLocalSource(source(f,calls),origin,f.pin);
  assert.ok(pkg);assert.equal(calls.length,1);
  const study=await loadHeadStudy(pkg,'CT');assert.equal(study.data[0],-12);
  assert.equal(calls.length,2);assert.match(calls[1],/asset\?path=image.bin$/);
  const loaded=await loadHeadEntry(pkg,study,study.definition.entries[0]);assert.deepEqual([...loaded.mask!],[1,0]);assert.equal(calls.length,3);
  const corrupt=await openHeadPackageFromLocalSource(source(f,[],{'/__vm-local-head/assetimage.bin':()=>response(new Uint8Array(f.image.length))}),origin,f.pin);
  assert.ok(corrupt);await assert.rejects(()=>loadHeadStudy(corrupt,'CT'),/checksum mismatch/);
});
test('oversized stream is stopped without trusting content length, and abort reaches fetch',async()=>{
  const f=fixture(),calls:string[]=[];
  const oversized=await openHeadPackageFromLocalSource(source(f,calls,{'/__vm-local-head/assetimage.bin':()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(f.image.length+1));controller.close();}}),{headers:{'x-visible-medicine-local':'1'}})}),origin,f.pin);
  assert.ok(oversized);await assert.rejects(()=>loadHeadStudy(oversized,'CT'),/too large/);
  let fetchSignal:AbortSignal|undefined,started!:()=>void;const reading=new Promise<void>(resolve=>{started=resolve;});
  const backing=source(f,[],{'/__vm-local-head/assetimage.bin':()=>new Response(new ReadableStream({pull(){started();return new Promise(()=>{});}}),{headers:{'x-visible-medicine-local':'1'}})});
  const observing=((input:RequestInfo|URL,init?:RequestInit)=>{if(String(input).includes('/asset?'))fetchSignal=init?.signal??undefined;return backing(input,init);}) as typeof fetch;
  const pending=await openHeadPackageFromLocalSource(observing,origin,f.pin);
  assert.ok(pending);const controller=new AbortController();const load=loadHeadStudy(pending,'CT',controller.signal);await reading;controller.abort();
  await assert.rejects(load,{name:'AbortError'});assert.equal(fetchSignal?.aborted,true);
});
test('a cancelled configured package stays dead, while reopening the exact release gives a fresh lazy asset source',async()=>{
  const f=fixture(),calls:string[]=[],fetcher=source(f,calls);
  const firstController=new AbortController();
  const first=await openHeadPackageFromLocalSource(fetcher,origin,f.pin,firstController.signal);
  assert.ok(first);assert.equal(first.source,'configured-local');
  firstController.abort();
  await assert.rejects(()=>loadHeadStudy(first,'CT'),{name:'AbortError'});
  assert.equal(calls.length,1,'the dead package must not request an asset');

  const secondController=new AbortController();
  const reopened=await openHeadPackageFromLocalSource(fetcher,origin,f.pin,secondController.signal);
  assert.ok(reopened);assert.notEqual(reopened,first);
  assert.equal((await loadHeadStudy(reopened,'CT')).data[0],-12);
  assert.equal(calls.length,3,'a fresh manifest and native image are fetched');
  await assert.rejects(()=>loadHeadStudy(first,'MRI'),{name:'AbortError'});
  assert.equal(calls.length,3,'the stale package cannot resume after a fresh open');

  secondController.abort();
  await assert.rejects(()=>loadHeadStudy(reopened,'MRI'),{name:'AbortError'});
  const beforeWrongRelease=calls.length;
  await assert.rejects(()=>openHeadPackageFromLocalSource(fetcher,origin,'0'.repeat(64)),/selected approved release/);
  assert.equal(calls.length,beforeWrongRelease+1,'a changed release is refused at the manifest');
});
test('folder File import stays compatible with the shared validated package',async()=>{
  const f=fixture(),pkg=await openLocalHeadPackage([folderFile('manifest.json',f.manifest),folderFile('image.bin',f.image),folderFile('mask.bin',f.mask)],f.pin);
  assert.equal((await loadHeadStudy(pkg,'MRI')).data[23],11);
});
