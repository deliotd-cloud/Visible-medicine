import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs',site=root+'/website',pin=root+'/PARENT_SOURCE.json';
assert.equal(hash(pin),'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');
const parent=json(pin),allowed=new Set([
 'tests/cervical-a01-history-transport.mjs','tests/atlas-cervical-a01-current-delivery.test.mjs',
 'tests/head-mri-independent-review-ui.test.ts','tests/atlas-teaching-original-roles.mjs','tests/atlas-teaching-original-roles.test.mjs',
 'tests/complete-release-followup-preservation.test.mjs',
 'tests/head-layout-history-adapter.mjs','tests/head-filtered-layout.test.mjs','tests/head-link-menu-current.test.mjs',
 'tests/head-review-sections-preservation.test.mjs','tests/thyroid-ui-admission-history-1031.mjs',
 'tests/clinical-review-abdominal-detail-xray.test.ts','tests/clinical-review-femoral-arterial-xray.test.ts',
 'tests/clinical-review-shoulder-vessel-xray.test.ts','tests/clinical-review-knee-stability-guide.test.ts',
 'tests/coverage-delivery-roles.mjs','tests/current-coverage-delivery.test.mjs'
]),changes=[];
const rows=parent.sourceRows.map(r=>{
 assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent changed: '+r.path);
 const actual=hash(site+'/'+r.path);if(actual===r.sha256)return r;
 assert(allowed.has(r.path),'Unexpected edit: '+r.path);changes.push({path:r.path,before:r.sha256,after:actual});return {path:r.path,sha256:actual,bytes:fs.statSync(site+'/'+r.path).size};
});
assert.equal(changes.length,17);
assert(!fs.existsSync(site+'/tests/cervical-a01-temp.test.mjs'));assert(!fs.existsSync(site+'/tests/atlas-teaching-native-transport.test.mjs'));
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,parent.review);
for(const r of inputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,'Protected input changed: '+r.path);
const environment={path:root+'/HISTORICAL_ENVIRONMENT.json',sha256:hash(root+'/HISTORICAL_ENVIRONMENT.json')};
assert.equal(json(environment.path).environment.VM_TEACHING_ORIGINAL_ATLAS,'F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas');
const source={...parent,schema:'vm-release-partition-eleven-successor/1',at:new Date().toISOString(),parent:{path:pin,sha256:hash(pin)},website:site,sourceRows:rows,currentChanges:changes.map(r=>r.path),authoredPaths:[...new Set([...parent.authoredPaths,...changes.map(r=>r.path)])],historicalEnvironment:environment,runtimeUnchangedFromParent:true,installed:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const out={at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},changed:changes,allProductBytesUnchanged:true,protectedInputsUnchanged:true,rootRosterUnchanged:true,environment,installed:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/COMPOSITION.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:out.source,changes:changes.length,productUnchanged:true}));
