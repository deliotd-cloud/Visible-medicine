"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { isPublicFocusPath, shouldFocusPublicRoute } from "../lib/public-route-focus";
import "./workspace-navigation.css";

const workspaceLinks = [
  ["My Learning", "/my-learning"],
  ["Studio", "/studio/workspace"],
] as const;

const institutionLinks = [
  ["People", "/workspace/people"],
  ["Readiness", "/workspace/readiness"],
  ["Controls", "/workspace/control"],
] as const;

const reviewLinks = [
  ["Review inbox", "/workspace/clinical-review-inbox"],
  ["All review selections", "/workspace/atlas-review"],
  ["Source comparisons", "/workspace/atlas-review/source-comparisons"],
] as const;

function isReviewRoute(pathname: string) {
  return pathname === "/workspace/clinical-review-inbox" || pathname.startsWith("/workspace/clinical-review-inbox/") ||
    pathname === "/workspace/atlas-review" || pathname.startsWith("/workspace/atlas-review/");
}

function isStudioRoute(pathname: string) {
  return pathname.startsWith("/studio/");
}

function isImmersiveRoute(pathname: string) {
  return pathname === "/workspace/atlas-review/model/embedded" || pathname === "/learn" ||
    pathname.startsWith("/learn/") ||
    pathname.endsWith("/builder") ||
    pathname.startsWith("/embed/launch");
}

function isWorkspaceRoute(pathname: string) {
  return pathname === "/my-learning" ||
    pathname.startsWith("/workspace") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    isStudioRoute(pathname);
}

function workspaceIsActive(pathname: string, href: string) {
  if (href === "/studio/workspace") return isStudioRoute(pathname);
  if (href === "/workspace/clinical-review-inbox") return isReviewRoute(pathname);
  if (href === "/workspace") return (pathname === href || pathname.startsWith(`${href}/`)) && !isReviewRoute(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceContextBar({ pathname, signedIn }: { pathname: string; signedIn: boolean }) {
  const accountHref = signedIn ? "/account" : "/account-entry";
  const review = isReviewRoute(pathname);
  const closeUtilities = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };
  return (
    <header className="workspace-context-header">
      <Link className="workspace-wordmark" href="/" aria-label="Visible Medicine home">Visible Medicine</Link>
      <nav className="workspace-primary-nav" aria-label="Choose workspace">
        {workspaceLinks.map(([label, href]) => (
          <Link aria-current={workspaceIsActive(pathname, href) ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        ))}
        <Link aria-current={workspaceIsActive(pathname, review ? "/workspace/clinical-review-inbox" : "/workspace") ? "page" : undefined} href={review ? "/workspace/clinical-review-inbox" : "/workspace"}>{review ? "Clinical Review" : "Workspace"}</Link>
      </nav>
      <div className="app-frame-actions">
        {review && <Link className="workspace-admin-link" href="/workspace">Administration</Link>}
        <Link className="platform-utility-link" href="/">Back to website</Link>
        <Link className="account-entry-link" aria-current={(signedIn ? pathname.startsWith("/account") && pathname !== "/account-entry" : pathname === "/account-entry") ? "page" : undefined} href={accountHref}>{signedIn ? "Profile" : "Sign in"}</Link>
      </div>
      <details className="workspace-mobile-menu" onKeyDown={event => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}>
        <summary><span className="menu-label">Help &amp; more</span><span className="close-label">Close</span></summary>
        <nav aria-label="Workspace utilities">
          <Link href="/" onClick={closeUtilities}>Back to website <span aria-hidden="true">→</span></Link>
          <Link href="/account#notifications" onClick={closeUtilities}>Notification settings <span aria-hidden="true">→</span></Link>
          <Link href="/trust" onClick={closeUtilities}>Help and trust centre <span aria-hidden="true">→</span></Link>
        </nav>
      </details>
    </header>
  );
}

export function SiteFrame({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(pathname);
  const pendingLinkRef = useRef<{ from: string; linkPath: string; origin: HTMLAnchorElement; at: number } | null>(null);
  const capturePublicLink = (event: MouseEvent<HTMLDivElement>) => {
    pendingLinkRef.current = null;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === pathname ||
      !isPublicFocusPath(pathname) || !isPublicFocusPath(url.pathname)) return;
    pendingLinkRef.current = { from: pathname, linkPath: url.pathname, origin: anchor, at: performance.now() };
  };

  useEffect(() => {
    const from = previousPathRef.current;
    previousPathRef.current = pathname;
    const pending = pendingLinkRef.current;
    pendingLinkRef.current = null;
    if (!pending || pending.from !== from) return;
    let removeTemporaryTabIndex: (() => void) | undefined;
    let frame: number | undefined;
    let observer: MutationObserver | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    let managedTarget: HTMLElement | undefined;
    const stopObserving = () => {
      observer?.disconnect();
      observer = undefined;
      if (expiry !== undefined) clearTimeout(expiry);
      expiry = undefined;
    };
    const focusDestination = () => {
      frame = undefined;
      const active = document.activeElement;
      if (!shouldFocusPublicRoute({ from, to: pathname, linkPath: pending.linkPath,
        ageMs: performance.now() - pending.at,
        active: active === document.body ? "body" : active === pending.origin || active === managedTarget ? "origin" : "elsewhere" })) {
        stopObserving(); return;
      }
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) { stopObserving(); return; }
      const main = frameRef.current?.querySelector<HTMLElement>("#main-content");
      if (!main) { stopObserving(); return; }
      const heading = main.querySelector<HTMLElement>("h1");
      const target = heading ?? main;
      if (target !== managedTarget) {
        removeTemporaryTabIndex?.();
        removeTemporaryTabIndex = undefined;
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
          const clean = () => {
            target.removeEventListener("blur", clean);
            if (target.getAttribute("tabindex") === "-1") target.removeAttribute("tabindex");
          };
          removeTemporaryTabIndex = clean;
          target.addEventListener("blur", clean, { once: true });
        }
        target.focus({ preventScroll: true });
        if (document.activeElement !== target) { removeTemporaryTabIndex?.(); stopObserving(); return; }
        managedTarget = target;
      }
      if (heading) { stopObserving(); return; }
      // A streamed route may commit its loading fallback before its h1. Upgrade
      // our own skip-target focus once content arrives, never a user's control.
      if (!observer && typeof MutationObserver === "function") {
        observer = new MutationObserver(() => {
          if (frame === undefined) frame = requestAnimationFrame(focusDestination);
        });
        observer.observe(main, { childList: true, subtree: true });
        expiry = setTimeout(() => {
          stopObserving();
          if (frame !== undefined) cancelAnimationFrame(frame);
          frame = undefined;
        }, Math.max(0, 10_000 - (performance.now() - pending.at)));
      }
    };
    frame = requestAnimationFrame(focusDestination);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      stopObserving();
      removeTemporaryTabIndex?.();
    };
  }, [pathname]);
  const anatomyPanel = pathname === '/atlas/ct' || pathname === '/atlas/mri' || pathname === '/atlas/ultrasound' || pathname === '/atlas/x-ray' || pathname === '/atlas/ct-chest' || pathname === '/atlas/ct-abdomen' || pathname === '/atlas/mr-knee' || pathname === '/atlas/ct-head' || pathname === '/atlas/mri-head' || pathname === '/atlas/3d' || pathname === '/atlas/shoulder-3d' || pathname === '/atlas/female-pelvis-3d' || pathname === '/atlas/lower-limb-3d' || pathname === '/atlas/head-neck-3d' || pathname === '/atlas/thorax-3d' || pathname === '/atlas/abdomen-3d' || pathname === '/atlas/pelvis-3d' || pathname === '/atlas/spine-3d';
  const immersive = isImmersiveRoute(pathname);
  const workspace = !immersive && isWorkspaceRoute(pathname);
  const publicSite = !immersive && !workspace;
  const standardSite = !immersive;

  return (
    <div id="visible-medicine-site-content" ref={frameRef} onClickCapture={capturePublicLink} className={anatomyPanel ? 'anatomy-site-frame' : immersive ? "immersive-site-frame" : workspace ? "workspace-site-frame" : "public-site-frame"}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {publicSite && <SiteHeader signedIn={signedIn} />}
      {workspace && <WorkspaceContextBar pathname={pathname} signedIn={signedIn} />}
      {standardSite && !anatomyPanel && <div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting, patient care or clinical decision-making.</p><a href="/intended-use">Read intended use →</a></div>}
      {workspace && pathname.startsWith("/workspace/") && <nav className="institution-app-nav" aria-label={isReviewRoute(pathname) ? "Clinical Review navigation" : "Administration navigation"}>
        {(isReviewRoute(pathname) ? reviewLinks : institutionLinks).map(([label, href]) => {
          const active = href === "/workspace/atlas-review"
            ? pathname === href || pathname.startsWith(`${href}/`) && !pathname.startsWith("/workspace/atlas-review/source-comparisons")
            : pathname === href || pathname.startsWith(`${href}/`);
          return <Link aria-current={active ? "page" : undefined} href={href} key={href}>{label}</Link>;
        })}
      </nav>}
      <div id="main-content" tabIndex={-1}>{children}</div>
      {publicSite && !anatomyPanel && <SiteFooter />}
    </div>
  );
}
