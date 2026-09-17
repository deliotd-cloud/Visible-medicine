import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforeShortCiliaryTeaching} from './short-ciliary-history.mjs';
const current=await context({current:true}),display=current.display,api=beforeShortCiliaryTeaching(current.api);
const structure=display.structures.find(s=>s.fmaId==='FMA7041'),bundle=display.bundles.find(b=>b.id===structure.bundle);
const recipes=structuredClone(api.dissectionProfiles),added=recipes['head-neck'].focuses.filter(f=>f.id==='short-ciliary-context');assert.equal(added.length,1);
recipes['head-neck'].focuses=recipes['head-neck'].focuses.filter(f=>f.id!=='short-ciliary-context');
assert.equal(hash(recipes),'051a7432fd2dfede46e64a46ff2d211bd3a6942513c6e8c24666532d46f9fa25');
const previous={...display,structures:display.structures.filter(s=>s.id!==structure.id),bundles:display.bundles.filter(b=>b.id!==bundle.id)};
const beforeSnapshot=hash(snapshot({...api,dissectionProfiles:recipes},previous));assert.equal(beforeSnapshot,'9e5ee241abce59e7fbb25a0afb9cf46e4ffe877b9e53858a165efdee309cf8fb','Every previous lesson, shoulder topic and recipe unchanged');
const result={parentCommit:'055e0c1b6e4bc738097c2c59e6dc4c865e5b621f',structure,bundle,addedFocus:added[0],previousCatalogHash:hash(previous),currentCatalogHash:hash(display),previousRecipesHash:hash(recipes),currentRecipesHash:hash(api.dissectionProfiles),previousAllLessonsAndRecipesHash:beforeSnapshot,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(structure,t)]))};
const file='content/short-ciliary-transition.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);
else{
 let flag='wx';
 if(process.argv.includes('--refresh-uncommitted')){
  let untracked=false;try{execFileSync('git',['ls-files','--error-unmatch',file],{stdio:'pipe'});}catch(e){assert.equal(e.status,1);untracked=true;}
  assert(untracked,'Never overwrite a tracked historical transition');flag='w';
 }
 await writeFile(file,text,{flag});
}
console.log(JSON.stringify({hash:hash(result),previousSelections:previous.structures.length,unchangedPreviousTopics:previous.structures.length*9,currentSelections:display.structures.length}));
