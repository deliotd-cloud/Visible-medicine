// Closed historical metadata/source reader; no current-file fallback.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute,sep} from 'node:path';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const root='F:/VisibleMedicine/recovery/checkpoints/20261016-connective-website-integration';
const compositeBytes=readFileSync(root+'/composite-source-manifest.json');
assert.equal(sha(compositeBytes),'32da006d7681c33cbcf64ad8f62db23511d16613518827883b8f3fe7288c52f2');
const rows=new Map(JSON.parse(compositeBytes).files.map(row=>[row.path,row]));
const allowed=new Set(['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json',
 'atlas-review/app/review/review-change-notice.css','atlas-review/app/review/review-change-notice.tsx','atlas-review/lib/review-change-summary.ts',
 'atlas-review/app/review/body/body-decision-editor.tsx','atlas-review/app/review/nested/workspace.tsx','atlas-review/app/review/specimens/workspace.tsx']);
export function readNoticeHistoricalImport(file){
 assert(allowed.has(file),'Only named historical notice metadata/source is readable');
 const row=rows.get(file);assert(row);
 const source=realpathSync(row.restoredRoot),base=realpathSync('F:/VisibleMedicine/recovery/checkpoints');
 assert(source.startsWith(base+sep),'Historical source root outside recovery');
 const target=resolve(source,file),local=relative(source,target);assert(local&&!local.startsWith('..')&&!isAbsolute(local));
 assert.equal(realpathSync(target),target,'Historical notice file must not escape through links');
 const bytes=readFileSync(target);assert.equal(sha(bytes),row.sha256,'Historical notice bytes changed: '+file);return bytes;
}
const manifestBytes=readNoticeHistoricalImport('atlas-review/manifest.json');
assert.equal(sha(manifestBytes),'b3ff9dbabe672bd665d850e9efbf75dbbb25f544f2d0615a2351799a7defd14f');
const manifest=JSON.parse(manifestBytes);assert.equal(manifest.revision,'408759d57644b05402e98a937e7cf6338b5509cf');assert.equal(manifest.files.length,1499);
for(const file of allowed)if(file.startsWith('atlas-review/')&&!file.endsWith('/manifest.json')&&!file.endsWith('/integration-inputs.json')){
 const row=manifest.files.find(row=>row.path===file.slice('atlas-review/'.length));assert(row);assert.equal(sha(readNoticeHistoricalImport(file)),row.importedSha256);
}
