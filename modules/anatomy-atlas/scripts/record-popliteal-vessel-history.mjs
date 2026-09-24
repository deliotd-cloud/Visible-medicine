import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
const parentCommit='8bb434cdb42eac4925dc60a4fe9841ad6a62f211';
const id='knee-popliteal-vessel-pair',regions=['leg','whole-body'];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const [{api,catalog},prior]=await Promise.all([contentContext(),exactSourceHistoryApi(parentCommit)]);
assert.deepEqual(api.bodyDisplayCatalog(catalog),prior.bodyDisplayCatalog(catalog));
const profiles=structuredClone(api.dissectionProfiles),patches=[];
for(const region of regions){
 const additions=profiles[region].focuses.filter(f=>f.id===id);
 assert.equal(additions.length,1);
 patches.push({region,additions,referencesBefore:prior.dissectionProfiles[region].references,referencesAfter:profiles[region].references});
 profiles[region].focuses=profiles[region].focuses.filter(f=>f.id!==id);
 profiles[region].references=structuredClone(prior.dissectionProfiles[region].references);
}
assert.equal(hash(profiles),hash(prior.dissectionProfiles),'Only the paired study and its references change');
assert.equal(hash(wholeBodyTeachingSnapshot({...api,dissectionProfiles:profiles},catalog)),hash(wholeBodyTeachingSnapshot(prior,catalog)),'Every teaching topic and prior recipe remains exact');
const record={parentCommit,id,regions,beforeHash:hash(profiles),afterHash:hash(api.dissectionProfiles),patches,catalogHash:hash(api.bodyDisplayCatalog(catalog)),teachingAndPriorRecipesHash:hash(wholeBodyTeachingSnapshot(prior,catalog))};
const path='content/popliteal-vessel-study.transition.json',text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({beforeHash:record.beforeHash,afterHash:record.afterHash,recordSha256:hash(record),regions}));
