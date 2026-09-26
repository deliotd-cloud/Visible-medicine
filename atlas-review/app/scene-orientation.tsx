'use client';
/* oxlint-disable react/react-compiler -- A frame callback synchronizes a read-only DOM label with the imperative camera. */
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { SourceCoordinates } from '@/atlas-review/lib/anatomy-coordinates';
import { cameraOrientation, orientationBasis, orientationText, type OrientationCode } from '@/atlas-review/lib/camera-orientation';

/** No extra animation loop, camera writes, React frame updates or live-region
 * announcements. SceneRecovery hides this whole view when the renderer fails. */
export function SceneOrientation({ output, coordinates, enabled }: {
  output: RefObject<HTMLSpanElement | null>;
  coordinates: SourceCoordinates;
  enabled: boolean;
}) {
  const basis = useMemo(() => orientationBasis(coordinates), [coordinates]);
  const from = useMemo(() => new Vector3(), []);
  const previous = useRef<OrientationCode[]>([]);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    previous.current = [];
    if (output.current) output.current.textContent = 'unavailable';
    invalidate();
  }, [basis, enabled, output, invalidate]);
  useFrame(({ camera }) => {
    const node = output.current;
    if (!enabled || !node) return;
    camera.getWorldDirection(from).negate();
    const codes = cameraOrientation(from, basis, previous.current);
    previous.current = codes;
    const text = orientationText(codes);
    if (node.textContent !== text) node.textContent = text;
  });
  return null;
}
