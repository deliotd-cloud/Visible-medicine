import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.env.VM_WEBSITE_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(process.env.VM_WEBSITE_PACKAGE ?? import.meta.url);
const ts = require('typescript');
const React = require('react');
const source = readFileSync(process.env.VM_STUDIO_COMPONENT ?? join(root, 'components/StudioWorkbookTable.tsx'), 'utf8');

function compile(text, imports) {
 const code = ts.transpileModule(text, {compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
 }}).outputText;
 const mod = {exports: {}};
 new Function('require', 'module', 'exports', code)(name => {
  assert(Object.hasOwn(imports, name), 'Unexpected dependency: ' + name);
  return imports[name];
 }, mod, mod.exports);
 return mod.exports;
}
const queues = compile(readFileSync(join(root, 'lib/studio-queues.ts'), 'utf8'), {});
const Link = ({children, href, ...props}) => React.createElement('a', {href, ...props}, children);
function all(tree, predicate) {
 const found = [];
 function visit(node) {
  if (Array.isArray(node)) { node.forEach(visit); return; }
  if (!React.isValidElement(node)) return;
  if (predicate(node)) found.push(node);
  visit(node.props.children);
 }
 visit(tree);
 return found;
}
function text(node) {
 if (Array.isArray(node)) return node.map(text).join('');
 return React.isValidElement(node) ? text(node.props.children) : node == null ? '' : String(node);
}
function harness() {
 const slots = []; let cursor = 0, tree;
 const hooks = {useMemo: fn => fn(), useState: initial => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
  return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
 }, useRef: initial => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = {current: initial};
  return slots[index];
 }};
 const {StudioWorkbookTable} = compile(source, {
  react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': {__esModule: true, default: Link}, '../lib/studio-queues.ts': queues,
 });
 return {
  render(workbooks) { cursor = 0; tree = StudioWorkbookTable({workbooks}); },
  all(predicate) { return all(tree, predicate); },
  find(predicate) { return all(tree, predicate)[0]; },
  rows() { return all(tree, node => node.props.className === 'studio-workbook-row'); },
  titles() { return this.rows().map(row => text(all(row, node => node.type === 'b')[0])); },
  button(label) { return this.find(node => node.type === 'button' && text(node) === label); },
  status() { return this.find(node => node.props.role === 'status'); },
 };
}
const workbooks = Array.from({length: 29}, (_, index) => ({
 id: `workbook/${index + 1} ?#`, title: `Workbook ${index + 1}`, courseTitle: `Course ${index + 1}`,
 status: index % 2 ? 'published' : 'draft', mode: index % 2 ? 'assessment' : 'teaching',
 version: index + 1, caseCount: index,
}));
const expectedTitles = workbooks.map(workbook => workbook.title);

test('29 ordered rows traverse in 12, 12, 5 with no duplicates and exact native row links', () => {
 const h = harness(), seen = [];
 for (const [page, count] of [[1, 12], [2, 12], [3, 5]]) {
  h.render(workbooks);
  const rows = h.rows();
  assert.equal(rows.length, count);
  seen.push(...h.titles());
  const status = h.status();
  assert.equal(status.props['aria-live'], 'polite');
  assert.equal(status.props['aria-atomic'], 'true');
  assert.equal(text(status), `29 of 29 workbooks · Showing ${(page - 1) * 12 + 1}–${(page - 1) * 12 + count} · Page ${page} of 3`);
  assert.equal(h.all(node => node.props.role === 'status').length, 1);
  assert.equal(h.all(node => node.type === 'nav' && node.props['aria-label'] === 'Workbook pages').length, 1);
  assert.equal(h.button('Previous').props.disabled, page === 1);
  assert.equal(h.button('Next').props.disabled, page === 3);
  for (let index = 0; index < rows.length; index++) {
   const workbook = workbooks[(page - 1) * 12 + index];
   const cells = React.Children.toArray(rows[index].props.children);
   assert.deepEqual(cells.map(cell => cell.props.role), ['rowheader', 'cell', 'cell', 'cell', 'cell', 'cell']);
   assert.equal(text(cells[3]), `${workbook.status}v${workbook.version}`);
   const links = all(rows[index], node => node.type === Link);
   assert.deepEqual(links.map(link => link.props.href), [
    `/studio/workbooks/${encodeURIComponent(workbook.id)}`,
    `/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`,
   ]);
   assert.deepEqual(links.map(link => link.props['aria-label']), [
    `Details for ${workbook.title}`,
    `${workbook.status === 'draft' ? 'Edit' : 'Open'} ${workbook.title}`,
   ]);
  }
  if (page < 3) h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 }
 assert.deepEqual(seen, expectedTitles);
 h.button('Previous').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(12, 24));
});

test('filters inspect the full list before slicing and explicit changes reset to the first page', () => {
 const h = harness(); h.render(workbooks);
 h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(24));
 h.find(node => node.type === 'input').props.onChange({target: {value: 'Workbook 29'}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), ['Workbook 29']);
 assert.equal(text(h.status()), '1 of 29 workbooks');
 assert.equal(h.button('Next'), undefined);
 h.find(node => node.type === 'input').props.onChange({target: {value: ''}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(0, 12));
 h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 h.all(node => node.type === 'select')[0].props.onChange({target: {value: 'published'}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), workbooks.filter(w => w.status === 'published').slice(0, 12).map(w => w.title));
 h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 h.all(node => node.type === 'select')[1].props.onChange({target: {value: 'teaching'}});
 h.render(workbooks);
 assert.deepEqual(h.titles(), []);
 h.button('Show all workbooks').props.onClick();
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(0, 12));
 h.button('Next').props.onClick({currentTarget: {ownerDocument: {activeElement: null}}});
 h.render(workbooks);
 h.button('Clear').props.onClick();
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(0, 12));
});

test('a replacement source resets the page and never carries pending pager focus', () => {
 const h = harness(); h.render(workbooks);
 const document = {body: {}, activeElement: null};
 const button = {ownerDocument: document, disabled: false}; document.activeElement = button;
 h.button('Next').props.onClick({currentTarget: button});
 h.render(workbooks);
 assert.deepEqual(h.titles(), expectedTitles.slice(12, 24));
 const replacement = [...workbooks].reverse();
 h.render(replacement);
 assert.deepEqual(h.titles(), replacement.slice(0, 12).map(w => w.title));
 let calls = 0;
 h.status().props.ref({focus() { calls++; }});
 assert.equal(calls, 0);
});

test('pager focus returns to the single result status only for the initiating action', () => {
 const h = harness(); h.render(workbooks);
 const document = {body: {}, activeElement: null};
 const button = {ownerDocument: document, disabled: false};
 const focusOptions = [];
 const result = {focus(options) { focusOptions.push(options); }};
 document.activeElement = button;
 h.button('Next').props.onClick({currentTarget: button});
 h.render(workbooks);
 h.status().props.ref(result);
 assert.deepEqual(focusOptions, [{preventScroll: true}]);
 h.status().props.ref(result);
 assert.equal(focusOptions.length, 1);
 document.activeElement = {};
 h.button('Next').props.onClick({currentTarget: button});
 h.render(workbooks);
 h.status().props.ref(result);
 assert.equal(focusOptions.length, 1);
 h.button('Previous').props.onClick({currentTarget: button});
 h.render(workbooks);
 h.status().props.ref(result);
 document.activeElement = button;
 h.button('Next').props.onClick({currentTarget: button});
 h.render(workbooks);
 button.disabled = true; document.activeElement = document.body;
 h.status().props.ref(result);
 assert.deepEqual(focusOptions, [{preventScroll: true}, {preventScroll: true}]);
 h.render(workbooks);
 h.status().props.ref(result);
 assert.equal(focusOptions.length, 2, 'background render must not focus');
});
