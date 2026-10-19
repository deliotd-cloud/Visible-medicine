const UNSAVED_STUDIO_INPUT = "Unsubmitted Studio changes are not saved on this device. Leave this page and discard them?";

type StudioLinkClick = Pick<MouseEvent, "button" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "defaultPrevented">;
type StudioAnchor = Pick<HTMLAnchorElement, "href" | "target" | "hasAttribute">;

export function isStudioPageLeavingClick(event: StudioLinkClick, anchor: StudioAnchor, currentHref: string): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target.toLowerCase() !== "_self") return false;
  try {
    const destination = new URL(anchor.href, currentHref), current = new URL(currentHref);
    return destination.origin === current.origin && (destination.pathname !== current.pathname || destination.search !== current.search);
  } catch { return false; }
}

type GuardGroup = { guards: Set<() => boolean>; listener: (event: MouseEvent) => void };
const groups = new WeakMap<Document, GuardGroup>();

export function registerStudioNavigationGuard(document: Document, hasUnstoredInput: () => boolean): () => void {
  let group = groups.get(document);
  if (!group) {
    const guards = new Set<() => boolean>();
    const listener = (event: MouseEvent) => {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || !isStudioPageLeavingClick(event, anchor, document.location.href)) return;
      if (![...guards].some((guard) => guard()) || window.confirm(UNSAVED_STUDIO_INPUT)) return;
      event.preventDefault();
    };
    group = {guards, listener};
    groups.set(document, group);
    document.addEventListener("click", listener, true);
  }
  const registered = group;
  registered.guards.add(hasUnstoredInput);
  return () => {
    registered.guards.delete(hasUnstoredInput);
    if (!registered.guards.size) {
      document.removeEventListener("click", registered.listener, true);
      groups.delete(document);
    }
  };
}
