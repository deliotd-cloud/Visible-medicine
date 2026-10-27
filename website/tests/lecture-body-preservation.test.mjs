import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {readAuthenticatedBodyLectureEditor,reconstructBodyLectureEditor,restorePreBodyLectureEditor} from './lecture-body-preservation.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
test('forward witness rejects a missing seam or altered output',()=>{
  const original=read('./fixtures/body-lecture-links/components__LectureEditor.tsx.raw');
  const transition=JSON.parse(read('./fixtures/body-lecture-links/editor-transition.json'));
  assert.equal(reconstructBodyLectureEditor(original,transition),readAuthenticatedBodyLectureEditor());
  const missing=structuredClone(transition);
  missing.changes[0].before+='unmatched';
  assert.throws(()=>reconstructBodyLectureEditor(original,missing),/Every complete before-context must occur once/);
  const altered=structuredClone(transition);
  altered.changes[5].after+='unreviewed';
  assert.throws(()=>reconstructBodyLectureEditor(original,altered),/exact body-link-era intermediate must be reconstructed/);
});
test('body editor transition preserves the complete prior editor and refuses an unrelated source mutation',()=>{
  const source=readAuthenticatedBodyLectureEditor();
  assert.equal(restorePreBodyLectureEditor(source),read('./fixtures/body-lecture-links/components__LectureEditor.tsx.raw').toString().replaceAll('\r\n','\n'));
  assert.throws(()=>restorePreBodyLectureEditor(source.replace('sameOpeningContext','forgedContext')));
  assert.throws(()=>restorePreBodyLectureEditor(source+'\n'));
  assert.throws(()=>restorePreBodyLectureEditor(read('../components/LectureEditor.tsx').toString()),
    /The body transition is source-bound, never a generic exemption/);
});
test('older save-state proof retains every original assertion through only two declared adapter seams',()=>{
  const original=read('./fixtures/body-lecture-links/lecture-save-preservation.test.mjs.raw');
  const transition=read('./lecture-save-preservation.test.mjs').toString()
    .replace("import {readAuthenticatedBodyLectureEditor,restorePreBodyLectureEditor} from './lecture-body-preservation.mjs';\n",'')
    .replace("let actual=restorePreBodyLectureEditor(readAuthenticatedBodyLectureEditor());","let actual=read('../components/LectureEditor.tsx').toString();");
  assert.equal(transition,original.toString());
  assert.equal(original.includes(Buffer.from('No request, guard, authority or other render body may change')),true);
});
