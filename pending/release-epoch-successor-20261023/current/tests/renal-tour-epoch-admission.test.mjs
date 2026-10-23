import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {assertCurrentRenalSourceBinding,assertRenalTourEpoch,
 assertRenalPortalPrefixEpoch} from './renal-tour-epoch-admission.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const preimage=fileURLToPath(new URL('./fixtures/renal-epoch-preimage/',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seam=(before,after)=>({before,after});
const importSeam=name=>seam('',`import {${name}} from './renal-tour-epoch-admission.mjs';\n`);
const contracts={
 'clinical-review-axillary-branch-xray.test.ts':{
  sha:'3e59090c898f10709b7c9c62f67481fdd51380b2afcadcf64716a9c3afdd957b',
  seams:[importSeam('assertRenalTourEpoch'),
   seam('assert.deepEqual(live.regionalTours,old.regionalTours);',
    'assertRenalTourEpoch(old.regionalTours,live.regionalTours);')]},
 'clinical-review-continuous-guided-playback.test.ts':{
  sha:'2910f8ebf8610c3d3870ca069a321fc00e05bb30cc7d099020e41c44aba3bb56',
  seams:[importSeam('assertRenalTourEpoch'),
   seam('  assert.deepEqual(current.regionalTours,old.regionalTours);\n  assert.deepEqual(current.regionalTours,epoch.regionalTours);',
    '  assertRenalTourEpoch(old.regionalTours,current.regionalTours);\n  assertRenalTourEpoch(epoch.regionalTours,current.regionalTours);')]},
 'clinical-review-girdle-muscle-xray.test.ts':{
  sha:'78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288',
  seams:[importSeam('assertRenalTourEpoch'),
   seam('assert.deepEqual(live.regionalTours,old.regionalTours);',
    'assertRenalTourEpoch(old.regionalTours,live.regionalTours);')]},
 'clinical-review-hand-arterial-xray.test.ts':{
  sha:'819ed7fdef7d3b1afc24768a3008b7f3403c5eb8a7581b682639c10526b1e19a',
  seams:[importSeam('assertRenalPortalPrefixEpoch'),
   seam(" assert.deepEqual(current.regionalTours.slice(0,27),portal.regionalTours.slice(0,27),\n  'Earlier historical tours remain exact');",
    ' assertRenalPortalPrefixEpoch(portal.regionalTours,current.regionalTours);')]},
 'clinical-review-current-admission.mjs':{
  sha:'181b1df7681ca831a9432559863bc65e7154cd64da8eb8d1686b7108aa56a791',
  seams:[importSeam('assertCurrentRenalSourceBinding'),
   seam("  assert.deepEqual(current,old,path+': unchanged source across epochs');",
    "  const currentExpected=path==='lib/regional-tours.ts'?\n   assertCurrentRenalSourceBinding().sha256:expected;\n  if(path==='lib/regional-tours.ts')assert.equal(sha(current),currentExpected,path+': exact later renal admission');\n  else assert.deepEqual(current,old,path+': unchanged source across epochs');"),
   seam("  assert.equal(record.sourceSha256,expected,path+': Review source');\n  assert.equal(record.importedSha256,expected,path+': Review import');\n  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),expected,path+': Review bytes');",
    "  assert.equal(record.sourceSha256,currentExpected,path+': Review source');\n  assert.equal(record.importedSha256,currentExpected,path+': Review import');\n  assert.equal(sha(readFileSync(site+'/atlas-review/'+path)),currentExpected,path+': Review bytes');"),
   seam("   assert.equal(sha(family),expected,name+': unchanged source in admitted family '+path);",
    "   const familyExpected=path==='lib/regional-tours.ts'&&pin.runtimeSources[name]===pin.source?currentExpected:expected;\n   assert.equal(sha(family),familyExpected,name+': exact source in admitted family '+path);")]},
 'clinical-review-elbow-us-followup.test.ts':{
  sha:'8f16b3d999c5ee2964a5cce9d936debfeb5df51f8b3d50f6fa43183bf46f7776',
  seams:[importSeam('assertCurrentRenalSourceBinding,assertRenalTourEpoch'),
   seam("  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');",
    "  const renalBoundary=assertCurrentRenalSourceBinding();\n  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),renalBoundary.gitBlob);"),
   seam("  assert.equal(regionalRecord.sourceSha256,'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97');",
    '  assert.equal(regionalRecord.sourceSha256,renalBoundary.sha256);'),
   seam("  assert.deepEqual(currentImport.regionalTours,api.regionalTours,'current delivery retains closed 9f tours');",
    '  assertRenalTourEpoch(api.regionalTours,currentImport.regionalTours);')]},
 'clinical-review-forearm-vascular-xray.test.ts':{
  sha:'90b1c26a19220053633a277b10d94b74c4d3c2f6ebc6e3cd8ccf4bccdd2fdda4',
  seams:[importSeam('assertCurrentRenalSourceBinding,assertRenalTourEpoch'),
   seam("  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');",
    "  const renalBoundary=assertCurrentRenalSourceBinding();\n  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),renalBoundary.gitBlob);"),
   seam("  assert.equal(regionalRecord.sourceSha256,'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97');",
    '  assert.equal(regionalRecord.sourceSha256,renalBoundary.sha256);'),
   seam("  assert.deepEqual((await imported()).regionalTours,live.regionalTours,'current delivery retains closed 9f tours');",
    '  assertRenalTourEpoch(live.regionalTours,(await imported()).regionalTours);')]},
};

function inverse(name,text){
 const contract=contracts[name];assert(contract,`Foreign source ${name}`);
 const eol=text.includes('\r\n')?'\r\n':'\n';
 for(const {before,after} of contract.seams){
  const actualAfter=after.replaceAll('\n',eol),actualBefore=before.replaceAll('\n',eol);
  assert.equal(text.split(actualAfter).length,2,`${name}: missing, duplicate or altered declared seam`);
  text=text.replace(actualAfter,actualBefore);
 }
 const original=readFileSync(preimage+name+'.raw');
 assert.equal(sha(original),contract.sha,`${name}: original preimage changed`);
 assert.deepEqual(Buffer.from(text),original,`${name}: whole original source inverse`);
 return text;
}

test('seven complete original sources restore through only their declared seams',()=>{
 for(const name of Object.keys(contracts))inverse(name,readFileSync(site+'tests/'+name,'utf8'));
});

test('inverse refuses missing, altered, duplicate and foreign source bytes',()=>{
 const name='clinical-review-axillary-branch-xray.test.ts';
 const current=readFileSync(site+'tests/'+name,'utf8');
 const addition=contracts[name].seams[0].after;
 assert.throws(()=>inverse(name,current.replace(addition,'')),/missing|declared seam/);
 assert.throws(()=>inverse(name,current.replace(addition,addition+addition)),/duplicate|declared seam/);
 assert.throws(()=>inverse(name,current.replace('assertRenalTourEpoch','assertForeignTourEpoch')),/missing|declared seam/);
 assert.throws(()=>inverse(name,current+'\n// foreign source change\n'),/whole original source inverse/);
 assert.throws(()=>inverse('foreign-source.test.ts',current),/Foreign source/);
});

test('exact 389 to 4f20 tour admission and current Review source guard',
 {timeout:60000},async()=>{
 const bound=assertCurrentRenalSourceBinding();
 assert.equal(bound.oldGitBlob,'fb65a9c68d8753fc1789c7e6281e36c2889e0136');
 assert.equal(bound.gitBlob,'e1adb96b7ad8ce835608991324af6f7547b9b266');
 const atlas=process.env.VM_ATLAS_SOURCE_REPO;
 assert(atlas,'Explicit frozen Atlas source required');
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const historical=await exactSourceHistoryApi('389bd0ca846a42c7f21055f55904bcf5df81a09f','review-security');
 const introduced=await exactSourceHistoryApi('4f20ae0b62b9e0dab5936b430575a983dcdd934e','review-security');
 const portal=await exactSourceHistoryApi('6b6d9bba99985dfc5ca8deb52ca9e2632b837d25','review-security');
 const built=await build({stdin:{contents:
  "export {regionalTours} from './atlas-review/lib/regional-tours';export {renalTour,renalTourMatches} from './atlas-review/lib/renal-tour';import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw);",
  resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
 const review=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 assert.deepEqual(review.regionalTours,introduced.regionalTours,'Current Review retains introduction array');
 assertRenalTourEpoch(historical.regionalTours,introduced.regionalTours);
 assertRenalTourEpoch(historical.regionalTours,review.regionalTours);
 assertRenalPortalPrefixEpoch(portal.regionalTours,review.regionalTours);
 const renal=review.regionalTours[19];
 assert.equal(review.renalTourMatches(review.catalog,renal),true,'Exact renal source guard accepts');
 assert.equal(review.renalTourMatches(review.catalog,{...renal,revision:'renal-organs-arteries-orientation-v1'}),false,
  'Stale tour revision refused');
 const target=renal.steps[0].selectedId;
 const altered={...review.catalog,structures:review.catalog.structures.map(row=>row.id===target?
  {...row,nodeName:row.nodeName+'-forged'}:row)};
 assert.equal(review.renalTourMatches(altered,renal),false,'Altered source record refused');
 for(const [label,change] of [
  ['other title',array=>{array[18].title+=' changed';}],
  ['renal caption',array=>{array[19].steps[0].caption+=' changed';}],
  ['renal selected identity',array=>{array[19].steps[0].selectedId+='-wrong';}],
  ['tour order',array=>{[array[18],array[19]]=[array[19],array[18]];}],
  ['stale renal revision',array=>{array[19].revision='renal-organs-arteries-orientation-v1';}],
  ['missing tour',array=>{array.pop();}],
  ['extra step',array=>{array[19].steps.push({...array[19].steps[0]});}],
 ]){
  const mutated=structuredClone(review.regionalTours);change(mutated);
  assert.throws(()=>assertRenalTourEpoch(historical.regionalTours,mutated),undefined,label);
 }
});

test('declared mixed families stay exact and missing family source inputs remain refused',()=>{
 const atlas=process.env.VM_ATLAS_SOURCE_REPO,old='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';assert(atlas);
 const oldSource=p=>execFileSync('git',['show',old+':'+p],{cwd:atlas,windowsHide:true,maxBuffer:4*1024*1024});
 const sourceHashes=Object.fromEntries(['lib/regional-tours.ts','lib/guided-playback.ts'].map(p=>[p,sha(oldSource(p))]));
 assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck']}),'2381efe43b75f8a7fb768a069eecd7268c508dac');
 const sharedHashes=Object.fromEntries(['lib/guided-playback.ts','lib/scene-label-focus.ts'].map(p=>[p,sha(oldSource(p))]));
 assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes:sharedHashes,learnerModules:['head-neck','shoulder']}),'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.throws(()=>admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck','shoulder']}),/shoulder: lib\/regional-tours\.ts/,
  'The older shoulder runtime does not contain the root regional library; never manufacture its source-input row');
 const forged={...sourceHashes,'lib/regional-tours.ts':'0'.repeat(64)};
 assert.throws(()=>admitPreservedClinicalReview({revision:old,sourceHashes:forged,learnerModules:['head-neck','shoulder']}),/original historical source/);
});
