import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openSync,readSync,closeSync,readFileSync,lstatSync,readdirSync,realpathSync} from 'node:fs';
import {resolve,relative,sep,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const root=resolve(site,'public/atlas-runtime/head-neck');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(resolve(site,p));
function safeFile(base,name){
 assert(typeof name==='string'&&name&&!isAbsolute(name)&&!/[\\:#?]/.test(name));
 assert(name.split('/').every(x=>x&&x!=='.'&&x!=='..'));
 const target=resolve(base,name),rel=relative(realpathSync(base),realpathSync(target));
 assert(rel&&!isAbsolute(rel)&&!rel.startsWith('..'+sep)&&rel!=='..');
 assert(!lstatSync(target).isSymbolicLink()&&lstatSync(target).isFile());return target;
}
function hashFile(file){
 const h=createHash('sha256'),fd=openSync(file,'r'),buffer=Buffer.allocUnsafe(65536);
 try{for(let n;(n=readSync(fd,buffer,0,buffer.length,null));)h.update(buffer.subarray(0,n));}finally{closeSync(fd);}return h.digest('hex');
}
function inventory(base){
 const names=[];function walk(prefix){for(const entry of readdirSync(resolve(base,prefix),{withFileTypes:true})){
  assert(!entry.isSymbolicLink());const name=prefix+entry.name;
  if(entry.isDirectory())walk(name+'/');else {assert(entry.isFile());names.push(name);}
 }}walk('');return names.sort();
}

test('current regional delivery validates its exact native source, complete file inventory and all declared model bytes',()=>{
 const pin=validateCurrentAtlasDelivery(),native=currentAtlasDeliveryRoot();
 const manifest=JSON.parse(read('public/atlas-runtime/head-neck/manifest.json'));
 const inputs=JSON.parse(read('public/atlas-runtime/head-neck/source-inputs.json'));
 assert.equal(manifest.sourceCommit,pin.source);assert.equal(manifest.sourceCommit,pin.runtimeSources['head-neck']);
 assert.equal(manifest.schemaVersion,2);assert.equal(manifest.region,'head-neck');
 assert.equal(manifest.structures,291);assert.equal(manifest.nestedSelections,77);
 assert.equal(new Set(manifest.regionalIds).size,291);assert.equal(new Set(manifest.nestedTargets.map(x=>x.structureId)).size,77);
 assert.deepEqual(manifest.regionalScopes.map(s=>[s.region,s.regionalIds.length,s.nestedTargets.length]),[['head-neck',291,77],['thorax',158,11],['abdomen',106,16],['pelvis',82,4],['spine',115,0],['shoulder-arm',115,0],['forearm',86,0],['hand',124,0],['thigh',95,4],['leg',76,4],['foot',122,0],['whole-body',1104,108]]);
 for(const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
 const expected=['manifest.json',...manifest.files.map(f=>f.path)].sort();assert.equal(new Set(expected).size,expected.length);assert.deepEqual(inventory(root),expected);
 const files=new Map();for(const row of manifest.files){
  assert(!/\.(dcm|nii|nrrd|stl|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(row.path));
  const file=safeFile(root,row.path);assert.equal(lstatSync(file).size,row.bytes,row.path);assert.equal(hashFile(file),row.sha256,row.path);files.set(row.path,row);
 }
 assert.equal(manifest.modelBundles.length,136);assert.equal(new Set(manifest.modelBundles.map(b=>b.url)).size,136);assert.equal(expected.filter(p=>p.endsWith('.glb')).length,136);
 for(const bundle of manifest.modelBundles){assert(bundle.url.startsWith('/models/'));const url=new URL(bundle.url,'https://atlas.invalid');assert.equal(url.origin,'https://atlas.invalid');assert(!url.hash);if(url.search){assert.deepEqual([...url.searchParams.keys()],['v']);const version=url.searchParams.get('v');assert(/^(?:[a-f0-9]{12}|[a-f0-9]{64})$/.test(version));assert.equal(version,bundle.sha256.slice(0,version.length));}const row=files.get(url.pathname.slice(1));assert(row);assert.equal(row.sha256,bundle.sha256);assert.equal(row.bytes,bundle.bytes);}
 assert.equal(new Set(inputs.map(x=>x.path)).size,inputs.length);for(const row of inputs)assert.equal(hashFile(safeFile(native,row.path)),row.sha256,row.path);
 const scene=manifest.files.filter(f=>/^assets\/body-scene-[^/]+\.js$/.test(f.path));assert.equal(scene.length,1);assert(scene[0].bytes>0);
});

test('current page references, notices and commercial-compatible dependency declarations remain present',()=>{
 validateCurrentAtlasDelivery();const manifest=JSON.parse(read('public/atlas-runtime/head-neck/manifest.json')),declared=new Map(manifest.files.map(r=>[r.path,r]));
 const text=name=>{const file=safeFile(root,name),bytes=readFileSync(file);assert.equal(sha(bytes),declared.get(name)?.sha256,name);return bytes.toString('utf8');};
 for(const match of text('index.html').matchAll(/(?:src|href)="([^"]+)"/g)){assert(match[1].startsWith('/atlas-runtime/head-neck/'));assert(declared.has(match[1].slice('/atlas-runtime/head-neck/'.length)));}
 const deps=JSON.parse(text('bundled-dependencies.json')),notices=text('BUNDLED_NOTICES.txt');assert(deps.length>10);
 for(const dep of deps){assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(dep.license));assert(notices.includes(dep.name+'@'+dep.version));}
 const credits=text('models/bodyparts3d/credits.html');assert(credits.includes('The Database Center for Life Science')&&credits.includes('CC Attribution 4.0'));
 for(const match of credits.matchAll(/href="([^"]+)"/g)){if(match[1].startsWith('https:'))continue;if(match[1].startsWith('/'))assert.equal(match[1],'/atlas');else {const url=new URL(match[1],pathToFileURL(resolve(root,'models/bodyparts3d/credits.html')));assert.equal(url.protocol,'file:');url.search='';url.hash='';const name=relative(root,fileURLToPath(url)).split(sep).join('/');safeFile(root,name);assert(name==='manifest.json'||declared.has(name));}}
});

test('old delivery pins and altered current head metadata cannot be accepted as the current runtime',()=>{
 const original=validateCurrentAtlasDelivery();
 for(const p of ['current-atlas-delivery-before-neck-xray-20261022.json','current-delivery-before-head-tools-20261022.json']){
  const old=JSON.parse(readFileSync(new URL('./fixtures/'+p,import.meta.url)));assert.notEqual(old.source,original.source);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 }
 for(const target of ['public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json']){
  const changed=Buffer.from(read(target));changed[changed.length-1]^=1;let intercepted=false;
  assert.throws(()=>validateCurrentAtlasDelivery({read:p=>{if(p===target){intercepted=true;return changed;}return read(p);}}),new RegExp('Current delivery changed: '+target));assert(intercepted);
 }
 assert.throws(()=>safeFile(root,'../head-neck/manifest.json'));assert.throws(()=>safeFile(root,'/manifest.json'));
});


test('sealed a9 historical import rejects a targeted changed manifest after matching its other historical inputs',async()=>{
 const {readHistoricalCoccygeusSource,assertSealedCurrentHeadFeatureDelivery}=await import('./head-feature-source-roles.mjs');let intercepted=false;
 assert.equal(assertSealedCurrentHeadFeatureDelivery().source,'a9f5930a853bfb7b419ffd756bb29cefc174f3da');
 assert.throws(()=>assertSealedCurrentHeadFeatureDelivery({readActual:p=>{if(p==='atlas-review/manifest.json'){intercepted=true;return Buffer.from('changed historical manifest');}return readHistoricalCoccygeusSource(p);}}),/atlas-review\/manifest.json: actual current source/);assert(intercepted);
});
