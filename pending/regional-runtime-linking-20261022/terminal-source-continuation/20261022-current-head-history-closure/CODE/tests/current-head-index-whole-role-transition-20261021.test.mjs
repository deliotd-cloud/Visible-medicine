import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {restoreSalivaryGuardPrior} from './salivary-current-family-inverse.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seam=(before,after)=>({before,after});
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
function restoreLaterRole(name,currentBytes,prior,latestHash,hunkHashes){
 assert.equal(sha(currentBytes),latestHash,name+': exact selected V5 current source');
 const latest=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(latest),currentBytes,name+': lossless UTF-8');
 assert.equal((latest.match(/\r/g)||[]).length,0,name+': current LF source');
 const edits=lineHunks(prior,latest);
 const digests=edits.map(e=>sha(JSON.stringify([e.removed,e.added])));
 assert.deepEqual(digests,hunkHashes,name+': only reviewed later source hunks');
 const lines=latest.split('\n');
 for(const edit of edits.toReversed()){
  assert(edit.added.length>0,name+': later layer cannot silently delete original lines');
  assert.deepEqual(lines.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added,name+': full current hunk');
  lines.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const restored=lines.join('\n');
 assert.equal(restored,prior,name+': complete current-to-prior inverse');
 return Buffer.from(restored);
}
function prove(name,originalName,digest,edits,negative){
 const raw=read('fixtures/'+originalName);
 assert.equal(sha(raw),digest,name+': exact complete original');
 const eol=raw.includes(Buffer.from('\r\n'))?'\r\n':'\n';
 const original=raw.toString().replaceAll('\r\n','\n');
 let expected=original;
 for(const [i,{before,after}] of edits.entries()){
  assert.equal(expected.split(before).length,2,name+': unique declared seam '+i);
  expected=expected.replace(before,after);
 }
 const candidate=name==='current-delivery-admission-485.test.mjs'
  ?read('fixtures/current-delivery-admission-485.test.mjs.raw')
  :name==='salivary-cache-guard-adaptation.test.mjs'
   ?restoreSalivaryGuardPrior(read(name))
   :name==='current-atlas-delivery.test.mjs'
    ?restoreLaterRole(name,read(name),expected,
     'b0f078527cdb040ce7afa105bc0db9ebb979be590757ce7e749583eaed0f0045',[
      'eb2b9aa973a5ff2ed860693d896b75318f04f33f8333af23613f1692d19d9583',
      'b78c6d26c8c5cc084e7ef7070f3f25905dba4a0dc90123a0d1847b5e116a6987',
      'f08ccb05c2d70395485dfb017bd515e4c1a533f9b3ddbf9183d9f198057b4434',
      'd0580077f2c27d545646487fb5e7d288c9a24c680e74efc45f76552cab651e8b'])
    :name==='atlas190-current-delivery.test.mjs'
     ?restoreLaterRole(name,read(name),expected,
      'b198b7505c9ac9bc826d2a952ac4fcad8760dbdc250d0a488a8c09a0526b9ad3',[
       '1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd',
       'a6e42f7fe4cbb0046b045dfb8aea4f1a6e220121b82f87b754db60ba854deb02',
       '30d3d2af00012c92184e4cad3186fdab30c43a7ca240ee383b438e00167c4a3f',
       '0eddf34b473e7f2b4007c59fefebc09fd8735dd34b889dde25c3412489fafdf9',
       'ad61f46e5ea0b2598a63d9a406d09697b9f131022ae79a786ed1524063b6f46f',
       '6ebb10934c2a298714c5d7327f913e06f12ed2e0684ae1af178cf9fb44b580ee',
       '57c3786543d90723b7bc01497abd8d335e3918731d0f7c890ca291d161293b29'])
     :read(name);
 if(name==='current-delivery-admission-485.test.mjs')assert.equal(sha(candidate),'3c9d57988e6a4cbc8d67a7b5c392aa8e4dbc5dc656978aaaa3c6a659ba9d7611','Exact admitted predecessor for whole historical role');
 assert.equal(candidate.includes(Buffer.from('\r\n')),eol==='\r\n',name+': line endings preserved');
 const actual=candidate.toString().replaceAll('\r\n','\n');
 assert.equal(actual,expected,name+': whole candidate equals only declared edits');
 let inverse=actual;
 for(const [i,{before,after}] of edits.toReversed().entries()){
  assert.equal(inverse.split(after).length,2,name+': unique inverse '+i);
  inverse=inverse.replace(after,before);
 }
 assert.equal(inverse,original,name+': whole inverse');
 assert.equal(sha(Buffer.from(inverse.replaceAll('\n',eol))),digest,name+': byte-exact inverse');
 assert(actual.includes(negative),name+': retained original refusal');
 const removed=actual.replace(negative,'');
 assert.notEqual(removed,actual,name+': negative mutation exercised');
 assert.throws(()=>assert.equal(removed,expected),name+': negative removal refused');
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected),name+': unknown append refused');
}

test('complete current 485 source changes to current190 only at source/tree/observed count seams',()=>{
 prove('current-atlas-delivery.test.mjs','current-atlas-delivery-before-role-20261021.mjs.raw',
  '82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821',[
   seam("assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');","assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"),
   seam("assert.equal(pin.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');","assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');"),
   seam('assert.equal(sourceFiles,1550);assert.equal(inputs,1707);assert(artifacts>100);','assert.equal(sourceFiles,1553);assert.equal(inputs,1710);assert(artifacts>100);'),
  ],"['invented clinical approval',p=>{p.clinicalApproval=true;}]");
});

test('complete head-index test changes only its historical source-role assertion',()=>{
 prove('head-index-tab-stop.test.mjs','head-index-tab-stop-before-role-20261021.mjs.raw',
  'baef44aa7d0cbde7c9b2aa6f246670ef738c523444ec2ef2a9cbc85724f241b3',[
   seam(" assert.equal(text('tests/current-atlas-delivery.test.mjs'),expected);",String.raw` assert.equal(sha(Buffer.from(expected)),'e3eea7022e2154634b51f44d5d94a9dc9701ee9fb527f7c6f412f1aa7cdd169f','Exact post-roving historical test source');
 assert.notEqual(text('tests/current-atlas-delivery.test.mjs'),expected,'Current delivery is a later source epoch');`),
  ],"assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(pinBytes)}),'Old Review binding cannot admit changed keyboard behavior');");
});

test('complete filtered-layout proof changes only its archived roving source witness',()=>{
 prove('head-filtered-layout.test.mjs','head-filtered-layout-before-role-20261021.mjs.raw',
  '79a174b171076f301c8a33cf82bf8de4a3d1e5438ba2b51047ca78fb3bcbc80e',[
   seam(" assert.equal(read('tests/head-index-tab-stop.test.mjs').toString(),old.toString().replace(seam,\"let inverse=text('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw');\"));",String.raw` const archived=read('tests/fixtures/head-index-tab-stop-before-role-20261021.mjs.raw');
 assert.equal(hash(archived),'baef44aa7d0cbde7c9b2aa6f246670ef738c523444ec2ef2a9cbc85724f241b3');
 assert.equal(archived.toString(),old.toString().replace(seam,"let inverse=text('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw');"));
 assert.notEqual(read('tests/head-index-tab-stop.test.mjs').toString(),archived.toString(),'Current roving test separately checks the later source role');`),
  ],"assert.equal(candidate,old.toString(),'Whole component inverse, including question eligibility, scoring, masks, study IDs and navigation');");
});

test('complete 485 admission proof moves only its previous-source read to the exact archive',()=>{
 prove('current-delivery-admission-485.test.mjs','current-delivery-admission-485-before-role-20261021.mjs.raw',
  '53d6a7029629a01f69107509cd04958f92301e51e6e9c3a49ee9bbf56dbba5ec',[
   seam(" let source=readFileSync('tests/'+name,'utf8');",String.raw` let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');`),
   seam(String.raw` let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');`,String.raw` let source=name==='current-atlas-delivery.test.mjs'
  ?readFileSync('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw','utf8')
  :name==='clinical-review-desktop-layout.test.mjs'
   ?readFileSync('tests/fixtures/clinical-review-desktop-layout-actual485-20261020.mjs.raw','utf8')
   :readFileSync('tests/'+name,'utf8');
 if(name==='current-atlas-delivery.test.mjs')assert.equal(sha(Buffer.from(source)),'82d6c024dca59dab2dbaf944bed6f3066bf7905f99871e96033d9bf02a4c5821','Exact 485 admission witness');
 if(name==='clinical-review-desktop-layout.test.mjs')assert.equal(sha(Buffer.from(source)),'4d1ba4639ad5f71378a1ae84fec3d1224c86ff90cacf4b767212386390bf15bf','Authentic retained 485 desktop-layout source');`),
   seam(String.raw`test('admitted current scope agrees with exact source and bound imported bytes',()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 assert.equal(pin.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');assert.equal(pin.reviewSourceFiles,1550);
 const bytes=readFileSync('atlas-review/integration-inputs.json');assert.equal(sha(bytes),'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');
 const binding=JSON.parse(bytes);assert.equal(binding.inputs.length,1707);assert.equal(binding.sha256,pin.reviewIntegration);
});`,String.raw`test('historical 485 admission retains exact source and binding obligations',()=>{
 const previousBytes=readFileSync('tests/fixtures/source190-admission/previous-current.json');
 assert.equal(sha(previousBytes),'7f08673542eedf10d211b4668aad93efc65ab7854d6141ec409512edd3785eba');
 const previous=JSON.parse(previousBytes);
 assert.equal(previous.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');assert.equal(previous.reviewSourceFiles,1550);
 assert.equal(previous.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');
 assert.equal(previous.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');
 assert.equal(previous.documents['atlas-review/integration-inputs.json'],'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}),'Historical 485 pin must refuse current190 bytes');
});
test('admitted current scope agrees with exact source and bound imported bytes',()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');
 assert.equal(pin.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(pin.reviewSourceFiles,1553);
 const bytes=readFileSync('atlas-review/integration-inputs.json');assert.equal(sha(bytes),'69092b905e27e50b748a73344214a050e35cd4eb345bcebe19887b6867b8b82d');
 const binding=JSON.parse(bytes);assert.equal(binding.inputs.length,1710);assert.equal(binding.sha256,pin.reviewIntegration);
});`),
  ],"assert.equal(source,raw.toString(),'No historical/semantic/security assertion changed');");
});

test('complete atlas190 test moves only its previous-test witness and exact current transition',()=>{
 prove('atlas190-current-delivery.test.mjs','atlas190-current-delivery-before-role-20261021.mjs.raw',
  '8b6e741d1565be147f25258163ffdc00830aafcca2f4a04b39a0f4edbd5e62cf',[
   seam(" assert.equal(sha(read('tests/current-atlas-delivery.test.mjs')),proof.previousTestSha256);",String.raw` const previousTest=read('tests/fixtures/current-atlas-delivery-before-role-20261021.mjs.raw');
 assert.equal(sha(previousTest),proof.previousTestSha256,'Exact previous 485 test source');
 const edits=[
  ["assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');","assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
  ["assert.equal(pin.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');","assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');"],
  ['assert.equal(sourceFiles,1550);assert.equal(inputs,1707);assert(artifacts>100);','assert.equal(sourceFiles,1553);assert.equal(inputs,1710);assert(artifacts>100);'],
 ];
 let expectedTest=previousTest.toString();
 for(const [before,after] of edits){assert.equal(expectedTest.split(before).length,2,before);expectedTest=expectedTest.replace(before,after);}
 const actualTest=read('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(actualTest,expectedTest,'Every historical, emitted-byte, model, licence and refusal assertion survives the exact current190 seams');
 let inverse=actualTest;
 for(const [before,after] of edits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
 assert.equal(inverse,previousTest.toString(),'Complete previous current-test inverse');
 assert.notEqual(actualTest.replace("['invented clinical approval',p=>{p.clinicalApproval=true;}]",''),expectedTest,'Clinical refusal cannot disappear');
 assert.notEqual(actualTest+'\nconst unknown=true;\n',expectedTest,'Unknown append cannot enter');`),
  ],"assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Historical485pin must not admit current190bytes');");
});

test('complete salivary guard retains both original inverses and mutations at their historical postimages',()=>{
 prove('salivary-cache-guard-adaptation.test.mjs','salivary-cache-guard-adaptation-before-role-20261021.mjs.raw',
  'fb0a1ad5a1fb5e2a1c2598acdc96cc3dbb7bf1dade9859e5e3b2a5bfb144c468',[
   seam("  const before=read(fixtures+fixture),after=read('./'+name);",String.raw`  const before=read(fixtures+fixture),after=name==='atlas190-current-delivery.test.mjs'
   ?read('./fixtures/atlas190-current-delivery-before-role-20261021.mjs.raw')
   :read('./'+name);`),
   seam("  const after=read('./'+name).toString();",String.raw`  const after=(name==='atlas190-current-delivery.test.mjs'
   ?read('./fixtures/atlas190-current-delivery-before-role-20261021.mjs.raw')
   :read('./'+name)).toString();`),
  ],'assert.notEqual(sha(Buffer.from(mutated)),postHash);');
});
