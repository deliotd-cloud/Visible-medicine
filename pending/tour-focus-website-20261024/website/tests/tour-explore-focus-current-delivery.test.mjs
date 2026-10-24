import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const parent='F:/VisibleMedicine/staging/20261024-tour-explore-website/website';
const parentReceipt='F:/VisibleMedicine/staging/20261024-tour-explore-website/SOURCE_BOUND.json';
const nativeReceipt='F:/VisibleMedicine/staging/20261024-tour-explore-focus/SOURCE_BOUND.json';
const atlas='F:/VisibleMedicine/staging/20261024-tour-explore-focus/atlas';
const source='cf9b5091db90219981929f6a9cbfdf1056bac9d6';
const tree='927b2ba6fed5e1ca5d4c7eb6f362903213f6a779';
const previous='5e75b9ce7e46fed291748108edd7565c97dee101';
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const changed=['app/body-explorer.tsx','app/tour-explore-attention.tsx'];
const stable=['app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx',
 'lib/tour-explore.ts','lib/reasoning-questions.ts','lib/lower-arterial-reasoning.ts',
 'content/lower-arterial-reasoning-pins.json'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(root,path)=>readFileSync(resolve(root,path));
const json=(root,path)=>JSON.parse(read(root,path));
const committed=path=>execFileSync('git',['show',`${source}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceRow=(receipt,path)=>{
 const row=receipt.sourceRows.find(row=>row.path===path);
 assert(row,`Source receipt omits ${path}`);
 return row;
};

test('cf9b delivery binds every learner, protected Review, and the unchanged source guards',()=>{
 assert.equal(sha(readFileSync(nativeReceipt)),'135d808650bd4646cbcd0216fc4d028f8daca35a9502f2258d26fc982016fc04');
 assert.equal(sha(readFileSync(parentReceipt)),'014cbdb76e216f2a6e64f2feddac63126517111bc8e093e0cd41ed984c8c1c80');
 const receipt=JSON.parse(readFileSync(nativeReceipt));
 const parentBound=JSON.parse(readFileSync(parentReceipt));
 const pin=validateCurrentAtlasDelivery();
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.parentHead,previous);assert.equal(parentBound.atlasHead,previous);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,encoding:'utf8',windowsHide:true}).trim(),source);
 assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:atlas,encoding:'utf8',windowsHide:true}).trim(),tree);
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.equal(receipt.modelsDependenciesLicencesSourceHoldsUnchanged,true);
 assert.equal(receipt.all1104Worksheets9936Topics222Concepts404SessionsPreserved,true);
 assert.equal(receipt.clinicalApproval,false);assert.equal(receipt.patientSpaceRegistration,false);
 assert.equal(receipt.installed,false);

 const review=json(site,'atlas-review/manifest.json');
 const binding=json(site,'atlas-review/integration-inputs.json');
 const viewer=json(site,'public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,source);assert.equal(binding.sourceCommit,source);
 assert.equal(review.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(review.files.length,pin.reviewSourceFiles);
 for(const module of modules){
  const base=`public/atlas-runtime/${module}`;
  const manifest=json(site,`${base}/manifest.json`);
  assert.equal(pin.runtimeSources[module],source,module);
  assert.equal(manifest.sourceCommit,source,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.notEqual(manifest.clinicalApproved,true,module);
 }
 const learnerInputs=json(site,'public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of changed)
  assert.equal(learnerInputs.find(row=>row.path===path)?.sha256,sha(committed(path)),`Shared learner: ${path}`);
 const headManifest=json(site,'public/atlas-runtime/head-neck/manifest.json');
 const emitted=emittedTeachingSearch(resolve(site,'public/atlas-runtime/head-neck')+'/',headManifest.files);
 assert(emitted.includes('visibilitychange'),'Shared learner omitted queued focus cancellation');
 assert(emitted.includes('data-structure-study-heading'),'Shared learner omitted target heading');
 for(const path of changed){
  const bytes=committed(path),imported=read(site,`atlas-review/${path}`);
  const row=review.files.find(row=>row.path===path);
  assert.equal(sha(bytes),sourceRow(receipt,path).sha256,path);
  assert.equal(row?.sourceSha256,sha(bytes),path);
  assert.equal(row?.importedSha256,sha(imported),path);
  assert.equal(binding.inputs.find(row=>row.path===`atlas-review/${path}`)?.sha256,sha(imported),path);
  assert.equal(imported.toString().replaceAll('\r\n','\n').replaceAll('@/atlas-review/','@/'),
   bytes.toString().replaceAll('\r\n','\n'),`Only documented import prefix may change: ${path}`);
 }
 const protectedViewer=emittedTeachingSearch(resolve(site,'public/atlas-review-viewer')+'/',viewer.files);
 assert(protectedViewer.includes('visibilitychange'),'Protected viewer omitted queued focus cancellation');
 assert(protectedViewer.includes('data-structure-study-heading'),'Protected viewer omitted target heading');
 for(const path of stable){
  const now=read(site,`atlas-review/${path}`),before=read(parent,`atlas-review/${path}`);
  assert.equal(sha(now),sha(before),`Unchanged teaching and source guard: ${path}`);
 }
 assert.deepEqual(read(site,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'),
  read(parent,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const inventory=json(site,'lib/atlas-model-inventory.json');
 assert.deepEqual(inventory.models,json(parent,'lib/atlas-model-inventory.json').models);
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(row=>row.paths).length,144);
});

test('current validator refuses the parent epoch, mixed records, tampering and approval claims',()=>{
 const pin=validateCurrentAtlasDelivery();
 const old=json(parent,'tests/fixtures/current-atlas-delivery.json');
 assert.equal(old.source,previous);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old,root:site}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:previous}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,runtimeSources:{...pin.runtimeSources,shoulder:previous}}}));
 const target='public/atlas-runtime/head-neck/manifest.json';
 for(const [key,value] of [['patientDataIncluded',true],['clinicalApproved',true]]){
  const forged=json(site,target);forged[key]=value;
  const forgedBytes=Buffer.from(JSON.stringify(forged));
  const readForged=path=>path===target?forgedBytes:read(site,path);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read:readForged}),`Tampered ${key} hash refused`);
  const rehashed={...pin,documents:{...pin.documents,[target]:sha(forgedBytes)}};
  assert.throws(()=>validateCurrentAtlasDelivery({pin:rehashed,read:readForged}),`Forged ${key} clearance refused`);
 }
});

test('the imported production focus helper targets its own panel without page scroll',async()=>{
 const require=createRequire(import.meta.url);
 const {build}=require('esbuild');
 // Compile the real dependency graph and its CSS in memory, not a substitute.
 const result=await build({stdin:{contents:"export {revealTourExploreHeading} from './atlas-review/app/tour-explore-attention';",
  loader:'tsx',resolveDir:site},bundle:true,write:false,format:'cjs',platform:'node',
  outdir:resolve(site,'.local/tour-focus-test-output')});
 const script=result.outputFiles.find(file=>file.path.endsWith('.js'));
 assert(script,'Actual imported helper compiled with its original dependencies');
 const mod={exports:{}};
 runInNewContext(script.text,{module:mod,exports:mod.exports,
  require,process,structuredClone,document:{hidden:false}});
 const calls=[];
 const panel={scrollTop:0,getBoundingClientRect:()=>({top:0,bottom:100})};
 const info={isConnected:true,closest:selector=>selector==='.anatomy-controls-popup'?null:null,
  scrollTop:0,getBoundingClientRect:()=>({top:0,bottom:100})};
 const root={isConnected:true,closest:()=>null,contains:node=>node===info};
 const heading={isConnected:true,closest:selector=>selector==='.body-info'?info:null,
  focus:options=>calls.push(options),getBoundingClientRect:()=>({top:140,bottom:165})};
 assert.equal(mod.exports.revealTourExploreHeading(root,info,heading),true);
 assert.equal(calls.length,1);assert.equal(calls[0].preventScroll,true);
 assert.equal(info.scrollTop,128);assert.equal(panel.scrollTop,0);
 assert.equal(mod.exports.revealTourExploreHeading(root,{...info},heading),false,'foreign info panel refused');
});
