import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {restorePreBodyLectureEditor} from './lecture-body-preservation.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
test('body editor transition preserves the complete prior editor and refuses an unrelated source mutation',()=>{
  const source=read('../components/LectureEditor.tsx').toString();
  assert.equal(restorePreBodyLectureEditor(source),read('./fixtures/body-lecture-links/components__LectureEditor.tsx.raw').toString().replaceAll('\r\n','\n'));
  assert.throws(()=>restorePreBodyLectureEditor(source.replace('sameOpeningContext','forgedContext')));
  assert.throws(()=>restorePreBodyLectureEditor(source+'\n'));
});
test('older save-state proof retains every original assertion through only two declared adapter seams',()=>{
  const original=read('./fixtures/body-lecture-links/lecture-save-preservation.test.mjs.raw');
  const transition=read('./lecture-save-preservation.test.mjs').toString()
    .replace("import {restorePreBodyLectureEditor} from './lecture-body-preservation.mjs';\n",'')
    .replace("let actual=restorePreBodyLectureEditor(read('../components/LectureEditor.tsx').toString());","let actual=read('../components/LectureEditor.tsx').toString();");
  assert.equal(transition,original.toString());
  assert.equal(original.includes(Buffer.from('No request, guard, authority or other render body may change')),true);
});
