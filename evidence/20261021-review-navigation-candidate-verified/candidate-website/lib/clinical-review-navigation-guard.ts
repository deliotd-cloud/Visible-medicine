// Client-side links do not fire beforeunload. Keep one capture listener per
// document so several mounted review forms still ask only once.
type Registration = {
  protectedCopies: Set<() => boolean>;
  onClick: (event: MouseEvent) => void;
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
  }
  registration.protectedCopies.add(isProtected);
  return () => {
    const current = registrations.get(document);
    if (!current) return;
    current.protectedCopies.delete(isProtected);
    if (current.protectedCopies.size) return;
    document.removeEventListener('click', current.onClick, true);
    registrations.delete(document);
  };
}
