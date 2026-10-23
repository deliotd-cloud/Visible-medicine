import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreSurfaceDesktopHistoricalTest} from './four-consumer-source-inverse.mjs';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const roles={
 'desktop-learning-row-history.test.mjs':{
  witness:'./fixtures/head-tools-current-consumer/desktop-learning-row-history.test.mjs.raw',
  before:'189e900c45910ac63e2227098c0e4187eb69c9854018c893fc172ddaf32639c9',
  after:'bf0374b9a54789d6a8c50df44050350b274fb53d111acd2c47ee5b2d5b5fe6c5',
  hunks:['e887af9e8c1e2d87eb958228e41dece227ee8fa13a21b14e43bd0ad9423a3c3a','9d09febc4a0564110c197d1daaf5826e9b2b8fb46291d4318c6e6f60076466df','e69403c206f79c7f4ca5225cb43458fea9382785a98ddc464853b02376698e25','fd6c1f5ee724706709242bad39778dcded08ad67d9c1a40ffcaf6a1a7f7d7b69','29866bcc0518c9ef606e994f2fda5370c4ee1a14d813d61c6ee3931fa442bf5a','489189f4e8864ab784086654389e86f646c29eba3d63aba052ff83abee4a07b2']
 },
 'drawable-epoch-current-admission.test.mjs':{
  witness:'./fixtures/zero-registration-before/drawable-epoch-current-admission.test.mjs.raw',
  before:'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce',
  after:'522d21d973f0e54edcf4936e2f544d6d032a7147267edb301d389edab33bf388',
  hunks:['242b88703490f235adc9543033998b740d531b04681fb7f0e4d43001e3ee7835','69e6888ecc8dcc37d860506b52ea15f9e9888f0d3c202030bfff2e003d364a8b','fd8c39980c589e8b1c5759c712b3270c16e3a1b9361b760e62959b39bf12f984','36ea6b80a60fc9e63c1fc256564c92d51e6a7724b8810cefc2bb8a466c5b5050','0852ea10728abbeb0876c37c929b8160b30ff06a36112dee427fd8f36b70cc27','7e0d4174a3698ec6b17d40b82cf22880d82eb492e5a22071fde1401f4f035aaf','b141675cf5a4ec559681bd966bcdd95a137afd103125db99abd0a95c350f15b6','e86957e2f63bf0501155f699bc46d187ec870aaf5cdff9a7ed043a3c9bec3732','260d77ef9eb2a1c90c432ad2597abc5bd7ad02d249d8407d80afcab5f8f97b8a','a9c0f773eb71c481ec057594e5d743938979c94f3412023e1b0f231fa9736310']
 },
 'head-manual-recovery-54-to-55-closed.test.mjs':{
  witness:'./fixtures/current-source-closure-before/head-manual-recovery-54-to-55-closed.test.mjs.raw',
  before:'07c63b0d0eb11832ba209715a2c20e42f791c9d171a6902fb950010cfd5443ad',
  after:'e60a4d22254e3af6da0394822cee26acc52fa8373c67c634400b36f74bf96f9a',
  hunks:['3bd3248aa1f3b2f666fb7daf5f884e5cea0fcef03c7b12db3a0f136a54e6a125','0752d2dba76f526c50ffbcec3519ca619ea93b9cee01c459ffcbeb4a7bc81738']
 },
 'head-native-history-current-transition.test.mjs':{
  witness:'./fixtures/current-source-closure-before/head-native-history-current-transition.test.mjs.raw',
  before:'6a2cf5ee21203146e830b696436fa5abc5d41637e818b7e54acfa672d5e5cfb5',
  after:'6280d5d8c8bd42447827a29f256acb5e718acd07effb549e9226ddc4b8efd8b4',
  hunks:['f55448ee49832001a629311310cd5c985879fe83fc6615f851dea3a85ccdd065']
 }
};
const read=path=>readFileSync(new URL(path,import.meta.url));
const lossless=bytes=>{
 const source=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(source),bytes,'Complete lossless UTF-8 source');
 assert(!source.includes('\r'),'Exact LF source');
 return source;
};
const once=(source,from,to)=>{
 assert.equal(source.split(from).length,2,'Unique exact source seam: '+from.slice(0,80));
 return source.replace(from,to);
};
function restoreDrawable(current){
 let source=current;
 const marker="\ntest('complete original drawable admission source survives named current roles'";
 assert.equal(source.split(marker).length,2,'One complete appended inverse proof');
 source=source.split(marker)[0];
 source=once(source,"import {beforeSurfaceBinder} from './surface-binder-history-inverse.mjs';\n",'');
 source=once(source,"import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';\n",'');
 source=once(source,"import {restorePreNeckHeadTeaching2381,restorePrePresentationViewer2381} from './zero-registration-current-roles-inverse.mjs';\n",'');
 source=once(source,"const faLaterBindings=new Set([\n 'atlas-review/app/body-explorer.tsx','atlas-review/app/eye-layers.tsx',\n 'atlas-review/app/review/review-dashboard.tsx','atlas-review/app/ventricles.tsx',\n 'atlas-review/lib/head-selection-channel.ts','atlas-review/lib/regional-tours.ts',\n 'atlas-review/lib/renal-tour.ts','components/HeadAtlasComparisonNavigation.tsx',\n 'components/HeadAtlasGuidedModel.tsx','components/HeadAtlasInlineComparison.tsx',\n 'components/HeadAtlasLinkedModel.tsx',\n]);\n",'');
 source=once(source,'restorePrePresentationViewer2381(readLive(headViewerPath),restorePracticeExitViewer)','readLive(headViewerPath)');
 source=once(source,"const frozenHeadNeck=()=>restorePreNeckHeadTeaching2381(readLive('atlas-review/content/regional-teaching/head-neck.json'));\n",'');
 source=once(source," const preSurface=beforeSurfaceBinder(live.toString('utf8'),\n  readFileSync(join(websiteRoot,'tests/fixtures/head-surface-before-20261022/scripts__bind-clinical-review.mjs.raw'),'utf8'));\n",'');
 source=once(source,"assert.equal(sha(live),'56feeaebfcbea52a28077a7e4a15e645c2a9c3fbd0be30a7e411d692d1ff9c97','Exact current surface binder');","assert.equal(sha(live),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06','Exact later same-tab binder');");
 source=once(source,'preSurface.split(addition)',"live.toString('utf8').split(addition)");
 source=once(source,"preSurface.replace(addition,'')","live.toString('utf8').replace(addition,'')");
 source=once(source,"const importerHistoryBytes=readFileSync(join(websiteRoot,'tests/fixtures/head-surface-before-20261022/lib__head-atlas-import.ts.raw'));\nassert.equal(sha(importerHistoryBytes),'9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57','Exact fa1 importer source');\n",'');
 source=once(source," faLaterBindings.has(path)?readFileSync(join(websiteRoot,'tests/fixtures/zero-registration-fa1-binding',path+'.raw')):\n",'');
 source=once(source,"path===headViewerPath?frozenHeadViewer():\n path==='atlas-review/content/regional-teaching/head-neck.json'?frozenHeadNeck():\n path==='lib/head-atlas-import.ts'?importerHistoryBytes:readLive(path)",'path===headViewerPath?frozenHeadViewer():readLive(path)');
 source=once(source,"assert.equal(currentDelivery.CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');","assert.equal(currentDelivery.CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');");
 return source;
}
function restoreManual(current){
 let source=once(current,"test('actual current delivery remains independently bound beyond the closed54/55 transitions',()=>{","test('actual current190 remains independently bound beyond the closed54/55 transitions',()=>{");
 for(const [from,to] of [
  ["current.source,'2381efe43b75f8a7fb768a069eecd7268c508dac'","current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'"],
  ["current.sourceTree,'db21ed3dee259c390878450b3495468996a3af85'","current.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2'"],
  ["current.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc'","current.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a'"],
  ['current.reviewSourceFiles,1562','current.reviewSourceFiles,1558']
 ])source=once(source,from,to);
 return source;
}
function restoreNative(current){
 let source=once(current,"test('actual current delivery retains independent 190a runtimes without treating closed53 as current',()=>{","test('actual current6d7 delivery retains independent 190a runtimes without treating closed53 as current',()=>{");
 source=once(source," const live=validateLiveAtlasDelivery();assert.equal(live.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');assert.equal(live.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');assert.equal(live.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');assert.equal(live.reviewSourceFiles,1562);",
  " const live=validateLiveAtlasDelivery();assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(live.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');assert.equal(live.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');assert.equal(live.reviewSourceFiles,1558);");
 return source;
}
const restorers={
 'desktop-learning-row-history.test.mjs':current=>lossless(restoreSurfaceDesktopHistoricalTest(Buffer.from(current))),
 'drawable-epoch-current-admission.test.mjs':restoreDrawable,
 'head-manual-recovery-54-to-55-closed.test.mjs':restoreManual,
 'head-native-history-current-transition.test.mjs':restoreNative
};
export function restoreCurrentHeadToolsWiderConsumer(name,currentBytes,witnessBytes){
 const role=roles[name];assert(role,'Only four named current consumer roles');
 assert.equal(sha(witnessBytes),role.before,name+': authenticated complete intermediate witness');
 assert.equal(sha(currentBytes),role.after,name+': authenticated complete sealed current source');
 const old=lossless(witnessBytes),current=lossless(currentBytes);
 const recovered=restorers[name](current);
 assert.equal(recovered,old,name+': exact complete intermediate assertion body');
 const hunks=sourceHunks(old,current),forward=old.split('\n');
 assert.deepEqual(hunks.map(hunk=>sha(Buffer.from(JSON.stringify(hunk)))),role.hunks,name+': only the enumerated current-role hunks');
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(forward.slice(hunk.oldStart,hunk.oldStart+hunk.removed.length),hunk.removed,'Exact forward hunk');
  forward.splice(hunk.oldStart,hunk.removed.length,...hunk.added);
 }
 assert.equal(forward.join('\n'),current,name+': complete current forward reconstruction');
 return witnessBytes;
}
for(const [name,role] of Object.entries(roles))test('complete intermediate consumer source reaches exact sealed current role: '+name,()=>{
 const witness=read(role.witness),current=read('./'+name);
 assert.deepEqual(restoreCurrentHeadToolsWiderConsumer(name,current,witness),witness);
 assert.throws(()=>restoreCurrentHeadToolsWiderConsumer(name,Buffer.concat([current,Buffer.from('\n// forged\n')]),witness),'Appended assertion must be refused');
 assert.throws(()=>restoreCurrentHeadToolsWiderConsumer(name,current,Buffer.concat([witness,Buffer.from('\n// forged\n')])),'Forged witness must be refused');
 assert.throws(()=>restoreCurrentHeadToolsWiderConsumer(name,witness,witness),'Intermediate role cannot impersonate current');
});
