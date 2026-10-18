'use client';
import { Component, createRef, type ReactNode } from 'react';
import {
  createRoot,
  events,
  extend,
  type Catalogue,
  type RenderProps,
} from '@react-three/fiber';
import * as THREE from 'three';
import { AnatomyRootSession } from '@/atlas-review/lib/anatomy-root-session';
import './camera-keyboard.css';

type Props = Pick<
  RenderProps<HTMLCanvasElement>,
  'camera' | 'orthographic' | 'shadows' | 'dpr' | 'gl'
> & {
  children: ReactNode;
  frameloop: 'demand';
  onFailure: () => void;
};

/** React scene errors must cross the separate R3F root into the DOM recovery UI. */
export class AnatomyCanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Atlas-specific canvas. Scene data arrives via props; R3F owns its scene context.
 * Fresh physical canvases prevent retired-root cleanup from touching a new attempt.
 */
export class AnatomyCanvas extends Component<Props> {
  private host = createRef<HTMLDivElement>();
  private session: AnatomyRootSession | null = null;
  private surface: HTMLCanvasElement | null = null;
  private observer: ResizeObserver | null = null;
  private alive = false;
  private failed = false;
  private fail = () => {
    if (!this.alive || this.failed) return;
    this.failed = true;
    this.props.onFailure();
  };
  private contents = () => (
    <AnatomyCanvasBoundary onFailure={this.session?.fail ?? this.fail}>
      {this.props.children}
    </AnatomyCanvasBoundary>
  );
  private measure = () => {
    if (!this.alive || this.failed || !this.host.current || !this.surface)
      return;
    try {
      const { width, height, top, left } =
        this.host.current.getBoundingClientRect();
      if (
        ![width, height, top, left].every(Number.isFinite) ||
        width <= 0 ||
        height <= 0
      )
        return;
      const size = { width, height, top, left };
      if (this.session) {
        this.session.resize(size, this.props.dpr ?? [1, 2]);
        return;
      }
      // Match the standard Canvas's complete native Three.js catalogue.
      extend(THREE as unknown as Catalogue);
      this.session = new AnatomyRootSession({
        root: createRoot(this.surface),
        host: this.host.current,
        onFailure: this.fail,
        requestFrame: (fn) => window.requestAnimationFrame(fn),
        cancelFrame: (id) => window.cancelAnimationFrame(id),
      });
      const { camera, orthographic, shadows, dpr, gl } = this.props;
      // start owns its rejection handler; no unhandled configure promise escapes.
      void this.session.start(
        { camera, orthographic, shadows, dpr, gl, events, size },
        this.contents(),
      );
    } catch {
      this.fail();
    }
  };
  componentDidMount() {
    this.alive = true;
    this.failed = false;
    const host = this.host.current;
    if (!host) return;
    try {
      this.surface = document.createElement('canvas');
      this.surface.style.display = 'block';
      host.appendChild(this.surface);
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(host);
      window.addEventListener('resize', this.measure);
      window.addEventListener('scroll', this.measure, true);
      this.measure();
    } catch {
      this.fail();
    }
  }
  componentDidUpdate() {
    this.session?.render(this.contents());
    this.measure();
  }
  componentWillUnmount() {
    this.alive = false;
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener('resize', this.measure);
    window.removeEventListener('scroll', this.measure, true);
    this.session?.dispose();
    this.session = null;
    this.surface?.remove();
    this.surface = null;
  }
  render() {
    return (
      <div
        ref={this.host}
        className="vm-anatomy-canvas"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      />
    );
  }
}
