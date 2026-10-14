import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length,2,'No test-mode arguments');
const baseline='f3d6966a040b69a375f6bbfa2a8c502b8c8492e4';
// Preservation assertions describe the completed duct epoch, not an embargo
// on later authored coronary teaching. Current duct React output remains below;
// the newer sinus test checks the complete current corpus against this epoch.
const completedEpoch='d4016ff9988064552e464980aaea1913b25d5114';
const root=fileURLToPath(new URL('../',import.meta.url));
const evidenceDir='F:/VisibleMedicine/staging/20261014-nested-cardiac-vein-imaging';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,windowsHide:true,maxBuffer:64e6});
assert.equal(git('rev-parse',baseline+'^{commit}').toString().trim(),baseline);
const old=path=>git('show',baseline+':'+path);
const hash=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`:JSON.stringify(value);
const digest=value=>hash(canonical(JSON.parse(JSON.stringify(value))));
const plain=value=>JSON.parse(JSON.stringify(value));
const now=await exactSourceHistoryApi(completedEpoch,'nested-review-security');
const before=await exactSourceHistoryApi(baseline,'nested-review-security');
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=JSON.parse(readFileSync(resolve(root,catalogPath),'utf8'));
assert.deepEqual(raw,JSON.parse(old(catalogPath)));
const catalog=now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old(catalogPath))));
assert.deepEqual(now.contentTabs,before.contentTabs);
assert.equal(catalog.structures.length,1104);
assert.equal(now.contentTabs.length,9);
assert.equal(now.nestedReviewRows.length,before.nestedReviewRows.length);
assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
assert.deepEqual(now.nestedStudyTargets(catalog),before.nestedStudyTargets(catalog));
for(const path of ['content/nested-teaching-bindings.v1.json','content/femoral-component-teaching-bindings.v1.json','content/mca-source-teaching-bindings.v1.json','content/pica-source-teaching-bindings.v1.json','content/nested-review-bindings.json','lib/nested-review-material.ts','lib/nested-review-api.ts','lib/nested-review-client.ts','lib/nested-review.ts'])assert.deepEqual(readFileSync(resolve(root,path)),old(path),path+' unchanged');
const protectedSources=new Set([catalogPath]);
for(const bundle of catalog.bundles)protectedSources.add('public'+bundle.url.split('?')[0]);
for(const path of protectedSources){const bytes=readFileSync(resolve(root,path));assert.equal(hash(bytes),path===catalogPath?hash(old(path)):catalog.bundles.find(b=>'public'+b.url.split('?')[0]===path).sha256,path+' current hash');assert.deepEqual(bytes,old(path),path+' Git baseline');}
const trackedGlbs=git('ls-files','-z').toString('utf8').split('\0').filter(path=>path.endsWith('.glb'));
assert.equal(trackedGlbs.length,146,'All tracked source GLBs remain in scope');
for(const path of trackedGlbs){const bytes=readFileSync(resolve(root,path)),prior=old(path);assert.equal(hash(bytes),hash(prior),path+' source GLB SHA');assert.deepEqual(bytes,prior,path+' source GLB bytes');}
assert.deepEqual(now.regionalTours,before.regionalTours);
const targets=now.nestedStudyTargets(catalog);
assert.equal(targets.length,108);
const chosen=new Map([
 ['pancreatic:FMA10419',{concept:'pancreatic-ductal-system',refs:['ductXrayErcp']}],
 ['pancreatic:FMA63103',{concept:'pancreatic-ductal-system',refs:['ductXrayErcp']}],
 ['hepatic:FMA71857',{concept:'hepatic-biliary',refs:['ductXrayErcp','ductXrayPtc']}],
 ['hepatic:FMA71858',{concept:'hepatic-biliary',refs:['ductXrayErcp','ductXrayPtc']}],
]);
const newRefKeys=['ductXrayErcp','ductXrayPtc'];
const priorRefs=plain(before.nestedTeachingReferences),currentRefs=plain(now.nestedTeachingReferences);
const projectedRefs=plain(currentRefs);
for(const key of newRefKeys){assert(!Object.hasOwn(priorRefs,key));assert.equal(projectedRefs[key]?.scopedToConcept,true,key);assert.match(projectedRefs[key]?.url??'',/^https:\/\//);delete projectedRefs[key];}
assert.deepEqual(projectedRefs,priorRefs,'Exactly two new scoped references');
assert.equal(new Set(newRefKeys.map(key=>currentRefs[key].url)).size,2);
assert.match(currentRefs.ductXrayErcp.url,/^https:\/\/www\.niddk\.nih\.gov\//);
assert.match(currentRefs.ductXrayPtc.url,/^https:\/\/www\.radiologyinfo\.org\//);
const baselineConcepts=new Map(before.nestedConcepts.map(c=>[c.id,c]));
assert.equal(now.nestedConcepts.length,before.nestedConcepts.length);
for(const concept of now.nestedConcepts){const prior=baselineConcepts.get(concept.id);assert(prior,concept.id);const projected=plain(concept);if(['pancreatic-ductal-system','hepatic-biliary'].includes(concept.id)){assert.deepEqual(projected.imaging?.xray?.references,concept.id==='pancreatic-ductal-system'?[newRefKeys[0]]:newRefKeys);assert.equal(projected.imaging.xray.readiness,'draft');delete projected.imaging.xray;}assert.deepEqual(projected,plain(prior),concept.id+' other teaching unchanged');}
const renderer=JSON.parse(git('show',completedEpoch+':content/body-renderer-revision.json'));
const oldRenderer=JSON.parse(old('content/body-renderer-revision.json'));
assert.notEqual(renderer.sha256,oldRenderer.sha256,'Regenerated renderer must advance');
const compiled=await componentBuild({stdin:{contents:"export {NestedTeaching} from './app/nested-teaching';",resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component={exports:{}};runInNewContext(compiled.outputFiles[0].text,{URLSearchParams,module:component,exports:component.exports,require});
let nested=0,placements=0,otherTopics=0,rootLessons=0,rootPackets=0,rendered=0,staleRejected=0,forgedRejected=0,identityRejected=0;
const storage=new Proxy({},{get(){throw Error('Rejected save reached storage');}});
const badPaths=value=>{const paths=[];const visit=(v,path)=>{if(v&&typeof v==='object'){paths.push([path,Array.isArray(v)?'append':'extra']);for(const [k,x] of Object.entries(v))visit(x,[...path,k]);}else paths.push([path,'leaf']);};visit(value,[]);return paths;};
const at=(value,path)=>path.reduce((v,k)=>v[k],value);
for(const target of targets){
 const parent=catalog.structures.find(s=>s.id===target.parentId);
 const id=target.study+':'+target.structure.fmaId;
 const selected=chosen.get(id);
 const concept=now.nestedTeachingFor(parent,target.study,target.structure);
 const prior=before.nestedTeachingFor(parent,target.study,target.structure);
 assert.equal(Boolean(concept),Boolean(prior),id);
 if(concept){
  for(const topic of now.contentTabs){
   const actual=now.nestedTopicLesson(concept,topic),oldLesson=before.nestedTopicLesson(prior,topic);
   if(selected&&topic==='xray'){
    assert.equal(concept.id,selected.concept);assert.equal(oldLesson.readiness,'pending');assert.equal(actual.readiness,'draft');
    assert.deepEqual(actual.citations,selected.refs.map(k=>currentRefs[k].url));assert.equal(actual.body,concept.imaging.xray.body);
    assert.match(actual.note,/specialist review pending/);assert.match(actual.note,/No scan access or synchronization/);
    const html=render(React.createElement(component.exports.NestedTeaching,{parent,study:target.study,selected:target.structure,initialTopic:'xray'}));
    assert(html.includes('X-ray · teaching draft'));assert(html.includes(render(React.createElement('p',null,actual.body))));assert(html.includes('Teaching references'));
    for(const key of selected.refs){assert(html.includes(currentRefs[key].url.replaceAll('&','&amp;')));assert(html.includes(currentRefs[key].title));}
    assert(!html.includes('X-ray · pending'));rendered++;placements++;
   }else{assert.deepEqual(actual,oldLesson,id+'/'+topic);otherTopics++;}
  }
 }else assert(!selected,id+' must have bound teaching');
 const key=now.nestedReviewRows.find(g=>g.parentId===target.parentId&&g.study===target.study).key;
 const packet=await now.nestedReviewMaterial(key,target.structureId),oldPacket=await before.nestedReviewMaterial(key,target.structureId);
 assert(packet&&oldPacket,id);nested++;
 const c=packet.context,p=oldPacket.context;
 assert.deepEqual(packet.source,oldPacket.source,id+' source');assert.deepEqual(packet.atlasLink,oldPacket.atlasLink,id+' atlas link');
 assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.sourceFrame,p.sourceFrame);assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);assert.equal(c.revisions.imaging,null);
 assert.equal(c.rendererHash,renderer.sha256);assert.equal(p.rendererHash,oldRenderer.sha256);assert.notEqual(c.rendererHash,p.rendererHash);
 const bound={catalogScope:c.catalogScope,nestedKey:c.nestedKey,sourceFrame:c.sourceFrame,structureId:c.structureId,checklistVersion:c.checklistVersion};
 assert.equal(c.sourceHash,digest(packet.source));assert.equal(c.teachingHash,digest(packet.teaching));
 assert.equal(c.materialHash,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,renderer:c.rendererHash,checklist:c.checklists}));
 assert.equal(c.revisions.geometry,digest({identity:bound,sourceHash:c.sourceHash,renderer:c.rendererHash,checklist:c.checklists.geometry}));
 assert.equal(c.revisions.teaching,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,checklist:c.checklists.teaching}));
 assert.notEqual(c.materialHash,p.materialHash);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
 if(selected){
  assert.notDeepEqual(packet.teaching,oldPacket.teaching);assert.notEqual(c.teachingHash,p.teachingHash);assert.notEqual(c.revisions.teaching,p.revisions.teaching);
  assert.deepEqual(packet.teaching.topics.filter(t=>t.tab!=='xray'),oldPacket.teaching.topics.filter(t=>t.tab!=='xray'));
  assert.deepEqual(packet.teaching.lesson,oldPacket.teaching.lesson);assert.deepEqual(packet.teaching.concept.modelLimit,oldPacket.teaching.concept.modelLimit);
  assert.deepEqual(packet.teaching.concept.quiz,oldPacket.teaching.concept.quiz);
  const projected=plain(packet.teaching);projected.topics.find(t=>t.tab==='xray').readiness='pending';
  const oldXray=oldPacket.teaching.topics.find(t=>t.tab==='xray');Object.assign(projected.topics.find(t=>t.tab==='xray'),plain(oldXray));
  delete projected.referenceTitles;delete projected.concept.imaging.xray;
  const oldProjected=plain(oldPacket.teaching);delete oldProjected.referenceTitles;
  assert.deepEqual(projected,oldProjected,'Only authored X-ray and scoped reference titles vary');
  assert.deepEqual(Object.keys(packet.teaching.referenceTitles).filter(url=>!Object.hasOwn(oldPacket.teaching.referenceTitles,url)).sort(),selected.refs.map(k=>currentRefs[k].url).sort());
  assert(c.teachingTabs.includes('xray'));assert(!p.teachingTabs.includes('xray'));
  for(const track of ['geometry','teaching'])for(const delta of [{materialHash:p.materialHash},{revisionHash:p.revisions[track]},{materialHash:'f'.repeat(64),revisionHash:'f'.repeat(64)}]){
   const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DUCT_XRAY'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);staleRejected++;
  }
  for(const track of ['geometry','teaching']){
   const approval={...now.blankNestedReview(c,track),status:'approved',attested:true};
   const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_DUCT_XRAY'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:approval})}),storage);
   assert.equal(response.status,422,'Synthetic approval without review evidence rejected before storage');staleRejected++;
  }
  for(const mutate of [v=>{v.context.materialHash='f'.repeat(64);},v=>{v.context.nestedKey+='-foreign';},v=>{v.context.structureId+='-foreign';},v=>{v.context.sourceFrame+='-foreign';}]){
   const forged=plain(packet);mutate(forged);
   assert.throws(()=>now.parseNestedHistory({scope:'private-to-signed-in-user',track:'teaching',context:forged.context,history:[],nextBefore:null},c,'teaching'),/worksheet or history scope changed/i);
   forgedRejected++;
  }
  for(const edit of [v=>{v.teaching.topics.find(t=>t.tab==='xray').body+=' forged';},v=>{v.teaching.concept.imaging.xray.references=['foreign'];},v=>{v.teaching.referenceTitles['https://foreign.test']='forged';},v=>{v.context.teachingHash='f'.repeat(64);},v=>{v.context.revisions.teaching='f'.repeat(64);},v=>{v.context.materialHash='f'.repeat(64);}]){const forged=plain(packet);edit(forged);assert.notDeepEqual(forged,packet);assert.equal(digest(forged.teaching)===c.teachingHash&&forged.context.teachingHash===c.teachingHash&&forged.context.materialHash===c.materialHash&&forged.context.revisions.teaching===c.revisions.teaching,false);forgedRejected++;}
  for(const identity of [parent,target.structure])for(const [path,kind] of badPaths(identity)){
   const changed=plain(identity),node=at(changed,path);
   if(kind==='extra')node.unexpected=true;else if(kind==='append')node.push('unexpected');else{const holder=at(changed,path.slice(0,-1)),key=path.at(-1),value=holder[key];holder[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;}
   const result=identity===parent?now.nestedTeachingFor(changed,target.study,target.structure):now.nestedTeachingFor(parent,target.study,changed);
   assert.equal(result,null,id+' identity '+path.join('.'));identityRejected++;
  }
  for(const identity of [parent,target.structure])for(const [path] of badPaths(identity)){
   if(!path.length)continue;
   const changed=plain(identity),holder=at(changed,path.slice(0,-1)),key=path.at(-1);
   if(Array.isArray(holder))holder.splice(Number(key),1);else delete holder[key];
   const result=identity===parent?now.nestedTeachingFor(changed,target.study,target.structure):now.nestedTeachingFor(parent,target.study,changed);
   assert.equal(result,null,id+' missing identity '+path.join('.'));identityRejected++;
  }
  const mismatched=plain(target.structure);mismatched.fmaId=target.structure.fmaId==='FMA10419'?'FMA63103':'FMA10419';assert.equal(now.nestedTeachingFor(parent,target.study,mismatched),null);identityRejected++;
 }else{
  assert.deepEqual(packet.source,oldPacket.source);assert.deepEqual(packet.teaching,oldPacket.teaching);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);
  const projected=plain(c);projected.rendererHash=p.rendererHash;projected.materialHash=p.materialHash;projected.revisions.geometry=p.revisions.geometry;
  assert.deepEqual(projected,plain(p),'Full unaffected Review packet after three proven renderer fields projected');
 }
 assert.equal((await now.nestedReviewSelection(key,target.structureId,c.sourceHash))?.context.sourceHash,c.sourceHash);
 assert.equal(await now.nestedReviewSelection(key,target.structureId,'f'.repeat(64)),null);
}
assert.deepEqual({nested,placements,rendered,otherTopics},{nested:108,placements:4,rendered:4,otherTopics:968});
for(const structure of catalog.structures){for(const tab of now.contentTabs){assert.deepEqual(now.bodyLesson(structure,tab),before.bodyLesson(structure,tab),structure.id+'/'+tab);rootLessons++;}assert.deepEqual(await now.bodyReviewMaterial(structure.id),await before.bodyReviewMaterial(structure.id),structure.id+' root Review');rootPackets++;}
assert.deepEqual({rootLessons,rootPackets},{rootLessons:9936,rootPackets:1104});
const evidence={baseline,completedEpoch,historicalApiAndPacketAssertions:true,currentDuctReactOutput:true,nestedTargets:nested,nestedTopics:108*9,xrayDraftPlacements:placements,otherNestedTopicsPreserved:otherTopics,actualNestedTeachingRenders:rendered,rootLessonsPreserved:rootLessons,rootReviewPacketsPreserved:rootPackets,sourceFilesCompared:protectedSources.size,trackedSourceGlbsPreserved:trackedGlbs.length,identityMutationsRejected:identityRejected,staleSavesRejectedBeforeStorage:staleRejected,forgedPacketMutationsDetected:forgedRejected,rendererRevisionAdvancedForAllNested:true,clinicalAcceptance:false,scanRegistration:false,browserAcceptance:false};
mkdirSync(evidenceDir,{recursive:true});writeFileSync(resolve(evidenceDir,'test-nested-duct-xray.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
