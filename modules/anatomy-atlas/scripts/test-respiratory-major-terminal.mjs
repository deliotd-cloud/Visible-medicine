import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {beforeRespiratoryCoreDepth} from './respiratory-core-depth-history.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=n=>JSON.parse(readFileSync(root+'content/'+n+'.json','utf8'));
const pins=read('respiratory-core-depth-pins');
const transition=read('respiratory-core-depth.transition');
const major=read('major-organ-function-pins');
const target='vm:anatomy:body:thorax:unpaired:organ:trachea';
const older=major.entries.find(e=>e.identity.id===target).previous.function;
const rows=pins.entries.flatMap(e=>Object.entries(e.previous).map(([tab,previous])=>({identity:e.identity,tab,previous})));
const key=(id,tab)=>JSON.stringify([id,tab]);
const record=new Map(transition.entries.map(e=>[key(e.id,e.tab),e.currentHash]));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {build}=await import(pathToFileURL(root+'scripts/workspace-test-build.mjs'));
const built=await build({stdin:{contents:"export {respiratoryCoreDepthLesson} from './lib/respiratory-core-depth';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {respiratoryCoreDepthLesson:helper}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
for(const row of rows)assert.equal(hash(helper(row.identity,row.tab)),record.get(key(row.identity.id,row.tab)));
const current=new Map(rows.map(r=>[key(r.identity.id,r.tab),helper(r.identity,r.tab)]));
const previous=new Map(rows.map(r=>[key(r.identity.id,r.tab),r.previous]));
const terminal=new Map(previous);terminal.set(key(target,'function'),older);
const unrelated={id:'unrelated',body:'untouched'};
const apiFor=map=>{
 const bodyLesson=(s,t)=>map.get(key(s.id,t))??(s.id===unrelated.id?unrelated:undefined);
 return {bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;},respiratoryCoreDepthLesson:helper};
};
const api=apiFor(terminal);
assert.equal(beforeRespiratoryCoreDepth(api),api,'Exact terminal composite is identity return');
assert.equal(beforeRespiratoryCoreDepth(beforeRespiratoryCoreDepth(api)),api,'Double entry is identity return');
assert.equal(beforeRespiratoryCoreDepth(api).bodyLesson(unrelated,'anatomy'),unrelated);
const normalized=beforeRespiratoryCoreDepth(apiFor(current));
for(const row of rows)assert.deepEqual(normalized.bodyLesson(row.identity,row.tab),row.previous);
const prior=apiFor(previous);assert.equal(beforeRespiratoryCoreDepth(prior),prior);
let refusals=0;const reject=value=>{assert.throws(()=>beforeRespiratoryCoreDepth(value));refusals++;};
const unobserved=new Map(current);unobserved.set(key(target,'function'),older);reject(apiFor(unobserved));
for(const row of rows.filter(r=>!(r.identity.id===target&&r.tab==='function'))){
 const mixed=new Map(terminal);mixed.set(key(row.identity.id,row.tab),current.get(key(row.identity.id,row.tab)));reject(apiFor(mixed));
 const foreign=new Map(terminal);foreign.set(key(row.identity.id,row.tab),{...row.previous,body:'foreign'});reject(apiFor(foreign));
}
for(const field of ['readiness','title','body','note']){const changed=new Map(terminal);changed.set(key(target,'function'),{...older,[field]:'foreign'});reject(apiFor(changed));}
reject({...api,respiratoryCoreDepthLesson:undefined});
reject({...api,respiratoryCoreDepthLesson:42});
reject({...api,respiratoryCoreDepthLesson(){return {readiness:'draft',body:'foreign'};}});
reject({...api,bodyContent:undefined});
reject({...api,bodyContent(s,t){const v=api.bodyContent(s,t);return s.id===target&&t==='function'?{...v,body:'foreign'}:v;}});
const catalog={structures:pins.entries.map(e=>structuredClone(e.identity))};
assert.equal(beforeRespiratoryCoreDepth(api,catalog),api);
for(const modify of [c=>c.structures.push(structuredClone(c.structures[0])),c=>c.structures[0].sources[0].sha256='foreign',c=>c.structures.pop()]){
 const bad=structuredClone(catalog);modify(bad);assert.throws(()=>beforeRespiratoryCoreDepth(api,bad));refusals++;
}
console.log(JSON.stringify({terminalIdentityReturn:true,normalCurrentAndPrevious:true,unobservedCurrentCompositeRefused:true,refusals,clinicalApproval:false}));
