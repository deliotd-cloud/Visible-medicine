// Client-side links do not fire beforeunload. Keep one capture listener per
// document so several mounted review forms still ask only once.
type ReviewNavigateEvent = Event & {
  navigationType?: string;
  destination?: {sameDocument?: boolean; url?: string};
};

type ReviewNavigation = {
  addEventListener: (type: 'navigate', listener: EventListener) => void;
  removeEventListener: (type: 'navigate', listener: EventListener) => void;
};

type Registration = {
  protectedCopies: Set<() => boolean>;
  onClick: (event: MouseEvent) => void;
  navigation?: ReviewNavigation;
  onNavigate?: EventListener;
};

const registrations = new WeakMap<Document, Registration>();
const warning = 'This review has unsaved or uncertain work. Leave this page?';

export function isClinicalReviewPageLeavingClick(event: MouseEvent, anchor: HTMLAnchorElement, currentHref: string): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.hasAttribute('download') || (anchor.target && anchor.target.toLowerCase() !== '_self')) return false;
  try {
    const current = new URL(currentHref);
    const destination = new URL(anchor.href, current);
    return destination.origin === current.origin &&
      (destination.pathname !== current.pathname || destination.search !== current.search);
  } catch {
    return false;
  }
}

export function registerClinicalReviewNavigationGuard(document: Document, isProtected: () => boolean): () => void {
  let registration = registrations.get(document);
  if (!registration) {
    const protectedCopies = new Set<() => boolean>();
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      const view = document.defaultView;
      if (!anchor || !view || !isClinicalReviewPageLeavingClick(event, anchor, view.location.href)) return;
      if (![...protectedCopies].some((check) => check())) return;
      if (view.confirm(warning)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };
    registration = {protectedCopies, onClick};
    registrations.set(document, registration);
    document.addEventListener('click', onClick, true);

    // The Navigation API only offers a cancelable subset of same-document
    // traversals. Keep the exact target for cleanup if the view changes.
    const view = document.defaultView;
    const navigation = (view as (Window & {navigation?: Partial<ReviewNavigation>}) | null)?.navigation;
    if (navigation && typeof navigation.addEventListener === 'function' && typeof navigation.removeEventListener === 'function') {
      const onNavigate: EventListener = (event) => {
        const traverse = event as ReviewNavigateEvent;
        if (traverse.navigationType !== 'traverse' || !traverse.cancelable || traverse.defaultPrevented || traverse.destination?.sameDocument !== true) return;
        const currentHref = document.defaultView?.location.href;
        const destinationHref = traverse.destination.url;
        if (!currentHref || !destinationHref) return;
        try {
          const current = new URL(currentHref);
          const destination = new URL(destinationHref);
          if (destination.origin !== current.origin ||
              (destination.pathname === current.pathname && destination.search === current.search)) return;
        } catch {
          return;
        }
        if (![...protectedCopies].some((check) => check())) return;
        if (view?.confirm(warning)) return;
        traverse.preventDefault();
      };
      navigation.addEventListener('navigate', onNavigate);
      registration.navigation = navigation as ReviewNavigation;
      registration.onNavigate = onNavigate;
    }
  }
  registration.protectedCopies.add(isProtected);
  return () => {
    const current = registrations.get(document);
    if (!current) return;
    current.protectedCopies.delete(isProtected);
    if (current.protectedCopies.size) return;
    document.removeEventListener('click', current.onClick, true);
    if (current.navigation && current.onNavigate) current.navigation.removeEventListener('navigate', current.onNavigate);
    registrations.delete(document);
  };
}
