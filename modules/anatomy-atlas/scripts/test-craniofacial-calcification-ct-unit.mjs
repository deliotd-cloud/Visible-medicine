import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const pins=JSON.parse(readFileSync('content/craniofacial-calcification-ct-pins.json'));
const bytes=readFileSync(pins.catalogPath),catalog=JSON.parse(bytes),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(pins.sourceCommit,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');assert.equal(sha(bytes),pins.catalogSha256);
assert.equal(catalog.sourceVersion,pins.sourceVersion);assert.equal(catalog.license,pins.license);assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
assert.equal(pins.entries.length,4);assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,4);
const expected=new Map([['FMA49068',['left','trochlea','cartilage']],['FMA49067',['right','trochlea','cartilage']],['FMA72311',['left','stylohyoid','ligament']],['FMA72309',['right','stylohyoid','ligament']]]);
const compiled=await build({stdin:{contents:"export {craniofacialCalcificationCtLesson} from './lib/craniofacial-calcification-ct';export * from './content/craniofacial-calcification-ct';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')),lesson=api.craniofacialCalcificationCtLesson;
const leafRows=(value,path=[])=>value&&typeof value==='object'?Object.entries(value).flatMap(([key,next])=>leafRows(next,[...path,key])):[{path,value}];
const mutate=(target,path,value)=>{for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=value;};
let refusals=0,nonCtRefusals=0;
for(const {identity,group}of pins.entries){assert.deepEqual(identity,catalog.structures.find(s=>s.id===identity.id));assert.deepEqual([identity.laterality,group,identity.category],expected.get(identity.fmaId));assert.equal(identity.system,'connective');assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
 const draft=lesson(identity,'ct');assert.equal(draft.readiness,'draft');assert.match(draft.title,/CT orientation · draft$/);assert.match(draft.note,/radiologist review and sign-off pending/);assert.match(draft.note,/no acquired image or validated spatial registration/);assert.match(draft.note,/paid-lecture access remain independent/);
 assert(([draft.body,...draft.bullets].join(' ').match(/\S+/g)||[]).length<100);
 for(const topic of ['anatomy','function','mri','xray','ultrasound','pathology','clinical','quiz','CT']){assert.equal(lesson(identity,topic),undefined);nonCtRefusals++;}
 for(const {path,value}of leafRows(identity)){const altered=structuredClone(identity);mutate(altered,path,typeof value==='string'?value+' changed':typeof value==='number'?value+1:typeof value==='boolean'?!value:'changed');assert.equal(lesson(altered,'ct'),undefined,path.join('.'));refusals++;}
 assert.equal(lesson({...identity,foreign:true},'ct'),undefined);refusals++;
 const clone=structuredClone(draft);draft.bullets.push('foreign');draft.citations.push('https://invalid.test/');assert.deepEqual(lesson(identity,'ct'),clone);
}
for(const structure of catalog.structures.filter(s=>!pins.entries.some(e=>e.identity.id===s.id)))assert.equal(lesson(structure,'ct'),undefined);
assert.deepEqual(pins.bundles,catalog.bundles.filter(b=>pins.entries.some(e=>e.identity.bundle===b.id)));
for(const bundle of pins.bundles){const path='public'+new URL(bundle.url,'https://local.invalid').pathname;assert.equal(sha(readFileSync(path)),bundle.sha256);}
const references=api.craniofacialCalcificationCtReferences;
assert.deepEqual(Object.values(references),['https://pubmed.ncbi.nlm.nih.gov/23945224/','https://pubmed.ncbi.nlm.nih.gov/20157406/','https://pubmed.ncbi.nlm.nih.gov/11498437/']);
assert.match(api.craniofacialCalcificationCtGroups.trochlea.bullets.join(' '),/nor excludes injury or a foreign body/);
assert.match(api.craniofacialCalcificationCtGroups.stylohyoid.bullets.join(' '),/does not establish Eagle syndrome/);
console.log(JSON.stringify({selections:4,ctDrafts:4,sourceLeafAndExtraFieldRefusals:refusals,nonCtRefusals,otherSources:catalog.structures.length-4,newAssets:false,clinicalApproval:false}));
