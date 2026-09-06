'use client';
import { ArrowLeft, ArrowRight, RotateCcw, Undo2, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  DissectionProfile,
  DissectionState,
  DissectionStage,
} from './dissection-data';
import type { BodyStructure } from './body-types';

export function DissectionControls({
  profile,
  state,
  onStage,
  onFocus,
  onUndo,
  onReset,
  ghost,
  onGhost,
  visibleCount,
  disabled,
}: {
  profile: DissectionProfile;
  state: DissectionState;
  onStage: (id: string) => void;
  onFocus: (id: string) => void;
  onUndo: () => void;
  onReset: () => void;
  ghost: boolean;
  onGhost: (value: boolean) => void;
  visibleCount: number;
  disabled: boolean;
}) {
  const index = profile.stages.findIndex((s) => s.id === state.stageId),
    stage = profile.stages[index];
  const title = state.focusId
    ? profile.focuses.find((f) => f.id === state.focusId)?.title
    : (stage?.title ?? 'Free exploration');
  return (
    <section
      className="dissection-deck"
      aria-label="Guided dissection controls"
    >
      <div className="dissection-deck-heading">
        <Layers3 />
        <strong>Guided dissection</strong>
        <span>{visibleCount} visible</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={disabled || !state.history.length}
          aria-label="Undo last dissection change"
        >
          <Undo2 />
          Undo
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset} disabled={disabled}>
          <RotateCcw />
          Reassemble
        </Button>
      </div>
      <div className="dissection-step-row">
        <Button
          size="icon"
          variant="outline"
          disabled={disabled || index <= 0}
          onClick={() => onStage(profile.stages[index - 1].id)}
          aria-label="Previous dissection stage"
        >
          <ArrowLeft />
        </Button>
        <Select
          value={index < 0 ? 'free' : state.stageId}
          onValueChange={(id) => {
            if (id) onStage(id);
          }}
        >
          <SelectTrigger
            disabled={disabled}
            aria-label="Choose dissection stage"
          >
            <SelectValue>
              {index >= 0 ? `${index + 1} / ${profile.stages.length} · ` : ''}
              {title}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free exploration</SelectItem>
            {profile.stages.map((s, i) => (
              <SelectItem key={s.id} value={s.id}>
                {i + 1}. {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          disabled={disabled || index === profile.stages.length - 1}
          onClick={() =>
            onStage(profile.stages[index + 1]?.id ?? profile.stages[0].id)
          }
          aria-label="Next dissection stage"
        >
          <ArrowRight />
        </Button>
      </div>
      <div className="dissection-track" aria-label="Dissection sequence">
        {profile.stages.map((s, i) => (
          <button
            key={s.id}
            type="button"
            title={s.title}
            aria-label={`Stage ${i + 1}: ${s.title}`}
            aria-current={s.id === state.stageId ? 'step' : undefined}
            disabled={disabled}
            onClick={() => onStage(s.id)}
            className={`${i <= index ? 'reached' : ''} ${i === index ? 'current' : ''}`}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="dissection-options">
        <label htmlFor="ghost-tissues">
          <Switch
            id="ghost-tissues"
            checked={ghost}
            onCheckedChange={onGhost}
            disabled={disabled}
            aria-label="Ghost removed tissues"
          />
          <span>Ghost removed tissues</span>
        </label>
        {profile.focuses.length > 0 && (
          <Select
            value={state.focusId ?? 'none'}
            onValueChange={(id) => {
              if (id && id !== 'none') onFocus(id);
              else if (id === 'none') onStage('assembled');
            }}
          >
            <SelectTrigger
              disabled={disabled}
              aria-label="Focused compartment view"
            >
              <SelectValue>
                {state.focusId
                  ? profile.focuses.find((f) => f.id === state.focusId)?.title
                  : 'Compartment views'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Assembled region</SelectItem>
              {profile.focuses.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </section>
  );
}

export function DissectionGuide({
  profile,
  stage,
  focusTitle,
  removed,
  visible,
  onRestore,
  onSelect,
  customized,
}: {
  profile: DissectionProfile;
  stage: DissectionStage | undefined;
  focusTitle?: string;
  removed: BodyStructure[];
  visible: BodyStructure[];
  onRestore: (id: string) => void;
  onSelect: (id: string) => void;
  customized: boolean;
}) {
  const landmarks = (stage?.landmarks ?? []).flatMap((pattern) =>
    visible
      .filter((s) => new RegExp(pattern, 'i').test(s.sourceName))
      .slice(0, 2),
  );
  const unique = [...new Map(landmarks.map((s) => [s.id, s])).values()].slice(
    0,
    8,
  );
  return (
    <section className="dissection-guide" aria-label="Dissection study guide">
      <div className="eyebrow">
        {focusTitle
          ? 'FOCUSED STUDY'
          : stage?.kind === 'window'
            ? 'EXPOSURE WINDOW'
            : 'REGIONAL DISSECTION'}
        {customized ? ' · CUSTOMISED' : ''}
      </div>
      <h2>{focusTitle ?? stage?.title ?? profile.title}</h2>
      <p>
        {focusTitle
          ? 'This focused view retains the selected muscle or organ group with available skeletal context.'
          : (stage?.description ?? profile.orientation)}
      </p>
      <div className="dissection-inspect">
        <strong>Look for</strong>
        <p>
          {stage?.inspect ??
            'Rotate, select a structure and use Remove to create your own view. Undo and Reassemble restore your changes.'}
        </p>
      </div>
      {unique.length > 0 && (
        <div className="dissection-landmarks" aria-label="Stage landmarks">
          {unique.map((s) => (
            <button type="button" key={s.id} onClick={() => onSelect(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      <details className="dissection-removed">
        <summary>Removed from this view ({removed.length})</summary>
        {removed.length ? (
          <div>
            {removed.map((s) => (
              <button type="button" key={s.id} onClick={() => onRestore(s.id)}>
                <span>{s.name}</span>
                <small>Restore</small>
              </button>
            ))}
          </div>
        ) : (
          <p>
            No structures removed. System switches are separate from dissection
            removal.
          </p>
        )}
      </details>
      <details className="dissection-limits">
        <summary>Coverage & review limits</summary>
        <p>{profile.orientation}</p>
        <ul>
          {profile.limitations.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <p>
          Educational visibility stages · Not tissue cutting or an operative
          sequence. Independent anatomical review is pending.
        </p>
        {profile.references.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            Anatomical reference ↗
          </a>
        ))}
      </details>
    </section>
  );
}
