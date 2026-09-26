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
import {build} from './workspace-component-test-build.mjs';
import {execFileSync} from 'node:child_process';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
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
  const laterBronchi = pins.entries.filter(e=>['FMA7395','FMA7396'].includes(e.identity.fmaId));
  assert.equal(laterBronchi.length,2);
  for(const {identity} of laterBronchi){
    assert.deepEqual(api.bodyLesson(identity,'xray'),api.mainBronchusXrayLesson(identity,'xray'));
    assert.equal(api.bodyLesson(identity,'xray').readiness,'draft');
    assert.equal(restored.api.bodyLesson(identity,'xray').readiness,'pending');
  }
  console.log(JSON.stringify({originalXrayDrafts:selected.length,laterMainBronchusXrayDrafts:laterBronchi.length,exactSource:true,clinicalApproval:false}));
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
// Scoped adapters retain later unrelated content; whole historical snapshots
// must use both original source trees, rather than a mixture with the live tree.
const transitionCommit='6d8c900b4f80843ca7568e4222ffb49d0d22e1f1';
const gitBytes=(commit,path)=>execFileSync('git',['show',commit+':'+path],{maxBuffer:16e6});
const transition=JSON.parse(await readFile('content/thoracoabdominal-organ-imaging.transition.json','utf8'));
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/thoracoabdominal-organ-imaging-pins.json')),pins);
assert.deepEqual(JSON.parse(gitBytes(transitionCommit,'content/thoracoabdominal-organ-imaging.transition.json')),transition);
const rawBefore=JSON.parse(gitBytes(pins.sourceCommit,'public/models/bodyparts3d/full-body/catalog.json'));
const rawAfter=JSON.parse(gitBytes(transitionCommit,'public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(rawAfter,rawBefore,'Original transition preserves raw geometry catalog');
const historicalBefore=await exactSourceHistoryApi(pins.sourceCommit);
const historicalAfter=await exactSourceHistoryApi(transitionCommit);
const oldDisplay=historicalBefore.bodyDisplayCatalog(rawBefore);
assert.deepEqual(historicalAfter.bodyDisplayCatalog(rawAfter),oldDisplay);
assert.deepEqual(historicalBefore.contentTabs,api.contentTabs);
assert.deepEqual(historicalAfter.contentTabs,api.contentTabs);
assert.equal(hash(wholeBodyTeachingSnapshot(historicalBefore,rawBefore)),pins.previousAllLessonsAndRecipesHash,'All original preceding teaching and recipes preserved');
assert.deepEqual(historicalAfter.structures,historicalBefore.structures);
assert.deepEqual(historicalAfter.dissectionProfiles,historicalBefore.dissectionProfiles);
const recorded=new Map(pins.entries.flatMap(e=>e.topics.map(t=>[e.identity.id+'|'+t,{entry:e,tab:t}])));
let historicalChanged=0,historicalUnchanged=0;
for(const s of oldDisplay.structures)for(const t of api.contentTabs){
  const entry=recorded.get(s.id+'|'+t),previous=historicalBefore.bodyLesson(s,t),next=historicalAfter.bodyLesson(s,t);
  if(!entry){assert.deepEqual(next,previous,'Original unrelated topic preserved');historicalUnchanged++;continue;}
  assert.deepEqual(s,entry.entry.identity);
  assert.deepEqual(previous,entry.entry.previous[t]);
  assert.equal(hash(next),transition.entries.find(e=>e.id===s.id).sections[t]);
  assert.deepEqual(api.bodyLesson(s,t),next,'Live normalized lesson matches original recorded transition');
  historicalChanged++;
}
assert.equal(historicalChanged,42);assert.equal(historicalUnchanged,9867);
const records=api.bodyContentRecords(catalog),registry=new Map([...context.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const r of records)assert(validate(r));
let changed=0,unchanged=0,rejected=0,rendered=0;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const {SourceDisplayNotes}=scope.exports;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of catalog.structures)for(const tab of api.contentTabs) {
  // Later X-ray and main-bronchus external ultrasound extensions have separate transitions.
  if(tab==='ultrasound'&&['FMA7395','FMA7396'].includes(s.fmaId))continue;
  const laterEsophagus=tab==='ultrasound'&&s.fmaId==='FMA7131';
  const topic=tab==='xray'||laterEsophagus?undefined:api.thoracoabdominalOrganImagingLesson(s,tab),now=api.bodyLesson(s,tab);
  if(!topic){assert.deepEqual(now,before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,topic);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],topic);assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(new Set(topic.citations).size,topic.citations.length);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
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
for(const s of unresolved){assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');assert.equal(before.bodyLesson(s,'ultrasound').readiness,'pending');assert.equal(newest.api.thoracoabdominalOrganImagingLesson(s,'ultrasound').readiness,'draft');assert.deepEqual(newest.api.bodyLesson(s,'ultrasound'),newest.api.thoracoabdominalOrganImagingLesson(s,'ultrasound'));}
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
const currentUltrasoundPending=pins.entries.filter(e=>!newest.api.thoracoabdominalOrganImagingGroups[e.group].focus.ultrasound).map(e=>e.identity.fmaId);
assert.deepEqual(currentUltrasoundPending,[]);
const report={baselineSource:pins.sourceCommit,groups:15,sourceSelections:15,originalDraftPlacements:changed,laterMainBronchusUltrasoundDrafts:2,laterEsophagusUltrasoundDrafts:1,currentDraftPlacements:changed+3,modalities:{ct:15,mri:15,ultrasound:15},unchangedTopics:unchanged,historicalUltrasoundPending:unresolved.map(s=>s.fmaId),ultrasoundPending:currentUltrasoundPending,bodySchemaRecords:records.length,actualNoteRenders:rendered,rejectedSourceTopicCombinations:rejected,uniqueReferenceFacts:unique.size,sourceWordCounts:budgets,sourceGeometryChanged:false,currentApprovalRecordsChanged:false,clinicalApproval:false,imagesImported:false,imagingConnected:false,browserOrDeviceAcceptance:false};
report.historicalReplay={transitionCommit,changedTopics:historicalChanged,unchangedTopics:historicalUnchanged,originalBaselineHash:pins.previousAllLessonsAndRecipesHash,originalCatalogAndRecipesUnchanged:true};
await writeFile('docs/thoracoabdominal-organ-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
