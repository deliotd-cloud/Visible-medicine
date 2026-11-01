// Explicit reversible source seams; both complete original epochs remain authenticated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function authenticateColicRoleContext({pin,read,source}){
 const manifestBytes=read('atlas-review/manifest.json');
 const bindingBytes=read('atlas-review/integration-inputs.json');
 assert.equal(sha(manifestBytes),pin.documents['atlas-review/manifest.json']);
 assert.equal(sha(bindingBytes),pin.documents['atlas-review/integration-inputs.json']);
 const manifest=JSON.parse(manifestBytes),binding=JSON.parse(bindingBytes);
 assert.equal(manifest.revision,pin.source);assert.equal(binding.sourceCommit,pin.source);
 assert.equal(manifest.files.length,pin.reviewSourceFiles);
 assert.equal(manifest.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(binding.sha256,pin.reviewIntegration);
 assert.equal(sha(JSON.stringify(binding.inputs)),pin.reviewIntegration);
 assert.equal(new Set(binding.inputs.map(row=>row.path)).size,binding.inputs.length);
 assert.equal(new Set(manifest.files.map(row=>row.path)).size,manifest.files.length);
 const inputs=new Map(binding.inputs.map(row=>[row.path,row.sha256]));
 // These two revision records are deliberately outside their own binding digest.
 // Their complete imported bytes remain authenticated by the pinned manifest.
 const selfRecords=['content/body-renderer-revision.json','content/review-revisions.json'];
 assert.deepEqual(manifest.files.filter(row=>!inputs.has('atlas-review/'+row.path)).map(row=>row.path),selfRecords);
 for(const row of binding.inputs)
  assert.equal(sha(read(row.path)),row.sha256,pin.source+' binding input '+row.path);
 for(const row of manifest.files){
  assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,pin.source+' imported '+row.path);
  if(!selfRecords.includes(row.path))assert.equal(inputs.get('atlas-review/'+row.path),row.importedSha256,pin.source+' bound import '+row.path);
  assert.equal(sha(readFileSync(join(source,row.path))),row.sourceSha256,pin.source+' exact native source '+row.path);
 }
}
export const colicC32OriginalSha256="9d89e8670848650a0318014e3cb6e79aab74f5fa2cabfb252ca08da895590e99";
export const colicHistoricalRoleSeams=[
 [
  "import {createHash} from 'node:crypto';\n",
  "import {createHash} from 'node:crypto';\nimport {execFileSync} from 'node:child_process';\n"
 ],
 [
  "const website=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());\nconst source=resolve(process.env.VM_ATLAS_SOURCE_REPO ?? join(website,'..','atlas'));\n",
  "const currentWebsite=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());\nconst website=resolve('F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/website');\nconst source=resolve('F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas');\n"
 ],
 [
  "const sha=bytes=>createHash('sha256').update(bytes).digest('hex');\n",
  "const sha=bytes=>createHash('sha256').update(bytes).digest('hex');\nassert.equal(sha(readFileSync(join(website,'tests/current-atlas-delivery.mjs'))),\n '52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');\nassert.equal(sha(readFileSync(join(website,'tests/atlas-source-repo.mjs'))),\n '45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356');\nassert.equal(sha(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json'))),\n '3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');\n"
 ],
 [
  "const delivery=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);\n",
  "const delivery=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);\nconst currentDelivery=await import(pathToFileURL(join(currentWebsite,'tests/current-atlas-delivery.mjs')).href);\n"
 ],
 [
  " assert.equal(realpathSync(delivery.currentAtlasDeliveryRoot()),realpathSync(source));\n",
  " const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();\n assert.equal(git('rev-parse','HEAD'),current);assert.equal(git('rev-parse','HEAD^{tree}'),tree);\n assert.equal(git('status','--porcelain=v1'),'');\n const historicalRoot=execFileSync(process.execPath,['--input-type=module','-e',\n  `import {currentAtlasDeliveryRoot} from ${JSON.stringify(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href)};process.stdout.write(currentAtlasDeliveryRoot());`],\n  {encoding:'utf8',windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:source,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();\n assert.equal(realpathSync(historicalRoot),realpathSync(source));\n"
 ],
 [
  " assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:foreign,read}));\n});\n",
  " assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:foreign,read}));\n});\n\ntest('current c32 successor admits exact source while rejecting the historical colic pin',()=>{\n const latest=currentDelivery.validateCurrentAtlasDelivery();\n assert.equal(latest.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');\n assert.equal(latest.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');\n const configuredCurrent=resolve(process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas');\n assert.equal(realpathSync(currentDelivery.currentAtlasDeliveryRoot()),realpathSync(configuredCurrent));\n const currentGit=(...args)=>execFileSync('git',['-C',configuredCurrent,...args],\n  {encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();\n assert.equal(currentGit('rev-parse','HEAD'),latest.source);\n assert.equal(currentGit('rev-parse','HEAD^{tree}'),latest.sourceTree);\n assert.equal(currentGit('status','--porcelain=v1'),'');\n assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin,root:currentWebsite}),\n  'The exact historical 6d7 pin cannot admit the c32 website');\n const review=JSON.parse(readFileSync(join(currentWebsite,'atlas-review/manifest.json')));\n assert.equal(review.revision,latest.source);assert.equal(review.files.length,latest.reviewSourceFiles);\n for(const row of review.files)assert.equal(sha(readFileSync(join(currentWebsite,'atlas-review',row.path))),row.importedSha256,row.path);\n for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){\n  const manifest=JSON.parse(readFileSync(join(currentWebsite,'public/atlas-runtime',name,'manifest.json')));\n  assert.equal(manifest.sourceCommit,latest.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);\n  assert.equal(manifest.clinicalApproved,false);\n }\n const earlier=JSON.parse(read('atlas-review/content/regional-teaching/abdomen.json'));\n const later=JSON.parse(readFileSync(join(currentWebsite,'atlas-review/content/regional-teaching/abdomen.json')));\n for(const id of ids){\n  const lesson=(catalog)=>catalog.entries.find(row=>JSON.parse(row.identity).id===id)?.lessons.ultrasound;\n  assert.deepEqual(lesson(later),lesson(earlier),id+' retains the exact admitted colic teaching');\n  assert.equal(lesson(later).readiness,'draft');\n  assert.match(lesson(later).note,/radiologist review pending/i);\n }\n});\n"
 ]
];
export const colicCurrentEpochSeams=[
 [
  "import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';\n",
  "import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';\nimport {authenticateColicRoleContext} from './colic-role-contract-20261101.mjs';\n"
 ],
 [
  " assert.deepEqual(delivery.validateCurrentAtlasDelivery({pin,read}),pin);\n",
  " assert.deepEqual(delivery.validateCurrentAtlasDelivery({pin,read}),pin);\n authenticateColicRoleContext({pin,read,source});\n"
 ],
 [
  "test('current c32 successor admits exact source while rejecting the historical colic pin',()=>{\n",
  "test('current 0d975 successor admits exact source while rejecting the historical colic pin',()=>{\n"
 ],
 [
  " assert.equal(latest.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');\n assert.equal(latest.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');\n",
  " assert.equal(latest.source,'0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66');\n assert.equal(latest.sourceTree,'495d07f5d9aff482dae7c9c30a962acaa7947b50');\n assert.equal(latest.reviewIntegration,'3b6be0f5de52aef8de09e40ac8126aa6ade717d97246d1fbb5dd04012ed25fad');\n assert.equal(latest.reviewSourceFiles,1683);\n assert.equal(latest.viewerFiles,63);assert.equal(latest.viewerPackages,24);\n assert.deepEqual(latest.runtimeSources,{'head-neck':latest.source,\n  shoulder:'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3',\n  'lower-limb':'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3',\n  'female-pelvis':'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'});\n"
 ],
 [
  " assert.equal(currentGit('status','--porcelain=v1'),'');\n",
  " assert.equal(currentGit('status','--porcelain=v1'),'');\n const readCurrent=path=>readFileSync(join(currentWebsite,path));\n authenticateColicRoleContext({pin:latest,read:readCurrent,source:configuredCurrent});\n"
 ],
 [
  "  'The exact historical 6d7 pin cannot admit the c32 website');\n",
  "  'The exact historical 6d7 pin cannot admit the 0d975 website');\n"
 ]
];
