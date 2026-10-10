import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {beforeThoracoabdominalOrganQuiz as history} from './thoracoabdominal-organ-quiz-history.mjs';
import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with {type:'json'};
import transition from '../content/thoracoabdominal-organ-quiz.transition.json' with {type:'json'};
import {beforePelvicReproductiveCore} from './pelvic-reproductive-core-history.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const{api:currentApi,catalog}=await contentContext(),api=beforePelvicReproductiveCore(currentApi),display=api.bodyDisplayCatalog(catalog);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,value.bodyLesson(s,t)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
assert.equal(hash(snapshot(api)),transition.currentAllLessonsAndRecipesHash);
const before=history(api);assert.equal(hash(snapshot(before)),pins.previousAllLessonsAndRecipesHash);assert.equal(history(before),before);
for(const{identity,previous}of pins.entries){assert.deepEqual(before.bodyLesson(identity,'quiz'),previous.quiz);const clone=before.bodyLesson(identity,'quiz');clone.body+=' foreign';assert.deepEqual(before.bodyLesson(identity,'quiz'),previous.quiz);const foreign=structuredClone(identity);foreign.sources[0].sha256='foreign';assert.throws(()=>before.bodyLesson(foreign,'quiz'),/exact source identity/);}
const first=pins.entries[0];
const mixed={...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='quiz'?structuredClone(first.previous.quiz):api.bodyLesson(s,t);}};
assert.throws(()=>history(mixed),/Mixed/);
assert.throws(()=>history({...api,bodyLesson(s,t){const value=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='quiz'?{...value,body:'foreign'}:value;}}),/Unrecorded/);
assert.equal(hash(snapshot(api)),transition.currentAllLessonsAndRecipesHash);
console.log(JSON.stringify({restoredTopics:8,completeBaselineSnapshotExact:true,mixedAndForeignRefused:true,liveTeachingUnchanged:true}));
