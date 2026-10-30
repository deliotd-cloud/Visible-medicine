import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-review-release-continuation',pin=root+'/SOURCE-VERIFIED-SUBSET.json',source=json(pin),site=source.website;
const verify=()=>{for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);};verify();
const {validateCurrentAtlasDelivery}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs').href);
const actual=validateCurrentAtlasDelivery();assert.equal(actual.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
assert.equal(actual.reviewIntegration,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
assert.throws(()=>validateCurrentAtlasDelivery({pin:json(root+'/DELIVERY_PIN_BEFORE.json')}));
const mutations=[p=>p.source='0'.repeat(40),p=>p.reviewIntegration='0'.repeat(64),p=>p.documents['atlas-review/manifest.json']='0'.repeat(64),p=>p.clinicalApproval=true,p=>p.runtimeSources.shoulder='0'.repeat(40),p=>p.reviewSourceFiles++,p=>p.viewerFiles++,p=>p.viewerPackages++];
for(const mutate of mutations){const forged=structuredClone(actual);mutate(forged);assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}));}
const result=await guarded({site,dir:root+'/checks/verified-subset',command:'--test --test-concurrency=1 --test-reporter=tap tests/head-disclosure-ed3-role.test.mjs',heap:1536,aggregate:2048,minimum:4096,extraEnv:{TEMP:root,TMP:root}});
verify();fs.writeFileSync(root+'/RESULT-verified-subset.json',JSON.stringify({...result,source:{path:pin,sha256:hash(pin)},sourceUnchanged:true,positiveDeliveryValidated:true,staleDeliveryRejected:true,forgedDeliveryNegatives:mutations.length,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:result.passing,forgedDeliveryNegatives:mutations.length}));process.exitCode=result.passing?0:1;
