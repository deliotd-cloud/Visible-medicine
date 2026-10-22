import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(s,before,after)=>{
 assert.equal(s.split(before).length,2,'One exact source seam: '+before);
 return s.replace(before,after);
};
const preserve=(name,rawName,rawHash,edits,appendix='',candidatePath='./'+name+'.test.mjs')=>{
 const raw=read('./fixtures/'+rawName);assert.equal(sha(raw),rawHash,'Byte-authentic full predecessor '+name);
 const candidate=read(candidatePath).toString();
 let expected=raw.toString();
 for(const [before,after]of edits)expected=once(expected,before,after);
 assert.equal(candidate,expected+appendix,'Complete predecessor and only declared current-role seams '+name);
 let inverse=candidate;
 if(appendix){assert(inverse.endsWith(appendix));inverse=inverse.slice(0,-appendix.length);}
 for(const [before,after]of edits.toReversed())inverse=once(inverse,after,before);
 assert.equal(sha(Buffer.from(inverse)),rawHash,'Byte-exact whole-file inverse '+name);
 assert.throws(()=>assert.equal(candidate+'\nconst unknown=true;\n',expected+appendix),'Unknown appended behavior refused '+name);
};

const corpusAppendix=`
test('whole bd corpus contract remains an exact archived source and refuses current admission',()=>{
 const bytes=readFileSync(new URL('./fixtures/tour-discovery-corpus-bd5465ee.mjs.raw',import.meta.url));assert.equal(sha(bytes),'90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef');
 const old=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json',import.meta.url)));
 assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const current=readFileSync(new URL('./corpus-xray-v2-current-delivery.test.mjs',import.meta.url),'utf8');
 const appendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const cut=current.indexOf(appendix);assert(cut>0&&current.lastIndexOf(appendix)===cut);
 const body=current.slice(0,cut).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");
 assert.equal(body,bytes.toString(),'Every original learner, Review, refusal and source assertion survives the one current-source seam');
});
`;

test('whole corpus source retains every bd assertion and refuses unknown mutations',()=>{
 preserve('corpus-xray-v2-current-delivery','corpus-xray-v2-current-delivery.test.mjs.raw',
  '90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef',[
   ["assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');","assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
  ],corpusAppendix,'./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw');
 const current=read('./corpus-xray-v2-current-delivery.test.mjs').toString();
 assert(current.includes("const forged=wire(decision);forged.draft.checks.foreign=true;"));
 assert.notEqual(current.replace("const forged=wire(decision);forged.draft.checks.foreign=true;",''),current);
});

test('whole current corpus source changes only its authored-bd versus bound-190 packet role',()=>{
 const raw=read('./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw');
 assert.equal(sha(raw),'a31204d0bd516fdfc47b3f03ffd97a5996345f0bce5272da8c175e34c3cf3905');
 let expected=raw.toString();
 const seams=[
  [" const packet=wire(await api.bodyReviewMaterial(id));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.deepEqual(packet.fingerprints,transition.reviewAfter);assert.deepEqual(packet.topics.find(t=>t.tab==='xray'),{tab:'xray',...lesson});assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);\n const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href),old=await exactSourceHistoryApi(pins.parentCommit,'review-security');",
` const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const {boundLiveAtlasHistory}=await import('./atlas-bound-live-history.mjs');
 const authoredRevision='bd5465ee3b94c66c3d5701e7749099d07e8f40d3';
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(delivery.source);
 const gitAuthored=path=>execFileSync('git',['show',authoredRevision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const earlierPelvis=JSON.parse(gitAuthored('content/regional-teaching/pelvis.json'));
 const currentPelvis=JSON.parse(git('content/regional-teaching/pelvis.json'));
 const rowIn=table=>{const matches=table.entries.filter(row=>JSON.parse(row.identity).id===id);assert.equal(matches.length,1);return matches[0];};
 const authoredRow=rowIn(earlierPelvis),boundRow=rowIn(currentPelvis);assert.equal(authoredRow.identity,boundRow.identity);
 for(const tab of Object.keys(boundRow.lessons).filter(tab=>tab!=='ct'))assert.deepEqual(boundRow.lessons[tab],authoredRow.lessons[tab],tab+': unchanged corpus lesson across bd and 190');
 assert.equal(authoredRow.lessons.ct.readiness,'pending');assert.equal(boundRow.lessons.ct.readiness,'draft');
 assert.deepEqual(authored.bodyLesson(identity,'ct'),authoredRow.lessons.ct);assert.deepEqual(bound.bodyLesson(identity,'ct'),boundRow.lessons.ct);assert.deepEqual(api.bodyLesson(identity,'ct'),boundRow.lessons.ct);
 const authoredPacket=wire(await authored.bodyReviewMaterial(id)),boundPacket=wire(await bound.bodyReviewMaterial(id));
 assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');assert.deepEqual(authoredPacket.fingerprints,transition.reviewAfter,'Complete authored bd packet retains its exact historical transition fingerprint');
 assert.deepEqual(authoredPacket.topics.find(t=>t.tab==='xray'),{tab:'xray',...lesson});
 const packet=wire(await api.bodyReviewMaterial(id));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.deepEqual(packet,boundPacket,'Whole current Review packet equals independent Git-backed current190 replay');
 assert.equal(packet.fingerprints.source,authoredPacket.fingerprints.source);assert.equal(packet.fingerprints.checklist,authoredPacket.fingerprints.checklist);assert.notEqual(packet.fingerprints.teaching,authoredPacket.fingerprints.teaching);
 assert.deepEqual(packet.topics.find(t=>t.tab==='xray'),{tab:'xray',...lesson});assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);assert.equal(await api.parseBodyReviewResponse(authoredPacket,id),null,'Prior authored packet cannot be accepted as current');
 const old=await exactSourceHistoryApi(pins.parentCommit,'review-security');`],
  [" const context=await api.bodyReviewContext(id),oldContext=await old.bodyReviewContext(id);assert.equal(context.sourceHash,oldContext.sourceHash);assert.notEqual(context.teachingHash,oldContext.teachingHash);assert.equal(context.revisions.imaging,null);",
   " const context=await api.bodyReviewContext(id),oldContext=await old.bodyReviewContext(id),authoredContext=await authored.bodyReviewContext(id);assert.equal(context.sourceHash,oldContext.sourceHash);assert.equal(context.sourceHash,authoredContext.sourceHash);assert.notEqual(context.teachingHash,oldContext.teachingHash);assert.notEqual(context.teachingHash,authoredContext.teachingHash);assert.equal(context.revisions.imaging,null);"],
  [" for(const fields of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}])assert.equal((await save({...decision,...fields})).status,409);",
   " for(const fields of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching},{materialHash:authoredContext.materialHash},{revisionHash:authoredContext.revisions.teaching},{materialHash:authoredContext.materialHash,revisionHash:authoredContext.revisions.teaching}])assert.equal((await save({...decision,...fields})).status,409);"],
  [" const current=readFileSync(new URL('./corpus-xray-v2-current-delivery.test.mjs',import.meta.url),'utf8');",
` const previous=readFileSync(new URL('./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw',import.meta.url));assert.equal(sha(previous),'a31204d0bd516fdfc47b3f03ffd97a5996345f0bce5272da8c175e34c3cf3905');
 const current=previous.toString();`],
 ];
 for(const [before,after]of seams)expected=once(expected,before,after);
 const actual=read('./corpus-xray-v2-current-delivery.test.mjs').toString();
 assert.equal(actual,expected,'Full original test survives only the four declared historical/current seams');
 let inverse=actual;for(const [before,after]of seams.toReversed())inverse=once(inverse,after,before);
 assert.equal(sha(Buffer.from(inverse)),sha(raw),'Whole byte-exact predecessor inverse');
 for(const refusal of ["forged.draft.checks.foreign=true","citations[0]='https://forged.invalid/'","assert.equal(storage.calls,0)"]){
  assert(actual.includes(refusal),'Original refusal retained: '+refusal);
  assert.throws(()=>assert.equal(actual.replace(refusal,''),expected),'Removed refusal rejected: '+refusal);
 }
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected),'Unknown append rejected');
});

test('whole tour historical proof moves only its corpus witness to the immutable pre-epoch source',()=>{
 const raw=read('./fixtures/tour-discovery-current-delivery-before-epoch-20261021.mjs.raw');
 assert.equal(sha(raw),'689b4dafa4b18465aa59379dcf61a88371af2f4f2fc194ccc6d3595887da0b3b');
 const before=` const currentCorpus=read('./corpus-xray-v2-current-delivery.test.mjs').toString(),corpusAppendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const appendixAt=currentCorpus.indexOf(corpusAppendix);assert(appendixAt>0&&currentCorpus.lastIndexOf(corpusAppendix)===appendixAt);
 const corpusBefore=currentCorpus.slice(0,appendixAt).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");`;
 const after=` const previousCorpus=read('./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw');assert.equal(sha(previousCorpus),'a31204d0bd516fdfc47b3f03ffd97a5996345f0bce5272da8c175e34c3cf3905');
 const previousText=previousCorpus.toString(),corpusAppendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const appendixAt=previousText.indexOf(corpusAppendix);assert(appendixAt>0&&previousText.lastIndexOf(corpusAppendix)===appendixAt);
 const corpusBefore=previousText.slice(0,appendixAt).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");`;
 const expected=once(raw.toString(),before,after),actual=read('./tour-discovery-current-delivery.test.mjs').toString();
 assert.equal(actual,expected,'Complete tour historical/current body survives one witness role seam');
 assert.equal(sha(Buffer.from(once(actual,after,before))),sha(raw),'Byte-exact complete tour inverse');
 const refusal="assert.throws(()=>validateCurrentAtlasDelivery({pin:old}))";
 assert(actual.includes(refusal));assert.throws(()=>assert.equal(actual.replace(refusal,''),expected));
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected));
});

test('whole UI source advances exactly two observed Review count seams',()=>{
 preserve('ui-teaching-current-delivery','ui-teaching-current-delivery.test.mjs.raw',
  'afcfd94cb82c7289f525521f533839526cfdbad94d9686bf91251108c5cf5285',[
   ['assert.equal(delivery.reviewSourceFiles, 1550);','assert.equal(delivery.reviewSourceFiles, 1553);'],
   ['assert.equal(inputs.inputs.length, 1707);','assert.equal(inputs.inputs.length, 1710);'],
  ]);
 const current=read('./ui-teaching-current-delivery.test.mjs').toString();
 assert(current.includes('const forgedIdentity'));
 assert.throws(()=>assert.equal(current.replace('const forgedIdentity','const acceptedIdentity'),current));
});
