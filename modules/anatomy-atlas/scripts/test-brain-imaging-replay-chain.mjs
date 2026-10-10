// Test-only exact old-epoch replay. Never writes teaching, transitions, or review records.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCarpalBoneQuiz} from './carpal-bone-quiz-history.mjs';
import {beforeTentoriumImaging} from './tentorium-imaging-history.mjs';
import {beforeCerebellarMcaImaging} from './cerebellar-mca-imaging-history.mjs';
import {lateTeachingConfigs} from './late-teaching-epoch-history.mjs';
import {cubitalConfig} from './cubital-venous-ultrasound-history.mjs';
import carpalPins from '../content/carpal-bone-quiz-pins.json' with {type:'json'};
import carpalTransition from '../content/carpal-bone-quiz-transition.json' with {type:'json'};
import tentoriumPins from '../content/tentorium-imaging-pins.json' with {type:'json'};
import tentoriumTransition from '../content/tentorium-imaging-transition.json' with {type:'json'};
import cerebellarPins from '../content/cerebellar-mca-imaging-pins.json' with {type:'json'};
import cerebellarTransition from '../content/cerebellar-mca-imaging-transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const cases=[
 {name:'carpal',adapter:beforeCarpalBoneQuiz,pins:carpalPins,transition:carpalTransition},
 {name:'tentorium',adapter:beforeTentoriumImaging,pins:tentoriumPins,transition:tentoriumTransition},
 {name:'cerebellar-mca',adapter:beforeCerebellarMcaImaging,pins:cerebellarPins,transition:cerebellarTransition},
];
const {api,catalog}=await contentContext();
const display=api.bodyDisplayCatalog(catalog);
const rawHash=hash(snapshot(api,display));
const rawCatalogHash=hash(display);
const pinnedIds=new Set([...cases.flatMap(item=>item.pins.entries.map(entry=>entry.identity.id)),
 ...lateTeachingConfigs.flatMap(item=>item.pins.entries.map(entry=>entry.identity.id)),
 ...cubitalConfig.pins.entries.map(entry=>entry.identity.id)]);
const unrelated=display.structures.find(s=>!pinnedIds.has(s.id));
assert(unrelated,'No unrelated structure available');
const lateHelper=lateTeachingConfigs.find(config=>typeof api[config.helper]==='function');
assert(lateHelper,'No exported named late helper available to challenge');
const results=[];

for(const item of cases){
 const prior=item.adapter(api,display);
 const parent=await exactSourceHistoryApi(item.pins.parentCommit,'display-review');
 assert.deepEqual(display,parent.bodyDisplayCatalog(catalog),`${item.name}: parent source catalog changed`);
 assert.deepEqual(snapshot(prior,display),snapshot(parent,display),`${item.name}: not exact saved parent`);
 assert.equal(hash(snapshot(prior,display)),item.pins.previousAllLessonsAndRecipesHash,`${item.name}: frozen prior hash`);
 assert.equal(item.adapter(prior,display),prior,`${item.name}: repeated prior API must retain identity`);

 const foreign={...prior,bodyLesson(s,tab){
  const lesson=prior.bodyLesson(s,tab);
  return s.id===unrelated.id&&tab==='anatomy'?{...lesson,body:'foreign unrelated teaching'}:lesson;
 }};
 if(typeof prior.bodyContent==='function')foreign.bodyContent=(s,tab)=>{
  const {readiness:_,...shown}=foreign.bodyLesson(s,tab);return shown;
 };
 assert.throws(()=>item.adapter(foreign,display),/Unrecorded|snapshot|baseline|foreign/i,`${item.name}: unrelated all-prior forge passed`);

 const originalHelper=prior[lateHelper.helper];
 assert.equal(typeof originalHelper,'function',`${item.name}: missing exported test helper`);
 const forgedHelper={...prior,[lateHelper.helper](s,tab){
  const lesson=originalHelper(s,tab);
  return lesson&&typeof lesson==='object'?{...lesson,body:'foreign helper teaching'}:lesson;
 }};
 assert.throws(()=>item.adapter(forgedHelper,display),/draft helper|helper|foreign/i,`${item.name}: forged late helper passed`);
 assert.throws(()=>item.adapter({...prior,[lateHelper.helper]:'malformed'},display),/invalid draft helper|helper/i,`${item.name}: malformed late helper passed`);

 const oldName=item.pins.entries[0].identity.name;
 item.pins.entries[0].identity.name=oldName+' foreign';
 try{assert.throws(()=>item.adapter(prior,display),/AssertionError|pins changed|pin/i,`${item.name}: mutated pins passed`);}
 finally{item.pins.entries[0].identity.name=oldName;}
 const oldId=item.transition.entries[0].id;
 item.transition.entries[0].id=oldId+'-foreign';
 try{assert.throws(()=>item.adapter(prior,display),/AssertionError|transition changed|transition/i,`${item.name}: mutated transition passed`);}
 finally{item.transition.entries[0].id=oldId;}

 assert.equal(hash(snapshot(api,display)),rawHash,`${item.name}: raw API changed`);
 assert.equal(hash(api.bodyDisplayCatalog(catalog)),rawCatalogHash,`${item.name}: raw catalog changed`);
 results.push({adapter:item.name,parentCommit:item.pins.parentCommit,priorHash:item.pins.previousAllLessonsAndRecipesHash,
  exactParent:true,idempotent:true,unrelatedAndHelperForgeriesRefused:true,recordTamperingRefused:true});
 console.log(JSON.stringify(results.at(-1)));
}
console.log(JSON.stringify({adapters:results.length,rawCurrentUnchanged:true,clinicalApproval:false}));
