import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {planRegionalUpgrade,prepareRegionalUpgrade} from './prepare-regional-upgrade.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const modules=['shoulder','female-pelvis','lower-limb','head-neck'];
const json=v=>JSON.stringify(v,null,2)+'\n';
function glb(n){const b=Buffer.alloc(16,n);b.write('glTF');b.writeUInt32LE(2,4);b.writeUInt32LE(16,8);return b;}
async function makeModule(root,extra=false){
  await mkdir(join(root,'models'),{recursive:true});await mkdir(join(root,'LICENSES'));
  const files=[];
  for(const [path,bytes] of [['LICENSES/THIRD_PARTY_NOTICES.md',Buffer.from('Synthetic test fixture; no anatomy.')],['models/base.glb',glb(1)],...(extra?[['models/addition.glb',glb(2)]]:[])]){
    await writeFile(join(root,path),bytes);files.push({path,bytes:bytes.length,sha256:sha(bytes)});
  }
  const manifest={schemaVersion:2,sourceCommit:(extra?'b':'a').repeat(40),patientDataIncluded:false,clinicalApproved:false,standaloneReviewConnection:false,imagingConnection:false,
    regionalScopes:[{region:'whole-body',sourceVersion:'fixture',license:'CC0',regionalIds:['base',...(extra?['addition']:[])],nestedTargets:[{structureId:'nested',sourceHash:'a'.repeat(64)}],independentSpecimens:[{key:'independent',sourceHash:'b'.repeat(64)}]}],files};
  await writeFile(join(root,'manifest.json'),json(manifest));return manifest;
}
async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'vm-upgrade-test-')),website=join(root,'website'),candidate=join(root,'candidate');
  await mkdir(join(website,'lib'),{recursive:true});const sources=[];
  for(const module of modules){const manifest=await makeModule(join(website,'public/atlas-runtime',module));sources.push({module,sourceCommit:manifest.sourceCommit,manifestSha256:sha(json(manifest)),modelPaths:1});}
  await makeModule(candidate,true);
  const active={schemaVersion:1,purpose:'licensed-atlas-model-staging-only',learnerDelivery:'existing-static-assets',sources,models:[{sha256:sha(glb(1)),bytes:16,paths:modules.map(m=>`/atlas-runtime/${m}/models/base.glb`)}]};
  await writeFile(join(website,'lib/atlas-model-inventory.json'),json(active));return {root,website,candidate,output:join(root,'prepared')};
}
async function changeManifest(f,change){const path=join(f.candidate,'manifest.json'),m=JSON.parse(await readFile(path));change(m);await writeFile(path,json(m));}
test('full source comparison prepares only new hashes and does not activate delivery',async()=>{
  const f=await fixture(),active=await readFile(join(f.website,'lib/atlas-model-inventory.json'));
  const report=await prepareRegionalUpgrade(f);assert.equal(report.preservedModels,1);assert.equal(report.preservedPaths,4);assert.equal(report.proposedModels,2);assert.equal(report.proposedPaths,5);assert.equal(report.newModelBytes,16);
  assert.equal(report.storageVerified,false);assert.equal(report.deliveryActivated,false);assert.equal(report.clinicalApproved,false);
  assert.deepEqual(await readFile(join(f.output,'uploads/models/addition.glb')),glb(2));await assert.rejects(access(join(f.output,'uploads/models/base.glb')));
  assert.deepEqual(await readFile(join(f.website,'lib/atlas-model-inventory.json')),active);
  await assert.rejects(prepareRegionalUpgrade(f),{code:'EEXIST'});
});
for(const [name,change]of [
  ['patient data',m=>m.patientDataIncluded=true],['clinical approval',m=>m.clinicalApproved=true],
  ['imaging connection',m=>m.imagingConnection=true],['missing notice',m=>m.files=m.files.filter(f=>!f.path.includes('NOTICES'))],
  ['duplicate path',m=>m.files.push(m.files[0])],['path traversal',m=>m.files[0].path='../private-scan.dcm'],
  ['missing original geometry',m=>m.files=m.files.filter(f=>f.path!=='models/base.glb')],
  ['missing region',m=>m.regionalScopes=[]],['missing original root selection',m=>m.regionalScopes[0].regionalIds=['addition']],
  ['changed nested source',m=>m.regionalScopes[0].nestedTargets[0].sourceHash='c'.repeat(64)],['missing independent specimen',m=>m.regionalScopes[0].independentSpecimens=[]],
])test('rejects '+name+' before writing',async()=>{const f=await fixture();await changeManifest(f,change);await assert.rejects(prepareRegionalUpgrade(f));await assert.rejects(access(f.output));});
test('rejects corrupted companion and unlisted file',async()=>{
  const f=await fixture();await writeFile(join(f.candidate,'LICENSES/THIRD_PARTY_NOTICES.md'),'changed');await assert.rejects(planRegionalUpgrade(f),/size changed|hash changed/);
  const g=await fixture();await writeFile(join(g.candidate,'models/unlisted.glb'),glb(3));await assert.rejects(planRegionalUpgrade(g),/Unlisted/);
});
test('rejects changed original bytes even with a matching new manifest',async()=>{
  const f=await fixture();await writeFile(join(f.candidate,'models/base.glb'),glb(3));await changeManifest(f,m=>m.files.find(e=>e.path==='models/base.glb').sha256=sha(glb(3)));await assert.rejects(planRegionalUpgrade(f),/Existing geometry changed/);
});
test('rejects an active inventory not bound to its real manifests',async()=>{
  const f=await fixture(),path=join(f.website,'lib/atlas-model-inventory.json'),data=JSON.parse(await readFile(path));data.models[0].sha256='0'.repeat(64);await writeFile(path,json(data));await assert.rejects(planRegionalUpgrade(f),/Active inventory/);
});
test('rejects output inside either input, including a junction alias',async()=>{
  const f=await fixture();for(const parent of [f.website,f.candidate])await assert.rejects(prepareRegionalUpgrade({...f,output:join(parent,'prepared')}),/Output cannot/);
  const alias=join(f.root,'alias');await symlink(f.website,alias,'junction');await assert.rejects(prepareRegionalUpgrade({...f,output:join(alias,'prepared')}),/Output cannot/);
});
