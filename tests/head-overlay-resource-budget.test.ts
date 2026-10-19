import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {loadHeadEntry,loadHeadStudy,type HeadEntry,type HeadPackageAsset,type LocalHeadPackage} from '../lib/head-atlas-import.ts';
import {headOverlayBytes,HEAD_OVERLAY_BYTE_LIMIT,visibleHeadOverlays} from '../lib/head-atlas-overlays.ts';
import {loadHeadOverlayMasks} from '../lib/head-overlay-loading.ts';
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function fixture(){
 const calls:string[]=[],image=new Uint8Array(new Float32Array(8).buffer),data=new Uint8Array([1,0]);
 let readHook:((name:string)=>void|Promise<void>)|null=null;
 const files=new Map<string,HeadPackageAsset>();
 for(const [name,bytes]of [['image',image],['a',data],['b',data],['c',data]] as const)files.set(name,{size:bytes.byteLength,async arrayBuffer(){calls.push(name);await readHook?.(name);return bytes.slice().buffer;}});
 const entries=['a','b','c'].map((id):HeadEntry=>({id,label:id,family:'bst',representation:'mask',color:[1,0,0],opacity:{fill:.3,outline:1},mask:{file:id,sha256:sha(data),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}}));
 const definition={image:{file:'image',sha256:sha(image),dtype:'float32',shape_kji:[2,2,2],ijk_to_ras:affine},entries};
 const pkg={manifest:{studies:{CT:definition,MRI:definition}},files} as unknown as LocalHeadPackage;
 return{pkg,entries,calls,hook:(value:typeof readHook)=>{readHook=value;}};
}
test('group plus external selected mask is refused before any group IO at the allocation-free boundary',async()=>{
 const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),selected=await loadHeadEntry(f.pkg,study,f.entries[2],undefined,{maskOnly:true});
 const large=f.entries.slice(0,2).map(entry=>({...entry,mask:{...entry.mask!,shape_kji:[128,1024,1024]}}));study.definition.entries.push(...large);
 assert.equal(headOverlayBytes(large),HEAD_OVERLAY_BYTE_LIMIT);assert.equal(headOverlayBytes([...large,selected.entry]),HEAD_OVERLAY_BYTE_LIMIT+2);
 const before=[...f.calls];await assert.rejects(()=>loadHeadOverlayMasks(f.pkg,study,large,selected),/selected structure exceed/);assert.deepEqual(f.calls,before);
 assert.deepEqual(visibleHeadOverlays(large.map(entry=>({entry})),new Set(),selected),[selected]);
});
test('selected mask inside a group shares its verified buffer and does not read it twice',async()=>{
 const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),selected=await loadHeadEntry(f.pkg,study,f.entries[0],undefined,{maskOnly:true});
 const loaded=await loadHeadOverlayMasks(f.pkg,study,f.entries.slice(0,2),selected);
 assert.equal(loaded.length,2);assert.equal(loaded[0].mask,selected.mask);assert.equal(f.calls.filter(name=>name==='a').length,1);assert.equal(f.calls.filter(name=>name==='b').length,1);
 assert.equal(loaded[0].positions,undefined);assert.equal(headOverlayBytes([selected.entry,selected.entry]),2);
 // A second group entry with identical bytes is still an independent buffer.
 assert.equal(headOverlayBytes([selected.entry,f.entries[1]]),4);
});
test('external selected mask is included without being substituted into the requested group',async()=>{
 const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),selected=await loadHeadEntry(f.pkg,study,f.entries[2],undefined,{maskOnly:true});
 const result=await loadHeadOverlayMasks(f.pkg,study,f.entries.slice(0,2),selected);
 assert.deepEqual(result.map(value=>value.entry),f.entries.slice(0,2));assert.equal(headOverlayBytes([...result.map(value=>value.entry),selected.entry]),6);
 assert.equal(f.calls.filter(name=>name==='c').length,1);
});
test('group cancellation stops before the next mask read and returns no partial group',async()=>{
 const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),controller=new AbortController();
 f.hook(name=>{if(name==='a')controller.abort();});
 await assert.rejects(()=>loadHeadOverlayMasks(f.pkg,study,f.entries,null,controller.signal),{name:'AbortError'});
 assert(!f.calls.includes('b'));assert(!f.calls.includes('c'));
 const pre=new AbortController();pre.abort();const before=[...f.calls];
 await assert.rejects(()=>loadHeadOverlayMasks(f.pkg,study,f.entries,null,pre.signal),{name:'AbortError'});assert.deepEqual(f.calls,before);
});
test('foreign, duplicate and unverified selected entries fail before group IO',async()=>{
 const f=fixture(),study=await loadHeadStudy(f.pkg,'CT'),selected=await loadHeadEntry(f.pkg,study,f.entries[2],undefined,{maskOnly:true}),before=[...f.calls];
 for(const entries of [[{...f.entries[0]}],[f.entries[0],f.entries[0]]])await assert.rejects(()=>loadHeadOverlayMasks(f.pkg,study,entries,null),/active study/);
 await assert.rejects(()=>loadHeadOverlayMasks(f.pkg,study,[f.entries[0]],{...selected}),/Selected overlay/);
 assert.deepEqual(f.calls,before);
});
test('malformed or oversized mask metadata cannot bypass the group admission budget',()=>{
 const f=fixture(),entry=f.entries[0];
 for(const shape of [[0,1,1],[1.5,1,1],[4097,1,1],[4096,4096,4096],[1,2],[]])assert.equal(headOverlayBytes([{...entry,mask:{...entry.mask!,shape_kji:shape}}]),Infinity);
 assert.equal(headOverlayBytes([{...entry,mask:{...entry.mask!,dtype:'float32'}}]),Infinity);
});
