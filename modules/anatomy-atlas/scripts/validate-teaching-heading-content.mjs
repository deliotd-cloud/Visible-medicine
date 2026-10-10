import assert from 'node:assert/strict';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';
import {teachingHeading} from '../lib/teaching-heading.ts';

// Presentation cleanup must not silently change source-bound teaching or review.
const parent=await exactSourceHistoryApi('7736555f3880f804cab02b35719ac3e53bf00222','display-review');
const {api,catalog}=await contentContext();
const display=api.bodyDisplayCatalog(catalog);
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
assert.equal(hash(snapshot(api,display)),hash(snapshot(parent,display)));
let compacted=0,total=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const lesson=api.bodyLesson(s,tab),before=JSON.stringify(lesson);
 const title=teachingHeading(lesson.title,s.name);
 assert.equal(JSON.stringify(lesson),before);
 assert.equal(teachingHeading(title,s.name),title,'Heading is idempotent');
 if(title!==lesson.title){
  compacted++;
  assert(lesson.title.startsWith(`${s.name} · ${s.name} · `));
  assert.equal(title.replaceAll(`${s.name} · `,''),lesson.title.replaceAll(`${s.name} · `,''));
 }
 total++;
}
assert(compacted>0,'Real teaching should exercise the cleanup');
console.log(JSON.stringify({total,compacted,sourceLessonsAndRecipesUnchanged:true}));
