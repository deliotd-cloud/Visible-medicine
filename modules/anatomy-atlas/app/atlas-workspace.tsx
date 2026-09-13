'use client';
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
import type { StudySide } from '@/lib/study-links';
import type { ContentTab } from './anatomy-data';
import { atlasPanelLayout } from '@/lib/atlas-panel-layout';
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
};
const WorkspaceContext = createContext(emptyWorkspace);
export const useAtlasWorkspace = () => useContext(WorkspaceContext);
export function AtlasWorkspace({
  children,
  exam,
  className = '',
  presentation = 'standalone',
}: {
  children: ReactNode;
  exam: boolean;
  className?: string;
  presentation?: 'standalone' | 'panel';
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
  const setPanelOpen = useCallback((info: boolean, open: boolean) => {
    setPanels((current) =>
      open
        ? { tools: !info, info }
        : { ...current, [info ? 'info' : 'tools']: false },
    );
  }, []);
  const mode = exam ? 'practice' : chosen;
  const chooseMode = useCallback(
    (next: WorkspaceMode) => {
      if (exam && next !== 'practice') return;
      setChosen(next);
      if (next === 'dissect') setPanelOpen(false, true);
      if (next === 'practice') setPanelOpen(true, true);
    },
    [exam, setPanelOpen],
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
      }}
    >
      <Root
        ref={boundary}
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
      onClick={() => {
        if (mode === 'practice') chooseMode('explore');
        showInfo();
      }}
    >
      Details
    </Button>
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

export const noteGroups: Array<{
  id: string;
  title: string;
  sections: Array<[ContentTab, string]>;
}> = [
  {
    id: 'anatomy',
    title: 'Anatomy',
    sections: [
      ['anatomy', 'Overview'],
      ['function', 'Function'],
    ],
  },
  {
    id: 'clinical',
    title: 'Clinical',
    sections: [
      ['clinical', 'Clinical notes'],
      ['pathology', 'Pathology'],
    ],
  },
  {
    id: 'imaging',
    title: 'Imaging',
    sections: [
      ['ct', 'CT'],
      ['mri', 'MRI'],
      ['xray', 'X-ray'],
      ['ultrasound', 'Ultrasound'],
    ],
  },
];
export function GroupedAnatomyNotes({
  children,
}: {
  children: (tab: ContentTab) => ReactNode;
}) {
  return (
    <Tabs
      defaultValue="anatomy"
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
            defaultValue={group.sections[0][0]}
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
  const content = bodyContent(structure, 'quiz');
  return (
    <details className="atlas-quiz-notes">
      <summary>Quiz notes · {structure.name}</summary>
      <p>{content.body}</p>
      {content.bullets && (
        <ul>
          {content.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
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
  region,
  side,
  onSelect,
  onWindow,
  onFocus,
  onDissect,
}: {
  catalog: BodyCatalog;
  region: string;
  side: StudySide;
  onSelect: (id: string) => void;
  onWindow: (id: string) => void;
  onFocus: (id: string) => void;
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
  const launcher = useRef<HTMLButtonElement | null>(null);
  const transferringFocus = useRef(false);
  const entries = useMemo(
    () => atlasSearchIndex(catalog, region, side),
    [catalog, region, side],
  );
  const matches = useMemo(
    () => filterAtlasSearch(entries, query, kind),
    [entries, query, kind],
  );
  const activate = (entry: AtlasSearchEntry, confirmed = false) => {
    if (workspace.exam) return;
    if (
      !entries.some(
        (current) =>
          current.key === entry.key &&
          JSON.stringify(current.action) === JSON.stringify(entry.action),
      )
    )
      return;
    if (
      (entry.action.type === 'window' || entry.action.type === 'focus') &&
      !confirmed
    ) {
      setPreview(entry);
      return;
    }
    if (entry.action.type === 'dissect') {
      transferringFocus.current = true;
      if (workspace.mode === 'practice') workspace.chooseMode('explore');
      onDissect(entry.action.target, launcher.current);
    } else if (entry.action.type === 'select') {
      transferringFocus.current = workspace.focusView ||
        (workspace.panelLayout ?? atlasPanelLayout(window.innerWidth, window.innerHeight)).info;
      onSelect(entry.action.id);
      if (workspace.mode === 'practice') workspace.chooseMode('explore');
      workspace.showInfo();
    } else if (
      entry.action.type === 'window' ||
      entry.action.type === 'focus'
    ) {
      transferringFocus.current = workspace.focusView ||
        (workspace.panelLayout ?? atlasPanelLayout(window.innerWidth, window.innerHeight)).tools;
      workspace.chooseMode('dissect');
      if (entry.action.type === 'window') onWindow(entry.action.id);
      else onFocus(entry.action.id);
    }
    setOpen(false);
    setPreview(null);
  };
  return (
    <Dialog
      open={open && !workspace.exam}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) transferringFocus.current = false;
        setPreview(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            ref={launcher}
            variant="outline"
            className="atlas-search-trigger"
            disabled={workspace.exam}
          />
        }
      >
        <Search /> Search atlas
      </DialogTrigger>
      <DialogContent
        className="atlas-search-dialog"
        // A newly opened sheet owns focus; returning to Search would steal it.
        // Inline desktop panels and ordinary dismissal still return to Search.
        finalFocus={() => (transferringFocus.current ? false : launcher.current)}
      >
        <DialogTitle>Search the atlas</DialogTitle>
        <DialogDescription>
          Find structures, including brain and eye dissection parts, or study
          views. Opening another region starts a fresh view; save custom work
          first.
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
            setPreview(null);
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
            setPreview(null);
          }}
        >
          <option value="all">Everything</option>
          <option value="structure">Structures</option>
          <option value="region">Body regions</option>
          <option value="view">Study views in this region</option>
        </select>
        <output aria-live="polite">
          {matches.length} results
          {matches.length > limit ? ` · showing ${limit}` : ''}
        </output>
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
            <Button onClick={() => activate(preview, true)}>
              Open study view
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Keep current view
            </Button>
          </section>
        )}
        <div className="atlas-search-results" hidden={!!preview}>
          {matches.slice(0, limit).map((entry) =>
            entry.action.type === 'link' ? (
              <Link
                prefetch={false}
                key={entry.key}
                href={entry.action.href}
                onClick={() => setOpen(false)}
              >
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </Link>
            ) : (
              <button
                type="button"
                key={entry.key}
                onClick={() => activate(entry)}
              >
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </button>
            ),
          )}
          {!matches.length && (
            <p>No matches. Try another name or anatomical ID.</p>
          )}
          {matches.length > limit && (
            <Button variant="outline" onClick={() => setLimit((n) => n + 24)}>
              Show more results
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
