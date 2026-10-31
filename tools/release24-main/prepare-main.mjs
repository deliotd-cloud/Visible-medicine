import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const site='G:/VisibleMedicine-temp/staging/20261031-head-clear-final/website',out='G:/VisibleMedicine-temp/proposals/20261031-release24-main/files',rows=[];
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(site+'/'+p),write=(p,b)=>{const dest=out+'/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});rows.push({path:p,beforeSha256:fs.existsSync(site+'/'+p)?sha(read(p)):null,afterSha256:sha(fs.readFileSync(dest))});};
const once=(s,b,a)=>{assert.equal(s.split(b).length,2,b);return s.replace(b,a);};
// These roots already compare every current lesson/packet to independently
// loaded current Git. Only historical preservation belongs to the feature epoch.
for(const name of ['clinical-review-arm-arterial-xray.test.ts','clinical-review-forearm-branch-xray.test.ts']){
 let s=read('tests/'+name).toString();
 s=once(s,'assert.deepEqual(live.structures,old.structures);',"assert.deepEqual(feature.structures,old.structures,'historical structure catalogue retained');");
 s=once(s,'assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);',"assert.deepEqual(feature.dissectionProfiles,old.dissectionProfiles,'historical dissection catalogue retained');");
 write('tests/'+name,s);
}
let corpus=read('tests/corpus-xray-v2-current-delivery.test.mjs').toString();
corpus=once(corpus,"assert.equal(delivery.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');","assert.equal(delivery.source,execFileSync('git',['--no-replace-objects','-C',atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),'Current source is the authenticated native Atlas HEAD');");
write('tests/corpus-xray-v2-current-delivery.test.mjs',corpus);
let ui=read('tests/ui-teaching-current-delivery.test.mjs').toString();
ui=once(ui,"  assert.equal(delivery.reviewSourceFiles, 1605);\n  assert.equal(delivery.viewerFiles, 54);\n  assert.equal(delivery.viewerPackages, 24);",`  const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT,receiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
  assert(receiptPath&&/^[a-f0-9]{64}$/.test(receiptSha??''),'Sealed current source receipt required');
  const receiptBytes=read(receiptPath);assert.equal(sha(receiptBytes),receiptSha);
  const receipt=JSON.parse(receiptBytes);
  assert.equal(receipt.website.replaceAll('\\\\','/'),process.cwd().replaceAll('\\\\','/'));
  for(const name of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json']){
    const rows=receipt.sourceRows.filter(row=>row.path===name);assert.equal(rows.length,1);
    assert.equal(rows[0].sha256,sha(read(name)),name+': sealed source');
  }
  const viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(delivery.reviewSourceFiles,json('atlas-review/manifest.json').files.length);
  assert.equal(delivery.viewerFiles,viewer.files.length);
  assert.equal(delivery.viewerPackages,viewer.packages.length);`);
ui=once(ui,'assert.equal(inputs.inputs.length, 1808);','assert.equal(inputs.inputs.length, receipt.inputs);');
write('tests/ui-teaching-current-delivery.test.mjs',ui);
// Extend the existing exact inverse proof through the independently reviewed
// newer source-bound tests. Older sources and every previous assertion survive.
function hunks(before,after){const a=before.split('\n'),b=after.split('\n'),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);const edits=[];let i=0,j=0,o;const flush=()=>{if(o){edits.push(o);o=undefined;}};while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}o??={removed:[],added:[]};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))o.removed.push(a[i++]);else o.added.push(b[j++]);}flush();return edits;}
const roots=[
 ['corpus-xray-v2-current-delivery.test.mjs','corpus-cranio-before/corpus-xray-v2-current-delivery.test.mjs.raw','28be69bc03dd3b78665ccf5947fb2fd33077654ed6a26bf03bad6bf9c3e6207e'],
 ['tour-discovery-current-delivery.test.mjs','current-source-closure-before/tour-discovery-current-delivery.test.mjs.raw','6f48857ab2f7e4167348091bdd60fb60d9d3106f399548650aad593660c61956'],
 ['ui-teaching-current-delivery.test.mjs','current-source-closure-before/ui-teaching-current-delivery.test.mjs.raw',null],
];
const proof={schema:'vm-corpus-ui-source-role-successors/1',records:{}};
for(const [name,fixture,expected]of roots){const before=read('tests/fixtures/'+fixture),after=fs.existsSync(out+'/tests/'+name)?fs.readFileSync(out+'/tests/'+name):read('tests/'+name);if(expected)assert.equal(sha(before),expected);proof.records[name]={fixture,priorSha256:sha(before),currentSha256:sha(after),hunkHashes:hunks(before.toString(),after.toString()).map(h=>sha(JSON.stringify([h.removed,h.added])))};}
const proofBytes=Buffer.from(JSON.stringify(proof,null,2)+'\n');write('tests/fixtures/release24-role-successors.json',proofBytes);
let preserve=read('tests/corpus-ui-role-preservation.test.mjs').toString();
const addition=`
// Authenticate every later source-role change before reconstructing the complete
// predecessor. Current behavior executes in its own stock-discovered root.
function currentRolePredecessor(name){
 const manifest=read('./fixtures/release24-role-successors.json');
 assert.equal(sha(manifest),'${sha(proofBytes)}','Exact reviewed successor-role manifest');
 const record=JSON.parse(manifest).records[name];assert(record,'Declared source-role successor only');
 const prior=read('./fixtures/'+record.fixture);assert.equal(sha(prior),record.priorSha256);
 const current=read('./'+name);
 return Buffer.from(restoreLater(name,current,prior.toString(),record.currentSha256,record.hunkHashes));
}
`;
preserve=once(preserve,'const preserve=(name,rawName,rawHash,edits,appendix=',addition+'\nconst preserve=(name,rawName,rawHash,edits,appendix=');
for(const [name]of roots)preserve=preserve.replaceAll("read('./"+name+"')","currentRolePredecessor('"+name+"')");
write('tests/corpus-ui-role-preservation.test.mjs',preserve);
fs.writeFileSync('G:/VisibleMedicine-temp/proposals/20261031-release24-main/MAIN_MANIFEST.json',JSON.stringify({schema:'vm-release24-main-proposal/1',source:'76bc03dce3e3cd5ac0420f67a6bc1aed48dff24edd4efc9a815195addd139bff',files:rows,clinicalOrProductChanges:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:rows.length,proof:proof.records}));
