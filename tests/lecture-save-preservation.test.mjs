import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePreBodyLectureEditor} from './lecture-body-preservation.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function replaceOnce(text,before,after){assert.equal(text.split(before).length,2,before);return text.replace(before,after);}

test('whole lecture source preserves every mutation, validation and navigation statement outside three presentation seams',()=>{
 const original=read('./fixtures/lecture-save-original.tsx.raw');
 assert.equal(sha(original),'e6a8e3b1d4952e2930f9472e02c42d04c7542830791c86e936839e1fc3183c55');
 let actual=restorePreBodyLectureEditor(read('../components/LectureEditor.tsx').toString());
 actual=replaceOnce(actual,'{savePresentation.label}{contextBlocked && dirty && <> · <span role="status">Unsaved changes</span></>}','{savePresentation.label}');
 actual=replaceOnce(actual,'import { lectureSavePresentation } from "./lecture-save-presentation";\n','');
 actual=replaceOnce(actual,"  const savePresentation = lectureSavePresentation({\n    busy,\n    contextReason: contextHold?.reason ?? (contextBlocked ? 'changed' : null),\n    uncertain: contextHold?.uncertain ?? false,\n    dirty,\n    readOnly,\n    validDraft,\n    savedVersion: view.version,\n  });\n",'');
 actual=replaceOnce(actual,'      <div className="lecture-save-state" data-save-state={savePresentation.state}><span role={contextBlocked ? undefined : "status"}>{savePresentation.label}</span><small id="lecture-save-detail">{savePresentation.detail}</small></div>\n','      <span role="status">{dirty ? "Unsaved changes" : `Saved version ${view.version}`}</span>\n');
 actual=replaceOnce(actual,'className="lecture-primary-action" aria-describedby="lecture-save-detail"','className="lecture-primary-action"');
 assert.equal(actual,original.toString(),'No request, guard, authority or other render body may change');
 assert.notEqual(actual+'\n',original.toString());
});

test('context harness retains every original assertion plus declared helper loading and new presentation assertions',()=>{
 const original=read('./fixtures/lecture-save-context-original.mjs.raw');
 assert.equal(sha(original),'abfa40d8b128a278c3dfc7870d7fee700b2403990065f62755ec1b600c2accf8');
 let actual=read('./lecture-context-editor.test.mjs').toString();
 const helper="const helperCode=ts.transpileModule(readFileSync(new URL('../components/lecture-save-presentation.ts',import.meta.url),'utf8'),{fileName:'lecture-save-presentation.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;\nconst helperModule={exports:{}};new Function('module','exports',helperCode)(helperModule,helperModule.exports);\n";
 actual=replaceOnce(actual,helper,'');
 actual=replaceOnce(actual,"name==='./lecture-save-presentation'?helperModule.exports:",'');
 for(const added of [
  '  assert.match(h.text(),/Publishing is a separate action/);\n',
  '  assert.equal(h.button(\'Save\').props[\'aria-describedby\'],\'lecture-save-detail\');\n',
  '  assert.match(h.text(),/Studio context unavailable/);\n',
  "   assert.equal(words(h.find(node=>node.props['data-save-state']==='uncertain')).includes('Save not confirmed'),true);\n",
  '  assert.match(h.text(),/Unsaved changes/);assert.doesNotMatch(h.text(),/Saved version 5/);\n',
 ])actual=replaceOnce(actual,added,'');
 assert.equal(actual,original.toString(),'Only helper loading and additional assertions may change');
});

test('CSS changes only the existing save-state presentation and keeps responsive toolbar rules',()=>{
 const original=read('./fixtures/lecture-save-original.css.raw');
 assert.equal(sha(original),'95e83298a41029cc2c288653b495ceeeab812edee022a77aef328b0f701edab0');
 let expected=original.toString();
 expected=replaceOnce(expected,'.lecture-editor-toolbar > span { margin-left: auto; color: var(--muted); font-size: 12px; }','.lecture-save-state { min-width: 0; max-width: 330px; margin-left: auto; display: grid; gap: 2px; color: #385557; font-size: 12px; line-height: 1.3; }\n.lecture-save-state > span { font-weight: 700; }\n.lecture-save-state > small { color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }\n.lecture-save-state[data-save-state="uncertain"], .lecture-save-state[data-save-state="context"] { color: #8d3939; }');
 expected=replaceOnce(expected,'  .lecture-editor-toolbar > span { grid-column: 1 / -1; grid-row: 2; margin: 0; padding: 1px 3px; }','  .lecture-save-state { grid-column: 1 / -1; grid-row: 2; max-width: none; margin: 0; padding: 1px 3px; }');
 assert.equal(read('../components/lecture-editor.css').toString(),expected);
});
