import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(p),json=p=>JSON.parse(read(p)),norm=b=>b.toString().replaceAll('\r\n','\n');
const source='3dcdf94a46db44202e72641be9fbcf1274ce5364',tree='b5ab50363b521aed2e8d4f0e34a8f5ed4ecee0d5';
const old='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd',oldTree='83720d136f899876bd947323e6552c4d3e171210';
const pin=json('atlas-review/content/craniofacial-calcification-ct-pins.json');
const bundle=await build({stdin:{contents:[
 "export {bodyLesson} from './atlas-review/app/body-content';",
 "export {craniofacialCalcificationCtLesson as lesson} from './atlas-review/lib/craniofacial-calcification-ct';",
 "export {craniofacialCalcificationCtGroups as groups,craniofacialCalcificationCtNote as note} from './atlas-review/content/craniofacial-calcification-ct';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function once(text,from,to){assert.equal(text.split(from).length,2,from);return text.replace(from,to);}

test('current admission advances only explicit source/tree/count seams; every previous assertion survives',()=>{
 const currentOriginal=read('tests/fixtures/current-atlas-delivery-before-craniofacial.txt');assert.equal(sha(currentOriginal),'7955fd210cb57b94667ae03b025987d196583e49cfbece5f056b44f80089c91c');
 let expected=norm(currentOriginal);
 const marker="test('one current fixture binds exact source tree, four learners, protected Review and model registry',()=>{";
 const at=expected.indexOf(marker),end=expected.indexOf("\ntest(",at+marker.length);assert(at>0&&end>at);
 let seam=expected.slice(at,end);seam=once(seam,old,source);seam=once(seam,oldTree,tree);expected=expected.slice(0,at)+seam+expected.slice(end);
 expected=once(expected,'assert.equal(sourceFiles,1531);','assert.equal(sourceFiles,1534);');
 assert.equal(norm(read('tests/current-atlas-delivery.test.mjs')),expected);
 const portalOriginal=read('tests/fixtures/portal-admission-before-craniofacial.txt');assert.equal(sha(portalOriginal),'7f050d9c3d2fb979ba046064a2d657d1cfcb0d352cc7980297d4bef9c30c6a7a');
 let portal=norm(portalOriginal);portal=once(portal,'binds exact clean Atlas46c','binds exact clean Atlas3dc');portal=once(portal,old,source);portal=once(portal,oldTree,tree);portal=once(portal,'assert.equal(pin.reviewSourceFiles,1531);','assert.equal(pin.reviewSourceFiles,1534);');
 assert.equal(norm(read('tests/clinical-review-portal-venous-current-admission.test.mjs')),portal);
});

test('former delivery58 stays authentic and cannot admit this new source',()=>{
 const bytes=read('tests/fixtures/current-atlas-delivery-58.json');assert.equal(sha(bytes),'0ac3d991049a0d9ba25bec4a4b69441d5d49d3220ac51f5062d81f75a7dcb30f');
 const previous=JSON.parse(bytes);assert.equal(previous.source,old);assert.equal(previous.sourceTree,oldTree);assert.equal(previous.reviewIntegration,'11ddecf2aa1978f5979338085f1b2e08ad9fa84a331b7c92a367a876357543c5');assert.equal(previous.reviewSourceFiles,1531);assert.equal(Object.keys(previous.documents).length,12);assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
});

test('new admission binds clean committed source, three added teaching inputs and existing protected models',()=>{
 const delivery=validateCurrentAtlasDelivery();assert.equal(CURRENT_ATLAS_REVISION,source);assert.equal(delivery.sourceTree,tree);assert.equal(delivery.reviewSourceFiles,1534);assert(currentAtlasDeliveryRoot());
 const manifest=json('atlas-review/manifest.json'),inputs=json('atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1664);
 for(const path of ['content/craniofacial-calcification-ct.ts','content/craniofacial-calcification-ct-pins.json','lib/craniofacial-calcification-ct.ts']){
  const row=manifest.files.find(r=>r.path===path);assert(row,path);assert.equal(sha(read('atlas-review/'+path)),row.importedSha256);assert(inputs.inputs.some(r=>r.path==='atlas-review/'+path&&r.sha256===row.importedSha256));
 }
 const models=json('lib/atlas-model-inventory.json');assert.equal(models.models.length,137);assert.equal(models.models.flatMap(r=>r.paths).length,144);assert.equal(models.models.reduce((n,r)=>n+r.bytes,0),199072480);
});

test('all four exact source selections resolve original CT drafts in imported Review and root teaching',()=>{
 assert.equal(pin.entries.length,4);assert.deepEqual(new Set(pin.entries.map(r=>r.identity.fmaId)),new Set(['FMA49068','FMA49067','FMA72311','FMA72309']));
 for(const {identity,group} of pin.entries){const result=api.lesson(identity,'ct');assert(result);assert.equal(result.readiness,'draft');assert.equal(result.body,api.groups[group].body);assert.deepEqual(api.bodyLesson(identity,'ct'),result);assert.equal(result.note,api.note);assert.match(result.note,/sign-off pending/);assert.match(result.note,/no acquired image or validated spatial registration/);assert.match(result.note,/access remain independent/);assert(result.citations.every(url=>/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(url)));}
});

test('wrong or augmented sources and other modalities cannot inherit the CT draft',()=>{
 let refusals=0;
 for(const {identity}of pin.entries){for(const mutate of [s=>{s.sources[0].sha256='0'.repeat(64);},s=>{s.laterality='midline';},s=>{s.extra='unbound';},s=>{s.id+='-other';}]){const bad=structuredClone(identity);mutate(bad);assert.equal(api.lesson(bad,'ct'),undefined);refusals++;}for(const tab of ['anatomy','function','mri','xray','ultrasound','pathology','clinical','quiz']){assert.equal(api.lesson(identity,tab),undefined);refusals++;}}
 assert.equal(refusals,48);const first=api.lesson(pin.entries[0].identity,'ct');first.bullets.push('foreign');first.citations.length=0;assert.notDeepEqual(api.lesson(pin.entries[0].identity,'ct'),first);
});

test('both original CT summaries and draft limitations reach actual emitted learner imports',()=>{
 const base='public/atlas-runtime/head-neck/',manifest=json(base+'manifest.json');assert.equal(manifest.sourceCommit,source);
 const emitted=emittedTeaching(base,manifest.files,true),visible=text=>emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1));
 for(const group of Object.values(api.groups)){assert(visible(group.body));for(const citation of group.citations)assert(visible(citation));}
 assert(visible(api.note));assert.equal(manifest.patientDataIncluded,false);
});
