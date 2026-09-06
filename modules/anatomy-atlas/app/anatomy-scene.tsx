'use client';

import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { AnatomyStructure, SystemKey } from './anatomy-data';
import { FittedCamera } from './fitted-camera';
import { shoulderOffset, translatedBox } from '@/lib/explode-layout.mjs';
import manifest from '@/public/models/bodyparts3d/manifest.json';
import {
  applyMaterialInspection,
  clippedMeshRaycast,
  sectionPlanes,
  pointRetained,
} from '@/lib/inspection-geometry';
import { type InspectionState, systemOpacity } from '@/lib/inspection-state';
import type { StudyCamera } from '@/lib/study-views';
import { Button } from '@/components/ui/button';
import { SceneRecovery, RendererMonitor } from './scene-recovery';
import type { RendererHealth } from '@/lib/renderer-health';

const noPlanes: THREE.Plane[] = [];
const sectionFrame = new THREE.Box3();
for (const part of manifest.parts) {
  const box = new THREE.Box3(
    new THREE.Vector3().fromArray(part.bounds.min),
    new THREE.Vector3().fromArray(part.bounds.max),
  );
  box.min.y = Math.max(box.min.y, -3.15);
  if (!box.isEmpty()) sectionFrame.union(box);
}

export type CameraView = 'posterior' | 'anterior' | 'lateral';
export type AnatomyLayer = 'cuff' | 'surface' | 'bones';
type SceneProps = {
  structures: AnatomyStructure[];
  selectedId: string;
  visibleSystems: Record<SystemKey, boolean>;
  isolated: boolean;
  explode: number;
  showLabels: boolean;
  syncPlane: boolean;
  resetNonce: number;
  view: CameraView;
  layer: AnatomyLayer;
  zoom: number;
  exam: boolean;
  anchorSkeleton: boolean;
  showOrigins: boolean;
  plate: boolean;
  inspection: InspectionState;
  cameraCapture?: RefObject<StudyCamera | null>;
  cameraRestore?: RefObject<StudyCamera | null>;
  onSelect: (id: string) => void;
  onRendererHealth: (health: RendererHealth) => void;
  onModelReady: (ready: boolean) => void;
};
const views: Record<CameraView, [number, number, number]> = {
  posterior: [2.5, 1.2, -12],
  anterior: [-1.5, 1, 12],
  lateral: [-14, 1.5, -1.3],
};
// Source-registered surface anchors. Anatomy meshes retain their common registration.
const anchors: Record<string, [number, number, number]> = {
  scapula: [0.34, -1.05, -1.55],
  humerus: [-2.9, -2.5, 0.12],
  clavicle: [0.7, 1.58, 1.46],
  supraspinatus: [-0.6, 1.56, -1.12],
  infraspinatus: [-0.35, 0.02, -1.6],
  subscapularis: [-0.35, -0.35, -0.48],
  'teres-minor': [-1.6, -0.6, -1.08],
  deltoid: [-3.12, 0.22, 0.1],
  'biceps-long-head': [-2.5, -1.5, 0.83],
};
const labelEnds: Record<
  CameraView,
  Record<string, [number, number, number]>
> = {
  posterior: {
    scapula: [-0.05, -1.9, -2],
    humerus: [-3.65, -2.6, -0.5],
    clavicle: [1.1, 2.45, 0.5],
    supraspinatus: [0.8, 1.75, -2],
    infraspinatus: [1.05, 0.3, -2],
    'teres-minor': [-2.85, -0.5, -1.7],
    deltoid: [-3.6, 0.8, -1.2],
  },
  anterior: {
    scapula: [0.95, -1.8, 0.2],
    humerus: [-3.6, -2.55, 0.6],
    clavicle: [0.85, 2.45, 1.5],
    subscapularis: [1.15, 0.25, 1.6],
    deltoid: [-3.65, 0.8, 1.2],
    'biceps-long-head': [-3.65, -0.85, 1.25],
  },
  lateral: {
    humerus: [-3.8, -2.7, -0.2],
    clavicle: [-2.9, 2.6, 1.5],
    supraspinatus: [-3, 2.15, -1.2],
    infraspinatus: [-3.4, 0.5, -2.5],
    'teres-minor': [-3.4, -1.1, -2.2],
    subscapularis: [-3, 0.2, 1.8],
    deltoid: [-4, 0.5, 0.5],
    'biceps-long-head': [-3.6, -1.8, 1.4],
  },
};

function isVisible(structure: AnatomyStructure, props: SceneProps) {
  if (!props.visibleSystems[structure.system]) return false;
  const slug = structure.id.split(':').at(-1)!;
  const selected = props.selectedId === structure.id && !props.exam;
  return (
    selected ||
    !(
      (props.layer === 'bones' && structure.category !== 'bone') ||
      (props.layer === 'cuff' && ['deltoid', 'biceps-long-head'].includes(slug))
    )
  );
}

function Tissue({
  geometry,
  bone,
  selected,
  faded,
  slug,
  shiftY = 0,
  cuts = noPlanes,
  opacity = 1,
}: {
  geometry: THREE.BufferGeometry;
  bone: boolean;
  selected: boolean;
  faded: boolean;
  slug: string;
  shiftY?: number;
  cuts?: THREE.Plane[];
  opacity?: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  // Crop in original anatomical coordinates even when the entire structure moves.
  const clippingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 3.15 - shiftY),
    [shiftY],
  );
  const material = useMemo(() => {
    const colors: Record<string, string> = {
      supraspinatus: '#c96959',
      infraspinatus: '#b9544d',
      subscapularis: '#c26557',
      'teres-minor': '#a94b48',
      deltoid: '#c56b60',
      'biceps-long-head': '#b55b55',
    };
    const result = new THREE.MeshStandardMaterial({
      color: bone ? '#e5d3ae' : (colors[slug] ?? '#bb5b50'),
      roughness: 0.91,
      metalness: 0,
      transparent: faded,
      opacity: faded ? 0.085 : 1,
      depthWrite: !faded,
      side: THREE.DoubleSide,
      clippingPlanes: [clippingPlane],
      clipShadows: true,
      emissive: selected ? '#513016' : '#000000',
      emissiveIntensity: selected ? 0.1 : 0,
    });
    // Fine tonal hatching describes form; these are NOT measured muscle fascicles.
    if (!bone)
      result.onBeforeCompile = (shader) => {
        shader.vertexShader =
          'varying vec3 vAnatomyPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvAnatomyPosition = position;',
        );
        shader.fragmentShader =
          'varying vec3 vAnatomyPosition;\n' + shader.fragmentShader;
        const fan = [
          'infraspinatus',
          'subscapularis',
          'supraspinatus',
          'teres-minor',
        ].includes(slug);
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        float fiber = ${fan ? 'atan(vAnatomyPosition.y - 1.3, vAnatomyPosition.x + 2.6) * 95.0' : 'atan(vAnatomyPosition.x + 3.0, vAnatomyPosition.y + 3.7) * 150.0'};
        float stroke = pow(0.5 + 0.5 * sin(fiber + sin(vAnatomyPosition.y * 7.0) * 0.22), 10.0);
        diffuseColor.rgb *= 0.92 + 0.14 * stroke;
      `,
        );
      };
    result.customProgramCacheKey = () => `${slug}-${bone}`;
    return result;
  }, [bone, selected, faded, slug, clippingPlane]);
  useEffect(() => () => material.dispose(), [material]);
  const outline = useMemo(() => {
    const result = new THREE.MeshBasicMaterial({
      color: selected ? '#836337' : bone ? '#75674e' : '#733e37',
      side: THREE.BackSide,
      clippingPlanes: [clippingPlane],
    });
    result.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed += normal * 0.009;',
      );
    };
    return result;
  }, [bone, selected, clippingPlane]);
  useEffect(() => () => outline.dispose(), [outline]);
  useLayoutEffect(() => {
    const planes = [clippingPlane, ...cuts],
      alpha = faded ? 0.085 : opacity;
    applyMaterialInspection(material, planes, alpha);
    applyMaterialInspection(outline, planes, 1);
    invalidate();
  }, [material, outline, clippingPlane, cuts, faded, opacity, invalidate]);
  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        castShadow={!faded && opacity >= 0.95}
        receiveShadow
        raycast={faded ? () => null : clippedMeshRaycast}
      />
      {!faded && opacity >= 0.95 && (
        <mesh geometry={geometry} material={outline} raycast={() => null} />
      )}
    </>
  );
}

function Model(props: SceneProps) {
  const { scene } = useGLTF('/models/bodyparts3d/shoulder-right.glb');
  const onModelReady = props.onModelReady;
  useEffect(() => {
    onModelReady(true);
  }, [onModelReady]);
  const meshes = useMemo(() => {
    const result: Record<string, THREE.Mesh[]> = {};
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const slug = object.name
          .split('__')[0]
          .replace('biceps-long-head-muscle', 'biceps-long-head');
        (result[slug] ??= []).push(object);
      }
    });
    return result;
  }, [scene]);
  const surfaceAnchors = useMemo(() => {
    const result: Record<string, [number, number, number]> = {};
    for (const [slug, target] of Object.entries(anchors)) {
      let distance = Infinity;
      const desired = new THREE.Vector3(...target),
        candidate = new THREE.Vector3();
      for (const mesh of meshes[slug] ?? []) {
        const positions = mesh.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          candidate.fromBufferAttribute(positions, i);
          const next = candidate.distanceToSquared(desired);
          if (next < distance) {
            distance = next;
            result[slug] = candidate.toArray() as [number, number, number];
          }
        }
      }
    }
    return result;
  }, [meshes]);
  return (
    <group dispose={null}>
      {props.structures.map((structure) => {
        const slug = structure.id.split(':').at(-1)!;
        const selected = props.selectedId === structure.id && !props.exam;
        if (!isVisible(structure, props)) return null;
        const displacement = shoulderOffset(
          slug,
          props.explode,
          props.anchorSkeleton && structure.category === 'bone',
        );
        const faded = props.isolated && !selected;
        const cuts = sectionPlanes(
          sectionFrame,
          props.inspection,
          displacement,
        );
        const opacity = systemOpacity(
          props.inspection,
          structure.system,
          selected,
        );
        const anchor = surfaceAnchors[slug],
          end = labelEnds[props.view][slug];
        const select = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          props.onSelect(structure.id);
        };
        return (
          <group key={structure.id}>
            {props.showOrigins && props.explode > 0 && (
              <group raycast={() => null}>
                {meshes[slug]?.map((mesh) => (
                  <Tissue
                    key={mesh.name}
                    geometry={mesh.geometry}
                    bone={structure.category === 'bone'}
                    selected={false}
                    faded
                    slug={slug}
                    cuts={sectionPlanes(sectionFrame, props.inspection)}
                  />
                ))}
              </group>
            )}
            <group position={displacement}>
              <group
                onClick={select}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = '';
                }}
              >
                {meshes[slug]?.map((mesh) => (
                  <Tissue
                    key={mesh.name}
                    geometry={mesh.geometry}
                    bone={structure.category === 'bone'}
                    selected={selected}
                    faded={faded}
                    slug={slug}
                    shiftY={displacement.y}
                    cuts={cuts}
                    opacity={opacity}
                  />
                ))}
              </group>
              {props.showLabels &&
                !faded &&
                opacity >= 0.2 &&
                anchor &&
                end &&
                pointRetained(
                  new THREE.Vector3(...anchor).add(displacement),
                  cuts,
                ) && (
                  <group>
                    <Line
                      points={[anchor, end]}
                      color={selected ? '#84643b' : '#7d8077'}
                      lineWidth={0.8}
                      transparent
                      opacity={0.72}
                    />
                    <mesh position={anchor} raycast={() => null}>
                      <sphereGeometry args={[0.028, 8, 8]} />
                      <meshBasicMaterial color="#6d7168" />
                    </mesh>
                    <Html center position={end} zIndexRange={[3, 1]}>
                      <button
                        type="button"
                        className={`scene-label${selected ? ' selected' : ''}`}
                        onClick={() => props.onSelect(structure.id)}
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

class ModelBoundary extends Component<
  { children: ReactNode; onModelReady: (ready: boolean) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onModelReady(false);
  }
  render() {
    return this.state.failed ? (
      <Html center>
        <div className="model-loading">
          <p>
            The anatomy model could not load. Your view settings are retained.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              useGLTF.clear('/models/bodyparts3d/shoulder-right.glb');
              this.setState({ failed: false });
            }}
          >
            Retry shoulder anatomy
          </Button>
        </div>
      </Html>
    ) : (
      this.props.children
    );
  }
}

export function AnatomyScene(props: SceneProps) {
  const bounds = useMemo(() => {
    const box = new THREE.Box3();
    for (const structure of props.structures.filter((s) =>
      isVisible(s, props),
    )) {
      const slug = structure.id.split(':').at(-1)!;
      const offset = shoulderOffset(
        slug,
        props.explode,
        props.anchorSkeleton && structure.category === 'bone',
      );
      for (const part of manifest.parts.filter(
        (p) => p.structureId === structure.id,
      )) {
        const source = {
          min: [...part.bounds.min] as [number, number, number],
          max: [...part.bounds.max] as [number, number, number],
        };
        source.min[1] = Math.max(-3.15, source.min[1]);
        box.union(translatedBox(source, offset));
        if (props.showOrigins) box.union(translatedBox(source));
      }
    }
    if (box.isEmpty())
      box.set(new THREE.Vector3(-4, -3.15, -2), new THREE.Vector3(2, 2.5, 2));
    return box;
  }, [props]);
  return (
    <SceneRecovery
      className="shoulder-scene"
      cameraKey={[props.view, props.zoom, props.resetNonce, props.plate].join(
        '/',
      )}
      key={props.plate ? 'plate' : 'perspective'}
      onHealth={props.onRendererHealth}
      cameraCapture={props.cameraCapture}
      cameraRestore={props.cameraRestore}
    >
      {(onHealth) => (
        <Canvas
          orthographic={props.plate}
          shadows
          camera={{
            position: [1.85, 0.88, -12],
            fov: 39,
            near: 0.01,
            far: 150,
          }}
          dpr={[1, 1.8]}
          frameloop="demand"
          gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
        >
          <RendererMonitor onHealth={onHealth} />
          <ambientLight intensity={1.25} />
          <hemisphereLight args={['#ffffff', '#aa8d70', 1.3]} />
          <directionalLight
            position={[-4, 8, -6]}
            intensity={2.4}
            color="#fffaf1"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.025}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <directionalLight
            position={[3, 4, 6]}
            intensity={1.7}
            color="#fffef9"
          />
          <directionalLight
            position={[5, -1, -3]}
            intensity={0.5}
            color="#eef5ff"
          />
          <ModelBoundary onModelReady={props.onModelReady}>
            <Suspense
              fallback={
                <Html center>
                  <div className="model-loading">
                    Loading anatomical surfaces…
                  </div>
                </Html>
              }
            >
              <Model {...props} />
            </Suspense>
          </ModelBoundary>
          {props.syncPlane && (
            <group position={[-0.6, 0.2, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[7, 5]} />
                <meshBasicMaterial
                  color="#298879"
                  transparent
                  opacity={0.1}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              <Line
                points={[
                  [-3.5, 0, 0],
                  [3.5, 0, 0],
                ]}
                color="#298879"
                lineWidth={1}
              />
            </group>
          )}
          <FittedCamera
            bounds={bounds}
            direction={
              props.plate
                ? props.view === 'posterior'
                  ? [0, 0, -1]
                  : props.view === 'anterior'
                    ? [0, 0, 1]
                    : [-1, 0, 0]
                : views[props.view]
            }
            viewKey={props.view}
            zoom={props.zoom}
            reset={props.resetNonce}
            locked={props.plate}
            cameraCapture={props.cameraCapture}
            cameraRestore={props.cameraRestore}
          />
        </Canvas>
      )}
    </SceneRecovery>
  );
}
