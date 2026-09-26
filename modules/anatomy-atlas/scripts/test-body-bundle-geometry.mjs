import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import * as THREE from 'three';
import ts from 'typescript';
import { bodyBundleGeometries } from '../lib/body-bundle-geometry.ts';

const structures = [{ bundle: 'one', nodeName: 'visible' }, { bundle: 'one', nodeName: 'hidden' },
  { bundle: 'other', nodeName: 'elsewhere' }];
const mesh = (name, geometry = new THREE.BufferGeometry().setAttribute('position',
  new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))) => {
  const node = new THREE.Mesh(geometry); node.name = name; return node;
};
const scene = (...nodes) => new THREE.Group().add(...nodes);

test('full bundle contract includes hidden structures; unrelated bundle is irrelevant', () => {
  assert.throws(() => bodyBundleGeometries(scene(mesh('visible')), structures, 'unknown'), /no expected Mesh/);
  assert.throws(() => bodyBundleGeometries(scene(mesh('visible')), structures, 'one'), /hidden.*missing/);
  const visible = mesh('visible'), hidden = mesh('hidden');
  visible.position.set(1, 2, 3);
  const loaded = scene(visible, hidden, mesh('extra'), mesh('extra'));
  const index = bodyBundleGeometries(loaded, structures, 'one');
  assert.equal(index.get('visible'), visible.geometry);
  assert.equal(index, bodyBundleGeometries(loaded, structures, 'one'));
  assert.deepEqual(visible.position.toArray(), [1, 2, 3]);
  assert.throws(() => bodyBundleGeometries(loaded, structures, 'other'), /elsewhere.*missing/);
  assert.throws(() => bodyBundleGeometries(loaded, [...structures, {bundle:'one', nodeName:'added'}], 'one'), /added.*missing/);
});

test('expected duplicate Mesh and named non-Mesh cannot silently satisfy contract', () => {
  assert.throws(() => bodyBundleGeometries(scene(mesh('visible'), mesh('hidden'), mesh('hidden')), structures, 'one'), /hidden.*duplicate/);
  const group = new THREE.Group(); group.name = 'hidden';
  assert.throws(() => bodyBundleGeometries(scene(mesh('visible'), group), structures, 'one'), /hidden.*missing/);
});

test('missing/empty/malformed positions and empty draw range fail; interleaved positions remain usable', () => {
  const emptyDraw = mesh('x').geometry, outOfBoundsDraw = mesh('x').geometry;
  emptyDraw.setDrawRange(0, 0); outOfBoundsDraw.setDrawRange(3, Infinity);
  const geometries = [new THREE.BufferGeometry(),
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([], 3)),
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,1,0,0,1], 2)),
    mesh('x').geometry.setIndex([]), emptyDraw, outOfBoundsDraw];
  for (const geometry of geometries) assert.throws(() =>
    bodyBundleGeometries(scene(mesh('visible'), mesh('hidden', geometry)), structures, 'one'), /hidden.*(position|triangle)/);
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.InterleavedBufferAttribute(
    new THREE.InterleavedBuffer(new Float32Array([0,0,0,9, 1,0,0,9, 0,1,0,9]), 4), 3, 0));
  assert.equal(bodyBundleGeometries(scene(mesh('visible'), mesh('hidden', geometry)), structures, 'one').get('hidden'), geometry);
});

// Execute the actual component declarations with controlled hooks. Commit and
// boundary lifecycle are simulated; this does not exercise React/GPU rendering.
const source = readFileSync(new URL('../app/body-scene.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('body-scene.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = name => ast.statements.find(n => n.name?.text === name).getText(ast);
const componentCode = ts.transpileModule(`${declaration('Bundle')}\n${declaration('AssetBoundary')}\nthis.api = {Bundle, AssetBoundary};`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;

test('actual Bundle validates before commit/onLoaded; boundary failure and rebuilt-scene retry', () => {
  let loadedScene = scene(mesh('visible'));
  const pending = [], ready = [], failed = [];
  const scope = { React, Component: React.Component, THREE, bodyBundleGeometries,
    useGLTF: () => ({scene: loadedScene}), modelDeliveryUrl: x => x,
    useMemo: fn => fn(), useEffect: fn => pending.push(fn), useLayoutEffect: () => {},
    useBodyBatch: () => null, sceneLabelAnchors: () => new Map() };
  runInNewContext(componentCode, scope);
  const props = { catalog: {structures}, structures: [], hiddenIds: [], inspection: {plane:'off'},
    onLoaded: id => ready.push(id), onFailure: id => failed.push(id) };
  const render = () => scope.api.Bundle({bundle:{id:'one',url:'/one.glb'}, items:[], props,
    offsets:new Map(), frame:new THREE.Box3(), labelIds:[], renderedCount:0, originGuide:null});
  const boundary = new scope.api.AssetBoundary({id:'one', onFailure:props.onFailure, children:'content'});
  try { render(); assert.fail('missing hidden node must throw'); }
  catch (error) {
    assert.match(error.message, /hidden.*missing/);
    boundary.state = scope.api.AssetBoundary.getDerivedStateFromError(error);
    boundary.componentDidCatch(error);
  }
  assert.equal(boundary.render(), null);
  assert.deepEqual(failed, ['one']); assert.deepEqual(ready, []); assert.equal(pending.length, 0);
  loadedScene = scene(mesh('visible'), mesh('hidden'));
  const retryBoundary = new scope.api.AssetBoundary({id:'one', onFailure:props.onFailure, children:'content'});
  render(); assert.deepEqual(ready, []);
  pending.forEach(fn => fn()); assert.deepEqual(ready, ['one']);
  assert.equal(retryBoundary.render(), 'content');
});
