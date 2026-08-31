"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Overview", "/studio/workspace"],
  ["Courses", "/studio/courses"],
  ["Workbooks", "/studio/workbooks"],
  ["Cohorts", "/studio/cohorts"],
  ["Publishing", "/studio/publishing"],
  ["Analytics", "/studio/analytics"],
] as const;

export function StudioNavigation() {
  const pathname = usePathname();
  return <>{links.map(([label, href], index) => {
    const active = href === "/studio/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return <Link aria-current={active ? "page" : undefined} href={href} key={href}><span>{String(index + 1).padStart(2, "0")}</span>{label}</Link>;
  })}</>;
}
