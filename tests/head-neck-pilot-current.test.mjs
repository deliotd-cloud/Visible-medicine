import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {historicalHeadPilotRuntime,readHeadPilotFile,listHeadPilotDirectory,decodeFrozenText,assertFrozenCodec} from './historical-head-pilot-read.mjs';

const runtime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=readFileSync(new URL('./fixtures/head-neck-pilot-original.json',import.meta.url));
assert.equal(sha(originalBytes),'152308751708263280d5ae4d9e168b7743210e9260276e0048a4881e37e332c4');
const original=JSON.parse(originalBytes);
const epochBytes=readFileSync(new URL('./fixtures/head-pilot-9fba-epoch.json',import.meta.url));
assert.equal(sha(epochBytes),'644bae978dcd4e2a167e119788fdf7d8e7ce32052b375e431159405a766b87c0');

test('historical reader is portable, closed, and bound to the authentic old manifest',async()=>{
  const helper=readFileSync(new URL('./historical-head-pilot-read.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(helper,/F:\/|canonical-original|staging[\\/]/i);
  const epoch=JSON.parse(epochBytes);
  assert.equal(epoch.schema,'visible-medicine-head-pilot-9fba-utf8-epoch-v2');
  assert.equal(epoch.codec,'deflate-raw-utf8');
  assert.equal(epoch.totalRawBytes,21382554);
  assert.equal(epoch.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
  assert.equal(epoch.declaredFiles,217);
  assert.equal(epoch.frozenTextFiles,26);
  assert.equal(epoch.unchangedCurrentFiles,191);
  assert.equal(new Set(epoch.files.map(file=>file.path)).size,26);
  const oldManifestBytes=await readHeadPilotFile(new URL('manifest.json',historicalHeadPilotRuntime));
  assert.equal(sha(oldManifestBytes),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
  const oldManifest=JSON.parse(oldManifestBytes);
  assert.equal(oldManifest.sourceCommit,epoch.sourceCommit);
  assert.equal(oldManifest.files.length,216);
  assert.equal(sha(await readHeadPilotFile(new URL('source-inputs.json',historicalHeadPilotRuntime))),
    '51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
  const oldNames=['manifest.json',...oldManifest.files.map(file=>file.path)];
  const atRoot=await listHeadPilotDirectory(historicalHeadPilotRuntime,{withFileTypes:true});
  assert.deepEqual(atRoot.map(entry=>entry.name).sort(),[...new Set(oldNames.map(name=>name.split('/')[0]))].sort());
  const model=oldManifest.modelBundles[0];
  const oldModel=oldManifest.files.find(file=>model.url.split('?')[0].slice(1)===file.path);
  assert(oldModel);
  assert.equal(sha(await readHeadPilotFile(new URL(oldModel.path,historicalHeadPilotRuntime))),oldModel.sha256);
  await assert.rejects(readHeadPilotFile(new URL('assets/undeclared.js',historicalHeadPilotRuntime)),/not declared/);
  await assert.rejects(readHeadPilotFile(new URL('../shoulder/manifest.json',historicalHeadPilotRuntime)),/not declared/);
  await assert.rejects(listHeadPilotDirectory(new URL('assets/missing/',historicalHeadPilotRuntime),{withFileTypes:true}),/not declared/);
});

test('packed historical text rejects malformed, excessive and unsupported input',()=>{
  const epoch=JSON.parse(epochBytes);
  const file=epoch.files[0],expected={bytes:627564,sha256:epoch.manifestSha256};
  assert.equal(sha(decodeFrozenText(file,expected)),expected.sha256);
  assert.throws(()=>assertFrozenCodec('gzip-utf8'),/Unsupported historical source codec/);
  assert.throws(()=>decodeFrozenText({...file,path:'../manifest.json'},expected),/escapes|canonical/);
  assert.throws(()=>decodeFrozenText({...file,extra:true},expected));
  assert.throws(()=>decodeFrozenText({...file,deflateRawBase64:'!!'},expected),/Malformed historical base64/);
  assert.throws(()=>decodeFrozenText({...file,compressedBytes:1,deflateRawBase64:'AA=='},expected));
  assert.throws(()=>decodeFrozenText({...file,compressedBytes:file.compressedBytes+1},expected),/compressed size changed/);
  assert.throws(()=>decodeFrozenText(file,{...expected,bytes:expected.bytes-1}),/size declaration changed/);
  assert.throws(()=>decodeFrozenText(file,{...expected,bytes:8_000_001}),/fixed bound/);
});

test('the historical pilot retains every original assertion',()=>{
  assert.equal(original.schema,'visible-medicine-head-pilot-original-v1');
  assert.equal(original.websiteHead,'b953ff3f5f1891599cb6e91cb91311d9d6006270');
  assert.equal(original.path,'tests/head-neck-pilot.test.ts');
  const bytes=Buffer.from(original.bytesBase64,'base64');
  assert.equal(sha(bytes),'e5503991c3851c1be86186f30dd9b54cfafd5337d17cc6699453602f479f3b0f');
  assert.equal(sha(bytes),original.sha256);
  assert.equal(bytes.toString('utf8'),original.text);
  let current=readFileSync(new URL('./head-neck-pilot.test.ts',import.meta.url),'utf8');
  const undo=(before,after)=>{
    assert.equal(current.split(before).length,2,`Exactly one pilot migration: ${before}`);
    current=current.replace(before,after);
  };
  undo("import {readHeadPilotFile as readFile,listHeadPilotDirectory as readdir,historicalHeadPilotRuntime} from './historical-head-pilot-read.mjs';",
    "import {readFile,readdir} from 'node:fs/promises';");
  undo('const runtime=historicalHeadPilotRuntime;',"const runtime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);");
  assert.equal(current,original.text);
  assert.equal(sha(Buffer.from(current,'utf8')),original.sha256);
});

test('current head-neck delivery keeps exact source, regional/model scope and licence boundaries',async()=>{
  const manifestBytes=await readFile(new URL('manifest.json',runtime));
  assert.equal(sha(manifestBytes),'d8d5b5aaf4a40252217da56cd5d42c80ade5b43abb090454fd4c616a8e1ee9d8');
  const manifest=JSON.parse(manifestBytes);
  assert.equal(manifest.sourceCommit,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
  assert.equal(manifest.schemaVersion,2);
  const inputBytes=await readFile(new URL('source-inputs.json',runtime));
  assert.equal(sha(inputBytes),'04b7123d4a613ad8b3a62cd19fdba7a3ef9ac56327b67116a7ad615973deca38');
  const inputs=JSON.parse(inputBytes);
  assert.equal(inputs.length,1508);
  assert.equal(new Set(inputs.map(input=>input.path)).size,1508);
  assert.equal(manifest.files.length,216);
  assert.equal(new Set(manifest.files.map(file=>file.path)).size,216);
  assert.equal(manifest.modelBundles.length,136);
  assert.equal(new Set(manifest.modelBundles.map(bundle=>bundle.url)).size,136);
  assert.equal(sha(JSON.stringify(manifest.modelBundles)),'2087180cfa9544d079697195186988f0b09ff095f193a6280008042e1416624b');
  assert.equal(sha(JSON.stringify(manifest.regionalScopes)),'6b42694d072364a93835cd98af9484e0ceace62e9658cb5cef4bd123652f6d55');
  assert.equal(manifest.region,'head-neck');
  assert.equal(manifest.structures,291);
  assert.equal(manifest.nestedSelections,77);
  assert.equal(new Set(manifest.regionalIds).size,291);
  assert.equal(new Set(manifest.nestedTargets.map(target=>target.structureId)).size,77);
  assert.deepEqual(manifest.regionalScopes.map(scope=>[scope.region,scope.regionalIds.length,scope.nestedTargets.length]),
    [['head-neck',291,77],['thorax',158,11],['abdomen',106,16],['pelvis',82,4],['spine',115,0],['shoulder-arm',115,0],['forearm',86,0],['hand',124,0],['thigh',95,4],['leg',76,4],['foot',122,0],['whole-body',1104,108]]);
  for(const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);

  const found=[];
  async function walk(base,prefix=''){
    for(const entry of await readdir(base,{withFileTypes:true})){
      assert(!entry.isSymbolicLink());
      if(entry.isDirectory())await walk(new URL(entry.name+'/',base),prefix+entry.name+'/');
      else found.push(prefix+entry.name);
    }
  }
  await walk(runtime);
  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map(file=>file.path)].sort());
  assert.equal(found.filter(path=>path.endsWith('.glb')).length,136);
  for(const file of manifest.files){
    assert(!file.path.includes('..')&&!file.path.startsWith('/'));
    assert(!/\.(dcm|nii|nrrd|stl|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(file.path));
    const bytes=await readFile(new URL(file.path,runtime));
    assert.equal(bytes.length,file.bytes,file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
  }
  for(const bundle of manifest.modelBundles){
    const bytes=await readFile(new URL(bundle.url.split('?')[0].slice(1),runtime));
    assert.equal(bytes.length,bundle.bytes,bundle.url);
    assert.equal(sha(bytes),bundle.sha256,bundle.url);
  }
  const html=await readFile(new URL('index.html',runtime),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert(match[1].startsWith('/atlas-runtime/head-neck/'));
    await readFile(new URL(match[1].slice('/atlas-runtime/head-neck/'.length),runtime));
  }
  const deps=JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));
  const notices=await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');
  assert(deps.length>10);
  for(const dep of deps){
    assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(dep.license));
    assert(notices.includes(dep.name+'@'+dep.version));
  }
  const credits=await readFile(new URL('models/bodyparts3d/credits.html',runtime),'utf8');
  assert(credits.includes('The Database Center for Life Science')&&credits.includes('CC Attribution 4.0'));
  for(const match of credits.matchAll(/href="([^"]+)"/g)){
    if(match[1].startsWith('https:'))continue;
    if(match[1].startsWith('/'))assert.equal(match[1],'/atlas');
    else await readFile(new URL(match[1],new URL('models/bodyparts3d/',runtime)));
  }
});
