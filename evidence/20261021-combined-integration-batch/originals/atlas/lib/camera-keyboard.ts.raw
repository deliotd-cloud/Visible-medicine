import { OrthographicCamera, Vector3 } from 'three';

/** Camera-only keyboard input. Never changes anatomy, selection or study state. */
export interface KeyboardOrbitControls {
  enabled: boolean;
  enableRotate: boolean;
  enableDamping: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
  getPolarAngle(): number;
  getAzimuthalAngle(): number;
  setPolarAngle(value: number): void;
  setAzimuthalAngle(value: number): void;
}

/** Translate a tray in its screen plane without changing its named projection. */
export function bindCameraPanKeyboard(
  surface: HTMLCanvasElement,
  camera: OrthographicCamera,
  getControls: () => { enabled: boolean; enablePan: boolean; enableDamping: boolean; target: Vector3; update(): unknown } | null,
  onChange: () => void,
): () => void {
  const panAttributes = {
    ...attributes,
    'aria-label': 'Pan structure tray',
    'aria-description': 'Arrow keys pan the tray. Hold Shift for fine pan. Tab moves to the next control. Use the existing zoom and view controls to zoom or reset.',
    'data-keyboard-rotation': undefined,
    'data-keyboard-pan': 'true',
  };
  const owned = Object.entries(panAttributes).filter((entry): entry is [string, string] => entry[1] !== undefined);
  const previous = Object.fromEntries(owned.map(([key]) => [key, surface.getAttribute(key)]));
  for (const [key, value] of owned) surface.setAttribute(key, value);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
        event.target !== surface || surface.ownerDocument.activeElement !== surface) return;
    const controls = getControls();
    if (!controls?.enabled || !controls.enablePan) return;
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!horizontal && !vertical) return;
    const extent = (horizontal ? camera.right - camera.left : camera.top - camera.bottom) / camera.zoom;
    if (!Number.isFinite(extent) || extent <= 0 || !Number.isFinite(camera.zoom) || camera.zoom <= 0) return;
    camera.updateMatrixWorld();
    const offset = new Vector3().setFromMatrixColumn(camera.matrixWorld, horizontal ? 0 : 1);
    const sign = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1;
    offset.multiplyScalar(sign * extent * (event.shiftKey ? 0.01 : 0.05));
    if (!offset.toArray().every(Number.isFinite)) return;
    event.preventDefault();
    event.stopPropagation();
    const damping = controls.enableDamping;
    try {
      controls.enableDamping = false;
      camera.position.add(offset);
      controls.target.add(offset);
      controls.update();
    } finally {
      controls.enableDamping = damping;
    }
    onChange();
  };
  surface.addEventListener('keydown', onKeyDown);
  return () => {
    surface.removeEventListener('keydown', onKeyDown);
    for (const [key, value] of owned) {
      if (surface.getAttribute(key) !== value) continue;
      if (previous[key] === null) surface.removeAttribute(key);
      else surface.setAttribute(key, previous[key]);
    }
  };
}

const attributes = {
  tabindex: '0',
  role: 'group',
  'aria-label': 'Rotate 3D model',
  'aria-description': 'Arrow keys rotate the view. Hold Shift for fine rotation. Tab moves to the next control. Use the existing zoom and view controls to zoom or reset.',
  'aria-keyshortcuts': 'ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown',
  'data-keyboard-rotation': 'true',
} as const;

export function bindCameraKeyboard(
  surface: HTMLCanvasElement,
  getControls: () => KeyboardOrbitControls | null,
  onChange: () => void,
): () => void {
  const previous = Object.fromEntries(Object.keys(attributes).map(key => [key, surface.getAttribute(key)]));
  for (const [key, value] of Object.entries(attributes)) surface.setAttribute(key, value);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
        event.target !== surface || surface.ownerDocument.activeElement !== surface) return;
    const controls = getControls();
    if (!controls?.enabled || !controls.enableRotate) return;
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!horizontal && !vertical) return;
    const current = horizontal ? controls.getAzimuthalAngle() : controls.getPolarAngle();
    const min = horizontal ? controls.minAzimuthAngle : Math.max(1e-4, controls.minPolarAngle);
    const max = horizontal ? controls.maxAzimuthAngle : Math.min(Math.PI - 1e-4, controls.maxPolarAngle);
    if (!Number.isFinite(current) || Number.isNaN(min) || Number.isNaN(max) || min > max) return;
    const sign = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const next = Math.max(min, Math.min(max, current + sign * (event.shiftKey ? 2 : 10) * Math.PI / 180));
    if (!Number.isFinite(next)) return;
    event.preventDefault(); // Only the focused model consumes rotation arrows.
    event.stopPropagation();
    if (Math.abs(next - current) < 1e-10) return; // A clamped key did not rotate the view.
    const damping = controls.enableDamping;
    try {
      // Keyboard steps are immediate, including with reduced-motion preferences.
      controls.enableDamping = false;
      if (horizontal) controls.setAzimuthalAngle(next);
      else controls.setPolarAngle(next);
    } finally {
      controls.enableDamping = damping;
    }
    onChange();
  };
  surface.addEventListener('keydown', onKeyDown);
  return () => {
    surface.removeEventListener('keydown', onKeyDown);
    for (const [key, value] of Object.entries(attributes)) {
      // Do not undo a later owner's intentional DOM change.
      if (surface.getAttribute(key) !== value) continue;
      if (previous[key] === null) surface.removeAttribute(key);
      else surface.setAttribute(key, previous[key]);
    }
  };
}
