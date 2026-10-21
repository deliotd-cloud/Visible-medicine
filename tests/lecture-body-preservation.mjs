import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
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
