import React, {useSyncExternalStore} from 'react';

const listeners = new Set();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => window.location.pathname + window.location.search + window.location.hash;
function notify() { for (const listener of listeners) listener(); }
window.addEventListener('popstate', notify);

export function navigate(href) {
  const next = new URL(href, window.location.href);
  if (next.origin !== window.location.origin) throw new Error('Fixture navigation must remain local');
  window.history.pushState({...window.history.state}, '', next.pathname + next.search + next.hash);
  notify();
}
export function usePathname() { useSyncExternalStore(subscribe, snapshot, snapshot); return window.location.pathname; }
export function useSearchParams() { useSyncExternalStore(subscribe, snapshot, snapshot); return new URLSearchParams(window.location.search); }
export function useRouter() { return {push: navigate, refresh: () => window.dispatchEvent(new Event('qa-router-refresh'))}; }
export default function Link({href, children, onClick, ...props}) {
  return React.createElement('a', {...props, href, onClick(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(href);
  }}, children);
}
