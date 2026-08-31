"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { STUDIO_COURSE_TEMPLATES } from "@/lib/studio-templates";

async function postStudio(payload: Record<string, unknown>) {
  const response = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json() as { error?: string; courseId?: string; workbookId?: string; releaseId?: string; invitationCode?: string };
  if (!response.ok) throw new Error(result.error ?? "Studio could not complete this action.");
  return result;
}

function ActionForm({ children, onSubmit, submitLabel, draftKey }: { children: ReactNode; onSubmit: (form: FormData) => Promise<void>; submitLabel: string; draftKey?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => {
    if (!draftKey || !formRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`visible-medicine-studio-draft:${draftKey}`) ?? localStorage.getItem(`elivion-studio-draft:${draftKey}`) ?? "null") as Record<string, string | string[]> | null;
      if (!saved) return;
      for (const element of Array.from(formRef.current.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) || !element.name || !(element.name in saved)) continue;
        const value = saved[element.name];
        if (element instanceof HTMLInputElement && element.type === "checkbox") element.checked = Array.isArray(value) ? value.includes(element.value) : value === "true";
        else if (!Array.isArray(value)) element.value = value;
      }
      const recoveredNotice = window.setTimeout(() => setMessage("Recovered an unsent device-local draft."), 0);
      return () => window.clearTimeout(recoveredNotice);
    } catch { localStorage.removeItem(`visible-medicine-studio-draft:${draftKey}`); }
  }, [draftKey]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function preserveDraft() {
    setDirty(true);
    if (!draftKey || !formRef.current) return;
    const values: Record<string, string | string[]> = {};
    const form = new FormData(formRef.current);
    for (const key of new Set([...form.keys()])) { const entries = form.getAll(key).map(String); values[key] = entries.length > 1 ? entries : entries[0] ?? ""; }
    for (const checkbox of Array.from(formRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))) if (!checkbox.checked && !(checkbox.name in values)) values[checkbox.name] = "false";
    localStorage.setItem(`visible-medicine-studio-draft:${draftKey}`, JSON.stringify(values));
  }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); setError(""); try { await onSubmit(new FormData(event.currentTarget)); if (draftKey) { localStorage.removeItem(`visible-medicine-studio-draft:${draftKey}`); localStorage.removeItem(`elivion-studio-draft:${draftKey}`); } setDirty(false); setMessage("Saved successfully."); } catch (caught) { setError(caught instanceof Error ? caught.message : "Studio could not complete this action."); } finally { setBusy(false); } }
  return <form className="studio-form" ref={formRef} onChange={preserveDraft} onSubmit={submit}>{children}{draftKey && <small className="draft-safety">{dirty ? "Unsubmitted changes are protected on this device." : "No unsaved changes."}</small>}{(message || error) && <p className={`studio-form-message ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{error || message}</p>}<button disabled={busy}>{busy ? "Working…" : submitLabel}</button></form>;
}

export function CreateCourseForm() {
  const router = useRouter();
  return <ActionForm submitLabel="Create course" onSubmit={async (form) => { const result = await postStudio({ action: "create-course", title: form.get("title"), code: form.get("code"), description: form.get("description") }); router.push(`/studio/courses/${encodeURIComponent(result.courseId!)}`); router.refresh(); }}><div className="two-fields"><label><span>Course title</span><input name="title" required /></label><label><span>Course code</span><input name="code" placeholder="RAD-101" /></label></div><label><span>Educational description</span><textarea name="description" required minLength={20} /></label></ActionForm>;
}

export function CreateCourseFromTemplateForm() {
  const router = useRouter();
  return <ActionForm submitLabel="Create templated course" draftKey="new-course-template" onSubmit={async (form) => { const result = await postStudio({ action: "create-course-from-template", templateId: form.get("templateId"), title: form.get("title"), code: form.get("code"), description: form.get("description") }); router.push(`/studio/courses/${encodeURIComponent(result.courseId!)}`); router.refresh(); }}>
    <label><span>Teaching pattern</span><select name="templateId">{STUDIO_COURSE_TEMPLATES.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label>
    <div className="two-fields"><label><span>Course title</span><input name="title" required /></label><label><span>Course code</span><input name="code" placeholder="RAD-101" /></label></div>
    <label><span>Educational description</span><textarea name="description" required minLength={20} /></label>
    <p className="form-help">Templates create empty workbook shells only. Cases, media and learner records are never copied automatically.</p>
  </ActionForm>;
}

export function DuplicateCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function duplicate() { setBusy(true); setError(""); try { const result = await postStudio({ action: "duplicate-course", courseId }); router.push(`/studio/courses/${encodeURIComponent(result.courseId!)}`); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "The course could not be duplicated."); } finally { setBusy(false); } }
  return <div className="inline-action"><button disabled={busy} onClick={() => void duplicate()}>{busy ? "Duplicating…" : "Duplicate course structure"}</button>{error && <p role="alert">{error}</p>}</div>;
}

export function DuplicateWorkbookButton({ workbookId }: { workbookId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function duplicate() { setBusy(true); setError(""); try { const result = await postStudio({ action: "duplicate-workbook", workbookId }); router.push(`/studio/workbooks/${encodeURIComponent(result.workbookId!)}`); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "The workbook could not be duplicated."); } finally { setBusy(false); } }
  return <div className="inline-action"><button disabled={busy} title="Copies the workbook structure without learner attempts or publication history" onClick={() => void duplicate()}>{busy ? "Duplicating…" : "Duplicate structure only"}</button>{error && <p role="alert">{error}</p>}</div>;
}

export function CreateWorkbookForm({ course }: { course: StudioCourse }) {
  const router = useRouter();
  return <ActionForm submitLabel="Create workbook draft" onSubmit={async (form) => { const result = await postStudio({ action: "create-workbook", courseId: course.id, title: form.get("title"), mode: form.get("mode"), durationMinutes: Number(form.get("durationMinutes")) }); router.push(`/studio/workbooks/${encodeURIComponent(result.workbookId!)}`); router.refresh(); }}><label><span>Workbook title</span><input name="title" required /></label><div className="two-fields"><label><span>Mode</span><select name="mode"><option value="teaching">Teaching</option><option value="assessment">Assessment</option></select></label><label><span>Assessment duration (minutes)</span><input name="durationMinutes" type="number" min="0" max="480" defaultValue="60" /></label></div></ActionForm>;
}

export function ReleaseDraftForm({ course, workbooks, release }: { course: StudioCourse; workbooks: StudioWorkbook[]; release?: StudioRelease }) {
  const router = useRouter();
  return <ActionForm draftKey={`release:${release?.id ?? course.id}`} submitLabel={release ? "Save release draft" : "Create release draft"} onSubmit={async (form) => { await postStudio({ action: "save-release", releaseId: release?.id, expectedVersion: release?.version, courseId: course.id, title: form.get("title"), slug: form.get("slug"), summary: form.get("summary"), level: form.get("level"), duration: form.get("duration"), outcomes: String(form.get("outcomes") ?? "").split(/\r?\n/).filter(Boolean), publisherName: form.get("publisherName"), publisherKind: form.get("publisherKind"), visibility: form.get("visibility"), accessModel: form.get("accessModel"), priceMinor: Math.round(Number(form.get("price")) * 100), currency: form.get("currency"), enrolmentOpen: form.get("enrolmentOpen") === "on", workbookIds: form.getAll("workbookIds") }); router.refresh(); }}>
    <div className="two-fields"><label><span>Catalogue title</span><input name="title" defaultValue={release?.title ?? course.title} required /></label><label><span>URL slug</span><input name="slug" defaultValue={release?.slug ?? ""} placeholder="cross-sectional-neuro" required /></label></div>
    <label><span>Course summary</span><textarea name="summary" defaultValue={release?.summary ?? course.description} minLength={30} required /></label>
    <div className="two-fields"><label><span>Level</span><input name="level" defaultValue={release?.level ?? "Intermediate"} /></label><label><span>Duration</span><input name="duration" defaultValue={release?.duration ?? "Self-paced"} /></label></div>
    <label><span>Learning outcomes · one per line</span><textarea name="outcomes" defaultValue={release?.outcomes.join("\n") ?? ""} required /></label>
    <fieldset><legend>Release workbooks</legend>{workbooks.map((workbook) => <label className="studio-check" key={workbook.id}><input type="checkbox" name="workbookIds" value={workbook.id} defaultChecked={release?.workbookIds.includes(workbook.id)} /><span><b>{workbook.title}</b>{workbook.mode} · {workbook.status} · {workbook.caseCount} cases</span></label>)}</fieldset>
    <div className="three-fields"><label><span>Publisher</span><input name="publisherName" defaultValue={release?.publisher ?? ""} placeholder="Institution name" /></label><label><span>Publisher label</span><select name="publisherKind" defaultValue={release?.publisherKind ?? "institution"}><option value="institution">Institution</option><option value="official">Visible Medicine official</option></select></label><label><span>Visibility</span><select name="visibility" defaultValue={release?.visibility ?? "private"}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public catalogue</option></select></label></div>
    <div className="three-fields"><label><span>Access</span><select name="accessModel" defaultValue={release?.accessModel ?? "invitation"}><option value="free">Free self-enrolment</option><option value="invitation">Invitation</option><option value="institution">Institution membership</option><option value="paid">Paid</option></select></label><label><span>Price</span><input name="price" type="number" min="0" step="0.01" defaultValue={(release?.priceMinor ?? 0) / 100} /></label><label><span>Currency</span><input name="currency" maxLength={3} defaultValue={release?.currency ?? "GBP"} /></label></div>
    <label className="studio-check"><input name="enrolmentOpen" type="checkbox" defaultChecked={release?.enrolmentOpen ?? true} /><span><b>Open enrolment</b>Allow the configured access route once this release is published.</span></label>
  </ActionForm>;
}

export function ReleaseWorkflowActions({ release, canPublish }: { release: StudioRelease; canPublish: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function act(payload: Record<string, unknown>, success: string) { setBusy(true); setError(""); setMessage(""); try { await postStudio(payload); setMessage(success); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "The workflow action failed."); } finally { setBusy(false); } }
  return <div className="release-workflow-actions">
    {new Set(["draft", "changes-requested"]).has(release.status) && <button disabled={busy} onClick={() => void act({ action: "submit-release", releaseId: release.id }, "Release submitted for independent review.")}>Submit for review</button>}
    {release.status === "in-review" && <details><summary>Record independent review</summary><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void act({ action: "review-release", releaseId: release.id, decision: form.get("decision"), notes: form.get("notes") }, "Review decision recorded."); }}><select name="decision"><option value="approved">Approve</option><option value="changes-requested">Request changes</option></select><textarea name="notes" placeholder="Review evidence and decision" required minLength={10} /><button disabled={busy}>Record review</button></form></details>}
    {release.status === "approved" && <button disabled={busy || !canPublish} onClick={() => void act({ action: "publish-release", releaseId: release.id }, "Course release published.")}>Publish approved release</button>}
    {(message || error) && <p className={error ? "error" : ""} role={error ? "alert" : "status"}>{error || message}</p>}
  </div>;
}

export function InvitationForm({ releaseId }: { releaseId: string }) {
  const [code, setCode] = useState("");
  return <ActionForm submitLabel="Create invitation" onSubmit={async (form) => { const result = await postStudio({ action: "create-invitation", releaseId, label: form.get("label"), maxUses: Number(form.get("maxUses")), validDays: Number(form.get("validDays")) }); setCode(result.invitationCode ?? ""); }}><label><span>Invitation label</span><input name="label" placeholder="Autumn 2026 cohort" /></label><div className="two-fields"><label><span>Maximum uses</span><input name="maxUses" type="number" min="1" max="1000" defaultValue="25" /></label><label><span>Valid for days</span><input name="validDays" type="number" min="1" max="365" defaultValue="30" /></label></div>{code && <div className="invitation-code"><span>Copy now · shown once</span><b>{code}</b><small>/join/{code}</small></div>}</ActionForm>;
}

export function CreateCohortForm({ courses }: { courses: StudioCourse[] }) {
  const router = useRouter();
  return <ActionForm submitLabel="Create cohort" onSubmit={async (form) => { await postStudio({ action: "create-cohort", courseId: form.get("courseId"), title: form.get("title"), code: form.get("code") }); router.refresh(); }}><label><span>Course</span><select name="courseId">{courses.map((course) => <option value={course.id} key={course.id}>{course.code} · {course.title}</option>)}</select></label><div className="two-fields"><label><span>Cohort title</span><input name="title" required /></label><label><span>Cohort code</span><input name="code" placeholder="AUT-26" required /></label></div></ActionForm>;
}

export function AssignCohortWorkbookForm({ cohortId, workbooks }: { cohortId: string; workbooks: StudioWorkbook[] }) {
  const router = useRouter();
  return <ActionForm submitLabel="Assign workbook" onSubmit={async (form) => { await postStudio({ action: "assign-cohort-workbook", cohortId, workbookId: form.get("workbookId") }); router.refresh(); }}><label><span>Published workbook</span><select name="workbookId">{workbooks.filter((workbook) => workbook.status === "published").map((workbook) => <option value={workbook.id} key={workbook.id}>{workbook.title}</option>)}</select></label></ActionForm>;
}
