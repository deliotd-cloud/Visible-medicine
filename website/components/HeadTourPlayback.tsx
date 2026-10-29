'use client';

import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createHeadTourPlaybackController, HEAD_TOUR_SPEEDS, type HeadTourPlaybackContext, type HeadTourPlaybackState} from '../lib/head-tour-playback';
import {readHeadTourSpeedPreference, writeHeadTourSpeedPreference} from '../lib/head-tour-speed-preference';
import './head-tour-playback.css';

export function HeadTourPlayback({context, blockedReason, onPlayingChange}: {context: HeadTourPlaybackContext; blockedReason?: string; onPlayingChange?: (playing: boolean) => void}) {
  const controls = useRef<HTMLDivElement>(null), committed = useRef<object | null>(null), token = {};
  const playingChange = useRef(onPlayingChange);
  const [state, setState] = useState<HeadTourPlaybackState>({playing: false, finished: false, speed: 1});
  const controllerRef = useRef<ReturnType<typeof createHeadTourPlaybackController> | null>(null);
  const visible = () => !!committed.current && !document.hidden && !!controls.current &&
    !controls.current.closest('[hidden], [inert]') && (!controls.current.closest('details') || controls.current.closest('details')!.open);
  if (!controllerRef.current) controllerRef.current = createHeadTourPlaybackController({
    schedule: (callback, delay) => window.setTimeout(callback, delay),
    cancel: handle => window.clearTimeout(handle as number),
    canAdvance: visible,
    onState: next => {if (committed.current) {setState(next); playingChange.current?.(next.playing);}},
  });
  const controller = controllerRef.current;
  useLayoutEffect(() => {
    committed.current = token;
    playingChange.current = onPlayingChange;
    controller.update(context);
    return () => {if (committed.current === token) committed.current = null;};
  });
  useEffect(() => {
    const savedSpeed = readHeadTourSpeedPreference(() => window.localStorage);
    if (savedSpeed !== null) controller.setSpeed(savedSpeed);
  }, [controller]);
  useEffect(() => {
    const root = controls.current?.closest('.imaging-workspace-page, .head-guided-module-page');
    const pause = () => controller.pause();
    const manual = (event: Event) => {if (!controls.current?.contains(event.target as Node)) pause();};
    const hidden = () => {if (document.hidden) pause();};
    root?.addEventListener('pointerdown', manual, true);
    root?.addEventListener('wheel', manual, true);
    root?.addEventListener('keydown', manual, true);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', pause); window.addEventListener('pagehide', pause); window.addEventListener('popstate', pause);
    return () => {
      controller.pause();
      playingChange.current?.(false);
      root?.removeEventListener('pointerdown', manual, true);
      root?.removeEventListener('wheel', manual, true);
      root?.removeEventListener('keydown', manual, true);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', pause); window.removeEventListener('pagehide', pause); window.removeEventListener('popstate', pause);
    };
  }, [controller]);
  const canControl = () => committed.current === token && visible();
  return <div ref={controls} className="head-tour-playback" role="group" aria-label="Guided tour playback" onKeyDown={event => {
    if (event.key === 'Escape' && canControl()) controller.pause();
  }}>
    <button type="button" disabled={!state.playing && (context.blocked || !context.stepId)} onClick={() => {
      if (!canControl()) return;
      if (controller.state().playing) controller.pause(); else {
        // The inline comparison folds learning by default. Explicit playback
        // reveals the notes, rather than advancing captions behind a closed panel.
        const notes=controls.current?.closest('.imaging-workspace-page, .head-guided-module-page')?.querySelector<HTMLDetailsElement>('.imaging-comparison-learning');
        if(notes)notes.open=true;
        controller.play();
      }
    }}>{state.playing ? 'Pause tour' : state.finished ? 'Replay this step' : 'Play tour'}</button>
    <label>Speed <select aria-label="Guided tour speed" value={state.speed} onChange={event => {
      if (!canControl()) return;
      const speed = Number(event.target.value);
      if (!HEAD_TOUR_SPEEDS.some(allowed => allowed === speed)) return;
      controller.setSpeed(speed);
      writeHeadTourSpeedPreference(() => window.localStorage, speed);
    }}>{HEAD_TOUR_SPEEDS.map(speed => <option key={speed} value={speed}>{`${speed}×${speed === 0.5 ? ' · slow' : speed === 2 ? ' · fast' : speed === 3 ? ' · fastest' : ''}`}</option>)}</select></label>
    <span role="status">{blockedReason || (state.finished ? 'Tour ended · final notes remain open.' : state.playing ? context.ready ? 'Playing · notes advance with each structure.' : 'Waiting for this structure to be confirmed…' : 'Manual navigation pauses playback.')}</span>
  </div>;
}
