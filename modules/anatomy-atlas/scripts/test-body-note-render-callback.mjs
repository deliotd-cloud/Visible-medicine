import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
const callback = '(value) => { const content = bodyContent(selected, value); return <p>{content.body}</p>; }';
test('selects the direct renderer, not an outer lazy wrapper', () => {
  assert.equal(bodyNoteRenderCallback(`const tree = <Lazy>{({bodyContent}) => <Notes>{${callback}}</Notes>}</Lazy>;`), callback);
});
test('accepts formatting variations through syntax, not substrings', () => {
  const formatted = '(value) => {\nconst content=bodyContent( selected,value );\nreturn content;\n}';
  assert.equal(bodyNoteRenderCallback('const render = ' + formatted), formatted);
});
test('does not select a matching comment or string', () => {
  assert.throws(() => bodyNoteRenderCallback('const fn = (value) => { /* const content = bodyContent(selected, value); */ return "const content = bodyContent(selected, value);"; }'), /Exactly one direct/);
});
test('refuses absent, indirect and wrongly bound renderers', () => {
  for (const source of [
    '() => <div />;',
    '(value) => { if (value) { const content = bodyContent(selected, value); } }',
    callback.replace('(value)', '(other)'),
    callback.replace('bodyContent(selected, value)', 'bodyContent(foreign, value)'),
    callback.replace('bodyContent(selected, value)', 'foreign.bodyContent(selected, value)'),
  ]) assert.throws(() => bodyNoteRenderCallback('const render = ' + source), /Exactly one direct/);
});
test('refuses duplicate actual renderers', () => {
  assert.throws(() => bodyNoteRenderCallback(`const first = ${callback}; const second = ${callback};`), /Exactly one direct/);
});
test('refuses malformed source and non-text input', () => {
  assert.throws(() => bodyNoteRenderCallback('const tree = <div>'), /must parse/);
  assert.throws(() => bodyNoteRenderCallback(null), /must be text/);
});
test('selects the current application renderer without changing its body', () => {
  const source = readFileSync(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
  const selected = bodyNoteRenderCallback(source);
  assert.match(selected, /^\(value\) => \{/);
  assert.match(selected, /const content = bodyContent\(selected, value\);/);
  assert.match(selected, /<SourceDisplayNotes/);
  assert.match(selected, /<ComponentImagingNotes/);
  assert(source.includes(selected));
});
