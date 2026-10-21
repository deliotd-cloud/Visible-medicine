import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const app='F:/VisibleMedicine/staging/20261021-review-return-application',stage='F:/VisibleMedicine/staging/20261021-review-return-browser';
const started=json(stage+'/STARTED.json'),inputs=json(app+'/SOURCE_INPUTS_AFTER.json');assert.equal(started.port,3002);
for(const row of inputs)assert.equal(sha(read(started.site+'/'+row.path)),row.sha256,row.path);
const result={at:new Date().toISOString(),method:'Actual in-app browser via documented cua_repl; owned tab90,1280x720; tab closed after checks',
 source:started.source,review:started.review,sourceSnapshot:app+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(app+'/SOURCE_INPUTS_AFTER.json')),
 componentSha256:sha(read(started.site+'/components/ClinicalReviewInbox.tsx')),
 checks:{automaticAuthorizedScan:true,searchAndAreaUrlState:true,learningNavigation:true,backRestoresPonsSearchAndHeadLearningArea:true,
 reloadRestoresPonsSearchAndArea:true,nextPageUpdatesUrl:true,backRestoresPage2WithEnabledPrevious:true},
 ownerPort3000Changed:false,ownerFormsTouched:false,decisionsSaved:false,accountPermissionsChanged:false,rawDomOrBrowserMediaExported:false,
 scope:'Review queue return-context behavior only. Not all keyboard/screen-reader/zoom/mobile workflows, clinical approval, full-suite or source installation. Production build passed; five test-only Buffer typing errors still require correction and full type verification.'};
fs.writeFileSync(stage+'/OBSERVATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({observation:stage+'/OBSERVATION.json',sha256:sha(read(stage+'/OBSERVATION.json')),checks:result.checks}));
