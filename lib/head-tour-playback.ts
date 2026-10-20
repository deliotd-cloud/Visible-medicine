export const HEAD_TOUR_SPEEDS = Object.freeze([0.5, 1, 1.5, 2, 3] as const);
export type HeadTourSpeed = (typeof HEAD_TOUR_SPEEDS)[number];
function isHeadTourSpeed(value: number): value is HeadTourSpeed {
  return HEAD_TOUR_SPEEDS.some(speed => speed === value);
}
export type HeadTourPlaybackContext = {
  identity: unknown;
  revision: string;
  sequenceId: string;
  stepId: string | null;
  index: number;
  total: number;
  nextId: string | null;
  ready: boolean;
  blocked: boolean;
  onAdvance: (conceptId: string) => void;
};
export type HeadTourPlaybackState = {playing: boolean; finished: boolean; speed: HeadTourSpeed};
export const HEAD_TOUR_READING_MS = 12000;

/** Reading time begins only after exact source/selection confirmation. No scans,
 * scores, progress, registration or approvals are stored by this transport. */
export function createHeadTourPlaybackController(options: {
  schedule: (callback: () => void, milliseconds: number) => unknown;
  cancel: (handle: unknown) => void;
  canAdvance: () => boolean;
  onState: (state: HeadTourPlaybackState) => void;
}) {
  let context: HeadTourPlaybackContext | null = null;
  let state: HeadTourPlaybackState = {playing: false, finished: false, speed: 1};
  let timer: unknown;
  let generation = 0;
  let expectedNext: string | null = null;
  const valid = (value: HeadTourPlaybackContext | null): value is HeadTourPlaybackContext =>
    !!value && !!value.identity && /^[a-f0-9]{64}$/.test(value.revision) && !!value.sequenceId && !!value.stepId &&
    Number.isInteger(value.index) && Number.isInteger(value.total) && value.total > 0 &&
    value.index >= 0 && value.index < value.total &&
    (value.index === value.total - 1 ? value.nextId === null : !!value.nextId && value.nextId !== value.stepId);
  function invalidate() {
    generation++;
    if (timer !== undefined) options.cancel(timer);
    timer = undefined;
  }
  function publish(next: Partial<HeadTourPlaybackState>) {
    const value = {...state, ...next};
    if (value.playing === state.playing && value.finished === state.finished && value.speed === state.speed) return;
    state = value;
    options.onState({...state});
  }
  function pause() { invalidate(); expectedNext = null; publish({playing: false}); }
  function schedule() {
    if (!state.playing || timer !== undefined || expectedNext || !valid(context) || !context.ready || context.blocked) return;
    const epoch = generation;
    timer = options.schedule(() => {
      if (epoch !== generation || !state.playing) return;
      timer = undefined;
      if (!valid(context) || !context.ready || context.blocked || !options.canAdvance()) { pause(); return; }
      if (context.nextId === null) { invalidate(); publish({playing: false, finished: true}); return; }
      // Reserve the sole next canonical slot before a callback can reenter.
      expectedNext = context.nextId;
      generation++;
      context.onAdvance(expectedNext);
      // Wait for the next committed target, then its annotation/model readiness.
      // There is no speculative follow-up timer or skip across missing steps.
    }, HEAD_TOUR_READING_MS / state.speed);
  }
  return {
    update(next: HeadTourPlaybackContext) {
      const previous = context;
      const replaced = !previous || previous.identity !== next.identity || previous.revision !== next.revision ||
        previous.sequenceId !== next.sequenceId || previous.total !== next.total;
      const moved = !previous || previous.stepId !== next.stepId || previous.index !== next.index;
      const automatic = !replaced && moved && expectedNext === next.stepId && next.index === previous.index + 1;
      context = next;
      if (replaced || moved && !automatic || !valid(next) || next.blocked) {
        pause(); publish({finished: false}); return;
      }
      if (moved) { invalidate(); expectedNext = null; publish({finished: false}); }
      if (!next.ready) invalidate();
      schedule();
    },
    play() {
      if (!valid(context) || context.blocked || !options.canAdvance()) return false;
      if (state.playing) return true;
      invalidate(); expectedNext = null;
      const epoch = generation;
      publish({playing: true, finished: false});
      if (epoch !== generation || !state.playing) return false;
      schedule(); return true;
    },
    pause,
    setSpeed(speed: number) {
      if (!isHeadTourSpeed(speed) || speed === state.speed) return;
      invalidate();
      const epoch = generation;
      publish({speed});
      if (epoch === generation) schedule();
    },
    state: () => ({...state}),
  };
}
