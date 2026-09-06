import type { StudyCamera } from './study-views';

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
    if (!active || next === health) return;
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
    frame() {
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
