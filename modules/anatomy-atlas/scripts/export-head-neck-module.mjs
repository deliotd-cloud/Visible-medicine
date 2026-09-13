import {readFile,writeFile,mkdir,copyFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {headNeckModuleInputs,root,sha} from './head-neck-module-inputs.mjs';
const target=resolve(process.argv[2]??'');
if(!process.argv[2] || !target.replaceAll('\\','/').endsWith('/public/atlas-runtime/head-neck'))throw Error('Choose an explicit website public/atlas-runtime/head-neck destination');
try{await lstat(target);throw Error('Destination exists; preserve it before exporting');}catch(e){if(e.code!=='ENOENT')throw e;}
if(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim())throw Error('Commit and verify the Atlas before exporting');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const build=join(root,'.sites-runtime/head-neck-module');
const inputs=JSON.parse(await readFile(join(build,'source-inputs.json'),'utf8'));
for(const required of ['app/body-explorer.tsx','app/body-scene.tsx','app/eye-layers.tsx','app/ventricles.tsx','app/femoral-components.tsx','app/atlas-workspace.tsx','app/study-links.tsx','lib/model-delivery.ts','integration/head-neck/delivery.ts','integration/head-neck/regions.ts']){
  if(!inputs.some(i=>i.path===required))throw Error('Missing source binding: '+required);
}
for(const input of inputs){
  if(input.path.includes('..') || input.path.startsWith('/') || input.path.includes(':') || input.path.includes('\\'))throw Error('Unsafe input');
  if(sha(await readFile(join(root,input.path)))!==input.sha256)throw Error('Stale build: '+input.path);
}
const {plan,models}=await headNeckModuleInputs(true);
const primary=plan.scopes.find(s=>s.region===plan.defaultRegion);
if(!primary)throw Error('Default scope missing');
const generated=['index.html','BUNDLED_NOTICES.txt','bundled-dependencies.json','source-inputs.json',...(await readdir(join(build,'assets'))).map(n=>'assets/'+n)];
if(generated.some(n=>!/^(?:index\.html|BUNDLED_NOTICES\.txt|(?:bundled-dependencies|source-inputs)\.json|assets\/[a-zA-Z0-9_.-]+\.(?:js|css))$/.test(n)))throw Error('Unexpected generated file');
const copies=[...generated.map(n=>[join(build,n),n]),...models.map(m=>[m.file,m.path])];
for(const path of ['models/bodyparts3d/full-body/catalog.json','brand/visible-medicine-lockup-dark.png','brand/visible-medicine-lockup-light.png'])copies.push([join(root,'public',path),path]);
for(const path of ['LICENSE','LICENSES/THIRD_PARTY_NOTICES.md','LICENSES/CC-BY-4.0.txt','LICENSES/BODYPARTS3D.md','LICENSES/BODYPARTS3D_FULL_BODY.md','LICENSES/bodyparts3d-license-evidence.html'])copies.push([join(root,path),path]);
copies.push([join(root,'integration/head-neck/credits.html'),'models/bodyparts3d/credits.html']);
const records=[];
for(const [from,name]of copies){
  if(!(await lstat(from)).isFile())throw Error('Regular files only');
  const bytes=await readFile(from),to=join(target,name);
  if(relative(target,to).startsWith('..'))throw Error('Unsafe output');
  await mkdir(resolve(to,'..'),{recursive:true});await copyFile(from,to);
  records.push({path:name,bytes:bytes.length,sha256:sha(bytes)});
}
await writeFile(join(target,'manifest.json'),JSON.stringify({schemaVersion:2,sourceCommit,region:plan.defaultRegion,sourceVersion:plan.sourceVersion,
  regionalIds:primary.regionalIds,nestedTargets:primary.nestedTargets,structures:primary.regionalIds.length,nestedSelections:primary.nestedTargets.length,
  regionalScopes:plan.scopes,sharedRegionalStructures:new Set(plan.scopes.flatMap(s=>s.regionalIds)).size,
  patientDataIncluded:false,clinicalApproved:false,standaloneReviewConnection:false,imagingConnection:false,
  modelBundles:plan.bundles,files:records},null,2)+'\n');
console.log(JSON.stringify({sourceCommit,scopes:plan.scopes.map(s=>({region:s.region,structures:s.regionalIds.length,nestedSelections:s.nestedTargets.length})),files:records.length,bytes:records.reduce((n,f)=>n+f.bytes,0),patientDataIncluded:false}));
