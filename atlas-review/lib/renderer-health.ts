import type { StudyCamera } from './study-views';
import type { WebGLRenderer } from 'three';

export type RendererHealth =
  | 'starting'
  | 'ready'
  | 'lost'
  | 'restoring'
  | 'failed';
export const rendererReady = (health: RendererHealth) => health === 'ready';
export function copyRecoveryCamera(
  camera: StudyCamera | null,
): StudyCamera | null {
  if (!camera) return null;
  return {
    ...camera,
    direction: [...camera.direction],
    up: [...camera.up],
    pan: [...camera.pan],
  };
}

/** Observe only this live canvas; disposed observers cannot revive old scenes. */
export function observeRenderer(
  canvas: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  isContextLost: () => boolean,
  onHealth: (health: RendererHealth) => void,
  invalidate: () => void,
) {
  let active = true,
    health: RendererHealth = 'starting';
  const report = (next: RendererHealth) => {
    if (!active || health === 'failed' || next === health) return;
    health = next;
    onHealth(next);
  };
  const lost = (event: Event) => {
    if (!active) return;
    event.preventDefault(); // Allow the browser/Three.js restoration path.
    report('lost');
  };
  const restored = () => {
    if (!active || health !== 'lost') return;
    report('restoring');
    invalidate();
  };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  onHealth('starting');
  invalidate();
  return {
    fail(this: void) {
      report('failed');
    },
    frame(this: void) {
      if (!active || health === 'failed') return;
      try {
        if (isContextLost()) report('lost');
        else if (health === 'starting' || health === 'restoring')
          report('ready');
      } catch {
        report('failed');
      }
    },
    dispose() {
      active = false;
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    },
  };
}

/** Guard this renderer only; never consume unrelated window errors or promises. */
export function guardRenderer(
  renderer: Pick<WebGLRenderer, 'render' | 'debug'>,
  onFailure: () => void,
  onRendered: () => void,
) {
  const originalRender = renderer.render;
  const originalShaderError = renderer.debug.onShaderError;
  let active = true,
    failed = false;
  const fail = () => {
    if (!active || failed) return;
    failed = true;
    onFailure();
  };
  const render: WebGLRenderer['render'] = function (
    this: WebGLRenderer,
    scene,
    camera,
  ) {
    if (!active) return originalRender.call(this, scene, camera);
    if (failed) return;
    try {
      originalRender.call(this, scene, camera);
    } catch {
      fail();
      return;
    }
    // A shader callback can fail without render() throwing. Never announce ready
    // after that failure, even if the graphics context itself remains healthy.
    if (active && !failed) onRendered();
  };
  const shaderError: NonNullable<WebGLRenderer['debug']['onShaderError']> =
    function (this: WebGLRenderer['debug'], ...args) {
      if (!active) return originalShaderError?.apply(this, args);
      try {
        originalShaderError?.apply(this, args);
      } finally {
        fail();
      }
    };
  renderer.render = render;
  renderer.debug.onShaderError = shaderError;
  return {
    dispose() {
      active = false;
      // Do not overwrite a later owner's instrumentation during cleanup.
      if (renderer.render === render) renderer.render = originalRender;
      if (renderer.debug.onShaderError === shaderError)
        renderer.debug.onShaderError = originalShaderError;
    },
  };
}
