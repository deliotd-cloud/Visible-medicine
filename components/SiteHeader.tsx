"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import { BrandLockup } from "./BrandLockup";
import { atlasModalities } from '../lib/atlas-navigation';

type NavigationLink = {
  label: string;
  href: string;
  description: string;
};

type NavigationSection = {
  id: string;
  label: string;
  href: string;
  description: string;
  groups: Array<{
    label: string;
    workspace?: boolean;
    links: NavigationLink[];
  }>;
};

const navigationSections: NavigationSection[] = [
  {
    id: "atlas",
    label: "Atlas",
    href: "/atlas",
    description: "Choose a modality, then a body region.",
    groups: [
      {
        label: "Atlas by modality",
        links: atlasModalities.map(modality => ({label:modality.label,href:modality.href,description:modality.status})),
      },
    ],
  },
  {
    id: "courses",
    label: "Courses",
    href: "/courses",
    description: "Find courses, join teaching and continue your learning.",
    groups: [
      {
        label: "Explore courses",
        links: [
          { label: "Browse courses", href: "/courses", description: "Explore available self-paced and taught courses." },
          { label: "Join a course", href: "/join", description: "Use an invitation or institution access code." },
        ],
      },
      {
        label: "Your workspace",
        workspace: true,
        links: [
          { label: "Open My Learning", href: "/my-learning", description: "Sign in to continue courses, revision and saved atlas work." },
        ],
      },
    ],
  },
  {
    id: "educators",
    label: "For educators",
    href: "/studio",
    description: "Create, organise, publish and improve imaging education.",
    groups: [
      {
        label: "Explore teaching",
        links: [
          { label: "Educator overview", href: "/studio", description: "See how Visible Medicine supports educators." },
          { label: "Plans", href: "/pricing", description: "Review educator and institution options." },
          { label: "Embedded delivery", href: "/embed", description: "Understand controlled delivery within approved learning sites." },
        ],
      },
      {
        label: "Your workspace",
        workspace: true,
        links: [
          { label: "Open Studio workspace", href: "/studio/workspace", description: "Sign in to create courses, workbooks and cohorts, then publish and review performance." },
        ],
      },
    ],
  },
  {
    id: "institutions",
    label: "Institutions",
    href: "/institutions",
    description: "Plan, govern and operate institution-wide imaging education.",
    groups: [
      {
        label: "Plan",
        links: [
          { label: "Institution overview", href: "/institutions", description: "Explore delivery, governance and support." },
          { label: "Plans", href: "/pricing", description: "Review learner, educator and institution options." },
          { label: "Plan a pilot", href: "/institutions/pilot", description: "Prepare a controlled institutional evaluation." },
        ],
      },
      {
        label: "Your workspace",
        workspace: true,
        links: [
          { label: "Open Institution workspace", href: "/workspace", description: "Sign in to manage people, readiness, controls and integrations." },
        ],
      },
    ],
  },
];

const secondaryLinks = [
  ["Search", "/search"],
  ["Trust centre", "/trust"],
] as const;

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const accountHref = signedIn ? "/account" : "/account-entry";

  useEffect(() => {
    const closeOutside = (event: globalThis.PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !openMenu) return;
      navigationRef.current
        ?.querySelector<HTMLButtonElement>(`[data-nav-trigger="${openMenu}"]`)
        ?.focus();
      // Restoring focus triggers the group's onFocus; close after that handler.
      setOpenMenu(null);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [openMenu]);

  const closeMobileNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    (event.currentTarget.closest(".mobile-nav") as HTMLDetailsElement | null)?.removeAttribute("open");
  };

  const closeGroupAfterPointerLeave = (sectionId: string, event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(document.activeElement)) {
      setOpenMenu((current) => current === sectionId ? null : current);
    }
  };

  const closeGroupAfterBlur = (sectionId: string, event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpenMenu((current) => current === sectionId ? null : current);
    }
  };

  return (
    <header className="topbar platform-header public-platform-header">
      <Link className="brand platform-brand" href="/" aria-label="Visible Medicine home">
        <BrandLockup priority sizes="(max-width: 392px) calc(100vw - 112px), (max-width: 760px) 280px, (max-width: 1428px) 300px, (max-width: 1600px) 21vw, 336px" />
      </Link>
      <nav className="nav-links public-primary-nav" aria-label="Primary navigation" ref={navigationRef}>
        <Link className="primary-nav-link" aria-current={pathname === "/" ? "page" : undefined} href="/">Home</Link>
        {navigationSections.map((section) => {
          const expanded = openMenu === section.id;
          return (
            <div
              className="primary-nav-group"
              data-nav-section={section.id}
              key={section.id}
              onBlur={(event) => closeGroupAfterBlur(section.id, event)}
              onFocus={(event) => {
                if (section.id !== 'atlas' || !(event.target instanceof Element) || !event.target.closest('[data-nav-trigger]')) setOpenMenu(section.id);
              }}
              onPointerEnter={() => { if (section.id !== 'atlas') setOpenMenu(section.id); }}
              onPointerLeave={(event) => closeGroupAfterPointerLeave(section.id, event)}
            >
              <Link className="primary-nav-link" aria-current={isActive(section.href) ? "page" : undefined} href={section.href} onPointerEnter={() => setOpenMenu(section.id)} onClick={() => setOpenMenu(null)}>{section.label}</Link>
              <button
                aria-controls={`${section.id}-navigation`}
                aria-expanded={expanded}
                aria-label={`${expanded ? "Close" : "Open"} ${section.label} navigation`}
                className="primary-nav-toggle"
                data-nav-trigger={section.id}
                onClick={() => setOpenMenu(expanded ? null : section.id)}
                type="button"
              >
                <span aria-hidden="true">⌄</span>
              </button>
              <div className="primary-nav-panel" hidden={!expanded} id={`${section.id}-navigation`}>
                <div className="primary-nav-introduction">
                  <b>{section.label}</b>
                  <p>{section.description}</p>
                </div>
                <div className="primary-nav-columns">
                  {section.groups.map((group) => (
                    <div className={`primary-nav-column${group.workspace ? " primary-nav-workspace" : ""}`} key={group.label}>
                      <span>{group.label}</span>
                      {group.links.map((link) => (
                        <Link href={link.href} key={link.href} onClick={() => setOpenMenu(null)}>
                          <b>{link.label}</b>
                          <small>{link.description}</small>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <Link className="search-link" href="/search" aria-label="Search Visible Medicine" aria-current={pathname === "/search" ? "page" : undefined}>⌕ <span>Search</span></Link>
      <Link className="account-entry-link" href={accountHref} aria-current={isActive(accountHref) ? "page" : undefined}>{signedIn ? "Profile" : "Sign in"}</Link>
      <details className="workspace-switcher"><summary>Open workspace <span aria-hidden="true">⌄</span></summary><nav aria-label="Choose workspace"><Link aria-current={isActive("/my-learning") ? "page" : undefined} href="/my-learning"><b>Learn</b><span>Progress, revision and certificates</span></Link><Link aria-current={pathname.startsWith("/studio/") ? "page" : undefined} href="/studio/workspace"><b>Studio</b><span>Courses, workbooks and publishing</span></Link><Link aria-current={isActive("/workspace") ? "page" : undefined} href="/workspace"><b>Institution</b><span>People, controls and readiness</span></Link><Link aria-current={isActive("/account") ? "page" : undefined} href="/account"><b>Account</b><span>Profile, export and learner rights</span></Link></nav></details>
      <details className="mobile-nav">
        <summary><span className="menu-label">Menu</span><span className="close-label">Close</span></summary>
        <nav aria-label="Mobile navigation">
          <span className="mobile-nav-section">Explore and learn</span>
          <Link aria-current={pathname === "/" ? "page" : undefined} href="/" onClick={closeMobileNavigation}>Home<span aria-hidden="true">→</span></Link>
          {navigationSections.slice(0, 2).map((section) => (
            <MobileNavigationGroup isActive={isActive} key={section.id} section={section} onNavigate={closeMobileNavigation} />
          ))}
          <span className="mobile-nav-section">Create and manage</span>
          {navigationSections.slice(2).map((section) => (
            <MobileNavigationGroup isActive={isActive} key={section.id} section={section} onNavigate={closeMobileNavigation} />
          ))}
          <span className="mobile-nav-section">Your work</span>
          <Link aria-current={isActive(accountHref) ? "page" : undefined} href={accountHref} onClick={closeMobileNavigation}>{signedIn ? "Profile and account" : "Sign in or create account"}<span aria-hidden="true">→</span></Link>
          {([[
            "My learning", "/my-learning",
          ], [
            "Studio workspace", "/studio/workspace",
          ], [
            "Institution workspace", "/workspace",
          ], [
            "Account & data", "/account",
          ]] as const).map(([label, href]) => (
            <Link aria-current={isActive(href) ? "page" : undefined} href={href} key={href} onClick={closeMobileNavigation}>{label}<span aria-hidden="true">→</span></Link>
          ))}
          <span className="mobile-nav-section">More</span>
          {secondaryLinks.map(([label, href]) => (
            <Link aria-current={isActive(href) ? "page" : undefined} href={href} key={href} onClick={closeMobileNavigation}>{label}<span aria-hidden="true">→</span></Link>
          ))}
        </nav>
      </details>
    </header>
  );
}

function MobileNavigationGroup({
  section,
  isActive,
  onNavigate,
}: {
  section: NavigationSection;
  isActive: (href: string) => boolean;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <details className="mobile-nav-group">
      <summary aria-label={`Show ${section.label} links`}>
        <span>{section.label}</span><span aria-hidden="true">⌄</span>
      </summary>
      <div className="mobile-nav-group-content">
        {section.id === 'atlas' && <Link href="/atlas" onClick={onNavigate}>Atlas overview<span aria-hidden="true">→</span></Link>}
        {section.groups.map((group) => (
          <div className={`mobile-nav-subgroup${group.workspace ? " mobile-nav-workspace" : ""}`} key={group.label}>
            <span>{group.label}</span>
            {group.links.map((link) => (
              <Link aria-current={isActive(link.href) ? "page" : undefined} href={link.href} key={link.href} onClick={onNavigate}>{link.label}<span aria-hidden="true">→</span></Link>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
