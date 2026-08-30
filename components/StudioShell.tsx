import Link from "next/link";
import type { ReactNode } from "react";
import type { StudioSnapshot } from "@/lib/education-platform";

const links = [
  ["Overview", "/studio/workspace"], ["Courses", "/studio/courses"], ["Workbooks", "/studio/workbooks"],
  ["Cohorts", "/studio/cohorts"], ["Publishing", "/studio/publishing"], ["Analytics", "/studio/analytics"],
] as const;

export function StudioShell({ snapshot, eyebrow, title, description, actions, children }: { snapshot: StudioSnapshot; eyebrow: string; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <main className="inner-page studio-app">
    <section className="studio-app-bar"><div><span>Visible Medicine</span><b>Studio</b></div><p>{snapshot.organization.name} · {snapshot.organization.role}</p><Link href="/my-learning">Switch to My Learning →</Link></section>
    <div className="studio-app-layout"><aside className="studio-app-nav"><p>Studio workspace</p>{links.map(([label, href], index) => <Link href={href} key={href}><span>{String(index + 1).padStart(2, "0")}</span>{label}</Link>)}<div><b>Education boundary</b><p>Course authoring and learning data remain isolated from every clinical Didanix environment.</p></div></aside>
      <div className="studio-app-main"><header className="studio-app-heading"><div><p className="eyebrow"><span /> {eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="studio-heading-actions">{actions}</div>}</header>{children}</div>
    </div>
  </main>;
}
