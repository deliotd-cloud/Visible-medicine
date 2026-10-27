import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Current frozen cf587b application inputs. The tests keep their synthetic
// transport and hook hosts, but these two recovery modules are real source.
const expected = new Map([
  ['lib/studio-release-predecessor.ts','81ad1864b985c49392f625ff744b01bfacc93cb8052736a73c6560e83cc9418c'],
  ['components/StudioForms.tsx','9f051715815031499a37a89c95c24139a0fdc82f8d34263c128e69a971ecd543'],
  ['components/StudioCourseEditor.tsx','62a6c880bdc7d4ec35393d8dbc580022176b17f5e7a1dc913da39b325c6dc6a0'],
  ['lib/studio-draft-scope.ts','fbe17a0bfd8a7e3842c6fdaa7a505aff71774fca6be3d67f451c47cef90f8591'],
  ['lib/studio-session-drafts.ts','d67fd4c7432fcd10c4591638b3d5b9ed3ccf9c3e020dc2b0e0643cb42eaede83'],
  ['lib/studio-release-note-recovery.ts','aaf325d9eb204a9971c9bb59d7fc1407b21b70863d7412136893b234f354c1e8'],
]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function exact(sourceRoot, relative) {
  const bound = expected.get(relative);
  assert.ok(bound, `Unbound Studio source: ${relative}`);
  const bytes = readFileSync(new URL(relative, sourceRoot));
  assert.equal(digest(bytes), bound, `Studio source drift: ${relative}`);
  return bytes.toString('utf8');
}
export function loadStudioDraftDependencies(sourceRoot, ts) {
  exact(sourceRoot, 'components/StudioForms.tsx');
  exact(sourceRoot, 'components/StudioCourseEditor.tsx');
  exact(sourceRoot, 'lib/studio-draft-scope.ts');
  const load = relative => {
    const source = exact(sourceRoot, relative);
    const code = ts.transpileModule(source, {compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    }}).outputText;
    const module = {exports: {}};
    new Function('require','module','exports',code)(name => {
      throw new Error(`Unexpected real Studio dependency import from ${relative}: ${name}`);
    }, module, module.exports);
    exact(sourceRoot, relative); // Refuse a file changed during transpilation.
    return module.exports;
  };
  const dependencies = {
    '../lib/studio-release-predecessor.ts': load('lib/studio-release-predecessor.ts'),
    '../lib/studio-session-drafts.ts': load('lib/studio-session-drafts.ts'),
    '../lib/studio-release-note-recovery.ts': load('lib/studio-release-note-recovery.ts'),
  };
  exact(sourceRoot, 'components/StudioForms.tsx');
  exact(sourceRoot, 'components/StudioCourseEditor.tsx');
  exact(sourceRoot, 'lib/studio-draft-scope.ts');
  return Object.freeze(dependencies);
}
