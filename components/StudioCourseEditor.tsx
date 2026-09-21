"use client";

import Link from "next/link";
import { useState } from "react";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { CreateWorkbookForm, DuplicateCourseButton, ReleaseDraftForm } from "./StudioForms";

export function StudioCourseEditor({ course, workbooks, releases }: { course: StudioCourse; workbooks: StudioWorkbook[]; releases: StudioRelease[] }) {
  const [section, setSection] = useState<"content" | "preview" | "review">("content");
  const draftRelease = releases.find((release) => ["draft", "changes-requested"].includes(release.status));
  return <section className="course-editor">
    <nav className="course-editor-tabs" aria-label="Course editor">
      {([['content', 'Content'], ['preview', 'Preview'], ['review', 'Review & publish']] as const).map(([value, label]) => <button type="button" aria-pressed={section === value} aria-controls={`course-${value}`} onClick={() => setSection(value)} key={value}>{label}</button>)}
      <details className="course-options"><summary>Course options</summary><DuplicateCourseButton courseId={course.id} /><p>Duplicates contain structure only, never learner attempts or publication history.</p></details>
    </nav>
    <div id="course-content" hidden={section !== "content"}>
      <div className="course-editor-content">
        <section aria-label="Course outline"><header className="course-section-heading"><div><h2>Course content</h2><p>Open an item to edit its content. Add another when you need it.</p></div><span>{workbooks.length} items</span></header>
          {workbooks.length === 0 && <p className="course-empty">Your course is private. Start by adding your first teaching or assessment item.</p>}
          <ol className="course-outline">{workbooks.map((workbook, index) => <li key={workbook.id}><span className="course-item-number">{index + 1}</span><Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}><strong>{workbook.title}</strong><small>{workbook.mode === "assessment" ? "Assessment" : "Teaching"} · {workbook.caseCount} cases · {workbook.status}</small></Link><Link className="course-item-details" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`}>Details</Link></li>)}</ol>
        </section>
        <section className="course-add-content" aria-label="Add course content"><h2>Add content</h2><CreateWorkbookForm course={course} /></section>
      </div>
    </div>
    <section id="course-preview" className="course-editor-panel" hidden={section !== "preview"}><h2>Preview the learner experience</h2><p>Preview slides while editing each teaching item. A course release preview shows the saved course information and its selected content—not unsaved edits.</p>
      {releases.length ? <ul className="course-preview-list">{releases.map((release) => <li key={release.id}><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>{release.title} — preview {release.status} version {release.version}</Link></li>)}</ul> : <p>No course release has been prepared yet. When your content is ready, open Review &amp; publish to prepare a private release draft.</p>}
    </section>
    <section id="course-review" className="course-editor-panel" hidden={section !== "review"}><h2>Review &amp; publish</h2><ol className="course-release-steps"><li>Save your content and complete its independent review.</li><li>Prepare the course release below.</li><li>Submit the release for independent review, then publish when approved.</li></ol><p>Saving this form does not publish anything or grant learner access. Atlas, case and lecture access remain independent.</p>
      {workbooks.length ? <details className="course-release-settings"><summary>{draftRelease ? "Edit release draft" : "Prepare release draft"}</summary><ReleaseDraftForm course={course} workbooks={workbooks} release={draftRelease} /></details> : <p>Add course content first.</p>}
      <Link className="outline-button" href="/studio/publishing">Open review queue →</Link>
    </section>
  </section>;
}
