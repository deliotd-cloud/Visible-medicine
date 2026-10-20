// Exercise the actual replay helper; no application, scan or clinical fixtures.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {basename,dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';

const website=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rendererPath='content/body-renderer-revision.json';
const documents=['atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/'+rendererPath];
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const save=(path,value)=>writeFileSync(path,JSON.stringify(value)+'\n');

async function context(root,edit,check){
 const beforeCwd=process.cwd(),beforeRoot=process.env.VM_ATLAS_SOURCE_REPO;
 const base=resolve(website,'.local/atlas-history-root-assurance');mkdirSync(base,{recursive:true});
 const fixture=mkdtempSync(base+'/case-');
 try{
  for(const path of documents){mkdirSync(dirname(fixture+'/'+path),{recursive:true});copyFileSync(website+'/'+path,fixture+'/'+path);}
  if(edit)edit(fixture);
  process.env.VM_ATLAS_SOURCE_REPO=root;process.chdir(fixture);
  await check();
 }finally{
  process.chdir(beforeCwd);
  if(beforeRoot===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;else process.env.VM_ATLAS_SOURCE_REPO=beforeRoot;
  const local=relative(realpathSync(base),realpathSync(fixture));
  assert(local===basename(fixture)&&/^case-[a-zA-Z0-9]+$/.test(local)&&!local.includes(sep));
  rmSync(fixture,{recursive:true});
 }
}

// Rebind only these synthetic engineering documents so the rejection is reached
// after the renderer checks, rather than merely failing an earlier stale digest.
function rebindInputs(fixture,change){
 const manifest=load(fixture+'/atlas-review/manifest.json');
 const integration=load(fixture+'/atlas-review/integration-inputs.json');
 const renderer=load(fixture+'/atlas-review/'+rendererPath);
 change(integration.inputs);
 integration.sha256=sha(JSON.stringify(integration.inputs));
 manifest.websiteIntegrationSha256=integration.sha256;
 renderer.websiteIntegrationSha256=integration.sha256;
 renderer.sha256=sha(JSON.stringify({source:renderer.sourceRendererSha256,website:integration.sha256}));
 const rendererBytes=JSON.stringify(renderer)+'\n';
 manifest.files.find(file=>file.path===rendererPath).importedSha256=sha(rendererBytes);
 writeFileSync(fixture+'/atlas-review/'+rendererPath,rendererBytes);
 save(fixture+'/atlas-review/manifest.json',manifest);
 save(fixture+'/atlas-review/integration-inputs.json',integration);
}

test('bound replay uses the configured exact Atlas root and keeps all early refusal gates',async t=>{
 const root=currentAtlasDeliveryRoot();
 await t.test('invalid revision is rejected before source replay',()=>context(root,null,()=>assert.rejects(boundLiveAtlasHistory('HEAD'),error=>{
  assert.equal(error.code,'ERR_ASSERTION');assert.equal(error.operator,'match');
  assert.equal(error.actual,'HEAD');assert.equal(error.expected.source,'^[a-f0-9]{40}$');return true;
 })));
 await t.test('a different requested revision is rejected by the configured source',()=>context(root,null,()=>assert.rejects(boundLiveAtlasHistory('0'.repeat(40)),/Atlas source revision changed/)));
 await t.test('an in-repository subdirectory cannot masquerade as the root',()=>context(root+'/content',null,()=>assert.rejects(boundLiveAtlasHistory(CURRENT_ATLAS_REVISION),/Atlas source must be its repository root/)));
 await t.test('modified imported renderer bytes are refused',()=>context(root,fixture=>{
  const path=fixture+'/atlas-review/'+rendererPath;writeFileSync(path,readFileSync(path,'utf8')+' ');
 },()=>assert.rejects(boundLiveAtlasHistory(CURRENT_ATLAS_REVISION),{code:'ERR_ASSERTION'})));
 await t.test('forged integration inputs are refused even with an unchanged claimed digest',()=>context(root,fixture=>{
  const path=fixture+'/atlas-review/integration-inputs.json',value=load(path);value.inputs=[];save(path,value);
 },()=>assert.rejects(boundLiveAtlasHistory(CURRENT_ATLAS_REVISION),{code:'ERR_ASSERTION'})));
 await t.test('duplicate input paths are refused after coherent synthetic binding',()=>context(root,fixture=>rebindInputs(fixture,inputs=>inputs.push({...inputs[0]})),()=>assert.rejects(boundLiveAtlasHistory(CURRENT_ATLAS_REVISION),{code:'ERR_ASSERTION'})));
 await t.test('traversal input paths are refused after coherent synthetic binding',()=>context(root,fixture=>rebindInputs(fixture,inputs=>{inputs[0]={...inputs[0],path:'../outside-website'};}),()=>assert.rejects(boundLiveAtlasHistory(CURRENT_ATLAS_REVISION),{code:'ERR_ASSERTION'})));
});
