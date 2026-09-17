// Offline preparation only: never upload, activate delivery, or modify a website.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,lstat,realpath,readdir,constants} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const modules = ['shoulder','female-pelvis','lower-limb','head-neck'];
const inside = (root,path) => {const rel=relative(root,path);assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Path escaped its source');return rel;};
async function listedFiles(root,prefix='') {
  const files=[];
  for(const entry of await readdir(resolve(root,prefix),{withFileTypes:true})){
    assert(!entry.isSymbolicLink(),'Symlinks are not accepted');
    const name=prefix+entry.name;
    if(entry.isDirectory())files.push(...await listedFiles(root,name+'/'));
    else {assert(entry.isFile(),'Unexpected source entry');files.push(name);}
  }
  return files.sort();
}
async function checkedFile(root,name) {
  assert(/^[a-zA-Z0-9_./-]+$/.test(name)&&!name.split('/').some(p=>!p||p==='.'||p==='..'),'Unsafe manifest path');
  const file=resolve(root,name);inside(root,file);
  for(let path=file;path!==root;path=dirname(path))assert(!(await lstat(path)).isSymbolicLink(),'Symlinks are not accepted');
  assert((await lstat(file)).isFile(),'Expected regular file');inside(root,await realpath(file));
  return {file,bytes:await readFile(file)};
}
async function readModule(root,module) {
  root=await realpath(root);
  const manifestFile=await checkedFile(root,'manifest.json');
  const manifest=JSON.parse(manifestFile.bytes);
  assert.equal(manifest.patientDataIncluded,false,'Private-data declaration required');
  assert.equal(manifest.clinicalApproved,false,'Preparation must not carry clinical approval');
  assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  assert(Array.isArray(manifest.files)&&manifest.files.length>0);
  assert(manifest.files.some(f=>f.path==='LICENSES/THIRD_PARTY_NOTICES.md'),'Missing third-party notices');
  const seen=new Set(),models=[];
  for(const entry of manifest.files){
    assert(!seen.has(entry.path),'Duplicate companion path');seen.add(entry.path);
    const actual=await checkedFile(root,entry.path);
    assert.equal(actual.bytes.length,entry.bytes,'Companion size changed: '+entry.path);
    assert.equal(sha(actual.bytes),entry.sha256,'Companion hash changed: '+entry.path);
    if(!entry.path.endsWith('.glb'))continue;
    assert(/^models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.glb$/.test(entry.path),'Unregistered model path');
    assert(actual.bytes.length>=12&&actual.bytes.length<=32*1024*1024,'Model size outside staging limit');
    assert.equal(actual.bytes.toString('ascii',0,4),'glTF');assert.equal(actual.bytes.readUInt32LE(4),2);assert.equal(actual.bytes.readUInt32LE(8),actual.bytes.length);
    models.push({path:`/atlas-runtime/${module}/${entry.path}`,sha256:entry.sha256,bytes:entry.bytes,file:actual.file});
  }
  assert(models.length>0);
  assert.deepEqual(await listedFiles(root),['manifest.json',...seen].sort(),'Unlisted or missing module files');
  return {manifest,models,source:{module,sourceCommit:manifest.sourceCommit,manifestSha256:sha(manifestFile.bytes),modelPaths:models.length}};
}
function inventory(scopes,template){
  const records=new Map();
  for(const scope of scopes)for(const model of scope.models){
    const record=records.get(model.sha256)??{sha256:model.sha256,bytes:model.bytes,paths:[]};
    assert.equal(record.bytes,model.bytes);assert(!record.paths.includes(model.path));record.paths.push(model.path);records.set(model.sha256,record);
  }
  return {...template,sources:scopes.map(s=>s.source),models:[...records.values()].sort((a,b)=>a.sha256.localeCompare(b.sha256))};
}
export async function planRegionalUpgrade({website,candidate}){
  website=await realpath(website);candidate=await realpath(candidate);
  const stored=await checkedFile(website,'lib/atlas-model-inventory.json');
  const active=JSON.parse(stored.bytes);
  assert.equal(active.schemaVersion,1);assert.equal(active.purpose,'licensed-atlas-model-staging-only');
  const current=[];for(const module of modules)current.push(await readModule(resolve(website,'public/atlas-runtime',module),module));
  assert.deepEqual(inventory(current,active),active,'Active inventory does not match its complete manifests');
  const replacement=await readModule(candidate,'head-neck');
  assert.equal(replacement.manifest.schemaVersion,2);assert.equal(replacement.manifest.standaloneReviewConnection,false);assert.equal(replacement.manifest.imagingConnection,false);
  const old=current.find(s=>s.source.module==='head-neck');
  const scopes=replacement.manifest.regionalScopes;
  assert(Array.isArray(scopes)&&scopes.length>0&&new Set(scopes.map(s=>s.region)).size===scopes.length,'Invalid regional scope list');
  assert(Array.isArray(old.manifest.regionalScopes)&&old.manifest.regionalScopes.length>0);
  for(const prior of old.manifest.regionalScopes){
    const next=scopes.find(s=>s.region===prior.region);assert(next,'Existing region missing');
    assert.equal(next.sourceVersion,prior.sourceVersion);assert.equal(next.license,prior.license);
    assert(Array.isArray(next.regionalIds)&&new Set(next.regionalIds).size===next.regionalIds.length);
    for(const id of prior.regionalIds)assert(next.regionalIds.includes(id),'Existing regional anatomy missing');
    for(const key of ['nestedTargets','independentSpecimens']){
      assert(Array.isArray(next[key]));
      for(const item of prior[key])assert(next[key].some(n=>JSON.stringify(n)===JSON.stringify(item)),'Existing nested/specimen source changed or missing');
    }
  }
  for(const previous of old.models)assert(replacement.models.some(m=>m.path===previous.path&&m.sha256===previous.sha256&&m.bytes===previous.bytes),'Existing geometry changed or missing; requires separate review: '+previous.path);
  const proposed=inventory(current.map(s=>s===old?replacement:s),active);
  const additions=replacement.models.filter(m=>!active.models.some(p=>p.sha256===m.sha256));
  assert.equal(new Set(additions.map(m=>m.path)).size,additions.length);
  return {proposed,additions,report:{schemaVersion:1,purpose:'offline-regional-upgrade-preparation',
    atlasSource:replacement.manifest.sourceCommit,candidateManifestSha256:replacement.source.manifestSha256,
    activeInventorySha256:sha(stored.bytes),proposedInventorySha256:sha(JSON.stringify(proposed,null,2)+'\n'),
    preservedModels:active.models.length,preservedPaths:active.models.reduce((n,m)=>n+m.paths.length,0),
    proposedModels:proposed.models.length,proposedPaths:proposed.models.reduce((n,m)=>n+m.paths.length,0),
    candidateCompanions:replacement.manifest.files.length,newModelBytes:additions.reduce((n,m)=>n+m.bytes,0),
    additions:additions.map(({file,...record})=>record),sourceGeometryReplaced:false,
    storageVerified:false,deliveryActivated:false,clinicalApproved:false,patientDataIncluded:false,
    note:'Exact local bytes and notices only. New hashes require compile-time administrator staging registration, authenticated upload and full-byte verification before runtime activation. No authorization or clinical clearance is inferred.'}};
}
export async function prepareRegionalUpgrade({website,candidate,output}){
  const plan=await planRegionalUpgrade({website,candidate});output=resolve(output);
  output=resolve(await realpath(dirname(output)),basename(output));
  for(const source of [await realpath(website),await realpath(candidate)]){
    const rel=relative(source,output);assert(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||isAbsolute(rel),'Output cannot alter an input checkout');
  }
  // Validate everything before creating any output; never reuse or overwrite a directory.
  await mkdir(output); // Atomic refusal of an existing output; parent must already exist.
  for(const model of plan.additions){
    const name=model.path.replace('/atlas-runtime/head-neck/','');
    const destination=resolve(output,'uploads',name);inside(output,destination);await mkdir(dirname(destination),{recursive:true});
    await copyFile(model.file,destination,constants.COPYFILE_EXCL);assert.equal(sha(await readFile(destination)),model.sha256);
  }
  await writeFile(resolve(output,'proposed-inventory.json'),JSON.stringify(plan.proposed,null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(output,'readiness.json'),JSON.stringify(plan.report,null,2)+'\n',{flag:'wx'});
  return plan.report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.equal(process.argv.length,5,'Usage: node scripts/prepare-regional-upgrade.mjs WEBSITE CANDIDATE_MODULE NEW_OUTPUT');
  console.log(JSON.stringify(await prepareRegionalUpgrade({website:process.argv[2],candidate:process.argv[3],output:process.argv[4]})));
}
