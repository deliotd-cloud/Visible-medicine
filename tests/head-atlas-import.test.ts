import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {openLocalHeadPackage,loadHeadStudy,loadHeadEntry,sampleIntensityRange,voxelCount,HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {createNativeVolumeGeometry,flattenKJI,maskCropIndexForIJK} from '../lib/head-atlas-geometry.mjs';
const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const affine=[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]];
function folderFile(path:string,bytes:Uint8Array|string){const file=new File([bytes as BlobPart],path.split('/').at(-1)!);Object.defineProperty(file,'webkitRelativePath',{value:`fixture/${path}`});return file;}
function fixture(){
  const image=new Uint8Array(new Float32Array(Array.from({length:24},(_,i)=>i-12)).buffer),mask=new Uint8Array([1,0]);
  const definition={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[2,3,4],ijk_to_ras:affine};
  const entry={id:'test.0',label:'Partial locator fixture',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[1,1,1],native_shape_kji:[2,3,4],ijk_to_ras:affine}};
  const entries=(length:number)=>Array.from({length},(_,i)=>({...entry,id:`test.${i}`}));
  const manifest={schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:definition,entries:entries(355)},MRI:{image:definition,entries:entries(117)}}};
  const encoded=JSON.stringify(manifest);return {manifest,image,mask,files:[folderFile('manifest.json',encoded),folderFile('image.bin',image),folderFile('mask.bin',mask)],pin:hash(encoded)};
}
test('checksum-bound folder imports exact native voxels and crop focus',async()=>{
  const f=fixture(),pkg=await openLocalHeadPackage(f.files,f.pin),study=await loadHeadStudy(pkg,'CT');
  assert.equal(study.data[0],-12);assert.equal(study.data[23],11);
  const selected=await loadHeadEntry(pkg,study,study.definition.entries[0]);
  assert.deepEqual([...selected.mask!],[1,0]);assert.deepEqual(selected.focus,[11,22,33]);
  assert.equal(maskCropIndexForIJK([1,1,1],{shape_kji:study.definition.entries[0].mask!.shape_kji,offset_kji:study.definition.entries[0].mask!.offset_kji!}),0);
  const controller=new AbortController();controller.abort();await assert.rejects(()=>loadHeadStudy(pkg,'CT',controller.signal),{name:'AbortError'});
  await assert.rejects(()=>loadHeadEntry(pkg,study,pkg.manifest.studies.MRI.entries[0]),/active study/);
});
test('wrong release, altered assets, paths and missing data are refused',async()=>{
  const f=fixture();await assert.rejects(()=>openLocalHeadPackage(f.files,'0'.repeat(64)),/selected approved release/);
  const pkg=await openLocalHeadPackage(f.files,f.pin);
  pkg.files.set('image.bin',folderFile('image.bin',new Uint8Array(f.image.length)));await assert.rejects(()=>loadHeadStudy(pkg,'CT'),/checksum mismatch/);
  pkg.files.delete('image.bin');await assert.rejects(()=>loadHeadStudy(pkg,'CT'),/missing/);
  for(const path of ['../evil.bin','a/../b.bin','C:/bad.bin','a\\b.bin'])await assert.rejects(()=>openLocalHeadPackage([...f.files,folderFile(path,'bad')],f.pin),/path/);
  await assert.rejects(()=>openLocalHeadPackage([...f.files,folderFile('IMAGE.bin','bad')],f.pin),/Duplicate/);
  await assert.rejects(()=>openLocalHeadPackage([new File(['{}'],'manifest.json'),new File(['a'],'image.bin')],f.pin),/folder/);
});
test('group mask-only loading verifies native masks without reading unused surface buffers',async()=>{
  const f=fixture(),pkg=await openLocalHeadPackage(f.files,f.pin),study=await loadHeadStudy(pkg,'CT');
  const entry=study.definition.entries[0];entry.mesh={positions_file:'missing-positions',indices_file:'missing-indices',positions_dtype:'float32',indices_dtype:'uint32',point_count:3,triangle_count:1,positions_sha256:'a'.repeat(64),indices_sha256:'b'.repeat(64)};
  const loaded=await loadHeadEntry(pkg,study,entry,undefined,{maskOnly:true});
  assert.deepEqual([...loaded.mask!],[1,0]);assert.equal(loaded.positions,undefined);
  pkg.files.set('mask.bin',folderFile('mask.bin',new Uint8Array([0,0])));
  await assert.rejects(()=>loadHeadEntry(pkg,study,entry,undefined,{maskOnly:true}),/checksum mismatch/);
});
test('unsupported metadata, mask geometry and nonbinary values fail closed',async()=>{
  for(const mutate of [(m:any)=>m.byte_order='big',(m:any)=>m.source_studies_are_distinct=false,(m:any)=>m.studies.CT.entries.pop(),(m:any)=>m.studies.CT.entries[0].opacity.fill=2]){
    const f=fixture();mutate(f.manifest);const encoded=JSON.stringify(f.manifest);
    await assert.rejects(()=>openLocalHeadPackage([folderFile('manifest.json',encoded),...f.files.slice(1)],hash(encoded)));
  }
  const f=fixture(),pkg=await openLocalHeadPackage(f.files,f.pin),study=await loadHeadStudy(pkg,'CT'),entry=study.definition.entries[0];
  entry.mask!.offset_kji=[9,0,0];await assert.rejects(()=>loadHeadEntry(pkg,study,entry),/grid/);
  entry.mask!.offset_kji=[1,1,1];entry.mask!.ijk_to_ras=affine.map(row=>[...row]);entry.mask!.ijk_to_ras[0][3]+=1;await assert.rejects(()=>loadHeadEntry(pkg,study,entry),/geometry binding/);
  entry.mask!.ijk_to_ras=affine;const nonbinary=new Uint8Array([2,0]);entry.mask!.sha256=hash(nonbinary);pkg.files.set('mask.bin',folderFile('mask.bin',nonbinary));await assert.rejects(()=>loadHeadEntry(pkg,study,entry),/binary/);
  for(const shape of [[0,1,1],[4097,1,1],[4096,4096,4096],[1.5,2,3]])assert.throws(()=>voxelCount(shape));
});
test('native oblique/permuted planes preserve exact index inverses and compound direction labels',()=>{
  const angle=28*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const g=createNativeVolumeGeometry({shape_kji:[5,4,3],ijk_to_ras:[[c,-s,0,10],[s,c,0,-20],[0,0,2,30],[0,0,0,1]]});
  assert.equal(g.oblique,true);assert.equal(g.views.axial.directionLabels.left,'RA');assert.equal(g.views.axial.directionLabels.top,'AL');
  for(const view of Object.values(g.views))for(let z=0;z<view.sliceCount;z++)for(let y=0;y<view.height;y++)for(let x=0;x<view.width;x++){
    const ijk=view.pixelToIJK(x,y,z);assert.deepEqual(view.pixelFromIJK(ijk),{x,y,slice:z});assert.ok(flattenKJI(ijk,g.shapeKJI)>=0);
    const back=g.rasToIjk(g.ijkToRas(ijk));back.forEach((v,i)=>assert.ok(Math.abs(v-ijk[i])<1e-10));
  }
  const p=createNativeVolumeGeometry({shape_kji:[7,5,3],ijk_to_ras:[[0,2,0,0],[0,0,3,0],[4,0,0,0],[0,0,0,1]]});assert.equal(p.views.axial.fixedAxisIJK,0);assert.deepEqual(p.views.axial.pixelToIJK(0,0,1),[1,4,6]);
  for(const angle of [36,44,45]){const r=angle*Math.PI/180;assert.throws(()=>createNativeVolumeGeometry({shape_kji:[2,2,2],ijk_to_ras:[[Math.cos(r),-Math.sin(r),0,0],[Math.sin(r),Math.cos(r),0,0],[0,0,1,0],[0,0,0,1]]}),/oblique/);}
  assert.throws(()=>createNativeVolumeGeometry({shape_kji:[2,2,2],ijk_to_ras:[[1,.1,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}),/sheared/);
});
test('automatic display range does not alias onto empty background columns',()=>{
  const data=Float32Array.from({length:131072},(_,i)=>i%16===0?0:1000);
  assert.deepEqual(sampleIntensityRange(data),[0,1000]);
  assert.deepEqual(sampleIntensityRange(data),sampleIntensityRange(data));
  assert.throws(()=>sampleIntensityRange(new Float32Array([NaN,Infinity])),/finite/);
  assert.deepEqual(sampleIntensityRange(new Float32Array([0,0])),[0,0]);
});
test('UI uses local Files only, preserves source limits and routes to both private head viewers',()=>{
  assert.match(HEAD_MANIFEST_SHA256,/^[a-f0-9]{64}$/);
  const importer=readFileSync(new URL('../lib/head-atlas-import.ts',import.meta.url),'utf8'),ui=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  for(const text of [importer,ui])assert.doesNotMatch(text,/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB|sendBeacon|createObjectURL/);
  for(const text of ['declared_scope','source.flags','geometry_alias_of','Native oblique','different subjects','nothing is uploaded'])assert.ok(ui.includes(text),text);
  assert.ok(ui.includes("const otherModality=modality==='CT'?'MRI':'CT'"));
  assert.ok(ui.includes('comparisonHref=headImageHref(otherModality,comparisonConcept,comparisonPosition,HEAD_MANIFEST_SHA256)'));
  assert.ok(ui.includes("<Link prefetch={false} href={comparisonHref??(otherModality==='CT'?'/atlas/ct-head':'/atlas/mri-head')}"));
  assert.doesNotMatch(ui,/setModality|useState\(initialModality\)/);
  assert.ok(readFileSync(new URL('../app/atlas/[slug]/page.tsx',import.meta.url),'utf8').includes('HeadAtlasViewer modality="CT"'));
  assert.ok(readFileSync(new URL('../app/atlas/mri-head/page.tsx',import.meta.url),'utf8').includes('HeadAtlasViewer modality="MRI"'));
});

test('folder guidance stays portable after migration and requests the complete browser package',()=>{
  const ui=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(ui,/choose the complete <strong>browser-data-verified<\/strong> folder/i);
  assert.match(ui,/not individual files or CT\/MRI source subfolders/);
  assert.doesNotMatch(ui,/folder on [CDEFG]:/);
  assert.match(ui,/type="file" multiple/);
  assert.match(ui,/webkitdirectory/);
});
