"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudioSnapshot } from "@/lib/education-platform";

export function StudioWorkbookTable({ workbooks }: { workbooks: StudioSnapshot["workbooks"] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("all");
  const statuses = [...new Set(workbooks.map((workbook) => workbook.status))];
  const modes = [...new Set(workbooks.map((workbook) => workbook.mode))];
  const visible = useMemo(() => workbooks.filter((workbook) => {
    const search = query.trim().toLowerCase();
    return (!search || `${workbook.title} ${workbook.courseTitle}`.toLowerCase().includes(search)) && (status === "all" || workbook.status === status) && (mode === "all" || workbook.mode === mode);
  }), [mode, query, status, workbooks]);

  return <section className="studio-data-section" aria-labelledby="workbook-list-title">
    <div className="studio-data-toolbar">
      <div><p className="section-index">Existing work</p><h2 id="workbook-list-title">Find a workbook</h2><small>{visible.length} of {workbooks.length} workbooks</small></div>
      <label className="studio-search-field"><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Workbook or course" /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label><span>Mode</span><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="all">All modes</option>{modes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <button type="button" onClick={() => { setQuery(""); setStatus("all"); setMode("all"); }}>Clear</button>
    </div>
    <div className="studio-table studio-workbook-table">
      <header><span>Workbook</span><span>Course</span><span>Mode</span><span>State</span><span>Cases</span><span>Action</span></header>
      {visible.map((workbook) => <div className="studio-workbook-row" key={workbook.id}><div className="studio-workbook-name"><b>{workbook.title}</b><Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`}>Details</Link></div><span data-label="Course">{workbook.courseTitle}</span><span data-label="Mode">{workbook.mode}</span><span data-label="State"><i className={`status-badge ${workbook.status}`}>{workbook.status}</i><small>v{workbook.version}</small></span><span data-label="Cases">{workbook.caseCount}</span><Link className="studio-workbook-edit" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}>{["draft", "changes-requested"].includes(workbook.status) ? "Edit" : "Open"} →</Link></div>)}
      {!visible.length && <div className="studio-table-empty"><b>No workbooks match these filters.</b><button type="button" onClick={() => { setQuery(""); setStatus("all"); setMode("all"); }}>Show all workbooks</button></div>}
    </div>
  </section>;
}
