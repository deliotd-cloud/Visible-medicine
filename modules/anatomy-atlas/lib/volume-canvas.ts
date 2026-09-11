import { renderReslice } from './volume-reslice';
import type { VolumeView } from './volume-comparison';

/** The canvas is owned by this renderer; clear it even when pixel generation fails. */
export function paintVolumeSlice(canvas: HTMLCanvasElement, view: VolumeView) {
  canvas.width = view.grid.width;
  canvas.height = view.grid.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D image rendering is unavailable');
  const pixels = context.createImageData(canvas.width, canvas.height);
  pixels.data.set(
    renderReslice(view.volume, view.grid, view.slice, view.window),
  );
  context.putImageData(pixels, 0, 0);
}
