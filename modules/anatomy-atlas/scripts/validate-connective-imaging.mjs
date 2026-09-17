import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {context,hash,snapshot} from './pin-connective-imaging.mjs';
import {authoringBeforeConnectiveImaging} from './connective-imaging-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/connective-imaging-pins.json' with {type:'json'};
import after from '../content/connective-imaging.transition.json' with {type:'json'};
const c=await context(),{api,display}=c,before=authoringBeforeConnectiveImaging(c),original=JSON.stringify(display);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(authoringBeforeConnectiveImaging({...c,api:before}),before);
const compiled=await build({stdin:{contents:"export * from './lib/connective-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {connectiveImagingLesson:lesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=new Map(pins.entries.map(e=>[e.identity.id,e.topics]));let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),old=before.bodyLesson(s,t);
 if(targets.get(s.id)?.includes(t)){
  assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,t));assert.notDeepEqual(now,old);changed++;
  assert(now.citations.length>=1&&now.citations.length<=2);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));assert(now.bullets.some(b=>b.startsWith('Source limit:')));
  const saved=structuredClone(now);now.bullets.push('mutation');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),saved);
 }else{assert.deepEqual(now,old);assert.equal(lesson(s,t),undefined);unchanged++;}
}
assert.equal(changed,12);assert.equal(unchanged,9906);
assert.deepEqual(pins.entries.map(e=>[e.identity.fmaId,e.identity.laterality,e.group,e.topics]),[
 ['FMA23707','right','forearm',['mri','ultrasound']],['FMA23708','left','forearm',['mri','ultrasound']],
 ['FMA35192','right','leg',['mri','ultrasound']],['FMA35193','left','leg',['mri','ultrasound']],
 ['FMA40120','right','wrist',['mri','ultrasound']],['FMA40121','left','wrist',['mri','ultrasound']]]);
const references={forearm:{mri:'https://pubmed.ncbi.nlm.nih.gov/15338212/',ultrasound:'https://doi.org/10.1053/jhsu.2002.32961'},
 leg:{mri:'https://doi.org/10.1111/os.13654',ultrasound:'https://pubmed.ncbi.nlm.nih.gov/14682426/'},
 wrist:{mri:'https://doi.org/10.1148/radiology.171.3.2717746',ultrasound:'https://pubmed.ncbi.nlm.nih.gov/2554376/'}};
for(const e of pins.entries)for(const tab of e.topics){
 const actual=lesson(e.identity,tab);assert.deepEqual(actual.citations,[references[e.group][tab]]);
 assert(actual.title.startsWith(e.identity.name+' · '));assert(actual.note.includes('No patient registration, scan or clinical approval'));
 assert(actual.note.includes('Set separation to zero before comparing relationships.'));
 assert(actual.bullets.includes('Source limit: '+e.identity.coverageNote));
 for(const pending of ['ct','xray'])assert.equal(api.bodyLesson(e.identity,pending).readiness,'pending');
}
const one=group=>pins.entries.find(e=>e.group===group).identity;
assert(lesson(one('forearm'),'mri').bullets.some(b=>b.includes('not a diagnostic threshold')));
assert(lesson(one('forearm'),'mri').bullets.some(b=>b.includes('McGinley et al. (2004)')));
assert(lesson(one('forearm'),'ultrasound').bullets.some(b=>b.includes('partial, peripheral or chronic tears')));
assert(lesson(one('leg'),'mri').body.includes('intervening intact segment'));
assert(lesson(one('leg'),'mri').bullets.some(b=>b.includes('not synonymous with the distal syndesmotic')));
assert(lesson(one('leg'),'ultrasound').body.includes('three-patient report'));
assert(lesson(one('wrist'),'mri').bullets.some(b=>b.includes('Bowing alone is not a diagnosis')));
assert(lesson(one('wrist'),'ultrasound').bullets.some(b=>b.includes('16 normal volunteers')));
assert.equal(display.structures.filter(s=>/median nerve|synovial sheath/i.test(s.name)).length,0);
const paths=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>paths(x,[...p,k]));
for(const {identity:s,topics} of pins.entries){
 const reject=bad=>{for(const t of topics){assert.equal(lesson(bad,t),undefined);rejected++;}};
 for(const p of paths(s)){const bad=structuredClone(s);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];const k=p.at(-1),v=parent[k];parent[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';reject(bad);}
 for(const mutate of [b=>b.sources.pop(),b=>b.sources.push(b.sources[0]),b=>{b.laterality=b.laterality==='left'?'right':'left';},b=>{delete b.coverageNote;}]){const bad=structuredClone(s);mutate(bad);reject(bad);}
 if(s.sources.length>1){const bad=structuredClone(s);bad.sources.reverse();reject(bad);}
 for(const t of [...api.contentTabs.filter(t=>!topics.includes(t)),'foreign'])assert.equal(lesson(s,t),undefined);
}
const first=pins.entries[0],other=display.structures.find(s=>!targets.has(s.id));
const alter=fn=>({...c,api:{...api,bodyLesson:fn}});
assert.throws(()=>authoringBeforeConnectiveImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?{...api.bodyLesson(s,t),body:'unrecorded'}:api.bodyLesson(s,t))),/Unrecorded connective imaging/);
assert.throws(()=>authoringBeforeConnectiveImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?first.previous.mri:api.bodyLesson(s,t))),/Mixed connective imaging/);
assert.throws(()=>authoringBeforeConnectiveImaging(alter((s,t)=>s.id===other.id&&t==='anatomy'?{...api.bodyLesson(s,t),body:'changed unrelated'}:api.bodyLesson(s,t))),/full teaching/);
assert.throws(()=>authoringBeforeConnectiveImaging({...c,api:{...before,bodyLesson:(s,t)=>s.id===other.id&&t==='anatomy'?{...before.bodyLesson(s,t),body:'changed unrelated before'}:before.bodyLesson(s,t)}}),/Prior full teaching/);
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const content=await contentContext(),records=content.api.bodyContentRecords(display),registry=new Map([...content.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const record of records)assert(validate(record));
for(const e of pins.entries)for(const t of e.topics){const r=records.find(r=>r.id===e.identity.id);assert.deepEqual(r.content[t],api.bodyLesson(e.identity,t));assert.equal(r.validation.clinicalApproval,'not-included');}
assert.equal(JSON.stringify(display),original);
const report={source:pins.sourceCommit,sourceSelections:6,changedPlacements:changed,unchangedTopics:unchanged,rejectedChangedIdentityCases:rejected,bodySchemaRecords:records.length,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/connective-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
