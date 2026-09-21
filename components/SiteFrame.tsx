"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const workspaceLinks = [
  ["Learn", "/my-learning"],
  ["Studio", "/studio/workspace"],
  ["Institution", "/workspace"],
] as const;

const institutionLinks = [
  ["Overview", "/workspace"],
  ["People", "/workspace/people"],
  ["Readiness", "/workspace/readiness"],
  ["Controls", "/workspace/control"],
] as const;

function isStudioRoute(pathname: string) {
  return pathname.startsWith("/studio/");
}

function isImmersiveRoute(pathname: string) {
  return pathname === "/learn" ||
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
  if (href === "/workspace") return pathname.startsWith("/workspace");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceContextBar({ pathname, signedIn }: { pathname: string; signedIn: boolean }) {
  const current = workspaceLinks.find(([, href]) => workspaceIsActive(pathname, href))?.[0] ?? "Account";
  const accountHref = signedIn ? "/account" : "/account-entry";
  return (
    <header className="workspace-context-header">
      <Link className="workspace-wordmark" href="/" aria-label="Visible Medicine home">Visible Medicine</Link>
      <details className="workspace-switch" key={pathname}>
      <summary>{current} <span aria-hidden="true">⌄</span></summary>
      <nav aria-label="Choose workspace">
        {workspaceLinks.map(([label, href]) => (
          <Link aria-current={workspaceIsActive(pathname, href) ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      </details>
      <div className="app-frame-actions">
        <Link className="platform-utility-link" href="/">Back to website</Link>
        <Link className="account-entry-link" aria-current={(signedIn ? pathname.startsWith("/account") && pathname !== "/account-entry" : pathname === "/account-entry") ? "page" : undefined} href={accountHref}>{signedIn ? "Profile" : "Sign in"}</Link>
      </div>
      <details className="workspace-mobile-menu">
        <summary><span className="menu-label">Help &amp; more</span><span className="close-label">Close</span></summary>
        <nav aria-label="Workspace utilities">
          <Link href="/">Back to website <span aria-hidden="true">→</span></Link>
          <Link href="/account#notifications">Notification settings <span aria-hidden="true">→</span></Link>
          <Link href="/trust">Help and trust centre <span aria-hidden="true">→</span></Link>
        </nav>
      </details>
    </header>
  );
}

export function SiteFrame({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const anatomyPanel = pathname === '/atlas/3d' || pathname === '/atlas/shoulder-3d' || pathname === '/atlas/female-pelvis-3d' || pathname === '/atlas/lower-limb-3d' || pathname === '/atlas/head-neck-3d' || pathname === '/atlas/thorax-3d' || pathname === '/atlas/abdomen-3d' || pathname === '/atlas/pelvis-3d' || pathname === '/atlas/spine-3d';
  const immersive = isImmersiveRoute(pathname);
  const workspace = !immersive && isWorkspaceRoute(pathname);
  const publicSite = !immersive && !workspace;
  const standardSite = !immersive;

  return (
    <div id="visible-medicine-site-content" className={anatomyPanel ? 'anatomy-site-frame' : immersive ? "immersive-site-frame" : workspace ? "workspace-site-frame" : "public-site-frame"}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {publicSite && <SiteHeader signedIn={signedIn} />}
      {workspace && <WorkspaceContextBar pathname={pathname} signedIn={signedIn} />}
      {standardSite && <div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting, patient care or clinical decision-making.</p><a href="/intended-use">Read intended use →</a></div>}
      {workspace && pathname.startsWith("/workspace") && <nav className="institution-app-nav" aria-label="Institution workspace navigation">{institutionLinks.map(([label, href]) => { const active = href === "/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link aria-current={active ? "page" : undefined} href={href} key={href}>{label}</Link>; })}</nav>}
      <div id="main-content" tabIndex={-1}>{children}</div>
      {publicSite && !anatomyPanel && <SiteFooter />}
    </div>
  );
}
