"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Home", "/studio/workspace"],
  ["Courses", "/studio/courses"],
  ["Workbooks", "/studio/workbooks"],
] as const;

export function StudioNavigation({ educationRoles }: { educationRoles: readonly string[] }) {
  const pathname = usePathname();
  const canManageLearners = educationRoles.some((role) => role === "administrator" || role === "instructor");
  const canViewReports = educationRoles.some((role) => role === "administrator" || role === "instructor" || role === "examiner");
  const canManageOrganization = educationRoles.includes("administrator");
  const isActive = (href: string) => href === "/studio/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return <nav className="studio-navigation" aria-label="Studio workspace">
    <p>Workspace</p>
    <div className="studio-primary-navigation">
      {links.map(([label, href]) => <Link aria-current={isActive(href) ? "page" : undefined} href={href} key={href}>{label}</Link>)}
    </div>
    <details className="studio-manage-navigation" open={pathname.startsWith("/studio/publishing") || pathname.startsWith("/studio/cohorts") || pathname.startsWith("/studio/analytics")}>
      <summary>Delivery &amp; administration</summary>
      <Link aria-current={isActive("/studio/publishing") ? "page" : undefined} href="/studio/publishing">Review &amp; publish</Link>
      {canManageLearners && <Link aria-current={isActive("/studio/cohorts") ? "page" : undefined} href="/studio/cohorts">Learner groups</Link>}
      {canViewReports && <Link aria-current={isActive("/studio/analytics") ? "page" : undefined} href="/studio/analytics">Reports</Link>}
      {canManageOrganization && <Link href="/workspace">Organisation</Link>}
    </details>
  </nav>;
}
