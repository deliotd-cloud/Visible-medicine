'use client';

import {useEffect, useRef, useState, type RefObject} from 'react';
import {createHeadSlicePlaybackController} from '../lib/head-slice-playback';

type Plane = 'axial' | 'coronal' | 'sagittal';
type Props = {
  plane: Plane;
  slice: number;
  sliceCount: number;
  onSlice: (slice: number) => void;
  interactionRoot: RefObject<HTMLElement | null>;
  resetIdentity: unknown;
  resetVersion: number;
};

export default function HeadSlicePlayback({plane, slice, sliceCount, onSlice, interactionRoot, resetIdentity, resetVersion}: Props) {
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState<2 | 4 | 6>(4);
  const [direction, setDirection] = useState<1 | -1>(1);
  const controlsRef = useRef<HTMLDivElement>(null);
  const onSliceRef = useRef(onSlice);
  onSliceRef.current = onSlice;
  const position = useRef({slice, fps});
  position.current = {slice, fps};
  const mounted = useRef(false);
  const identity = useRef({plane, resetIdentity, resetVersion, sliceCount});
  if (identity.current.plane !== plane || identity.current.resetIdentity !== resetIdentity ||
    identity.current.resetVersion !== resetVersion || identity.current.sliceCount !== sliceCount) {
    identity.current = {plane, resetIdentity, resetVersion, sliceCount};
  }
  const session = identity.current;
  const committed = useRef<typeof session | null>(null);
  const controlsOpen = () => {
    const controls = controlsRef.current;
    const details = controls?.closest('details');
    return !!controls && (!details || details.open);
  };
  const controllerRef = useRef<ReturnType<typeof createHeadSlicePlaybackController> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createHeadSlicePlaybackController({
      slice,
      sliceCount,
      fps: 4,
      onSlice: next => {
        // A timer may already be queued when the tools close or a replacement
        // study renders, before passive cleanup runs. Never forward that tick.
        if (!mounted.current || committed.current !== identity.current || document.hidden || !controlsOpen()) {
          // The controller has already incremented its internal index. Restore
          // the displayed slice as well as stopping, so reopening skips nothing.
          controllerRef.current?.reset(position.current.slice, identity.current.sliceCount, position.current.fps);
          return;
        }
        onSliceRef.current(next);
      },
      onPlayingChange: next => { if (mounted.current) setPlaying(next); },
      schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
      cancel: handle => window.clearTimeout(handle as number),
    });
  }
  const controller = controllerRef.current;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; committed.current = null; controller.pause(); };
  }, [controller]);
  useEffect(() => {
    committed.current = session;
    controller.reset(slice, sliceCount, fps);
    return () => { if (committed.current === session) committed.current = null; controller.pause(); };
    // Identity changes stop playback; slice and speed have independent updates below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, session]);
  useEffect(() => controller.configure(sliceCount, fps), [controller, sliceCount, fps]);
  useEffect(() => controller.setSlice(slice), [controller, slice]);

  useEffect(() => {
    const root = interactionRoot.current;
    if (!root) return;
    const pauseForManualInput = (event: Event) => {
      if (!controlsRef.current?.contains(event.target as Node)) controller.pause();
    };
    root.addEventListener('pointerdown', pauseForManualInput, true);
    root.addEventListener('wheel', pauseForManualInput, true);
    root.addEventListener('keydown', pauseForManualInput, true);
    return () => {
      root.removeEventListener('pointerdown', pauseForManualInput, true);
      root.removeEventListener('wheel', pauseForManualInput, true);
      root.removeEventListener('keydown', pauseForManualInput, true);
    };
  }, [controller, interactionRoot]);

  useEffect(() => {
    const pauseIfHidden = () => { if (document.hidden) controller.pause(); };
    const pauseOnBlur = () => controller.pause();
    document.addEventListener('visibilitychange', pauseIfHidden);
    window.addEventListener('blur', pauseOnBlur);
    window.addEventListener('pagehide', pauseOnBlur);
    return () => {
      document.removeEventListener('visibilitychange', pauseIfHidden);
      window.removeEventListener('blur', pauseOnBlur);
      window.removeEventListener('pagehide', pauseOnBlur);
    };
  }, [controller]);

  useEffect(() => {
    const details = controlsRef.current?.closest('details');
    if (!details) return;
    const pauseIfClosed = () => { if (!details.open) controller.pause(); };
    details.addEventListener('toggle', pauseIfClosed);
    return () => details.removeEventListener('toggle', pauseIfClosed);
  }, [controller]);

  const validSlice = Number.isInteger(slice) && Number.isInteger(sliceCount) && sliceCount >= 2 && slice >= 0 && slice < sliceCount;
  const canPlay = validSlice && (direction === 1 ? slice < sliceCount - 1 : slice > 0);
  const canControl = () => mounted.current && committed.current === session && identity.current === session &&
    !document.hidden && controlsOpen();
  return <div ref={controlsRef} role="group" aria-label={`${plane} native slice playback`} style={{display:'grid',gap:8,minWidth:0}} onKeyDown={event => {
    if (event.key === 'Escape' && canControl()) controller.pause();
  }}>
    <div className="head-image-zoom"><button type="button" aria-label={`${plane} ${playing ? 'Pause slices' : 'Play slices'}`} disabled={!playing && !canPlay} onClick={() => {
      if (!canControl()) return;
      if (controller.isPlaying()) controller.pause();
      else controller.play();
    }}>{playing ? 'Pause slices' : 'Play slices'}</button>
    <label>Speed <select aria-label={`${plane} playback speed`} value={fps} onChange={event => {
      if (!canControl()) return;
      const next = Number(event.target.value);
      if (next !== 2 && next !== 4 && next !== 6) return;
      controller.configure(sliceCount, next);setFps(next);
    }}>
      <option value={2}>2 fps</option><option value={4}>4 fps</option><option value={6}>6 fps</option>
    </select></label></div>
    <label style={{display:'grid',gap:4}}>Direction <select style={{width:'100%',minWidth:0}} aria-label={`${plane} playback direction`} value={direction} onChange={event => {
      if (!canControl()) return;
      const next = Number(event.target.value);
      if (next !== 1 && next !== -1) return;
      controller.setDirection(next);setDirection(next);
    }}><option value={1}>Increasing slice numbers</option><option value={-1}>Decreasing slice numbers</option></select></label>
    <button type="button" aria-label={`${plane} replay from ${direction === 1 ? 'first' : 'last'} slice`} disabled={playing || !validSlice} onClick={() => {
      if (canControl() && !controller.isPlaying()) controller.restart();
    }}>Replay from {direction === 1 ? 'first' : 'last'} slice</button>
    <p>Native slice numbers, not an anatomical direction, time series or flow simulation. Stops at the {direction === 1 ? 'last' : 'first'} slice without looping. Changing direction pauses playback.</p>
  </div>;
}
