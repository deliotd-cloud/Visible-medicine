import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
/** Apply only the six unique, complete forward contexts to an authenticated fixture. */
export function reconstructBodyLectureEditor(original,transition){
  assert.equal(transition.beforeSha256,sha(original));
  assert.equal(transition.afterSha256,'f58f16bf99b926ec334c038f3e19970204ce3abbf94ad122b36d45f95971ec92');
  assert.equal(transition.changes.length,6);
  let source=original.toString();
  for(const change of transition.changes){
    assert.equal(source.split(change.before).length,2,'Every complete before-context must occur once');
    source=source.replace(change.before,change.after);
  }
  assert.equal(sha(Buffer.from(source)),transition.afterSha256,'The exact body-link-era intermediate must be reconstructed');
  return source;
}
/** Exact body-link-era intermediate witness; this is not a full historical Website receipt. */
export function readAuthenticatedBodyLectureEditor(){
  const original=read('./fixtures/body-lecture-links/components__LectureEditor.tsx.raw');
  assert.equal(sha(original),'b78b2bd2590a7a7f30f7ea9393d52ff4fa6d0993783d866ae0431ddb49f0173a');
  const bytes=read('./fixtures/body-lecture-links/editor-transition.json');
  assert.equal(sha(bytes),'7bd2e6019ff71c08541439bd96f772ece4ee48485cb4af250020416b0747af61');
  return reconstructBodyLectureEditor(original,JSON.parse(bytes));
}
/** Undo only the six reviewed body-link additions before applying older preservation proofs. */
export function restorePreBodyLectureEditor(source){
  const bytes=read('./fixtures/body-lecture-links/editor-transition.json');
  assert.equal(sha(bytes),'7bd2e6019ff71c08541439bd96f772ece4ee48485cb4af250020416b0747af61');
  const transition=JSON.parse(bytes);
  assert.equal(transition.changes.length,6);
  assert.equal(sha(Buffer.from(source)),transition.afterSha256,'The body transition is source-bound, never a generic exemption');
  let restored=source.replaceAll('\r\n','\n');
  for(const change of [...transition.changes].reverse()){
    assert.equal(restored.split(change.after).length,2,'Every complete after-context must occur once');
    restored=restored.replace(change.after,change.before);
  }
  const original=read('./fixtures/body-lecture-links/components__LectureEditor.tsx.raw');
  assert.equal(sha(original),transition.beforeSha256);
  assert.equal(restored,original.toString().replaceAll('\r\n','\n'),'Every other source statement survives');
  return restored;
}
