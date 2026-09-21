import Link from "next/link";
import type { ReactNode } from "react";
import type { StudioSnapshot } from "@/lib/education-platform";
import { StudioNavigation } from "./StudioNavigation";
import "./studio-workspace.css";

export function StudioShell({ snapshot, eyebrow, title, description, actions, children }: { snapshot: StudioSnapshot; eyebrow: string; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <main className="inner-page studio-app">
    <div className="studio-app-layout"><aside className="studio-app-nav"><div className="studio-sidebar-context"><b>Studio</b><small>{snapshot.organization.name} · {snapshot.organization.role}</small></div><StudioNavigation educationRoles={snapshot.educationRoles} /><div className="studio-boundary-note"><b>Education boundary</b><p>Course and learner data remain separate from clinical Didanix systems.</p></div></aside>
      <div className="studio-app-main"><header className="studio-app-heading"><div><nav className="app-breadcrumbs" aria-label="Breadcrumb"><Link href="/studio/workspace">Studio</Link><span aria-hidden="true">/</span><span>{eyebrow}</span></nav><h1>{title}</h1><p>{description}</p></div>{actions && <div className="studio-heading-actions">{actions}</div>}</header>{children}</div>
    </div>
  </main>;
}
