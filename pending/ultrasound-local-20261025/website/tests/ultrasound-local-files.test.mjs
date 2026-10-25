import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['lib/ultrasound-local-files.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {loadUltrasoundStudy}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
function manifest(bytes=png){return {schema:'vm-ultrasound-teaching/1',id:'synthetic-study',title:'Synthetic QA, not ultrasound',region:'abdomen',source:{author:'Visible Medicine QA',license:'CC0-1.0',attribution:'Original synthetic test data.',url:null},frames:[{id:'frame-one',title:'Synthetic pixel',orientationNote:'No patient orientation or calibration.',image:{file:'grid.png',sha256:sha(bytes),width:1,height:1},annotations:[]}]};}
function files(study=manifest(),bytes=png){return [new File([JSON.stringify(study)],'ultrasound-atlas.json',{type:'application/json'}),new File([bytes],'grid.png',{type:'image/png'})];}
function environment(t,decode=async()=>({width:1,height:1,close(){}})){
 const prior=Object.getOwnPropertyDescriptor(globalThis,'createImageBitmap');Object.defineProperty(globalThis,'createImageBitmap',{configurable:true,value:decode});
 const created=[],revoked=[];t.mock.method(URL,'createObjectURL',()=>{const value='blob:synthetic-'+(created.length+1);created.push(value);return value;});t.mock.method(URL,'revokeObjectURL',url=>revoked.push(url));t.mock.method(globalThis,'fetch',()=>{throw Error('Network access is forbidden in local folder loading');});
 t.after(()=>{if(prior)Object.defineProperty(globalThis,'createImageBitmap',prior);else delete globalThis.createImageBitmap;});return {created,revoked};
}
test('exact local bytes and decoded dimensions produce owned URLs without uploads',async t=>{
 const env=environment(t),input=files();const unused=new File(['unused'],'unused.txt');unused.arrayBuffer=()=>{throw Error('Unlisted file read');};
 const result=await loadUltrasoundStudy([...input,unused],{expectedRegion:'abdomen'});assert.match(result.revision,/^[a-f0-9]{64}$/);assert.equal(result.images['grid.png'],'blob:synthetic-1');assert(Object.isFrozen(result.images));
 assert.deepEqual(env.revoked,[]);result.dispose();result.dispose();assert.deepEqual(env.revoked,env.created);
});
test('wrong region and wrong image hash are refused before any decoder or URL',async t=>{
 let decoded=0;const env=environment(t,async()=>{decoded++;return {width:1,height:1,close(){}};});
 await assert.rejects(loadUltrasoundStudy(files(),{expectedRegion:'thorax'}),/another region/);
 const s=manifest();s.frames[0].image.sha256='0'.repeat(64);await assert.rejects(loadUltrasoundStudy(files(s)),/does not match/);assert.equal(decoded,0);assert.deepEqual(env.created,[]);
});
test('duplicate names, mixed folders and nested paths are refused before reading bytes',async t=>{
 environment(t);const duplicate=files();duplicate.push(new File([png],'GRID.PNG'));await assert.rejects(loadUltrasoundStudy(duplicate),/duplicate/);
 const mixed=files();Object.defineProperty(mixed[0],'webkitRelativePath',{value:'one/ultrasound-atlas.json'});Object.defineProperty(mixed[1],'webkitRelativePath',{value:'two/grid.png'});await assert.rejects(loadUltrasoundStudy(mixed),/one teaching folder/);
 const nested=files();Object.defineProperty(nested[1],'webkitRelativePath',{value:'one/sub/grid.png'});await assert.rejects(loadUltrasoundStudy(nested),/directly inside/);
});
test('unsupported formats, decompression dimensions and encoded-type mismatch are refused',async t=>{
 let decoded=0;environment(t,async()=>{decoded++;return {width:1,height:1,close(){}};});
 const svg=Buffer.from('<svg/>');await assert.rejects(loadUltrasoundStudy(files(manifest(svg),svg)),/not a supported/);
 const huge=Buffer.from(png);huge.writeUInt32BE(50000,16);await assert.rejects(loadUltrasoundStudy(files(manifest(huge),huge)),/encoded image exceeds/);
 const jpeg=Buffer.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,217]);await assert.rejects(loadUltrasoundStudy(files(manifest(jpeg),jpeg)),/filename does not match/);assert.equal(decoded,0);
});
test('decoded dimensions must match the source packet and bitmaps always close',async t=>{
 let closed=0;const env=environment(t,async()=>({width:2,height:1,close(){closed++;}}));await assert.rejects(loadUltrasoundStudy(files()),/declared pixel dimensions/);assert.equal(closed,1);assert.deepEqual(env.created,[]);
});
test('an abort during a pending file read admits no late result or URL',async t=>{
 const env=environment(t),controller=new AbortController(),input=files();let release,entered;const pending=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});input[1].arrayBuffer=()=>{entered();return pending;};
 const result=loadUltrasoundStudy(input,{signal:controller.signal});await started;controller.abort();release(png.buffer.slice(png.byteOffset,png.byteOffset+png.byteLength));await assert.rejects(result,{name:'AbortError'});assert.deepEqual(env.created,[]);
});
test('an abort after image decoding closes that bitmap before returning',async t=>{
 let closed=0;const controller=new AbortController(),env=environment(t,async()=>{controller.abort();return {width:1,height:1,close(){closed++;}};});await assert.rejects(loadUltrasoundStudy(files(),{signal:controller.signal}),{name:'AbortError'});assert.equal(closed,1);assert.deepEqual(env.created,[]);
});
test('a later image failure revokes only URLs owned by that attempted study',async t=>{
 const env=environment(t),s=manifest(),second=structuredClone(s.frames[0]);second.id='frame-two';second.image.file='other.png';second.image.sha256='0'.repeat(64);s.frames.push(second);
 await assert.rejects(loadUltrasoundStudy([...files(s),new File([png],'other.png')]),/does not match/);assert.deepEqual(env.created,['blob:synthetic-1']);assert.deepEqual(env.revoked,env.created);
});
