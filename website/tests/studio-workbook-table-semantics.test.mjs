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
const {renderToStaticMarkup} = require('react-dom/server');
const componentPath = process.env.VM_STUDIO_COMPONENT ?? join(root, 'components/StudioWorkbookTable.tsx');
const cssPath = process.env.VM_STUDIO_CSS ?? join(root, 'components/studio-workspace.css');
const source = readFileSync(componentPath, 'utf8');
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
 const result = [];
 function walk(node) {
  if (Array.isArray(node)) { for (const child of node) walk(child); return; }
  if (!React.isValidElement(node)) return;
  if (predicate(node)) result.push(node);
  walk(node.props.children);
 }
 walk(tree);
 return result;
}
const role = value => node => node.props.role === value;
function text(node) {
 if (Array.isArray(node)) return node.map(text).join('');
 return React.isValidElement(node) ? text(node.props.children) : node == null ? '' : String(node);
}
function harness(initialQueue = 'all', componentSource = source) {
 const slots = []; let cursor = 0, tree;
 const hooks = {useMemo: fn => fn(), useRef: initial => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = {current: initial};
  return slots[index];
 }, useState: initial => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
  return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
 }};
 const {StudioWorkbookTable} = compile(componentSource, {
  react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': {__esModule: true, default: Link}, '../lib/studio-queues.ts': queues,
 });
 return {
  render(workbooks) { cursor = 0; tree = StudioWorkbookTable({workbooks, initialQueue}); return renderToStaticMarkup(tree); },
  all(predicate) { return all(tree, predicate); },
  find(predicate) { return all(tree, predicate)[0]; },
 };
}
const draft = {id: 'draft/one ?', title: 'Draft workbook', courseTitle: 'Course one', status: 'draft', mode: 'teaching', version: 3, caseCount: 2};
const published = {id: 'published/β ?#', title: 'Published & <"special">', courseTitle: 'Course two', status: 'published', mode: 'assessment', version: 2, caseCount: 1};
function assertTable(h, workbooks) {
 const tables = h.all(role('table'));
 assert.equal(tables.length, 1);
 const table = tables[0], name = table.props['aria-labelledby'];
 assert.equal(name, 'workbook-list-title');
 assert.equal(text(h.find(node => node.props.id === name)), 'Find a workbook');
 const rows = all(table, role('row'));
 assert.equal(rows.length, workbooks.length + 1);
 assert.equal(rows[0].type, 'header');
 assert.deepEqual(all(rows[0], role('columnheader')).map(text), ['Workbook', 'Course', 'Mode', 'State', 'Cases', 'Action']);
 for (const [index, workbook] of workbooks.entries()) {
  const cells = React.Children.toArray(rows[index + 1].props.children);
  assert.deepEqual(cells.map(cell => cell.props.role), ['rowheader', 'cell', 'cell', 'cell', 'cell', 'cell']);
  assert.equal(text(all(cells[0], node => node.type === 'b')[0]), workbook.title);
  assert.equal(text(cells[1]), workbook.courseTitle);
  assert.equal(text(cells[2]), workbook.mode);
  assert.equal(text(cells[3]), workbook.status + 'v' + workbook.version);
  assert.equal(text(cells[4]), String(workbook.caseCount));
  const actions = all(rows[index + 1], node => node.type === Link);
  assert.equal(actions.length, 2);
  assert.deepEqual(actions.map(link => link.props['aria-label']), [
   'Details for ' + workbook.title, (['draft', 'changes-requested'].includes(workbook.status) ? 'Edit ' : 'Open ') + workbook.title,
  ]);
  assert.deepEqual(actions.map(link => link.props.href), [
   '/studio/workbooks/' + encodeURIComponent(workbook.id), '/studio/workbooks/' + encodeURIComponent(workbook.id) + '/builder',
  ]);
  assert(actions.every(link => link.props.role === undefined), 'Native links must not acquire a cell/grid role');
  assert.equal(cells[5].props.className, 'studio-workbook-action');
  assert.equal(all(cells[5], node => node.type === Link).length, 1);
 }
 assert.equal(h.all(node => ['grid', 'gridcell', 'treegrid'].includes(node.props.role)).length, 0);
 assert.equal(h.all(node => node.props.role === 'table' || node.props.role === 'row' || ['cell', 'rowheader', 'columnheader'].includes(node.props.role)).filter(node => node.props.tabIndex !== undefined).length, 0);
 return table;
}

test('workbook results expose a named static six-column table and native named row links', () => {
 const h = harness(), html = h.render([draft, published]);
 assertTable(h, [draft, published]);
 assert.match(html, /role="table" aria-labelledby="workbook-list-title"/);
 assert.equal((html.match(/role="columnheader"/g) ?? []).length, 6);
 assert.equal((html.match(/role="rowheader"/g) ?? []).length, 2);
 assert.equal((html.match(/role="cell"/g) ?? []).length, 10);
 assert.match(html, /aria-label="Open Published &amp; &lt;&quot;special&quot;&gt;"/);
 assert.match(html, /published%2F%CE%B2%20%3F%23\/builder/);
});

test('filtered-empty keeps a header-only table and adjacent reset; true-empty keeps one course route and no table', () => {
 const h = harness('editing');
 let html = h.render([published]);
 const table = assertTable(h, []);
 assert.equal(all(table, node => node.type === 'button' || node.props.className === 'studio-table-empty').length, 0);
 assert.match(html, /<\/header><\/div><div class="studio-table-empty">/);
 assert.match(html, /0 of 1 workbooks/);
 const reset = h.find(node => node.type === 'button' && node.props.children === 'Show all workbooks');
 assert(reset);
 reset.props.onClick();
 html = h.render([published]);
 assertTable(h, [published]);
 assert.doesNotMatch(html, /Show all workbooks/);
 html = h.render([]);
 assert.equal(h.all(role('table')).length, 0);
 assert.equal(h.all(role('row')).length, 0);
 assert.equal(h.all(node => node.type === Link && node.props.href === '/studio/courses').length, 1);
 assert.doesNotMatch(html, /<input|<select|<header|Show all workbooks/);
 assert.match(html, /0 of 0 workbooks/);
});

test('search and status/mode filters retain table rows and the single polite result status', () => {
 const h = harness(); h.render([draft, published]);
 h.find(node => node.type === 'input').props.onChange({target: {value: 'Course two'}});
 h.render([draft, published]); assertTable(h, [published]);
 h.all(node => node.type === 'select')[1].props.onChange({target: {value: 'teaching'}});
 h.render([draft, published]); assertTable(h, []);
 h.find(node => node.type === 'button' && node.props.children === 'Clear').props.onClick();
 h.render([draft, published]); assertTable(h, [draft, published]);
 h.all(node => node.type === 'select')[0].props.onChange({target: {value: 'editing'}});
 h.render([draft, published]); assertTable(h, [draft]);
 const announcements = h.all(node => node.props.role === 'status' || node.props.role === 'alert' || node.props['aria-live'] !== undefined);
 assert.equal(announcements.length, 1);
 assert.equal(announcements[0].props.role, 'status');
 assert.equal(announcements[0].props['aria-live'], 'polite');
 assert.equal(announcements[0].props['aria-atomic'], 'true');
 assert.equal(text(announcements[0]), '1 of 2 workbooks');
});

test('narrow headers override shared display-none while preserving grid geometry and action alignment', () => {
 const css = readFileSync(cssPath, 'utf8');
 const narrow = css.slice(css.indexOf('@media (max-width: 680px)'));
 const header = narrow.match(/\.studio-workbook-table > header\[role="row"\]\s*\{([^}]+)\}/)?.[1];
 assert(header, 'More-specific header selector must override shared global header hiding');
 for (const declaration of ['position: absolute', 'display: grid', 'width: 1px', 'min-width: 0', 'max-width: 1px', 'height: 1px', 'min-height: 0', 'padding: 0', 'margin: -1px', 'border: 0', 'overflow: hidden', 'clip-path: inset(50%)']) assert(header.includes(declaration), declaration);
 assert.doesNotMatch(header, /display:\s*none|visibility:\s*hidden/);
 assert.match(css, /grid-template-columns: minmax\(190px,1\.25fr\) minmax\(170px,1fr\) \.55fr \.65fr \.35fr 68px/);
 assert.match(narrow, /\.studio-workbook-row\s*\{[^}]*grid-template-columns: 1fr 1fr/);
 assert.match(css, /\.studio-workbook-action\s*\{\s*justify-self: end;/);
 assert.match(narrow, /\.studio-workbook-name,\s*\.studio-workbook-action\s*\{\s*grid-column: 1 \/ -1;/);
 assert.match(narrow, /\.studio-workbook-action\s*\{\s*justify-self: start;/);
 assert.match(narrow, /\.studio-workbook-edit\s*\{[^}]*min-height: 38px;[^}]*display: inline-flex/);
});

test('semantic regressions cannot pass the actual rendered structure checks', () => {
 for (const [before, after] of [
  ['role="table"', 'role="grid"'],
  ['role="rowheader"', 'role="cell"'],
  ['className="studio-workbook-edit"', 'className="studio-workbook-edit" role="cell"'],
 ]) {
  assert.equal(source.split(before).length, 2);
  const h = harness('all', source.replace(before, after));
  h.render([draft]);
  assert.throws(() => assertTable(h, [draft]));
 }
});
