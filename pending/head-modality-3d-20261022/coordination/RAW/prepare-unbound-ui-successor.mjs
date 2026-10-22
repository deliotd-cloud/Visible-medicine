// Reusable local UI snapshotter: additions cannot alter the bound Review renderer or dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const held=new Map([['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac']]);
export function validateUiPlan(plan,source,boundPaths){
 assert.equal(typeof plan.root,'string');assert(/^F:\/VisibleMedicine\/staging\/[a-z0-9-]+$/.test(plan.root),'New explicit F staging root');
 assert.equal(path.resolve(plan.root).toLowerCase(),plan.root.replaceAll('/',path.sep).toLowerCase(),'No traversal or unresolved roots');
 assert.equal(typeof plan.sourceReceipt,'string');assert(path.isAbsolute(plan.sourceReceipt));assert.match(plan.sourceReceiptSha256,/^[a-f0-9]{64}$/);
 assert.match(plan.canonicalHead,/^[a-f0-9]{40}$/);assert.match(plan.atlasHead,/^[a-f0-9]{40}$/);
 assert(source.website.startsWith('F:/VisibleMedicine/staging/')&&source.website.endsWith('/website'));
 assert(Array.isArray(plan.overlays)&&plan.overlays.length>0&&plan.overlays.length<=12);
 assert.equal(new Set(plan.overlays.map(row=>row.path)).size,plan.overlays.length);
 for(const row of plan.overlays){
  assert(/^(components\/[A-Za-z0-9-]+\.(?:tsx|css)|tests\/[a-z0-9-]+\.(?:test\.)?(?:mjs|ts))$/.test(row.path),'Only explicit authored UI/test sources');
  assert(!['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs'].includes(row.path),'No current validator changes');
  assert(!boundPaths.has(row.path),'Use a real producer/rebind workflow for a bound source: '+row.path);
  assert(typeof row.code==='string'&&row.code.startsWith('F:/VisibleMedicine/staging/')&&row.code.includes('/CODE/'));
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  const prior=source.sourceRows.find(item=>item.path===row.path);
  if(prior){assert.equal(row.beforeSha256,prior.sha256);assert(typeof row.before==='string'&&row.before.includes('/RAW/'));}
  else{assert.equal(row.beforeSha256,null);assert(row.path.startsWith('tests/'),'New product modules require their own import/licence review');}
 }
 return true;
}
export function prepareUiSuccessor(planPath){
 assert(path.isAbsolute(planPath));const plan=json(planPath),source=json(plan.sourceReceipt);
 assert.equal(sha(read(plan.sourceReceipt)),plan.sourceReceiptSha256);
 const binding=json(source.website+'/atlas-review/integration-inputs.json'),boundPaths=new Set(binding.inputs.map(row=>row.path));
 validateUiPlan(plan,source,boundPaths);assert(!fs.existsSync(plan.root),'Create only; never overwrite a previous snapshot');
 const canonical='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas',website=plan.root+'/website';
 assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),plan.canonicalHead);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),plan.atlasHead);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
 const expected=new Map();
 for(const row of source.sourceRows){
  containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
  if(held.has(row.path))assert.equal(row.sha256,held.get(row.path));
  else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime state copied: '+row.path);
  expected.set(row.path,{...row,from:source.website+'/'+row.path});
 }
 for(const row of plan.overlays){
  const b=read(row.code);assert.equal(sha(b),row.sha256);assert.deepEqual(Buffer.from(b.toString('utf8')),b);
  if(row.beforeSha256){assert.equal(sha(read(row.before)),row.beforeSha256);assert.deepEqual(read(row.before),read(source.website+'/'+row.path));}
  expected.set(row.path,{path:row.path,bytes:b.length,sha256:sha(b),from:row.code});
 }
 for(const row of binding.inputs)assert.equal(sha(read(expected.get(row.path).from)),row.sha256,'All bound input bytes unchanged: '+row.path);
 fs.mkdirSync(plan.root);runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
 for(const row of expected.values()){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256);}
 fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,plan.root+'/atlas','junction');
 for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,'Frozen predecessor: '+row.path);
 const sourceRows=[...expected.values()].map(({from,...row})=>row).sort((a,b)=>a.path.localeCompare(b.path));
 const result={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:source.review,previousSource:plan.sourceReceipt,previousSourceSha256:plan.sourceReceiptSha256,
  changedProductPaths:plan.overlays.filter(row=>row.path.startsWith('components/')).map(row=>row.path),changedTestPaths:plan.overlays.filter(row=>row.path.startsWith('tests/')).map(row=>row.path),
  boundInputs:binding.inputs.length,reviewBindingUnchanged:true,privateRuntimeStateCopied:false,controlledHeldSourceAssetsLocalOnly:true,
  nativeAccepted:false,typesPassed:false,websiteBuilt:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
 fs.writeFileSync(plan.root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({sourceReceipt:plan.root+'/SOURCE.json',sha256:sha(read(plan.root+'/SOURCE.json')),sourcePaths:sourceRows.length,reviewBindingUnchanged:true,ownerPreviewChanged:false}));return result;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)prepareUiSuccessor(process.argv[2]);
