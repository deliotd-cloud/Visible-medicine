// Exact outer source inverse for the prior Workspace disclosure theorem.
// This never supplies product rendering or a current access implementation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const PATH='app/workspace/page.tsx';
const BEFORE='f2cb7a59721ac606632f6acebbedd6dd08e001b579c6fd75a764fe2f8ed56599';
export const workspaceAccessSourceSha256='fd72a74dd2221548d6419f97f1f35d1f929a4223593cc1efc652f8c6cdce3c9a';
export function loadWorkspaceAccessRole(){
 const bytes=readFileSync(new URL('./fixtures/workspace-access-source-role.json',import.meta.url));
 assert.equal(sha(bytes),'54afb1c43e8010f5baa1e6a78c70f0e1e4a24e46aa2a9c0efdfb6c34788b3e90','Exact outer source-role contract');
 const role=JSON.parse(bytes);
 assert.equal(role.schema,'vm-workspace-access-source-role/1');assert.equal(role.path,PATH);
 assert.equal(role.beforeSha256,BEFORE);assert.equal(role.afterSha256,workspaceAccessSourceSha256);assert.equal(role.edits.length,4);
 assert.equal(sha(readFileSync(new URL('./native-disclosure-source.mjs',import.meta.url))),role.nativeInverseModuleSha256,'Original native-disclosure inverse unchanged');
 assert.equal(sha(readFileSync(new URL('./fixtures/workspace-page-original.json',import.meta.url))),role.originalMetadataSha256,'Original original-source metadata unchanged');
 return role;
}
function change(path,bytes,reverse){
 assert.equal(path,PATH,'Only the declared Workspace source role');
 const role=loadWorkspaceAccessRole();
 assert.equal(sha(bytes),reverse?role.afterSha256:role.beforeSha256,'Exact source epoch; no current/historical fallback');
 assert.equal(Buffer.byteLength(bytes),reverse?role.afterBytes:role.beforeBytes);
 let text=Buffer.from(bytes).toString('utf8');
 for(const [before,after] of reverse?role.edits.toReversed():role.edits){
  const from=reverse?after:before,to=reverse?before:after;
  assert(from.length>0);assert.equal(text.split(from).length-1,1,'One exact outer source seam');text=text.replace(from,to);
 }
 const restored=Buffer.from(text);
 assert.equal(sha(restored),reverse?role.beforeSha256:role.afterSha256,'Complete-file outer inverse/forward proof');
 const marker='  const storageGb = Math.round(snapshot.entitlement.storageBytes / 1073741824);\n';
 assert.equal(text.split(marker).length-1,1);assert.equal(sha(text.slice(text.indexOf(marker))),role.normalRenderSuffixSha256,'Normal Workspace source suffix unchanged');
 return restored;
}
export function restoreWorkspaceAccessSource(path,bytes){return change(path,bytes,true);}
export function applyWorkspaceAccessSource(path,bytes){return change(path,bytes,false);}
