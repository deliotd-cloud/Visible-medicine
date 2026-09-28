import assert from 'node:assert/strict';
import * as labelFocus from '../lib/scene-label-focus.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Vector3, PerspectiveCamera, OrthographicCamera } from 'three';
import {
  layoutScreenLabels,
  projectLabelAnchor,
  screenLabelMaxWidth,
  screenLabelLimitPerSide,
} from '../lib/screen-label-layout.ts';
import { sceneLabelIds } from '../lib/scene-labels.ts';
import * as labelLayout from '../lib/screen-label-layout.ts';
import * as labelDepth from '../lib/label-depth.ts';
import * as React from 'react';
import * as Three from 'three';
import { transformSync } from 'esbuild';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

let checks = 0,
  projections = 0,
  layouts = 0;
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const hash = (raw) => createHash('sha256').update(raw).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
const before = JSON.stringify(catalog);

function validate(labels, width, height) {
  const before = JSON.stringify(labels);
  const result = layoutScreenLabels(labels, width, height);
  layouts++;
  same(JSON.stringify(labels), before, 'Layout never mutates input anchors');
  for (const label of result) {
    const left = label.x < width / 2;
    same(
      label.side,
      left ? 'left' : 'right',
      'Side follows the projected anchor, not list order or anatomical name',
    );
    check(
      label.left >= 10 && label.left + label.width <= width - 10,
      'Horizontal containment',
    );
    check(
      left ? label.left + label.width < width / 2 : label.left > width / 2,
      'Entire box remains on its own side',
    );
    check(
      label.top >= 10 - 1e-8 && label.top + label.height <= height - 10 + 1e-8,
      'Vertical containment',
    );
    same(
      label.endX,
      left ? label.left + label.width : label.left,
      'Leader reaches the inward box edge',
    );
    same(
      label.endY,
      label.top + label.height / 2,
      'Leader meets box centre vertically',
    );
  }
  for (const side of ['left', 'right']) {
    const column = result.filter((label) => label.side === side);
    check(column.length <= screenLabelLimitPerSide(width, height), 'Canvas density budget is respected');
    for (let i = 1; i < column.length; i++) {
      check(
        column[i].top >= column[i - 1].top + column[i - 1].height + 6 - 1e-8,
        'Measured boxes do not overlap',
      );
      check(column[i].y >= column[i - 1].y, 'Vertical anchor order retained');
    }
  }
  return result;
}

// Small extracted structures can sit inside the label rail itself. Protect
// their anchor with clearance when a free vertical slot exists, on either side.
for (const width of [240, 370, 880]) for (const side of ['left', 'right']) {
  for (const y of [14, 250, 486]) {
    const input = [{id:'extracted',x:side==='left'?50:width-50,y,width:screenLabelMaxWidth(width),height:64,selected:true}];
    const [placed] = validate(input,width,500);
    check(placed && (placed.top+placed.height<=y-12 || placed.top>=y+12), 'Extracted anchor remains outside its label');
  }
  const middle={id:'middle',x:side==='left'?50:width-50,y:250,width:screenLabelMaxWidth(width),height:64,selected:true};
  const crowded=validate([{...middle,id:'first',y:120,selected:false},middle],width,500);
  const selected=crowded.find(p=>p.id==='middle');
  check(selected && (selected.top+selected.height<=250-12 || selected.top>=250+12), 'Anchor clears a neighbouring label without overlap or side swapping');
}

for (const width of [240, 320, 360, 736, 1024, 1600])
  for (const height of [120, 240, 400, 720])
    for (const textHeight of [28, 44, 66, 100])
      for (const shape of [
        'left',
        'right',
        'mixed',
        'top',
        'bottom',
        'centre',
      ]) {
        const labels = Array.from({ length: 9 }, (_, i) => ({
          id: `label-${i}`,
          selected: i === 8,
          x:
            shape === 'left'
              ? width * 0.2
              : shape === 'right'
                ? width * 0.8
                : shape === 'centre'
                  ? width / 2
                  : (i % 2 ? 0.75 : 0.25) * width,
          y:
            shape === 'top'
              ? 1
              : shape === 'bottom'
                ? height - 1
                : height * 0.5 + i * 2,
          width: screenLabelMaxWidth(width) - i,
          height: textHeight + (i % 3) * 8,
        }));
        const result = validate(labels, width, height);
        if (labels[8].height <= height - 20)
          check(
            result.some((label) => label.id === 'label-8'),
            'Selected survives a crowded column',
          );
      }

const compactLabels = Array.from({length:8},(_,i)=>({
  id:`compact-${i}`, priority:i, selected:i===7,
  x:i%2 ? 260 : 110, y:96+i, width:100, height:64,
}));
const shortCanvas=validate(compactLabels,376,192);
same(shortCanvas.length,2,'Phone-height canvas shows one label per occupied side');
same(shortCanvas.map(l=>l.id),['compact-0','compact-7'],'Selected name replaces a lower-priority landmark on its own side');
check(shortCanvas.every(l=>l.side==='left' ? l.left+l.width<=376*.35 : l.left>=376*.65),'Phone labels leave a central anatomy corridor');
same(validate(compactLabels,376,480).length,4,'A taller narrow canvas permits two labels on each side');
const wideLabels=compactLabels.map(l=>({...l,x:l.x<188?200:700}));
same(validate(wideLabels,932,424).length,8,'Desktop retains the established eight landmarks');
same(validate(wideLabels.map(l=>({...l,x:200,height:28})),932,424).length,8,'Desktop never imposes a four-label cap on one occupied side');
same(validate(compactLabels.map(l=>({...l,x:100})),376,192).map(l=>l.id),['compact-7'],'A full column never spills to the wrong side');
same(validate([...compactLabels].reverse(),376,192),shortCanvas,'Compact choice is independent of source arrival order');
same(validate(compactLabels.map(l=>({...l,height:150})),376,192).length,2,'Measured enlarged labels still fit without shrinking their text');
same(screenLabelLimitPerSide(559,319),1);same(screenLabelLimitPerSide(559,320),2);
same(screenLabelLimitPerSide(560,239),2);same(screenLabelLimitPerSide(560,240),8);
for(const width of [319,359,373,375,376,399,559])check(Number.isInteger(screenLabelMaxWidth(width)),'CSS and integral DOM measurements share the same width cap');
for(const width of [NaN,Infinity,-1,0])same(screenLabelMaxWidth(width),0,'Invalid canvas widths never reach CSS');
for(const width of [240,320,353,376,559,736,1024]) {
  const normal=screenLabelMaxWidth(width),large=screenLabelMaxWidth(width,2);
  check(large>=normal,'Enlarged text never gets a narrower label');
  check(large<=width/2-20,'Enlargement preserves its half and central clearance');
  for(const scale of [NaN,Infinity,-1,0])same(screenLabelMaxWidth(width,scale),normal,'Invalid scale uses the normal bound');
  same(screenLabelMaxWidth(width,8),large,'Text growth cannot exceed side bound');
  const input=[{id:'left-large',x:width*.35,y:100,width:large,height:84,selected:true},
    {id:'right-large',x:width*.65,y:100,width:large,height:84}];
  same(validate(input,width,212).length,2,'Both enlarged labels fit without switching screen side');
  same(validate(input.map(l=>({...l,width:large+1})),width,212).length,0,'Oversized labels are still rejected');
}
for(const dimensions of [[NaN,400],[360,Infinity],[0,400],[360,0]])same(screenLabelLimitPerSide(...dimensions),0);

const directions = [
  [0, 0.04, 1],
  [0, 0.04, -1],
  [-1, 0.04, 0],
  [1, 0.04, 0],
  [0, 1, 0],
  [0, -1, 0],
  [1, 1, -1],
  [-2, 0.3, 1],
];
for (const orthographic of [false, true])
  for (const direction of directions)
    for (const zoom of [0.6, 1, 2])
      for (const pan of [0, 2]) {
        const camera = orthographic
          ? new OrthographicCamera(-18, 18, 22, -22, 0.1, 200)
          : new PerspectiveCamera(50, 736 / 720, 0.1, 200);
        const target = new Vector3(pan, 0, 0);
        camera.position.copy(
          new Vector3(...direction).normalize().multiplyScalar(60).add(target),
        );
        if (direction[1] === 1 || direction[1] === -1)
          camera.up.set(0, 0, -direction[1]);
        camera.lookAt(target);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        for (let i = 0; i < catalog.structures.length; i += 8) {
          const labels = [];
          for (const [j, structure] of catalog.structures
            .slice(i, i + 8)
            .entries()) {
            const parent = new Group(),
              anchor = new Group();
            parent.position.set(j * 0.13, -j * 0.07, j * 0.05);
            anchor.position.fromArray(structure.anchor);
            parent.add(anchor);
            const world = anchor.getWorldPosition(new Vector3());
            check(
              world.distanceTo(
                new Vector3(...structure.anchor).add(parent.position),
              ) < 1e-9,
              'Parent/explode translation applied once',
            );
            const point = projectLabelAnchor(world, camera, 736, 720);
            projections++;
            if (!point) continue;
            const independent = world
              .clone()
              .applyMatrix4(camera.matrixWorldInverse)
              .applyMatrix4(camera.projectionMatrix);
            check(
              Math.abs(point.x - (independent.x + 1) * 368) < 1e-8,
              'Camera projection including orbit/pan/zoom',
            );
            labels.push({
              ...point,
              id: structure.id,
              width: 180,
              height: 44,
              selected: j === 0,
            });
          }
          validate(labels, 736, 720);
        }
      }

// A name containing "right" must change screen side when seen from behind.
const camera = new PerspectiveCamera(45, 1, 0.1, 100);
const anchor = new Vector3(-1, 0, 0);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
const anterior = projectLabelAnchor(anchor, camera, 360, 400);
camera.position.set(0, 0, -10);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
const posterior = projectLabelAnchor(anchor, camera, 360, 400);
check(
  anterior.x < 180 && posterior.x > 180,
  'Anterior/posterior switches screen side',
);
for (const input of [
  new Vector3(0, 0, -20),
  new Vector3(0, 0, 200),
  new Vector3(1000, 0, 0),
  new Vector3(NaN, 0, 0),
])
  same(
    projectLabelAnchor(input, camera, 360, 400),
    null,
    'Behind-camera, clipped and non-finite anchors are hidden',
  );
for (const [width, height] of [
  [0, 400],
  [360, 0],
  [NaN, 400],
  [360, Infinity],
])
  same(projectLabelAnchor(anchor, camera, width, height), null);
same(
  layoutScreenLabels(
    [{ id: 'invalid', x: NaN, y: 20, width: 50, height: 28 }],
    360,
    400,
  ),
  [],
);
const known = ['a', 'b', 'c'];
const priorityFixture = known.map((id, priority) => ({
  id,
  priority,
  x: 50,
  y: 80,
  width: 100,
  height: 60,
}));
same(
  layoutScreenLabels(priorityFixture, 360, 150),
  layoutScreenLabels([...priorityFixture].reverse(), 360, 150),
  'Crowded landmark choice is independent of bundle arrival order',
);
same(sceneLabelIds('b', known, known, false), ['b', 'a', 'c']);
same(sceneLabelIds('b', known, known, true), ['b']);
same(sceneLabelIds('b', known, [], false), []);
same(JSON.stringify(catalog), before, 'Catalog unchanged');

for (const path of ['app/body-scene.tsx', 'app/anatomy-scene.tsx']) {
  const source = await readFile(path, 'utf8');
  check(
    source.includes('<SceneLabelLayer>') && source.includes('<SceneLabel'),
    'Both viewers use the shared layer',
  );
  check(
    source.includes('!props.exam') &&
      source.includes('!faded') &&
      source.includes('pointRetained('),
    'Exam/fade/cut guards preserved',
  );
  check(
    !source.includes('sceneLabelEndpoint') && !source.includes('labelEnds'),
    'Old parity/fixed placement removed',
  );
}
// Exercise the exact component's frame callback and DOM handlers with injected
// hooks/elements. This catches wiring mistakes without pretending to be a browser.
const require = createRequire(import.meta.url);
let frame,
  invalidations = 0;
const entries = [
  {
    id: 'right-structure',
    name: 'Right structure',
    selected: true,
    anchor: { current: new Group() },
    onSelect: (id) => picked.push(id),
  },
  {
    id: 'other-structure',
    name: 'Other structure',
    selected: false,
    anchor: { current: new Group() },
    onSelect: (id) => picked.push(id),
  },
];
entries[0].anchor.current.position.set(-1, 0, 0);
const fixtureScene = new Three.Scene(), fixtureOwn = new Group();
fixtureOwn.add(entries[0].anchor.current); fixtureScene.add(fixtureOwn);
const coveringMesh = new Three.Mesh(new Three.BoxGeometry(2,2,1), new Three.MeshStandardMaterial());
coveringMesh.position.set(-.5,0,5); coveringMesh.userData = {...labelDepth.labelDepthSurface};
fixtureScene.add(coveringMesh);
let fixtureTime = 0;
const picked = [],
  effects = [],
  observers = [];
const size = { width: 360, height: 400 };
class Observer {
  constructor(callback) {
    this.callback = callback;
    this.nodes = new Set();
    observers.push(this);
  }
  observe(node) {
    this.nodes.add(node);
  }
  unobserve(node) {
    this.nodes.delete(node);
  }
  disconnect() {
    this.nodes.clear();
  }
}
const fixtureModule = { exports: {} };
const exactSource = await readFile('app/scene-label-layer.tsx', 'utf8');
runInNewContext(
  transformSync(exactSource, { loader: 'tsx', format: 'cjs', jsx: 'automatic' })
    .code,
  {
    module: fixtureModule,
    exports: fixtureModule.exports,
    ResizeObserver: Observer,
    performance: {now: () => fixtureTime}, setTimeout, clearTimeout,
    require: (name) => {
      if (name === 'react')
        return {
          ...React,
          useState: () => [
            entries,
            (update) => {
              const next = update(entries);
              entries.splice(0, entries.length, ...next);
            },
          ],
          useRef: (value) => ({ current: value }),
          useMemo: (fn) => fn(),
          useCallback: (fn) => fn,
          useLayoutEffect: (fn) => effects.push(fn),
        };
      if (name === '@react-three/fiber')
        return {
          useThree: (select) =>
            select({ size, gl: { domElement: { isConnected: false } }, invalidate: () => invalidations++ }),
          useFrame: (fn) => {
            frame = (args) => { fixtureTime += 101; fn({...args, scene: fixtureScene}); };
          },
        };
      if (name === '@react-three/drei') return { Html: 'html-overlay-fixture' };
      if (name === 'three') return Three;
      if (name === '@/lib/screen-label-layout') return labelLayout;
      if (name === '@/lib/label-depth') return labelDepth;
      if (name === '@/lib/scene-label-focus') return labelFocus;
      if (name === './scene-label-layer.css') return {};
      if (name === 'react/jsx-runtime') return require(name);
      throw Error('Unexpected component import: ' + name);
    },
  },
);
const tree = fixtureModule.exports.SceneLabelLayer({ children: null });
const elements = [];
function visit(element) {
  if (!element || typeof element !== 'object') return;
  if (Array.isArray(element)) return element.forEach(visit);
  elements.push(element);
  visit(element.props?.children);
}
visit(tree);
const overlay = elements.find(
  (element) => element.type === 'html-overlay-fixture',
);
same(
  Array.from(overlay.props.calculatePosition()),
  [0, 0],
  'HTML layer does not follow a world-origin projection',
);
const buttonElement = elements.find((element) => element.type === 'button');
same(
  buttonElement.props.children[0],
  'Right structure',
  'Anatomical text is not relabelled to screen laterality',
);
const labelButtons = elements.filter((element) => element.type === 'button');
same(buttonElement.props.style.maxWidth,
  `min(${screenLabelMaxWidth(size.width,2)}px, max(${screenLabelMaxWidth(size.width)}px, 7em))`,
  'Actual label width follows font size within a hard screen-side cap');
same(buttonElement.props['aria-current'], 'true', 'Selected anatomy is marked current, not a toggle');
same(labelButtons[1].props['aria-current'], undefined, 'Unselected anatomy is not marked current');
check(labelButtons.every((button) => !Object.hasOwn(button.props, 'aria-pressed')), 'Labels do not promise a toggle action');
const nodes = {};
// Effects before late Html refs mirror the separate DOM root mounting later.
const cleanups = effects.map((effect) => effect());
for (const type of ['button', 'path', 'circle']) {
  const element = elements.find((element) => element.type === type);
  const node = {
    style: {},
    dataset: {},
    offsetWidth: screenLabelMaxWidth(size.width),
    offsetHeight: 44,
    attributes: {},
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
  };
  nodes[type] = node;
  element.props.ref(node);
}
check(
  observers[0].nodes.has(nodes.button),
  'Late-mounted HTML button is observed for wrapping/font/touch size changes',
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
frame({ camera });
same(nodes.button.dataset.side, 'left', 'Frame writes actual left side');
same(nodes.button.disabled, false, 'Onscreen label can be selected');
same(nodes.button.style.visibility, 'visible');
same(nodes.button.dataset.depth, 'covered', 'Selected deep anchor gets a tissue-depth cue');
same(nodes.path.dataset.depth, 'covered', 'Covered leader gets the dashed style hook');
same(nodes.button.attributes['aria-description'], labelDepth.coveredLabelDescription, 'Depth explanation is accessible');
check(
  nodes.path.attributes.d.startsWith('M ') && nodes.circle.attributes.cx,
  'Leader and anchor dot track real projection',
);
camera.position.set(0, 0, -10);
camera.lookAt(0, 0, 0);
frame({ camera });
same(nodes.button.dataset.depth, '', 'Opposite camera clears stale depth cue');
same(
  nodes.button.dataset.side,
  'right',
  'Next orbit frame updates the same label without a preset change',
);
entries[0].anchor.current.position.set(0, 0, -20);
frame({ camera });
same(
  nodes.button.disabled,
  true,
  'Behind-camera labels cannot receive selection',
);
for (const type of ['button', 'path', 'circle'])
  same(nodes[type].style.visibility, 'hidden');
let stopped = 0;
for (const handler of [
  'onPointerDown',
  'onPointerUp',
  'onDoubleClick',
  'onClick',
])
  buttonElement.props[handler]({
    stopPropagation() {
      stopped++;
    },
  });
same(stopped, 4, 'Label interactions stop orbit/underlying-pick propagation');
same(picked, ['right-structure'], 'Label selects its exact anatomy ID');
const previousInvalidations = invalidations;
observers[0].callback();
check(
  invalidations > previousInvalidations,
  'Text resize requests a demand frame',
);
for (const type of ['button', 'path', 'circle'])
  elements.find((element) => element.type === type).props.ref(null);
check(!observers[0].nodes.has(nodes.button), 'Removed labels are unobserved');
cleanups.forEach((cleanup) => cleanup?.());
check(
  observers.every((observer) => observer.nodes.size === 0),
  'Observers release on unmount',
);

const report = {
  passed: true,
  checks,
  projections,
  layouts,
  catalogSha256: hash(raw),
  browserVisualValidation: false,
  note: 'Real Three.js projection, measured-box fixtures and exact component frame/DOM handlers with injected hooks/elements; no browser, GPU, font-metric or clinical validation claimed.',
};
await writeFile(
  'docs/screen-label-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
