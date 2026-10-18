import assert from 'node:assert/strict';
import test from 'node:test';
import {createNativeVolumeGeometry,type Vec3} from '../lib/head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy} from '../lib/head-atlas-import.ts';
import {headMaskHits} from '../lib/head-mask-picking.ts';

const affine=[[-2,0,0,20],[0,1,0,-5],[0,0,3,2],[0,0,0,1]],shape=[4,6,8];
function fixture(){
  const entry=(id:string):HeadEntry=>({id,label:id,family:'bst',representation:'partial-mask',color:[1,0,0],opacity:{fill:.3,outline:.8},mask:{file:`${id}.bin`,sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[2,2,3],offset_kji:[1,2,3],native_shape_kji:shape,ijk_to_ras:affine}});
  const first=entry('cth.first'),second=entry('cth.second'),point:HeadEntry={...entry('cth.point'),mask:undefined,points_ras_mm:[[0,0,0]]};
  const image={file:'native.bin',sha256:'b'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine};
  const study:LoadedStudy={definition:{image,entries:[first,second,point]},data:new Int16Array(192),geometry:createNativeVolumeGeometry(image),range:[0,1]};
  const mask=()=>{const bytes=new Uint8Array(12);bytes[0]=1;bytes[11]=1;return bytes;};
  const a:LoadedEntry={entry:first,mask:mask()},b:LoadedEntry={entry:second,mask:mask()};
  return {study,first,second,point,a,b,mask};
}

test('returns every overlapping exact saved mask in paint order without deduplicating anatomy by name',()=>{
  const {study,a,b}=fixture(),point:Vec3=[3,2,1];
  b.entry.label=a.entry.label;
  const layers=[b,a,b,a] as const,prior=[...layers],aBytes=a.mask!.slice(),bBytes=b.mask!.slice();
  assert.deepEqual(headMaskHits(study,layers,point,1,{}),[b,a]);
  assert.deepEqual(headMaskHits(study,[a,b],point,1,{}),[a,b]);
  assert.deepEqual(layers,prior);assert.deepEqual(a.mask,aBytes);assert.deepEqual(b.mask,bBytes);
  assert.deepEqual(headMaskHits(study,[a,b],[5,3,2],1,{}),[a,b],'final crop voxel is included');
  assert.deepEqual(headMaskHits(study,[a,b],[4,2,1],1,{}),[],'adjacent voxel is not a fuzzy hit');
});

test('requires exact active-study entry objects and loaded binary masks, never points or alias inference',()=>{
  const {study,first,point,a,b,mask}=fixture(),position:Vec3=[3,2,1];
  const copied={...first},foreign={entry:copied,mask:mask()};
  const staleStudy={...study,definition:{...study.definition,entries:[copied,b.entry,point]}};
  assert.deepEqual(headMaskHits(study,[foreign,a,{entry:point,focus:[3,2,1]},b],position,1,{}),[a,b]);
  assert.deepEqual(headMaskHits(staleStudy,[a],position,1,{}),[]);
  assert.deepEqual(headMaskHits(study,[{entry:first}],position,1,{}),[]);
  assert.deepEqual(headMaskHits(study,[{entry:point,mask:mask()}],position,1,{}),[]);
  assert.deepEqual(headMaskHits(study,[{entry:first,mask:new Uint8Array(11)}],position,1,{}),[]);
  const nonbinary=mask();nonbinary[11]=2;
  assert.deepEqual(headMaskHits(study,[{entry:first,mask:nonbinary}],position,1,{}),[],'a nonbinary byte elsewhere invalidates the full mask');
  assert.deepEqual(headMaskHits(study,[{entry:first,mask:[1] as unknown as Uint8Array}],position,1,{}),[]);
  assert.deepEqual(headMaskHits(study,[{entry:first,mask:new Uint8Array(12)},a],position,1,{}),[a],'a stale duplicate cannot hide a later valid loaded copy');
});

test('uses the exact native crop and affine binding without substitution',()=>{
  const {study,first,a}=fixture(),position:Vec3=[3,2,1];
  assert.deepEqual(headMaskHits(study,[a],position,1,{}),[a]);
  for(const changed of [
    {offset_kji:[2,2,3]},
    {native_shape_kji:[4,6,9]},
    {ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},
    {shape_kji:[2,2,2]},
    {dtype:'uint16'},
  ]){
    const altered={...first,mask:{...first.mask!,...changed}};
    const alteredStudy={...study,definition:{...study.definition,entries:[altered]}};
    assert.deepEqual(headMaskHits(alteredStudy,[{entry:altered,mask:a.mask}],position,1,{}),[],JSON.stringify(changed));
  }
  for(const bad of [[2,2,1],[-1,2,1],[3.2,2,1],[8,2,1],[NaN,2,1]] as Vec3[])
    assert.deepEqual(headMaskHits(study,[a],bad,1,{}),[]);
});

test('zero, hidden and malformed opacity suppress hits; fill or outline alone can remain visible',()=>{
  const {study,first,a,b}=fixture(),position:Vec3=[3,2,1];
  for(const bad of [0,-1,NaN,Infinity,-Infinity,2])assert.deepEqual(headMaskHits(study,[a,b],position,bad,{}),[]);
  for(const bad of [0,-1,NaN,Infinity,2])assert.deepEqual(headMaskHits(study,[a,b],position,1,{[first.id]:bad}),[b]);
  first.opacity={fill:0,outline:.4};assert.deepEqual(headMaskHits(study,[a],position,1,{}),[a]);
  first.opacity={fill:.4,outline:0};assert.deepEqual(headMaskHits(study,[a],position,1,{}),[a]);
  first.opacity={fill:0,outline:0};assert.deepEqual(headMaskHits(study,[a],position,1,{}),[]);
  first.opacity={fill:NaN,outline:Infinity};assert.deepEqual(headMaskHits(study,[a],position,1,{}),[]);
  assert.deepEqual(headMaskHits(study,[b],position,1,{}),[b]);
});
