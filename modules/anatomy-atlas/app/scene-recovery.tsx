'use client';
import {
  Component,
  Fragment,
  createRef,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Button } from '@/components/ui/button';
import {
  copyRecoveryCamera,
  observeRenderer,
  type RendererHealth,
} from '@/lib/renderer-health';
import type { StudyCamera } from '@/lib/study-views';
import './scene-recovery.css';

export function RendererMonitor({
  onHealth,
}: {
  onHealth: (health: RendererHealth) => void;
}) {
  const { gl, invalidate } = useThree();
  const observer = useRef<ReturnType<typeof observeRenderer> | null>(null);
  useEffect(() => {
    const current = observeRenderer(
      gl.domElement,
      () => gl.getContext().isContextLost(),
      onHealth,
      invalidate,
    );
    observer.current = current;
    return () => {
      current.dispose();
      if (observer.current === current) observer.current = null;
    };
  }, [gl, invalidate, onHealth]);
  useFrame(() => observer.current?.frame());
  return null;
}

export function SceneRecoveryNotice({
  health,
  onRetry,
}: {
  health: RendererHealth;
  onRetry: () => void;
}) {
  if (health === 'ready') return null;
  const title =
    health === 'starting'
      ? 'Starting the 3D view…'
      : health === 'restoring'
        ? 'Restoring the 3D view…'
        : health === 'lost'
          ? 'The 3D view was interrupted'
          : 'The 3D view could not continue';
  return (
    <output
      className="vm-scene-recovery-notice"
      aria-live="polite"
      aria-atomic="true"
    >
      <strong>{title}</strong>
      <span className="vm-scene-recovery-detail">
        Your dissection settings and answers are retained. Practice waits until
        the model is available.
      </span>
      <Button type="button" variant="outline" onClick={onRetry}>
        Restart 3D view
      </Button>
      <small>
        If it still cannot start, try a browser with 3D graphics enabled.
        Structure information remains available outside the view.
      </small>
    </output>
  );
}

type Props = {
  className: string;
  cameraKey: string;
  children: (onHealth: (health: RendererHealth) => void) => ReactNode;
  onHealth: (health: RendererHealth) => void;
  cameraCapture?: RefObject<StudyCamera | null>;
  cameraRestore?: RefObject<StudyCamera | null>;
};
type State = { health: RendererHealth; attempt: number };
/** DOM recovery UI survives a stopped canvas. Anatomy and study state stay above it. */
export class SceneRecovery extends Component<Props, State> {
  state: State = { health: 'starting', attempt: 0 };
  private alive = true;
  private generation = 0;
  private lastReadyCameraKey: string | null = null;
  private returnFocus = false;
  private container = createRef<HTMLElement>();
  static getDerivedStateFromError(): Partial<State> {
    return { health: 'failed' };
  }
  componentDidMount() {
    this.alive = true;
    this.props.onHealth('starting');
  }
  componentDidCatch() {
    this.props.onHealth('failed');
  }
  componentWillUnmount() {
    this.alive = false;
  }
  componentDidUpdate(_props: Props, previous: State) {
    if (this.state.health === 'ready')
      this.lastReadyCameraKey = this.props.cameraKey;
    if (
      previous.health !== 'ready' &&
      this.state.health === 'ready' &&
      this.returnFocus
    ) {
      this.returnFocus = false;
      const element = this.container.current;
      if (
        element &&
        (document.activeElement === document.body ||
          element.contains(document.activeElement))
      )
        element.focus({ preventScroll: true });
    }
  }
  private updateHealth = (generation: number, health: RendererHealth) => {
    if (
      !this.alive ||
      generation !== this.generation ||
      this.state.health === 'failed'
    )
      return;
    this.props.onHealth(health);
    if (health === 'ready') this.lastReadyCameraKey = this.props.cameraKey;
    this.setState({ health });
  };
  report = (health: RendererHealth) => this.updateHealth(0, health);
  retry = () => {
    if (!this.alive || this.state.health === 'ready') return;
    // An explicitly queued saved-view camera takes precedence over the last orbit.
    if (
      this.props.cameraRestore &&
      !this.props.cameraRestore.current &&
      this.lastReadyCameraKey !== null &&
      this.lastReadyCameraKey === this.props.cameraKey
    )
      this.props.cameraRestore.current = copyRecoveryCamera(
        this.props.cameraCapture?.current ?? null,
      );
    this.returnFocus = true;
    const generation = ++this.generation;
    this.report = (health: RendererHealth) =>
      this.updateHealth(generation, health);
    this.props.onHealth('starting');
    this.setState({ health: 'starting', attempt: generation });
  };
  render() {
    const ready = this.state.health === 'ready';
    return (
      <section
        ref={this.container}
        className={this.props.className + ' vm-scene-recovery'}
        data-health={this.state.health}
        tabIndex={-1}
        aria-label="Interactive 3D anatomy"
      >
        <div
          className="vm-scene-recovery-viewport"
          inert={!ready}
          aria-hidden={!ready}
        >
          {this.state.health !== 'failed' && (
            <Fragment key={this.state.attempt}>
              {this.props.children(this.report)}
            </Fragment>
          )}
        </div>
        <SceneRecoveryNotice health={this.state.health} onRetry={this.retry} />
      </section>
    );
  }
}
