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
const pelvisSource={version:'v1.10',url:'https://example.test/hra.glb',metadataUrl:'https://example.test/metadata.json',crosswalkUrl:'https://example.test/crosswalk.csv',sha256:'1'.repeat(64),bytes:100,metadataSha256:'2'.repeat(64),crosswalkSha256:'3'.repeat(64),credit:'Synthetic HRA fixture',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'};
async function addManifestFile(root,manifest,path,bytes){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),bytes);manifest.files.push({path,bytes:bytes.length,sha256:sha(bytes)});}
async function pelvisFixture(){
  const f=await fixture(),candidatePath=join(f.candidate,'manifest.json'),candidate=JSON.parse(await readFile(candidatePath));
  const pelvisBytes=glb(4),renalBytes=glb(5),pelvisBundle={id:'pelvis-bundle',url:'/models/hra-pelvis/pelvis.glb?v='+sha(pelvisBytes).slice(0,12),sha256:sha(pelvisBytes),bytes:pelvisBytes.length,structures:41};
  const renalBundle={id:'renal-bundle',url:'/models/hra-renal/kidneys.glb?v='+sha(renalBytes).slice(0,12),sha256:sha(renalBytes),bytes:renalBytes.length,structures:2};
  const matrix=[.01,0,0,0,0,0,-.01,0,0,.01,0,0,0,0,0,1],pelvisStructures=Array.from({length:41},(_,i)=>({id:`pelvis-${i}`,sourceName:`pelvis-${i}`}));
  const renalStructures=[{id:'right-ureter',sourceName:'VH_F_right_ureter'},{id:'left-ureter',sourceName:'VH_F_left_ureter'}];
  const pelvis={specimenId:'hra-united-female-v1.10-pelvis',source:{...pelvisSource,key:'hra-united-female-v1.10-pelvis'},sourceFrame:'hra-united-female-v1.10:lps-mm',displayTransformColumnMajor:matrix,structures:pelvisStructures,bundles:[pelvisBundle]};
  const renal={specimenId:'hra-united-female-v1.10-kidneys',source:{...pelvisSource,key:'hra-united-female-v1.10-kidneys'},sourceFrame:pelvis.sourceFrame,displayTransformColumnMajor:matrix,structures:renalStructures,bundles:[renalBundle]};
  for(const[path,bytes]of [['models/hra-pelvis/pelvis.glb',pelvisBytes],['models/hra-renal/kidneys.glb',renalBytes],['models/hra-pelvis/catalog.json',Buffer.from(json(pelvis))],['models/hra-renal/catalog.json',Buffer.from(json(renal))]])await addManifestFile(f.candidate,candidate,path,bytes);
  const prior={key:pelvis.specimenId,label:'Female pelvis',license:'CC BY 4.0',surfaceIds:pelvisStructures.map(s=>s.id),studyIds:['overview','all','uterus','adnexa-left','adnexa-right','supports','vessels','neighbours'],sourceFrame:{sourceToSceneColumnMajor:matrix,unitsPerMillimetre:.01},bundles:[pelvisBundle]};
  candidate.regionalScopes[0].independentSpecimens=[{...prior,surfaceIds:[...prior.surfaceIds,...renalStructures.map(s=>s.id)],studyIds:[...prior.studyIds,'urinary','urinary-left','urinary-right'],bundles:[...prior.bundles,renalBundle]}];
  await writeFile(candidatePath,json(candidate));
  const activeHead=join(f.website,'public/atlas-runtime/head-neck/manifest.json'),activeManifest=JSON.parse(await readFile(activeHead));activeManifest.regionalScopes[0].independentSpecimens=[prior];await writeFile(activeHead,json(activeManifest));
  const inventoryPath=join(f.website,'lib/atlas-model-inventory.json'),inventory=JSON.parse(await readFile(inventoryPath));const source=inventory.sources.find(s=>s.module==='head-neck');source.manifestSha256=sha(json(activeManifest));await writeFile(inventoryPath,json(inventory));
  return f;
}
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
test('accepts only the reviewed exact pelvic urinary addition',async()=>{
  const f=await pelvisFixture(),plan=await planRegionalUpgrade(f);assert.equal(plan.report.storageVerified,false);assert.equal(plan.report.deliveryActivated,false);
});
test('still accepts an exactly unchanged pelvic specimen in later upgrades',async()=>{
  const f=await pelvisFixture();
  const active=JSON.parse(await readFile(join(f.website,'public/atlas-runtime/head-neck/manifest.json')));
  await changeManifest(f,m=>{m.regionalScopes[0].independentSpecimens=active.regionalScopes[0].independentSpecimens;});
  await assert.doesNotReject(planRegionalUpgrade(f));
});
for(const [name,change]of [
  ['changed existing pelvic ID',s=>{s.surfaceIds[0]='changed';}],
  ['changed existing pelvic study',s=>{s.studyIds[0]='changed';}],
  ['changed existing pelvic bundle',s=>{s.bundles[0].sha256='0'.repeat(64);}],
  ['changed pelvic source frame',s=>{s.sourceFrame.unitsPerMillimetre=1;}],
  ['changed pelvic licence',s=>{s.license='CC0-1.0';}],
  ['unapproved added pelvic ID',s=>{s.surfaceIds.push('other-addition');}],
  ['changed appended study',s=>{s.studyIds[s.studyIds.length-1]='urinary-other';}],
  ['changed appended renal bundle',s=>{s.bundles.at(-1).sha256='0'.repeat(64);}],
])test('rejects pelvic transition with '+name,async()=>{const f=await pelvisFixture();await changeManifest(f,m=>change(m.regionalScopes[0].independentSpecimens[0]));await assert.rejects(planRegionalUpgrade(f));});
