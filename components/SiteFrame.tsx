"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
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
  const anatomyPanel = pathname === '/atlas/ct' || pathname === '/atlas/mri' || pathname === '/atlas/ultrasound' || pathname === '/atlas/x-ray' || pathname === '/atlas/ct-chest' || pathname === '/atlas/ct-abdomen' || pathname === '/atlas/mr-knee' || pathname === '/atlas/ct-head' || pathname === '/atlas/mri-head' || pathname === '/atlas/3d' || pathname === '/atlas/shoulder-3d' || pathname === '/atlas/female-pelvis-3d' || pathname === '/atlas/lower-limb-3d' || pathname === '/atlas/head-neck-3d' || pathname === '/atlas/thorax-3d' || pathname === '/atlas/abdomen-3d' || pathname === '/atlas/pelvis-3d' || pathname === '/atlas/spine-3d';
  const immersive = isImmersiveRoute(pathname);
  const workspace = !immersive && isWorkspaceRoute(pathname);
  const publicSite = !immersive && !workspace;
  const standardSite = !immersive;

  return (
    <div id="visible-medicine-site-content" className={anatomyPanel ? 'anatomy-site-frame' : immersive ? "immersive-site-frame" : workspace ? "workspace-site-frame" : "public-site-frame"}>
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
