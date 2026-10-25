import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const stageRoot = fileURLToPath(new URL('../', import.meta.url));
const websiteRoot = resolve(process.env.VM_WEBSITE_ROOT || '.');
const candidate = resolve(process.env.VM_STUDIO_COMPONENT || join(stageRoot, 'components/StudioCourseEditor.tsx'));
const ts = createRequire(join(websiteRoot, 'package.json'))('typescript');
const source = readFileSync(candidate, 'utf8');

function outline() {
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: { useRef: initial => ({current: initial}), useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect: () => {} },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': { default: 'a' },
    'next/navigation': { useSearchParams: () => null },
    './StudioForms': { CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate',
      EditCourseDetailsForm: 'details', ReleaseDraftForm: 'release' },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    assert(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const workbooks = [
    { id: 'first/item', courseId: 'one', title: 'Shoulder anatomy', mode: 'lecture', status: 'draft', caseCount: 0 },
    { id: 'second?item', courseId: 'one', title: 'Knee assessment', mode: 'assessment', status: 'draft', caseCount: 2 },
  ];
  const tree = module.exports.StudioCourseEditor({ course: { id: 'one' }, workbooks,
    releases: [], recoveryScope: { actorId: 'synthetic', organizationId: 'synthetic' } });
  const all = node => Array.isArray(node) ? node.flatMap(all) : node?.props ? [node, ...all(node.props.children)] : [];
  return all(tree).find(node => node.type === 'ul' && node.props.className === 'course-outline');
}

test('keyboard focus on repeated Details links announces each workbook', () => {
  const items = outline().props.children;
  assert.equal(items.length, 2);
  for (const [index, title, href] of [
    [0, 'Shoulder anatomy', '/studio/workbooks/first%2Fitem'],
    [1, 'Knee assessment', '/studio/workbooks/second%3Fitem'],
  ]) {
    const links = items[index].props.children.filter(node => node.type === 'a');
    assert.equal(links.length, 2, 'existing edit and details destinations remain separate');
    assert.equal(links[0].props.href, `${href}/builder`);
    assert.equal(links[1].props.href, href);
    assert.equal(links[1].props.children, 'Details', 'visible action stays compact');
    assert.equal(links[1].props['aria-label'], `Details for ${title}`);
  }
});
