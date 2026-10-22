import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyExtraExpansionSources,originalHashes,expansionImport,expansionMap,migrationBlock,migrationRefusal} from 'file:///F:/VisibleMedicine/staging/20261022-extra-expansion-admission/tests/extra-expansion-adoption-source-proof.mjs';

const stage='F:/VisibleMedicine/staging/20261022-extra-expansion-admission';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const nonhead='F:/VisibleMedicine/staging/20261022-nonhead-expansion-harness-proposal';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>{
 if(name==='atlas-nonhead-comparison-ui.test.mjs')return readFileSync(nonhead+'/tests/'+name,'utf8');
 if(name==='atlas-runtime-expansion-loader.mjs')return readFileSync(website+'/tests/'+name,'utf8');
 return readFileSync(stage+'/tests/'+name,'utf8');
};
const result=verifyExtraExpansionSources(read);
if(process.argv.includes('--refusals')){
 let refusals=0;
 for(const name of ['atlas-nonhead-comparison-ui.test.mjs','atlas-shoulder-navigation-current.test.mjs']){
  const source=read(name);
  for(const changed of [source.replace(expansionImport,''),source+expansionMap,
   source.replace(expansionMap,"  './atlas-runtime-expansion':{},\n"),source.replace('assert.equal(','assert.notEqual(')]){
   assert.notEqual(changed,source);
   assert.throws(()=>verifyExtraExpansionSources(path=>path===name?changed:read(path)));
   refusals++;
  }
 }
 const name='nonhead-frame-migration.test.mjs',source=read(name);
 for(const changed of [source.replace(migrationBlock,''),source+migrationBlock,source.replace(migrationRefusal,''),
  source.replace('stripLiveLearningLoader(stripExpansionLoader(candidate))','stripLiveLearningLoader(candidate)'),
  source.replace('assert.equal(original.sha256,expectedSha)','assert.notEqual(original.sha256,expectedSha)')]){
  assert.notEqual(changed,source);
  assert.throws(()=>verifyExtraExpansionSources(path=>path===name?changed:read(path)));
  refusals++;
 }
 const receipt={at:new Date().toISOString(),...result,sourceMutationRefusals:refusals,nativeRootsRerun:false};
 writeFileSync(stage+'/SOURCE_REFUSALS.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(receipt));
 process.exit(0);
}
for(const [name,expected] of Object.entries(originalHashes))assert.equal(sha(readFileSync(website+'/tests/'+name)),expected,'Frozen original '+name);
const repairs=Object.entries(originalHashes).map(([name,beforeSha256])=>({
 path:'tests/'+name,beforePath:stage+'/tests/preimages/'+name+'.before-extra-expansion.raw',beforeSha256,
 proposal:(name==='atlas-nonhead-comparison-ui.test.mjs'?nonhead:stage)+'/tests/'+name,
 proposalSha256:sha(Buffer.from(read(name))),wholeSourceInverse:true,nativeRootRerun:false,
}));
const additionalFiles=[
 'tests/extra-expansion-adoption-source-proof.mjs','tests/extra-expansion-adoption.test.mjs',
 ...Object.keys(originalHashes).map(name=>'tests/preimages/'+name+'.before-extra-expansion.raw'),
].map(path=>({path,source:stage+'/'+path,sha256:sha(readFileSync(stage+'/'+path)),bytes:readFileSync(stage+'/'+path).length}));
for(const row of additionalFiles)assert(!existsSync(website+'/'+row.path),'New path must not overwrite '+row.path);
const receipt={at:new Date().toISOString(),website,source:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',...result,repairs,additionalFiles,
 frozenOrCanonicalEdited:false,nativeRootsRerun:false,ownerPreviewChanged:false};
writeFileSync(stage+'/VERIFIED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/VERIFIED.json',sha256:sha(readFileSync(stage+'/VERIFIED.json')),...result}));
