const PREFIX = "[VM local atlas diagnostic]";
const OBSERVE_ERROR = /^(?:Uncaught TypeError: )?Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'\.$/;
const SCRIPT_PATH = /\.(?:m?js|jsx|tsx?)(?:$|\/)/i;
const PRIVATE_PATH = /\/(?:api|auth|cases?|patients?|studies|workbooks?)(?:[\/._-]|$)/i;

export function isLocalAtlasUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:"
      && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      && (url.pathname === "/atlas" || url.pathname.startsWith("/atlas/"));
  } catch { return false; }
}

export function isPublicAtlasFrame(src: string | null, hostUrl: string): boolean {
  if (!src || !isLocalAtlasUrl(hostUrl)) return false;
  try {
    const frame = new URL(src, hostUrl);
    return frame.origin === new URL(hostUrl).origin
      && frame.pathname.startsWith("/atlas-runtime/");
  } catch { return false; }
}

export function isFrameLoadTarget(value: unknown): value is HTMLIFrameElement {
  return typeof value === "object" && value !== null
    && (value as { tagName?: unknown }).tagName === "IFRAME"
    && typeof (value as { getAttribute?: unknown }).getAttribute === "function"
    && "contentWindow" in value;
}

export function isObservedTypeError(error: unknown, message: unknown): boolean {
  return typeof error === "object" && error !== null
    && (error as { name?: unknown }).name === "TypeError"
    && typeof message === "string" && OBSERVE_ERROR.test(message);
}

// Only script paths are useful for attributing this error. Never print URL
// parameters, fragments, frame contents, or the full Error object.
export function sanitizeScriptUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); } catch { return null; }
    if (!["http:", "https:"].includes(url.protocol)
      || !SCRIPT_PATH.test(pathname) || PRIVATE_PATH.test(pathname)) return null;
    return `${url.origin}${url.pathname}`;
  } catch { return null; }
}

export function sanitizeObserverStack(value: unknown): string {
  if (typeof value !== "string") return "";
  const lines: string[] = [];
  for (const line of value.split(/\r?\n/).slice(0, 40)) {
    const match = line.match(/https?:\/\/[^\s)]+/);
    if (!match) continue;
    const raw = match[0].split(/[?#]/, 1)[0].replace(/:\d+(?::\d+)?$/, "");
    const script = sanitizeScriptUrl(raw);
    if (!script) continue;
    const position = match[0].match(/:(\d+)(?::(\d+))?$/);
    lines.push(`at ${script}${position ? `:${position[1]}${position[2] ? `:${position[2]}` : ""}` : ""}`);
    if (lines.length === 8) break;
  }
  return lines.join("\n").slice(0, 3072);
}

export function installLocalAtlasDiagnostics(host: Window, enabled: boolean): () => void {
  if (!enabled || !isLocalAtlasUrl(host.location.href)) return () => undefined;

  const attached = new Map<HTMLIFrameElement, Window>();
  const seen = new Set<string>();
  const diagnosticsConsole = (host as Window & Pick<typeof globalThis, "console">).console;
  const onError = (event: Event) => {
    const item = event as ErrorEvent;
    if (!isLocalAtlasUrl(host.location.href) || !isObservedTypeError(item.error, item.message)) return;
    const source = sanitizeScriptUrl(item.filename) ?? "unknown script";
    const stack = sanitizeObserverStack((item.error as Error).stack);
    const key = `${source}\n${stack}`;
    if (seen.has(key)) return;
    seen.add(key);
    diagnosticsConsole.warn(`${PREFIX} ${source}${stack ? `\n${stack}` : ""}`);
  };

  const detach = (frameWindow: Window) => {
    try { frameWindow.removeEventListener("error", onError); }
    catch { /* A previously eligible frame may have navigated across origins. */ }
  };

  const register = (frame: HTMLIFrameElement) => {
    const prior = attached.get(frame);
    if (prior) { detach(prior); attached.delete(frame); }
    if (!isPublicAtlasFrame(frame.getAttribute("src"), host.location.href)) return;
    try {
      const current = frame.contentWindow;
      if (!current || current.location.origin !== host.location.origin
        || !current.location.pathname.startsWith("/atlas-runtime/")) return;
      current.addEventListener("error", onError);
      attached.set(frame, current);
    } catch { /* A cross-origin or inaccessible frame is never inspected. */ }
  };
  const onLoad = (event: Event) => {
    for (const [frame, frameWindow] of attached) {
      if (!frame.isConnected) { detach(frameWindow); attached.delete(frame); }
    }
    if (isFrameLoadTarget(event.target)) register(event.target);
  };

  host.addEventListener("error", onError);
  host.document.addEventListener("load", onLoad, true);
  host.document.querySelectorAll<HTMLIFrameElement>("iframe[src]").forEach(register);
  return () => {
    host.removeEventListener("error", onError);
    host.document.removeEventListener("load", onLoad, true);
    for (const frame of attached.values()) detach(frame);
    attached.clear();
    seen.clear();
  };
}
