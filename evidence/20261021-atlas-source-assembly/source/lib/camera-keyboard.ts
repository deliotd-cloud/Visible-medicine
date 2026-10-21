import { OrthographicCamera, Vector3, type Camera } from 'three';

type KeyboardZoomControls = {
  enabled: boolean;
  enableZoom?: boolean;
  enableDamping: boolean;
  target?: Vector3;
  minDistance?: number;
  maxDistance?: number;
  minZoom?: number;
  maxZoom?: number;
  update?(): unknown;
};

/** null: not a valid zoom action; false: consumed at a limit; true: changed.
 * Camera scale only, never source geometry or a physical measurement. */
function zoomFromKey(key: string, camera: Camera, controls: KeyboardZoomControls): boolean | null {
  const inward = key === '+' || key === '=';
  if ((!inward && key !== '-' && key !== '_') || !controls.enableZoom ||
      typeof controls.update !== 'function' || !controls.target) return null;
  const finite = (v: Vector3) => v.toArray().every(Number.isFinite);
  if (!finite(camera.position) || !finite(camera.up) || camera.up.lengthSq() === 0 || !finite(controls.target)) return null;
  const ortho = (camera as OrthographicCamera).isOrthographicCamera === true;
  const perspective = (camera as Camera & { isPerspectiveCamera?: boolean }).isPerspectiveCamera === true;
  if (ortho === perspective) return null;
  const view = camera as OrthographicCamera;
  if (!Number.isFinite(view.zoom) || view.zoom <= 0) return null;
  if (ortho && (![view.left, view.right, view.top, view.bottom].every(Number.isFinite) ||
      view.right <= view.left || view.top <= view.bottom)) return null;
  const offset = camera.position.clone().sub(controls.target);
  const current = ortho ? view.zoom : offset.length();
  if (!Number.isFinite(current) || current <= 0) return null;
  const min = ortho ? controls.minZoom ?? 0 : controls.minDistance ?? 0;
  const max = ortho ? controls.maxZoom ?? Infinity : controls.maxDistance ?? Infinity;
  if (!Number.isFinite(min) || min < 0 || typeof max !== 'number' || Number.isNaN(max) || max <= 0 || min > max) return null;
  const increase = ortho ? inward : !inward;
  const desired = current * (increase ? 1 / 0.85 : 0.85);
  // Do not reverse direction when a prior wheel gesture is beyond a limit.
  const next = increase ? Math.min(Math.max(current, max), desired)
    : Math.max(Math.min(current, Math.max(min, 1e-6)), desired);
  if (!Number.isFinite(next) || next <= 0) return null;
  if (Math.abs(next - current) < 1e-12) return false;
  const damping = controls.enableDamping;
  try {
    controls.enableDamping = false;
    if (ortho) { view.zoom = next; view.updateProjectionMatrix(); }
    else camera.position.copy(controls.target).add(offset.multiplyScalar(next / current));
    controls.update();
  } finally { controls.enableDamping = damping; }
  return true;
}

/** Camera-only keyboard input. Never changes anatomy, selection or study state. */
export interface KeyboardOrbitControls extends KeyboardZoomControls {
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
  getControls: () => KeyboardZoomControls & { enablePan: boolean; target: Vector3; update(): unknown } | null,
  onChange: () => void,
  zoomKeys = false,
): () => void {
  const panAttributes = {
    ...attributes,
    'aria-label': 'Pan structure tray',
    'aria-description': 'Arrow keys pan the tray. Hold Shift for fine pan. Tab moves to the next control. Use the existing zoom and view controls to zoom or reset.' + (zoomKeys ? ' Plus or equal zoom in; minus zooms out. Browser zoom shortcuts are not captured.' : ''),
    'aria-keyshortcuts': attributes['aria-keyshortcuts'] + (zoomKeys ? ' = -' : ''),
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
    if (!controls?.enabled) return;
    const zoom = zoomKeys ? zoomFromKey(event.key, camera, controls) : null;
    if (zoom !== null) { event.preventDefault(); event.stopPropagation(); if (zoom) onChange(); return; }
    if (!controls.enablePan) return;
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
  camera?: Camera,
): () => void {
  const owned = camera ? { ...attributes,
    'aria-description': attributes['aria-description'] + ' Plus or equal zoom in; minus zooms out. Browser zoom shortcuts are not captured.',
    'aria-keyshortcuts': attributes['aria-keyshortcuts'] + ' = -',
  } : attributes;
  const previous = Object.fromEntries(Object.keys(owned).map(key => [key, surface.getAttribute(key)]));
  for (const [key, value] of Object.entries(owned)) surface.setAttribute(key, value);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
        event.target !== surface || surface.ownerDocument.activeElement !== surface) return;
    const controls = getControls();
    if (!controls?.enabled) return;
    const zoom = camera ? zoomFromKey(event.key, camera, controls) : null;
    if (zoom !== null) { event.preventDefault(); event.stopPropagation(); if (zoom) onChange(); return; }
    if (!controls.enableRotate) return;
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
    for (const [key, value] of Object.entries(owned)) {
      // Do not undo a later owner's intentional DOM change.
      if (surface.getAttribute(key) !== value) continue;
      if (previous[key] === null) surface.removeAttribute(key);
      else surface.setAttribute(key, previous[key]);
    }
  };
}
