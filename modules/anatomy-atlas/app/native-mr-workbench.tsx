'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LOCAL_MR_MAX_BYTES,
  nativeMrEdges,
  nativeMrPoint,
  readNativeMr,
  renderNativeMr,
  type NativeMrStudy,
} from '@/lib/local-mr-study';
import { nativeMrPositions } from '@/lib/native-mr-position';
import './local-imaging-workbench.css';
import './native-mr-workbench.css';

export function LoadedNativeMr({
  study,
  close,
}: {
  study: NativeMrStudy;
  close: () => void;
}) {
  const [slice, setSlice] = useState(Math.floor(study.dimensions[2] / 2));
  const [pixel, setPixel] = useState([
    Math.floor(study.dimensions[0] / 2),
    Math.floor(study.dimensions[1] / 2),
  ]);
  const [window, setWindow] = useState(study.window);
  const [inverted, setInverted] = useState(false),
    [message, setMessage] = useState('');
  const [displayReset, setDisplayReset] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 }),
    [canvasFailed, setCanvasFailed] = useState(false);
  const [columns, rows, slices] = study.dimensions;
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = () => {
      const bounds = element.getBoundingClientRect();
      const scale = Math.min(
        bounds.width / (columns * study.spacing[0]),
        bounds.height / (rows * study.spacing[1]),
      );
      setSize({
        width: columns * study.spacing[0] * scale,
        height: rows * study.spacing[1] * scale,
      });
    };
    resize();
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(element);
    globalThis.addEventListener('resize', resize);
    return () => {
      observer?.disconnect();
      globalThis.removeEventListener('resize', resize);
    };
  }, [study, columns, rows]);
  useEffect(() => {
    try {
      const context = canvas.current?.getContext('2d');
      if (!context) {
        setCanvasFailed(true);
        return;
      }
      const image = context.createImageData(columns, rows);
      image.data.set(
        renderNativeMr(study, slice, window[0], window[1], inverted),
      );
      context.putImageData(image, 0, 0);
      setCanvasFailed(false);
    } catch {
      setCanvasFailed(true);
    }
  }, [study, slice, window, inverted, columns, rows]);
  const point = nativeMrPoint(study, pixel[0], pixel[1], slice);
  const edges = nativeMrEdges(study);
  const step = (delta: number) =>
    setSlice((n) => Math.min(slices - 1, Math.max(0, n + delta)));
  const positions = nativeMrPositions(study);
  const selectedPosition = positions[slice];
  const interval = (spacing: number | null, gap: number | null) => {
    if (spacing === null || gap === null) return 'none';
    const coverage =
      Math.abs(gap) < 0.01
        ? 'near-contiguous nominal coverage'
        : `${Math.abs(gap).toFixed(2)} mm ${gap > 0 ? 'gap, not interpolated' : 'nominal overlap'}`;
    return `${spacing.toFixed(3)} mm centre spacing; ${coverage}`;
  };
  return (
    <main className="native-mr-loaded">
      <p role="alert" className="native-mr-provenance">
        Source provenance is unverified. This local check only checks packet
        format and body integrity; it does not authenticate the source or
        establish privacy or clinical clearance.
      </p>
      <aside
        className="local-study-tools native-mr-tools"
        aria-label="MRI controls"
      >
        <strong>MRI import check</strong>
        <span className="local-draft-badge">Unreviewed · local only</span>
        <p className="native-mr-hint">
          Internal preparation check, not the learner PACS viewer. No
          reconstructed slices or atlas registration.
        </p>
        <details>
          <summary>Brightness &amp; contrast</summary>
          <form
            key={`${displayReset}:${window.join(':')}`}
            onSubmit={(e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget),
                low = Number(values.get('low')),
                high = Number(values.get('high'));
              if (
                ![low, high].every(Number.isFinite) ||
                high <= low ||
                low < -65536 ||
                high > 131072
              ) {
                setMessage(
                  'Upper signal must exceed lower signal within the supported range.',
                );
                return;
              }
              setWindow([low, high]);
              setMessage('');
            }}
          >
            <label>
              Lower signal
              <input
                name="low"
                type="number"
                required
                step="any"
                min={-65536}
                max={131072}
                defaultValue={window[0]}
              />
            </label>
            <label>
              Upper signal
              <input
                name="high"
                type="number"
                required
                step="any"
                min={-65536}
                max={131072}
                defaultValue={window[1]}
              />
            </label>
            <Button type="submit">Apply display range</Button>
          </form>
          <label className="local-check">
            <input
              type="checkbox"
              checked={inverted}
              onChange={(e) => setInverted(e.target.checked)}
            />
            Invert greyscale
          </label>
          <Button
            onClick={() => {
              setWindow(study.window);
              setInverted(false);
              setMessage('');
              // Reset unsubmitted inputs even when the applied range is already the default.
              setDisplayReset((revision) => revision + 1);
            }}
          >
            Reset display
          </Button>
          <p>
            Stored MR signal, not HU. Display changes leave the source samples
            unchanged.
          </p>
        </details>
        <details>
          <summary>Geometry &amp; review</summary>
          <p>
            {columns} × {rows} × {slices} native samples. In-plane:{' '}
            {study.spacing.map((n) => n.toFixed(3)).join(' × ')} mm.
          </p>
          <p>
            Centres: {study.centreSpacing.toFixed(3)} mm. Nominal thickness:{' '}
            {study.thickness.toFixed(3)} mm.
          </p>
          <p>
            Sequence and laterality require radiologist confirmation. Edge
            letters are derived from source LPS directions; native orientation
            is retained, not standardised or mirrored.
          </p>
          <p>
            No privacy clearance, diagnostic use, clinical approval or
            registered anatomical labels. No files are uploaded or saved by this
            page.
          </p>
        </details>
        {message && <p role="alert">{message}</p>}
        <Button onClick={close}>Close local MRI</Button>
      </aside>
      <section className="native-mr-main" aria-label="Native MRI slice viewer">
        <header className="native-mr-navigation">
          <Button
            disabled={slice === 0}
            onClick={() => step(-1)}
            aria-label="Previous native slice"
          >
            Previous
          </Button>
          <label>
            Slice {slice + 1} / {slices}
            <input
              type="range"
              min={0}
              max={slices - 1}
              step={1}
              value={slice}
              aria-label="Native MRI slice"
              aria-valuetext={`Acquired slice ${slice + 1} of ${slices}; projected LPS ${selectedPosition.position.toFixed(3)} mm`}
              onChange={(e) => setSlice(Number(e.target.value))}
            />
          </label>
          <Button
            disabled={slice === slices - 1}
            onClick={() => step(1)}
            aria-label="Next native slice"
          >
            Next
          </Button>
        </header>
        <label className="native-mr-gap">
          Acquired position along source LPS slice normal
          <select
            className="native-mr-position-select"
            aria-label="Acquired MRI position"
            value={slice}
            onChange={(e) => {
              const index = Number(e.target.value);
              if (Number.isInteger(index) && index >= 0 && index < slices)
                setSlice(index);
            }}
          >
            {positions.map(({ index, position }) => (
              <option key={index} value={index}>
                Slice {index + 1} — {position.toFixed(3)} mm
              </option>
            ))}
          </select>
        </label>
        <p className="native-mr-gap">
          Current acquired slice {slice + 1} / {slices}: projected LPS{' '}
          {selectedPosition.position.toFixed(3)} mm. Nominal thickness{' '}
          {study.thickness.toFixed(3)} mm. Previous:{' '}
          {interval(
            selectedPosition.previousSpacing,
            selectedPosition.previousGap,
          )}
          . Next:{' '}
          {interval(selectedPosition.nextSpacing, selectedPosition.nextGap)}.
        </p>
        <div className="native-mr-frame" ref={frame}>
          <div
            className="local-slice-image"
            style={{ width: size.width, height: size.height }}
          >
            <button
              className="local-slice-target"
              aria-label="Inspect native MRI signal. Arrow keys move the sample; Page Up and Page Down change slice."
              onClick={(e) => {
                if (e.detail === 0) return; // Keyboard activation must not jump to a synthetic pointer position.
                const bounds = e.currentTarget.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;
                setPixel([
                  Math.min(
                    columns - 1,
                    Math.max(
                      0,
                      Math.floor(
                        ((e.clientX - bounds.left) / bounds.width) * columns,
                      ),
                    ),
                  ),
                  Math.min(
                    rows - 1,
                    Math.max(
                      0,
                      Math.floor(
                        ((e.clientY - bounds.top) / bounds.height) * rows,
                      ),
                    ),
                  ),
                ]);
              }}
              onKeyDown={(e) => {
                if (e.key === 'PageUp' || e.key === 'PageDown') {
                  e.preventDefault();
                  step(e.key === 'PageUp' ? -1 : 1);
                }
                const moves: Record<string, number[]> = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                };
                if (moves[e.key]) {
                  e.preventDefault();
                  const d = moves[e.key];
                  setPixel((p) => [
                    Math.max(0, Math.min(columns - 1, p[0] + d[0])),
                    Math.max(0, Math.min(rows - 1, p[1] + d[1])),
                  ]);
                }
              }}
            >
              <canvas ref={canvas} width={columns} height={rows}>
                Native MRI image; canvas is required.
              </canvas>
            </button>
            <div className="local-image-guides" aria-hidden="true">
              {edges.map((letter, i) => (
                <span key={i} data-edge={i}>
                  {letter}
                </span>
              ))}
              <i
                className="local-cross-x"
                style={{ left: `${((pixel[0] + 0.5) / columns) * 100}%` }}
              />
              <i
                className="local-cross-y"
                style={{ top: `${((pixel[1] + 0.5) / rows) * 100}%` }}
              />
            </div>
          </div>
          {canvasFailed && (
            <p role="alert">
              This browser could not draw the MRI. Close the file and try a
              supported browser.
            </p>
          )}
        </div>
        <footer>
          <output aria-live="polite" aria-atomic="true">
            Stored signal {point.signal} · column {pixel[0] + 1}, row{' '}
            {pixel[1] + 1} · LPS mm: {point.lps.map((n) => n.toFixed(2)).join(', ')}
          </output>
        </footer>
      </section>
    </main>
  );
}

export default function NativeMrWorkbench() {
  const [study, setStudy] = useState<NativeMrStudy | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0);
  const activeReader = useRef<FileReader | null>(null);
  const abortRead = () => {
    const reader = activeReader.current;
    activeReader.current = null;
    reader?.abort();
  };
  useEffect(
    () => () => {
      generation.current++;
      abortRead();
    },
    [],
  );
  const close = () => {
    generation.current++;
    abortRead();
    setStudy(null);
    setBusy(false);
    setError('');
  };
  const load = async (file?: File) => {
    const current = ++generation.current;
    abortRead();
    setStudy(null);
    setError('');
    setBusy(false);
    if (!file) return;
    if (file.size > LOCAL_MR_MAX_BYTES) {
      setError('This MRI exceeds the 128 MiB local-file limit.');
      return;
    }
    setBusy(true);
    try {
      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        activeReader.current = reader;
        reader.onload = () => {
          if (activeReader.current === reader) activeReader.current = null;
          if (current !== generation.current) {
            reject(new Error('MRI read was cancelled'));
          } else if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error('MRI read did not return binary data'));
          }
        };
        reader.onerror = () => {
          if (activeReader.current === reader) activeReader.current = null;
          reject(reader.error ?? new Error('MRI read failed'));
        };
        reader.onabort = () => {
          if (activeReader.current === reader) activeReader.current = null;
          reject(new Error('MRI read was cancelled'));
        };
        try {
          reader.readAsArrayBuffer(file);
        } catch (error) {
          if (activeReader.current === reader) activeReader.current = null;
          reject(error);
        }
      });
      const result = await readNativeMr(bytes);
      if (current === generation.current) setStudy(result);
    } catch {
      if (current === generation.current)
        setError(
          'Cannot read this MRI packet. Choose a prepared .vmmr packet with valid format and body integrity; raw DICOM, NIfTI and CT files are not supported here. Source provenance is not checked.',
        );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };
  return (
    <div className="local-imaging-shell native-mr-shell">
      <header className="local-imaging-top">
        <Link href="/review">Review workspace</Link>
        <h1>MRI import checker</h1>
        <Link href="/imaging/local">CT review</Link>
        <span>Not for publication</span>
      </header>
      {study ? (
        <LoadedNativeMr study={study} close={close} />
      ) : (
        <main className="local-study-open">
          <h2>Check a prepared MRI import</h2>
          <p>
            Internal packet-format and body-integrity checker. Source provenance
            remains unverified. Didanix Education is the designated learner
            DICOM/PACS viewer; this is not its replacement or release.
          </p>
          <p>
            Explore acquired slices with source orientation and stored signal
            values. Files stay in this browser session; this page does not
            upload or save them.
          </p>
          <p>
            Private review only. MRI acquisition gaps remain visible; no
            synthetic anatomy, cross-modality registration or clinical approval
            is implied.
          </p>
          <label>
            Choose local MRI
            <input
              type="file"
              accept=".vmmr"
              disabled={busy}
              onChange={(e) => {
                void load(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {busy && (
            <>
              <output aria-live="polite">Checking local MRI packet…</output>
              <Button onClick={close}>Cancel</Button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <Link href="/imaging/local">Open a CT study instead</Link>
        </main>
      )}
    </div>
  );
}
