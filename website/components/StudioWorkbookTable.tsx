"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { StudioSnapshot } from "@/lib/education-platform";
import { workbookMatchesStatus } from "../lib/studio-queues.ts";

const PAGE_SIZE = 12;

export function StudioWorkbookTable({ workbooks, initialQueue = "all" }: { workbooks: StudioSnapshot["workbooks"]; initialQueue?: "all" | "editing" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(initialQueue);
  const [mode, setMode] = useState("all");
  const [pagination, setPagination] = useState(() => ({ source: workbooks, page: 0 }));
  const pendingFocus = useRef<{ button: HTMLButtonElement; source: typeof workbooks; page: number } | null>(null);
  // A replacement snapshot starts at the first page in the same render.
  const page = pagination.source === workbooks ? pagination.page : 0;
  if (pagination.source !== workbooks) {
    pendingFocus.current = null;
    setPagination({ source: workbooks, page: 0 });
  }
  const statuses = [...new Set(workbooks.map((workbook) => workbook.status))];
  const modes = [...new Set(workbooks.map((workbook) => workbook.mode))];
  const filtered = useMemo(() => workbooks.filter((workbook) => {
    const search = query.trim().toLowerCase();
    return (!search || `${workbook.title} ${workbook.courseTitle}`.toLowerCase().includes(search)) && workbookMatchesStatus(workbook, status) && (mode === "all" || workbook.mode === mode);
  }), [mode, query, status, workbooks]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const first = currentPage * PAGE_SIZE;
  const visible = filtered.slice(first, first + PAGE_SIZE);
  const resetPage = () => { pendingFocus.current = null; setPagination({ source: workbooks, page: 0 }); };
  const movePage = (nextPage: number, button: HTMLButtonElement) => {
    if (nextPage < 0 || nextPage >= pageCount) return;
    pendingFocus.current = { button, source: workbooks, page: nextPage };
    setPagination({ source: workbooks, page: nextPage });
  };
  const focusResultAfterPageChange = (element: HTMLElement | null) => {
    if (!element || !pendingFocus.current) return;
    const pending = pendingFocus.current;
    if (pending.source !== workbooks) { pendingFocus.current = null; return; }
    if (pending.page !== currentPage) return;
    pendingFocus.current = null;
    const document = pending.button.ownerDocument;
    if (document.activeElement === pending.button || (pending.button.disabled && document.activeElement === document.body)) {
      element.focus({ preventScroll: true });
    }
  };
  const resultText = filtered.length > PAGE_SIZE
    ? `${filtered.length} of ${workbooks.length} workbooks · Showing ${first + 1}–${first + visible.length} · Page ${currentPage + 1} of ${pageCount}`
    : `${filtered.length} of ${workbooks.length} workbooks`;

  return <section className="studio-data-section" aria-labelledby="workbook-list-title">
    <div className="studio-data-toolbar">
      <div><p className="section-index">Existing work</p><h2 id="workbook-list-title">Find a workbook</h2><small role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} ref={focusResultAfterPageChange}>{resultText}</small></div>
      {workbooks.length > 0 && <><label className="studio-search-field"><span>Search</span><input type="search" value={query} onChange={(event) => { resetPage(); setQuery(event.target.value); }} placeholder="Workbook or course" /></label>
      <label><span>Status</span><select value={status} onChange={(event) => { resetPage(); setStatus(event.target.value); }}><option value="all">All statuses</option><option value="editing">Drafts to continue</option>{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label><span>Mode</span><select value={mode} onChange={(event) => { resetPage(); setMode(event.target.value); }}><option value="all">All modes</option>{modes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <button type="button" onClick={() => { resetPage(); setQuery(""); setStatus("all"); setMode("all"); }}>Clear</button></>}
    </div>
      {filtered.length > PAGE_SIZE && <nav className="studio-workbook-pager" aria-label="Workbook pages"><button type="button" disabled={currentPage === 0} onClick={(event) => movePage(currentPage - 1, event.currentTarget)}>Previous</button><span aria-hidden="true">Page {currentPage + 1} of {pageCount}</span><button type="button" disabled={currentPage === pageCount - 1} onClick={(event) => movePage(currentPage + 1, event.currentTarget)}>Next</button></nav>}
    {workbooks.length === 0 ? <div className="studio-table-empty"><b>No workbooks yet.</b><p>Add content through a course to create your first workbook.</p><Link href="/studio/courses">Go to courses →</Link></div> : <><div className="studio-table studio-workbook-table" role="table" aria-labelledby="workbook-list-title">
      <header role="row"><span role="columnheader">Workbook</span><span role="columnheader">Course</span><span role="columnheader">Mode</span><span role="columnheader">State</span><span role="columnheader">Cases</span><span role="columnheader">Action</span></header>
      {visible.map((workbook) => <div className="studio-workbook-row" role="row" key={workbook.id}><div className="studio-workbook-name" role="rowheader"><b>{workbook.title}</b><Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`} aria-label={`Details for ${workbook.title}`}>Details</Link></div><span role="cell" data-label="Course">{workbook.courseTitle}</span><span role="cell" data-label="Mode">{workbook.mode}</span><span role="cell" data-label="State"><i className={`status-badge ${workbook.status}`}>{workbook.status}</i><small>v{workbook.version}</small></span><span role="cell" data-label="Cases">{workbook.caseCount}</span><div className="studio-workbook-action" role="cell"><Link className="studio-workbook-edit" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`} aria-label={`${["draft", "changes-requested"].includes(workbook.status) ? "Edit" : "Open"} ${workbook.title}`}>{["draft", "changes-requested"].includes(workbook.status) ? "Edit" : "Open"} →</Link></div></div>)}
    </div>
      {!visible.length && <div className="studio-table-empty"><b>No workbooks match these filters.</b><button type="button" onClick={(event) => { const button = event?.currentTarget; if (button && button.ownerDocument.activeElement === button) button.closest(".studio-data-section")?.querySelector<HTMLInputElement>('.studio-search-field input[type="search"]')?.focus({ preventScroll: true }); resetPage(); setQuery(""); setStatus("all"); setMode("all"); }}>Show all workbooks</button></div>}
    </>}
  </section>;
}
