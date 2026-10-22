import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {beforeCompactBinder,beforeCompactDeliveryTest,beforeExpansionFrame,beforeCompactPin,beforeProposedNavigation,compactInputs,once,sha} from './CODE/tests/review-frame-history-inverse.mjs';

const stage='F:/VisibleMedicine/staging/20261022-review-frame-history-admission';
const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const read=p=>readFileSync(p,'utf8');
const proof=(path,digest)=>assert.equal(sha(read(path)),digest,path);
proof('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json','49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
proof('F:/VisibleMedicine/staging/20261021-head-review-compact-candidate/PRESENTATION_TRANSITION.json','4590c0810ef2f3a0a729224045d7e8b5d4f074d26048bf24aec6b1f8cccbbf83');
proof('F:/VisibleMedicine/staging/20261021-head-review-compact-candidate/VERIFIED.json','d99e87b14a3bebd2e8897953c851fe3977cac5c9246f8ec7dd6583a4a02b2a40');
proof('F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate/FRAME_EVENT_BUS_CORRECTION.json','173a1cedff412fd1b1eb85751f42553fda8d43da0895857b81d187b587ce54eb');
const compactReceipt=JSON.parse(read('F:/VisibleMedicine/staging/20261021-head-review-compact-candidate/PRESENTATION_TRANSITION.json'));
assert.equal(compactReceipt.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(compactReceipt.beforeInputs,1711);assert.equal(compactReceipt.afterInputs,1712);
const frameReceipt=JSON.parse(read('F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate/FRAME_EVENT_BUS_CORRECTION.json'));
assert.equal(frameReceipt.classification.startsWith('Test-only harness event-bus conflict'),true);
assert.deepEqual(frameReceipt.counts,{tests:20,pass:20,fail:0,cancelled:0,skipped:0,todo:0});

const rows={
 'head-review-compact-preservation.test.mjs':'7257e974b953d81a4858642fddba053d56f0aa6168a765b9be620a5ce009cdf1',
 'live-learning-runtime-harness-preservation.test.mjs':'07453e8b3269f347560806b8b831a2a65026e85389888e294061ddd79e473845',
 'review-navigation-delivery-preservation.test.mjs':'aa78cc90a446a70f436ff161e7f2e506d257f7463442e63c9a470a0348d6aa9a',
};
const diagnostic={
 'head-review-compact-preservation.test.mjs':'2edd282181bf6f2f87119e25992106ebbad88b32e93bde73e3c1b7baca5fdfd8',
 'live-learning-runtime-harness-preservation.test.mjs':'c07a432944abfd9d410b3b9cedc6387ab3a8b333b4d12e41c1d86591cb4774c0',
 'review-navigation-delivery-preservation.test.mjs':'e89390f4aa8ebf4c8c709f6d6b78e9400e79e0dca7a16e58eea4de371dd8b144',
};
for(const [name,digest] of Object.entries(diagnostic))assert.equal(sha(read(join(stage,'DIAGNOSTIC/tests',name))),digest,'First staged proposal retained');
const titles=value=>[...value.matchAll(/^test\('([^']+)'/gm)].map(match=>match[1]);
for(const [name,digest] of Object.entries(rows)){
 const raw=read(join(stage,'RAW/tests',name)),code=read(join(stage,'CODE/tests',name));
 assert.equal(sha(raw),digest);assert.equal(raw,read(join(site,'tests',name)));
 assert.deepEqual(titles(code),titles(raw),name+' original cases and titles');
 assert(code.length>raw.length,name+' no original source truncation');
}
const headCode=read(join(stage,'CODE/tests/head-review-compact-preservation.test.mjs'));
const liveCode=read(join(stage,'CODE/tests/live-learning-runtime-harness-preservation.test.mjs'));
const navigationCode=read(join(stage,'CODE/tests/review-navigation-delivery-preservation.test.mjs'));
function bounded(text,start,end){const at=text.indexOf(start),stop=text.indexOf(end,at+start.length);assert(at>=0&&stop>at&&text.indexOf(start,at+1)<0,start);return text.slice(at,stop);}
function inverseHead(code){
 assert.equal(sha(code),'d7c49de5731cdf64dcc57e6e861cf9b2614d763a784a256ade5ba7755a7fc4d4');
 const raw=read(join(stage,'RAW/tests/head-review-compact-preservation.test.mjs'));
 for(const [newStart,oldStart,end] of [
  ["import {validateCurrentAtlasDelivery}",null,'const read='],
  ['function inverse(p,pairs,source=read(p))','function inverse(p,pairs)','\n\ntest(\'head notes reorder'],
  [" inverse('scripts/bind-clinical-review.mjs'"," inverse('scripts/bind-clinical-review.mjs'",' assert.equal(binding.inputs.length'],
  [" inverse('tests/current-atlas-delivery.test.mjs'"," inverse('tests/current-atlas-delivery.test.mjs'",' inverse(\'tests/review-navigation-delivery-preservation.test.mjs\''],
 ])code=once(code,bounded(code,newStart,end),oldStart===null?'':bounded(raw,oldStart,end));
 code=once(code," ],beforeProposedNavigation(read('tests/review-navigation-delivery-preservation.test.mjs')));"," ]);");
 assert.equal(code,raw,'Complete original head compact test source survives');
 return code;
}
function inverseLive(code){
 assert.equal(sha(code),'c07a432944abfd9d410b3b9cedc6387ab3a8b333b4d12e41c1d86591cb4774c0');
 code=once(code,"import {beforeExpansionFrame} from './review-frame-history-inverse.mjs';\n",'');
 code=once(code,"const current=()=>beforeExpansionFrame(read('./atlas-runtime-frame.test.mjs'));","const current=()=>read('./atlas-runtime-frame.test.mjs');");
 assert.equal(code,read(join(stage,'RAW/tests/live-learning-runtime-harness-preservation.test.mjs')),'Complete original live-learning preservation test survives');
 return code;
}
inverseHead(headCode);inverseLive(liveCode);
assert.equal(beforeProposedNavigation(navigationCode),read(join(stage,'RAW/tests/review-navigation-delivery-preservation.test.mjs')));
assert.throws(()=>inverseHead(once(headCode,"assert(!/fetch\\(|localStorage","assert(!/fetch\\(|localStoragx")));
assert.throws(()=>inverseLive(once(liveCode,"assert.equal(digest(original)","assert.equal(digest(originalx)")));
assert.throws(()=>beforeProposedNavigation(once(navigationCode,"assert.equal(sha(original)","assert.equal(sha(originalx)")));

const binder=read(join(site,'scripts/bind-clinical-review.mjs'));
const beforeLive=beforeCompactBinder(binder);
const beforeNavigator=once(beforeLive,"'components/HeadAtlasTeachingReview.tsx','components/HeadTeachingReviewNavigator.tsx','components/head-atlas.css'","'components/HeadAtlasTeachingReview.tsx','components/head-atlas.css'");
assert.equal(beforeNavigator,read(join(site,'tests/fixtures/head-review-compact/bind-clinical-review.mjs.raw')));
const currentDelivery=read(join(site,'tests/current-atlas-delivery.test.mjs'));
const beforeLaterDelivery=beforeCompactDeliveryTest(currentDelivery);
const oldDelivery=once(beforeLaterDelivery,'assert.equal(inputs,1712)','assert.equal(inputs,1711)');
assert.equal(oldDelivery,read(join(site,'tests/fixtures/head-review-compact/current-atlas-delivery.test.mjs.raw')));
const oldNavigationDelivery=once(beforeLaterDelivery,'assert.equal(inputs,1712)','assert.equal(inputs,1710)');
assert.equal(oldNavigationDelivery,read(join(site,'tests/fixtures/review-navigation-delivery/current-atlas-delivery.test.mjs.raw')));
let headDependency=beforeProposedNavigation(navigationCode);
headDependency=once(headDependency,'all previous current-delivery assertions survive the enumerated helper and head navigator additions','all previous current-delivery assertions survive the sole 1710-to-1711 helper addition');
headDependency=once(headDependency,"seam='assert.equal(inputs,1712)'","seam='assert.equal(inputs,1711)'");
headDependency=once(headDependency,'assert.equal(binding.inputs.length,1712)','assert.equal(binding.inputs.length,1711)');
assert.equal(headDependency,read(join(site,'tests/fixtures/head-review-compact/review-navigation-delivery-preservation.test.mjs.raw')),'Actual staged navigation CODE reconstructs the complete compact-era dependency fixture');
const frame=read(join(site,'tests/atlas-runtime-frame.test.mjs'));
const beforeExpansion=beforeExpansionFrame(frame);
assert.equal(beforeExpansion,read(join(stage,'CODE/tests/fixtures/review-frame-history/atlas-runtime-frame-body-learning.raw')));
const originalFrame=read(join(site,'tests/fixtures/live-learning-original-runtime-frame-test.mjs.raw'));
assert.equal(sha(originalFrame),'f4ebefd05a10639680e4c21c68c07a5ee31fbab380a3c4024c129d26872710b1');
const seamStart=liveCode.indexOf('const seams=['),seamEnd=liveCode.indexOf('\n];\nfunction inverse',seamStart);
assert(seamStart>0&&seamEnd>seamStart);
const originalSeams=runInNewContext(liveCode.slice(seamStart+'const seams='.length,seamEnd+2));
let recoveredFrame=beforeExpansion;
for(const [addition,prior] of originalSeams)recoveredFrame=once(recoveredFrame,addition,prior);
assert.equal(recoveredFrame,originalFrame,'All original runtime-frame assertions and refusals survive');
const pinBytes=read(join(site,'tests/fixtures/current-atlas-delivery.json'));
const priorPin=beforeCompactPin(pinBytes);assert.equal(priorPin.schema,'vm-current-atlas-test-delivery-1');
const priorInputs=compactInputs();assert.equal(priorInputs.inputs.length,1712);
const originalNavigationPin=JSON.parse(read(join(site,'tests/fixtures/review-navigation-delivery/current-atlas-delivery.json.raw')));
const changedHistoricalDocuments=Object.keys(originalNavigationPin.documents).filter(path=>originalNavigationPin.documents[path]!==priorPin.documents[path]).sort();
assert.deepEqual(changedHistoricalDocuments,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
const oldNavigationPin=structuredClone(priorPin);
oldNavigationPin.reviewIntegration=originalNavigationPin.reviewIntegration;oldNavigationPin.documents=originalNavigationPin.documents;
assert.deepEqual(oldNavigationPin,originalNavigationPin,'Original navigation pin theorem survives compact and later epochs');
assert.equal(read(join(stage,'CODE/tests/fixtures/review-frame-history/current-atlas-delivery-1712.json.raw')),
 read('F:/VisibleMedicine/staging/20261021-head-review-compact-candidate/website/tests/fixtures/current-atlas-delivery.json'));
assert.equal(read(join(stage,'CODE/tests/fixtures/review-frame-history/integration-inputs-1712.json.raw')),
 read('F:/VisibleMedicine/staging/20261021-head-review-compact-candidate/website/atlas-review/integration-inputs.json'));
assert.equal(beforeExpansion,read('F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/website/tests/atlas-runtime-frame.test.mjs'));

assert.throws(()=>beforeCompactBinder(once(binder,'It cannot focus scans.','It can focus scans.')));
assert.throws(()=>beforeCompactDeliveryTest(once(currentDelivery,"['foreign runtime source'","['foreign runtime sourxe'")));
assert.throws(()=>beforeExpansionFrame(once(frame,'frameListeners = new Map()','frameListeners = new Set()')));
assert.throws(()=>beforeCompactPin(once(pinBytes,'vm-current-atlas-test-delivery-2','vm-current-atlas-test-delivery-3')));
console.log(JSON.stringify({raw:rows,code:Object.fromEntries(Object.keys(rows).map(name=>[name,sha(read(join(stage,'CODE/tests',name)))])),helperSha256:sha(read(join(stage,'CODE/tests/review-frame-history-inverse.mjs'))),diagnosticPreimages:true,compactReceipt:true,frameReceipt:true,headDependency:true,wholeSourceInverses:6,pinInverse:true,mutationsRefused:7}));
