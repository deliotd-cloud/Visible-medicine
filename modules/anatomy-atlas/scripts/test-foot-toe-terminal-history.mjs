import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {replayFootFollowupToeTerminal} from './foot-toe-terminal-history.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=n=>JSON.parse(readFileSync(root+'content/'+n+'.json','utf8'));
const pins=read('foot-ultrasound-followup-pins'),transition=read('foot-ultrasound-followup.transition');
const toe=read('toe-bone-ultrasound-pins');
const toeById=new Map(toe.entries.map(e=>[e.identity.id,e]));
const config={name:'foot-ultrasound-followup',pins,transition,pinsHash:'87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d',transitionHash:'f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193',helper:'footUltrasoundFollowupLesson',optionalHelper:true};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const key=(id,tab)=>JSON.stringify([id,tab]);
const {build}=await import(pathToFileURL(root+'scripts/workspace-test-build.mjs'));
const built=await build({stdin:{contents:"export {footUltrasoundFollowupLesson} from './lib/foot-ultrasound-followup';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {footUltrasoundFollowupLesson:helper}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const records=new Map(transition.entries.map(e=>[key(e.id,e.tab),e.draftHash]));
for(const e of pins.entries)assert.equal(hash(helper(e.identity,'ultrasound')),records.get(key(e.identity.id,'ultrasound')));
const previous=new Map(pins.entries.map(e=>[key(e.identity.id,'ultrasound'),e.previous.ultrasound]));
const current=new Map(pins.entries.map(e=>[key(e.identity.id,'ultrasound'),helper(e.identity,'ultrasound')]));
const terminal=new Map(pins.entries.map(e=>[key(e.identity.id,'ultrasound'),toeById.has(e.identity.id)?toeById.get(e.identity.id).previous.ultrasound:e.previous.ultrasound]));
const unrelated={id:'unrelated',body:'untouched'};
const apiFor=map=>{
 const bodyLesson=(s,t)=>map.get(key(s.id,t))??(s.id===unrelated.id?unrelated:undefined);
 return {bodyLesson,bodyContent(s,t){const {readiness:_r,...v}=bodyLesson(s,t);return v;},footUltrasoundFollowupLesson:helper};
};
const api=apiFor(terminal);
assert.equal(replayFootFollowupToeTerminal(api,config),api);
assert.equal(replayFootFollowupToeTerminal(replayFootFollowupToeTerminal(api,config),config),api);
assert.equal(api.bodyLesson(unrelated,'ultrasound'),unrelated);
const ordinaryCurrent=replayFootFollowupToeTerminal(apiFor(current),config);
for(const e of pins.entries)assert.deepEqual(ordinaryCurrent.bodyLesson(e.identity,'ultrasound'),e.previous.ultrasound);
const ordinaryPrevious=apiFor(previous);
assert.equal(replayFootFollowupToeTerminal(ordinaryPrevious,config),ordinaryPrevious);
let refusals=0;const reject=value=>{assert.throws(()=>replayFootFollowupToeTerminal(value,config));refusals++;};
for(const e of pins.entries){
 const slot=key(e.identity.id,'ultrasound');
 const mixed=new Map(terminal);mixed.set(slot,current.get(slot));reject(apiFor(mixed));
 const foreign=new Map(terminal);foreign.set(slot,{...terminal.get(slot),body:'foreign'});reject(apiFor(foreign));
}
reject({...api,footUltrasoundFollowupLesson:undefined});
reject({...api,footUltrasoundFollowupLesson:42});
reject({...api,footUltrasoundFollowupLesson(){return {readiness:'draft',body:'foreign'};}});
reject({...api,bodyContent:undefined});
reject({...api,bodyContent(s,t){const v=api.bodyContent(s,t);return pins.entries[0].identity.id===s.id?{...v,body:'foreign'}:v;}});
const catalog={structures:pins.entries.map(e=>structuredClone(e.identity))};
assert.equal(replayFootFollowupToeTerminal(api,config,catalog),api);
for(const mutate of [c=>c.structures.push(structuredClone(c.structures[0])),c=>c.structures[0].sources[0].sha256='foreign',c=>c.structures.pop()]){
 const bad=structuredClone(catalog);mutate(bad);assert.throws(()=>replayFootFollowupToeTerminal(api,config,bad));refusals++;
}
for(const altered of [{...config,helper:'foreign'},{...config,optionalHelper:false},{...config,singleTab:'ultrasound'}]){assert.throws(()=>replayFootFollowupToeTerminal(api,altered));refusals++;}
assert.equal(refusals,35);
console.log(JSON.stringify({exactTerminal:true,doubleEntry:true,normalEpochs:true,refusals,clinicalApproval:false}));
