"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLockup } from "./BrandLockup";
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
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/account");
}

function WorkspaceHeader({ pathname }: { pathname: string }) {
  return (
    <header className="app-frame-header platform-header workspace-platform-header">
      <div className="app-frame-identity">
        <Link className="app-frame-brand platform-brand" href="/" aria-label="Visible Medicine public site">
          <BrandLockup priority />
        </Link>
        <span className="workspace-surface-label">Workspace</span>
      </div>
      <nav className="app-frame-nav" aria-label="Choose workspace">
        {workspaceLinks.map(([label, href]) => (
          <Link aria-current={workspaceIsActive(pathname, href) ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="app-frame-actions">
        <Link className="platform-utility-link" href="/trust">Help &amp; trust</Link>
        <Link className="platform-utility-link" href="/account#notifications">Notifications</Link>
        <Link className={`platform-profile-link${pathname.startsWith("/account") ? " active" : ""}`} href="/account">Profile</Link>
        <Link className="workspace-exit-link" href="/">Back to Visible Medicine <span aria-hidden="true">↗</span></Link>
      </div>
      <details className="workspace-mobile-menu">
        <summary><span className="menu-label">Menu</span><span className="close-label">Close</span></summary>
        <nav aria-label="Workspace utilities">
          <Link href="/account">Profile and account <span aria-hidden="true">→</span></Link>
          <Link href="/account#notifications">Notification settings <span aria-hidden="true">→</span></Link>
          <Link href="/trust">Help and trust centre <span aria-hidden="true">→</span></Link>
          <Link href="/">Back to Visible Medicine <span aria-hidden="true">↗</span></Link>
        </nav>
      </details>
    </header>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveRoute(pathname);
  const workspace = !immersive && isWorkspaceRoute(pathname);
  const publicSite = !immersive && !workspace;

  return (
    <div id="visible-medicine-site-content" className={immersive ? "immersive-site-frame" : workspace ? "workspace-site-frame" : "public-site-frame"}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {publicSite && <><SiteHeader /><div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting, patient care or clinical decision-making.</p><a href="/intended-use">Read intended use →</a></div></>}
      {workspace && <WorkspaceHeader pathname={pathname} />}
      {workspace && pathname.startsWith("/workspace") && <nav className="institution-app-nav" aria-label="Institution workspace navigation">{institutionLinks.map(([label, href]) => { const active = href === "/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link aria-current={active ? "page" : undefined} href={href} key={href}>{label}</Link>; })}</nav>}
      <div id="main-content" tabIndex={-1}>{children}</div>
      {publicSite && <SiteFooter />}
    </div>
  );
}
