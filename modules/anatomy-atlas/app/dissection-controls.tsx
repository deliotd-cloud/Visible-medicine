'use client';
import { useMemo, useState } from 'react';
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
  DissectionFocus,
} from './dissection-data';
import { bodySystems, type BodyStructure, type BodySystem } from './body-types';
import {
  dissectionSections,
  dissectionTransition,
  filterRemovedStructures,
} from '@/lib/dissection-workbench';
import { stageStructures } from './dissection-data';

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
  structures,
  visibleIds,
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
  structures: BodyStructure[];
  visibleIds: string[];
  disabled: boolean;
}) {
  const { layers, windows } = useMemo(
    () => dissectionSections(profile),
    [profile],
  );
  const stage = profile.stages.find((s) => s.id === state.stageId);
  const layerMode =
    layers.length > 0 && stage?.kind !== 'window' && !state.focusId;
  const choices = layerMode ? layers : windows;
  const index = choices.findIndex((s) => s.id === state.stageId);
  const next = layerMode ? choices[index + 1] : undefined;
  const transition = useMemo(
    () =>
      next
        ? dissectionTransition(structures, profile, visibleIds, next.id)
        : null,
    [structures, profile, visibleIds, next],
  );
  const counts = useMemo(
    () =>
      new Map(
        layers.map((item) => [
          item.id,
          stageStructures(structures, profile, item.id).length,
        ]),
      ),
    [structures, profile, layers],
  );
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
        <strong>Dissection workspace</strong>
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
      <div className="dissection-modes" aria-label="Dissection mode">
        {layers.length > 0 && (
          <button
            type="button"
            aria-pressed={layerMode}
            disabled={disabled}
            onClick={() => onStage(layers[0].id)}
          >
            Layer by layer <small>{layers.length} steps</small>
          </button>
        )}
        <button
          type="button"
          aria-pressed={!layerMode}
          disabled={disabled || !windows.length}
          onClick={() => {
            if (windows[0]) onStage(windows[0].id);
          }}
        >
          Study windows <small>{windows.length} views</small>
        </button>
      </div>
      <p className="dissection-mode-note">
        {layerMode
          ? 'Remove available layers step by step. Missing skin, fascia or other tissues are not simulated.'
          : 'Independent views of selected structures—not successive dissection layers.'}
      </p>
      <div className="dissection-step-row">
        {layerMode && (
          <Button
            size="icon"
            variant="outline"
            disabled={disabled || index <= 0}
            onClick={() => onStage(choices[index - 1].id)}
            aria-label="Previous dissection stage"
          >
            <ArrowLeft />
          </Button>
        )}
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
              {index >= 0 && layerMode
                ? `${index + 1} / ${choices.length} · `
                : ''}
              {title}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free exploration</SelectItem>
            {choices.map((s, i) => (
              <SelectItem key={s.id} value={s.id}>
                {layerMode ? `${i + 1}. ` : ''}
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {layerMode && (
          <Button
            size="icon"
            variant="outline"
            disabled={disabled || !next}
            onClick={() => next && onStage(next.id)}
            aria-label="Next dissection stage"
          >
            <ArrowRight />
          </Button>
        )}
      </div>
      {layerMode && !disabled && (
        <ol
          className="dissection-layer-track"
          aria-label="Available layer sequence"
        >
          {layers.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                title={s.title}
                aria-label={`Stage ${i + 1}: ${s.title}`}
                aria-current={s.id === state.stageId ? 'step' : undefined}
                disabled={disabled}
                onClick={() => onStage(s.id)}
                className={i === index ? 'current' : ''}
              >
                <span>{i + 1}</span>
                <strong>{s.title}</strong>
                <small>{counts.get(s.id)} retained</small>
              </button>
            </li>
          ))}
        </ol>
      )}
      {transition && !disabled && (
        <details className="dissection-preview" key={next?.id}>
          <summary>
            Next: {transition.stage.title}
            <span>
              {transition.removed.length} to hide · {transition.restored.length}{' '}
              to restore
            </span>
          </summary>
          <p>{transition.stage.description}</p>
          <p>
            Starts a clean stage: manual changes, system filters and separation
            reset. Counts refer to catalogue visibility, including anatomy still
            loading.
          </p>
          {(
            [
              ['To hide', transition.removed],
              ['To restore', transition.restored],
            ] as const
          ).map(
            ([heading, items]) =>
              items.length > 0 && (
                <div key={heading}>
                  <strong>
                    {heading} ({items.length})
                  </strong>
                  <ul>
                    {items.map((item) => (
                      <li key={item.id}>{item.name}</li>
                    ))}
                  </ul>
                </div>
              ),
          )}
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onStage(transition.stage.id)}
          >
            Apply next step <ArrowRight />
          </Button>
        </details>
      )}
      {layerMode && !next && (
        <output className="dissection-mode-note">
          Layer sequence complete. Step back to restore layers, reassemble, or
          choose a study window.
        </output>
      )}
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
  focus,
  removed,
  visible,
  onRestore,
  onRestoreMany,
  onSelect,
  customized,
}: {
  profile: DissectionProfile;
  stage: DissectionStage | undefined;
  focus?: DissectionFocus;
  removed: BodyStructure[];
  visible: BodyStructure[];
  onRestore: (id: string) => void;
  onRestoreMany: (ids: string[]) => void;
  onSelect: (id: string) => void;
  customized: boolean;
}) {
  const [removedSearch, setRemovedSearch] = useState('');
  const [removedSystem, setRemovedSystem] = useState<BodySystem | 'all'>('all');
  const matches = useMemo(
    () => filterRemovedStructures(removed, removedSearch, removedSystem),
    [removed, removedSearch, removedSystem],
  );
  const landmarks = (focus?.landmarks ?? stage?.landmarks ?? []).flatMap(
    (pattern) =>
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
        {focus
          ? 'FOCUSED STUDY'
          : stage?.kind === 'window'
            ? 'EXPOSURE WINDOW'
            : 'REGIONAL DISSECTION'}
        {customized ? ' · CUSTOMISED' : ''}
      </div>
      <h2>{focus?.title ?? stage?.title ?? profile.title}</h2>
      <p>
        {focus
          ? (focus.description ??
            'This focused view retains the selected muscle or organ group with available skeletal context.')
          : (stage?.description ?? profile.orientation)}
      </p>
      <div className="dissection-inspect">
        <strong>Look for</strong>
        <p>
          {focus?.inspect ??
            stage?.inspect ??
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
          <>
            <div className="dissection-tray-filters">
              <input
                type="search"
                value={removedSearch}
                onChange={(e) => setRemovedSearch(e.target.value)}
                aria-label="Search removed structures"
                placeholder="Find a removed structure…"
              />
              <select
                value={removedSystem}
                onChange={(e) =>
                  setRemovedSystem(e.target.value as BodySystem | 'all')
                }
                aria-label="Filter removed structures by system"
              >
                <option value="all">All systems</option>
                {(Object.keys(bodySystems) as BodySystem[]).map((system) => (
                  <option key={system} value={system}>
                    {bodySystems[system].name} (
                    {removed.filter((item) => item.system === system).length})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!matches.length}
                onClick={() => onRestoreMany(matches.map((item) => item.id))}
              >
                Restore these {matches.length} structures
              </button>
              <output>
                {matches.length} of {removed.length} removed structures match.
                Group restoration can be undone in one step.
              </output>
            </div>
            <div className="dissection-tray-list">
              {matches.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => onRestore(s.id)}
                >
                  <span>{s.name}</span>
                  <small>Restore</small>
                </button>
              ))}
              {!matches.length && (
                <p>
                  No removed structures match. Clear the search or choose
                  another system.
                </p>
              )}
            </div>
          </>
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
