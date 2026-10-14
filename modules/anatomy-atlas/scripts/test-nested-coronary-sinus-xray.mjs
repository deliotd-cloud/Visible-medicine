import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length,2,'No test-mode arguments');
const baseline='d4016ff9988064552e464980aaea1913b25d5114';
const root=fileURLToPath(new URL('../',import.meta.url));
const evidenceDir='F:/VisibleMedicine/staging/20261014-nested-cardiac-vein-imaging';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,windowsHide:true,maxBuffer:64e6});
assert.equal(git('rev-parse',baseline+'^{commit}').toString().trim(),baseline);
const old=path=>git('show',baseline+':'+path);
const hash=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`:JSON.stringify(value);
const digest=value=>hash(canonical(JSON.parse(JSON.stringify(value))));
const plain=value=>JSON.parse(JSON.stringify(value));
const currentBuild=await build({stdin:{contents:"export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-anatomy';export * from './lib/nested-review-material';export * from './lib/nested-review-client';export * from './lib/nested-review-api';export * from './lib/nested-review';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson,bodyContent} from './app/body-content';export {bodyReviewMaterial} from './lib/body-review-material';export {contentTabs} from './lib/content-types';export {regionalTours} from './lib/regional-tours';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await import('data:text/javascript;base64,'+Buffer.from(currentBuild.outputFiles[0].text).toString('base64'));
const before=await exactSourceHistoryApi(baseline,'nested-review-security');
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=JSON.parse(readFileSync(resolve(root,catalogPath),'utf8'));
assert.deepEqual(raw,JSON.parse(old(catalogPath)));
const catalog=now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old(catalogPath))));
assert.equal(catalog.structures.length,1104);
assert.equal(now.contentTabs.length,9);assert.deepEqual(now.contentTabs,before.contentTabs);
assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
assert.deepEqual(now.nestedStudyTargets(catalog),before.nestedStudyTargets(catalog));
assert.deepEqual(now.regionalTours,before.regionalTours);
for(const path of ['content/nested-teaching-bindings.v1.json','content/femoral-component-teaching-bindings.v1.json','content/mca-source-teaching-bindings.v1.json','content/pica-source-teaching-bindings.v1.json','content/nested-review-bindings.json','public/models/bodyparts3d/coronary-venous/catalog.json','lib/nested-review-material.ts','lib/nested-review-api.ts','lib/nested-review-client.ts','lib/nested-review.ts'])
  assert.deepEqual(readFileSync(resolve(root,path)),old(path),path+' unchanged');
const protectedSources=new Set([catalogPath]);
for(const bundle of catalog.bundles)protectedSources.add('public'+bundle.url.split('?')[0]);
for(const path of protectedSources){const bytes=readFileSync(resolve(root,path));assert.equal(hash(bytes),path===catalogPath?hash(old(path)):catalog.bundles.find(b=>'public'+b.url.split('?')[0]===path).sha256,path+' current hash');assert.deepEqual(bytes,old(path),path+' Git baseline');}
const trackedGlbs=git('ls-files','-z').toString('utf8').split('\0').filter(path=>path.endsWith('.glb'));
assert.equal(trackedGlbs.length,146);
for(const path of trackedGlbs){const bytes=readFileSync(resolve(root,path)),prior=old(path);assert.equal(hash(bytes),hash(prior),path+' source GLB SHA');assert.deepEqual(bytes,prior,path+' source GLB bytes');}

const referenceKey='coronarySinusVenography',referenceUrl='https://pubmed.ncbi.nlm.nih.gov/17765613/';
const priorRefs=plain(before.nestedTeachingReferences),currentRefs=plain(now.nestedTeachingReferences);
assert(!Object.hasOwn(priorRefs,referenceKey));
assert.equal(currentRefs[referenceKey]?.url,referenceUrl);
assert.equal(currentRefs[referenceKey]?.scopedToConcept,true);
assert.equal(typeof currentRefs[referenceKey]?.title,'string');assert(currentRefs[referenceKey].title.trim());
delete currentRefs[referenceKey];assert.deepEqual(currentRefs,priorRefs,'Exactly one new scoped reference');
const selectedConcept='coronary-sinus',selectedStudy='coronary-venous',selectedFma='FMA4706';
const priorConcepts=new Map(before.nestedConcepts.map(c=>[c.id,c]));
assert.equal(now.nestedConcepts.length,before.nestedConcepts.length);
for(const concept of now.nestedConcepts){const prior=priorConcepts.get(concept.id);assert(prior,concept.id);const projected=plain(concept);
  if(concept.id===selectedConcept){assert.equal(concept.study,selectedStudy);assert.deepEqual(concept.fmaIds,[selectedFma]);assert.equal(projected.imaging?.xray?.readiness,'draft');assert.deepEqual(projected.imaging.xray.references,[referenceKey]);delete projected.imaging.xray;}
  assert.deepEqual(projected,plain(prior),concept.id+' other authored teaching unchanged');
}
const renderer=JSON.parse(readFileSync(resolve(root,'content/body-renderer-revision.json'),'utf8'));
const oldRenderer=JSON.parse(old('content/body-renderer-revision.json'));
const rendererAdvanced=renderer.sha256!==oldRenderer.sha256;
const compiled=await componentBuild({stdin:{contents:"export {NestedTeaching} from './app/nested-teaching';",resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component={exports:{}};runInNewContext(compiled.outputFiles[0].text,{URLSearchParams,module:component,exports:component.exports,require});
const targets=now.nestedStudyTargets(catalog);assert.equal(targets.length,108);
let nested=0,placements=0,otherTopics=0,otherSelections=0,rootLessons=0,rootPackets=0,identityRejected=0,staleRejected=0,forgedRejected=0;
const storage=new Proxy({},{get(){throw Error('Rejected save reached storage');}});
const badPaths=value=>{const paths=[];const visit=(v,path)=>{if(v&&typeof v==='object'){paths.push([path,Array.isArray(v)?'append':'extra']);for(const [k,x] of Object.entries(v))visit(x,[...path,k]);}else paths.push([path,'leaf']);};visit(value,[]);return paths;};
const at=(value,path)=>path.reduce((v,k)=>v[k],value);
for(const target of targets){
  const parent=catalog.structures.find(s=>s.id===target.parentId),selected=target.study===selectedStudy&&target.structure.fmaId===selectedFma;
  const id=target.study+':'+target.structure.fmaId;
  const concept=now.nestedTeachingFor(parent,target.study,target.structure),prior=before.nestedTeachingFor(parent,target.study,target.structure);
  assert.equal(Boolean(concept),Boolean(prior),id);
  if(concept)for(const topic of now.contentTabs){const actual=now.nestedTopicLesson(concept,topic),oldLesson=before.nestedTopicLesson(prior,topic);
    if(selected&&topic==='xray'){
      assert.equal(concept.id,selectedConcept);assert.equal(oldLesson.readiness,'pending');assert.equal(actual.readiness,'draft');
      assert.equal(actual.body,concept.imaging.xray.body);assert.deepEqual(actual.citations,[referenceUrl]);
      assert.match(actual.note,/specialist review pending/);assert.match(actual.note,/No scan access or synchronization/);
      const html=render(React.createElement(component.exports.NestedTeaching,{parent,study:target.study,selected:target.structure,initialTopic:'xray'}));
      assert(html.includes('X-ray · teaching draft'));assert(html.includes(render(React.createElement('p',null,actual.body))));
      assert(html.includes('Teaching references'));assert(html.includes(referenceUrl));assert(html.includes(now.nestedTeachingReferences[referenceKey].title));
      assert(!html.includes('X-ray · pending'));placements++;
    }else{assert.deepEqual(actual,oldLesson,id+'/'+topic);otherTopics++;}
  }
  else assert(!selected,id+' must have bound teaching');
  const key=now.nestedReviewRows.find(g=>g.parentId===target.parentId&&g.study===target.study).key;
  const packet=await now.nestedReviewMaterial(key,target.structureId),oldPacket=await before.nestedReviewMaterial(key,target.structureId);
  assert(packet&&oldPacket,id);nested++;
  const c=packet.context,p=oldPacket.context;
  assert.deepEqual(packet.source,oldPacket.source);assert.deepEqual(packet.atlasLink,oldPacket.atlasLink);
  assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.sourceFrame,p.sourceFrame);assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);assert.equal(c.revisions.imaging,null);
  assert.equal(c.rendererHash,renderer.sha256);assert.equal(p.rendererHash,oldRenderer.sha256);
  const bound={catalogScope:c.catalogScope,nestedKey:c.nestedKey,sourceFrame:c.sourceFrame,structureId:c.structureId,checklistVersion:c.checklistVersion};
  assert.equal(c.sourceHash,digest(packet.source));assert.equal(c.teachingHash,digest(packet.teaching));
  assert.equal(c.materialHash,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,renderer:c.rendererHash,checklist:c.checklists}));
  assert.equal(c.revisions.geometry,digest({identity:bound,sourceHash:c.sourceHash,renderer:c.rendererHash,checklist:c.checklists.geometry}));
  assert.equal(c.revisions.teaching,digest({identity:bound,sourceHash:c.sourceHash,teachingHash:c.teachingHash,checklist:c.checklists.teaching}));
  if(selected){
    assert.equal(c.sourceHash,'67291c05cafa50c94e6a162c6091c8b01bca0c54e1b399b139a2096d6fda74fb');
    assert.equal(c.sourceFrame,'bodyparts3d:4.0:0a3a8b065445d573419e3948b2d4bbcc28d1c7b506514dc5f99a20a4e7007a56');
    assert.notDeepEqual(packet.teaching,oldPacket.teaching);assert.notEqual(c.teachingHash,p.teachingHash);assert.notEqual(c.revisions.teaching,p.revisions.teaching);
    assert.deepEqual(packet.teaching.topics.filter(t=>t.tab!=='xray'),oldPacket.teaching.topics.filter(t=>t.tab!=='xray'));
    assert.deepEqual(packet.teaching.lesson,oldPacket.teaching.lesson);assert.deepEqual(packet.teaching.concept.modelLimit,oldPacket.teaching.concept.modelLimit);assert.deepEqual(packet.teaching.concept.quiz,oldPacket.teaching.concept.quiz);
    const projected=plain(packet.teaching),oldProjected=plain(oldPacket.teaching);
    Object.assign(projected.topics.find(t=>t.tab==='xray'),plain(oldProjected.topics.find(t=>t.tab==='xray')));
    delete projected.referenceTitles;delete oldProjected.referenceTitles;delete projected.concept.imaging.xray;
    assert.deepEqual(projected,oldProjected,'Only sinus X-ray content and scoped reference titles vary');
    assert.deepEqual(Object.keys(packet.teaching.referenceTitles).filter(url=>!Object.hasOwn(oldPacket.teaching.referenceTitles,url)),[referenceUrl]);
    assert(c.teachingTabs.includes('xray'));assert(!p.teachingTabs.includes('xray'));
    for(const track of ['geometry','teaching'])for(const delta of [{materialHash:p.materialHash},{revisionHash:p.revisions[track]},{materialHash:'f'.repeat(64),revisionHash:'f'.repeat(64)}]){
      const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SINUS_XRAY'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta})}),storage);
      assert.equal(response.status,409);staleRejected++;
    }
    for(const track of ['geometry','teaching']){
      const approval={...now.blankNestedReview(c,track),status:'approved',attested:true};
      const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SINUS_XRAY'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:approval})}),storage);
      assert.equal(response.status,422,'Unsupported synthetic approval rejected before storage');staleRejected++;
    }
    for(const mutate of [v=>{v.context.materialHash='f'.repeat(64);},v=>{v.context.nestedKey+='-foreign';},v=>{v.context.structureId+='-foreign';},v=>{v.context.sourceFrame+='-foreign';}]){
      const forged=plain(packet);mutate(forged);assert.throws(()=>now.parseNestedHistory({scope:'private-to-signed-in-user',track:'teaching',context:forged.context,history:[],nextBefore:null},c,'teaching'),/worksheet or history scope changed/i);forgedRejected++;
    }
    for(const edit of [v=>{v.teaching.topics.find(t=>t.tab==='xray').body+=' forged';},v=>{v.teaching.concept.imaging.xray.references=['foreign'];},v=>{v.teaching.referenceTitles['https://foreign.test']='forged';},v=>{v.context.teachingHash='f'.repeat(64);},v=>{v.context.revisions.teaching='f'.repeat(64);},v=>{v.context.materialHash='f'.repeat(64);}]){
      const forged=plain(packet);edit(forged);assert.notDeepEqual(forged,packet);assert.equal(digest(forged.teaching)===c.teachingHash&&forged.context.teachingHash===c.teachingHash&&forged.context.materialHash===c.materialHash&&forged.context.revisions.teaching===c.revisions.teaching,false);forgedRejected++;
    }
    for(const identity of [parent,target.structure])for(const [path,kind] of badPaths(identity)){
      const changed=plain(identity),node=at(changed,path);
      if(kind==='extra')node.unexpected=true;else if(kind==='append')node.push('unexpected');else{const holder=at(changed,path.slice(0,-1)),key=path.at(-1),value=holder[key];holder[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;}
      const result=identity===parent?now.nestedTeachingFor(changed,target.study,target.structure):now.nestedTeachingFor(parent,target.study,changed);
      assert.equal(result,null,id+' identity '+path.join('.'));identityRejected++;
    }
    for(const identity of [parent,target.structure])for(const [path] of badPaths(identity)){
      if(!path.length)continue;const changed=plain(identity),holder=at(changed,path.slice(0,-1)),key=path.at(-1);
      if(Array.isArray(holder))holder.splice(Number(key),1);else delete holder[key];
      const result=identity===parent?now.nestedTeachingFor(changed,target.study,target.structure):now.nestedTeachingFor(parent,target.study,changed);
      assert.equal(result,null,id+' missing identity '+path.join('.'));identityRejected++;
    }
    const mismatched=plain(target.structure);mismatched.fmaId='FMA4714';assert.equal(now.nestedTeachingFor(parent,target.study,mismatched),null);identityRejected++;
  }else{
    otherSelections++;
    assert.deepEqual(packet.source,oldPacket.source);assert.deepEqual(packet.teaching,oldPacket.teaching);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);
    const projected=plain(c);projected.rendererHash=p.rendererHash;projected.materialHash=p.materialHash;projected.revisions.geometry=p.revisions.geometry;
    assert.deepEqual(projected,plain(p),'Unaffected Review packet after only renderer fields projected');
  }
  assert.equal((await now.nestedReviewSelection(key,target.structureId,c.sourceHash))?.context.sourceHash,c.sourceHash);
  assert.equal(await now.nestedReviewSelection(key,target.structureId,'f'.repeat(64)),null);
}
assert.deepEqual({nested,placements,otherTopics,otherSelections},{nested:108,placements:1,otherTopics:971,otherSelections:107});
for(const structure of catalog.structures){for(const tab of now.contentTabs){assert.deepEqual(now.bodyLesson(structure,tab),before.bodyLesson(structure,tab),structure.id+'/'+tab);rootLessons++;}
  assert.deepEqual(await now.bodyReviewMaterial(structure.id),await before.bodyReviewMaterial(structure.id),structure.id+' root Review');rootPackets++;}
assert.deepEqual({rootLessons,rootPackets},{rootLessons:9936,rootPackets:1104});
const evidence={baseline,nestedSelections:nested,sinusXrayDraftPlacements:placements,otherNestedSelectionsPreserved:otherSelections,otherNestedTopicsPreserved:otherTopics,rootLessonsPreserved:rootLessons,rootReviewPacketsPreserved:rootPackets,sourceFilesCompared:protectedSources.size,trackedSourceGlbsPreserved:trackedGlbs.length,rendererRevisionAdvanced:rendererAdvanced,identityMutationsRejected:identityRejected,staleSavesRejectedBeforeStorage:staleRejected,forgedPacketMutationsDetected:forgedRejected,clinicalAcceptance:false,scanRegistration:false,browserAcceptance:false};
mkdirSync(evidenceDir,{recursive:true});writeFileSync(resolve(evidenceDir,'test-nested-coronary-sinus-xray.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
