import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const pins=JSON.parse(readFileSync('content/craniofacial-calcification-ct-pins.json'));
const compiled=await build({stdin:{contents:"export {stylohyoidMriContextLesson as lesson} from './lib/stylohyoid-mri-context';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {lesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=pins.entries.filter(e=>e.group==='stylohyoid');assert.equal(targets.length,2);
const leaves=(v,p=[])=>v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k])):[{path:p,value:v}];
let refused=0;
for(const {identity}of targets){
 const context=lesson(identity,'mri');assert.equal(context.readiness,'pending');assert.equal(context.title,`${identity.name} · MRI context · review pending`);
 assert.deepEqual(context.citations,['https://pmc.ncbi.nlm.nih.gov/articles/PMC4601974/']);assert.match(context.body,/published Eagle syndrome case/);
 assert.match(context.bullets.join(' '),/does not establish reliable MRI visibility/);assert.match(context.note,/radiologist review and sign-off pending/);assert.match(context.note,/access remain independent/);
 for(const tab of ['ct','anatomy','function','xray','ultrasound','pathology','clinical','quiz','MRI'])assert.equal(lesson(identity,tab),undefined);
 for(const row of leaves(identity)){const copy=structuredClone(identity);let target=copy;for(const k of row.path.slice(0,-1))target=target[k];target[row.path.at(-1)]=typeof row.value==='string'?row.value+' changed':typeof row.value==='number'?row.value+1:typeof row.value==='boolean'?!row.value:'changed';assert.equal(lesson(copy,'mri'),undefined);refused++;}
 assert.equal(lesson({...identity,foreign:true},'mri'),undefined);refused++;
 context.bullets.push('mutated');context.citations.length=0;assert(!lesson(identity,'mri').bullets.includes('mutated'));assert.equal(lesson(identity,'mri').citations.length,1);
}
for(const entry of pins.entries.filter(e=>e.group!=='stylohyoid'))assert.equal(lesson(entry.identity,'mri'),undefined);
console.log(JSON.stringify({mriContexts:2,readiness:'pending',sourceLeafAndExtraFieldRefusals:refused,nonMriRefusals:18,ctResolverUnchanged:true,clinicalApproval:false}));
