import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='F:/VisibleMedicine/staging/20261028-release-repair-recipes';
const original=root+'/campaign-v2.mjs';assert.equal(hash(original),'4e56e07083989db8db05265e6e7b70213584879e7359e457718e3ae077fe6ee7');
const before=fs.readFileSync(original,'utf8'),from="import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';",to="import {guarded} from './admission-wait.mjs';";
assert.equal(before.split(from).length,2);const after=before.replace(from,to);assert.equal(after.replace(to,from),before);
fs.writeFileSync(root+'/campaign-v3.mjs',after,{flag:'wx'});
fs.writeFileSync(root+'/CAMPAIGN_V3_POLICY.json',JSON.stringify({at:new Date().toISOString(),before:{path:original,sha256:hash(original)},after:{path:root+'/campaign-v3.mjs',sha256:hash(root+'/campaign-v3.mjs')},soleEdit:{from,to},wrapper:{path:root+'/admission-wait.mjs',sha256:hash(root+'/admission-wait.mjs')},purpose:'Wait at most12 observations for two consecutive samples with128MiB additional headroom, then execute unchanged immediate admission and original resource guards. No test/source/timeout/limit changes.',originalJobLimitsUnchanged:true},null,2)+'\n',{flag:'wx'});
