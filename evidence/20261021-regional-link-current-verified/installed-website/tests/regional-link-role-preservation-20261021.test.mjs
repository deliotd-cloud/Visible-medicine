import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const here=dirname(fileURLToPath(import.meta.url));
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
 assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' must preserve the entire original test outside enumerated role seams');
}

test('full regional catalogue, reference-index, and MRI test bodies preserve every original assertion outside exact role seams',()=>{
 preserve('regional-learning-catalogue-history.ts','59e5289e64ee679867674bbf2263de2f8ff17b9c15add6f2ddd237aa1847ebd9',[
  ["const currentSource='87ed7e343260c7df48a40d53503f25bbfd34cfa5';",
   "const currentSource='190a63238eadcf906abe89dcbb6a67c88afe70b9';",'only the current source reader role'],
 ]);
 preserve('regional-learning-catalogue.test.ts','5e6d1ebabeb635cacffa1de78485cad254655a42bcf964285650e51595be698c',[
  ["  assert.equal(actual.sourceRevision,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
   "  assert.equal(actual.sourceRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');",'current imported catalogue source'],
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
