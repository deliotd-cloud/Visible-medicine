'use client';
import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Undo2,
  Redo2,
  Layers3,
} from 'lucide-react';
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
import { StudyLibrary } from './study-library';
import { DissectionOrientation } from './dissection-orientation';
import type { DissectionGuidance } from '@/lib/dissection-guidance';
import type { DissectionView } from './dissection-data';

export function DissectionControls({
  profile,
  state,
  onStage,
  onFocus,
  onUndo,
  onRedo,
  onReset,
  ghost,
  onGhost,
  visibleCount,
  structures,
  visibleIds,
  loaded,
  failed,
  disabled,
}: {
  profile: DissectionProfile;
  state: DissectionState;
  onStage: (id: string) => void;
  onFocus: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  ghost: boolean;
  onGhost: (value: boolean) => void;
  visibleCount: number;
  structures: BodyStructure[];
  visibleIds: string[];
  loaded: string[];
  failed: string[];
  disabled: boolean;
}) {
  const { layers, windows } = useMemo(
    () => dissectionSections(profile),
    [profile],
  );
  const stage = profile.stages.find((s) => s.id === state.stageId);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryOpened, setLibraryOpened] = useState(false);
  const libraryTrigger = useRef<HTMLButtonElement>(null);
  const layerMode =
    layers.length > 0 && stage?.kind !== 'window' && !state.focusId;
  const choices = layerMode ? layers : windows;
  const showLayers = layerMode && !libraryOpen;
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
        <span title="Enabled by the current layers and system filters; models may still be loading or unavailable.">
          {visibleCount} enabled
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={disabled || !state.history.length}
          aria-label="Undo last dissection change"
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Undo a dissection step or removal (Ctrl/Cmd+Z); camera and display settings are separate"
        >
          <Undo2 />
          Undo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRedo}
          disabled={disabled || !state.future.length}
          aria-label="Redo last undone dissection change"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          title="Reapply the last undone dissection change (Ctrl/Cmd+Shift+Z or Ctrl+Y)"
        >
          <Redo2 />
          Redo
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
            aria-pressed={showLayers}
            disabled={disabled}
            onClick={() => {
              setLibraryOpen(false);
              onStage(layers[0].id);
            }}
          >
            Layer by layer <small>{layers.length} steps</small>
          </button>
        )}
        <button
          type="button"
          ref={libraryTrigger}
          aria-pressed={libraryOpen}
          disabled={disabled || (!windows.length && !profile.focuses.length)}
          onClick={() => {
            setLibraryOpened(true);
            setLibraryOpen((value) => !value);
          }}
        >
          Study windows & focuses <small>Search & preview</small>
        </button>
      </div>
      <p className="dissection-mode-note">
        {showLayers
          ? 'Remove available layers step by step. Missing skin, fascia or other tissues are not simulated.'
          : 'Independent views of selected structures—not successive dissection layers.'}
      </p>
      <p className="dissection-current-view">
        Current recipe: <strong>{title}</strong>
      </p>
      <div hidden={!libraryOpen}>
        {libraryOpened && (
          <StudyLibrary
            profile={profile}
            state={state}
            structures={structures}
            visibleIds={visibleIds}
            loaded={loaded}
            failed={failed}
            disabled={disabled}
            onStage={(id) => {
              onStage(id);
              setLibraryOpen(false);
              libraryTrigger.current?.focus();
            }}
            onFocus={(id) => {
              onFocus(id);
              setLibraryOpen(false);
              libraryTrigger.current?.focus();
            }}
          />
        )}
      </div>
      {showLayers && (
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
      )}
      {showLayers && !disabled && (
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
      {showLayers && transition && !disabled && (
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
      {showLayers && !next && (
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
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            onStage('free');
            setLibraryOpen(false);
          }}
        >
          Free exploration
        </Button>
      </div>
    </section>
  );
}

export function DissectionGuide({
  guidance,
  side,
  view,
  onOrient,
  onRecipe,
  profile,
  stage,
  focus,
  removed,
  onRestore,
  onRestoreMany,
  onSelect,
  customized,
}: {
  guidance: DissectionGuidance;
  side: string;
  view: DissectionView;
  onOrient: () => void;
  onRecipe: (kind: 'recipe' | 'next') => void;
  profile: DissectionProfile;
  stage: DissectionStage | undefined;
  focus?: DissectionFocus;
  removed: BodyStructure[];
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
      <DissectionOrientation
        guide={guidance}
        side={side}
        view={view}
        onOrient={onOrient}
        onSelect={onSelect}
        onRecipe={onRecipe}
      />
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
        {[...new Set(profile.references)].map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            Anatomical reference ↗
          </a>
        ))}
      </details>
    </section>
  );
}
