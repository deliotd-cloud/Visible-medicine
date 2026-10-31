import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {assertExactLineDelta} from './release16-preservation-line-delta.mjs';
const sourceBase=process.env.VM_PRESERVATION_SOURCE_TESTS?pathToFileURL(process.env.VM_PRESERVATION_SOURCE_TESTS+'/'):new URL('./',import.meta.url);
const {restoreRegionalMriInlinePrior}=await import(new URL('./regional-mri-inline-source-inverse.mjs',sourceBase));
const {restoreRegionalReferenceIndexPrior}=await import(new URL('./regional-reference-index-source-inverse.mjs',sourceBase));

const here=fileURLToPath(sourceBase);
const historical='fixtures/regional-link-before-role-batch-20261021';
const sha=value=>createHash('sha256').update(value).digest('hex');
function substituteOnce(source,before,after,label){
 const first=source.indexOf(before);
 assert.notEqual(first,-1,label+' original seam absent');
 assert.equal(source.indexOf(before,first+before.length),-1,label+' original seam repeated');
 return source.slice(0,first)+after+source.slice(first+before.length);
}
function preserve(name,expectedHash,edits){
 const raw=readFileSync(join(here,historical,name+'.raw'));
 assert.equal(sha(raw),expectedHash,name+' authenticated exact pre-edit bytes');
 let expected=raw.toString('utf8');
 for(const [before,after,label] of edits)expected=substituteOnce(expected,before,after,name+': '+label);
 const current=readFileSync(join(here,name));
 let candidate=current;
 if(name==='regional-mri-inline-inspection.test.ts'){
  assert.equal(sha(current),'0f5927d03f8222ae426736fc4eb19f4c24215658589174eadf351c5e1e2d7fca','Exact current split-runtime MRI source');
  const intermediate=readFileSync(new URL('./fixtures/regional-mri-inline-6467.test.ts.raw',import.meta.url));
  assert.equal(sha(intermediate),'6467bfb098644b04464969d98cbae9f8ca2974d9a54c320d29af39c1c419e716','Exact pre-family MRI source');
  assertExactLineDelta(intermediate,current,[
   'b4514e1564f3ae6152e27c17ce3a8a081e07a10e893eea4f1370369adcf004dd',
   '8b5ca65dd1130754583f3833f72411b0cb7fe6b82eb9675ffaef948a0f9f16ad',
   'f26964d572869534145f0ea47633bebaa9bf021a337c3ae184e760dd04c3ab1f',
   'd97754268365accb9c5b1b74d9755c141bcf3b8569e47cdcb6c3673088e02085',
   '350249968778bc2e626b1ecbee4f98c9d08d87b60093d352dd0ca309a657119f',
   '54498b0b13c19930294f8629a586155289f3ecb1f7213282d4ad9122957b5790',
   '6ae44184ac4cbb7aca32abf00be07b510f410fcfb007edc89ece6682a69ece08',
  ],'Pre-family MRI to current split-runtime source');
  assert(current.includes("binding.runtimeSources['lower-limb']"));
  assert(current.includes("test('current split Review and specimen runtime keep links and channel independently pinned'"));
  candidate=restoreRegionalMriInlinePrior(intermediate);
 }else if(name==='regional-reference-review-index.test.ts'){
  assert.equal(sha(current),'a23d35d1cdf460dd1a5d3f58aaaa1429a7d2ad69073f627f82996047ae0e43fa','Exact current catalogue loader and role source');
  const intermediate=readFileSync(new URL('./fixtures/regional-reference-index-bc6c.test.ts.raw',import.meta.url));
  assert.equal(sha(intermediate),'bc6c4172fe97f496320cb4d3170c83aeccbaa68f6b13b9786804fb2dd0f2e589','Exact pre-loader index source');
  assertExactLineDelta(intermediate,current,[
   'c243ece395bb913723a9e4a105616bb86c0fda22cfde4bf9c3e4e2c657316320',
   '92b0771cce52a8bfe1813284a5ecdac68770f9444166c5ebc577401e753f431f',
   '5be3c5132891ad11b6b0d6b0bd75b318ffc1436ebcc78072f2ef705bac28f841',
  ],'Pre-loader index to current catalogue source');
  assert(current.includes('referenceCatalogueDeliveryRoles({review,learner,limb})'));
  candidate=restoreRegionalReferenceIndexPrior(intermediate);
 }
 assert.deepEqual(candidate,Buffer.from(expected),name+' must preserve the entire original test outside enumerated role seams');
}

test('full regional catalogue, reference-index, and MRI test bodies preserve every original assertion outside exact role seams',()=>{
 preserve('regional-learning-catalogue-history.ts','59e5289e64ee679867674bbf2263de2f8ff17b9c15add6f2ddd237aa1847ebd9',[
  ["import {checkedAtlasHistoryRepo,checkedAtlasSourceRepo} from './atlas-source-repo.mjs';",
   "import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\nimport {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';",'current admission dependency'],
  ["const currentSource='87ed7e343260c7df48a40d53503f25bbfd34cfa5';\n",'', 'current source now comes from the exact delivery'],
  ['const live=checkedAtlasSourceRepo(currentSource);',
   'const live=currentAtlasDeliveryRoot(),currentSource=CURRENT_ATLAS_REVISION;', 'current source reader role'],
 ]);
 preserve('regional-learning-catalogue.test.ts','5e6d1ebabeb635cacffa1de78485cad254655a42bcf964285650e51595be698c',[
  ["import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';",
   "import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';",'current delivery import'],
  ["  assert.equal(actual.sourceRevision,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
   '  assert.equal(actual.sourceRevision,CURRENT_ATLAS_REVISION);','current imported catalogue source'],
 ]);
 preserve('regional-mri-inline-inspection.test.ts','732bff1b7b9ffae2b3f2f4cbc54d8b38b6cd3fd7631aa5f2918a007bf1b2865f',[
  [" const current='87ed7e343260c7df48a40d53503f25bbfd34cfa5';",
   " const current='190a63238eadcf906abe89dcbb6a67c88afe70b9';",'current imported manifest source'],
  ["    'old 408 proof must not be admitted by current 87ed delivery');",
   "    'old 408 proof must not be admitted by current 190 delivery');",'descriptive delivery label'],
 ]);
 preserve('regional-reference-review-index.test.ts','508a9df7dda87e65ccf6cee49fc289d88ad2d3ca26e1388896b35563865320ad',[
  [` assert.equal(catalogue.atlasRevision,'408759d57644b05402e98a937e7cf6338b5509cf');
 assert.equal(catalogue.mappingRevision,'e99b3f131ae2e7da2d5854127c0280253339c85fdff8d71dda0aef96436e96b4');`,
   ` assert.equal(catalogue.atlasRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 const currentMapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:catalogue.atlasRevision,entries:catalogue.entries})))).toString('hex');
 assert.equal(catalogue.mappingRevision,currentMapping,'current mapping must bind the exact current public links');
 const historical408Atlas='408759d57644b05402e98a937e7cf6338b5509cf';
 const historical408Entries=structuredClone(catalogue.entries);
 for(const entry of historical408Entries)for(const target of entry.targets){
  const href=new URL(target.href,'https://visible-medicine.invalid');
  assert.equal(href.searchParams.get('atlasRevision'),catalogue.atlasRevision);
  href.searchParams.set('atlasRevision',historical408Atlas);target.href=href.pathname+href.search;
 }
 const historical408Mapping=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:historical408Atlas,entries:historical408Entries})))).toString('hex');
 assert.equal(historical408Mapping,'e99b3f131ae2e7da2d5854127c0280253339c85fdff8d71dda0aef96436e96b4','old 408 exact public-link mapping');`,'current mapping and old-408 replay'],
  [`  assert.equal(row.teachingRevision,currentRevision,id);
  const teaching=catalogue.learning.entries.find((entry:any)=>entry.target.id===id&&entry.target.relation==='same-structure');assert(teaching,id);`,
   `  const teaching=catalogue.learning.entries.find((entry:any)=>entry.target.id===id&&entry.target.relation==='same-structure');assert(teaching,id);
  assert.equal(row.teachingRevision,teaching.revision,id);`,'row digest role'],
  ["  assert.equal(await regionalLearningRevision(catalogue.atlasRevision,catalogue.mappingRevision,content),actualRevision,id+' current exact content digest');",
   "  assert.equal(await regionalLearningRevision(historical408Atlas,historical408Mapping,content),currentRevision,id+' old 408 exact content digest');\n  assert.equal(await regionalLearningRevision(catalogue.atlasRevision,catalogue.mappingRevision,content),actualRevision,id+' current exact content digest');",'old-408 exact teaching digest'],
 ]);
});
