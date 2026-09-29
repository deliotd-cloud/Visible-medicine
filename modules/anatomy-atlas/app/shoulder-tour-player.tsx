import { Button } from '@/components/ui/button';
import { shoulderTour } from '@/lib/shoulder-tours';
import { structures } from './anatomy-data';
import { TourImagingNotes,tourImagingModalities } from './tour-imaging-notes';
import { TourStepPicker } from './tour-step-picker';
import './shoulder-tour-player.css';

export type ShoulderTourPlayerProps = {
  index: number | null;
  playing: boolean;
  ready: boolean;
  onStart: () => void;
  onPlayPause: () => void;
  onStep: (index: number) => void;
  onExit: () => void;
  onReadImaging: () => void;
};

export function ShoulderTourPlayer({ index, playing, ready, onStart, onPlayPause, onStep, onExit, onReadImaging }: ShoulderTourPlayerProps) {
  const step = index !== null && Number.isInteger(index) ? shoulderTour.steps[index] : undefined;
  if (!step) return (
    <section className="shoulder-tour-start" aria-label="Guided learning tours">
      <div><h3>{shoulderTour.title}</h3><p>Five guided stops from the deltoid to the rotator cuff. Camera, layers and captions change together.</p><small>Agent-authored · Clinical review pending</small></div>
      <Button type="button" variant="outline" disabled={!ready} onClick={onStart}>Start guided tour</Button>
    </section>
  );
  const activeIndex = index!;
  const selected = structures.find(s=>s.id===step.selectedId);
  const last = activeIndex === shoulderTour.steps.length - 1;
  return (
    <section className="shoulder-tour-player" aria-label={shoulderTour.title}>
      <div className="shoulder-tour-heading">
        <strong aria-live="polite" aria-atomic="true">{step.title}</strong>
        <TourStepPicker steps={shoulderTour.steps} index={activeIndex} ready={ready}
          onPause={onReadImaging} onStep={onStep}/>
      </div>
      <p aria-live="polite" aria-atomic="true">{step.caption}</p>
      <details className="shoulder-tour-evidence" onToggle={event=>{if(event.currentTarget.open)onReadImaging();}}>
        <summary>References · draft, review pending</summary>
        <ul>{step.references.map(reference => <li key={reference}><a href={reference} target="_blank" rel="noreferrer">Upper limb muscle anatomy reference</a></li>)}</ul>
        <p>Teaching draft. Source surfaces are retained; no injury or scan is simulated.</p>
        <p>Other view controls are suspended during the tour. Exit restores your starting view.</p>
      </details>
      {selected&&<TourImagingNotes key={step.id} structureName={selected.name}
        lessons={tourImagingModalities.map(({id,label})=>({id,label,content:selected.sections[id]}))}
        onOpen={onReadImaging}/>}
      {!ready && <output>Playback paused while the model is unavailable. You can still exit.</output>}
      <div className="shoulder-tour-controls">
        <Button type="button" variant="outline" disabled={!ready || activeIndex === 0} onClick={() => onStep(activeIndex - 1)}>Back</Button>
        <Button type="button" variant="outline" disabled={!ready} aria-pressed={playing} onClick={onPlayPause}>{playing ? 'Pause' : 'Play'}</Button>
        <Button type="button" variant="outline" disabled={!ready} onClick={() => last ? onExit() : onStep(activeIndex + 1)}>{last ? 'Finish' : 'Next'}</Button>
        <Button type="button" variant="ghost" onClick={onExit}>Exit tour</Button>
      </div>
    </section>
  );
}
