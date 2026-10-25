import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreNativeDisclosureConsumer} from './native-disclosure-source.mjs';
import {loadWorkspaceAccessRole,restoreWorkspaceAccessSource,applyWorkspaceAccessSource} from './workspace-access-source-role.mjs';
const path='app/workspace/page.tsx';
const source=readFileSync(new URL('../app/workspace/page.tsx',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('exact access-state outer inverse composes with the untouched native-disclosure inverse',()=>{
 const role=loadWorkspaceAccessRole(),prior=restoreWorkspaceAccessSource(path,source);
 assert.equal(sha(prior),role.beforeSha256);assert.equal(prior.byteLength,6193);
 assert.equal(sha(restoreNativeDisclosureConsumer(path,prior)),role.nativeInverseResultSha256);
 assert.deepEqual(applyWorkspaceAccessSource(path,prior),source,'Entire current source reconstructed byte for byte');
});
test('foreign, removed and mixed source epochs cannot enter the prior Workspace theorem',()=>{
 const role=loadWorkspaceAccessRole(),text=source.toString(),prior=restoreWorkspaceAccessSource(path,source);
 const foreign=text.replace('Where would you like to go?','Foreign workspace');
 const removed=text.replace(role.edits[3][1],role.edits[3][0]);
 const mixed=text.replace(role.edits[0][1],role.edits[0][0]);
 for(const bytes of [Buffer.from(foreign),Buffer.from(removed),Buffer.from(mixed),prior,Buffer.from(text.replaceAll('\n','\r\n'))])
  assert.throws(()=>restoreWorkspaceAccessSource(path,bytes));
 assert.throws(()=>restoreWorkspaceAccessSource('app/other/page.tsx',source));
 assert.throws(()=>applyWorkspaceAccessSource(path,source));
});
test('original metadata and normal Workspace suffix retain their independent exact identities',()=>{
 const role=loadWorkspaceAccessRole(),prior=restoreWorkspaceAccessSource(path,source);
 const metadata=JSON.parse(readFileSync(new URL('./fixtures/workspace-page-original.json',import.meta.url)));
 assert.equal(metadata.schema,'visible-medicine.original-source-text/1');assert.equal(metadata.path,path);
 assert.equal(metadata.sha256,role.originalWorkspaceTextSha256);assert.equal(sha(metadata.text),metadata.sha256);
 const marker='  const storageGb = Math.round(snapshot.entitlement.storageBytes / 1073741824);\n';
 for(const text of [source.toString(),prior.toString()])assert.equal(sha(text.slice(text.indexOf(marker))),role.normalRenderSuffixSha256);
});
