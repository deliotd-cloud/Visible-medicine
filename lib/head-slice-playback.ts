export type HeadSlicePlaybackSchedule = (callback: () => void, delayMs: number) => unknown;
export type HeadSlicePlaybackCancel = (handle: unknown) => void;

export type HeadSlicePlaybackOptions = {
  slice: number;
  sliceCount: number;
  fps: number;
  direction?: 1 | -1;
  onSlice: (slice: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  schedule: HeadSlicePlaybackSchedule;
  cancel: HeadSlicePlaybackCancel;
};

export type HeadSlicePlaybackController = {
  play: () => boolean;
  pause: () => void;
  restart: () => boolean;
  setDirection: (direction: 1 | -1) => void;
  setSlice: (slice: number) => void;
  configure: (sliceCount: number, fps: number) => void;
  reset: (slice: number, sliceCount: number, fps: number) => void;
  isPlaying: () => boolean;
};

const validSlice = (value: number, count: number) =>
  Number.isInteger(value) && Number.isInteger(count) && count >= 2 && value >= 0 && value < count;
const validFps = (value: number) => value === 2 || value === 4 || value === 6;

/** Advances native slice indices only. It carries no scan data or playback history. */
export function createHeadSlicePlaybackController(options: HeadSlicePlaybackOptions): HeadSlicePlaybackController {
  let slice = options.slice;
  let count = options.sliceCount;
  let fps = options.fps;
  let direction = options.direction ?? 1;
  let playing = false;
  let timer: unknown;
  let generation = 0;

  const invalidate = () => {
    generation++;
    if (timer !== undefined) options.cancel(timer);
    timer = undefined;
  };
  const setPlaying = (next: boolean) => {
    if (playing === next) return;
    playing = next;
    options.onPlayingChange?.(next);
  };
  const pause = () => {
    invalidate();
    setPlaying(false);
  };
  const valid = () => validSlice(slice, count) && validFps(fps) && (direction === 1 || direction === -1);
  const atEnd = () => direction === 1 ? slice >= count - 1 : slice <= 0;
  const scheduleNext = () => {
    const expected = generation;
    timer = options.schedule(() => {
      if (!playing || expected !== generation) return;
      timer = undefined;
      if (!valid() || atEnd()) {
        pause();
        return;
      }
      slice += direction;
      options.onSlice(slice);
      if (!playing || expected !== generation) return;
      if (atEnd()) pause();
      else scheduleNext();
    }, 1000 / fps);
  };

  const play = () => {
    if (playing) return true;
    if (!valid() || atEnd()) return false;
    invalidate();
    const expected = generation;
    setPlaying(true);
    // Notifications may synchronously pause, reset or replace this start.
    if (!playing || expected !== generation) return false;
    scheduleNext();
    return true;
  };
  return {
    play,
    pause,
    restart() {
      if (!valid()) return false;
      const expected = generation + 1;
      pause();
      if (expected !== generation) return false;
      slice = direction === 1 ? 0 : count - 1;
      options.onSlice(slice);
      // A reset, manual pause or disposal during onSlice must retire this replay.
      if (expected !== generation) return false;
      return play();
    },
    setDirection(next) {
      if (direction === next) return;
      direction = next;
      pause();
    },
    setSlice(next) {
      if (slice === next) return;
      slice = next;
      if (!valid() || atEnd()) pause();
    },
    configure(nextCount, nextFps) {
      if (count === nextCount && fps === nextFps) return;
      const countChanged = count !== nextCount;
      count = nextCount;
      fps = nextFps;
      invalidate();
      if (countChanged || !valid() || atEnd()) setPlaying(false);
      else if (playing) scheduleNext();
    },
    reset(nextSlice, nextCount, nextFps) {
      slice = nextSlice;
      count = nextCount;
      fps = nextFps;
      pause();
    },
    isPlaying: () => playing,
  };
}
