"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "./BrandLockup";

const primaryLinks = [
  ["Atlas", "/atlas"],
  ["Courses", "/courses"],
  ["Studio", "/studio"],
  ["Institutions", "/institutions"],
] as const;

const secondaryLinks = [
  ["Research", "/research"],
  ["Plans", "/pricing"],
  ["Embeds", "/embed"],
  ["Trust centre", "/trust"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Elivion Education home">
        <BrandLockup priority />
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        {primaryLinks.map(([label, href]) => (
          <Link aria-current={isActive(href) ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="account-link" href="/workspace" aria-current={pathname === "/workspace" ? "page" : undefined}>Workspace <span aria-hidden="true">→</span></Link>
      <details className="mobile-nav">
        <summary aria-label="Open site navigation">Menu</summary>
        <nav aria-label="Mobile navigation">
          {[...primaryLinks, ...secondaryLinks].map(([label, href]) => (
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
