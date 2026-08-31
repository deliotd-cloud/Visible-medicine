"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "./BrandLockup";

const primaryLinks = [
  ["Atlas", "/atlas"],
  ["Courses", "/courses"],
  ["For educators", "/studio"],
  ["Institutions", "/institutions"],
] as const;

const secondaryLinks = [
  ["Search", "/search"],
  ["Research", "/research"],
  ["Plans", "/pricing"],
  ["Embeds", "/embed"],
  ["Trust centre", "/trust"],
  ["Account & data", "/account"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="topbar platform-header public-platform-header">
      <Link className="brand platform-brand" href="/" aria-label="Visible Medicine home">
        <BrandLockup priority />
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        {primaryLinks.map(([label, href]) => (
          <Link aria-current={isActive(href) ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="search-link" href="/search" aria-label="Search Visible Medicine" aria-current={pathname === "/search" ? "page" : undefined}>⌕ <span>Search</span></Link>
      <details className="workspace-switcher"><summary>Open workspace <span aria-hidden="true">⌄</span></summary><nav aria-label="Choose workspace"><Link aria-current={isActive("/my-learning") ? "page" : undefined} href="/my-learning"><b>Learn</b><span>Progress, revision and certificates</span></Link><Link aria-current={pathname.startsWith("/studio/") ? "page" : undefined} href="/studio/workspace"><b>Studio</b><span>Courses, workbooks and publishing</span></Link><Link aria-current={isActive("/workspace") ? "page" : undefined} href="/workspace"><b>Institution</b><span>People, controls and readiness</span></Link><Link aria-current={isActive("/account") ? "page" : undefined} href="/account"><b>Account</b><span>Profile, export and learner rights</span></Link></nav></details>
      <details className="mobile-nav">
        <summary><span className="menu-label">Menu</span><span className="close-label">Close</span></summary>
        <nav aria-label="Mobile navigation">
          <span className="mobile-nav-section">Explore and learn</span>
          {primaryLinks.map(([label, href]) => (
            <Link
              aria-current={isActive(href) ? "page" : undefined}
              href={href}
              key={href}
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              {label}<span aria-hidden="true">→</span>
            </Link>
          ))}
          <span className="mobile-nav-section">Your work</span>
          {([[
            "My learning", "/my-learning",
          ], [
            "Studio workspace", "/studio/workspace",
          ], [
            "Institution workspace", "/workspace",
          ], [
            "Account & data", "/account",
          ]] as const).map(([label, href]) => (
            <Link
              aria-current={isActive(href) ? "page" : undefined}
              href={href}
              key={href}
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              {label}<span aria-hidden="true">→</span>
            </Link>
          ))}
          <span className="mobile-nav-section">More</span>
          {secondaryLinks.filter(([, href]) => ["/search", "/pricing", "/trust"].includes(href)).map(([label, href]) => (
            <Link
              aria-current={isActive(href) ? "page" : undefined}
              href={href}
              key={href}
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              {label}<span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
