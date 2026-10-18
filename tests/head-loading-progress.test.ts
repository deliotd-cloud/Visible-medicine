import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {openHeadPackageFromLocalSource} from '../lib/head-local-source.ts';
import {loadHeadStudy,openLocalHeadPackage} from '../lib/head-atlas-import.ts';
import {headStudyLoadingMessage,type HeadStudyProgress} from '../lib/head-load-progress.ts';

const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const image=Uint8Array.from({length:256},(_,i)=>i%251);
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const imageSpec={file:'image.bin',sha256:hash(image),dtype:'uint8',shape_kji:[4,8,8],ijk_to_ras:affine};
const entries=(count:number)=>Array.from({length:count},(_,i)=>({id:`fixture.${i}`,label:'Synthetic fixture',family:'test',representation:'point',color:[1,0,0],opacity:{fill:.2,outline:.9}}));
const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageSpec,entries:entries(355)},MRI:{image:imageSpec,entries:entries(117)}}});
const headers={'x-visible-medicine-local':'1'};
function streamed(chunks:Uint8Array[]){return new Response(new ReadableStream<Uint8Array>({start(controller){for(const chunk of chunks)controller.enqueue(chunk);controller.close();}}),{headers});}
async function packageFrom(response:()=>Response,parent?:AbortSignal){
  const calls:string[]=[];
  const fetcher=(async(input:RequestInfo|URL)=>{const url=String(input);calls.push(url);return url.includes('/manifest.json')?new Response(manifest,{headers}):response();}) as typeof fetch;
  const pkg=await openHeadPackageFromLocalSource(fetcher,'http://127.0.0.1:3000',hash(manifest),parent);
  assert.ok(pkg);return {pkg,calls};
}
function folderFile(path:string,bytes:string|Uint8Array){const file=new File([bytes as BlobPart],path);Object.defineProperty(file,'webkitRelativePath',{value:`fixture/${path}`});return file;}

test('streaming progress is numeric and monotonic; verification follows exact EOF and preserves image bytes',async()=>{
  const {pkg}=await packageFrom(()=>streamed([image.subarray(0,64),image.subarray(64,128),image.subarray(128)]));
  const events:HeadStudyProgress[]=[];
  const study=await loadHeadStudy(pkg,'CT',undefined,p=>events.push(p));
  assert.deepEqual([...study.data],[...image]);
  assert.deepEqual(events.map(p=>[p.phase,p.loadedBytes,p.totalBytes]),[
    ['reading',0,256],['reading',64,256],['reading',128,256],['reading',256,256],['verifying',256,256]
  ]);
  for(const event of events)assert.deepEqual(Object.keys(event).sort(),['loadedBytes','phase','totalBytes']);
});

test('manual File loading reports real phase boundaries without inventing intermediate transfer progress',async()=>{
  const pkg=await openLocalHeadPackage([folderFile('manifest.json',manifest),folderFile('image.bin',image)],hash(manifest));
  const events:HeadStudyProgress[]=[];
  assert.equal((await loadHeadStudy(pkg,'MRI',undefined,p=>events.push(p))).data[200],image[200]);
  assert.deepEqual(events.map(p=>[p.phase,p.loadedBytes]),[['reading',0],['reading',256],['verifying',256]]);
});

test('truncation and a late extra chunk never advance to checksum verification',async()=>{
  for(const chunks of [[image.subarray(0,-1)],[image,new Uint8Array([1])]]){
    const {pkg}=await packageFrom(()=>streamed(chunks));const events:HeadStudyProgress[]=[];
    await assert.rejects(loadHeadStudy(pkg,'CT',undefined,p=>events.push(p)),/missing or too large/);
    assert.ok(events.length);assert.equal(events.some(p=>p.phase==='verifying'),false);
  }
});

test('a complete altered image reaches verification but is still refused by the actual checksum gate',async()=>{
  const changed=image.slice();changed[10]^=1;
  const {pkg}=await packageFrom(()=>streamed([changed]));const events:HeadStudyProgress[]=[];
  await assert.rejects(loadHeadStudy(pkg,'CT',undefined,p=>events.push(p)),/checksum mismatch/);
  assert.equal(events.at(-1)?.phase,'verifying');
  assert.equal(events.some(p=>Object.hasOwn(p,'complete')),false);
});

test('abort from the initial progress observer prevents any image request',async()=>{
  const {pkg,calls}=await packageFrom(()=>streamed([image]));const controller=new AbortController();
  await assert.rejects(loadHeadStudy(pkg,'CT',controller.signal,()=>controller.abort()),{name:'AbortError'});
  assert.equal(calls.length,1,'only the already verified manifest was requested');
});

test('mid-read cancellation retires progress and releases the source reader',async()=>{
  const response=streamed([image.subarray(0,64),image.subarray(64)]);
  const {pkg}=await packageFrom(()=>response),controller=new AbortController();const events:HeadStudyProgress[]=[];
  await assert.rejects(loadHeadStudy(pkg,'MRI',controller.signal,p=>{events.push(p);if(p.loadedBytes===64)controller.abort();}),{name:'AbortError'});
  assert.equal(response.body?.locked,false);
  assert.deepEqual(events.map(p=>[p.phase,p.loadedBytes]),[['reading',0],['reading',64]]);
});

test('an observer failure cannot replace integrity checks, corrupt bytes or expose its private error',async()=>{
  const {pkg}=await packageFrom(()=>streamed([image]));
  const study=await loadHeadStudy(pkg,'CT',undefined,()=>{throw new Error('private observer detail');});
  assert.deepEqual([...study.data],[...image]);
  const changed=image.slice();changed[0]^=1;const bad=await packageFrom(()=>streamed([changed]));
  await assert.rejects(loadHeadStudy(bad.pkg,'CT',undefined,()=>{throw new Error('private observer detail');}),/checksum mismatch/);
});

test('cancellation at verification and parent-package cancellation still refuse the study',async()=>{
  const first=await packageFrom(()=>streamed([image]));const controller=new AbortController();
  await assert.rejects(loadHeadStudy(first.pkg,'CT',controller.signal,p=>{if(p.phase==='verifying')controller.abort();}),{name:'AbortError'});
  const parent=new AbortController();const second=await packageFrom(()=>streamed([image.subarray(0,64),image.subarray(64)]),parent.signal);
  const events:HeadStudyProgress[]=[];
  await assert.rejects(loadHeadStudy(second.pkg,'MRI',undefined,p=>{events.push(p);if(p.loadedBytes===64)parent.abort();}),{name:'AbortError'});
  assert.deepEqual(events.map(p=>[p.phase,p.loadedBytes]),[['reading',0],['reading',64]]);
});

test('untrusted custom-asset progress cannot reverse bytes or claim a different total',async()=>{
  const {pkg}=await packageFrom(()=>streamed([image]));
  pkg.files.set('image.bin',{size:256,async arrayBuffer(_signal,onProgress){
    onProgress?.({loadedBytes:128,totalBytes:256});
    onProgress?.({loadedBytes:64,totalBytes:256});
    onProgress?.({loadedBytes:255,totalBytes:512});
    onProgress?.({loadedBytes:257,totalBytes:256});
    onProgress?.({loadedBytes:NaN,totalBytes:256});
    return image.slice().buffer;
  }});
  const events:HeadStudyProgress[]=[];
  assert.equal((await loadHeadStudy(pkg,'CT',undefined,p=>events.push(p))).data[42],image[42]);
  assert.deepEqual(events.map(p=>[p.phase,p.loadedBytes,p.totalBytes]),[['reading',0,256],['reading',128,256],['reading',256,256],['verifying',256,256]]);
});

test('direct asset observer abort before allocation cancels the response body',async()=>{
  let cancelled=false;const body=new ReadableStream<Uint8Array>({pull(){},cancel(){cancelled=true;}});
  const {pkg}=await packageFrom(()=>new Response(body,{headers}));const controller=new AbortController();
  const asset=pkg.files.get('image.bin');assert.ok(asset);
  await assert.rejects(asset.arrayBuffer(controller.signal,()=>controller.abort()),{name:'AbortError'});
  assert.equal(cancelled,true);assert.equal(body.locked,false);
});

test('status uses ten-percent real byte buckets and distinct verifying text without time estimates',()=>{
  for(const [loaded,percent] of [[0,0],[1,0],[25,20],[99,90],[100,100]]){
    assert.equal(headStudyLoadingMessage('CT',{phase:'reading',loadedBytes:loaded,totalBytes:100}),`Reading CT native image… ${percent}%`);
  }
  assert.equal(headStudyLoadingMessage('MRI',{phase:'verifying',loadedBytes:100,totalBytes:100}),'Verifying MRI image checksum…');
  for(const loadedBytes of [-1,101,NaN,Infinity,1.5])assert.equal(headStudyLoadingMessage('CT',{phase:'reading',loadedBytes,totalBytes:100}),'Opening CT native image…');
  assert.equal(headStudyLoadingMessage('CT',{phase:'reading',loadedBytes:0,totalBytes:0}),'Opening CT native image…');
});

test('viewer progress uses the current abortable request and existing polite status region',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/loadHeadStudy\(pkg,modality,controller\.signal,progress=>/);
  assert.match(source,/if\(!controller\.signal\.aborted&&studyRequestRef\.current===controller\)setStatus\(headStudyLoadingMessage\(modality,progress\)\)/);
  assert.match(source,/role="status" aria-live="polite"/);
  const binding=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  assert.ok(binding.includes("'lib/head-load-progress.ts'"));
});
