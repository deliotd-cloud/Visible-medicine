import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import { inferiorEpigastricStudy as study,inferiorEpigastricReferences as references } from '../content/inferior-epigastric-study.ts';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous=structuredClone(dissectionProfiles),patches=[];
for(const region of study.regions){
  const added=previous[region].focuses.filter(s=>s.id===study.id);assert.equal(added.length,1);
  assert(!previous[region].stages.some(s=>s.id===study.id));
  previous[region].focuses=previous[region].focuses.filter(s=>s.id!==study.id);
  const referencesAfter=structuredClone(previous[region].references);
  assert.deepEqual(referencesAfter.slice(-references.length),references);
  previous[region].references=previous[region].references.slice(0,-references.length);
  patches.push({region,added,referencesBefore:previous[region].references,referencesAfter});
}
assert.equal(hash(previous),'6718d55292f24620477c701a8bc93ef39cf786f6a56f605b292abec294291644');
const record={sourceCommit:'28c9486ed698848aa0d7b32e97dcd214413aa359',before:hash(previous),after:hash(dissectionProfiles),patches};
const output=JSON.stringify(record,null,2)+'\n',path='content/inferior-epigastric-study-transition.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({before:record.before,after:record.after,recordHash:hash(record),previousRecipesUnchanged:true}));
