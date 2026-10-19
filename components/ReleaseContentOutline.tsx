import type { StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import "./release-content-outline.css";

export function ReleaseContentOutline({ release, workbooks }: {
  release: Pick<StudioRelease, "courseId" | "version" | "workbookIds">;
  workbooks: StudioWorkbook[];
}) {
  const available = new Map(workbooks.filter((item) => item.courseId === release.courseId).map((item) => [item.id, item]));
  return <section className="release-content-outline" aria-labelledby="release-content-title">
    <header><h2 id="release-content-title">Selected course content</h2><span>Release version {release.version} · {release.workbookIds.length} {release.workbookIds.length === 1 ? "item" : "items"}</span></header>
    <p>Order and selection are saved in this release. Titles, versions and statuses below reflect the current saved Studio items, not a frozen copy of their slides or cases.</p>
    {release.workbookIds.length ? <ol>{release.workbookIds.map((id, index) => {
      const item = available.get(id);
      return <li key={`${index}:${id}`}>{item ? <div><strong>{item.title}</strong><small>{item.mode === "lecture" ? "Lecture / presentation" : item.mode === "assessment" ? "Assessment" : "Imaging teaching"} · Version {item.version} · {item.status.replaceAll("-", " ")}</small></div> : <div><strong>Selected item unavailable</strong><small>Not currently available to this Studio account. No other item has been substituted.</small></div>}</li>;
    })}</ol> : <p className="release-content-empty">No content selected. Return to the course editor to prepare the release draft.</p>}
  </section>;
}
