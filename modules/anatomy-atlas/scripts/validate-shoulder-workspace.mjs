import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';
import { structures } from '../app/anatomy-data.ts';
import { atlasPanelLayout } from '../lib/atlas-panel-layout.ts';

let checks = 0,
  markupCases = 0,
  handlerCases = 0;
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const same = (actual, expected, message) => {
  checks++;
  assert.deepEqual(actual, expected, message);
};
const source = (await fs.readFile('app/shoulder-explorer.tsx', 'utf8')).replace(
  /\r\n/g,
  '\n',
);
const require = createRequire(import.meta.url),
  React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const escape = (value) => renderToStaticMarkup(value);
const output = await build({
  entryPoints: ['app/shoulder-explorer.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  plugins: [
    {
      name: 'shoulder-entry-fixtures',
      setup(api) {
        api.onLoad({ filter: /shoulder-explorer\.tsx$/ }, () => ({
          loader: 'tsx',
          contents: source
            .replace(
              "useState<Mode>('study')",
              'useState<Mode>(globalThis.__exam ? "exam" : "study")',
            )
            .replace(
              "useState<RendererHealth>('starting')",
              'useState<RendererHealth>(globalThis.__ready ? "ready" : "starting")',
            )
            .replace(
              'const [modelReady, setModelReady] = useState(false)',
              'const [modelReady, setModelReady] = useState(globalThis.__ready)',
            )
            .replace(
              'useState(initialInspection)',
              'useState(globalThis.__inspection ?? initialInspection)',
            ),
        }));
        api.onLoad({ filter: /atlas-workspace\.tsx$/ }, async () => ({
          loader: 'tsx',
          contents: (await fs.readFile('app/atlas-workspace.tsx', 'utf8'))
            .replace(
              "useState<WorkspaceMode>('explore')",
              'useState<WorkspaceMode>(globalThis.__mode)',
            )
            .replace(
              '[focusView, setFocusView] = useState(false)',
              '[focusView, setFocusView] = useState(globalThis.__focus)',
            )
            .replace(
              'defaultValue="anatomy"',
              'defaultValue={globalThis.__group}',
            )
            .replace(
              'defaultValue={group.sections[0][0]}',
              'defaultValue={group.sections.some(([id]) => id === globalThis.__tab) ? globalThis.__tab : group.sections[0][0]}',
            ),
        }));
      },
    },
  ],
});
const vmModule = { exports: {} };
const context = {
  module: vmModule,
  exports: vmModule.exports,
  console,
  URLSearchParams,
  process: { env: { NODE_ENV: 'test' } },
  __mode: 'explore',
  __exam: false,
  __ready: true,
  __focus: false,
  __group: 'anatomy',
  __tab: 'anatomy',
  require: (id) =>
    id === 'next/link'
      ? ({ children, href, ...props }) =>
          React.createElement('a', { href, ...props }, children)
      : id === 'next/image'
        ? ({
            priority: _priority,
            unoptimized: _unoptimized,
            fill: _fill,
            ...props
          }) => React.createElement('img', props)
        : id === 'next/dynamic'
          ? () => (props) => {
              context.scene = props;
              return React.createElement('div', {
                'data-shoulder-scene-double': true,
              });
            }
          : require(id),
};
runInNewContext(output.outputFiles[0].text, context);
const render = (selected = structures[0], props = {}) => {
  markupCases++;
  return renderToStaticMarkup(
    React.createElement(vmModule.exports.default, {
      initialSelectedId: selected.id,
      ...props,
    }),
  );
};
const groups = {
  anatomy: ['anatomy', 'function'],
  clinical: ['clinical', 'pathology'],
  imaging: ['ct', 'mri', 'xray', 'ultrasound'],
};
for (const selected of structures) {
  for (const mode of ['explore', 'dissect', 'practice']) {
    context.__mode = mode;
    const html = render(selected);
    check(html.includes('class="body-app shoulder-workspace"'));
    check(html.includes(`data-workspace-mode="${mode}"`));
    check(html.includes('aria-label="Workspace mode"'));
    // Zoom must remain outside the canvas/label overlay in every workspace mode.
    const headingStart = html.indexOf('class="shoulder-model-heading"');
    const zoomStart = html.indexOf('class="shoulder-zoom-controls"');
    const viewControlsStart = html.indexOf('class="shoulder-view-controls"');
    check(headingStart >= 0 && zoomStart > headingStart && zoomStart < viewControlsStart,
      `${mode}: zoom controls belong in the heading, not over anatomy labels`);
    check(html.includes('aria-label="Shoulder zoom controls"') && !html.includes('class="zoom-controls"'),
      `${mode}: one named external zoom group and no legacy floating controls`);
    const railStart = html.indexOf(
      '<aside class="body-rail anatomy-control-rail"',
    );
    const modelStart = html.indexOf(
      'class="shoulder-model-workspace body-workspace"',
    );
    const infoStart = html.indexOf('<aside class="body-info"');
    check(railStart >= 0 && railStart < modelStart && modelStart < infoStart);
    const rail = html.slice(railStart, modelStart),
      model = html.slice(modelStart, infoStart),
      info = html.slice(infoStart);
    same((model.match(/data-shoulder-scene-double/g) || []).length, 1);
    for (const text of [
      'Search name or landmark',
      'Structures · ',
      'Inspect deeper',
      'Saved views &amp; imaging link',
      'Illustration plates',
      'Review workspace',
    ])
      check(rail.includes(text), text);
    check(!model.includes('vm-inspection'));
    check(!model.includes('dissection-controls'));
    check(model.includes('aria-label="Shoulder camera view"'));
    check(model.includes('aria-label="Shoulder dissection layer"'));
    check(model.includes('Explode style'));
    check(
      model.indexOf('</section>') < model.indexOf('class="viewer-toolbar"'),
      'Toolbar is outside scene bounds',
    );
    check(model.includes('CC BY 4.0'));
    check(info.includes(escape(selected.name)));
    check(info.includes('Start identification exam'));
    check(
      !info.includes('Start identification exam</button>') ||
        !info.includes('disabled=""'),
      'Ready start remains available',
    );
    same(context.scene.selectedId, selected.id);
    same(context.scene.structures.length, 9);
    same(context.scene.exam, false);
    same(context.scene.layout, 'spatial');
    same(context.scene.explode, 0);
    same(context.scene.inspection.plane, 'off');
    const gates = [
      ...rail.matchAll(/class="atlas-mode-panel "( hidden="")?/g),
    ].map((m) => Boolean(m[1]));
    same(gates, [mode !== 'dissect', mode === 'practice', mode !== 'dissect']);
  }
  context.__mode = 'explore';
  for (const [group, tabs] of Object.entries(groups))
    for (const tab of tabs) {
      context.__group = group;
      context.__tab = tab;
      const html = render(selected);
      check(
        html.includes(escape(selected.sections[tab].body)),
        selected.id + '/' + tab,
      );
      for (const bullet of selected.sections[tab].bullets || [])
        check(html.includes(escape(bullet)));
      if (selected.sections[tab].note)
        check(html.includes(escape(selected.sections[tab].note)));
      if (group === 'imaging')
        check(html.includes('study loaded'), 'No invented scan');
    }
}
context.__exam = true;
// Actual entry integration: the compact notice is driven by the model's inspection state.
context.__exam = false;
context.__mode = 'explore';
context.__inspection = {
  plane: 'off',
  position: 50,
  flipped: false,
  opacity: { muscles: 5 },
  keepSelectedSolid: false,
};
const muscle = structures.find((s) => s.system === 'muscles');
check(render(muscle).includes('Too transparent to select on the model'));
context.__inspection = {
  ...context.__inspection,
  plane: 'axial',
  keepSelectedSolid: true,
  keepSelectedUncut: true,
};
check(render(muscle).includes('Selected structure kept uncut'));
context.__exam = true;
check(!render(muscle).includes('vm-selection-visibility'));
context.__inspection = undefined;
for (const ready of [false, true]) {
  context.__ready = ready;
  const html = render();
  check(html.includes('Exit exam'));
  check(html.includes('data-workspace-mode="practice"'));
  check(html.includes('Choose on the model'));
  same(context.scene.exam, true);
  same(context.scene.layout, 'spatial');
  same(context.scene.showLabels, false);
  same(context.scene.isolated, false);
  same(context.scene.inspection.plane, 'off');
  same(html.includes('Practice paused'), !ready);
  for (const label of [
    'Toggle labels',
    'Isolate selected structure',
    'Shoulder dissection layer',
    'Explode style',
  ]) {
    const buttons = html.match(/<button\b[^>]*>/g) || [];
    const button = buttons.find((tag) => tag.includes(`aria-label="${label}"`));
    check(button?.includes('disabled=""'), label + ' guarded during exam');
  }
}
context.__exam = false;
context.__mode = 'practice';
context.__ready = false;
check(render().includes('Practice is available once the 3D model is ready.'));
context.__focus = true;
const focused = render();
check(focused.includes('body-controls-launcher'));
check(focused.includes('body-info-launcher'));
check(
  !focused.includes('<aside'),
  'Focus replaces rails rather than duplicating them',
);
check(focused.includes('data-shoulder-scene-double'));

// Exercise the actual two menu closures, without rewriting their behavior.
const ast = ts.createSourceFile(
  'shoulder.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const printer = ts.createPrinter();
const closures = {};
function visit(node) {
  if (
    ts.isJsxElement(node) &&
    node.openingElement.tagName.getText(ast) === 'Select'
  ) {
    const text = node.getText(ast);
    const name = text.includes('Shoulder camera view')
      ? 'camera'
      : text.includes('Shoulder dissection layer')
        ? 'layer'
        : null;
    if (name)
      closures[name] = node.openingElement.attributes.properties.find(
        (attr) => attr.name?.getText(ast) === 'onValueChange',
      ).initializer.expression;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
same(Object.keys(closures).sort(), ['camera', 'layer']);
for (const [name, closure] of Object.entries(closures)) {
  const code = ts.transpileModule(
    'var callback = ' +
      printer.printNode(ts.EmitHint.Unspecified, closure, ast),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  for (const mode of ['study', 'exam'])
    for (const selected of structures)
      for (const value of [
        'posterior',
        'anterior',
        'lateral',
        'cuff',
        'surface',
        'bones',
        null,
        'invalid',
      ]) {
        const calls = [];
        const scope = {
          mode,
          selectedId: selected.id,
          structures,
          setView: (v) => calls.push(['view', v]),
          setResetNonce: (fn) => calls.push(['reset', fn(7)]),
          setLayer: (v) => calls.push(['layer', v]),
          setSelectedId: (v) => calls.push(['select', v]),
        };
        runInNewContext(code, scope);
        scope.callback(value);
        if (
          name === 'camera' &&
          ['posterior', 'anterior', 'lateral'].includes(value)
        )
          same(calls, [
            ['view', value],
            ['reset', 8],
          ]);
        else if (
          name === 'layer' &&
          mode === 'study' &&
          ['cuff', 'surface', 'bones'].includes(value)
        ) {
          const expected = [['layer', value]];
          if (
            value === 'bones' ||
            (value === 'cuff' &&
              ['deltoid', 'biceps-long-head'].includes(
                selected.id.split(':').at(-1),
              ))
          )
            expected.push(['select', structures[0].id]);
          same(calls, expected);
        } else same(calls, [], 'Invalid or exam-locked layer is a no-op');
        handlerCases++;
      }
}
const css = await fs.readFile('app/shoulder-workspace.css', 'utf8');
for (const rule of [
  '@media (max-width: 700px)',
  '@media (max-height: 700px)',
  '@media (pointer: coarse)',
  'overflow-y: auto',
  'flex: 1 0 260px',
  'position: static',
  'font-size: 0.875rem',
])
  check(css.includes(rule), rule);
const manifest = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/manifest.json'),
);
same(
  createHash('sha256')
    .update(await fs.readFile('public/models/bodyparts3d/shoulder-right.glb'))
    .digest('hex'),
  manifest.sha256,
);
for (const [w,h,expected] of [
  [1400,900,{tools:false,info:false,short:false}],
  [1100,700,{tools:true,info:false,short:false}],
  [700,699,{tools:true,info:true,short:true}],
  [0,800,{tools:true,info:true,short:true}],
  [NaN,800,{tools:true,info:true,short:true}],
]) same(atlasPanelLayout(w,h),expected);
context.__mode = 'explore'; context.__exam = false; context.__focus = false;
const panel = render(structures[0], {presentation:'panel', connectedReviews:false, assetBase:'/atlas-runtime/shoulder'});
check(panel.includes('<section aria-label="3D anatomy module"'));
check(!panel.includes('<main') && !panel.includes('<h1'));
check(!panel.includes('Whole body &amp; regions'));
check(panel.includes('CC BY 4.0') && panel.includes('/atlas-runtime/shoulder/models/bodyparts3d/credits.html'));
check(panel.includes('data-panel-tools="true"') && panel.includes('data-panel-info="true"'));
same(context.scene.modelUrl,'/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb');
context.__exam = true;
check(render(structures[0], {presentation:'panel'}).includes('Exit exam'));
const workspaceSource = await fs.readFile('app/atlas-workspace.tsx','utf8');
const workspaceAst = ts.createSourceFile('workspace.tsx',workspaceSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let measurement;
function findMeasurement(node) {
  if (ts.isCallExpression(node) && node.expression.getText(workspaceAst)==='useEffect' && node.arguments[0].getText(workspaceAst).includes('getBoundingClientRect')) measurement = node.arguments[0];
  ts.forEachChild(node,findMeasurement);
}
findMeasurement(workspaceAst);
check(measurement);
let size={width:1200,height:800}, current=atlasPanelLayout(0,0), observed=null, disconnected=false, resize=null;
const element={getBoundingClientRect:()=>size};
const effectScope={presentation:'panel', boundary:{current:element}, atlasPanelLayout,
  setMeasured:fn=>{current=fn(current);},
  ResizeObserver:class {constructor(callback){this.callback=callback;} observe(target){observed=target; resize=this.callback;} disconnect(){disconnected=true;}},
  addEventListener:(name,fn)=>{check(name==='resize');effectScope.listener=fn;},
  removeEventListener:(name,fn)=>{check(name==='resize' && effectScope.listener===fn);},
};
runInNewContext(ts.transpileModule('var measureEffect='+printer.printNode(ts.EmitHint.Unspecified,measurement,workspaceAst),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,effectScope);
const cleanup=effectScope.measureEffect();
same(observed,element); same(current,atlasPanelLayout(1200,800));
size={width:600,height:650}; resize(); same(current,atlasPanelLayout(600,650));
const unchanged=current; resize(); same(current,unchanged);
cleanup(); check(disconnected);
effectScope.presentation='standalone'; observed=null; same(effectScope.measureEffect(),undefined); same(observed,null);
const result = {
  passed: true,
  checks,
  markupCases,
  handlerCases,
  shoulderStructures: 9,
  sourceGeometryChanged: false,
  browserInteractionTesting: false,
  clinicalValidation: false,
  limitations:
    'Actual shoulder entry and installed UI server rendering, exact menu closures and stylesheet contracts. Workspace mode/readiness/tab fixtures and a scene double are injected. Browser/GPU, focus/Escape, touch, scrolling and 200% zoom acceptance remain pending.',
};
await fs.writeFile(
  'docs/shoulder-workspace-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
