// Lightweight actual-source fixture. Run with: node --import tsx scripts/test-genicular-clinical-terminal.mjs
// Uses the real eight authored lessons; no whole-history replay or bundle.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {replayGenicularClinicalTerminal} from './genicular-clinical-terminal.mjs';
import {genicularMriLesson} from '../lib/genicular-mri.ts';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=path=>JSON.parse(readFileSync(root+'/'+path,'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pins=read('content/genicular-mri-pins.json');
const clinical=read('content/genicular-clinical-pins.json');
const records=read('scripts/late-teaching-author-records.json');
const family=records.families.find(f=>f.name==='genicular-mri');
const transition={
 baseline:family.baseline,sourcePinsHash:family.pinsHash,authorCommit:family.authorCommit,
 entries:pins.entries.map((e,i)=>({id:e.identity.id,fmaId:e.identity.fmaId,tab:'mri',
  previousHash:hash(e.previous),currentHash:family.currentHashes[i]})),
};
const config={name:'genicular-mri',pins,transition,pinsHash:family.pinsHash,
 transitionHash:hash(transition),helper:'genicularMriLesson',optionalHelper:true,singleTab:'mri'};
const clinicalById=new Map(clinical.entries.map(e=>[e.identity.id,e]));
const current=new Map(pins.entries.map((e,i)=>{
 const value=genicularMriLesson(e.identity,'mri');
 assert.equal(hash(value),family.currentHashes[i],'Actual authored MRI hash');
 return[e.identity.id,value];
}));
const previous=new Map(pins.entries.map(e=>[e.identity.id,e.previous]));
const terminal=new Map(pins.entries.map(e=>[e.identity.id,clinicalById.get(e.identity.id).previous.mri]));
const unrelated={id:'unrelated',body:'untouched'};
const apiFor=map=>{
 const bodyLesson=(s,t)=>t==='mri'?(map.get(s.id)??(s.id===unrelated.id?unrelated:undefined)):undefined;
 return{bodyLesson,bodyContent(s,t){const{readiness:_readiness,...shown}=bodyLesson(s,t);return shown;}};
};

const api=apiFor(terminal);
assert.equal(replayGenicularClinicalTerminal(api,config),api,'Exact terminal identity return');
assert.equal(replayGenicularClinicalTerminal(replayGenicularClinicalTerminal(api,config),config),api,'Repeated terminal entry');
assert.equal(api.bodyLesson(unrelated,'mri'),unrelated,'Unrelated lesson stays untouched');
const ordinaryCurrent=replayGenicularClinicalTerminal(apiFor(current),config);
for(const e of pins.entries)assert.deepEqual(ordinaryCurrent.bodyLesson(e.identity,'mri'),e.previous);
const ordinaryPrevious=apiFor(previous);
assert.equal(replayGenicularClinicalTerminal(ordinaryPrevious,config),ordinaryPrevious);
assert.equal(replayGenicularClinicalTerminal(ordinaryPrevious,{...config,name:'unrelated-epoch'}),ordinaryPrevious,
 'Unrelated config uses generic replay');

let refused=0;
const reject=(value,cfg=config,catalog)=>{
 assert.throws(()=>replayGenicularClinicalTerminal(value,cfg,catalog));
 refused++;
};
for(const e of pins.entries){
 const mixed=new Map(terminal);mixed.set(e.identity.id,previous.get(e.identity.id));reject(apiFor(mixed));
 const authored=new Map(terminal);authored.set(e.identity.id,current.get(e.identity.id));reject(apiFor(authored));
 const foreign=new Map(terminal);foreign.set(e.identity.id,{...terminal.get(e.identity.id),body:'foreign'});reject(apiFor(foreign));
}
reject({...api,genicularMriLesson:genicularMriLesson});
reject({...api,bodyContent:undefined});
reject({...api,bodyContent(s,t){const value=api.bodyContent(s,t);
 return s.id===pins.entries[0].identity.id?{...value,body:'foreign'}:value;}});
reject(api,{...config,helper:'foreignHelper'});
reject(api,{...config,optionalHelper:false});
reject(api,{...config,singleTab:'ct'});
reject(api,{...config,pinsHash:'0'.repeat(64)});
reject(api,{...config,pins:{...pins,entries:pins.entries.slice(1)}});
reject(api,{...config,pins:{...pins,entries:[
 {...pins.entries[0],identity:{...pins.entries[0].identity,fmaId:'foreign'}},...pins.entries.slice(1)]}});
reject(api,{...config,pins:{...pins,entries:[
 {...pins.entries[0],identity:{...pins.entries[0].identity,id:'foreign'}},...pins.entries.slice(1)]}});
reject(api,{...config,transitionHash:'0'.repeat(64)});
reject(api,{...config,transition:{...transition,entries:transition.entries.slice(1)}});
for(const field of ['fmaId','previousHash','currentHash']){
 const row={...transition.entries[0],[field]:'foreign'};
 reject(api,{...config,transition:{...transition,entries:[row,...transition.entries.slice(1)]}});
}
const catalog={structures:pins.entries.map(e=>structuredClone(e.identity))};
assert.equal(replayGenicularClinicalTerminal(api,config,catalog),api,'Supplied exact catalog');
for(const change of [
 c=>c.structures.push(structuredClone(c.structures[0])),
 c=>c.structures.pop(),
 c=>c.structures[0].id='foreign',
 c=>c.structures[0].fmaId='foreign',
 c=>c.structures[0].sources[0].sha256='foreign',
]){
 const altered=structuredClone(catalog);change(altered);reject(api,config,altered);
}
reject(api,config,{structures:[]});
reject(api,config,{});
console.log(JSON.stringify({terminalIdentity:true,reentry:true,ordinaryCurrent:true,
 ordinaryPrevious:true,unrelatedGeneric:true,refused,catalogWhenSupplied:true,
 noCatalogSourceProof:false,clinicalApproval:false,fullHistoryAccepted:false}));
