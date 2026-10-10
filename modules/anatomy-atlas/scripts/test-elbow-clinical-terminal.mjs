import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {replayElbowClinicalTerminal} from './elbow-clinical-terminal.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=(dir,name)=>JSON.parse(readFileSync(new URL('../'+dir+'/'+name,import.meta.url),'utf8'));
const pins=read('content','elbow-arterial-mri-pins.json');
const clinical=read('content','elbow-clinical-pins.json');
const records=read('scripts','late-teaching-author-records.json');
const family=records.families.find(f=>f.name==='elbow-arterial-mri');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const transition={baseline:family.baseline,sourcePinsHash:family.pinsHash,authorCommit:family.authorCommit,
 entries:pins.entries.map((e,i)=>({id:e.identity.id,fmaId:e.identity.fmaId,tab:'mri',previousHash:hash(e.previous),currentHash:family.currentHashes[i]}))};
const config={name:'elbow-arterial-mri',pins,transition,pinsHash:family.pinsHash,transitionHash:hash(transition),helper:'elbowArterialMriLesson',optionalHelper:true,singleTab:'mri'};
const clinicalById=new Map(clinical.entries.map(e=>[e.identity.id,e]));
const {build}=await import('./workspace-test-build.mjs');
const built=await build({stdin:{contents:"export {elbowArterialMriLesson} from './lib/elbow-arterial-mri';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {elbowArterialMriLesson:helper}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
for(let i=0;i<pins.entries.length;i++)assert.equal(hash(helper(pins.entries[i].identity,'mri')),family.currentHashes[i]);
const current=new Map(pins.entries.map(e=>[e.identity.id,helper(e.identity,'mri')]));
const previous=new Map(pins.entries.map(e=>[e.identity.id,e.previous]));
const terminal=new Map(pins.entries.map(e=>[e.identity.id,clinicalById.get(e.identity.id)?.previous?.mri??e.previous]));
const unrelated={id:'unrelated',body:'untouched'};
const apiFor=map=>{
 const bodyLesson=(s,t)=>t==='mri'?(map.get(s.id)??(s.id===unrelated.id?unrelated:undefined)):undefined;
 return {bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
};
const api=apiFor(terminal);
assert.equal(replayElbowClinicalTerminal(api,config),api,'Exact terminal identity return');
assert.equal(replayElbowClinicalTerminal(replayElbowClinicalTerminal(api,config),config),api,'Double entry');
assert.equal(api.bodyLesson(unrelated,'mri'),unrelated);
const normalCurrent=replayElbowClinicalTerminal(apiFor(current),config);
for(const e of pins.entries)assert.deepEqual(normalCurrent.bodyLesson(e.identity,'mri'),e.previous);
const normalPrevious=apiFor(previous);assert.equal(replayElbowClinicalTerminal(normalPrevious,config),normalPrevious);
let refused=0;const reject=(value,cfg=config,cat)=>{assert.throws(()=>replayElbowClinicalTerminal(value,cfg,cat));refused++;};
for(const e of pins.entries){
 const mixed=new Map(terminal);mixed.set(e.identity.id,current.get(e.identity.id));reject(apiFor(mixed));
 const foreign=new Map(terminal);foreign.set(e.identity.id,{...terminal.get(e.identity.id),body:'foreign'});reject(apiFor(foreign));
}
reject({...api,elbowArterialMriLesson:helper});
reject({...api,bodyContent:undefined});
reject({...api,bodyContent(s,t){const v=api.bodyContent(s,t);return s.id===pins.entries[0].identity.id?{...v,body:'foreign'}:v;}});
reject(api,{...config,helper:'foreignHelper'});
reject(api,{...config,optionalHelper:false});
reject(api,{...config,singleTab:undefined});
reject(api,{...config,transitionHash:'foreign'});
reject(api,{...config,name:'elbow-clinical'});
reject(api,{...config,pinsHash:'0'.repeat(64)});
reject(api,{...config,pins:{...pins,entries:pins.entries.slice(1)}});
reject(api,{...config,transition:{...transition,entries:transition.entries.slice(1)}});
reject(api,{...config,transition:{...transition,entries:[{...transition.entries[0],fmaId:'foreign'},...transition.entries.slice(1)]}});
reject(api,{...config,transition:{...transition,entries:[{...transition.entries[0],currentHash:'0'.repeat(64)},...transition.entries.slice(1)]}});
reject(api,{...config,transition:{...transition,entries:[{...transition.entries[0],previousHash:'0'.repeat(64)},...transition.entries.slice(1)]}});
const forgedIdentity=new Map(terminal);
forgedIdentity.set(pins.entries[0].identity.id,{...terminal.get(pins.entries[0].identity.id),id:'foreign'});
reject(apiFor(forgedIdentity));
const catalog={structures:pins.entries.map(e=>structuredClone(e.identity))};
assert.equal(replayElbowClinicalTerminal(api,config,catalog),api);
for(const change of [c=>c.structures.push(structuredClone(c.structures[0])),c=>c.structures[0].sources[0].sha256='foreign',c=>c.structures.pop(),c=>c.structures[0].id='foreign',c=>c.structures[0].fmaId='foreign']){
 const bad=structuredClone(catalog);change(bad);reject(api,config,bad);
}
console.log(JSON.stringify({terminalIdentity:true,normalEpochs:true,refused,catalogWhenSupplied:true,noCatalogSourceProof:false,clinicalApproval:false,fullHistoryAccepted:false}));

