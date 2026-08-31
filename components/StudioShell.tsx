import Link from "next/link";
import type { ReactNode } from "react";
import type { StudioSnapshot } from "@/lib/education-platform";
import { StudioNavigation } from "./StudioNavigation";

export function StudioShell({ snapshot, eyebrow, title, description, actions, children }: { snapshot: StudioSnapshot; eyebrow: string; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <main className="inner-page studio-app">
    <section className="studio-context-bar"><div><span>Visible Medicine workspace</span><i aria-hidden="true">/</i><b>Studio</b><small>{snapshot.organization.name} · {snapshot.organization.role}</small></div><Link href="/studio">Studio guide →</Link></section>
    <div className="studio-app-layout"><aside className="studio-app-nav"><p>Studio workspace</p><StudioNavigation /><div><b>Education boundary</b><p>Course authoring and learning data remain isolated from every clinical Didanix environment.</p></div></aside>
      <div className="studio-app-main"><header className="studio-app-heading"><div><nav className="app-breadcrumbs" aria-label="Breadcrumb"><Link href="/studio/workspace">Studio</Link><span aria-hidden="true">/</span><span>{eyebrow}</span></nav><p className="eyebrow"><span /> {eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="studio-heading-actions">{actions}</div>}</header>{children}</div>
    </div>
  </main>;
}
