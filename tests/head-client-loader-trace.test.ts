import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {after,before,test} from 'node:test';
import {openHeadPackageFromLocalSource} from '../lib/head-local-source.ts';
import {loadHeadStudy} from '../lib/head-atlas-import.ts';
import {HEAD_CLIENT_TRACE_PREFIX} from '../lib/head-load-progress.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
const image=Uint8Array.from({length:256},(_,i)=>i%251),hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const imageSpec={file:'synthetic.raw',sha256:hash(image),dtype:'uint8',shape_kji:[4,8,8],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
const entries=(count:number)=>Array.from({length:count},(_,i)=>({id:`synthetic.${i}`,label:'Public fixture',family:'test',representation:'point',color:[1,0,0],opacity:{fill:.2,outline:.9}}));
const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageSpec,entries:entries(355)},MRI:{image:imageSpec,entries:entries(117)}}});
const lines:string[]=[];
const localWindow={location:{origin:'http://127.0.0.1:3000',search:'',hash:'#headDiagnostics=1'},console:{info:(line:string)=>lines.push(line)}};
const originals=new Map(['window','__VM_LOCAL_HEAD_DIAGNOSTICS__'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
before(()=>{Object.defineProperty(globalThis,'window',{value:localWindow,configurable:true});Object.defineProperty(globalThis,'__VM_LOCAL_HEAD_DIAGNOSTICS__',{value:true,configurable:true});});
after(()=>{for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}});
const records=()=>lines.map(line=>{assert.ok(line.startsWith(HEAD_CLIENT_TRACE_PREFIX));return JSON.parse(line.slice(HEAD_CLIENT_TRACE_PREFIX.length));});
async function source(bytes=image,parent?:AbortSignal){
  const headers={'x-visible-medicine-local':'1'};
  const fetcher=(async(input:RequestInfo|URL)=>new Response(String(input).includes('/manifest.json')?manifest:bytes,{headers}))as typeof fetch;
  const pkg=await openHeadPackageFromLocalSource(fetcher,'http://127.0.0.1:3000',hash(manifest),parent);assert.ok(pkg);return pkg;
}

test('real loader phases follow byte reading and checksum verification, not rendered or clinical readiness',async()=>{
  lines.length=0;
  const study=await loadHeadStudy(await source(),'CT');
  assert.deepEqual([...study.data],[...image]);
  assert.deepEqual(records().map(row=>row.phase),['study-start','reading','reading','verifying','study-data-ready']);
  assert.equal(records().at(-1).loadedBytes,256);
  assert.equal(records().some(row=>Object.keys(row).some(key=>/path|id|label|hash|approved|rendered/.test(key))),false);
});

test('actual checksum refusal never claims data ready or logs the rejected bytes',async()=>{
  lines.length=0;const changed=image.slice();changed[10]^=1;
  await assert.rejects(loadHeadStudy(await source(changed),'MRI'),/checksum mismatch/);
  assert.equal(records().at(-1).phase,'failed');
  assert.equal(records().some(row=>row.phase==='verifying'),true);
  assert.equal(records().some(row=>row.phase==='study-data-ready'),false);
  assert.equal(lines.join('\n').includes('checksum'),false);
});

test('asset read truncation fails before verification',async()=>{
  lines.length=0;
  await assert.rejects(loadHeadStudy(await source(image.subarray(0,-1)),'CT'),/missing or too large/);
  assert.equal(records().at(-1).phase,'failed');
  assert.equal(records().some(row=>row.phase==='verifying'||row.phase==='study-data-ready'),false);
});

test('both study and parent cancellation are recorded without replacing AbortError',async()=>{
  for(const parentOnly of [false,true]){
    lines.length=0;const controller=new AbortController(),pkg=await source(image,parentOnly?controller.signal:undefined);
    await assert.rejects(loadHeadStudy(pkg,'CT',parentOnly?undefined:controller.signal,()=>controller.abort()),{name:'AbortError'});
    assert.equal(records().at(-1).phase,'cancelled');
    assert.equal(records().some(row=>row.phase==='study-data-ready'),false);
  }
});

test('failing diagnostic and display observers cannot replace the loader result',async()=>{
  const previous=localWindow.console.info;localWindow.console.info=()=>{throw Error('private observer secret');};
  try{assert.deepEqual([...(await loadHeadStudy(await source(),'MRI',undefined,()=>{throw Error('private display secret');})).data],[...image]);}
  finally{localWindow.console.info=previous;}
});

test('without the fragment opt-in no client diagnostics alter display progress or final bytes',async()=>{
  lines.length=0;localWindow.location.hash='';const progress:unknown[]=[];
  try{
    assert.deepEqual([...(await loadHeadStudy(await source(),'CT',undefined,value=>progress.push(value))).data],[...image]);
    assert.deepEqual(progress,[{phase:'reading',loadedBytes:0,totalBytes:256},{phase:'reading',loadedBytes:256,totalBytes:256},{phase:'verifying',loadedBytes:256,totalBytes:256}]);
    assert.deepEqual(lines,[]);
  }finally{localWindow.location.hash='#headDiagnostics=1';}
});

test('fragment diagnostics leave the exact linked Pons tour valid without loosening strict query parsing',()=>{
  const href=headImageHref('CT','brainstem-pons',{sequenceId:'brainstem',conceptId:'brainstem-pons'},HEAD_LINK_REVISION);assert.ok(href);
  const url=new URL(href,localWindow.location.origin);
  const original=parseHeadImageNavigation(url.searchParams,HEAD_LINK_REVISION,'CT');assert.equal(original.invalid,false);
  url.hash='headDiagnostics=1';
  assert.deepEqual(parseHeadImageNavigation(url.searchParams,HEAD_LINK_REVISION,'CT'),original);
  url.searchParams.set('headDiagnostics','1');
  assert.equal(parseHeadImageNavigation(url.searchParams,HEAD_LINK_REVISION,'CT').invalid,true);
});
