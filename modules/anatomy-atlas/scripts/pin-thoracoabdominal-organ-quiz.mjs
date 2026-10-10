import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {thoracoabdominalOrganQuizGroups as groups} from '../content/thoracoabdominal-organ-quiz.ts';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sha=x=>createHash('sha256').update(x).digest('hex');
const baseline='fae8cf6abbfffe304d5190e44f53affa883a96a3';
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const parent=await exactSourceHistoryApi(baseline,'display-content');
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
const snapshot={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,parent.bodyLesson(s,t)]))})),shoulder:parent.structures,recipes:parent.dissectionProfiles};
const entries=Object.entries(groups).flatMap(([group,fmas])=>fmas.map(fma=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
 const identity=matches[0],previous={quiz:parent.bodyLesson(identity,'quiz')};
 assert.equal(identity.system,'organs');assert.equal(previous.quiz.readiness,'generated-identification',identity.id);
 return {identity,group,previous};
}));
assert.equal(entries.length,8);assert.equal(new Set(entries.map(e=>e.identity.id)).size,8);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);}
const pins={baseline,sourceVersion:display.sourceVersion,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot),entries};
const path='content/thoracoabdominal-organ-quiz-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);for(const s of display.structures)for(const t of api.contentTabs)assert.deepEqual(api.bodyLesson(s,t),parent.bodyLesson(s,t),'Capture before integrating new teaching');await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,baseline,previousSnapshotHash:pins.previousAllLessonsAndRecipesHash,pinsHash:hash(pins)}));
