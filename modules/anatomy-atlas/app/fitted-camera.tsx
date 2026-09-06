'use client';
/* oxlint-disable react/react-compiler -- Three.js camera is an imperative external renderer, not React state. */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import { Box3, Vector3, PerspectiveCamera, OrthographicCamera } from 'three';
import { fitBounds } from '@/lib/explode-layout.mjs';

export function FittedCamera({
  bounds,
  direction,
  up = [0, 1, 0],
  viewKey,
  zoom,
  reset,
  locked = false,
}: {
  bounds: Box3;
  direction: number[];
  up?: number[];
  viewKey: string;
  zoom: number;
  reset: number;
  locked?: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<Controls>(null);
  const previous = useRef<{
    key: string;
    distance: number;
    zoom: number;
  } | null>(null);
  const key = `${viewKey}/${reset}/${locked}`;
  const dx = direction[0],
    dy = direction[1],
    dz = direction[2];
  const ux = up[0],
    uy = up[1],
    uz = up[2];
  useEffect(() => {
    const isPreset = previous.current?.key !== key;
    const orbit =
      !isPreset && controls.current
        ? camera.position.clone().sub(controls.current.target).normalize()
        : new Vector3(dx, dy, dz).normalize();
    if (isPreset) camera.up.set(ux, uy, uz);
    const fit = fitBounds(
      bounds,
      orbit,
      camera.up,
      size.width / Math.max(1, size.height),
      camera instanceof PerspectiveCamera ? camera.fov : 39,
    );
    const userZoom =
      !isPreset &&
      previous.current &&
      controls.current &&
      zoom === previous.current.zoom
        ? camera.position.distanceTo(controls.current.target) /
          previous.current.distance
        : zoom;
    const distance = fit.distance * userZoom;
    camera.position.copy(fit.center).addScaledVector(orbit, distance);
    camera.lookAt(fit.center);
    if (camera instanceof OrthographicCamera) {
      const aspect = size.width / Math.max(1, size.height),
        height = fit.halfHeight * zoom;
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
    controls.current?.target.copy(fit.center);
    controls.current?.update();
    previous.current = { key, distance: fit.distance, zoom };
    invalidate();
  }, [
    bounds,
    camera,
    size.width,
    size.height,
    key,
    zoom,
    dx,
    dy,
    dz,
    ux,
    uy,
    uz,
    invalidate,
  ]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableRotate={!locked}
      enablePan={!locked}
      enableZoom={!locked}
      minDistance={0.1}
      maxDistance={500}
    />
  );
}
