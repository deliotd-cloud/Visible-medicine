import type { ReactNode } from 'react';
import type {
  ReconcilerRoot,
  RenderProps,
  RootState,
  RootStore,
  Size,
} from '@react-three/fiber';
import { Scene } from 'three';

type Root = ReconcilerRoot<HTMLCanvasElement>;
type Options = {
  root: Root;
  host: HTMLElement;
  onFailure: () => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
};

/** One root, one awaited setup and an on-demand frame queue. No global hooks. */
export class AnatomyRootSession {
  private active = true;
  private failed = false;
  private configured = false;
  private initialized = false;
  private drawing = false;
  private disposedRoot = false;
  private frame: number | null = null;
  private frames = 0;
  private firstTimestamp: number | null = null;
  private elapsed = 0;
  private store: RootStore | null = null;
  private unsubscribe: (() => void) | null = null;
  private originalInvalidate: RootState['invalidate'] | null = null;
  private node: ReactNode = null;
  private size: Size | null = null;
  private dpr: number | [number, number] = [1, 2];

  private readonly options: Options;
  constructor(options: Options) {
    this.options = options;
  }

  fail = () => {
    if (!this.active || this.failed) return;
    this.failed = true;
    this.cancel();
    this.options.onFailure();
  };

  private cancel() {
    if (this.frame !== null) this.options.cancelFrame(this.frame);
    this.frame = null;
    this.frames = 0;
  }

  invalidate = (frames = 1) => {
    if (!this.active || this.failed) return;
    // Match demand semantics, including a further frame requested during a draw.
    const requested = Number.isFinite(frames)
      ? Math.max(1, Math.floor(frames))
      : 1;
    this.frames =
      requested > 1
        ? Math.min(60, this.frames + requested)
        : Math.max(this.frames, this.drawing ? 2 : 1);
    if (this.initialized && !this.drawing && this.frame === null)
      this.frame = this.options.requestFrame(this.draw);
  };

  private draw = (timestamp: number) => {
    this.frame = null;
    if (!this.active || this.failed || !this.initialized || !this.store) return;
    this.drawing = true;
    try {
      if (!Number.isFinite(timestamp)) throw Error('Invalid frame time');
      this.firstTimestamp ??= timestamp;
      this.elapsed = Math.max(
        this.elapsed,
        (timestamp - this.firstTimestamp) / 1000,
      );
      // R3F's manual clock expects seconds. false excludes unrelated global effects.
      // Its own subscriber ordering, drawing and raycast/label state are preserved.
      this.store.getState().advance(this.elapsed, false);
    } catch {
      this.fail();
    } finally {
      this.drawing = false;
    }
    if (!this.active || this.failed) return;
    this.frames = Math.max(0, this.frames - 1);
    if (this.frames > 0) this.frame = this.options.requestFrame(this.draw);
  };

  private created = (state: RootState) => {
    if (!this.active || this.failed) return;
    try {
      state.events.connect?.(this.options.host);
      this.initialized = true;
      this.invalidate();
    } catch {
      this.fail();
    }
  };

  async start(config: RenderProps<HTMLCanvasElement>, children: ReactNode) {
    this.node = children;
    this.size ??= config.size ?? null;
    this.dpr = config.dpr ?? this.dpr;
    try {
      await this.options.root.configure({
        ...config,
        frameloop: 'never',
        onCreated: this.created,
      });
      this.configured = true;
      if (!this.active || this.failed) return;
      // render() returns the store before the React commit. Install the local
      // invalidator before scene hooks subscribe (including OrbitControls/Html).
      this.store = this.options.root.render(this.node);
      this.originalInvalidate = this.store.getState().invalidate;
      this.store.setState({ invalidate: this.invalidate });
      this.unsubscribe = this.store.subscribe(() => this.invalidate());
      this.resizeNow();
    } catch {
      // R3F 9.7 can reject before creating its scene. Its public unmount path
      // expects a scene even in that case. render(null) exposes the existing
      // store without committing children: the failed configure remains pending.
      // Supply an empty disposal target, not a rendered replacement anatomy.
      try {
        if (!this.store) {
          this.store = this.options.root.render(null);
          // Do not notify store subscribers: its invalidator assumes gl exists.
          // This root is terminal and the value is exclusively for disposal.
          if (!this.store.getState().scene)
            this.store.getState().scene = new Scene();
        }
      } catch {
        // A secondary setup/cleanup exception must not escape the async owner.
        // Still expose recovery; the root's public unmount is attempted below.
      } finally {
        this.fail();
      }
    } finally {
      this.configured = true;
      if (!this.active) this.unmountRoot();
    }
  }

  render(children: ReactNode) {
    this.node = children;
    if (!this.active || this.failed || !this.store) return;
    try {
      this.options.root.render(children);
      this.invalidate();
    } catch {
      this.fail();
    }
  }

  resize(size: Size, dpr: number | [number, number]) {
    this.size = size;
    this.dpr = dpr;
    this.resizeNow();
  }

  private resizeNow() {
    if (!this.active || this.failed || !this.store || !this.size) return;
    const { width, height, top, left } = this.size;
    if (
      ![width, height, top, left].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0
    )
      return;
    try {
      const state = this.store.getState();
      if (
        width !== state.size.width ||
        height !== state.size.height ||
        top !== state.size.top ||
        left !== state.size.left
      )
        state.setSize(width, height, top, left);
      state.setDpr(this.dpr);
      this.invalidate();
    } catch {
      this.fail();
    }
  }

  private unmountRoot() {
    if (this.disposedRoot) return;
    this.disposedRoot = true;
    this.options.root.unmount();
  }

  dispose() {
    if (!this.active) return;
    this.active = false;
    this.cancel();
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (
      this.store?.getState().invalidate === this.invalidate &&
      this.originalInvalidate
    )
      this.store.setState({ invalidate: this.originalInvalidate });
    // Do not dispose a half-configured renderer while its async factory is still
    // resolving. start's finally retires it, without rendering or reporting late.
    if (this.configured) this.unmountRoot();
  }
}
