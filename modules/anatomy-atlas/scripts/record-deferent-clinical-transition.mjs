import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import pins from '../content/deferent-clinical-pins.json' with {type:'json'};
import {exactDeferentClinicalHistory,deferentBaselineCommit,deferentWholeBodySnapshot} from './exact-deferent-clinical-history.mjs';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const {before,after}=await exactDeferentClinicalHistory(raw);
assert.equal(pins.sourceCommit,deferentBaselineCommit);
assert.equal(sha(deferentWholeBodySnapshot(before,raw)),pins.previousAllLessonsAndRecipesHash,'Strict immutable before hash');
const currentAllLessonsAndRecipesHash=sha(deferentWholeBodySnapshot(after,raw));
const result={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash,entries:pins.entries.map(entry=>({id:entry.identity.id,sections:Object.fromEntries(entry.topics.map(topic=>{const lesson=after.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'draft');return[topic,sha(lesson)];}))}))};
const file='content/deferent-clinical.transition.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);else await writeFile(file,text,{flag:'wx'});
console.log(JSON.stringify({pinsHash:sha(pins),transitionHash:sha(result),placements:4}));
