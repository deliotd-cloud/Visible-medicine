import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const proposal='F:/VisibleMedicine/staging/20261026-bounded-stock-campaign-proposal',out='F:/VisibleMedicine/staging/20261026-current-bounded-campaign-driver';
const source='F:/VisibleMedicine/staging/20261026-current-delivery-advance/SOURCE_CANDIDATE.json';
assert.equal(hash(source),'9da49fa0b687608c86fdee92459eb3693b39426789fbe6e86595f1ff18a03e43');
assert(json('F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2/RESULT.json').passingControls);
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);assert(!fs.existsSync(out));fs.mkdirSync(out);
const pins={'bounded-stock-campaign.mjs':'16cbdb05db40e407c5790eccf265d564787b85ac1735207ff1b16fa4866c162c','structured-test-reporter.mjs':'1cb5e3c17e8636ca52cc91084dedfdec78425c05ba0f78d1104dfdd239791067','plan-refusals.test.mjs':'585602a0d026b83dbd9cda5f93dc4caa5d69d7f0a36df4e36cdaab0ce1e53159'};
for(const [p,d]of Object.entries(pins))assert.equal(hash(proposal+'/'+p),d);
let bytes=fs.readFileSync(proposal+'/bounded-stock-campaign.mjs','utf8');
const changes=[
 ['F:/VisibleMedicine/staging/20261026-saved-plan-commit/website','F:/VisibleMedicine/staging/20261026-current-delivery-advance/website'],
 ['F:/VisibleMedicine/staging/20261026-saved-plan-commit/SOURCE_CANDIDATE.json',source],
 ['c48b507b9c870e0ee8ccb11760c1c1f0127d4550284388b3211a8e5b04262101',hash(source)],
 ['--test-reporter=${reporterPath}','--test-reporter=${pathToFileURL(reporterPath).href}']
];for(const [before,after]of changes){assert.equal(bytes.split(before).length,2,before);bytes=bytes.replace(before,after);}
let inverse=bytes;for(const [before,after]of [...changes].reverse())inverse=inverse.replace(after,before);assert.equal(inverse,fs.readFileSync(proposal+'/bounded-stock-campaign.mjs','utf8'));
fs.writeFileSync(out+'/bounded-stock-campaign.mjs',bytes,{flag:'wx'});
for(const p of ['structured-test-reporter.mjs','plan-refusals.test.mjs'])fs.copyFileSync(proposal+'/'+p,out+'/'+p,fs.constants.COPYFILE_EXCL);
const record={at:new Date().toISOString(),source:{path:source,sha256:hash(source)},proposalPins:pins,
 changes:changes.map(([from,to])=>({from,to})),inverseByteEquality:true,allCaseAndSourceAssertionsPreserved:true,
 driver:{path:out+'/bounded-stock-campaign.mjs',sha256:hash(out+'/bounded-stock-campaign.mjs')},reporter:{path:out+'/structured-test-reporter.mjs',sha256:hash(out+'/structured-test-reporter.mjs')},
 controls:{path:'F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2/RESULT.json',sha256:hash('F:/VisibleMedicine/staging/20261026-bounded-campaign-controls-v2/RESULT.json')},
 stockSuitePassingClaim:false,normalPreviewChanged:false};
fs.writeFileSync(out+'/ADAPTER.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(record));
