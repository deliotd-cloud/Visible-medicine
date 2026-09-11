'use client';
import {
  Component,
  createRef,
  Suspense,
  useEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { AnatomyCanvas as Canvas } from './anatomy-canvas';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FittedCamera } from './fitted-camera';
import { translatedBox } from '@/lib/explode-layout.mjs';
import {
  arrangeBodyStructures,
  bodyPresentationOffset,
  extractionOffsets,
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
import type { SelectionBounds } from '@/lib/selection-visibility';
import type { StudyCamera } from '@/lib/study-views';
import { neuroGroupFor } from '@/lib/neuroanatomy';
import { sceneLabelIds, sceneLabelAnchors } from '@/lib/scene-labels';
import { closeUpLabelAnchor } from '@/lib/close-up-labels';
import { SceneLabel, SceneLabelLayer } from './scene-label-layer';
import { vesselColor } from '@/lib/anatomy-vessels';
import { renderedAnatomyStructures } from '@/lib/anatomy-load-state';
import { SceneRecovery, RendererMonitor } from './scene-recovery';
import type { RendererHealth } from '@/lib/renderer-health';
import { selectedOriginGuide, type OriginGuide } from '@/lib/origin-guides';
import { SceneOrientation } from './scene-orientation';
import './scene-orientation.css';

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
  /** Default preserves the regional viewer's existing whole-model wireframes. */
  originStyle?: 'wireframe' | 'selected-guide';
  labels: boolean;
  view: DissectionView;
  zoom: number;
  reset: number;
  focus: boolean;
  exam: boolean;
  inspection: InspectionState;
  /** Optional stable cut frame, independent of camera framing and context visibility. */
  inspectionBounds?: SelectionBounds | null;
  /** Camera-only close-up; original geometry and inspection frame stay intact. */
  cameraBounds?: SelectionBounds | null;
  plate: boolean;
  cameraCapture?: RefObject<StudyCamera | null>;
  cameraRestore?: RefObject<StudyCamera | null>;
  retries?: Record<string, number>;
  appearance?: Record<string, { color: string; opacity: number }>;
  /** Non-selectable orientation surfaces; pointer events must pass through them. */
  contextIds?: string[];
  onSelect: (id: string) => void;
  onLoaded: (id: string) => void;
  onFailure: (id: string) => void;
  onRendererHealth: (health: RendererHealth) => void;
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
  labelIds,
  renderedCount,
  originGuide,
}: {
  bundle: BodyCatalog['bundles'][number];
  items: BodyStructure[];
  props: Props;
  offsets: Map<string, THREE.Vector3>;
  frame: THREE.Box3;
  labelIds: string[];
  renderedCount: number;
  originGuide: OriginGuide | null;
}) {
  // Production transport is byte-exact meshopt; the decoder is bundled locally.
  const { scene } = useGLTF(bundle.url, false, true);
  const onLoaded = props.onLoaded;
  useEffect(() => onLoaded(bundle.id), [bundle.id, onLoaded]);
  const geometries = useMemo(() => {
    const map = new Map<string, THREE.BufferGeometry>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) map.set(object.name, object.geometry);
    });
    return map;
  }, [scene]);
  const labelAnchors = useMemo(
    () =>
      sceneLabelAnchors(
        props.labels && !props.exam,
        labelIds,
        items,
        (structure) => {
          const geometry = geometries.get(structure.nodeName);
          return geometry
            ? closeUpLabelAnchor(geometry, structure.anchor, props.cameraBounds)
            : null;
        },
      ),
    [items, geometries, props.cameraBounds, props.labels, props.exam, labelIds],
  );
  return (
    <group dispose={null}>
      {items.map((structure) => {
        const selected = !props.exam && structure.id === props.selectedId;
        const geometry = geometries.get(structure.nodeName);
        if (!geometry) return null;
        const position = offsets.get(structure.id) ?? new THREE.Vector3();
        const removed = props.hiddenIds.includes(structure.id),
          faded = removed || (props.isolated && !selected);
        const interactive =
          !removed && !props.contextIds?.includes(structure.id);
        const clippingPlanes = sectionPlanes(
          frame,
          props.inspection,
          position,
          selected,
        );
        const opacity =
          systemOpacity(props.inspection, structure.system, selected) *
          (props.appearance?.[structure.id]?.opacity ?? 1);
        const select = (e: ThreeEvent<MouseEvent>) => {
          if (!interactive) return;
          e.stopPropagation();
          props.onSelect(structure.id);
        };
        const labelIndex = labelIds.indexOf(structure.id);
        const labelAnchor = labelAnchors.get(structure.id);
        return (
          <group key={structure.id}>
            {props.originStyle !== 'selected-guide' &&
              props.showOrigins &&
              props.layout !== 'tray' &&
              props.explode > 0 &&
              position.lengthSq() > 0 &&
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
            {originGuide?.id === structure.id && (
              <group>
                <mesh geometry={geometry} raycast={() => null}>
                  <meshBasicMaterial
                    color="#16c6b2"
                    wireframe
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                  />
                </mesh>
                <Line
                  points={[originGuide.start, originGuide.end]}
                  color="#16c6b2"
                  lineWidth={1}
                  transparent
                  opacity={0.6}
                  depthWrite={false}
                  raycast={() => null}
                />
              </group>
            )}
            <group position={position}>
              <group
                onClick={select}
                onPointerOver={(e) => {
                  if (!interactive) return;
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  if (props.contextIds?.includes(structure.id)) return;
                  document.body.style.cursor = '';
                }}
              >
                <AnatomyTissue
                  geometry={geometry}
                  color={
                    props.appearance?.[structure.id]?.color ??
                    colorFor(structure)
                  }
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
                labelAnchor &&
                !props.exam &&
                !faded &&
                opacity >= 0.2 &&
                pointRetained(
                  new THREE.Vector3(...labelAnchor).add(position),
                  clippingPlanes,
                ) &&
                labelIndex >= 0 && (
                  <SceneLabel
                    id={structure.id}
                    name={structure.name}
                    selected={selected}
                    position={labelAnchor}
                    priority={labelIndex}
                    onSelect={props.onSelect}
                  />
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
  const cutFrame = useMemo(() => {
    const bounds = props.inspectionBounds;
    return bounds
      ? new THREE.Box3(
          new THREE.Vector3().fromArray(bounds.min),
          new THREE.Vector3().fromArray(bounds.max),
        )
      : frame;
  }, [props.inspectionBounds, frame]);
  const layout = props.exam ? 'spatial' : props.layout;
  const tray = useMemo(
    () =>
      layout === 'tray'
        ? arrangeBodyStructures(rendered, center, props.view).offsets
        : layout === 'extract'
          ? extractionOffsets(
              rendered.filter((item) => !props.hiddenIds.includes(item.id)),
              props.selectedId,
              props.view,
            )
          : undefined,
    [layout, rendered, center, props.view, props.hiddenIds, props.selectedId],
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
  const originGuide = useMemo(
    () => selectedOriginGuide({
      enabled: props.originStyle === 'selected-guide' && props.showOrigins,
      exam: props.exam,
      layout,
      explode: props.explode,
      selectedId: props.selectedId,
      structures: rendered,
      hiddenIds: props.hiddenIds,
      contextIds: props.contextIds,
      inspection: props.inspection,
      offsets,
      appearance: props.appearance,
    }),
    [
      props.originStyle, props.showOrigins, props.exam, layout, props.explode,
      props.selectedId, rendered, props.hiddenIds, props.contextIds,
      props.inspection, offsets, props.appearance,
    ],
  );
  const bounds = useMemo(() => {
    if (props.cameraBounds && !focusId && !props.exam)
      return new THREE.Box3(
        new THREE.Vector3().fromArray(props.cameraBounds.min),
        new THREE.Vector3().fromArray(props.cameraBounds.max),
      );
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
    if (originGuide) result.union(translatedBox(originGuide.bounds));
    if (
      props.originStyle !== 'selected-guide' && props.showOrigins &&
      layout !== 'tray' && !focusId
    ) result.union(frame);
    return result;
  }, [
    props.structures,
    rendered,
    focusId,
    offsets,
    layout,
    props.showOrigins,
    props.originStyle,
    originGuide,
    frame,
    props.cameraBounds,
    props.exam,
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
  const orthographic = props.plate || layout === 'tray';
  const orientationOutput = useMemo(() => createRef<HTMLSpanElement>(), []);
  return (
    <SceneRecovery
      className="body-scene"
      cameraKey={[
        props.view,
        props.zoom,
        props.reset,
        focusId,
        orthographic,
        layout,
      ].join('/')}
      key={orthographic ? 'plate' : 'perspective'}
      onHealth={props.onRendererHealth}
      cameraCapture={props.cameraCapture}
      cameraRestore={props.cameraRestore}
    >
      {(onHealth) => (
        <div className="anatomy-oriented-scene" data-orientation={!props.exam}>
          {!props.exam && (
            <p className="anatomy-live-orientation" aria-live="off">
              View from: <span ref={orientationOutput}>unavailable</span>
            </p>
          )}
        <Canvas
          onFailure={() => onHealth('failed')}
          orthographic={orthographic}
          camera={{ position: [0, 0, 28], fov: 38, near: 0.01, far: 150 }}
          dpr={[1, 1.6]}
          frameloop="demand"
          gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
        >
          <RendererMonitor onHealth={onHealth} />
          <SceneOrientation
            output={orientationOutput}
            coordinates={props.catalog.coordinateSystem}
            enabled={!props.exam}
          />
          <ambientLight intensity={1.4} />
          <hemisphereLight args={['#fffef8', '#a38b70', 1.1]} />
          <directionalLight position={[8, 15, 10]} intensity={2.3} />
          <directionalLight position={[-8, 6, -8]} intensity={1.8} />
          <SceneLabelLayer>
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
                    frame={cutFrame}
                    labelIds={labelIds}
                    renderedCount={rendered.length}
                    originGuide={originGuide}
                  />
                </Suspense>
              </AssetBoundary>
            ))}
          </SceneLabelLayer>
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
        </div>
      )}
    </SceneRecovery>
  );
}

export function retryBodyAssets(urls: string[]) {
  for (const url of urls) useGLTF.clear(url);
}
