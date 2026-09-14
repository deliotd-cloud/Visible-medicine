import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url);
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const result = await build({
  stdin: { contents: "export * from './app/study-surface';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle:true, write:false, platform:'node', format:'cjs',
});
const module = { exports:{} };
runInNewContext(result.outputFiles[0].text, { module, exports:module.exports,
  require: id => id === 'next/link' ? () => null : require(id), console, process });
const api = module.exports, h = React.createElement;
const markup = renderToStaticMarkup(h(api.InlineStudy, null,
  h(api.Dialog, {open:true,onOpenChange:()=>{}},
    h(api.DialogContent, {className:'eye-layers-dialog',showCloseButton:false},
      h(api.DialogTitle,null,'Regional dissection'),
      h(api.DialogDescription,null,'Separate source coordinates'),
      h('button',null,'Back to atlas')))));
assert(markup.includes('role="region"'));
assert(!markup.includes('role="dialog"') && !markup.includes('aria-modal'));
assert(markup.includes('data-study-surface="inline"') && markup.includes('tabindex="-1"'));
for (const attr of ['aria-labelledby','aria-describedby']) {
  const id = markup.match(new RegExp(`${attr}="([^"]+)"`))[1];
  assert(markup.includes(`id="${id}"`));
}
assert.equal(renderToStaticMarkup(h(api.InlineStudy,null,h(api.Dialog,{open:false,onOpenChange:()=>{}},'hidden'))),'');
for (const file of ['eye-layers','ventricles','femoral-components','um-limb-study','abdominal-wall-study','back-layers-study','hra-pelvis-study','hra-renal-study']) {
  const source = await readFile(`app/${file}.tsx`,'utf8');
  assert(source.includes("from './study-surface'"),`${file}: contained surface`);
  assert(source.includes('onClose') && source.includes('Back to atlas'),`${file}: explicit return`);
}
const body = (await readFile('app/body-explorer.tsx','utf8')).replaceAll('\r\n','\n');
assert(body.includes('hidden={inlineStudy}') && body.includes('<InlineStudy active={inlineStudy}>'));
assert(body.includes("workspace.mode === 'dissect' && !exam"));
assert(body.includes("modes={['explore', 'dissect']} className=\"atlas-inline-mode\">\n                <div className=\"body-explode\""));
const integrated = await readFile('integration/head-neck/main.tsx','utf8');
assert(integrated.includes('<InlineStudy><Suspense'), 'Direct specimen links must also stay inline');
console.log('Inline dissection: accessible non-modal surface, labelled heading, closed state, all eight study families, scoped mode/quiz guards and direct module links pass.');
