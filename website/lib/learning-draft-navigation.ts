import { isStudioPageLeavingClick } from "./studio-navigation-guard.ts";

const UNSAVED_LEARNING_INPUT = "Your My Learning draft has unsaved changes. Leave this page and discard them?";

// Optional platform surface: the project's DOM types predate NavigateEvent.
// Never polyfill it by changing the router or writing sentinel history entries.
type DraftHistoryEvent = Event & {
  navigationType?: string;
  destination?: {url: string; sameDocument: boolean};
  signal?: {aborted: boolean};
  downloadRequest?: string | null;
  formData?: unknown;
};

type DraftGuardOptions = {
  warning?: string;
  unloadReturnValue?: string;
  onHistoryRejected?: () => void;
};

/** Protects mounted drafts during links/unload and cancellable native SPA traversal. */
export function registerLearningDraftGuard(window: Window, hasUnsavedInput: () => boolean, options?: DraftGuardOptions): (() => void) & {refresh: () => void} {
  const document = window.document;
  const native = (window as Window & {navigation?: EventTarget}).navigation;
  const navigation = typeof native?.addEventListener === "function" && typeof native.removeEventListener === "function" ? native : null;
  let allowConfirmedLinkUnload = false;
  let resetTimer: number | undefined;
  let listeningForUnload = false;
  let disposed = false;

  const clearLinkPermission = () => {
    if (resetTimer !== undefined) {
      window.clearTimeout(resetTimer);
      resetTimer = undefined;
    }
    allowConfirmedLinkUnload = false;
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const element = typeof target?.closest === "function" ? target : target?.parentElement;
    const anchor = element?.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || !isStudioPageLeavingClick(event, anchor, document.location.href)) return;
    refresh();
    if (!hasUnsavedInput()) return;

    if (!window.confirm(options?.warning ?? UNSAVED_LEARNING_INPUT)) {
      clearLinkPermission();
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    // A normal hard link may fire beforeunload after this click. Its prior
    // confirmation covers only the current event-loop turn.
    clearLinkPermission();
    allowConfirmedLinkUnload = true;
    resetTimer = window.setTimeout(clearLinkPermission, 0);
  };

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedInput()) { refresh(); return; }
    if (allowConfirmedLinkUnload) {
      clearLinkPermission();
      return;
    }
    event.preventDefault();
    event.returnValue = options?.unloadReturnValue ?? "Unsaved learning edits";
  };

  const onHistoryNavigate = (raw: Event) => {
    const event = raw as DraftHistoryEvent;
    // Browser history traversal can be non-cancellable (including repeated
    // Back after refusal). Respect that escape hatch; never bounce history.
    if (disposed || !event.isTrusted || !event.cancelable || event.defaultPrevented || event.signal?.aborted ||
        event.navigationType !== "traverse" || event.destination?.sameDocument !== true ||
        event.downloadRequest != null || event.formData != null) return;
    try {
      // The native destination is absolute. Relative/malformed synthetic URLs
      // are not a reason to stop navigation or reveal draft state.
      const destination = new URL(event.destination.url), current = new URL(document.location.href);
      if (!["http:", "https:"].includes(destination.protocol) || destination.username || destination.password ||
          destination.origin !== current.origin ||
          (destination.pathname === current.pathname && destination.search === current.search)) return;
    } catch { return; }
    refresh();
    if (!hasUnsavedInput()) return;
    clearLinkPermission();
    const leave = window.confirm(options?.warning ?? UNSAVED_LEARNING_INPUT);
    if (disposed || event.signal?.aborted || event.defaultPrevented || leave) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // Navigation is already cancelled. Focus recovery is best effort and must
    // not turn a missing DOM target into an uncaught event-handler failure.
    try { options?.onHistoryRejected?.(); } catch { /* Keep the draft and current entry. */ }
  };

  // A clean page should remain eligible for browser back/forward caching.
  const refresh = () => {
    if (disposed) return;
    const needed = hasUnsavedInput();
    if (needed && !listeningForUnload) window.addEventListener("beforeunload", onBeforeUnload);
    if (!needed && listeningForUnload) window.removeEventListener("beforeunload", onBeforeUnload);
    listeningForUnload = needed;
    if (!needed) clearLinkPermission();
  };

  document.addEventListener("click", onClick, true);
  document.addEventListener("input", refresh, true);
  document.addEventListener("change", refresh, true);
  navigation?.addEventListener("navigate", onHistoryNavigate, true);
  refresh();

  const cleanup = () => {
    disposed = true;
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("input", refresh, true);
    document.removeEventListener("change", refresh, true);
    window.removeEventListener("beforeunload", onBeforeUnload);
    navigation?.removeEventListener("navigate", onHistoryNavigate, true);
    clearLinkPermission();
  };
  return Object.assign(cleanup, {refresh});
}
