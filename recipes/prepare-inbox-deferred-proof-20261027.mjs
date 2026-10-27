import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-inbox-deferred-return',site=stage+'/website',change=json(stage+'/COMPONENT_CHANGE.json');
const fixture='tests/fixtures/inbox-deferred-return-transition.json';fs.writeFileSync(site+'/'+fixture,JSON.stringify({beforeSha256:change.beforeSha256,afterSha256:change.afterSha256,operations:change.operations},null,2)+'\n',{flag:'wx'});
const helper='tests/inbox-deferred-return-source-role.mjs';
fs.writeFileSync(site+'/'+helper,`import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(new URL('./fixtures/inbox-deferred-return-transition.json',import.meta.url));
assert.equal(sha(raw),${JSON.stringify(hash(site+'/'+fixture))});const role=JSON.parse(raw);
/** Restore only the authenticated earlier source for its historical diff assertion. */
export function priorInboxSource(current){assert.equal(sha(current),role.afterSha256);let source=current;for(const{from,to}of [...role.operations].reverse()){assert.equal(source.split(to).length,2);source=source.replace(to,from);}assert.equal(sha(source),role.beforeSha256);return source;}
`,{flag:'wx'});
const file=site+'/tests/clinical-review-inbox-return-pager-focus.test.mjs',before=fs.readFileSync(file,'utf8');let text=before;
const from="  const after = readFileSync(componentPath, 'utf8');",to="  const after = priorInboxSource(readFileSync(componentPath, 'utf8'));";assert.equal(text.split(from).length,2);text="import { priorInboxSource } from './inbox-deferred-return-source-role.mjs';\n"+text.replace(from,to);
assert.equal(text.replace("import { priorInboxSource } from './inbox-deferred-return-source-role.mjs';\n",'').replace(to,from),before);fs.writeFileSync(file,text);
fs.writeFileSync(stage+'/HISTORICAL_TEST_ROLE.json',JSON.stringify({at:new Date().toISOString(),path:file,originalSha256:hash(new URL('file:///'+file.replace('20261027-inbox-deferred-return','20261027-regional-catalogue-compact'))),afterSha256:hash(file),fixture:{path:fixture,sha256:hash(site+'/'+fixture)},helper:{path:helper,sha256:hash(site+'/'+helper)},originalAssertionsAndFiveCurrentBehaviorCasesUnchanged:true,reason:'Historical three-seam source reconstruction must apply to its authenticated historical component; current behavior tests still load actual current component.'},null,2)+'\n',{flag:'wx'});
console.log('Historical source assertion retained through an exact authenticated inverse.');
