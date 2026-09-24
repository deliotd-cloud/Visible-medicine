'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { createLabelDepthProbe, coveredLabelDescription } from '@/lib/label-depth';
import {
  layoutScreenLabels,
  projectLabelAnchor,
  screenLabelMaxWidth,
  type ScreenLabel,
} from '@/lib/screen-label-layout';
import './scene-label-layer.css';

type Entry = {
  id: string;
  name: string;
  selected: boolean;
  priority: number;
  anchor: RefObject<Group | null>;
  onSelect: (id: string) => void;
};
const LabelContext = createContext<((entry: Entry) => () => void) | null>(null);
const overlayOrigin = () => [0, 0];
// Html's origin is not an anatomical anchor. Visibility is handled individually
// using the real anchors, including when panning places world origin behind us.
const managedVisibility = () => {};

export function SceneLabel({
  id,
  name,
  selected,
  priority = 0,
  position,
  onSelect,
}: {
  id: string;
  name: string;
  selected: boolean;
  priority?: number;
  position: [number, number, number];
  onSelect: (id: string) => void;
}) {
  const register = useContext(LabelContext);
  const anchor = useRef<Group>(null);
  useLayoutEffect(
    () => register?.({ id, name, selected, priority, anchor, onSelect }),
    [register, id, name, selected, priority, onSelect],
  );
  // Parenting this empty group under the tissue's displaced group applies every
  // transform exactly once without moving source geometry or anatomical IDs.
  return <group ref={anchor} position={position} />;
}

export function SceneLabelLayer({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const lines = useRef(new Map<string, SVGPathElement>());
  const points = useRef(new Map<string, SVGCircleElement>());
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const world = useMemo(() => new Vector3(), []);
  const probeDepth = useMemo(createLabelDepthProbe, []);
  const depthFrame = useRef({ last: -Infinity, timer: null as ReturnType<typeof setTimeout> | null });
  useLayoutEffect(() => () => {
    if (depthFrame.current.timer !== null) clearTimeout(depthFrame.current.timer);
  }, []);
  const register = useCallback((entry: Entry) => {
    setEntries((current) => [
      ...current.filter((item) => item.id !== entry.id),
      entry,
    ]);
    return () =>
      setEntries((current) => current.filter((item) => item !== entry));
  }, []);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => invalidate());
    resizeObserver.current = observer;
    for (const button of buttons.current.values()) observer.observe(button);
    invalidate();
    return () => {
      observer.disconnect();
      resizeObserver.current = null;
    };
  }, [entries, size.width, size.height, invalidate]);

  useFrame(({ camera, scene }) => {
    camera.updateMatrixWorld();
    // At most ten selected-anchor probes per second, with one trailing demand
    // frame so the final orbit/opacity/cut state cannot retain an old result.
    const selected = entries.find(entry => entry.selected && entry.anchor.current?.parent);
    for (const entry of entries) if (entry !== selected) {
      const button = buttons.current.get(entry.id), line = lines.current.get(entry.id);
      if (line) line.dataset.depth = '';
      if (button) {
        button.dataset.depth = '';
        button.title = '';
        button.setAttribute('aria-description', '');
      }
    }
    const now = performance.now();
    if (selected && now - depthFrame.current.last >= 100) {
      depthFrame.current.last = now;
      if (depthFrame.current.timer !== null) clearTimeout(depthFrame.current.timer);
      depthFrame.current.timer = null;
      scene.updateMatrixWorld(true);
      const anchor = selected.anchor.current!;
      anchor.getWorldPosition(world);
      const depth = probeDepth(scene, camera, world, anchor.parent!);
      for (const entry of entries) {
        const button = buttons.current.get(entry.id), line = lines.current.get(entry.id);
        if (!button || !line) continue;
        const covered = entry === selected && depth === 'covered';
        button.dataset.depth = covered ? 'covered' : '';
        line.dataset.depth = covered ? 'covered' : '';
        button.title = covered ? coveredLabelDescription : '';
        button.setAttribute('aria-description', covered ? coveredLabelDescription : '');
      }
    } else if (selected && depthFrame.current.timer === null) {
      depthFrame.current.timer = setTimeout(() => {
        depthFrame.current.timer = null;
        invalidate();
      }, Math.max(1, 101 - (now - depthFrame.current.last)));
    }
    const projected: ScreenLabel[] = [];
    for (const entry of entries) {
      const anchor = entry.anchor.current,
        button = buttons.current.get(entry.id);
      if (!anchor || !button) continue;
      anchor.getWorldPosition(world);
      const point = projectLabelAnchor(world, camera, size.width, size.height);
      if (point)
        projected.push({
          ...point,
          id: entry.id,
          selected: entry.selected,
          priority: entry.priority,
          width: button.offsetWidth,
          height: button.offsetHeight,
        });
    }
    const placements = new Map(
      layoutScreenLabels(projected, size.width, size.height).map((label) => [
        label.id,
        label,
      ]),
    );
    for (const entry of entries) {
      const button = buttons.current.get(entry.id),
        line = lines.current.get(entry.id),
        point = points.current.get(entry.id);
      if (!button || !line || !point) continue;
      const label = placements.get(entry.id);
      button.style.visibility =
        line.style.visibility =
        point.style.visibility =
          label ? 'visible' : 'hidden';
      button.disabled = !label;
      if (!label) continue;
      button.dataset.side = label.side;
      button.style.transform = `translate(${label.left}px, ${label.top}px)`;
      line.setAttribute(
        'd',
        `M ${label.x} ${label.y} L ${label.endX} ${label.endY}`,
      );
      point.setAttribute('cx', String(label.x));
      point.setAttribute('cy', String(label.y));
    }
  });

  return (
    <LabelContext.Provider value={register}>
      {children}
      <Html
        calculatePosition={overlayOrigin}
        onOcclude={managedVisibility}
        zIndexRange={[3, 1]}
        style={{
          width: size.width,
          height: size.height,
          pointerEvents: 'none',
        }}
      >
        <div
          className="scene-label-overlay"
          role="group"
          aria-label="Anatomical structure labels"
        >
          <svg
            width={size.width}
            height={size.height}
            aria-hidden="true"
            className="scene-label-leaders"
          >
            {entries.map((entry) => (
              <g
                key={entry.id}
                className={entry.selected ? 'selected' : undefined}
              >
                <path
                  ref={(node) => {
                    if (node) {
                      lines.current.set(entry.id, node);
                      invalidate();
                    } else lines.current.delete(entry.id);
                  }}
                />
                <circle
                  r="2.2"
                  ref={(node) => {
                    if (node) {
                      points.current.set(entry.id, node);
                      invalidate();
                    } else points.current.delete(entry.id);
                  }}
                />
              </g>
            ))}
          </svg>
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={entry.selected ? 'true' : undefined}
              aria-label={entry.name}
              ref={(node) => {
                const previous = buttons.current.get(entry.id);
                if (previous) resizeObserver.current?.unobserve(previous);
                if (node) {
                  buttons.current.set(entry.id, node);
                  resizeObserver.current?.observe(node);
                  invalidate();
                } else buttons.current.delete(entry.id);
              }}
              className={`scene-label${entry.selected ? ' selected' : ''}`}
              style={{ maxWidth: screenLabelMaxWidth(size.width) }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                entry.onSelect(entry.id);
              }}
            >
              {entry.name}
              <span className="scene-label-depth" aria-hidden="true">Behind tissue</span>
            </button>
          ))}
        </div>
      </Html>
    </LabelContext.Provider>
  );
}
