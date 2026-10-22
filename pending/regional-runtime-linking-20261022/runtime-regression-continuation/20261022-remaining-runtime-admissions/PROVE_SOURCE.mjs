import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pathToFileURL} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const candidate='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const atlas='F:/VisibleMedicine/atlas';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(base,path)=>readFileSync(resolve(base,path));
const replaceOnce=(text,from,to)=>{assert.equal(text.split(from).length,2,`Unique inverse: ${from}`);return text.replace(from,to);};
const changes={
 'posterior-fossa-coverage.test.mjs':[
  ["[\"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');\",\"assert.equal(coverageRevision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');\"]","[\"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');\",\"assert.equal(coverageRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\"]"],
  ["assert.equal(coverageRevision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');","assert.equal(coverageRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
 ],
 'regional-learning-catalogue-history.ts':[
  ["import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';","import {checkedAtlasHistoryRepo,checkedAtlasSourceRepo} from './atlas-source-repo.mjs';"],
  ["import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n",''],
  ["const epochs={legacy:","const currentSource='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst epochs={legacy:"],
  ['const live=currentAtlasDeliveryRoot(),currentSource=CURRENT_ATLAS_REVISION;','const live=checkedAtlasSourceRepo(currentSource);'],
 ],
 'regional-learning-catalogue.test.ts':[
  ["import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n",''],
  ['assert.equal(actual.sourceRevision,CURRENT_ATLAS_REVISION);',"assert.equal(actual.sourceRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
 ],
 'shoulder-us-renderer-migration.test.mjs':[
  ['current admission is the independently pinned 6d7 delivery','current admission is the independently pinned 46c delivery'],
  ["assert.equal(delivery.CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');","assert.equal(delivery.CURRENT_ATLAS_REVISION,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');"],
  ["assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');","assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');"],
  ['assert.equal(pin.reviewSourceFiles,1558);','assert.equal(pin.reviewSourceFiles,1531);'],
  ["  assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.notEqual(pin.runtimeSources.shoulder,pin.source);\n",''],
 ],
 'spinal-craniofacial-ct-current-compatibility.test.mjs':[
  [" const shoulder=json('public/atlas-runtime/shoulder/manifest.json');\n assert.equal(delivery.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n assert.equal(shoulder.sourceCommit,delivery.runtimeSources.shoulder);\n assert.notEqual(shoulder.sourceCommit,delivery.source);\n const shoulderInputs=json('public/atlas-runtime/shoulder/source-inputs.json');\n for(const path of paths){\n  const retained=git('show',delivery.runtimeSources.shoulder+':'+path);\n  assert.deepEqual(retained,git('show',introduced+':'+path),path+': historical shoulder Git source retained');\n  if(path.endsWith('.transition.json'))continue;\n  const row=shoulderInputs.find(input=>input.path===path);assert(row,path+': shoulder input');\n  assert.equal(row.sha256,sha(retained),path+': shoulder runtime source binding');\n }\n",''],
  ["  const expected=base==='public/atlas-review-viewer/'?delivery.source:\n   delivery.runtimeSources[base.split('/')[2]];\n  assert.equal(manifest.sourceCommit,expected,base);","  assert.equal(manifest.sourceCommit,delivery.source,base);"],
 ],
 'regional-link-role-preservation-20261021.test.mjs':[
  ["  [\"import {checkedAtlasHistoryRepo,checkedAtlasSourceRepo} from './atlas-source-repo.mjs';\",\n   \"import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\\nimport {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\",'current admission dependency'],\n",''],
  ["  [\"const currentSource='87ed7e343260c7df48a40d53503f25bbfd34cfa5';\\n\",'', 'current source now comes from the exact delivery'],\n  ['const live=checkedAtlasSourceRepo(currentSource);',\n   'const live=currentAtlasDeliveryRoot(),currentSource=CURRENT_ATLAS_REVISION;', 'current source reader role'],","  [\"const currentSource='87ed7e343260c7df48a40d53503f25bbfd34cfa5';\",\n   \"const currentSource='190a63238eadcf906abe89dcbb6a67c88afe70b9';\",'only the current source reader role'],"],
  ["  [\"import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';\",\n   \"import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';\\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\",'current delivery import'],\n",''],
  ["   '  assert.equal(actual.sourceRevision,CURRENT_ATLAS_REVISION);','current imported catalogue source'],","   \"  assert.equal(actual.sourceRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\",'current imported catalogue source'],"],
 ],
};
const files=[];
for(const[name,edits]of Object.entries(changes)){
 const code=read(stage,`CODE/tests/${name}`).toString(),raw=read(stage,`RAW/tests/${name}`).toString();
 let inverse=code;for(const[from,to]of edits)inverse=replaceOnce(inverse,from,to);
 assert.equal(inverse,raw,`Complete frozen V6 inverse: ${name}`);
 for(const[from]of edits)assert.notEqual(code.replace(from,from+' changed'),code);
 files.push({path:`tests/${name}`,rawSha256:sha(raw),codeSha256:sha(code),inverses:edits.length});
}
const historicalFixture='tests/fixtures/regional-link-before-role-batch-20261021';
const regionalHistory=read(candidate,`${historicalFixture}/regional-learning-catalogue-history.ts.raw`).toString();
assert.equal(sha(regionalHistory),'59e5289e64ee679867674bbf2263de2f8ff17b9c15add6f2ddd237aa1847ebd9');
let expectedHistory=replaceOnce(regionalHistory,
 "import {checkedAtlasHistoryRepo,checkedAtlasSourceRepo} from './atlas-source-repo.mjs';",
 "import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\nimport {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';");
expectedHistory=replaceOnce(expectedHistory,"const currentSource='87ed7e343260c7df48a40d53503f25bbfd34cfa5';\n",'');
expectedHistory=replaceOnce(expectedHistory,'const live=checkedAtlasSourceRepo(currentSource);',
 'const live=currentAtlasDeliveryRoot(),currentSource=CURRENT_ATLAS_REVISION;');
assert.equal(read(stage,'CODE/tests/regional-learning-catalogue-history.ts').toString(),expectedHistory,'Complete regional history source preserved');
const regionalTest=read(candidate,`${historicalFixture}/regional-learning-catalogue.test.ts.raw`).toString();
assert.equal(sha(regionalTest),'5e6d1ebabeb635cacffa1de78485cad254655a42bcf964285650e51595be698c');
let expectedTest=replaceOnce(regionalTest,
 "import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';",
 "import {historicalRegionalCatalogue,historical408RegionalCatalogue,assertCurrentRegionalSource,assertHistoricalRegionalSource,pinned408WebsiteRead} from './regional-learning-catalogue-history.ts';\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';");
expectedTest=replaceOnce(expectedTest,"  assert.equal(actual.sourceRevision,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
 '  assert.equal(actual.sourceRevision,CURRENT_ATLAS_REVISION);');
assert.equal(read(stage,'CODE/tests/regional-learning-catalogue.test.ts').toString(),expectedTest,'Complete regional catalogue test preserved');
const pin=JSON.parse(read(candidate,'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,current);assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
assert.equal(pin.runtimeSources['head-neck'],current);assert.equal(pin.runtimeSources.shoulder,historical);
assert.equal(pin.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
assert.equal(pin.reviewSourceFiles,1558);
const manifest=JSON.parse(read(candidate,'atlas-review/manifest.json'));
const coverage=JSON.parse(read(candidate,'docs/anatomy-coverage/index.json'));
assert.equal(manifest.revision,current);assert.equal(coverage.sourceRevision,current);
assert.equal(Object.keys(coverage.evidence.sourceInputs).length,168);
const sourcePath='content/posterior-fossa-ultrasound.ts';
assert.equal(coverage.evidence.sourceInputs[sourcePath],'fdf5e8cf8ca9a8babc9053b5007633aab61b3c98f351f7536369d01e530d957a');
assert.equal(manifest.files.find(f=>f.path===sourcePath).sourceSha256,coverage.evidence.sourceInputs[sourcePath]);
assert.equal(JSON.parse(read(candidate,'public/atlas-runtime/shoulder/manifest.json')).sourceCommit,historical);
assert.equal(JSON.parse(read(candidate,'public/atlas-runtime/head-neck/manifest.json')).sourceCommit,current);
assert.equal(JSON.parse(read(candidate,'public/atlas-review-viewer/manifest.json')).sourceCommit,current);
const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),current);
assert.equal(git('rev-parse',`${current}^{tree}`).toString().trim(),pin.sourceTree);
assert.equal(git('merge-base',historical,current).toString().trim(),historical);
for(const path of ['lib/regional-tours.ts','lib/cervical-disc-tour.ts','lib/medial-thigh-tour.ts','lib/posterior-calf-tour.ts','lib/lower-venous-tour.ts','content/cervical-disc-tour-pins.json','content/medial-thigh-tour-pins.json','content/posterior-calf-tour-pins.json','content/lower-venous-tour-v2-pins.json'])
 assert.deepEqual(read(candidate,`atlas-review/${path}`),git('show',`${current}:${path}`),`Current regional imported source: ${path}`);
const shoulderPins=git('show',`${current}:content/shoulder-girdle-arterial-ultrasound-pins.json`);
assert.deepEqual(read(candidate,'atlas-review/content/shoulder-girdle-arterial-ultrasound-pins.json'),shoulderPins);
const introduced='2e67298f33a74ba4f45c868e10605ddd9b567af2';
const shoulderInputs=JSON.parse(read(candidate,'public/atlas-runtime/shoulder/source-inputs.json'));
for(const path of ['content/craniofacial-calcification-ct-pins.json','content/craniofacial-calcification-ct.transition.json','content/craniofacial-calcification-ct.ts','lib/craniofacial-calcification-ct.ts']){
 const retained=git('show',`${historical}:${path}`),first=git('show',`${introduced}:${path}`);
 assert.deepEqual(retained,first,`Shoulder historical Git CT source retained: ${path}`);
 if(path.endsWith('.transition.json'))continue;
 assert.equal(shoulderInputs.find(row=>row.path===path)?.sha256,sha(retained),`Shoulder imported CT source: ${path}`);
}
const emittedApi=await import(pathToFileURL(resolve(candidate,'tests/atlas-emitted-teaching.ts')).href);
const authored=read(candidate,'atlas-review/content/craniofacial-calcification-ct.ts').toString();
const phrases=[...authored.matchAll(/body: '([^']+)'/g)].map(match=>match[1]);
phrases.push(authored.match(/craniofacialCalcificationCtNote = '([^']+)'/)?.[1]);
assert.equal(phrases.length,3);assert(phrases.every(Boolean));
for(const [base,source]of [['public/atlas-runtime/head-neck/',current],['public/atlas-runtime/shoulder/',historical],['public/atlas-review-viewer/',current]]){
 const runtime=JSON.parse(read(candidate,base+'manifest.json'));
 assert.equal(runtime.sourceCommit,source,`Exact emitted family: ${base}`);
 const emitted=emittedApi.emittedTeaching(base,runtime.files,true,path=>read(candidate,path));
 for(const phrase of phrases)assert(emitted.includes(phrase)||emitted.includes(JSON.stringify(phrase).slice(1,-1)),`Exact draft emitted: ${base}`);
}
const mutated=structuredClone(pin);mutated.runtimeSources.shoulder=current;
assert.notDeepEqual(mutated.runtimeSources,pin.runtimeSources,'Shoulder family mutation refused by exact family proof');
const deliveryApi=await import(pathToFileURL(resolve(candidate,'tests/current-atlas-delivery.mjs')).href);
assert.deepEqual(deliveryApi.validateCurrentAtlasDelivery(),pin);
assert.throws(()=>deliveryApi.validateCurrentAtlasDelivery({pin:mutated}),/shoulder|Expected values/);
const coverageApi=await import(pathToFileURL(resolve(candidate,'scripts/check-anatomy-coverage.mjs')).href);
const specimen=Buffer.from('exact teaching'),one={sourceRevision:current,evidence:{sourceInputs:{[sourcePath]:sha(specimen)}}};
const ports={head:()=>current,status:()=>'',readSource:()=>specimen,committedSource:()=>specimen};
assert.equal(coverageApi.verifyCoverageSources(one,ports),one);
assert.throws(()=>coverageApi.verifyCoverageSources(one,{...ports,head:()=>historical}),/stale/);
assert.throws(()=>coverageApi.verifyCoverageSources(one,{...ports,readSource:()=>Buffer.from('changed')}),/working source mismatch/);
assert.throws(()=>coverageApi.verifyCoverageSources(one,{...ports,committedSource:()=>Buffer.from('changed')}),/committed source mismatch/);
const report={schema:'vm-source-only-runtime-admissions/1',current,sourceTree:pin.sourceTree,historicalShoulder:historical,reviewIntegration:pin.reviewIntegration,files,callbacks:['validateCurrentAtlasDelivery genuine and shoulder-revision mutation','verifyCoverageSources genuine, stale, working, committed','emittedTeaching genuine head, shoulder, viewer manifests with authored CT bodies and note'],sourceOnly:true,nativeAdmission:false};
writeFileSync(resolve(stage,'PROOF.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:files.length,inverses:files.reduce((n,f)=>n+f.inverses,0),current,historicalShoulder:historical}));
