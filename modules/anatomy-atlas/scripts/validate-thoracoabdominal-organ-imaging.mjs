import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {authoringBeforeThoracoabdominalOrganImaging,thoracoabdominalOrganImagingHash as hash} from './thoracoabdominal-organ-imaging-history.mjs';
import {authoringBeforeThoracoabdominalOrganXray} from './thoracoabdominal-organ-xray-history.mjs';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import {authoringBeforeCentralVesselImaging} from './central-vessel-imaging-history.mjs';
import {beforeCorpusSpongiosumSource} from './corpus-spongiosum-source-history.mjs';
import corpusPins from '../content/corpus-imaging-pins.json' with {type:'json'};
const newest=await contentContext();
if(process.argv.includes('--xray-focused')){
  const restored=authoringBeforeThoracoabdominalOrganXray(newest);
  const {api}=newest,display=api.bodyDisplayCatalog(newest.catalog),groups=api.thoracoabdominalOrganImagingGroups;
  const selected=pins.entries.filter(e=>groups[e.group].focus.xray);
  assert.deepEqual(selected.map(e=>e.identity.fmaId).sort(),['FMA11338','FMA14542','FMA7088','FMA7131','FMA7148','FMA7200','FMA7201','FMA7309','FMA7310','FMA7394','FMA9607'].sort());
  for(const {identity,group} of pins.entries){
    assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
    const draft=api.thoracoabdominalOrganImagingLesson(identity,'xray');
    if(!groups[group].focus.xray){assert.equal(draft,undefined);continue;}
    assert.equal(draft.readiness,'draft');
    assert.deepEqual(api.bodyLesson(identity,'xray'),draft);
    assert.equal(restored.api.bodyLesson(identity,'xray').readiness,'pending');
    const {readiness:_readiness,...shown}=draft;
    assert.deepEqual(api.bodyContent(identity,'xray'),shown);
    assert(draft.citations.every(url=>url.startsWith('https://')));
    const changed=structuredClone(identity);changed.name+=' altered';
    assert.equal(api.thoracoabdominalOrganImagingLesson(changed,'xray'),undefined);
  }
  assert.match(groups.appendix.focus.xray.pitfall,/usually not appropriate for suspected appendicitis/);
  console.log(JSON.stringify({xrayDrafts:selected.length,exactSource:true,otherThoracoabdominalXrayPending:true,clinicalApproval:false}));
  process.exit(0);
}
const unprojected=authoringBeforeCentralVesselImaging(newest);
const context={...newest,api:beforeCorpusSpongiosumSource(unprojected,newest.catalog)},{api}=context,catalog=api.bodyDisplayCatalog(context.catalog);
const corpus=corpusPins.entries[0].identity,corpusBundle=corpusPins.bundles[0];
const liveDisplay=unprojected.bodyDisplayCatalog(newest.catalog);
assert.deepEqual(liveDisplay.structures.filter(s=>s.id===corpus.id),[corpus]);
assert.deepEqual(liveDisplay.bundles.filter(b=>b.id===corpusBundle.id),[corpusBundle]);
assert.equal(catalog.structures.some(s=>s.id===corpus.id),false);
assert.equal(catalog.bundles.some(b=>b.id===corpusBundle.id),false);
for(const mutate of [
  d=>d.structures.find(s=>s.id===corpus.id).bounds.min[0]+=.01,
  d=>d.bundles.find(b=>b.id===corpusBundle.id).sha256='foreign',
  d=>d.structures[0].anchor[0]+=.01,
]){
  const damaged=structuredClone(liveDisplay);mutate(damaged);
  assert.throws(()=>beforeCorpusSpongiosumSource({...unprojected,bodyDisplayCatalog:()=>damaged},newest.catalog),/Unrecorded source-era display change/);
}
assert.throws(()=>beforeCorpusSpongiosumSource({...unprojected,bodyLesson(s,t){
  const lesson=unprojected.bodyLesson(s,t);
  return s.id===corpus.id&&t==='anatomy'?{...lesson,body:'foreign'}:lesson;
}},newest.catalog),/Unrecorded later corpus teaching change/);
assert.equal(beforeCorpusSpongiosumSource(api,newest.catalog),api);
const {thoracoabdominalOrganImagingGroups:groups,thoracoabdominalOrganImagingReferences:references}=api;
const original=JSON.stringify(catalog),before=authoringBeforeThoracoabdominalOrganImaging(newest);
assert.equal(hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),pins.previousAllLessonsAndRecipesHash,'All preceding teaching and recipes preserved');
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures)for(const tab of api.contentTabs) {
  // Later X-ray and main-bronchus external ultrasound extensions have separate transitions.
  if(tab==='ultrasound'&&['FMA7395','FMA7396'].includes(s.fmaId))continue;
  const topic=tab==='xray'?undefined:api.thoracoabdominalOrganImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,now.body))));
  for(const bullet of now.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of now.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  const copy=structuredClone(topic);topic.bullets.push('changed');topic.citations.push('foreign');assert.deepEqual(api.thoracoabdominalOrganImagingLesson(s,tab),copy);
  const old=before.bodyLesson(s,tab);old.body='changed';assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.notEqual(before.bodyLesson(s,tab).body,'changed');
  rendered++;
}
assert.equal(Object.keys(groups).length,15);assert.equal(changed,42);assert.equal(unchanged,9865);assert.equal(rendered,42);
for(const [region,count] of [['thorax',8],['abdomen',7]])assert.equal(pins.entries.filter(e=>groups[e.group].region===region).length,count);
const unresolved=pins.entries.filter(e=>!groups[e.group].focus.ultrasound).map(e=>e.identity);
assert.deepEqual(unresolved.map(s=>s.fmaId).sort(),['FMA7131']);
for(const s of unresolved){assert.equal(api.thoracoabdominalOrganImagingLesson(s,'ultrasound'),undefined);assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');}
assert.match(groups['left-lung'].focus.ct.body,/lingula.*upper lobe/);
assert.match(groups.thymus.focus.mri.body,/younger thymus.*lack/);
assert.match(groups['cystic-duct'].focus.mri.pitfall,/false connections/);
assert.match(api.thoracoabdominalOrganImagingLesson(pins.entries.find(e=>e.group==='ileocecal-junction').identity,'ct').bullets.join(' '),/source uses this same component/);
for(const {identity:s,topics} of pins.entries)for(const mutate of [
  x=>x.system='muscular',x=>x.category='bone',x=>x.laterality=x.laterality==='left'?'right':'left',x=>x.id=pins.entries.find(e=>e.identity.id!==s.id).identity.id,
  x=>x.id+='foreign',x=>x.name+='foreign',x=>x.fmaId='FMA000',x=>x.laterality='foreign',x=>x.region='foot',x=>x.regions.push('foot'),x=>x.sourceName+='foreign',x=>x.sourceTree='foreign',x=>x.sources[0].sha256='changed',x=>x.sources[0].file='changed',x=>x.bundle='foreign',x=>x.nodeName='foreign',x=>x.anchor[0]+=.01,x=>x.bounds.min[0]+=.01,x=>x.validation={status:'unvalidated',anatomicalReview:true},
]) {const bad=structuredClone(s);mutate(bad);for(const tab of topics){assert.equal(api.thoracoabdominalOrganImagingLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}}
assert.equal(rejected,798);
const first=pins.entries[0].identity;
assert.throws(()=>authoringBeforeThoracoabdominalOrganImaging({...newest,api:{...newest.api,bodyLesson(s,t){const lesson=newest.api.bodyLesson(s,t);return s.id===first.id&&t==='ct'?{...lesson,body:'unrecorded'}:lesson;}}}),/Unrecorded thoracoabdominal organ imaging change|Unrecorded whole-body teaching change after clinical reference revision/);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
const budgets={},unique=new Map();
for(const entry of Object.values(groups).flatMap(g=>Object.values(g.focus)))unique.set(JSON.stringify(entry),entry);
for(const f of unique.values())for(const key of f.references){assert(references[key]?.startsWith('https://'));budgets[key]=(budgets[key]||0)+((f.body+' '+f.pitfall).match(/\S+/g)?.length||0);}
for(const [key,count]of Object.entries(budgets))assert(count<=200,key+' reference word count '+count);
assert.equal(JSON.stringify(catalog),original);
const report={baselineSource:pins.sourceCommit,groups:15,sourceSelections:15,originalDraftPlacements:changed,laterMainBronchusUltrasoundDrafts:2,currentDraftPlacements:changed+2,modalities:{ct:15,mri:15,ultrasound:14},unchangedTopics:unchanged,ultrasoundPending:unresolved.map(s=>s.fmaId),bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
await writeFile('docs/thoracoabdominal-organ-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
