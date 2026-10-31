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
function lineHunks(before,after){
 const a=before.split('\n'),b=after.split('\n');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){edits.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();return edits;
}
function restoreLater(name,currentBytes,prior,latestHash,hunkHashes){
 assert.equal(sha(currentBytes),latestHash,name+': exact entire proposed current source');
 const latest=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(latest),currentBytes,name+': lossless source bytes');
 assert.equal((latest.match(/\r/g)||[]).length,0,name+': LF source');
 const edits=lineHunks(prior,latest);
 const digests=edits.map(edit=>sha(JSON.stringify([edit.removed,edit.added])));
 assert.deepEqual(digests,hunkHashes,name+': only reviewed later-source hunks');
 const lines=latest.split('\n');
 for(const edit of edits.toReversed()){
  assert(edit.added.length>0,name+': no deletion-only layer');
  assert.deepEqual(lines.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added,name+': exact current hunk');
  lines.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.equal(lines.join('\n'),prior,name+': complete current-to-historical inverse');
 return prior;
}

// Authenticate every later source-role change before reconstructing the complete
// predecessor. Current behavior executes in its own stock-discovered root.
function currentRolePredecessor(name){
 const manifest=read('./fixtures/release24-role-successors.json');
 assert.equal(sha(manifest),'d27e530e6485c06e5c0aa5d493157dc9797052f3830c083a1bc94d907677aee8','Exact reviewed successor-role manifest');
 const record=JSON.parse(manifest).records[name];assert(record,'Declared source-role successor only');
 const prior=read('./fixtures/'+record.fixture);assert.equal(sha(prior),record.priorSha256);
 const current=read('./'+name);
 return Buffer.from(restoreLater(name,current,prior.toString(),record.currentSha256,record.hunkHashes));
}

const preserve=(name,rawName,rawHash,edits,appendix='',candidatePath='./'+name+'.test.mjs',candidateSource)=>{
 const raw=read('./fixtures/'+rawName);assert.equal(sha(raw),rawHash,'Byte-authentic full predecessor '+name);
 const candidate=candidateSource??read(candidatePath).toString();
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
 const current=currentRolePredecessor('corpus-xray-v2-current-delivery.test.mjs').toString();
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
 const actual=restoreLater('corpus',currentRolePredecessor('corpus-xray-v2-current-delivery.test.mjs'),expected,
  '28be69bc03dd3b78665ccf5947fb2fd33077654ed6a26bf03bad6bf9c3e6207e',[
   '4f1047e97337ffd6b12147a72ed45dae1d2e463453d0b9ef130d4cfb41eb705b',
   '97c66cd521629fd9f2b54567b8d9b5ecafb4b88ef6f99d448112d6b2d6b2a173',
   '519b44990130ff008973c878a099cecb01a29f58000068c4edbae76b2fb30d13',
   'e5025aacbc52bf4b1914222419ac5b2cae6d9502680f41f742935fe20bcf1e48']);
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
 const before=` const currentCorpus=currentRolePredecessor('corpus-xray-v2-current-delivery.test.mjs').toString(),corpusAppendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const appendixAt=currentCorpus.indexOf(corpusAppendix);assert(appendixAt>0&&currentCorpus.lastIndexOf(corpusAppendix)===appendixAt);
 const corpusBefore=currentCorpus.slice(0,appendixAt).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");`;
 const after=` const previousCorpus=read('./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw');assert.equal(sha(previousCorpus),'a31204d0bd516fdfc47b3f03ffd97a5996345f0bce5272da8c175e34c3cf3905');
 const previousText=previousCorpus.toString(),corpusAppendix="\\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const appendixAt=previousText.indexOf(corpusAppendix);assert(appendixAt>0&&previousText.lastIndexOf(corpusAppendix)===appendixAt);
 const corpusBefore=previousText.slice(0,appendixAt).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");`;
 const currentRoleEdits=[
  [" const current=validateCurrentAtlasDelivery();assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(current.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');assert.equal(current.reviewSourceFiles,1553);",
   " const current=validateCurrentAtlasDelivery();assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(current.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');assert.equal(current.reviewSourceFiles,1558);"],
  [' assert.equal(inputs.inputs.length,1710);',' assert.equal(inputs.inputs.length,1724);'],
 ];
 let expected=once(raw.toString(),before,after);
 for(const [oldRole,newRole]of currentRoleEdits)expected=once(expected,oldRole,newRole);
 const actual=restoreLater('tour refusal-source extension',currentRolePredecessor('tour-discovery-current-delivery.test.mjs'),expected,
  '6f48857ab2f7e4167348091bdd60fb60d9d3106f399548650aad593660c61956',[
   'd3755ffc6700bd7151f32943cd5e0018c029094686e51f6a3bfaa60b02143c6a']);
 assert.equal(actual,expected,'Complete tour historical/current body survives one witness role seam');
 let prior=actual;
 for(const [oldRole,newRole]of currentRoleEdits.toReversed())prior=once(prior,newRole,oldRole);
 assert.equal(sha(Buffer.from(once(prior,after,before))),sha(raw),'Byte-exact complete tour inverse');
 const refusal="assert.throws(()=>validateCurrentAtlasDelivery({pin:old}))";
 assert(actual.includes(refusal));assert.throws(()=>assert.equal(actual.replace(refusal,''),expected));
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected));
});

test('whole UI source advances exactly two observed Review count seams',()=>{
 const raw=read('./fixtures/ui-teaching-current-delivery.test.mjs.raw');
 assert.equal(sha(raw),'afcfd94cb82c7289f525521f533839526cfdbad94d9686bf91251108c5cf5285');
 const historical=once(once(raw.toString(),
  'assert.equal(delivery.reviewSourceFiles, 1550);','assert.equal(delivery.reviewSourceFiles, 1553);'),
  'assert.equal(inputs.inputs.length, 1707);','assert.equal(inputs.inputs.length, 1710);');
 const beforeLoading=once(currentRolePredecessor('ui-teaching-current-delivery.test.mjs').toString(),
  'assert.equal(inputs.inputs.length, 1724);','assert.equal(inputs.inputs.length, 1723);');
 const previous=restoreLater('ui',Buffer.from(beforeLoading),historical,
  '89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913',[
   '078d52ccea1eb5e93e9f171417c782fa0e4a16c6eb73ec83f113d33d67db5885',
   '71b2015a00d78421b3cb03aabfedfdd1cb56cf7b1ca9bfffd858b51612fd4e23',
   '219b5676063ef7b77a1854701c5b459cd7a1760eaaf4fbfd1f28169e52dc4f64']);
 preserve('ui-teaching-current-delivery','ui-teaching-current-delivery.test.mjs.raw',
  'afcfd94cb82c7289f525521f533839526cfdbad94d9686bf91251108c5cf5285',[
   ['assert.equal(delivery.reviewSourceFiles, 1550);','assert.equal(delivery.reviewSourceFiles, 1553);'],
   ['assert.equal(inputs.inputs.length, 1707);','assert.equal(inputs.inputs.length, 1710);'],
  ],'',undefined,previous);
 const current=currentRolePredecessor('ui-teaching-current-delivery.test.mjs').toString();
 assert(current.includes('const forgedIdentity'));
 assert.throws(()=>assert.equal(current.replace('const forgedIdentity','const acceptedIdentity'),current));
});
