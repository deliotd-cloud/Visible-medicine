'use client';

import { useEffect, useRef, useState } from 'react';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { AnatomyCanvas } from './anatomy-canvas';
import { bindCameraKeyboard } from '../lib/camera-keyboard';
import { createProstateSectionGeometry, createProstateZoneGeometries } from '../lib/prostate-zone-geometry';
import { PROSTATE_ZONE_REVISION, prostateZones, type ProstateZoneKey } from '../lib/prostate-zones';
import type { BodyCatalog, BodyStructure } from './body-types';
import { useProstateEducationLink } from './prostate-education-link';
import { ImagingLink } from './imaging-link';
import { ProstateMriTeaching } from './prostate-mri-teaching';
import './prostate-zones.css';

type View = 'anterior' | 'posterior' | 'axial' | 'superior';
type ZoneGeometries = Record<ProstateZoneKey, THREE.BufferGeometry>;
const zoneKeys: ProstateZoneKey[] = ['peripheral', 'transition', 'central', 'stroma'];
const cameraPosition: Record<View, [number, number, number]> = {
  anterior: [0, 0.1, 3.4],
  posterior: [0, 0.1, -3.4],
  axial: [0, -3.2, 0.01],
  superior: [1.5, 2.3, 2.1],
};

function useZoneGeometries() {
  const [geometry, setGeometry] = useState<ZoneGeometries | null>(null);
  useEffect(() => {
    const owned = createProstateZoneGeometries();
    for (const key of zoneKeys) owned[key].computeBoundingBox();
    setGeometry(owned);
    return () => { for (const key of zoneKeys) owned[key].dispose(); };
  }, []);
  return geometry;
}

function useSectionGeometries(enabled: boolean, level: number) {
  const [section, setSection] = useState<{ level: number; geometry: ZoneGeometries } | null>(null);
  useEffect(() => {
    if (!enabled) { setSection(null); return; }
    const geometry = Object.fromEntries(zoneKeys.map(key =>
      [key, createProstateSectionGeometry(key, level)])) as ZoneGeometries;
    for (const key of zoneKeys) geometry[key].computeBoundingBox();
    setSection({ level, geometry });
    return () => { for (const key of zoneKeys) geometry[key].dispose(); };
  }, [enabled, level]);
  return enabled && section?.level === level ? section.geometry : null;
}

function PresetCamera({ view, reset, motionEpoch, onSettled }: {
  view: View; reset: number; motionEpoch: { current: number }; onSettled: () => void;
}) {
  const { camera, controls, invalidate } = useThree();
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const motion = useRef<{
    epoch: number; elapsed: number; duration: number;
    start: THREE.Vector3; target: THREE.Vector3;
    from: THREE.Quaternion; to: THREE.Quaternion;
    up: THREE.Vector3; targetUp: THREE.Vector3;
    turn: THREE.Quaternion;
  } | null>(null);
  useEffect(() => {
    const target = new THREE.Vector3(...cameraPosition[view]);
    const targetUp = new THREE.Vector3(0, view === 'axial' ? 0 : 1,
      view === 'axial' ? 1 : 0);
    const look = new THREE.Matrix4().lookAt(target, new THREE.Vector3(), targetUp);
    const to = new THREE.Quaternion().setFromRotationMatrix(look);
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    orbit?.target?.set(0, 0, 0);
    const reduced = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      motion.current = null;
      camera.position.copy(target); camera.up.copy(targetUp); camera.quaternion.copy(to);
      orbit?.update?.();
      settled.current();
    } else {
      const start = camera.position.clone();
      const fromDirection = start.clone().normalize();
      const toDirection = target.clone().normalize();
      motion.current = {
        epoch: motionEpoch.current, elapsed: 0, duration: 0.82, start, target,
        from: camera.quaternion.clone(), to, up: camera.up.clone(), targetUp,
        turn: new THREE.Quaternion().setFromUnitVectors(fromDirection, toDirection),
      };
    }
    invalidate();
    return () => { motion.current = null; };
  }, [camera, controls, invalidate, view, reset, motionEpoch]);
  useFrame((_, delta) => {
    const active = motion.current;
    if (!active) return;
    if (active.epoch !== motionEpoch.current) { motion.current = null; return; }
    active.elapsed += Math.min(delta, 0.1);
    const t = Math.min(1, active.elapsed / active.duration);
    const eased = t * t * (3 - 2 * t);
    const direction = active.start.clone().normalize().applyQuaternion(
      new THREE.Quaternion().identity().slerp(active.turn, eased));
    camera.position.copy(direction.multiplyScalar(THREE.MathUtils.lerp(active.start.length(), active.target.length(), eased)));
    camera.quaternion.copy(active.from).slerp(active.to, eased);
    camera.up.copy(active.up).lerp(active.targetUp, eased).normalize();
    if (t === 1) {
      camera.position.copy(active.target); camera.up.copy(active.targetUp);
      const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
      orbit?.target?.set(0, 0, 0); orbit?.update?.();
      camera.quaternion.copy(active.to);
      motion.current = null;
      settled.current();
    } else invalidate();
  });
  return null;
}

function LocalClipping() {
  const { gl } = useThree();
  useEffect(() => {
    const previous = gl.localClippingEnabled;
    gl.localClippingEnabled = true;
    return () => { gl.localClippingEnabled = previous; };
  }, [gl]);
  return null;
}

function ZonalScene({
  geometry, section, selected, isolated, labels, cutaway, level, explode, view, reset, motionEpoch, onManualOrbit, onPresetSettled, onSelect,
}: {
  geometry: ZoneGeometries;
  section: ZoneGeometries | null;
  selected: ProstateZoneKey;
  isolated: boolean;
  labels: boolean;
  cutaway: boolean;
  level: number;
  explode: number;
  view: View;
  reset: number;
  motionEpoch: { current: number };
  onManualOrbit: () => void;
  onPresetSettled: () => void;
  onSelect: (key: ProstateZoneKey) => void;
}) {
  const controls = useRef<Controls>(null);
  const manualOrbit = useRef(onManualOrbit);
  manualOrbit.current = onManualOrbit;
  const { gl, camera, invalidate } = useThree();
  useEffect(() => bindCameraKeyboard(gl.domElement, () => controls.current, () => {
    // Keyboard inspection cancels a preset sweep and its orientation markers,
    // just as dragging does. Keep the listener stable across zone selection.
    manualOrbit.current();
    invalidate();
  }, camera), [gl, camera, invalidate]);
  const offsets: Record<ProstateZoneKey, [number, number, number]> = {
    peripheral: [0, 0, -0.28 * explode],
    transition: [0, 0, 0.15 * explode],
    central: [0, view === 'axial' ? 0 : 0.2 * explode, -0.04 * explode],
    stroma: [0, 0, 0.36 * explode],
  };
  return <>
    <color attach="background" args={['#f7f7f1']} />
    <ambientLight intensity={1.65} />
    <directionalLight position={[3, 5, 6]} intensity={2.3} color="#ffffff" />
    <directionalLight position={[-4, -2, -4]} intensity={0.8} color="#94c8be" />
    <PresetCamera view={view} reset={reset} motionEpoch={motionEpoch} onSettled={onPresetSettled} />
    <LocalClipping />
    <OrbitControls ref={controls} makeDefault enableDamping={false} minDistance={2.4} maxDistance={7} enablePan={false}
      onStart={onManualOrbit} />
    {prostateZones.map(zone => {
      if (isolated && zone.key !== selected) return null;
      const active = zone.key === selected;
      const bounds = geometry[zone.key].boundingBox;
      const center = bounds?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();
      const offset = offsets[zone.key];
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), level + offset[1]);
      const sectionPart = section?.[zone.key];
      const hasSection = !!sectionPart && sectionPart.getAttribute('position').count > 0;
      const sectionCenter = hasSection
        ? sectionPart.boundingBox!.getCenter(new THREE.Vector3()) : null;
      const labelOffsets: Record<ProstateZoneKey, [number, number, number]> = {
        peripheral: [-1.1, 0.1, -0.3],
        transition: [1.1, 0.25, 0.05],
        central: [-0.75, 0.4, -0.75],
        stroma: [-0.7, 0.75, 0.35],
      };
      const axialLabelOffsets: Record<ProstateZoneKey, [number, number, number]> = {
        peripheral: [-0.42, 0, -0.32],
        transition: [0.42, 0, -0.12],
        central: [-0.35, 0, 0.35],
        stroma: [0.35, 0, 0.35],
      };
      const anchor = cutaway && sectionCenter ? sectionCenter : center;
      const label = anchor.clone().add(new THREE.Vector3(...(view === 'axial' ? axialLabelOffsets[zone.key] : labelOffsets[zone.key])));
      return <group key={zone.key} position={offsets[zone.key]}>
        {view !== 'axial' && <mesh geometry={geometry[zone.key]} dispose={null}
          onClick={event => {
            // Three raycasting includes surfaces discarded by material clipping.
            // Let the visible cap or another visible zone receive those hits.
            if (cutaway && plane.distanceToPoint(event.point) < -1e-6) return;
            event.stopPropagation(); onSelect(zone.key);
          }}
          onPointerOver={event => {
            if (cutaway && plane.distanceToPoint(event.point) < -1e-6) return;
            event.stopPropagation(); document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => { document.body.style.cursor = ''; }}>
          <meshStandardMaterial color={zone.color} roughness={0.72} metalness={0}
            side={THREE.FrontSide} clippingPlanes={cutaway ? [plane] : []}
            emissive={active ? '#164c47' : '#000000'} emissiveIntensity={active ? 0.12 : 0}
            polygonOffset polygonOffsetFactor={zoneKeys.indexOf(zone.key) * 0.1}
            polygonOffsetUnits={zoneKeys.indexOf(zone.key) * 0.1} />
        </mesh>}
        {cutaway && sectionPart && hasSection && <mesh geometry={sectionPart} dispose={null} renderOrder={2}
          onClick={event => { event.stopPropagation(); onSelect(zone.key); }}>
          <meshStandardMaterial color={zone.color} side={THREE.DoubleSide} roughness={0.87}
            emissive={active ? '#175c5b' : '#000000'} emissiveIntensity={active ? 0.13 : 0} />
        </mesh>}
        {labels && (cutaway ? hasSection : true) && <>
          <Line points={[anchor.toArray(), label.toArray()]} color="#376e67"
            transparent opacity={0.56} lineWidth={1} raycast={() => null} />
          <Html position={label.toArray()} center distanceFactor={2.8}
            style={{ pointerEvents: 'none' }}>
            <span className={`prostate-zone-label${active ? ' is-selected' : ''}`}>{zone.shortLabel}</span>
          </Html>
        </>}
      </group>;
    })}
  </>;
}

/** Local, illustrative anatomy. Selection has no scan registration or approval effect. */
export function ProstateZones({ onClose, catalog, parent }: { onClose: () => void; catalog?: BodyCatalog; parent: BodyStructure }) {
  const studyRegion = useRef<HTMLElement>(null);
  useEffect(() => { studyRegion.current?.focus({ preventScroll: true }); }, []);
  const [selected, setSelected] = useState<ProstateZoneKey>('peripheral');
  const [isolated, setIsolated] = useState(false);
  const [labels, setLabels] = useState(true);
  const [view, setView] = useState<View>('superior');
  const [cutaway, setCutaway] = useState(true);
  const [level, setLevel] = useState(0);
  const [explode, setExplode] = useState(0);
  const [reset, setReset] = useState(0);
  const [presetValid, setPresetValid] = useState(false);
  const motionEpoch = useRef(0);
  const sectionControl = useRef<HTMLInputElement>(null);
  const [graphicsFailed, setGraphicsFailed] = useState(false);
  const geometry = useZoneGeometries();
  const section = useSectionGeometries(cutaway, level);
  const currentZone = prostateZones.find(zone => zone.key === selected)!;
  // Inspect the rendered section, rather than inferring visibility from a
  // named apical/basal band. A section still being prepared is not empty.
  const selectedSectionMissing = view === 'axial' && !graphicsFailed &&
    section !== null && section[selected].getAttribute('position').count === 0;
  const imagingLink = useProstateEducationLink({catalog,parent,disabled:graphicsFailed,onSelect:id=>{
    const zone=prostateZones.find(item=>item.id===id);
    if(zone)setSelected(zone.key); // Incoming image selection must not echo back.
  }});
  const choose = (key: ProstateZoneKey) => {
    setSelected(key);
    const zone=prostateZones.find(item=>item.key===key);
    if(zone)imagingLink.publish(zone.id);
  };
  const chooseView = (next: View) => {
    setView(next); setPresetValid(false); setReset(value => value + 1);
    if (next === 'superior' || next === 'axial') setCutaway(true);
  };
  const manualOrbit = () => { motionEpoch.current++; setPresetValid(false); };
  const resetView = () => {
    choose('peripheral'); setIsolated(false); setLabels(true);
    setView('superior'); setCutaway(true); setLevel(0); setExplode(0);
    setPresetValid(false);
    setReset(value => value + 1);
  };

  return <section ref={studyRegion} className="atlas-inline-study prostate-zones" role="region" tabIndex={-1}
    data-study-surface="inline" aria-labelledby="prostate-zones-title"
    onKeyDown={event => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.stopPropagation();
        onClose();
      }
    }}>
    <header className="prostate-zones-header">
      <div><p className="prostate-zones-eyebrow">Illustrative zonal anatomy · Draft</p>
        <h2 id="prostate-zones-title">Explore the prostate zones</h2>
        <p>A local schematic for learning zonal orientation before reviewing prostate MRI.</p></div>
      <button type="button" className="prostate-zones-close" onClick={onClose}>Back to atlas</button>
    </header>
    <div className="prostate-zones-workbench">
      <div className="prostate-zones-main">
        <div className="prostate-zones-toolbar" aria-label="Prostate zone controls">
          <div className="prostate-zones-picks" role="group" aria-label="Select a zone">
            {prostateZones.map(zone => <button key={zone.key} type="button"
              className={selected === zone.key ? 'is-selected' : ''}
              aria-label={`${zone.shortLabel} ${zone.name}`} aria-pressed={selected === zone.key} onClick={() => choose(zone.key)}>
              <span className="prostate-zones-swatch" style={{ backgroundColor: zone.color }} aria-hidden="true" />
              {zone.shortLabel}<span className="prostate-zones-button-name"> {zone.name}</span>
            </button>)}
          </div>
          <div className="prostate-zones-actions">
            <button type="button" aria-pressed={isolated} onClick={() => setIsolated(value => !value)}>{isolated ? 'Show all zones' : 'Isolate selected'}</button>
            <button type="button" aria-pressed={labels} onClick={() => setLabels(value => !value)}>{labels ? 'Hide labels' : 'Show labels'}</button>
            <button type="button" onClick={resetView}>Reset</button>
          </div>
        </div>
        <div className="prostate-zones-canvas" role="group" aria-label="Interactive illustrative three dimensional prostate zones">
          {graphicsFailed ? <p role="alert" className="prostate-zones-canvas-fallback">The 3D view is unavailable. Select a zone above to read its anatomy and MRI orientation below.</p>
            : geometry ? <AnatomyCanvas frameloop="demand" dpr={[1, 1.5]}
              gl={{ antialias: true }}
              camera={{ position: cameraPosition[view], fov: 38, near: 0.1, far: 100 }}
              onFailure={() => setGraphicsFailed(true)}>
              <ZonalScene geometry={geometry} section={section} selected={selected}
                isolated={isolated} labels={labels} cutaway={cutaway} level={level}
                explode={explode} view={view} reset={reset} motionEpoch={motionEpoch}
                onManualOrbit={manualOrbit} onPresetSettled={() => setPresetValid(true)} onSelect={choose} />
            </AnatomyCanvas> : <p className="prostate-zones-canvas-fallback">Preparing the zonal illustration…</p>}
          {view === 'axial' && presetValid && !graphicsFailed && <div className="prostate-zones-orientation" aria-label="Axial view from the feet: anterior at top, patient right at left, patient left at right, posterior at bottom">
            <span className="top">A</span><span className="left">R</span><span className="right">L</span><span className="bottom">P</span>
          </div>}
          {view === 'superior' && presetValid && !graphicsFailed && <p className="prostate-zones-view-note">Oblique 3D cutaway · drag to rotate</p>}
          {selectedSectionMissing && <div className="prostate-zones-section-notice">
            <p role="status">{currentZone.name} is not visible at this illustrative section level.</p>
            <button type="button" onClick={() => {
              setLevel(0);
              sectionControl.current?.focus({ preventScroll: true });
            }}>Show at mid-gland</button>
          </div>}
        </div>
        <p className="prostate-zones-keyboard-help">Focus the model to use arrow keys to rotate and + / − to zoom. Hold Shift for finer rotation; Tab moves to the next control.</p>
        <div className="prostate-zones-view-controls">
          <div role="group" aria-label="View direction">
            {(['anterior', 'posterior', 'axial', 'superior'] as const).map(value => <button key={value} type="button"
              aria-pressed={view === value && presetValid} onClick={() => chooseView(value)}>{value === 'axial' ? 'Axial section' : value === 'superior' ? '3D cutaway' : value[0].toUpperCase() + value.slice(1)}</button>)}
          </div>
          <label className="prostate-zones-check"><input type="checkbox" checked={cutaway}
            disabled={view === 'axial' || view === 'superior'}
            onChange={event => setCutaway(event.target.checked)} /> Axial cutaway</label>
          {cutaway && <label className="prostate-zones-slider">Illustrative section <input ref={sectionControl} type="range" min="-0.7" max="0.7" step="0.05" value={level}
            aria-valuetext={level <= -0.25 ? 'Apical' : level >= 0.25 ? 'Basal' : 'Mid-gland'}
            onChange={event => setLevel(Number(event.target.value))} /><output>{level <= -0.25 ? 'Apical' : level >= 0.25 ? 'Basal' : 'Mid-gland'}</output></label>}
          <label className="prostate-zones-slider">Separate zones <input type="range" min="0" max="1" step="0.1" value={explode}
            onChange={event => setExplode(Number(event.target.value))} /><output>{Math.round(explode * 100)}%</output></label>
        </div>
      </div>
      <aside className="prostate-zones-info">
        <div className="prostate-zones-selected-summary" aria-live="polite" aria-atomic="true">
        <p className="prostate-zones-info-label">Selected zone</p>
        <h3><span className="prostate-zones-info-swatch" style={{ backgroundColor: currentZone.color }} aria-hidden="true" />{currentZone.name}</h3>
        <p>{currentZone.anatomy}</p>
        </div>
        <h4>MRI orientation</h4><p>{currentZone.mri}</p>
        <ProstateMriTeaching key={selected} zone={selected} />
        <ImagingLink link={imagingLink} coordinateContext="none" />
        <p className="prostate-zones-limit">These shapes are an educational diagram. They are not segmented from an MRI, registered to a patient, or suitable for lesion localisation or clinical decisions.</p>
        <details><summary>Model identity and reference</summary>
          <dl><dt>Zone ID</dt><dd><code>{currentZone.id}</code></dd>
            <dt>Model revision</dt><dd><code>{PROSTATE_ZONE_REVISION}</code></dd></dl>
          <p>Illustrative geometry is separate from the BodyParts3D outer prostate surface. It has no MRI coordinate transform.</p>
          <a href="https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/PI-RADS" target="_blank" rel="noopener noreferrer">ACR PI-RADS resources ↗</a>
        </details>
      </aside>
    </div>
  </section>;
}

export default ProstateZones;
