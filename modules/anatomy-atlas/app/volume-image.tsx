'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { comparisonBridge } from '@/lib/imaging-comparison';
import { imagingBridge } from '@/lib/imaging-sync';
import {
  connectVolumeComparison,
  type VolumeComparisonOptions,
  type VolumeView,
} from '@/lib/volume-comparison';
import { paintVolumeSlice } from '@/lib/volume-canvas';
import { validateWindow, type ImageWindow } from '@/lib/volume-reslice';
import './volume-image.css';

export function VolumeImage({ view }: { view: VolumeView }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const id = useId();
  const [window, setWindow] = useState(view.window);
  const [center, setCenter] = useState(String(view.window.center));
  const [width, setWidth] = useState(String(view.window.width));
  const [error, setError] = useState('');
  const [renderError, setRenderError] = useState(false);
  const { grid } = view;
  const apply = (value: ImageWindow) => {
    try {
      validateWindow(value);
      if (!view.setWindow(value)) return;
      setWindow(value);
      setCenter(String(value.center));
      setWidth(String(value.width));
      setError('');
    } catch {
      setError(
        'Enter a finite level and positive width (at least 1 for LINEAR).',
      );
    }
  };
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    try {
      paintVolumeSlice(target, { ...view, window });
      setRenderError(false);
    } catch {
      target.width = 0;
      target.height = 0;
      setRenderError(true);
    }
    return () => {
      target.width = 0;
      target.height = 0;
    };
  }, [view, window]);
  return (
    <div className="vm-volume-image">
      <div
        className="vm-volume-frame"
        style={{
          aspectRatio: `${grid.width} / ${grid.height}`,
          width: `min(100%, calc(55dvh * ${grid.width / grid.height}))`,
        }}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={`${grid.plane} reformatted teaching image. Left ${grid.labels[0]}, right ${grid.labels[1]}, top ${grid.labels[2]}, bottom ${grid.labels[3]}.`}
        />
        {!renderError && (
          <div aria-hidden="true" className="vm-volume-orientation">
            {grid.labels.map((label, i) => (
              <span key={i} data-edge={['left', 'right', 'top', 'bottom'][i]}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      {renderError && (
        <p role="alert">
          This image could not be rendered. No substitute is shown.
        </p>
      )}
      <p className="vm-volume-spacing">
        Reformatted · {grid.pixelSpacing.toFixed(2)} mm/pixel ·{' '}
        {view.volume.units === 'HU' ? 'HU' : 'relative intensity'}
      </p>
      <details>
        <summary>Window / level</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!center.trim() || !width.trim()) {
              setError('Enter both level and width.');
              return;
            }
            apply({ ...window, center: Number(center), width: Number(width) });
          }}
        >
          <label htmlFor={`${id}-level`}>
            Level
            <input
              id={`${id}-level`}
              type="number"
              step="any"
              required
              value={center}
              onChange={(e) => setCenter(e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-width`}>
            Width
            <input
              id={`${id}-width`}
              type="number"
              step="any"
              min={window.function === 'LINEAR' ? 1 : undefined}
              required
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </label>
          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={window.inverted}
            onClick={() => apply({ ...window, inverted: !window.inverted })}
          >
            Invert
          </Button>
        </form>
        {error && <p role="alert">{error}</p>}
      </details>
    </div>
  );
}

/** Explicit host call only: importing this module does not connect any image resource. */
export function installVolumeViewer(
  options: Omit<VolumeComparisonOptions, 'imaging' | 'comparison' | 'mount'>,
) {
  return connectVolumeComparison({
    ...options,
    imaging: imagingBridge,
    comparison: comparisonBridge,
    mount(element, view) {
      const root = createRoot(element);
      root.render(<VolumeImage view={view} />);
      return () => root.unmount();
    },
  });
}
