import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const built = await build({
  stdin: {
    contents: "export { PracticeKeyboardPicker } from './app/practice-keyboard-picker';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const module = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
});
const { PracticeKeyboardPicker } = module.exports;

const nodes = value => !value || typeof value !== 'object' ? []
  : Array.isArray(value) ? value.flatMap(nodes)
  : [value, ...nodes(value.props?.children)];
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value)
  : !value ? '' : Array.isArray(value) ? value.map(text).join('') : text(value.props?.children);

const ids = Object.freeze(['private-target-A', 'private-target-B', 'private-target-C']);
const previews = [], answers = [];
const props = {
  ids,
  activeId: null,
  disabled: false,
  onPreview: id => previews.push(id),
  onAnswer: id => answers.push(id),
};
const tree = () => PracticeKeyboardPicker(props);
const button = (rendered, label) => {
  const found = nodes(rendered).find(node => node.props?.onClick && text(node) === label);
  assert(found, `Missing ${label}`);
  return found.props;
};
const status = rendered => nodes(rendered).find(node => node.props?.role === 'status');
const toggle = (rendered, open) => {
  const details = nodes(rendered).find(node => node.type === 'details');
  const currentTarget = { open };
  details.props.onToggle({ currentTarget, target: currentTarget });
};

let rendered = tree();
assert.equal(text(status(rendered)), 'No structure highlighted yet.');
assert.equal(button(rendered, 'Choose highlighted').disabled, true);
assert.equal(answers.length, 0);
button(rendered, 'Choose highlighted').onClick();
assert.equal(answers.length, 0, 'Forced empty choice is inert');
toggle(rendered, true);
assert.deepEqual(previews, [], 'Opening does not preselect');

// Server rendering exercises the production Button rather than a button stub.
const html = renderToStaticMarkup(React.createElement(PracticeKeyboardPicker, props));
assert.match(html, /<details\b/);
assert.match(html, /<summary>Keyboard selection<\/summary>/);
assert.equal((html.match(/<button\b/g) ?? []).length, 3, 'Native buttons are keyboard-operable');
assert.match(html, /<button[^>]*type="button"/);
assert.match(html, /Choose highlighted<\/button>/);
for (const id of ids) assert(!html.includes(id), 'No target ID leaks into text or aria');

button(rendered, 'Next structure').onClick();
assert.deepEqual(previews, [ids[0]], 'Next starts at first eligible scene target');
assert.deepEqual(answers, [], 'Preview does not answer');
props.activeId = ids[0]; rendered = tree();
assert.equal(text(status(rendered)), 'Structure 1 of 3');
button(rendered, 'Previous structure').onClick();
assert.equal(previews.at(-1), ids[2], 'Previous wraps to last');
props.activeId = ids[2]; rendered = tree();
button(rendered, 'Next structure').onClick();
assert.equal(previews.at(-1), ids[0], 'Next wraps to first');
button(rendered, 'Choose highlighted').onClick();
assert.deepEqual(answers, [ids[2]], 'Answer uses highlighted target, never question order');

props.activeId = 'removed-target'; rendered = tree();
assert.equal(text(status(rendered)), 'No structure highlighted yet.');
assert.equal(button(rendered, 'Choose highlighted').disabled, true);
button(rendered, 'Choose highlighted').onClick();
assert.deepEqual(answers, [ids[2]], 'Removed target cannot answer');
button(rendered, 'Previous structure').onClick();
assert.equal(previews.at(-1), ids[2], 'Missing target uses unselected boundary');
toggle(rendered, false);
assert.equal(previews.at(-1), null, 'Closing clears preview');
const beforeNested = previews.length;
const details = nodes(rendered).find(node => node.type === 'details');
details.props.onToggle({ currentTarget: { open: false }, target: {} });
assert.equal(previews.length, beforeNested, 'Nested toggles do not clear');

props.activeId = ids[1]; props.disabled = true; rendered = tree();
assert.equal(button(rendered, 'Previous structure').disabled, true);
assert.equal(button(rendered, 'Next structure').disabled, true);
assert.equal(button(rendered, 'Choose highlighted').disabled, true);
const previewCount = previews.length, answerCount = answers.length;
for (const label of ['Previous structure', 'Next structure', 'Choose highlighted'])
  button(rendered, label).onClick();
assert.equal(previews.length, previewCount, 'Forced callbacks remain blocked while disabled');
assert.equal(answers.length, answerCount);
toggle(rendered, false);
assert.equal(previews.length, previewCount + 1, 'Closing while disabled still clears the cursor');
assert.equal(previews.at(-1), null);

props.disabled = false; props.ids = Object.freeze([]); rendered = tree();
assert.equal(text(status(rendered)), 'No visible structures to choose.');
assert.equal(button(rendered, 'Previous structure').disabled, true);
assert.equal(button(rendered, 'Next structure').disabled, true);
button(rendered, 'Next structure').onClick();
button(rendered, 'Choose highlighted').onClick();
assert.equal(previews.length, previewCount + 1);
assert.equal(answers.length, answerCount);

console.log(JSON.stringify({ nativeButtons: 3, unnamed: true, wrap: true, removedChoice: true, blockedCallbacks: true, closeClears: true }));
