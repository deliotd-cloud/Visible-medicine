// Exact Git predecessor and actual learner/Review regression. No private records or asset writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {beforeAbdominalAortaUltrasound,oldFocus,newFocus,hash,assertAortaRevision} from './abdominal-aorta-ultrasound-history.mjs';
import transition from '../content/abdominal-aorta-ultrasound-revision.transition.json' with {type:'json'};
import {createGitObjectReader} from './git-object-reader.mjs';
import {build} from './workspace-test-build.mjs';
process.on('uncaughtException',error=>{process.stderr.write(error.message+'\n');process.exit(1);});
const mark=phase=>process.stderr.write(JSON.stringify({phase,memory:process.memoryUsage()})+'\n');

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline='aa4a92a958408d665eafceacbd9850dd5712cb41';
const targetId='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta';
const tracked=new Map(execFileSync('git',['ls-tree','-r',baseline],{cwd:root,encoding:'utf8',maxBuffer:16e6})
  .trim().split('\n').map(line=>{const match=/^\d+ blob ([a-f0-9]{40})\t(.+)$/.exec(line);return match?[match[2],match[1]]:[];}));
const sourcePath=resolve(root,'content/central-vessel-imaging.ts');
const normalized=s=>s.replaceAll('\r\n','\n').trimEnd();
const currentSource=await readFile(sourcePath,'utf8');
const oldSource=execFileSync('git',['show',baseline+':content/central-vessel-imaging.ts'],{cwd:root,encoding:'utf8',maxBuffer:16e6});
const oldLine=`    ultrasound:fact('${oldFocus.body}','${oldFocus.pitfall}','${oldFocus.references[0]}'),`;
const newLine=`    ultrasound:fact('${newFocus.body}','${newFocus.pitfall}','${newFocus.references.join("','")}'),`;
const refBlock="  aortaAiumUS:'https://onlinelibrary.wiley.com/doi/10.1002/jum.70167',\n  aortaNhsScreen:'https://www.gov.uk/government/publications/aaa-screening-standard-operating-procedures/aaa-screening-programme-guidance',\n";
assert.equal(normalized(oldSource).split(oldLine).length,2,'One frozen predecessor focus');
assert.equal(normalized(currentSource).split(newLine).length,2,'One proposed focus');
assert.equal(normalized(currentSource).split(refBlock).length,2,'Exactly one paired reference insertion');
assert.equal(normalized(currentSource).replace(refBlock,'').replace(newLine,oldLine),normalized(oldSource),'Exact new revision reverses to Git baseline; no other source edits');
assert.equal(transition.baselineCommit,baseline);
assert.equal(transition.id,targetId);
assert.equal(transition.beforeLessonSha256,'5838df6120062a0ab9dc23e5452b80356de2b8ed4f474e707a0a2cc768125ebe');
const reader=createGitObjectReader({cwd:root});
const git=async path=>{assert(tracked.has(path),'Missing baseline blob: '+path);return (await reader.readBlob(tracked.get(path))).toString('utf8');};

const entry=`export {bodyLesson,bodyContent} from './app/body-content.ts';
export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';
export {contentTabs} from './lib/content-types.ts';
export {centralVesselImagingLesson} from './lib/central-vessel-imaging.ts';
export {centralVesselImagingGroups,centralVesselImagingReferences} from './content/central-vessel-imaging.ts';
export {bodyReviewSnapshot,bodyReviewMaterial} from './lib/body-review-material.ts';
export {bodyReviewContext} from './lib/body-review-context.ts';
export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity.ts';
export {parseBodyReviewResponse} from './lib/body-review-response.ts';`;
async function load(exactBaseline){
  const bundle=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',
    plugins:exactBaseline?[{name:'exact-aa4a92a-blobs',setup(api){
      api.onResolve({filter:/^node:/},args=>({path:args.path,external:true}));
      api.onLoad({filter:/.*/},async args=>{
        const path=relative(root,args.path).replaceAll('\\','/');
        if(path.startsWith('node_modules/'))return;
        assert(!path.startsWith('../'),'Baseline import escaped repository');
        return {contents:await git(path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json','.mjs':'js'})[extname(path)]||'js',resolveDir:dirname(args.path)};
      });
    }}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
}
let before,after,raw,originalRaw,originalPins;
try{
  mark('baseline-build');before=await load(true);mark('current-build');after=await load(false);mark('catalog-check');
  raw=JSON.parse(await readFile(resolve(root,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
  originalRaw=JSON.parse(await git('public/models/bodyparts3d/full-body/catalog.json'));
  originalPins=JSON.parse(await git('content/central-vessel-imaging-pins.json'));
}finally{await reader.close();}
assert.deepEqual(raw,originalRaw,'Current source catalog equals exact baseline');
const pins=JSON.parse(await readFile(resolve(root,'content/central-vessel-imaging-pins.json'),'utf8'));
assert.deepEqual(pins,originalPins,'Original central source pins immutable');
const catalog=after.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,before.bodyDisplayCatalog(raw),'Displayed identities and geometry unchanged');
const pinned=pins.entries.find(e=>e.identity.id===targetId);
assert(pinned&&pinned.group==='abdominal-aorta'&&pinned.identity.fmaId==='FMA3789');
const s=pinned.identity,tab='ultrasound';
assert.deepEqual(catalog.structures.find(x=>x.id===targetId),s);
assert.equal(transition.sourceComponent.file,'FJ1932');
assert.equal(transition.sourceComponent.sha256,s.sources[0].sha256);
let changed=0,preserved=0;
for(const structure of catalog.structures)for(const topic of after.contentTabs){
  const old=before.bodyLesson(structure,topic),next=after.bodyLesson(structure,topic);
  if(structure.id===targetId&&topic===tab){changed++;assert.notDeepEqual(next,old);assert.deepEqual(next,after.centralVesselImagingLesson(structure,topic));}
  else{assert.deepEqual(next,old,structure.id+' '+topic);preserved++;}
}
assert.equal(changed,1);assert.equal(preserved,9935);
mark('all-topics-checked');
const oldLesson=before.bodyLesson(s,tab),newLesson=after.bodyLesson(s,tab);
assert.equal(hash(oldLesson),transition.beforeLessonSha256);
assert.equal(hash(newLesson),transition.afterLessonSha256);
assert.equal(newLesson.readiness,'draft');
assert.deepEqual(after.bodyReviewSnapshot(targetId).topics.find(t=>t.tab===tab),{tab,...newLesson});
assert.deepEqual(before.bodyReviewSnapshot(targetId).topics.find(t=>t.tab===tab),{tab,...oldLesson});
const oldMaterial=await before.bodyReviewMaterial(targetId),newMaterial=await after.bodyReviewMaterial(targetId);
const oldContext=await before.bodyReviewContext(targetId),newContext=await after.bodyReviewContext(targetId);
assert.equal(newMaterial.approval,false);assert.equal(newMaterial.status,'worksheet-not-submitted');
assert.equal(await after.bodyReviewDisplayMatches(newMaterial,targetId),true,'Current revised worksheet display pin');
assert.deepEqual(await after.parseBodyReviewResponse(newMaterial,targetId),newMaterial,'Current revised worksheet accepts direct evidence');
const transported=JSON.parse(JSON.stringify(newMaterial));
assert.deepEqual(await after.parseBodyReviewResponse(transported,targetId),transported,'Current revised worksheet accepts JSON evidence');
assert.equal(await after.parseBodyReviewResponse(oldMaterial,targetId),null,'Old teaching packet does not become current evidence');
const forgedCurrent=structuredClone(newMaterial);
forgedCurrent.topics.find(t=>t.tab===tab).body+=' foreign';
assert.equal(await after.parseBodyReviewResponse(forgedCurrent,targetId),null,'Current hash claim cannot approve altered teaching');
assert.equal(newContext.sourceHash,oldContext.sourceHash);
assert.notEqual(newContext.revisions.teaching,oldContext.revisions.teaching);
assert.notEqual(newMaterial.materialHash,oldMaterial.materialHash);
const renderer=JSON.parse(await readFile(resolve(root,'content/body-renderer-revision.json'),'utf8'));
const scope={catalogScope:newContext.catalogScope,structureId:newContext.structureId,checklistVersion:newContext.checklistVersion};
const expectedGeometry=hash({...scope,source:newContext.sourceHash,renderer:renderer.sha256,checks:newContext.checklists.geometry});
assert.equal(newContext.rendererHash,renderer.sha256);
assert.equal(newContext.revisions.geometry,expectedGeometry,'Geometry revision follows actual current renderer');
let unrelatedReviewRecords=0;
for(const structure of catalog.structures){
  if(structure.id===targetId)continue;
  assert.deepEqual(after.bodyReviewSnapshot(structure.id),before.bodyReviewSnapshot(structure.id));
  assert.deepEqual(await after.bodyReviewMaterial(structure.id),await before.bodyReviewMaterial(structure.id));
  unrelatedReviewRecords++;
}
assert.equal(unrelatedReviewRecords,1103);
mark('all-review-materials-checked');
let refused=0;
for(const mutate of [x=>x.id+='-foreign',x=>x.name+=' foreign',x=>x.fmaId='FMA000',x=>x.sourceName+=' foreign',x=>x.sources[0].sha256='foreign',x=>x.sources[0].file='foreign',x=>x.bounds.min[0]+=.01,x=>x.anchor[0]+=.01,x=>x.region='head-neck',x=>x.laterality='left']){
  const altered=structuredClone(s);mutate(altered);
  assert.equal(after.centralVesselImagingLesson(altered,tab),undefined,'Altered source refused');
  assert.notDeepEqual(after.bodyLesson(altered,tab),newLesson);refused++;
}
assert.equal(refused,10);
const restored=beforeAbdominalAortaUltrasound(after,catalog);
assert.equal(beforeAbdominalAortaUltrasound(before,catalog),before,'Exact old draft is idempotent');
assert.deepEqual(restored.centralVesselImagingGroups,before.centralVesselImagingGroups);
assert.deepEqual(restored.centralVesselImagingReferences,before.centralVesselImagingReferences);
for(const structure of catalog.structures)for(const topic of after.contentTabs)
  assert.deepEqual(restored.bodyLesson(structure,topic),before.bodyLesson(structure,topic),'Exact predecessor replay');
assert.deepEqual(restored.centralVesselImagingLesson(s,tab),before.centralVesselImagingLesson(s,tab));
assert.deepEqual(restored.bodyContent(s,tab),before.bodyContent(s,tab));

let adapterRefusals=0;
const reject=api=>{mark('adapter-refusal-'+(adapterRefusals+1));assert.throws(()=>beforeAbdominalAortaUltrasound(api,catalog));adapterRefusals++;};
for(const key of ['body','pitfall','references']){
  const groups=structuredClone(after.centralVesselImagingGroups);
  groups['abdominal-aorta'].focus.ultrasound[key]=key==='references'?['aortaEcho']:groups['abdominal-aorta'].focus.ultrasound[key]+' foreign';
  reject({...after,centralVesselImagingGroups:groups});
}
for(const key of ['body','citations','note']){
  reject({...after,bodyLesson(x,t){const lesson=after.bodyLesson(x,t);return x.id===targetId&&t===tab?{...lesson,[key]:key==='citations'?[]:'foreign'}:lesson;}});
}
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(x=>x.id===targetId).sources[0].sha256='foreign';
assert.throws(()=>beforeAbdominalAortaUltrasound(after,foreignCatalog));adapterRefusals++;
reject({...after,centralVesselImagingLesson(x,t){return x.id===targetId&&t===tab?undefined:after.centralVesselImagingLesson(x,t);}});
reject({...after,bodyContent(x,t){const shown=after.bodyContent(x,t);return x.id===targetId&&t===tab?{...shown,body:'foreign'}:shown;}});
for(const ref of ['aortaAiumUS','aortaNhsScreen'])reject({...after,centralVesselImagingReferences:{...after.centralVesselImagingReferences,[ref]:'https://example.invalid/foreign'}});
const omittedCurrent={...after};delete omittedCurrent.centralVesselImagingGroups;delete omittedCurrent.centralVesselImagingLesson;delete omittedCurrent.centralVesselImagingReferences;
reject(omittedCurrent);
const partialGroup={...after};delete partialGroup.centralVesselImagingGroups;reject(partialGroup);
const partialHelper={...after};delete partialHelper.centralVesselImagingLesson;reject(partialHelper);
const omittedOld={...before};delete omittedOld.centralVesselImagingGroups;delete omittedOld.centralVesselImagingLesson;delete omittedOld.centralVesselImagingReferences;
assert.equal(beforeAbdominalAortaUltrasound(omittedOld,catalog),omittedOld,'Only exact old hashed lesson may omit central contract');
const omittedForged={...omittedOld,bodyLesson(x,t){const lesson=before.bodyLesson(x,t);return x.id===targetId&&t===tab?{...lesson,body:'foreign'}:lesson;}};
reject(omittedForged);
const synthetic={bodyLesson(){return undefined;}};
assert.equal(beforeAbdominalAortaUltrasound(synthetic),synthetic,'Only no-catalog/no-display/no-central exact-undefined synthetic prior');
assert.throws(()=>beforeAbdominalAortaUltrasound({...synthetic,bodyLesson(){return {readiness:'draft'};}}));adapterRefusals++;
reject({...before,bodyContent(x,t){const shown=before.bodyContent(x,t);return x.id===targetId&&t===tab?{...shown,body:'foreign'}:shown;}});
reject({...before,centralVesselImagingLesson(){return undefined;}});
reject({...after,centralVesselImagingLesson:42});
reject({...after,bodyLesson:undefined});
const pendingOmitted={...omittedOld,bodyLesson(x,t){return x.id===targetId&&t===tab?structuredClone(pinned.previous.ultrasound):before.bodyLesson(x,t);},bodyContent(x,t){const{readiness,...content}=this.bodyLesson(x,t);return content;}};
assert.equal(beforeAbdominalAortaUltrasound(pendingOmitted,catalog),pendingOmitted,'Exact original pending epoch retained');
reject({...pendingOmitted,bodyContent(){return {body:'foreign'};}});
const noContent={...after};delete noContent.bodyContent;
assert.equal(beforeAbdominalAortaUltrasound(noContent,catalog).bodyContent,undefined,'Absent exports stay absent');
let transitionRefusals=0;
assertAortaRevision(transition);
for(const key of ['baselineCommit','id','beforeLessonSha256','afterLessonSha256','proposedSourceFileSha256','sourceComponent']){
  const foreign=structuredClone(transition);foreign[key]=key==='sourceComponent'?{...foreign.sourceComponent,sha256:'foreign'}:'foreign';
  assert.throws(()=>assertAortaRevision(foreign),/Unrecorded aorta revision manifest/);transitionRefusals++;
}
for(const incomplete of [{bodyDisplayCatalog(){return catalog;}},{bodyContent(){return {};}}]){
  assert.throws(()=>beforeAbdominalAortaUltrasound(incomplete),/requires body lesson/);adapterRefusals++;
}
assert.equal(adapterRefusals,23);assert.equal(transitionRefusals,6);mark('all-refusals-checked');
console.log(JSON.stringify({baseline,changed,preserved,unrelatedReviewRecords,refused,adapterRefusals,transitionRefusals,oldHash:hash(oldLesson),newHash:hash(newLesson),clinicalApproval:false,baselineFromExactGitBlobs:true,currentRenderer:renderer.sha256}));
