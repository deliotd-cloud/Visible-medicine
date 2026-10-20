import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCorpusSpongiosumXrayV2} from './corpus-spongiosum-xray-v2-history.mjs';
import pins from '../content/corpus-spongiosum-xray-v2.pins.json' with {type:'json'};
import transition from '../content/corpus-spongiosum-xray-v2.transition.json' with {type:'json'};
const sha=b=>createHash('sha256').update(b).digest('hex'),hash=v=>sha(JSON.stringify(v));
// Completed X-ray assertions replay their exact parent; the CT suite checks current source independently.
const ctx=await contentContext(),api=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','corpus-xray-v2-legacy'),catalog=api.bodyDisplayCatalog(ctx.catalog);
const old=await exactSourceHistoryApi(pins.parentCommit,'display-review');
const identity=pins.entries[0].identity,id=identity.id;
const snapshot=a=>catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,a.bodyLesson(s,tab)]))}));
const shown=lesson=>{const{readiness:_,...content}=lesson;return content;};
test('exact f509 source, geometry, full9,936placements and all1,104content contracts',async()=>{
  assert.equal(pins.parentCommit,'f5097af8493701d64a8e2a2b5797df380f3b348a');
  assert.equal(execFileSync('git',['rev-parse',pins.parentCommit+'^{tree}'],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),pins.parentTree);
  assert.equal(sha(readFileSync(pins.sourcePath)),pins.sourceCatalogSha256);
  assert.equal(sha(readFileSync('public/models/bodyparts3d/full-body/catalog.json')),pins.rawCatalogSha256);
  const bytes=readFileSync('public'+new URL(pins.bundle.url,'https://local.invalid').pathname);
  assert.equal(bytes.length,pins.bundle.bytes);assert.equal(sha(bytes),pins.bundle.sha256);
  assert.equal(identity.fmaId,'FMA19617');assert.equal(identity.sources[0].file,'FJ3133');
  assert.equal(catalog.structures.length,1104);assert.equal(ctx.catalog.structures.length,1022);
  assert.equal(hash(catalog),pins.displayCatalogHash);assert.deepEqual(catalog,old.bodyDisplayCatalog(ctx.catalog));
  assert.equal(hash(api.structures),pins.shoulderStructuresHash);assert.equal(hash(api.dissectionProfiles),pins.recipesHash);
  assert.deepEqual(api.structures,old.structures);assert.deepEqual(api.dissectionProfiles,old.dissectionProfiles);
  const before=snapshot(old),after=snapshot(api);assert.equal(hash(before),pins.allLessonsBeforeHash);assert.equal(hash(after),transition.allLessonsAfterHash);
  const changes=[];for(let i=0;i<after.length;i++)for(const tab of api.contentTabs){const a=after[i].sections[tab],b=before[i].sections[tab];if(hash(a)!==hash(b))changes.push({id:after[i].id,tab});}
  assert.deepEqual(changes,[{id,tab:'xray'}]);assert.equal(after.length*api.contentTabs.length-changes.length,9935);
  assert.deepEqual(old.bodyLesson(identity,'xray'),pins.entries[0].previous.xray);
  assert.deepEqual(api.bodyLesson(identity,'xray'),transition.entries[0].current);
  const records=api.bodyContentRecords(catalog),oldRecords=old.bodyContentRecords(catalog),registry=new Map([...ctx.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
  const validate=await contentValidator(registry);let changedRecords=0;
  for(let i=0;i<records.length;i++){assert(validate(records[i]));if(records[i].id!==id)assert.deepEqual(records[i],oldRecords[i]);else{changedRecords++;const a=structuredClone(records[i]),b=structuredClone(oldRecords[i]);assert.deepEqual(a.content.xray,transition.entries[0].current);a.content.xray=b.content.xray;assert.deepEqual(a,b);assert.equal(a.validation.clinicalApproval,'not-included');for(const value of Object.values(a.validation.materialRevisions))assert.equal(value,null);}}
  assert.equal(changedRecords,1);
  const target=records.find(r=>r.id===id);
  for(const change of [r=>r.meshBindings[0].assetSha256='0'.repeat(64),r=>r.validation.clinicalApproval='approved',r=>r.validation.materialRevisions.imaging='0'.repeat(64)]){const bad=structuredClone(target);change(bad);assert.throws(()=>validate(bad));}
});
test('draft helper rejects every changed identity leaf/key and returns detached content',()=>{
  function leaves(value,path=[]){return value&&typeof value==='object'?Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k])):[path];}
  let refused=0;for(const path of leaves(identity)){const bad=structuredClone(identity);let at=bad;for(const k of path.slice(0,-1))at=at[k];const key=path.at(-1),value=at[key];at[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+1:typeof value==='boolean'?!value:'foreign';assert.equal(api.corpusSpongiosumXrayLesson(bad,'xray'),undefined);refused++;}
  for(const key of Object.keys(identity)){const bad=structuredClone(identity);delete bad[key];assert.equal(api.corpusSpongiosumXrayLesson(bad,'xray'),undefined);refused++;}
  for(const change of [s=>s.foreign=true,s=>s.sources=[],s=>s.sources.push({...s.sources[0]}),s=>s.anchor.reverse()]){const bad=structuredClone(identity);change(bad);assert.equal(api.corpusSpongiosumXrayLesson(bad,'xray'),undefined);refused++;}
  assert.equal(refused,56,'All33pinned identity leaves,19top-level key removals and4structural mutations refused');
  for(const s of catalog.structures)for(const tab of api.contentTabs)if(s.id!==id||tab!=='xray')assert.equal(api.corpusSpongiosumXrayLesson(s,tab),undefined);
  const lesson=api.corpusSpongiosumXrayLesson(identity,'xray'),clean=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations[0]='https://foreign.invalid';assert.deepEqual(api.corpusSpongiosumXrayLesson(identity,'xray'),clean);
  assert.deepEqual(api.bodyContent(identity,'xray'),shown(clean));assert.equal(clean.readiness,'draft');assert(clean.note.includes('no glans'));assert(clean.note.includes('paid-lecture access remain independent'));assert(clean.note.includes('No acquired scan, patient image'));
  assert.deepEqual(clean.citations,['https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html','https://link.springer.com/article/10.1186/s13017-019-0274-x','https://creativecommons.org/licenses/by/4.0/']);
  assert(clean.bullets.some(b=>b.includes('Coccolini')&&b.includes('CC BY 4.0')&&b.includes('No endorsement')));
});
test('all1,104review packets keep source/checklist scope; only exact teaching fingerprint changes',async()=>{
  let changed=0;for(const s of catalog.structures){const now=await api.bodyReviewMaterial(s.id),previous=await old.bodyReviewMaterial(s.id);assert.equal(now.approval,false);assert.equal(now.status,'worksheet-not-submitted');if(s.id!==id){assert.deepEqual(now,previous);continue;}changed++;
    assert.deepEqual(now.fingerprints,transition.reviewAfter);assert.deepEqual(previous.fingerprints,transition.reviewBefore);assert.equal(now.materialHash,transition.reviewAfterMaterialHash);assert.equal(previous.materialHash,transition.reviewBeforeMaterialHash);assert.notEqual(now.fingerprints.teaching,previous.fingerprints.teaching);assert.equal(now.fingerprints.source,previous.fingerprints.source);assert.equal(now.fingerprints.checklist,previous.fingerprints.checklist);
    const copy=structuredClone(now);copy.topics=previous.topics;copy.fingerprints=previous.fingerprints;copy.materialHash=previous.materialHash;assert.deepEqual(copy,previous);
  }assert.equal(changed,1);
});
test('source-bound reversal restores exact parent and refuses missing helpers/source/teaching substitutions',()=>{
  const before=beforeCorpusSpongiosumXrayV2(api,ctx.catalog);assert.equal(beforeCorpusSpongiosumXrayV2(before,ctx.catalog),before);assert.deepEqual(snapshot(before),snapshot(old));assert.deepEqual(snapshot(api).find(s=>s.id===id).sections.xray,transition.entries[0].current);
  const lesson=before.bodyLesson(identity,'xray');lesson.bullets.push('foreign');assert.deepEqual(before.bodyLesson(identity,'xray'),pins.entries[0].previous.xray);
  for(const value of [undefined,null,()=>({...transition.entries[0].current,body:'foreign'})])assert.throws(()=>beforeCorpusSpongiosumXrayV2({...api,corpusSpongiosumXrayLesson:value},ctx.catalog));
  const omitted={...api};delete omitted.corpusSpongiosumXrayLesson;assert.throws(()=>beforeCorpusSpongiosumXrayV2(omitted,ctx.catalog));assert.throws(()=>beforeCorpusSpongiosumXrayV2(Object.create(api),ctx.catalog));
  for(const field of ['sourceVersion','license','credit','coordinateSystem']){const bad=structuredClone(catalog);bad[field]='foreign';assert.throws(()=>beforeCorpusSpongiosumXrayV2({...api,bodyDisplayCatalog:()=>bad},ctx.catalog));}
  for(const change of [c=>c.structures=c.structures.filter(s=>s.id!==id),c=>c.structures.push({...identity}),c=>c.structures.find(s=>s.id===id).anchor[0]++,c=>c.bundles=c.bundles.filter(b=>b.id!==pins.bundle.id),c=>c.bundles.push({...pins.bundle}),c=>c.bundles.find(b=>b.id===pins.bundle.id).sha256='foreign']){const bad=structuredClone(catalog);change(bad);assert.throws(()=>beforeCorpusSpongiosumXrayV2({...api,bodyDisplayCatalog:()=>bad},ctx.catalog));}
  assert.throws(()=>beforeCorpusSpongiosumXrayV2({...api,bodyLesson:(s,t)=>s.id===id&&t==='xray'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)},ctx.catalog));
  assert.throws(()=>beforeCorpusSpongiosumXrayV2({...api,bodyContent:()=>({body:'foreign'})},ctx.catalog));
  const bad=structuredClone(identity);bad.anchor[0]++;assert.throws(()=>before.bodyLesson(bad,'xray'));
  const kept=pins.entries[0].identity.name;try{pins.entries[0].identity.name+='foreign';assert.throws(()=>beforeCorpusSpongiosumXrayV2(api,ctx.catalog));}finally{pins.entries[0].identity.name=kept;}
});
