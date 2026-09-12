'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { OrbitControls, Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { AnatomyCanvas } from './anatomy-canvas';
import { RendererMonitor } from './scene-recovery';
import {
  fitLocalSlice,
  localCrosshair,
  localReviewExport,
  pickLocalStructure,
  readLocalStudy,
  renderLocalSlice,
  LOCAL_STUDY_MAX_BYTES,
  type LocalStudy,
  type LocalStructure,
  type LocalReviewMark,
} from '@/lib/local-imaging-study';
import {
  validateWindow,
  type ImageWindow,
  type Vec3,
} from '@/lib/volume-reslice';
import type { ImagePlane } from '@/lib/imaging-comparison';
import {
  readLocalComparison,
  comparisonLayers,
  comparisonFocus,
  renderComparisonSlice,
  LOCAL_COMPARISON_MAX_BYTES,
  type LocalComparison,
  type ComparisonMode,
  type ComparisonLayer,
} from '@/lib/local-mask-comparison';
import './local-imaging-workbench.css';

const planes: ImagePlane[] = ['axial', 'coronal', 'sagittal'];
const planeColours = {
  axial: '#ee7373',
  coronal: '#74d6aa',
  sagittal: '#7aacff',
};
type Mode = 'navigate' | 'include' | 'exclude';

function Surface({
  structure,
  selected,
  choose,
  targetId,
}: {
  structure: Pick<LocalStructure, 'positions' | 'indices' | 'colour'> & {
    id?: string;
  };
  selected: boolean;
  choose: (id: string, point: Vec3) => void;
  targetId?: string;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(structure.positions, 3),
    );
    g.setIndex(new THREE.BufferAttribute(structure.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [structure]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      renderOrder={selected ? 2 : 0}
      onClick={(e) => {
        e.stopPropagation();
        choose(
          targetId ?? structure.id!,
          e.point.toArray() as [number, number, number],
        );
      }}
    >
      <meshStandardMaterial
        color={structure.colour}
        side={THREE.DoubleSide}
        roughness={0.65}
        transparent={!selected}
        opacity={selected ? 1 : 0.12}
        depthWrite={selected}
      />
    </mesh>
  );
}
function CameraFit({ study, reset }: { study: LocalStudy; reset: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const centre = study.volume.indexToLps(
      study.volume.dimensions.map((n) => (n - 1) / 2) as unknown as Vec3,
    );
    const radius = Math.max(
      ...study.volume.corners.map((p) =>
        Math.hypot(...p.map((n, i) => n - centre[i])),
      ),
    );
    camera.up.set(0, 0, 1);
    camera.position.set(
      centre[0],
      centre[1] - radius * 2.9,
      centre[2] + radius * 0.2,
    );
    camera.lookAt(...centre);
    camera.updateProjectionMatrix();
    invalidate();
  }, [study, reset, camera, invalidate]);
  return null;
}
function StudyScene({
  study,
  selected,
  focus,
  reset,
  isolated,
  guides,
  choose,
  onFailure,
  comparison,
}: {
  study: LocalStudy;
  selected: LocalStructure;
  focus: Vec3;
  reset: number;
  isolated: boolean;
  guides: boolean;
  choose: (id: string, point: Vec3) => void;
  onFailure: () => void;
  comparison: readonly ComparisonLayer[] | null;
}) {
  const onHealth = useCallback(
    (h: string) => {
      if (h === 'failed' || h === 'lost') onFailure();
    },
    [onFailure],
  );
  const centre = useMemo(
    () =>
      study.volume.indexToLps(
        study.volume.dimensions.map((n) => (n - 1) / 2) as unknown as Vec3,
      ),
    [study],
  );
  const visible = useMemo(() => {
    if (isolated) return [selected];
    const ancestors = new Set<string>();
    let parent = selected.parentId;
    while (parent) {
      ancestors.add(parent);
      parent = study.structures.find((s) => s.id === parent)?.parentId ?? null;
    }
    return study.structures.filter(
      (s) =>
        s.id === selected.id ||
        (!ancestors.has(s.id) &&
          !study.structures.some((p) => p.id === s.parentId)),
    );
  }, [study, selected, isolated]);
  return (
    <AnatomyCanvas
      key={reset}
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ near: 0.1, far: 10000, fov: 40 }}
      onFailure={onFailure}
    >
      <CameraFit study={study} reset={reset} />
      <color attach="background" args={['#041a23']} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[0, -200, 300]} intensity={2.5} />
      <OrbitControls
        makeDefault
        target={[...centre]}
        enableDamping={false}
        minDistance={5}
        maxDistance={2000}
      />
      <RendererMonitor onHealth={onHealth} />
      {visible.map((s) => (
        <Surface
          key={s.id}
          structure={s}
          selected={!comparison && s.id === selected.id}
          choose={choose}
        />
      ))}
      {comparison?.map((layer) => (
        <Surface
          key={layer.role}
          structure={layer}
          targetId={selected.id}
          selected
          choose={choose}
        />
      ))}
      {guides &&
        planes.map((plane) => {
          const g = study.grids[plane],
            z = g.sliceForPoint(focus);
          const points = [
            [0, 0],
            [g.width - 1, 0],
            [g.width - 1, g.height - 1],
            [0, g.height - 1],
            [0, 0],
          ].map(([x, y]) => [...g.point(x, y, z)] as [number, number, number]);
          return (
            <Line
              key={plane}
              points={points}
              color={planeColours[plane]}
              transparent
              opacity={0.45}
              lineWidth={1}
            />
          );
        })}
      {[0, 1, 2].map((axis) => (
        <Line
          key={axis}
          points={[-4, 4].map(
            (delta) =>
              focus.map((n, i) => n + (i === axis ? delta : 0)) as [
                number,
                number,
                number,
              ],
          )}
          color="#ffffff"
          lineWidth={2}
        />
      ))}
    </AnatomyCanvas>
  );
}

function SlicePane({
  study,
  plane,
  focus,
  selected,
  window,
  opacity,
  marks,
  pick,
  move,
  comparison,
}: {
  study: LocalStudy;
  plane: ImagePlane;
  focus: Vec3;
  selected: LocalStructure;
  window: ImageWindow;
  opacity: number;
  marks: LocalReviewMark[];
  pick: (point: Vec3, mark?: boolean) => void;
  move: (point: Vec3) => void;
  comparison: readonly ComparisonLayer[] | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    frame = useRef<HTMLDivElement>(null),
    g = study.grids[plane],
    cross = localCrosshair(g, focus);
  const [display, setDisplay] = useState({ width: 0, height: 0 });
  const [error, setError] = useState(false);
  useEffect(() => {
    const host = frame.current;
    if (!host) return;
    const fit = () => {
      const r = host.getBoundingClientRect();
      setDisplay(fitLocalSlice(r.width, r.height, g));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();
    return () => observer.disconnect();
  }, [g]);
  useEffect(() => {
    const c = ref.current;
    if (!c || !display.width || !display.height) return;
    const frameId = requestAnimationFrame(() => {
      try {
        c.width = g.width;
        c.height = g.height;
        const ctx = c.getContext('2d');
        if (!ctx) throw Error();
        const pixels = ctx.createImageData(g.width, g.height);
        pixels.data.set(
          comparison
            ? renderComparisonSlice(
                study,
                plane,
                focus,
                window,
                comparison,
                opacity,
              )
            : renderLocalSlice(study, plane, focus, window, selected, opacity),
        );
        ctx.putImageData(pixels, 0, 0);
        setError(false);
      } catch {
        c.width = 0;
        c.height = 0;
        setError(true);
      }
    });
    return () => {
      cancelAnimationFrame(frameId);
      c.width = 0;
      c.height = 0;
    };
  }, [
    study,
    plane,
    focus,
    window,
    selected,
    opacity,
    comparison,
    g,
    display.width,
    display.height,
  ]);
  const toPoint = (x: number, y: number) =>
    g.point(
      Math.max(0, Math.min(g.width - 1, x)),
      Math.max(0, Math.min(g.height - 1, y)),
      cross.slice,
    );
  return (
    <section className="local-slice" aria-label={`${plane} view`}>
      <header>
        <strong>{plane}</strong>
        <span>
          {cross.slice + 1} / {g.sliceCount}
        </span>
      </header>
      <div className="local-slice-frame" ref={frame}>
        <div className="local-slice-image" style={display}>
          <button
            type="button"
            className="local-slice-target"
            aria-label={`${plane} CT: click to locate anatomy. Arrow keys move crosshair; Enter applies the chosen review action.`}
            onClick={(e) => {
              if (error) return;
              if (e.detail === 0) {
                pick(focus, true);
                return;
              }
              const r = e.currentTarget.getBoundingClientRect();
              pick(
                toPoint(
                  ((e.clientX - r.left) / r.width) * g.width - 0.5,
                  ((e.clientY - r.top) / r.height) * g.height - 0.5,
                ),
                true,
              );
            }}
            onKeyDown={(e) => {
              if (error) return;
              const delta: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              };
              if (delta[e.key]) {
                e.preventDefault();
                const [x, y] = delta[e.key];
                pick(toPoint(cross.x + x, cross.y + y));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                pick(focus, true);
              }
            }}
          >
            <canvas ref={ref} />
          </button>
          {!error && (
            <div className="local-image-guides" aria-hidden="true">
              <i
                className="local-cross-x"
                style={{ left: `${(100 * (cross.x + 0.5)) / g.width}%` }}
              />
              <i
                className="local-cross-y"
                style={{ top: `${(100 * (cross.y + 0.5)) / g.height}%` }}
              />
              {g.labels.map((label, i) => (
                <span key={i} data-edge={i}>
                  {label}
                </span>
              ))}
              {(comparison ? [] : marks)
                .filter((m) => m.structureId === selected.id)
                .map((m, i) => {
                  const p = localCrosshair(g, m.lps);
                  return p.slice === cross.slice ? (
                    <b
                      key={i}
                      className="local-review-point"
                      data-action={m.action}
                      style={{
                        left: `${(100 * (p.x + 0.5)) / g.width}%`,
                        top: `${(100 * (p.y + 0.5)) / g.height}%`,
                      }}
                    >
                      {m.action === 'include' ? '+' : '−'}
                    </b>
                  ) : null;
                })}
            </div>
          )}
          {error && (
            <p role="alert">Image rendering failed. No substitute is shown.</p>
          )}
        </div>
      </div>
      <input
        aria-label={`${plane} slice`}
        type="range"
        min={0}
        max={g.sliceCount - 1}
        value={cross.slice}
        onChange={(e) => {
          const target = g.point(cross.x, cross.y, Number(e.target.value));
          move(target);
        }}
      />
    </section>
  );
}

export function LoadedStudy({
  study,
  close,
}: {
  study: LocalStudy;
  close: () => void;
}) {
  const initial =
    study.structures.find((s) => s.id === study.reviewTargetIds[0]) ??
    study.structures[0];
  const [id, setId] = useState(initial.id),
    [focus, setFocus] = useState<Vec3>(initial.focusLps);
  const [query, setQuery] = useState(''),
    [window, setWindow] = useState(study.window),
    [opacity, setOpacity] = useState(0.3);
  const [isolated, setIsolated] = useState(false),
    [guides, setGuides] = useState(true),
    [reset, setReset] = useState(0),
    [sceneFailed, setSceneFailed] = useState(false);
  const [tab, setTab] = useState('3d'),
    [mode, setMode] = useState<Mode>('navigate'),
    [marks, setMarks] = useState<LocalReviewMark[]>([]),
    [message, setMessage] = useState('');
  const [comparison, setComparison] = useState<LocalComparison | null>(null),
    [comparisonMode, setComparisonMode] = useState<ComparisonMode>('baseline'),
    [comparisonBusy, setComparisonBusy] = useState(false),
    [comparisonError, setComparisonError] = useState('');
  const comparisonGeneration = useRef(0);
  useEffect(
    () => () => {
      comparisonGeneration.current++;
    },
    [],
  );
  const activeComparison =
    comparison &&
    comparison.structureId === id &&
    comparisonMode !== 'baseline';
  const visibleComparison = useMemo(
    () =>
      activeComparison ? comparisonLayers(comparison, comparisonMode) : null,
    [activeComparison, comparison, comparisonMode],
  );
  const clearComparison = () => {
    comparisonGeneration.current++;
    setComparison(null);
    setComparisonMode('baseline');
    setComparisonBusy(false);
    setComparisonError('');
    setMessage('');
  };
  const loadComparison = async (file?: File) => {
    clearComparison();
    setMode('navigate');
    if (!file) return;
    const generation = comparisonGeneration.current;
    if (file.size > LOCAL_COMPARISON_MAX_BYTES) {
      setComparisonError('Comparison exceeds the 64 MiB local-file limit.');
      return;
    }
    setComparisonBusy(true);
    try {
      const result = await readLocalComparison(await file.arrayBuffer(), study);
      if (generation !== comparisonGeneration.current) return;
      setComparison(result);
      setComparisonMode('changes');
      setId(result.structureId);
      setFocus(
        comparisonFocus(result, -1, 1) ??
          study.structures.find((s) => s.id === result.structureId)!.focusLps,
      );
      setMessage(
        'Unapproved comparison loaded locally. Original masks are unchanged.',
      );
    } catch {
      if (generation === comparisonGeneration.current)
        setComparisonError(
          'Cannot verify this comparison against the loaded study. Use a matching .vmcompare export.',
        );
    } finally {
      if (generation === comparisonGeneration.current) setComparisonBusy(false);
    }
  };
  const onSceneFailure = useCallback(() => setSceneFailed(true), []);
  useEffect(() => {
    if (!marks.length) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [marks.length]);
  const selected = study.structures.find((s) => s.id === id)!;
  const choose = (newId: string, point?: Vec3) => {
    const s = study.structures.find((v) => v.id === newId);
    if (!s) return;
    if (comparison && newId !== comparison.structureId)
      setComparisonMode('baseline');
    setId(s.id);
    setFocus(point ?? s.focusLps);
  };
  const pick = (point: Vec3, mark = false) => {
    const index = study.volume.lpsToIndex(point);
    if (index.some((n, i) => n < -0.5 || n >= study.volume.dimensions[i] - 0.5))
      return;
    setFocus(point);
    if (activeComparison) return; // Candidate feedback must not be attributed to a baseline mask.
    if (mark && mode !== 'navigate') {
      if (marks.length >= 500) {
        setMessage(
          'Export these review marks, then clear them before adding more.',
        );
        return;
      }
      setMarks((old) => [
        ...old,
        {
          structureId: selected.id,
          maskSha256: selected.sourceSha256,
          action: mode,
          lps: point,
        },
      ]);
      setMessage('Review mark added. The source mask is unchanged.');
      return;
    }
    const hit = pickLocalStructure(study, point, selected.id);
    if (hit) setId(hit.id);
  };
  const exportMarks = () => {
    const text = JSON.stringify(localReviewExport(study, marks), null, 2);
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visible-medicine-local-review.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      'Review marks exported locally; no mask edits or approvals were made.',
    );
  };
  return (
    <div className="local-imaging-loaded">
      <aside className="local-study-tools">
        <label className="local-search">
          Find structure
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or anatomical ID"
          />
        </label>
        <div
          className="local-structure-list"
          aria-label="Source masks and explicitly included drafts"
        >
          {study.structures
            .filter((s) =>
              `${s.label} ${s.id}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map((s) => (
              <button
                key={s.id}
                aria-pressed={s.id === id}
                onClick={() => choose(s.id)}
              >
                <i style={{ background: s.colour }} />
                {s.label}
                {s.reviewStatus === 'draft-unapproved' && (
                  <small className="local-draft-badge">Draft</small>
                )}
              </button>
            ))}
        </div>
        <label className="local-check">
          <input
            type="checkbox"
            checked={isolated}
            onChange={(e) => setIsolated(e.target.checked)}
          />
          Isolate selection
        </label>
        <label className="local-check">
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
          />
          Slice guides in 3D
        </label>
        <details>
          <summary>Image controls</summary>
          <label>
            Overlay opacity
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </label>
          <form
            key={`${window.center}/${window.width}`}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                next = {
                  ...window,
                  center: Number(f.get('level')),
                  width: Number(f.get('width')),
                };
              try {
                validateWindow(next);
                setWindow(next);
                setMessage('');
              } catch {
                setMessage('Enter a valid level and positive window width.');
              }
            }}
          >
            <label>
              Level
              <input
                name="level"
                type="number"
                required
                defaultValue={window.center}
              />
            </label>
            <label>
              Width
              <input
                name="width"
                type="number"
                min={1}
                required
                defaultValue={window.width}
              />
            </label>
            <Button variant="outline" type="submit">
              Apply
            </Button>
          </form>
          <Button variant="outline" onClick={() => setWindow(study.window)}>
            Reset image
          </Button>
        </details>
        <details className="local-comparison-tools">
          <summary>Compare candidate{comparison ? ' · loaded' : ''}</summary>
          <p>
            Private review only. No CT pixels are included in this attachment;
            the loaded study remains the baseline.
          </p>
          <label>
            Open comparison
            <input
              type="file"
              accept=".vmcompare"
              disabled={comparisonBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                void loadComparison(file);
              }}
            />
          </label>
          {comparisonBusy && (
            <>
              <output>Checking source hashes and voxel changes…</output>
              <Button variant="outline" onClick={clearComparison}>
                Cancel comparison load
              </Button>
            </>
          )}
          {comparisonError && <p role="alert">{comparisonError}</p>}
          {comparison && (
            <>
              <p>
                <strong>Unapproved candidate</strong> ·{' '}
                {
                  study.structures.find((s) => s.id === comparison.structureId)!
                    .label
                }
              </p>
              <label>
                Comparison overlay
                <select
                  value={comparisonMode}
                  onChange={(e) => {
                    setMode('navigate');
                    setComparisonMode(e.target.value as ComparisonMode);
                    if (e.target.value !== 'baseline')
                      choose(comparison.structureId);
                  }}
                >
                  <option value="baseline">Baseline (comparison off)</option>
                  <option value="changes">Additions and removals</option>
                  <option value="candidate">Candidate mask</option>
                  <option value="warnings">Protected-region warnings</option>
                </select>
              </label>
              <p>
                {comparison.counts.added.toLocaleString()} added ·{' '}
                {comparison.counts.removed.toLocaleString()} removed ·{' '}
                {comparison.counts.warnings.toLocaleString()} warning voxels
              </p>
              {!comparison.counts.candidate && (
                <output>
                  Candidate is empty. This is not a successful segmentation.
                </output>
              )}
              {!comparison.counts.added && !comparison.counts.removed && (
                <p>No voxel changes from baseline.</p>
              )}
              <p>
                {comparison.protectedRegionCount
                  ? `${comparison.protectedRegionCount} explicit protected ROIs checked offline.`
                  : 'No explicit protected ROIs: verbally accepted boundaries have not been verified.'}{' '}
                Warnings are review prompts, not diagnoses.
              </p>
              <div className="local-comparison-steps">
                {([-1, 1] as const).map((direction) => {
                  const point = comparisonFocus(
                    comparison,
                    study.volume.lpsToIndex(focus)[2],
                    direction,
                  );
                  return (
                    <Button
                      key={direction}
                      variant="outline"
                      disabled={!point}
                      onClick={() => {
                        if (!point) return;
                        setId(comparison.structureId);
                        setComparisonMode('changes');
                        setMode('navigate');
                        setFocus(point);
                      }}
                    >
                      {direction < 0 ? 'Previous' : 'Next'} changed slice
                    </Button>
                  );
                })}
              </div>
              <small>
                Steps through native K slices, which may be oblique to the
                displayed CT planes.
              </small>
              <Button variant="outline" onClick={clearComparison}>
                Remove comparison
              </Button>
            </>
          )}
        </details>
        <details
          onToggle={(e) => {
            if (!e.currentTarget.open) setMode('navigate');
          }}
        >
          <summary>Mark corrections · {marks.length}</summary>
          <p>
            Mark tissue to include or exclude for later review. This does not
            edit or approve masks.
          </p>
          {activeComparison && (
            <p>
              Switch to Baseline to add correction marks. Existing marks refer
              only to the original mask.
            </p>
          )}
          <label>
            Click action
            <select
              disabled={Boolean(activeComparison)}
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="navigate">Locate anatomy</option>
              <option value="include">Include here (+)</option>
              <option value="exclude">Exclude here (−)</option>
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!marks.length}
            onClick={() => setMarks((old) => old.slice(0, -1))}
          >
            Undo mark
          </Button>
          <Button
            variant="outline"
            disabled={!marks.length}
            onClick={exportMarks}
          >
            Export review marks
          </Button>
          <Button
            variant="outline"
            disabled={!marks.length}
            onClick={() => {
              if (
                globalThis.confirm(
                  'Clear all review marks? Export them first if you want to keep them.',
                )
              ) {
                setMarks([]);
                setMessage('Review marks cleared. Source masks are unchanged.');
              }
            }}
          >
            Clear marks
          </Button>
        </details>
        <Button
          variant="outline"
          onClick={() => {
            setReset((n) => n + 1);
            setSceneFailed(false);
          }}
        >
          Reset 3D view
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (
              !marks.length ||
              globalThis.confirm(
                'Close this study and discard its review marks? Export them first if you want to keep them.',
              )
            )
              close();
          }}
        >
          Close local study
        </Button>
      </aside>
      <main className="local-study-main">
        <div className="local-study-selection">
          <strong>{selected.label}</strong>
          <span>
            {selected.reviewStatus === 'draft-unapproved'
              ? 'Unapproved draft · boundary review required'
              : 'Source mask accepted · viewer awaiting validation'}
          </span>
          {activeComparison && (
            <div
              className="local-comparison-legend"
              aria-label="Active comparison legend"
            >
              <strong>Unapproved comparison</strong>
              {visibleComparison!.map((layer) => (
                <span key={layer.role}>
                  <i style={{ background: layer.colour }} />
                  {layer.role === 'warnings'
                    ? 'Protected warnings'
                    : layer.role === 'added'
                      ? 'Added'
                      : layer.role === 'removed'
                        ? 'Removed'
                        : 'Candidate'}
                </span>
              ))}
              {!visibleComparison!.length && (
                <span>No labelled voxels in this overlay</span>
              )}
            </div>
          )}
          {study.reviewTargetIds.length > 0 && (
            <small className="local-draft-badge">
              Draft review study · {study.reviewTargetIds.length} unapproved
              targets
            </small>
          )}
        </div>
        <div className="local-mobile-tabs" aria-label="Choose view">
          {['3d', ...planes].map((t) => (
            <Button
              key={t}
              variant="outline"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === '3d' ? '3D' : t}
            </Button>
          ))}
        </div>
        <div className="local-study-panes" data-tab={tab}>
          <section
            className="local-model-pane"
            aria-label="Same-study 3D surfaces"
          >
            <header>
              <strong>3D anatomy</strong>
              <span>Drag to rotate · scroll / pinch to zoom</span>
            </header>
            <div className="local-model-canvas">
              {sceneFailed ? (
                <p role="alert">
                  The 3D view is unavailable. CT views remain usable. Use Reset
                  3D view to retry.
                </p>
              ) : (
                <StudyScene
                  study={study}
                  selected={selected}
                  focus={focus}
                  reset={reset}
                  isolated={isolated}
                  guides={guides}
                  choose={choose}
                  onFailure={onSceneFailure}
                  comparison={visibleComparison}
                />
              )}
            </div>
          </section>
          {planes.map((p) => (
            <div key={p} className={`local-plane-wrap local-plane-${p}`}>
              <SlicePane
                study={study}
                plane={p}
                focus={focus}
                selected={selected}
                window={window}
                opacity={opacity}
                marks={marks}
                pick={pick}
                move={setFocus}
                comparison={visibleComparison}
              />
            </div>
          ))}
        </div>
        <footer>
          <span>
            Same source grid · LPS mm · reformatted CT · no explosion while
            aligned
          </span>
          <output aria-live="polite">
            {message ||
              `${selected.voxelCount.toLocaleString()} labelled voxels`}
          </output>
        </footer>
      </main>
    </div>
  );
}

export default function LocalImagingWorkbench() {
  const [study, setStudy] = useState<LocalStudy | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const close = () => {
    generation.current++;
    setStudy(null);
    setBusy(false);
    setError('');
  };
  const load = async (file?: File) => {
    const current = ++generation.current;
    setStudy(null);
    setError('');
    if (!file) {
      setBusy(false);
      return;
    }
    if (file.size > LOCAL_STUDY_MAX_BYTES) {
      setError('This study exceeds the 256 MiB local-file limit.');
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const ready = await readLocalStudy(await file.arrayBuffer());
      if (current === generation.current) setStudy(ready);
    } catch {
      if (current === generation.current)
        setError(
          'The local study could not be verified. Use the prepared .vmatlas file; raw ZIP/DICOM files are not supported here.',
        );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };
  return (
    <div className="local-imaging-shell">
      <header className="local-imaging-top">
        <Link href="/">Visible Medicine</Link>
        <h1>Local imaging study</h1>
        <span>Not for publication</span>
      </header>
      {!study ? (
        <main className="local-study-open">
          <h2>Open a prepared CT study</h2>
          <p>
            View source segmentation surfaces beside their original CT.
            Explicitly included drafts remain labelled as unapproved. Your
            selected file is read in this browser; this page does not upload or
            save its contents.
          </p>
          <p>
            For private teaching review only. Source-mask acceptance is not
            validation of this viewer or permission to publish images.
          </p>
          <label>
            Choose local study
            <input
              type="file"
              accept=".vmatlas"
              disabled={busy}
              onChange={(e) => {
                void load(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {busy && (
            <>
              <output aria-live="polite">
                Verifying local image and masks…
              </output>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <Link href="/">Back to the anatomy atlas</Link>
        </main>
      ) : (
        <LoadedStudy study={study} close={close} />
      )}
    </div>
  );
}
