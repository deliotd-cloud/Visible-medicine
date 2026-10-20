import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage=path.dirname(fileURLToPath(import.meta.url));
const source='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(file);
const parse=file=>JSON.parse(read(file));
const git=args=>execFileSync('git',['-C',source,...args],{encoding:'utf8',windowsHide:true}).trim();
const paths=['content/corpus-imaging.ts','lib/corpus-imaging.ts'];
const previous=['c6e45f351156738a2175bd3b759e38b948bd4d63c4719ace21a96cb8c027229b','c5f100e44a819ebe7f532d1960c90be3936c084dad7e1651a9af9e34af1acea9'];
assert.equal(git(['rev-parse','HEAD']),'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
assert.equal(git(['status','--porcelain']),'');
for(const [i,p] of paths.entries())for(const root of [source,stage+'/before'])assert.equal(sha(read(root+'/'+p)),previous[i],p);
const oldContent=read(stage+'/before/'+paths[0]).toString();
const newContent=read(stage+'/files/'+paths[0]).toString();
const start=newContent.indexOf(' ct:{\n'),end=newContent.indexOf(' mri:{\n');
assert(start>=0&&end>start);assert.equal(newContent.slice(0,start)+newContent.slice(end),oldContent);
const oldLib=read(stage+'/before/'+paths[1]).toString(),newLib=read(stage+'/files/'+paths[1]).toString();
assert.equal(newLib.replace("if(tab!=='ct'&&tab!=='mri'&&tab!=='ultrasound')","if(tab!=='mri'&&tab!=='ultrasound')"),oldLib);

const {build}=await import(pathToFileURL(source+'/scripts/workspace-test-build.mjs'));
const overlayPaths=new Map(paths.map(p=>[path.resolve(source,p),p]));
const hits=[];
const override={name:'exact-two-file-ct-proposal',setup(api){api.onLoad({filter:/corpus-imaging\.ts$/,namespace:'workspace-test'},args=>{
  const p=overlayPaths.get(path.resolve(args.path));if(!p)return;
  hits.push(p);return {contents:read(stage+'/files/'+p).toString(),loader:'ts',resolveDir:path.dirname(args.path)};
});}};
const compiled=async plugins=>{
 const result=await build({plugins,stdin:{contents:"export {bodyLesson} from './app/body-content.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts'; export {corpusImagingLesson} from './lib/corpus-imaging.ts'; export {bodyContentRecords} from './lib/content-export.ts';",resolveDir:source,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',metafile:true});
 const bytes=result.outputFiles[0].contents;
 return {api:await import('data:text/javascript;base64,'+Buffer.from(bytes).toString('base64')),sha256:sha(bytes),inputs:result.metafile.inputs};
};
const before=await compiled([]),after=await compiled([override]);
assert.deepEqual(hits.slice().sort(),paths.slice().sort());
const raw=parse(source+'/public/models/bodyparts3d/full-body/catalog.json');
const beforeDisplay=before.api.bodyDisplayCatalog(raw),display=after.api.bodyDisplayCatalog(raw);
assert.deepEqual(display,beforeDisplay);assert.equal(display.structures.length,1104);
assert.deepEqual(before.api.contentTabs,after.api.contentTabs);
const target=display.structures.find(s=>s.fmaId==='FMA19617');assert(target);
const pins=parse(source+'/content/corpus-imaging-pins.json');assert.deepEqual(target,pins.entries[0].identity);
assert.deepEqual(pins.entries[0].topics,['mri','ultrasound']);
let changed=0,preserved=0;
for(const s of display.structures)for(const tab of after.api.contentTabs){
 const old=before.api.bodyLesson(s,tab),now=after.api.bodyLesson(s,tab);
 if(s.id===target.id&&tab==='ct'){
   assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.notDeepEqual(now,old);
   assert.deepEqual(now,after.api.corpusImagingLesson(s,tab));changed++;
 }else{assert.deepEqual(now,old,s.id+'|'+tab);preserved++;}
}
assert.equal(changed,1);assert.equal(preserved,9935);
const lesson=after.api.bodyLesson(target,'ct');
assert.match(lesson.body,/not the urethral passage/);
assert(lesson.bullets.some(x=>x.includes('22 men')&&x.includes('not evidence')));
assert(lesson.bullets.some(x=>x.includes('did not measure')&&x.includes('study-specific limitation')));
assert(lesson.bullets.some(x=>x.includes('no glans, tunical layers or validated urethral lumen')));
assert(lesson.bullets.includes('Source limit: '+target.coverageNote));
assert.deepEqual(lesson.citations,['https://doi.org/10.3390/app11031006','https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html']);
assert.match(lesson.note,/No patient registration, scan or clinical approval/);
assert.match(lesson.note,/paid-lecture access remain independent/);
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
let identityRefusals=0;
for(const p of leaves(target)){
 const bad=structuredClone(target);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];
 const key=p.at(-1),value=parent[key];parent[key]=typeof value==='number'?value+.01:typeof value==='string'?value+'-foreign':typeof value==='boolean'?!value:'foreign';
 for(const tab of ['ct','mri','ultrasound']){assert.equal(after.api.corpusImagingLesson(bad,tab),undefined);identityRefusals++;}
}
for(const mutate of [s=>s.sources.pop(),s=>s.sources.push(s.sources[0]),s=>{delete s.coverageNote;},s=>{delete s.provenance;},s=>{s.laterality='left';}]){
 const bad=structuredClone(target);mutate(bad);for(const tab of ['ct','mri','ultrasound']){assert.equal(after.api.corpusImagingLesson(bad,tab),undefined);identityRefusals++;}
}
assert.equal(after.api.corpusImagingLesson(target,'foreign'),undefined);
const saved=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations.push('foreign');assert.deepEqual(after.api.bodyLesson(target,'ct'),saved);
const oldRecords=before.api.bodyContentRecords(beforeDisplay),records=after.api.bodyContentRecords(display);
assert.equal(records.length,1104);let changedRecords=0;
for(const [i,record]of records.entries()){
 if(record.id===target.id){const restored=structuredClone(record);restored.content.ct=oldRecords[i].content.ct;assert.deepEqual(restored,oldRecords[i]);assert.deepEqual(record.content.ct,saved);assert.equal(record.validation.clinicalApproval,'not-included');changedRecords++;}
 else assert.deepEqual(record,oldRecords[i]);
}
assert.equal(changedRecords,1);
for(const bundle of pins.bundles){const b=read(source+'/public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(sha(b),bundle.sha256);}
for(const [i,p]of paths.entries())assert.equal(sha(read(source+'/'+p)),previous[i]);
assert.equal(git(['status','--porcelain']),'');
const sourceInputs=Object.keys(before.inputs).map(key=>key.replace(/^workspace-test:/,'')).filter(p=>path.isAbsolute(p)).map(p=>({path:path.relative(source,p).replaceAll('\\','/'),sha256:sha(read(p))}));
assert(sourceInputs.length>500);
const receipt={at:new Date().toISOString(),method:'Actual pure Node resolver/export execution, two exact staged source substitutions; not production integration/build/history acceptance',source:git(['rev-parse','HEAD']),paths:paths.map((p,i)=>({path:p,beforeSha256:previous[i],afterSha256:sha(read(stage+'/files/'+p))})),originalFileInversesExact:true,baselineResolverSha256:before.sha256,proposalResolverSha256:after.sha256,sourceInputs,sourceInputsCount:sourceInputs.length,displayedRepresentations:1104,changedRootTopicPlacements:changed,preservedRootTopicPlacements:preserved,changedExportRecords:changedRecords,preservedExportRecords:records.length-changedRecords,identityRefusals,modelsUnchanged:true,priorMriUltrasoundAndOtherTopicsPreserved:true,canonicalInstalled:false,websiteCandidateEdited:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,fullHistorySuiteRun:false,next:'After current full Website run terminal, admit the proposal through normal Atlas source/history/review/export binding and focused original validators; do not repin old snapshots or claim this overlay is installed.'};
fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...receipt,sourceInputs:undefined}));
