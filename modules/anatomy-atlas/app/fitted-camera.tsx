'use client';
/* oxlint-disable react/react-compiler -- Three.js camera is an imperative external renderer, not React state. */
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import { Box3, Vector3, PerspectiveCamera, OrthographicCamera } from 'three';
import { fitBounds } from '@/lib/explode-layout.mjs';
import {
  captureStudyCamera,
  restoreStudyCamera,
  planarStudyCamera,
  relativeStudyScale,
} from '@/lib/study-camera';
import type { StudyCamera } from '@/lib/study-views';
import { steppedCameraScale } from '@/lib/camera-zoom';

export function FittedCamera({
  bounds,
  direction,
  up = [0, 1, 0],
  viewKey,
  zoom,
  zoomStep = 0,
  fitOccupancy = [0.7, 0.7],
  reset,
  locked = false,
  planar = false,
  recenterKey = '',
  cameraCapture,
  cameraRestore,
}: {
  bounds: Box3;
  direction: number[];
  up?: number[];
  viewKey: string;
  zoom: number;
  zoomStep?: number;
  fitOccupancy?: [number, number];
  reset: number;
  locked?: boolean;
  planar?: boolean;
  recenterKey?: string;
  cameraCapture?: RefObject<StudyCamera | null>;
  cameraRestore?: RefObject<StudyCamera | null>;
}) {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<Controls>(null);
  const previous = useRef<{
    key: string;
    bounds: Box3;
    aspect: number;
    fov: number;
    occupancy: [number, number];
    recenterKey: string;
    zoom: number;
    zoomStep: number;
    center: Vector3;
  } | null>(null);
  const key = `${viewKey}/${reset}/${locked}/${planar}`;
  const dx = direction[0],
    dy = direction[1],
    dz = direction[2];
  const ux = up[0],
    uy = up[1],
    uz = up[2];
  const aspect = size.width / Math.max(1, size.height);
  const [horizontalFill, verticalFill] = fitOccupancy;
  const fov = camera instanceof PerspectiveCamera ? camera.fov : 39;
  const capture = useCallback(() => {
    if (
      cameraCapture &&
      controls.current &&
      (camera instanceof PerspectiveCamera ||
        camera instanceof OrthographicCamera)
    )
      cameraCapture.current = captureStudyCamera(
        camera,
        controls.current.target,
        bounds,
        size.width / Math.max(1, size.height),
      );
  }, [cameraCapture, camera, bounds, size.width, size.height]);
  useEffect(() => {
    if (
      cameraRestore?.current &&
      (camera instanceof PerspectiveCamera ||
        camera instanceof OrthographicCamera)
    ) {
      const restored = restoreStudyCamera(
        camera,
        bounds,
        size.width / Math.max(1, size.height),
        planar
          ? planarStudyCamera(cameraRestore.current, [dx, dy, dz], [ux, uy, uz])
          : cameraRestore.current,
      );
      cameraRestore.current = null;
      controls.current?.target.copy(restored.target);
      controls.current?.update();
      previous.current = {
        key,
        bounds: bounds.clone(),
        aspect,
        fov,
        occupancy: [horizontalFill, verticalFill],
        recenterKey,
        zoom,
        zoomStep,
        center: bounds.getCenter(new Vector3()),
      };
      capture();
      invalidate();
      return;
    }
    const isPreset = previous.current?.key !== key;
    const isRecenter = previous.current?.recenterKey !== recenterKey;
    const orbit =
      !isPreset && controls.current
        ? camera.position.clone().sub(controls.current.target).normalize()
        : new Vector3(dx, dy, dz).normalize();
    if (isPreset) camera.up.set(ux, uy, uz);
    const fit = fitBounds(
      bounds,
      orbit,
      camera.up,
      aspect,
      fov,
      [horizontalFill, verticalFill],
    );
    const retainZoom =
      !isPreset &&
      !isRecenter &&
      previous.current &&
      controls.current &&
      zoom === previous.current.zoom
        ? previous.current
        : null;
    // Wheel/orbit gestures change the live camera between React effects.
    // Re-evaluate the PREVIOUS geometry/viewport in the CURRENT orbit so an
    // orientation change is not mistaken for zoom. Only genuine bounds or
    // viewport changes should adapt the framing on the next effect.
    const priorFit = retainZoom
      ? fitBounds(retainZoom.bounds, orbit, camera.up, retainZoom.aspect, retainZoom.fov, retainZoom.occupancy)
      : null;
    const retainedScale =
      priorFit && controls.current
        ? relativeStudyScale(
            camera as PerspectiveCamera | OrthographicCamera,
            controls.current.target,
            priorFit.distance,
            priorFit.halfHeight,
          )
        : zoom;
    const stepDelta = !isPreset && !isRecenter && previous.current
      ? zoomStep - previous.current.zoomStep : 0;
    const userZoom = steppedCameraScale(retainedScale, stepDelta);
    const distance =
      camera instanceof OrthographicCamera
        ? priorFit && controls.current
          ? camera.position.distanceTo(controls.current.target) * fit.distance / priorFit.distance
          : fit.distance
        : fit.distance * userZoom;
    const target = fit.center.clone();
    if (!isPreset && !isRecenter && previous.current && controls.current)
      target.add(controls.current.target.clone().sub(previous.current.center));
    camera.position.copy(target).addScaledVector(orbit, distance);
    camera.lookAt(target);
    if (camera instanceof OrthographicCamera) {
      const aspect = size.width / Math.max(1, size.height),
        height = fit.halfHeight * userZoom;
      camera.zoom = 1;
      camera.left = -height * aspect;
      camera.right = height * aspect;
      camera.top = height;
      camera.bottom = -height;
    }
    if (
      camera instanceof PerspectiveCamera ||
      camera instanceof OrthographicCamera
    ) {
      camera.near = 0.01;
      camera.far = Math.max(
        150,
        distance + bounds.getSize(new Vector3()).length() * 4,
      );
      camera.updateProjectionMatrix();
    }
    controls.current?.target.copy(target);
    controls.current?.update();
    previous.current = {
      key,
      bounds: bounds.clone(),
      aspect,
      fov,
      occupancy: [horizontalFill, verticalFill],
      recenterKey,
      zoom,
      zoomStep,
      center: fit.center,
    };
    capture();
    invalidate();
  }, [
    bounds,
    camera,
    size.width,
    size.height,
    key,
    zoom,
    zoomStep,
    dx,
    dy,
    dz,
    ux,
    uy,
    uz,
    invalidate,
    cameraRestore,
    capture,
    planar,
    recenterKey,
    aspect,
    fov,
    horizontalFill,
    verticalFill,
  ]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableRotate={!locked && !planar}
      enablePan={!locked}
      enableZoom={!locked}
      minDistance={0.1}
      maxDistance={Math.max(500, bounds.getSize(new Vector3()).length() * 20)}
      onChange={capture}
    />
  );
}
