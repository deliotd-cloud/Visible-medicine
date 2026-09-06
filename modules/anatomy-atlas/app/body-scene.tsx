'use client';
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FittedCamera } from './fitted-camera';
import { translatedBox } from '@/lib/explode-layout.mjs';
import {
  arrangeBodyStructures,
  bodyPresentationOffset,
  type BodyLayout,
} from '@/lib/body-arrangement';
import {
  bodySystems,
  type BodyCatalog,
  type BodyStructure,
  type BodySystem,
} from './body-types';
import { AnatomyTissue } from './anatomy-tissue';
import type { DissectionView } from './dissection-data';
import { sectionPlanes, pointRetained } from '@/lib/inspection-geometry';
import { systemOpacity, type InspectionState } from '@/lib/inspection-state';
import type { StudyCamera } from '@/lib/study-views';
import { neuroGroupFor } from '@/lib/neuroanatomy';
import { sceneLabelEndpoint, sceneLabelIds } from '@/lib/scene-labels';
import { vesselColor } from '@/lib/anatomy-vessels';
import { renderedAnatomyStructures } from '@/lib/anatomy-load-state';

type Props = {
  catalog: BodyCatalog;
  structures: BodyStructure[];
  selectedId: string | null;
  systems: Record<BodySystem, boolean>;
  isolated: boolean;
  hiddenIds: string[];
  ghostRemoved: boolean;
  illustrated: boolean;
  landmarks: string[];
  explode: number;
  layout: BodyLayout;
  anchorSkeleton: boolean;
  showOrigins: boolean;
  labels: boolean;
  view: DissectionView;
  zoom: number;
  reset: number;
  focus: boolean;
  exam: boolean;
  inspection: InspectionState;
  plate: boolean;
  cameraCapture?: RefObject<StudyCamera | null>;
  cameraRestore?: RefObject<StudyCamera | null>;
  retries?: Record<string, number>;
  onSelect: (id: string) => void;
  onLoaded: (id: string) => void;
  onFailure: (id: string) => void;
};
const vectors = {
  anterior: [0, 0.04, 1],
  posterior: [0, 0.04, -1],
  right: [-1, 0.04, 0],
  left: [1, 0.04, 0],
  inferior: [0, -1, 0],
  superior: [0, 1, 0],
};
function colorFor(s: BodyStructure) {
  const neuro = neuroGroupFor(s.fmaId);
  if (neuro) return neuro.color;
  if (s.fmaId === 'FMA50801') return '#c3aaa1';
  if (s.system === 'vessels') return vesselColor(s);
  if (s.category === 'ligament' || s.category === 'tendon') return '#d6cfa6';
  if (s.system !== 'organs') return bodySystems[s.system].color;
  if (s.sourceName.endsWith('tooth')) return '#e9e0c9';
  if (/lung/.test(s.sourceName)) return '#c59499';
  if (/heart/.test(s.sourceName)) return '#a84243';
  if (/liver/.test(s.sourceName)) return '#986159';
  if (/kidney/.test(s.sourceName)) return '#a44c4d';
  if (/stomach|intestine|esophagus/.test(s.sourceName)) return '#c89783';
  if (/bladder/.test(s.sourceName)) return '#cba889';
  if (/eyeball/.test(s.sourceName)) return '#e5ddd0';
  if (/ureter/.test(s.sourceName)) return '#d2b090';
  return '#b28772';
}
function Bundle({
  bundle,
  items,
  props,
  offsets,
  frame,
  labelBounds,
  labelIds,
  renderedCount,
}: {
  bundle: BodyCatalog['bundles'][number];
  items: BodyStructure[];
  props: Props;
  offsets: Map<string, THREE.Vector3>;
  frame: THREE.Box3;
  labelBounds: { min: number[]; max: number[] };
  labelIds: string[];
  renderedCount: number;
}) {
  const { scene } = useGLTF(bundle.url);
  const onLoaded = props.onLoaded;
  useEffect(() => onLoaded(bundle.id), [bundle.id, onLoaded]);
  const geometries = useMemo(() => {
    const map = new Map<string, THREE.BufferGeometry>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) map.set(object.name, object.geometry);
    });
    return map;
  }, [scene]);
  return (
    <group dispose={null}>
      {items.map((structure) => {
        const selected = !props.exam && structure.id === props.selectedId;
        const geometry = geometries.get(structure.nodeName);
        if (!geometry) return null;
        const position = offsets.get(structure.id) ?? new THREE.Vector3();
        const removed = props.hiddenIds.includes(structure.id),
          faded = removed || (props.isolated && !selected);
        const clippingPlanes = sectionPlanes(frame, props.inspection, position);
        const opacity = systemOpacity(
          props.inspection,
          structure.system,
          selected,
        );
        const select = (e: ThreeEvent<MouseEvent>) => {
          if (removed) return;
          e.stopPropagation();
          props.onSelect(structure.id);
        };
        const labelIndex = labelIds.indexOf(structure.id);
        const end =
          labelIndex >= 0
            ? sceneLabelEndpoint(
                labelBounds,
                props.view,
                labelIndex,
                labelIds.length,
                position.toArray(),
              )
            : structure.anchor;
        return (
          <group key={structure.id}>
            {props.showOrigins &&
              props.layout === 'spatial' &&
              props.explode > 0 &&
              !removed &&
              (selected || props.structures.length < 150) && (
                <mesh geometry={geometry} raycast={() => null}>
                  <meshBasicMaterial
                    color="#16c6b2"
                    wireframe
                    transparent
                    opacity={0.025}
                    depthWrite={false}
                    clippingPlanes={sectionPlanes(frame, props.inspection)}
                  />
                </mesh>
              )}
            <group position={position}>
              <group
                onClick={select}
                onPointerOver={(e) => {
                  if (removed) return;
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = '';
                }}
              >
                <AnatomyTissue
                  geometry={geometry}
                  color={colorFor(structure)}
                  selected={selected}
                  ghost={faded}
                  muscle={structure.system === 'muscles'}
                  illustrated={props.illustrated}
                  outline={renderedCount < 150 || selected}
                  opacity={opacity}
                  clippingPlanes={clippingPlanes}
                />
              </group>
              {props.labels &&
                !props.exam &&
                !faded &&
                opacity >= 0.2 &&
                pointRetained(
                  new THREE.Vector3(...structure.anchor).add(position),
                  clippingPlanes,
                ) &&
                labelIndex >= 0 && (
                  <group>
                    <Line
                      points={[structure.anchor, end]}
                      color="#647668"
                      lineWidth={1}
                    />
                    <Html center position={end} zIndexRange={[3, 1]}>
                      <button
                        type="button"
                        onClick={() => props.onSelect(structure.id)}
                        className={`scene-label ${selected ? 'selected' : ''}`}
                      >
                        {structure.name}
                      </button>
                    </Html>
                  </group>
                )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
class AssetBoundary extends Component<
  { id: string; onFailure: (id: string) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure(this.props.id);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function BodyScene(props: Props) {
  const rendered = useMemo(
    () =>
      renderedAnatomyStructures(
        props.structures,
        props.systems,
        props.hiddenIds,
        props.ghostRemoved && !props.exam,
      ),
    [
      props.structures,
      props.systems,
      props.hiddenIds,
      props.ghostRemoved,
      props.exam,
    ],
  );
  const focusId = props.focus ? props.selectedId : null;
  // All regional structures define the frame; hide/focus/system changes never move it.
  const frame = useMemo(() => {
    const box = new THREE.Box3();
    for (const s of props.structures) box.union(translatedBox(s.bounds));
    if (box.isEmpty())
      box.set(new THREE.Vector3(-2, -8, -1), new THREE.Vector3(2, 8, 1));
    return box;
  }, [props.structures]);
  const center = useMemo(() => frame.getCenter(new THREE.Vector3()), [frame]);
  const layout = props.exam ? 'spatial' : props.layout;
  const tray = useMemo(
    () =>
      layout === 'tray'
        ? arrangeBodyStructures(rendered, center, props.view).offsets
        : undefined,
    [layout, rendered, center, props.view],
  );
  const offsets = useMemo(
    () =>
      new Map(
        rendered.map((item) => [
          item.id,
          bodyPresentationOffset(
            item,
            center,
            props.exam ? 0 : props.explode,
            layout,
            props.anchorSkeleton,
            tray,
          ),
        ]),
      ),
    [
      rendered,
      center,
      props.exam,
      props.explode,
      layout,
      props.anchorSkeleton,
      tray,
    ],
  );
  const bounds = useMemo(() => {
    let list = rendered.length ? rendered : props.structures;
    if (focusId) {
      const selected = list.find((s) => s.id === focusId);
      if (selected) list = [selected];
    }
    const result = new THREE.Box3();
    for (const s of list)
      result.union(translatedBox(s.bounds, offsets.get(s.id)));
    if (result.isEmpty())
      result.set(new THREE.Vector3(-2, -8, -1), new THREE.Vector3(2, 8, 1));
    if (props.showOrigins && layout === 'spatial' && !focusId)
      result.union(frame);
    return result;
  }, [
    props.structures,
    rendered,
    focusId,
    offsets,
    layout,
    props.showOrigins,
    frame,
  ]);
  const bundles = props.catalog.bundles.filter((b) =>
    rendered.some((s) => s.bundle === b.id),
  );
  const labelIds = sceneLabelIds(
    props.selectedId,
    props.landmarks,
    rendered.filter((s) => !props.hiddenIds.includes(s.id)).map((s) => s.id),
    props.focus,
  );
  const labelBounds = { min: bounds.min.toArray(), max: bounds.max.toArray() };
  const orthographic = props.plate || layout === 'tray';
  return (
    <Canvas
      className="body-scene"
      key={orthographic ? 'plate' : 'perspective'}
      orthographic={orthographic}
      camera={{ position: [0, 0, 28], fov: 38, near: 0.01, far: 150 }}
      dpr={[1, 1.6]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
    >
      <ambientLight intensity={1.4} />
      <hemisphereLight args={['#fffef8', '#a38b70', 1.1]} />
      <directionalLight position={[8, 15, 10]} intensity={2.3} />
      <directionalLight position={[-8, 6, -8]} intensity={1.8} />
      {bundles.map((bundle) => (
        <AssetBoundary
          key={`${bundle.id}:${props.retries?.[bundle.id] ?? 0}`}
          id={bundle.id}
          onFailure={props.onFailure}
        >
          <Suspense fallback={null}>
            <Bundle
              bundle={bundle}
              items={rendered.filter((s) => s.bundle === bundle.id)}
              props={props}
              offsets={offsets}
              frame={frame}
              labelBounds={labelBounds}
              labelIds={labelIds}
              renderedCount={rendered.length}
            />
          </Suspense>
        </AssetBoundary>
      ))}
      <FittedCamera
        bounds={bounds}
        direction={
          orthographic && !['inferior', 'superior'].includes(props.view)
            ? [vectors[props.view][0], 0, vectors[props.view][2]]
            : vectors[props.view]
        }
        up={
          props.view === 'superior'
            ? [0, 0, -1]
            : props.view === 'inferior'
              ? [0, 0, 1]
              : [0, 1, 0]
        }
        viewKey={props.view}
        zoom={props.zoom}
        reset={props.reset}
        locked={props.plate && layout !== 'tray'}
        planar={layout === 'tray'}
        recenterKey={focusId ?? ''}
        cameraCapture={props.cameraCapture}
        cameraRestore={props.cameraRestore}
      />
    </Canvas>
  );
}

export function retryBodyAssets(urls: string[]) {
  for (const url of urls) useGLTF.clear(url);
}
