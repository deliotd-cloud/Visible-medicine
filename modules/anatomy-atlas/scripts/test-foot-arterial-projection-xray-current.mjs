// Stable current contract after the historical 589→introduction transition is recorded.
// Run from the Atlas checkout. No generated display pins are substituted.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const root = process.cwd(), baseline = '589263554141ba94548f9073327d4e51674bc33b';
const {build} = await import(pathToFileURL(resolve(root,'scripts/workspace-test-build.mjs')));
const {exactSourceHistoryApi} = await import(pathToFileURL(resolve(root,'scripts/exact-source-history-api.mjs')));
const git = args => execFileSync('git', args, {cwd:root,windowsHide:true,
  maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const original = path => git(['show',`${baseline}:${path}`]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a,b,label) => assert.deepEqual(a,b,label);
assert.equal(git(['rev-parse',`${baseline}^{commit}`]).toString().trim(),baseline);
assert.equal(git(['rev-parse',`${baseline}^{tree}`]).toString().trim(),
  'ba724f0a46448132a6e5fc4c24f63730b53540f9');

// Source names, sides, files and bundles were independently inventoried at 589.
const specs = [
  ['dorsal','FMA43916','Right dorsalis pedis artery','right','FJ2055','foot-vessels-recovery'],
  ['dorsal','FMA43917','Left dorsalis pedis artery','left','FJ2073','foot-vessels-recovery'],
  ['medial','FMA43929','Right medial plantar artery','right','FJ2164','foot-vessels-recovery'],
  ['medial','FMA43930','Left medial plantar artery','left','FJ2082','foot-vessels-recovery'],
  ['lateral','FMA43931','Right lateral plantar artery','right','FJ2159','foot-vessels-recovery'],
  ['lateral','FMA43932','Left lateral plantar artery','left','FJ2079','foot-vessels-recovery'],
  ['arch','FMA43943','Right plantar arch','right','FJ2169','foot-vessels-foot-vascular'],
  ['arch','FMA43944','Left plantar arch','left','FJ2085','foot-vessels-foot-vascular'],
  ['deep','FMA69514','Right deep plantar artery','right','FJ2136','foot-vessels-foot-vascular'],
  ['deep','FMA69515','Left deep plantar artery','left','FJ2068','foot-vessels-foot-vascular'],
  ['superficial','FMA43937','Right superficial medial plantar artery','right','FJ2179','foot-vessels-foot-vascular'],
  ['superficial','FMA43938','Left superficial medial plantar artery','left','FJ2089','foot-vessels-foot-vascular'],
];
const spec = new Map(specs.map(row=>[row[1],row]));
assert.equal(spec.size,12);
same(new Set(specs.map(row=>row[0])),new Set(['dorsal','medial','lateral','arch','deep','superficial']));
for(const group of new Set(specs.map(row=>row[0])))
  same(specs.filter(row=>row[0]===group).map(row=>row[3]),['right','left']);

const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const historical=await exactSourceHistoryApi(baseline,'display');
const originalCatalog=historical.bodyDisplayCatalog(JSON.parse(original(rawPath)));
const originalById=new Map(originalCatalog.structures.map(row=>[row.id,row]));
const pin=JSON.parse(readFileSync('content/foot-arterial-projection-xray-pins.json','utf8'));
assert.equal(pin.parentCommit,baseline);
assert.equal(pin.entries.length,12);
same(new Set(pin.entries.map(e=>e.identity.fmaId)),new Set(spec.keys()));
assert.equal(new Set(pin.entries.map(e=>e.identity.id)).size,12);
const compiled=await build({stdin:{contents:`
export {footArterialProjectionXrayLesson} from './lib/foot-arterial-projection-xray';
export * from './content/foot-arterial-projection-xray';
export {bodyLesson} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const current=await import('data:text/javascript;base64,'+
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=current.bodyDisplayCatalog(JSON.parse(readFileSync(rawPath,'utf8')));
same(pin.coordinateSystem,catalog.coordinateSystem);
same(pin.coordinateSystem,originalCatalog.coordinateSystem);
same(pin.bundles,catalog.bundles.filter(bundle=>pin.entries.some(e=>e.identity.bundle===bundle.id)));
same(pin.bundles,originalCatalog.bundles.filter(bundle=>pin.entries.some(e=>e.identity.bundle===bundle.id)));
assert.equal(pin.bundles.length,2);
assert.equal(catalog.sourceVersion,'4.0');
assert.equal(catalog.license,'CC-BY-4.0');
const byId=new Map(catalog.structures.map(row=>[row.id,row]));
assert.equal(byId.size,catalog.structures.length,'Current catalogue IDs remain unique');
for(const bundle of pin.bundles){
  const path=`public${bundle.url.split('?')[0]}`,bytes=readFileSync(path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(sha(bytes),bundle.sha256);
  same(bytes,original(path),`${path}: unchanged licensed bytes`);
}
const refs=current.footArterialProjectionXrayReferences;
same(new Set(Object.values(refs)),new Set([
  'https://anatomy.ttuhscep.edu/schemes/leg_tables.html',
  'https://pubmed.ncbi.nlm.nih.gov/20041296/',
  'https://pubmed.ncbi.nlm.nih.gov/9810995/',
  'https://pubmed.ncbi.nlm.nih.gov/11694970/',
  'https://pubmed.ncbi.nlm.nih.gov/9787393/',
]));
same(new Set(Object.keys(current.footArterialProjectionXrayTopics)),
  new Set(['dorsal','medial','lateral','arch','deep','superficial']));
assert.match(current.footArterialProjectionXrayShared.join(' '),/not a contrast-filled lumen examination/i);
assert.match(current.footArterialProjectionXrayShared.join(' '),/cannot establish patency/i);
let drafts=0,refusals=0;
for(const entry of pin.entries){
  const id=entry.identity,[group,fma,name,side,file,bundle]=spec.get(id.fmaId)||[];
  assert(group);
  same([entry.group,id.fmaId,id.name,id.laterality,id.bundle],[group,fma,name,side,bundle]);
  same(id.sources.map(source=>source.file),[file]);
  same(id,originalById.get(id.id),`${fma}: independently replayed historical identity`);
  same(id,byId.get(id.id),`${fma}: current selected catalogue identity`);
  assert.equal(id.validation.status,'unvalidated');
  assert.equal(id.validation.anatomicalReview,false);
  const topic=current.footArterialProjectionXrayTopics[group];
  assert(topic.body.length>60);
  const lesson=current.bodyLesson(id,'xray');
  same(lesson,current.footArterialProjectionXrayLesson(id,'xray'));
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.body,topic.body);
  same(lesson.bullets,[...current.footArterialProjectionXrayShared]);
  same(lesson.citations,[...new Set([...topic.references.map(key=>refs[key]),refs.calcification])]);
  assert.match(lesson.note,/review pending/i);
  assert.match(lesson.note,/no acquired images/i);
  assert.match(lesson.note,/Ordinary radiography and contrast angiography are distinct/i);
  assert.doesNotMatch([lesson.body,...lesson.bullets,lesson.note].join(' '),
    /(?:model|mesh|source).{0,50}(?:proves|confirms|establishes).{0,40}(?:patency|flow|lumen|occlusion|patient)/i);
  const copy=structuredClone(lesson);
  lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  same(current.footArterialProjectionXrayLesson(id,'xray'),copy,'Fresh lesson arrays');
  for(const tab of current.contentTabs.filter(tab=>tab!=='xray'))
    assert.equal(current.footArterialProjectionXrayLesson(id,tab),undefined);
  for(const change of [
    s=>{s.name+=' foreign';},s=>{s.fmaId+=' foreign';},
    s=>{s.laterality=s.laterality==='left'?'right':'left';},
    s=>{s.regions.push('head-neck');},s=>{s.center[0]+=.001;},
    s=>{s.sources[0].sha256='0'.repeat(64);},
    s=>{s.sources.push(structuredClone(s.sources[0]));},
    s=>{s.id+=' foreign';},
  ]){
    const bad=structuredClone(id);change(bad);
    assert.equal(current.footArterialProjectionXrayLesson(bad,'xray'),undefined);
    refusals++;
  }
  drafts++;
}
assert.equal(drafts,12);
assert.equal(refusals,96);
let unsupported=0;
for(const side of ['right','left']){
  const vein=byId.get(`vm:anatomy:body:foot:${side}:vessel:dorsal-venous-arch-of-${side}-foot`);
  assert(vein);
  assert.equal(current.footArterialProjectionXrayLesson(vein,'xray'),undefined);unsupported++;
  for(const suffix of ['deep-plantar-artery','superficial-medial-plantar-artery']){
    const branch=byId.get(`vm:anatomy:body:foot:${side}:vessel:${side}-${suffix}`);
    assert(branch);
    assert.equal(current.footArterialProjectionXrayLesson(branch,'ultrasound'),undefined);unsupported++;
  }
}
assert.equal(unsupported,6);
console.log(JSON.stringify({baseline,drafts,groups:6,bundles:2,refusals,unsupported,
  historicalWholeTransition:'separate introduction evidence',
  unrelatedCatalogueAndLessonAdditions:'not frozen by selected current contract',clinicalApproval:false}));
