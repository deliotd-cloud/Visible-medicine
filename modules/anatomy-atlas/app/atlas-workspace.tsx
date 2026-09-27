'use client';

import {groupAtlasSearchResults} from '../lib/atlas-search-presentation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useId,
  type ReactNode,
  type KeyboardEventHandler,
} from 'react';
import Link from 'next/link';
import { Search, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  workspaceModes,
  cameraDirections,
  directionLabel,
  atlasSearchIndex,
  filterAtlasSearch,
  type WorkspaceMode,
  type CameraDirection,
  type AtlasSearchEntry,
} from '@/lib/atlas-navigation';
import type { BodyCatalog, BodyStructure } from './body-types';
import { bodyContent } from './body-content';
import { StructureQuickCheck } from './structure-quick-check';
import type { StudySide } from '@/lib/study-links';
import type { ContentTab } from './anatomy-data';
import { atlasPanelLayout } from '@/lib/atlas-panel-layout';
import {
  initialNoteNavigation,
  chooseNoteGroup,
  chooseNoteSection,
  noteGroups,
  type NoteGroup,
} from '@/lib/atlas-note-navigation';
export { noteGroups } from '@/lib/atlas-note-navigation';
import './atlas-panel.css';

const emptyWorkspace = {
  mode: 'explore' as WorkspaceMode,
  exam: false,
  focusView: false,
  panels: { tools: false, info: false },
  panelLayout: null as ReturnType<typeof atlasPanelLayout> | null,
  setPanelOpen: (_info: boolean, _open: boolean) => {},
  chooseMode: (_mode: WorkspaceMode) => {},
  toggleFocus: () => {},
  showInfo: () => {},
  noteNavigation: initialNoteNavigation(),
  setNoteGroup: (_value: unknown) => {},
  setNoteSection: (_group: NoteGroup, _value: unknown) => {},
};
const WorkspaceContext = createContext(emptyWorkspace);
export const useAtlasWorkspace = () => useContext(WorkspaceContext);
export function AtlasWorkspace({
  children,
  exam,
  className = '',
  presentation = 'standalone',
  session,
  onKeyDown,
}: {
  children: ReactNode;
  exam: boolean;
  className?: string;
  presentation?: 'standalone' | 'panel';
  session?: { mode: WorkspaceMode; chooseMode: (mode: WorkspaceMode) => void };
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}) {
  const boundary = useRef<HTMLElement | null>(null);
  const [measured, setMeasured] = useState(() => atlasPanelLayout(0, 0));
  const panelLayout = presentation === 'panel' ? measured : null;
  const Root = presentation === 'panel' ? 'section' : 'main';
  useEffect(() => {
    if (presentation !== 'panel' || !boundary.current) return;
    const element = boundary.current;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      const next = atlasPanelLayout(width, height);
      setMeasured(old => old.tools === next.tools && old.info === next.info && old.short === next.short ? old : next);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    globalThis.addEventListener('resize', measure);
    return () => { observer?.disconnect(); globalThis.removeEventListener('resize', measure); };
  }, [presentation]);
  const [chosen, setChosen] = useState<WorkspaceMode>('explore'),
    [focusView, setFocusView] = useState(false);
  const [panels, setPanels] = useState({ tools: false, info: false });
  // The desktop aside and focus/mobile sheet have different React parents.
  // Keep navigation above that remount boundary, isolated to this workspace.
  const [noteNavigation, setNoteNavigation] = useState(initialNoteNavigation);
  const setNoteGroup = useCallback((value: unknown) => {
    setNoteNavigation(current => chooseNoteGroup(current, value, exam));
  }, [exam]);
  const setNoteSection = useCallback((group: NoteGroup, value: unknown) => {
    setNoteNavigation(current => chooseNoteSection(current, group, value, exam));
  }, [exam]);
  const setPanelOpen = useCallback((info: boolean, open: boolean) => {
    setPanels((current) =>
      open
        ? { tools: !info, info }
        : { ...current, [info ? 'info' : 'tools']: false },
    );
  }, []);
  const mode = exam ? 'practice' : session?.mode ?? chosen;
  const chooseMode = useCallback(
    (next: WorkspaceMode) => {
      if (exam && next !== 'practice') return;
      if (session) session.chooseMode(next);
      else setChosen(next);
      if (next === 'dissect') setPanelOpen(false, true);
      if (next === 'practice') setPanelOpen(true, true);
    },
    [exam, setPanelOpen, session],
  );
  const showInfo = useCallback(() => setPanelOpen(true, true), [setPanelOpen]);
  const toggleFocus = useCallback(() => {
    setPanels({ tools: false, info: false });
    setFocusView((v) => !v);
  }, []);
  return (
    <WorkspaceContext.Provider
      value={{
        mode,
        exam,
        focusView,
        panels,
        panelLayout,
        setPanelOpen,
        chooseMode,
        toggleFocus,
        showInfo,
        noteNavigation,
        setNoteGroup,
        setNoteSection,
      }}
    >
      <Root
        ref={boundary}
        onKeyDown={onKeyDown}
        aria-label={presentation === 'panel' ? '3D anatomy module' : undefined}
        className={className ? `body-app ${className}` : 'body-app'}
        data-presentation={presentation}
        data-panel-tools={panelLayout?.tools}
        data-panel-info={panelLayout?.info}
        data-panel-short={panelLayout?.short}
        data-workspace-mode={mode}
        data-focus-view={focusView}
      >
        {children}
      </Root>
    </WorkspaceContext.Provider>
  );
}
export function WorkspaceModes() {
  const { mode, exam, chooseMode } = useAtlasWorkspace(),
    id = useId();
  return (
    <RadioGroup
      className="atlas-workspace-modes"
      aria-label="Workspace mode"
      value={mode}
      onValueChange={(value) => {
        if (workspaceModes.includes(value as WorkspaceMode))
          chooseMode(value as WorkspaceMode);
      }}
    >
      {workspaceModes.map((value) => (
        <label
          key={value}
          htmlFor={`${id}-${value}`}
          data-active={mode === value}
        >
          <RadioGroupItem
            id={`${id}-${value}`}
            value={value}
            disabled={exam && value !== 'practice'}
          />
          {value === 'explore'
            ? 'Explore'
            : value === 'dissect'
              ? 'Dissect'
              : 'Practice'}
        </label>
      ))}
    </RadioGroup>
  );
}
export function WorkspaceOnly({
  modes,
  children,
  className = '',
}: {
  modes: WorkspaceMode[];
  children: ReactNode;
  className?: string;
}) {
  const { mode } = useAtlasWorkspace();
  return (
    <div
      className={`atlas-mode-panel ${className}`}
      hidden={!modes.includes(mode)}
    >
      {children}
    </div>
  );
}
export function WorkspaceModeButton({
  mode,
  children,
}: {
  mode: WorkspaceMode;
  children: ReactNode;
}) {
  const workspace = useAtlasWorkspace();
  return (
    <Button
      variant="outline"
      onClick={() => workspace.chooseMode(mode)}
      disabled={workspace.exam && mode !== 'practice'}
    >
      {children}
    </Button>
  );
}
export function WorkspaceFocus() {
  const { focusView, toggleFocus } = useAtlasWorkspace();
  return (
    <Button
      variant="outline"
      className="atlas-focus-view"
      aria-pressed={focusView}
      onClick={toggleFocus}
    >
      {focusView ? <Minimize2 /> : <Maximize2 />}
      {focusView ? 'Show panels' : 'Focus view'}
    </Button>
  );
}
export function StructureDetailsButton() {
  const { showInfo, chooseMode, mode } = useAtlasWorkspace();
  return (
    <Button
      variant="outline"
      className="atlas-structure-details"
      onClick={() => {
        if (mode === 'practice') chooseMode('explore');
        showInfo();
      }}
    >
      Details
    </Button>
  );
}
export function PracticeResultStudyButton({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  const workspace = useAtlasWorkspace();
  return (
    <button
      type="button"
      disabled={workspace.exam}
      onClick={(event) => {
        if (workspace.exam) return;
        // The information sheet is portalled outside .body-app on compact views.
        const root = event.currentTarget.closest('.body-info');
        const origin = event.currentTarget;
        // Restore Explore before applying the result's selection and framing.
        workspace.chooseMode('explore');
        onSelect();
        workspace.showInfo();
        // The result list becomes hidden in Explore. Transfer keyboard focus
        // within this workspace to the newly visible structure heading.
        if (root) requestAnimationFrame(() => {
          const active = root.ownerDocument.activeElement;
          if (!root.isConnected || root.closest('.anatomy-controls-popup')?.hasAttribute('data-closed') ||
              (active !== origin && active !== root.ownerDocument.body)) return;
          const heading = root.querySelector<HTMLElement>('[data-structure-study-heading]');
          if (heading?.isConnected) heading.focus({ preventScroll: true });
        });
      }}
    >
      {children}
    </button>
  );
}
export function PracticeAttention({
  answered,
  exam,
}: {
  answered: boolean;
  exam: boolean;
}) {
  const { showInfo } = useAtlasWorkspace();
  useEffect(() => {
    if (exam && answered) showInfo();
  }, [exam, answered, showInfo]);
  return null;
}
export function CameraViewMenu({
  value,
  region,
  onChange,
  framingAction,
}: {
  value: CameraDirection;
  region: string;
  onChange: (value: CameraDirection) => void;
  framingAction?: { label: string; run: () => void };
}) {
  return (
    <Select<CameraDirection | 'fit-source-frame'>
      value={value}
      onValueChange={(next) => {
        if (next === 'fit-source-frame') {
          framingAction?.run();
          return;
        }
        if (cameraDirections.includes(next as CameraDirection))
          onChange(next as CameraDirection);
      }}
    >
      <SelectTrigger
        aria-label="Camera direction"
        className="atlas-camera-view"
        title={framingAction ? `View direction or ${framingAction.label.toLowerCase()}` : undefined}
      >
        <span>View:</span>
        <SelectValue>{directionLabel(value, region)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {cameraDirections.map((direction) => (
          <SelectItem key={direction} value={direction}>
            {directionLabel(direction, region)}
          </SelectItem>
        ))}
        {framingAction && (
          <SelectItem value="fit-source-frame">{framingAction.label}</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

export function GroupedAnatomyNotes({
  children,
}: {
  children: (tab: ContentTab) => ReactNode;
}) {
  const {noteNavigation, setNoteGroup, setNoteSection, exam} = useAtlasWorkspace();
  if (exam) return null;
  return (
    <Tabs
      value={noteNavigation.group}
      onValueChange={setNoteGroup}
      className="body-content-tabs atlas-grouped-notes"
    >
      <TabsList aria-label="Structure information" variant="line">
        {noteGroups.map((group) => (
          <TabsTrigger key={group.id} value={group.id}>
            {group.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {noteGroups.map((group) => (
        <TabsContent key={group.id} value={group.id}>
          <Tabs
            value={noteNavigation.sections[group.id]}
            onValueChange={value => setNoteSection(group.id, value)}
            className="atlas-note-sections"
          >
            <TabsList aria-label={`${group.title} sections`}>
              {group.sections.map(([id, label]) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {group.sections.map(([id]) => (
              <TabsContent key={id} value={id}>
                {children(id)}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function QuizNotes({ structure }: { structure: BodyStructure }) {
  const { exam } = useAtlasWorkspace();
  if (exam) return null;
  const content = bodyContent(structure, 'quiz');
  return (
    <details className="atlas-quiz-notes">
      <summary>Quiz notes · {structure.name}</summary>
      {content.correctAnswer !== undefined ? (
        <StructureQuickCheck
          key={structure.id}
          question={content.body}
          choices={content.bullets ?? []}
          correctAnswer={content.correctAnswer ?? null}
          explanation={content.explanation}
        />
      ) : (
        <>
          <p>{content.body}</p>
          {content.bullets && (
            <ul>
              {content.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {content.note && <p className="body-content-note">{content.note}</p>}
      {content.citations?.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          Reference {i + 1} ↗
        </a>
      ))}
    </details>
  );
}

export function AtlasSearch({
  catalog,
  localRegionOnly = false,
  region,
  side,
  onSelect,
  onWindow,
  onFocus,
  onDissect,
}: {
  catalog: BodyCatalog;
  localRegionOnly?: boolean;
  region: string;
  side: StudySide;
  onSelect: (id: string) => void;
  onWindow: (id: string, beforeApply?: () => void) => boolean | void;
  onFocus: (id: string, beforeApply?: () => void) => boolean | void;
  onDissect: (
    target: import('@/lib/nested-anatomy').NestedRequest,
    launcher: HTMLButtonElement | null,
  ) => void;
}) {
  const workspace = useAtlasWorkspace(),
    id = useId();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [kind, setKind] = useState<AtlasSearchEntry['kind'] | 'all'>('all'),
    [limit, setLimit] = useState(12);
  const [preview, setPreview] = useState<AtlasSearchEntry | null>(null);
  const [activationIssue, setActivationIssue] = useState<string | null>(null);
  const [relatedLimit, setRelatedLimit] = useState(12);
  const launcher = useRef<HTMLButtonElement | null>(null);
  const transferringFocus = useRef(false);
  const previewOrigin = useRef<HTMLButtonElement | null>(null);
  const previewConfirmation = useRef<HTMLButtonElement | null>(null);
  const dialogRoot = useRef<HTMLDivElement | null>(null);
  const restorePreviewFocus = useRef(false);
  const resultList = useRef<HTMLDivElement | null>(null);
  const relatedList = useRef<HTMLDivElement | null>(null);
  const relatedDetails = useRef<HTMLDetailsElement | null>(null);
  const pendingResultFocus = useRef<{
    key: string; query: string; kind: typeof kind; related: boolean;
  } | null>(null);
  const entries = useMemo(
    () => atlasSearchIndex(catalog, region, side).filter(entry =>
      !localRegionOnly || entry.action.type !== 'link' ||
      entry.action.href === `/regions/${region}` ||
      entry.action.href.startsWith(`/regions/${region}?`)),
    [catalog, region, side, localRegionOnly],
  );
  const matches = useMemo(
    () => filterAtlasSearch(entries, query, kind),
    [entries, query, kind],
  );
  const {primary,related}=groupAtlasSearchResults(matches,query,kind);
  useEffect(() => {
    const pending = pendingResultFocus.current;
    if (!pending) return;
    pendingResultFocus.current = null;
    if (!open || workspace.exam || preview || pending.query !== query || pending.kind !== kind) return;
    // A user who closed the native disclosure keeps its focus; never focus a
    // hidden related result or change the disclosure's open state for them.
    if (pending.related && !relatedDetails.current?.open) return;
    const container = pending.related ? relatedList.current : resultList.current;
    const target = Array.from(container?.querySelectorAll<HTMLElement>('[data-atlas-search-key]') ?? [])
      .find(node => node.dataset.atlasSearchKey === pending.key && node.isConnected);
    const destination = target ?? dialogRoot.current;
    if (destination?.isConnected) destination.focus();
  }, [limit, relatedLimit, open, workspace.exam, preview, query, kind, entries]);
  const revealResults = (isRelated: boolean) => {
    if (!open || workspace.exam || preview) return;
    const firstNew = isRelated ? related[relatedLimit] : primary[limit];
    if (!firstNew) return;
    pendingResultFocus.current = { key: firstNew.key, query, kind, related: isRelated };
    if (isRelated) setRelatedLimit(value => value + 24);
    else setLimit(value => value + 24);
  };
  useEffect(() => {
    if (!open || workspace.exam) {
      restorePreviewFocus.current = false;
      previewOrigin.current = null;
      return;
    }
    if (!preview && !restorePreviewFocus.current) return;
    const intended = preview
      ? previewConfirmation.current
      : previewOrigin.current;
    const target = intended?.isConnected ? intended : dialogRoot.current;
    restorePreviewFocus.current = false;
    if (!preview) previewOrigin.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, [open, preview, workspace.exam]);
  const clearPreview = (restoreFocus = false) => {
    pendingResultFocus.current = null;
    setActivationIssue(null);
    restorePreviewFocus.current = restoreFocus;
    if (!restoreFocus) previewOrigin.current = null;
    setPreview(null);
  };
  const activate = (
    entry: AtlasSearchEntry,
    confirmed = false,
    origin: HTMLButtonElement | null = null,
  ) => {
    if (workspace.exam) return;
    if (
      !entries.some(
        (current) =>
          current.key === entry.key &&
          JSON.stringify(current.action) === JSON.stringify(entry.action),
      )
    ) {
      setActivationIssue('This result is no longer available in the current atlas view. Your view has been kept; search again or choose another result.');
      return;
    }
    if (
      (entry.action.type === 'window' || entry.action.type === 'focus') &&
      !confirmed
    ) {
      pendingResultFocus.current = null;
      previewOrigin.current = origin;
      restorePreviewFocus.current = false;
      setActivationIssue(null);
      setPreview(entry);
      return;
    }
    if (entry.action.type === 'dissect') {
      transferringFocus.current = true;
      onDissect(entry.action.target, launcher.current);
    } else if (entry.action.type === 'select') {
      transferringFocus.current = workspace.focusView ||
        (workspace.panelLayout ?? atlasPanelLayout(window.innerWidth, window.innerHeight)).info;
      if (workspace.mode === 'practice') workspace.chooseMode('explore');
      // Restore the learning view first so it cannot hide the new selection.
      onSelect(entry.action.id);
      workspace.showInfo();
    } else if (
      entry.action.type === 'window' ||
      entry.action.type === 'focus'
    ) {
      transferringFocus.current = false;
      let prepared = false;
      const prepareDissection = () => {
        // The parent validates first, then restores the destination workspace
        // before applying the requested study. Restoring afterwards loses it.
        workspace.chooseMode('dissect');
        prepared = true;
      };
      const opened = entry.action.type === 'window'
        ? onWindow(entry.action.id, prepareDissection)
        : onFocus(entry.action.id, prepareDissection);
      if (opened === false) {
        setActivationIssue('This study could not be opened with the current source data. Your view has been kept. Choose another study or reload the atlas.');
        return;
      }
      if (!prepared) workspace.chooseMode('dissect');
      workspace.setPanelOpen(false, false);
      workspace.setPanelOpen(true, false);
    }
    setOpen(false);
    clearPreview();
  };
  const renderEntry=(entry:AtlasSearchEntry)=>entry.action.type==='link'?(
    <Link prefetch={false} key={entry.key} data-atlas-search-key={entry.key} href={entry.action.href} onClick={()=>setOpen(false)}>
      <strong>{entry.label}</strong><small>{entry.detail}</small>
    </Link>
  ):(
    <button type="button" key={entry.key} data-atlas-search-key={entry.key} onClick={(event)=>activate(entry,false,event?.currentTarget ?? null)}>
      <strong>{entry.label}</strong><small>{entry.detail}</small>
    </button>
  );
  return (
    <Dialog
      open={open && !workspace.exam}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) transferringFocus.current = false;
        clearPreview();
      }}
    >
      <DialogTrigger
        render={
          <Button
            ref={launcher}
            variant="outline"
            className="atlas-search-trigger"
            aria-label="Search atlas"
            disabled={workspace.exam}
          />
        }
      >
        <Search aria-hidden="true" />
        <span>Search<span className="atlas-search-context"> atlas</span></span>
      </DialogTrigger>
      <DialogContent
        ref={dialogRoot}
        className="atlas-search-dialog"
        // A newly opened structure sheet owns focus; confirmed studies leave
        // both panels closed and return focus to Search on every layout.
        finalFocus={() => (transferringFocus.current ? false : launcher.current)}
      >
        <DialogTitle>Search the atlas</DialogTitle>
        <DialogDescription>
          {localRegionOnly
            ? 'Find structures, including brain and eye dissection parts, or study views in this region.'
            : 'Find structures, including brain and eye dissection parts, or study views. Opening another region starts a fresh view; save custom work first.'}
        </DialogDescription>
        <label htmlFor={`${id}-query`}>
          Name, common name, anatomical ID or study view
        </label>
        <input
          id={`${id}-query`}
          type="search"
          value={query}
          maxLength={256}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(12);
            setRelatedLimit(12);
            clearPreview();
          }}
          placeholder="e.g. Achilles, peroneus, CN IV, FMA…"
        />
        <label htmlFor={`${id}-kind`}>Search within</label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as typeof kind);
            setLimit(12);
            setRelatedLimit(12);
            clearPreview();
          }}
        >
          <option value="all">Everything</option>
          <option value="structure">Structures</option>
          {!localRegionOnly && <option value="region">Body regions</option>}
          <option value="view">Study views in this region</option>
        </select>
        <output aria-live="polite">
          {related.length
            ? `${primary.length} direct result${primary.length===1?'':'s'} · ${related.length} related study view${related.length===1?'':'s'}`
            : `${matches.length} results`}
          {primary.length > limit ? ` · showing ${limit}${related.length?' direct results':''}` : ''}
        </output>
        {activationIssue && <p role="alert">{activationIssue}</p>}
        {preview && (
          <section
            className="atlas-search-preview"
            aria-label="Confirm study view"
          >
            <strong>{preview.label}</strong>
            <p>
              This opens a clean study view. Custom removals, system choices,
              cutaway and separation will reset. Saved views are not changed.
            </p>
            <Button ref={previewConfirmation} onClick={() => activate(preview, true)}>
              Open study view
            </Button>
            <Button variant="ghost" onClick={() => clearPreview(true)}>
              Keep current view
            </Button>
          </section>
        )}
        <div ref={resultList} className="atlas-search-results" hidden={!!preview}>
          {primary.slice(0, limit).map(renderEntry)}
          {!matches.length && (
            <p>No matches. Try another name or anatomical ID.</p>
          )}
          {primary.length > limit && (
            <Button variant="outline" onClick={() => revealResults(false)}>
              Show more results
            </Button>
          )}
          {related.length>0&&(
            <details ref={relatedDetails} key={`${query}|${kind}`} className="rounded-lg border px-3" data-search-related>
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
                Study views containing this anatomy ({related.length})
              </summary>
              <p className="mb-3 text-sm">Matches may be background anatomy rather than the study’s focus. Opening a study resets custom dissection; you can review it first.</p>
              <div ref={relatedList} className="atlas-search-results">
                {related.slice(0,relatedLimit).map(renderEntry)}
                {related.length>relatedLimit&&<Button variant="outline" onClick={()=>revealResults(true)}>Show more related study views</Button>}
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
