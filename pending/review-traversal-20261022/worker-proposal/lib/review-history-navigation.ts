/** Protect only cancelable in-document history traversals that leave a review URL.
 * Full document exits remain the worksheet's beforeunload responsibility. */
type ReviewNavigateEvent = Event & {
  navigationType?: string;
  destination?: { sameDocument?: boolean; url?: string };
};

type ReviewNavigation = {
  addEventListener: (type: 'navigate', listener: EventListener) => void;
  removeEventListener: (type: 'navigate', listener: EventListener) => void;
};

export function registerReviewHistoryNavigation(
  view: Window,
  isDirty: () => boolean,
  onBlocked: () => void,
): () => void {
  const navigation = (view as Window & { navigation?: Partial<ReviewNavigation> }).navigation;
  if (!navigation || typeof navigation.addEventListener !== 'function' ||
      typeof navigation.removeEventListener !== 'function') return () => {};

  let active = true;
  const onNavigate: EventListener = (event) => {
    const traversal = event as ReviewNavigateEvent;
    if (!active || !isDirty() || traversal.navigationType !== 'traverse' ||
        traversal.destination?.sameDocument !== true || !traversal.cancelable ||
        traversal.defaultPrevented || !traversal.destination.url) return;

    try {
      const current = new URL(view.location.href);
      const destination = new URL(traversal.destination.url);
      if (destination.origin !== current.origin ||
          (destination.pathname === current.pathname && destination.search === current.search)) return;
    } catch {
      return;
    }

    traversal.preventDefault();
    if (traversal.defaultPrevented) onBlocked();
  };
  navigation.addEventListener('navigate', onNavigate);
  return () => {
    active = false;
    navigation.removeEventListener?.('navigate', onNavigate);
  };
}
