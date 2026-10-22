// Plan exact checks from recorded roots and the actual test-only source delta.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const pointer=json('CURRENT_CHECKPOINT.json').activeWork.current;
const sourceReceipt=pointer.sourceReceipt,sourceReceiptSha256=pointer.sourceReceiptSha256,source=json(sourceReceipt);
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);
assert.equal(source.review,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
const baseline=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/TEST_READY_SOURCE.json');
const before=new Map(baseline.sourceRows.map(row=>[row.path,row.sha256]));
const changed=source.sourceRows.filter(row=>before.get(row.path)!==row.sha256);
assert(changed.every(row=>row.path.startsWith('tests/')));
const originalPath='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/native-terminal-followups-v6/INPUTS.json';
const original=json(originalPath),roots=original.args.filter(arg=>arg.startsWith('tests/'));
assert.equal(roots.length,101);
const extras=changed.filter(row=>/\.test\.(?:ts|mjs)$/.test(row.path)).map(row=>row.path);
extras.push('tests/review-loading-bind-completeness.test.mjs','tests/colic-adapter-inverse.test.mjs');
// Root names are validated against the actual source graph, never silently dropped.
const available=new Set(source.sourceRows.map(row=>row.path));
for(const relative of extras)assert(available.has(relative),'Named additional root exists: '+relative);
const tests=[...new Set([...roots,...extras])].sort();assert(tests.length<=200);
const stage='F:/VisibleMedicine/staging/20261022-final-closure-verification';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const common={sourceReceipt,sourceReceiptSha256};
const scope='Original101-root V6 regression scope plus all changed standalone test roots and named loading/colic consumers. This is selected native coverage, not whole-suite, transitive completeness, browser, clinical or release certification.';
fs.writeFileSync(stage+'/NATIVE_PLAN.json',JSON.stringify({...common,evidence:stage+'/native-selected',scope,tests},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/TYPES_PLAN.json',JSON.stringify({...common,evidence:stage+'/types-current',kind:'types',scope:'Full TypeScript against the exact combined test-only graph; product bytes unchanged.',tests:[]},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/ROOT_SELECTION.json',JSON.stringify({at:new Date().toISOString(),...common,originalPath,originalSha256:sha(read(originalPath)),originalRoots:roots.length,addedRoots:tests.filter(path=>!roots.includes(path)),changedTestPaths:changed.map(row=>row.path),scope},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,roots:tests.length,additional:tests.length-101,sourceReceiptSha256}));
