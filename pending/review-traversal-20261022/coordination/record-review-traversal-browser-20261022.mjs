// Save only synthetic fixture results. No private review record was opened or saved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-traversal-browser-fixture',server=json(root+'/SERVER.json');assert.equal(sha(read(server.sourcePath)),server.sourceSha256);
const result={at:new Date().toISOString(),sourcePath:server.sourcePath,sourceSha256:server.sourceSha256,scriptSha256:server.scriptSha256,fixtureSha256:server.fixtureSha256,ownedPage:54,ownedContext:'vm-review-traversal-qa-20261022',ownedPageClosed:true,ownedServerPid:336964,ownedServerStopped:true,
 browserNavigationApiAvailable:true,nativeInputAndHistoryUsed:true,
 cases:[{action:'Fill synthetic dirty draft; browser Back',observed:{pathRetained:'/review?structure=synthetic',blocked:1,textRetained:true,noDialog:true}},
 {action:'Mark fixture clean; browser Back',observed:{path:'/review/overview',navigationAllowed:true}},
 {action:'Fill synthetic draft; browser Forward',observed:{pathRetained:'/review/overview',blocked:2,textRetained:true,noDialog:true}},
 {action:'Mark fixture clean; browser Forward',observed:{path:'/review?structure=synthetic',navigationAllowed:true}},
 {action:'Fill synthetic draft; dispose guard; browser Back',observed:{path:'/review/overview',blocked:2,disposedCallbackDidNotBlock:true}}],
 expectedObservationTimeouts:{back:1,forward:1,reason:'The browser navigation waiter timed out after10seconds because the real cancelable traversal was prevented; page state separately confirmed the guard fired and URL/draft remained.'},
 scope:'Actual source helper in native browser Navigation API with a synthetic textarea/history harness. Actual dashboard committed-effect wiring and complete preceding-source inverse are separately tested. Not an authenticated full worksheet/route, router-unmount, unsupported-browser, approval, account or clinical acceptance certificate.',
 actualPrivateReviewRoute:false,actualReviewRecordsChanged:false,authenticationChanged:false,clinicalApproval:false,ownerPreviewChanged:false,canonicalInstalled:false,publicDeployment:false};
fs.writeFileSync(root+'/NATIVE_QA.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/NATIVE_QA.json',sha256:sha(read(root+'/NATIVE_QA.json')),cases:result.cases.length,ownerPreviewChanged:false}));
