import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website',prep=json(candidate+'/PREPARATION.json');
for(const row of json(candidate+'/SOURCE_INPUTS_AFTER.json'))assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const stage='F:/VisibleMedicine/staging/20261021-source190-desktop-qa';const started=json(stage+'/STARTED.json');assert.equal(started.pid,274416);assert.equal(started.port,3002);
const result={at:new Date().toISOString(),site:prep.site,source:started.source,review:started.review,inputCount:5095,inputsUnchanged:true,tab:'85',url:'http://127.0.0.1:3002/atlas/3d',
 observation:'Actual 1280x720desktop screenshot/AX shows whole-body first;compact modality/region bar,4modes Explore/Dissect/Guided learning/Quiz,side system controls,contextual stage tools and collapsed coverage/provenance. Source notice remains concise. Agent-created QA tab only;owner tabs never interacted with.',
 failure:'Actual canvas is blank with retained-settings/retry notice. Browser console shows registered model requests503;fresh isolated candidate excluded private D1/R2 state. Anonymous HTTP HEAD gives401/private no-store. This is NOT loaded-model/camera/dissection/tour/clinical browser acceptance. Protected guard was not bypassed;no account/role/permission/state copied or provisioned.',
 action:'Stop this owned QA preview before further source edits. Continue independent direct-review navigation simplification using bounded proposal;retain this original5095input observation and source190build/29case evidence. Native private binding setup and actual loaded-model desktop acceptance remain open.',
 ownerPort3000Untouched:true,privateDataCopied:false,authenticationChanged:false,browserPixelsOrDomUploaded:false,loadedModelAcceptance:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(stage+'/OBSERVATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({inputCount:5095,observedDesktop:true,loadedModels:false,ownerPreviewUnchanged:true}));
