import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {
  openRegionalMriPackage,openLocalRegionalMriPackage,loadRegionalMriSeries,
  loadRegionalMriAnnotation,regionalMaskAtImageIJK,assertRegionalMriPackageOwnership,
  type RegionalMriManifest,type RegionalAsset,
} from '../lib/regional-mri-package.ts';

const enc=new TextEncoder();
const copy=(bytes:ArrayBuffer)=>bytes.slice(0);
const bytes=(value:Uint8Array|Uint16Array|Float32Array)=>copy(value.buffer as ArrayBuffer);
const sha=async(value:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',value)),n=>n.toString(16).padStart(2,'0')).join('');
const asset=(value:ArrayBuffer):RegionalAsset=>({size:value.byteLength,async arrayBuffer(){return copy(value);}});
const clone=<T>(value:T):T=>structuredClone(value);

type Fixture={manifest:RegionalMriManifest;manifestBytes:ArrayBuffer;revision:string;files:Map<string,RegionalAsset>;raw:Map<string,ArrayBuffer>};
async function fixture():Promise<Fixture>{
  // Distinct image sequences: unequal K/J/I shapes, one native RAS grid and one
  // axis-permuted grid. These synthetic numbers are not patient data.
  const native={shape_kji:[2,3,4],ijk_to_ras:[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]]};
  const permuted={shape_kji:[3,2,4],ijk_to_ras:[[0,0,2,100],[1,0,0,200],[0,3,0,300],[0,0,0,1]]};
  // The mask's source-RAS grid is intentionally offset by 0.4 mm along world R.
  const derived={shape_kji:[3,2,4],ijk_to_ras:[[0,0,2,100.4],[1,0,0,200],[0,3,0,300],[0,0,0,1]]};
  const raw=new Map<string,ArrayBuffer>([
    ['seq-a/image.raw',bytes(new Uint16Array(Array.from({length:24},(_,i)=>i*3)))],
    ['seq-a/native-mask.raw',bytes(new Uint8Array([1,0,0,1]))],
    ['seq-b/image.raw',bytes(new Float32Array(Array.from({length:24},(_,i)=>i/2)))],
    ['seq-b/derived-mask.raw',bytes(new Uint8Array([1,0,0,1]))],
  ]);
  const h=async(path:string)=>sha(raw.get(path)!);
  const ah=await h('seq-a/image.raw'),bh=await h('seq-b/image.raw');
  const manifest:RegionalMriManifest={
    schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',
    region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',
    registration:'none',release:'local-private-draft',series:[
      {id:'sequence-a',label:'Synthetic integer sequence',image:{...native,file:'seq-a/image.raw',sha256:ah,dtype:'uint16'},annotations:[
        {id:'native-a',anatomyId:'test:left-region',label:'Native crop',seriesId:'sequence-a',sourceImageSha256:ah,
          laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'a'.repeat(64),scope:'Synthetic scoped source'},
          geometry:{kind:'mask',file:'seq-a/native-mask.raw',sha256:await h('seq-a/native-mask.raw'),shape_kji:[1,2,2],offset_kji:[1,1,1],grid:native,gridKind:'source-native',mappingRevision:'b'.repeat(64)}},
        {id:'point-a',anatomyId:'test:point',label:'Point marker',seriesId:'sequence-a',sourceImageSha256:ah,
          laterality:'midline',coverage:'not-assessed',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic point'},
          geometry:{kind:'points',points_ras_mm:[[11,22,33]]}},
        {id:'deferred-a',anatomyId:'test:deferred',label:'Deferred',seriesId:'sequence-a',sourceImageSha256:ah,
          laterality:'left',coverage:'not-assessed',review:{status:'deferred',revision:'d'.repeat(64),scope:'No geometry accepted'},geometry:{kind:'none'}},
      ]},
      {id:'sequence-b',label:'Synthetic float sequence',image:{...permuted,file:'seq-b/image.raw',sha256:bh,dtype:'float32'},annotations:[
        {id:'derived-b',anatomyId:'test:right-region',label:'Derived crop',seriesId:'sequence-b',sourceImageSha256:bh,
          laterality:'right',coverage:'partial',review:{status:'provisional',revision:'e'.repeat(64),scope:'Inspection only'},
          geometry:{kind:'mask',file:'seq-b/derived-mask.raw',sha256:await h('seq-b/derived-mask.raw'),shape_kji:[1,2,2],offset_kji:[1,0,1],grid:derived,gridKind:'derived-source-ras',mappingRevision:'f'.repeat(64)}},
        {id:'curve-b',anatomyId:'test:curve',label:'Curve marker',seriesId:'sequence-b',sourceImageSha256:bh,
          laterality:'right',coverage:'not-assessed',review:{status:'accepted-scoped',revision:'1'.repeat(64),scope:'Synthetic curve'},
          geometry:{kind:'curve',points_ras_mm:[[100,200,300],[102,201,303]]}},
      ]},
    ],
  };
  return pack(manifest,raw);
}
async function pack(manifest:RegionalMriManifest,raw:Map<string,ArrayBuffer>):Promise<Fixture>{
  const manifestBytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer;
  const revision=await sha(manifestBytes),files=new Map<string,RegionalAsset>();
  files.set('manifest.json',asset(manifestBytes));
  for(const[path,value]of raw)files.set(path,asset(value));
  return {manifest,manifestBytes,revision,files,raw};
}
async function modified(change:(manifest:RegionalMriManifest)=>void){const f=await fixture(),manifest=clone(f.manifest);change(manifest);return pack(manifest,f.raw);}
const open=(f:Fixture,signal?:AbortSignal)=>openRegionalMriPackage(f.manifestBytes,f.files,f.revision,signal);
const rejected=async(promise:Promise<unknown>,pattern:RegExp)=>assert.rejects(promise,pattern);

test('independently pinned manifest and two distinct, detached, frozen sequences load',async()=>{
  const f=await fixture(),pkg=await open(f);
  assert.equal(pkg.revision,await sha(f.manifestBytes));
  assert.notStrictEqual(pkg.manifest,f.manifest);
  assert(Object.isFrozen(pkg.manifest));assert(Object.isFrozen(pkg.manifest.series[0].annotations[0].geometry));
  f.manifest.series[0].label='Changed external object';
  assert.equal(pkg.manifest.series[0].label,'Synthetic integer sequence');
  const a=await loadRegionalMriSeries(pkg,'sequence-a'),b=await loadRegionalMriSeries(pkg,'sequence-b');
  assert(a.data instanceof Uint16Array);assert(b.data instanceof Float32Array);
  assert.deepEqual(a.range,[0,69]);assert.deepEqual(b.range,[0,11.5]);
  assert.deepEqual(a.geometry.ijkToRas([1,1,1]),[11,22,33]);
  assert.deepEqual(b.geometry.ijkToRas([1,0,1]),[102,201,300]);
  assert.notEqual(a.geometry.views.axial.fixedAxisIJK,b.geometry.views.axial.fixedAxisIJK);
});

test('native crop retains KJI offset and first occupied voxel focus',async()=>{
  const pkg=await open(await fixture()),study=await loadRegionalMriSeries(pkg,'sequence-a');
  const overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
  assert.equal(overlay.purpose,'scoped-display');assert.deepEqual(overlay.focus,[11,22,33]);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[1,1,1]),1);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[2,1,1]),0);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[1,2,1]),0);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[0,1,1]),null);
  await rejected(Promise.resolve().then(()=>regionalMaskAtImageIJK(study,overlay,[4,1,1])),/outside the native grid/);
});

test('derived RAS grid stays separate and lookup rounds only within source sequence',async()=>{
  const pkg=await open(await fixture()),study=await loadRegionalMriSeries(pkg,'sequence-b');
  const ann=study.series.annotations[0];
  await rejected(loadRegionalMriAnnotation(pkg,study,ann),/Provisional annotation/);
  const overlay=await loadRegionalMriAnnotation(pkg,study,ann,undefined,{inspectProvisional:true});
  assert.equal(overlay.purpose,'provisional-inspection');
  assert.equal(overlay.annotation.geometry.kind,'mask');
  assert.deepEqual(overlay.focus,[102.4,201,300]);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[1,0,1]),1);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[2,0,1]),0);
  assert.equal(regionalMaskAtImageIJK(study,overlay,[0,0,0]),null);
});

test('points and curves retain source RAS focus, while deferred/none cannot display',async()=>{
  const pkg=await open(await fixture()),a=await loadRegionalMriSeries(pkg,'sequence-a'),b=await loadRegionalMriSeries(pkg,'sequence-b');
  const point=await loadRegionalMriAnnotation(pkg,a,a.series.annotations[1]);
  const curve=await loadRegionalMriAnnotation(pkg,b,b.series.annotations[1]);
  assert.deepEqual(point.focus,[11,22,33]);assert.deepEqual(curve.focus,[100,200,300]);
  assert.equal(point.mask,undefined);assert.equal(curve.mask,undefined);
  await rejected(loadRegionalMriAnnotation(pkg,a,a.series.annotations[2]),/No display geometry/);
  await rejected(Promise.resolve().then(()=>regionalMaskAtImageIJK(a,point,[1,1,1])),/not owned/);
});

test('manifest checksum, mapped bytes and exact local folder are independently pinned',async()=>{
  const f=await fixture();
  await rejected(openRegionalMriPackage(f.manifestBytes,f.files,'0'.repeat(64)),/revision mismatch/);
  const wrong=new Map(f.files);wrong.set('manifest.json',asset(enc.encode('{}').buffer as ArrayBuffer));
  await rejected(openRegionalMriPackage(f.manifestBytes,wrong,f.revision),/Manifest size mismatch|Mapped manifest differs/);
  const sameSize=enc.encode(JSON.stringify(f.manifest).replace('Synthetic integer sequence','Synthetic integer sequencE')).buffer as ArrayBuffer;
  assert.equal(sameSize.byteLength,f.manifestBytes.byteLength);
  wrong.set('manifest.json',asset(sameSize));
  await rejected(openRegionalMriPackage(f.manifestBytes,wrong,f.revision),/Mapped manifest differs/);
  const local=[...f.files].map(([name,value])=>({...value,webkitRelativePath:`one-folder/${name}`}));
  assert.equal((await openLocalRegionalMriPackage(local as File[],f.revision)).revision,f.revision);
  local[1].webkitRelativePath=`other-folder/${[...f.files.keys()][1]}`;
  await rejected(openLocalRegionalMriPackage(local as File[],f.revision),/different folders/);
});

test('manifest schema, endian and unknown fields fail closed',async()=>{
  for(const change of [
    (m:RegionalMriManifest)=>{(m as any).schema='visible-medicine.regional-mri/2';},
    (m:RegionalMriManifest)=>{m.byteOrder='big' as any;},
    (m:RegionalMriManifest)=>{(m as any).unexpected=true;},
    (m:RegionalMriManifest)=>{(m.series[0].image as any).unexpected=true;},
    (m:RegionalMriManifest)=>{(m.series[0].annotations[0].review as any).unexpected=true;},
  ]){const f=await modified(change);await rejected(open(f),/Unsupported|regional MRI package/);}
});

test('identities, laterality, annotation source and counts reject invalid manifests',async()=>{
  const changes:Array<(m:RegionalMriManifest)=>void>=[
    m=>{m.series[1].id=m.series[0].id;},
    m=>{m.series[0].annotations[1].id=m.series[0].annotations[0].id;},
    m=>{m.series[0].annotations[0].id='../escape';},
    m=>{m.series[0].annotations[0].seriesId='sequence-b';},
    m=>{m.series[0].annotations[0].sourceImageSha256=m.series[1].image.sha256;},
    m=>{m.laterality='left';},
    m=>{m.series=[];},
    m=>{m.series[0].annotations=Array(5001).fill(m.series[0].annotations[0]);},
  ];
  for(const change of changes){const f=await modified(change);await rejected(open(f),/Duplicate|Invalid|different source|Unsupported/);}
});

test('grid shape, shear, obliquity and native mismatch are rejected',async()=>{
  const changes:Array<(m:RegionalMriManifest)=>void>=[
    m=>{m.series[0].image.shape_kji=[2,0,4];},
    m=>{m.series[0].image.ijk_to_ras[0][1]=0.2;},
    m=>{m.series[0].image.ijk_to_ras[0][0]=0.7;m.series[0].image.ijk_to_ras[1][0]=0.7;m.series[0].image.ijk_to_ras[0][1]=-1.4;m.series[0].image.ijk_to_ras[1][1]=1.4;},
    m=>{const g=m.series[0].annotations[0].geometry;if(g.kind==='mask'){g.grid=clone(g.grid);g.grid.ijk_to_ras[0][3]++;}},
  ];
  for(const change of changes){const f=await modified(change);await rejected(open(f),/dimensions|sheared|oblique|ambiguous|grid differ/);}
});

test('crop, markup and deferred status reject invalid geometry',async()=>{
  const changes:Array<(m:RegionalMriManifest)=>void>=[
    m=>{const g=m.series[0].annotations[0].geometry;if(g.kind==='mask')g.offset_kji=[1,2,3];},
    m=>{const g=m.series[0].annotations[1].geometry;if(g.kind==='points')g.points_ras_mm=[[Infinity,0,0]];},
    m=>{m.series[0].annotations[2].geometry={kind:'points',points_ras_mm:[[0,0,0]]};},
    m=>{const g=m.series[1].annotations[1].geometry;if(g.kind==='curve')g.points_ras_mm=[[0,0,0]];},
  ];
  for(const change of changes){const f=await modified(change);await rejected(open(f),/crop|markup|Deferred/);}
});

test('paths reject traversal, case collisions, reserved names and duplicate asset identity',async()=>{
  const changes:Array<(m:RegionalMriManifest)=>void>=[
    m=>{m.series[0].image.file='../escape.raw';},
    m=>{m.series[0].image.file='seq-a/CON.raw';},
    m=>{m.series[0].annotations[0].geometry.kind==='mask'&&(m.series[0].annotations[0].geometry.file='seq-a/image.raw');},
  ];
  for(const change of changes){const f=await modified(change);await rejected(open(f),/Unsafe|Duplicate/);}
  const f=await fixture(),extra=new Map(f.files);extra.set('seq-a/IMAGE.raw',asset(new ArrayBuffer(2)));
  await rejected(openRegionalMriPackage(f.manifestBytes,extra,f.revision),/Duplicate package path/);
});

test('missing, extra, wrong-size and altered assets fail at the appropriate boundary',async()=>{
  const f=await fixture();
  const missing=new Map(f.files);missing.delete('seq-a/native-mask.raw');
  await rejected(openRegionalMriPackage(f.manifestBytes,missing,f.revision),/missing/);
  const extra=new Map(f.files);extra.set('stray.raw',asset(new ArrayBuffer(1)));
  await rejected(openRegionalMriPackage(f.manifestBytes,extra,f.revision),/extra/);
  const small=new Map(f.files);small.set('seq-a/image.raw',asset(new ArrayBuffer(1)));
  await rejected(openRegionalMriPackage(f.manifestBytes,small,f.revision),/wrong-size/);
  const altered=new Map(f.files),changed=copy(f.raw.get('seq-a/image.raw')!);new Uint8Array(changed)[0]^=1;
  altered.set('seq-a/image.raw',asset(changed));
  const pkg=await openRegionalMriPackage(f.manifestBytes,altered,f.revision);
  await rejected(loadRegionalMriSeries(pkg,'sequence-a'),/checksum mismatch/);
  const alteredMask=new Map(f.files),badMask=copy(f.raw.get('seq-a/native-mask.raw')!);new Uint8Array(badMask)[0]^=1;
  alteredMask.set('seq-a/native-mask.raw',asset(badMask));
  const pkg2=await openRegionalMriPackage(f.manifestBytes,alteredMask,f.revision),study=await loadRegionalMriSeries(pkg2,'sequence-a');
  await rejected(loadRegionalMriAnnotation(pkg2,study,study.series.annotations[0]),/checksum mismatch/);
});

test('finite scalar and binary mask checks reject independently hashed corrupt content',async()=>{
  const f=await fixture(),raw=new Map(f.raw),image=copy(raw.get('seq-b/image.raw')!);
  new Float32Array(image)[0]=NaN;raw.set('seq-b/image.raw',image);
  const manifest=clone(f.manifest);manifest.series[1].image.sha256=await sha(image);
  for(const annotation of manifest.series[1].annotations)annotation.sourceImageSha256=manifest.series[1].image.sha256;
  const corrupt=await pack(manifest,raw),pkg=await open(corrupt);
  await rejected(loadRegionalMriSeries(pkg,'sequence-b'),/nonfinite/);
  const raw2=new Map(f.raw),mask=copy(raw2.get('seq-a/native-mask.raw')!);
  new Uint8Array(mask)[0]=2;raw2.set('seq-a/native-mask.raw',mask);
  const m2=clone(f.manifest),g=m2.series[0].annotations[0].geometry;
  if(g.kind==='mask')g.sha256=await sha(mask);
  const binary=await pack(m2,raw2),pkg2=await open(binary),study=await loadRegionalMriSeries(pkg2,'sequence-a');
  await rejected(loadRegionalMriAnnotation(pkg2,study,study.series.annotations[0]),/nonbinary/);
});

test('private ownership rejects forged/cross-package studies and annotations',async()=>{
  const one=await open(await fixture()),two=await open(await fixture());
  const a=await loadRegionalMriSeries(one,'sequence-a'),b=await loadRegionalMriSeries(one,'sequence-b');
  await rejected(loadRegionalMriSeries({...one},'sequence-a'),/Unknown regional package/);
  await rejected(loadRegionalMriSeries(one,'missing'),/Unknown MRI sequence/);
  await rejected(loadRegionalMriAnnotation(two,a,a.series.annotations[0]),/not owned/);
  await rejected(loadRegionalMriAnnotation(one,b,a.series.annotations[0]),/not owned/);
  await rejected(loadRegionalMriAnnotation(one,{...a},a.series.annotations[0]),/not owned/);
  await rejected(loadRegionalMriAnnotation(one,a,clone(a.series.annotations[0])),/not owned/);
  const overlay=await loadRegionalMriAnnotation(one,a,a.series.annotations[0]);
  await rejected(Promise.resolve().then(()=>regionalMaskAtImageIJK(b,overlay,[1,1,1])),/not owned/);
  await rejected(Promise.resolve().then(()=>regionalMaskAtImageIJK(a,{...overlay},[1,1,1])),/not owned/);
  overlay.mask![0]=0;
  assert.equal(regionalMaskAtImageIJK(a,overlay,[1,1,1]),1,'public clone cannot mutate private verified mask');
});

test('abort is honored before open, after read, and while scanning long payload',async()=>{
  const f=await fixture(),stopped=new AbortController();stopped.abort();
  await rejected(open(f,stopped.signal),/AbortError|cancelled/);
  const pkg=await open(f),readStop=new AbortController(),files=new Map(f.files);
  files.set('seq-a/image.raw',{size:f.raw.get('seq-a/image.raw')!.byteLength,async arrayBuffer(){readStop.abort();return copy(f.raw.get('seq-a/image.raw')!);}});
  const mid=await openRegionalMriPackage(f.manifestBytes,files,f.revision);
  await rejected(loadRegionalMriSeries(mid,'sequence-a',readStop.signal),/AbortError|cancelled/);
  await rejected(loadRegionalMriSeries(pkg,'sequence-a',stopped.signal),/AbortError|cancelled/);
  // A fresh, valid large uint8 volume yields to the event loop during scan.
  const big=await fixture(),raw=new Map(big.raw),data=new Uint8Array(600000);raw.set('seq-a/image.raw',bytes(data));
  const manifest=clone(big.manifest);manifest.series[0].image.dtype='uint8';manifest.series[0].image.shape_kji=[60,100,100];
  manifest.series[0].image.sha256=await sha(raw.get('seq-a/image.raw')!);
  for(const annotation of manifest.series[0].annotations)annotation.sourceImageSha256=manifest.series[0].image.sha256;
  const g=manifest.series[0].annotations[0].geometry;
  if(g.kind==='mask'){g.grid.shape_kji=[60,100,100];g.offset_kji=[1,1,1];g.shape_kji=[1,2,2];}
  const long=await pack(manifest,raw),longPkg=await open(long),during=new AbortController();
  setTimeout(()=>during.abort(),0);
  await rejected(loadRegionalMriSeries(longPkg,'sequence-a',during.signal),/AbortError|cancelled/);
});

test('all eight declared scalar layouts preserve exact values and native range',async()=>{
  const constructors={uint8:Uint8Array,int8:Int8Array,uint16:Uint16Array,int16:Int16Array,uint32:Uint32Array,int32:Int32Array,float32:Float32Array,float64:Float64Array};
  for(const[dtype,Constructor]of Object.entries(constructors)){
    const f=await fixture(),raw=new Map(f.raw),manifest=clone(f.manifest);
    const signed=dtype.startsWith('int')||dtype.startsWith('float');
    const values=new Constructor(Array.from({length:24},(_,i)=>i-(signed?12:0)));
    const image=copy(values.buffer as ArrayBuffer);raw.set('seq-a/image.raw',image);
    manifest.series[0].image.dtype=dtype as any;manifest.series[0].image.sha256=await sha(image);
    for(const entry of manifest.series[0].annotations)entry.sourceImageSha256=manifest.series[0].image.sha256;
    const f2=await pack(manifest,raw),study=await loadRegionalMriSeries(await open(f2),'sequence-a');
    assert(study.data instanceof Constructor,dtype);assert.deepEqual([...study.data],[...values],dtype);
    assert.deepEqual(study.range,[signed?-12:0,signed?11:23],dtype);
  }
});

test('scope enums, native limits and unsupported transforms are never inferred',async()=>{
  for(const change of [
    (m:RegionalMriManifest)=>{m.series[0].image.dtype='float128' as any;},
    (m:RegionalMriManifest)=>{m.region='unknown';},
    (m:RegionalMriManifest)=>{m.registration='registered' as any;},
    (m:RegionalMriManifest)=>{m.release='approved-public' as any;},
    (m:RegionalMriManifest)=>{m.series[0].annotations[0].review.status='approved' as any;},
    (m:RegionalMriManifest)=>{m.series[0].annotations[0].coverage='whole-anatomy' as any;},
    (m:RegionalMriManifest)=>{m.series[0].image.shape_kji=[4097,1,1];},
    (m:RegionalMriManifest)=>{m.series[0].image.shape_kji=[4096,4096,4096];},
    (m:RegionalMriManifest)=>{m.series[0].image.ijk_to_ras[3][0]=1;},
    (m:RegionalMriManifest)=>{m.series[0].image.ijk_to_ras[0][0]=0;},
    (m:RegionalMriManifest)=>{m.series[0].image.ijk_to_ras[0][3]=100001;},
    (m:RegionalMriManifest)=>{const g=m.series[0].annotations[0].geometry;if(g.kind==='mask')g.mappingRevision='';},
  ])await assert.rejects(open(await modified(change)));
  const f=await fixture();
  await assert.rejects(openRegionalMriPackage(new ArrayBuffer(8388609),f.files,f.revision),/manifest size/);
});

test('asset handles cannot evade actual byte length, and empty masks do not invent focus',async()=>{
  const f=await fixture(),files=new Map(f.files),image=f.raw.get('seq-a/image.raw')!;
  files.set('seq-a/image.raw',{size:image.byteLength,async arrayBuffer(){return new ArrayBuffer(image.byteLength-1);}});
  const pkg=await openRegionalMriPackage(f.manifestBytes,files,f.revision);
  await assert.rejects(loadRegionalMriSeries(pkg,'sequence-a'),/byte count/);
  const raw=new Map(f.raw),manifest=clone(f.manifest),empty=new Uint8Array(4).buffer;
  raw.set('seq-a/native-mask.raw',empty);
  const geometry=manifest.series[0].annotations[0].geometry;if(geometry.kind==='mask')geometry.sha256=await sha(empty);
  const f2=await pack(manifest,raw),pkg2=await open(f2),study=await loadRegionalMriSeries(pkg2,'sequence-a');
  const overlay=await loadRegionalMriAnnotation(pkg2,study,study.series.annotations[0]);
  assert.equal(overlay.focus,undefined);assert.equal(regionalMaskAtImageIJK(study,overlay,[1,1,1]),0);
});

test('long scalar scans cancel at an observed chunk yield, not merely before hashing',async()=>{
  const f=await fixture(),raw=new Map(f.raw),manifest=clone(f.manifest),image=new Uint8Array(600000).buffer;
  raw.set('seq-a/image.raw',image);manifest.series[0].image.dtype='uint8';manifest.series[0].image.shape_kji=[60,100,100];
  manifest.series[0].image.sha256=await sha(image);
  for(const entry of manifest.series[0].annotations)entry.sourceImageSha256=manifest.series[0].image.sha256;
  const g=manifest.series[0].annotations[0].geometry;if(g.kind==='mask')g.grid.shape_kji=[60,100,100];
  const pkg=await open(await pack(manifest,raw)),controller=new AbortController();
  const original=globalThis.setTimeout;let yields=0;
  globalThis.setTimeout=((callback:(...args:any[])=>void,ms?:number,...args:any[])=>{
    yields++;controller.abort();return original(callback,ms,...args);
  }) as typeof setTimeout;
  try{await assert.rejects(loadRegionalMriSeries(pkg,'sequence-a',controller.signal),{name:'AbortError'});}
  finally{globalThis.setTimeout=original;}
  assert(yields>0,'Cancellation was triggered by the loader scan yielding after its first chunk.');
});

test('private package foundation has no upload, persistence, server or clinical PACS side effect',()=>{
  const source=readFileSync(new URL('../lib/regional-mri-package.ts',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|sendBeacon|postMessage|createObjectURL)\s*\(|\b(?:localStorage|sessionStorage|indexedDB|node:fs)\b/);
  assert.match(source,/expectedRevision must come from a separately checked source handoff/);
  assert.match(source,/registration!=='none'/);assert.match(source,/release!=='local-private-draft'/);
});

test('cross-product ownership retains the exact verified package, sequence and overlay',async()=>{
 const f=await fixture(),a=await open(f),b=await open(f),study=await loadRegionalMriSeries(a,'sequence-a');
 const overlay=await loadRegionalMriAnnotation(a,study,study.series.annotations[0]);
 assert.doesNotThrow(()=>assertRegionalMriPackageOwnership(a,study,overlay));
 for(const tuple of [[b,study,overlay],[{...a},study,overlay],[a,{...study},overlay],[a,study,{...overlay}]] as const)
  assert.throws(()=>assertRegionalMriPackageOwnership(...tuple as [any,any,any]),/owned|verified|mismatch|belong/);
});
