'use client';
/* oxlint-disable react/react-compiler -- A frame callback synchronizes a read-only DOM label with the imperative camera. */
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { SourceCoordinates } from '@/lib/anatomy-coordinates';
import { cameraOrientation, orientationBasis, orientationText, type OrientationCode } from '@/lib/camera-orientation';

/** No extra animation loop, camera writes or React frame updates. The visual
 * label stays silent; the accessible direction changes only with the pose.
 * SceneRecovery hides this whole view when the renderer fails. */
export function SceneOrientation({ output, statusOutput, keyboardCameraFrom, coordinates, enabled }: {
  output: RefObject<HTMLSpanElement | null>;
  statusOutput?: RefObject<HTMLOutputElement | null>;
  keyboardCameraFrom?: RefObject<Vector3 | null>;
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
    if (keyboardCameraFrom) keyboardCameraFrom.current = null;
    if (statusOutput?.current?.textContent)
      statusOutput.current.textContent = 'View from: unavailable.';
    invalidate();
  }, [basis, enabled, output, statusOutput, keyboardCameraFrom, invalidate]);
  useFrame(({ camera }) => {
    const node = output.current;
    if (!enabled || !node) return;
    camera.getWorldDirection(from).negate();
    const codes = cameraOrientation(from, basis, previous.current);
    previous.current = codes;
    const text = orientationText(codes);
    if (node.textContent !== text) node.textContent = text;
    const status = statusOutput?.current;
    if (!status) return;
    const keyboardFrom = keyboardCameraFrom?.current;
    if (keyboardFrom && from.distanceToSquared(keyboardFrom) <= 1e-8) return;
    if (keyboardCameraFrom) keyboardCameraFrom.current = null;
    // An orbit gesture or preset invalidates keyboard-only angle details. Keep
    // the accessible direction in step with the actual camera, without a DOM
    // write or live announcement on every rendered frame.
    const statusText = `View from: ${text}.`;
    if (status.textContent !== statusText) status.textContent = statusText;
  });
  return null;
}
