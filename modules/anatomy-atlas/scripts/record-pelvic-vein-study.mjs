import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import { pelvicVeinStudy as study,pelvicVeinReferences as references } from '../content/pelvic-vein-study.ts';
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
assert.equal(hash(previous),'a9b9652032f8636ada904ca40e32dea1f3186f908c3dc859fb6705851e95dead');
const record={sourceCommit:'f36f9bc702598b98eb192943fd9a888da5dad61f',before:hash(previous),after:hash(dissectionProfiles),patches};
const output=JSON.stringify(record,null,2)+'\n',path='content/pelvic-vein-study-transition.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({before:record.before,after:record.after,recordHash:hash(record),previousRecipesUnchanged:true}));
