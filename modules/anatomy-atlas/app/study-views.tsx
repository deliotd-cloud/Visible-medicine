'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { BookmarkPlus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  compatibleStudyView,
  decodeStudyBookmarks,
  editStudyBookmarks,
  persistStudyBookmarks,
  MAX_STUDY_VIEWS,
  STUDY_STORAGE_KEY,
  type StudyBookmark,
  type StudyScope,
  type StudyView,
} from '@/lib/study-views';
import './study-views.css';

export function StudyViews({
  scope,
  capture,
  restore,
  disabled = false,
}: {
  scope: StudyScope;
  capture: () => StudyView | null;
  restore: (state: StudyView) => void;
  disabled?: boolean;
}) {
  const [bookmarks, setBookmarks] = useState<StudyBookmark[]>([]);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [open, setOpen] = useState(false),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<StudyBookmark | null>(null);
  const nameId = useId();
  const summary = useRef<HTMLElement | null>(null);
  const saveOpener = useRef<HTMLButtonElement | null>(null);
  const removeOpener = useRef<HTMLButtonElement | null>(null);
  const savePopup = useRef<HTMLDivElement | null>(null);
  const removePopup = useRef<HTMLDivElement | null>(null);
  const returnDialogFocus = (opener: HTMLButtonElement | null, popup: HTMLDivElement | null) => {
    const active = summary.current?.ownerDocument.activeElement;
    // Preserve focus deliberately moved outside this dialog. A removed trigger
    // or the twentieth-save disabled trigger cannot receive keyboard focus.
    if (active && active !== summary.current?.ownerDocument.body &&
      active !== opener && !popup?.contains(active)) return false;
    if (opener?.isConnected && !opener.disabled && opener.getClientRects().length) return opener;
    return summary.current?.isConnected && summary.current.getClientRects().length ? summary.current : false;
  };
  useEffect(() => {
    const refresh = () => {
      try {
        setBookmarks(
          decodeStudyBookmarks(window.localStorage.getItem(STUDY_STORAGE_KEY)),
        );
        setError('');
        setReady(true);
      } catch (e) {
        setReady(false);
        setError(
          e instanceof Error
            ? e.message
            : 'Saved views are unavailable in this browser.',
        );
      }
    };
    const changed = (event: StorageEvent) => {
      if (event.key === STUDY_STORAGE_KEY || event.key === null) refresh();
    };
    refresh();
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  async function change(action: Parameters<typeof editStudyBookmarks>[1]) {
    setBusy(true);
    setError('');
    const update = () => {
      // Persist first: a quota/security failure must not be reported as a successful save.
      const next = persistStudyBookmarks(window.localStorage, action);
      setBookmarks(next);
      setReady(true);
    };
    try {
      if (navigator.locks)
        await navigator.locks.request(STUDY_STORAGE_KEY, update);
      else update();
      setMessage(
        action.type === 'save'
          ? 'Study view saved on this browser.'
          : 'Study view removed from this browser.',
      );
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The change could not be saved. Your existing views are unchanged.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    const state = capture();
    if (!state || !state.camera) {
      setError('Wait for the 3D view to finish preparing, then try again.');
      return;
    }
    if (!compatibleStudyView(state, scope)) {
      setError(
        'This view no longer matches the current anatomy. Please try again.',
      );
      return;
    }
    const bookmark: StudyBookmark = {
      id: crypto.randomUUID(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      state,
    };
    if (await change({ type: 'save', bookmark })) {
      setOpen(false);
      setName('');
    }
  }
  const current = bookmarks.filter(
    (b) => b.state.kind === scope.kind && b.state.region === scope.region,
  );
  const other = bookmarks.filter((b) => !current.includes(b));
  const removeButton = (b: StudyBookmark) => (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={busy || disabled}
      aria-label={`Remove saved view ${b.name}`}
      onClick={(event) => {
        removeOpener.current = event.currentTarget;
        setError('');
        setRemoving(b);
      }}
    >
      <Trash2 />
    </Button>
  );
  return (
    <details className="vm-study-views">
      <summary ref={summary}>
        Saved study views <span>{current.length} in this region</span>
      </summary>
      <div className="vm-study-content">
        <p>
          Save this dissection, cutaway and camera framing. Stored only in this
          browser; not synced to your account. Keep patient details out of view
          names.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={
            !ready || busy || disabled || bookmarks.length >= MAX_STUDY_VIEWS
          }
          onClick={(event) => {
            saveOpener.current = event.currentTarget;
            setError('');
            setOpen(true);
          }}
        >
          <BookmarkPlus />
          Save current view
        </Button>
        <p className="vm-study-meta">
          {bookmarks.length}/{MAX_STUDY_VIEWS} saved across the atlas
          {disabled ? ' · Unavailable during practice or loading' : ''}
        </p>
        {!current.length && <p>No saved views for this region yet.</p>}
        <ul>
          {current.map((b) => {
            const compatible = compatibleStudyView(b.state, scope);
            return (
              <li key={b.id}>
                <div>
                  <strong>{b.name}</strong>
                  <small>
                    {new Date(b.savedAt).toLocaleDateString()} ·{' '}
                    {b.state.plate ? 'Illustration' : '3D'}
                    {b.state.inspection.plane !== 'off'
                      ? ` · ${b.state.inspection.plane} cutaway`
                      : ''}
                  </small>
                  {!compatible && (
                    <small className="vm-study-warning">
                      Anatomy changed. This saved view cannot be restored.
                    </small>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled || busy || !compatible}
                  onClick={() => {
                    restore(b.state);
                    setMessage(`Restored ${b.name}.`);
                  }}
                  aria-label={`Restore saved view ${b.name}`}
                >
                  <RotateCcw />
                  Restore
                </Button>
                {removeButton(b)}
              </li>
            );
          })}
        </ul>
        {other.length > 0 && (
          <details className="vm-study-other">
            <summary>Other regions · {other.length}</summary>
            <ul>
              {other.map((b) => (
                <li key={b.id}>
                  <div>
                    <strong>{b.name}</strong>
                    <Link
                      href={
                        b.state.kind === 'shoulder'
                          ? '/shoulder'
                          : b.state.region === 'whole-body'
                            ? '/'
                            : `/regions/${b.state.region}`
                      }
                    >
                      Open {b.state.region.replaceAll('-', ' ')}
                    </Link>
                  </div>
                  {removeButton(b)}
                </li>
              ))}
            </ul>
          </details>
        )}
        <output aria-live="polite">{message}</output>
        {error && (
          <p role="alert" className="vm-study-warning">
            {error}
          </p>
        )}
      </div>
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="vm-study-dialog" ref={savePopup} finalFocus={() => returnDialogFocus(saveOpener.current, savePopup.current)}>
          <DialogHeader>
            <DialogTitle>Save study view</DialogTitle>
            <DialogDescription>
              Name this view for your own study. This saves display settings
              only, not a scan or clinical review.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label htmlFor={nameId}>View name</label>
            <Input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={64}
              required
              placeholder="e.g. Posterior cuff — deep view"
              disabled={busy}
            />
            {error && (
              <p role="alert" className="vm-study-warning">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || disabled || !name.trim()}>
                {busy ? 'Saving…' : 'Save view'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(v) => !v && !busy && setRemoving(null)}
      >
        <DialogContent className="vm-study-dialog" ref={removePopup} finalFocus={() => returnDialogFocus(removeOpener.current, removePopup.current)}>
          <DialogHeader>
            <DialogTitle>Remove saved view?</DialogTitle>
            <DialogDescription>
              Remove “{removing?.name}” from this browser? This does not change
              the anatomy or clinical review records.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="vm-study-warning">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={busy || disabled}
              onClick={async () => {
                if (
                  removing &&
                  (await change({ type: 'remove', id: removing.id }))
                )
                  setRemoving(null);
              }}
            >
              Remove view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
