"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogueCourse, LearnerProfile } from "@/lib/education-platform";
import { courseSearchText, scoreCourseForLearner } from "@/lib/pilot-readiness";
import { cleanCourseCatalogueQuery, courseCatalogueHref, courseCatalogueSearchTerm, emptyCourseCatalogueFilters, parseCourseCatalogueFilters, type CourseCatalogueFilters } from "@/lib/course-catalogue-filters";

function accessLabel(accessModel: string, priceMinor: number, currency: string) {
  if (accessModel === "free") return "Free enrolment";
  if (accessModel === "invitation") return "Invitation required";
  if (accessModel === "institution") return "Institution access";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(priceMinor / 100);
}

export function CourseCatalogue({ courses, profile, initialFilters }: { courses: CatalogueCourse[]; profile: LearnerProfile | null; initialFilters: CourseCatalogueFilters }) {
  const [filters, setFilters] = useState(initialFilters);
  const searchInput = useRef<HTMLInputElement>(null);
  const levels = useMemo(() => [...new Set(courses.map((course) => course.level))].sort(), [courses]);
  useEffect(() => {
    const restore = () => setFilters(parseCourseCatalogueFilters(new URLSearchParams(window.location.search), levels));
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [levels, initialFilters.query, initialFilters.level, initialFilters.access, initialFilters.publisher]);
  const updateFilters = (next: CourseCatalogueFilters) => {
    setFilters(next);
    try {
      const url = new URL(window.location.href);
      if (url.pathname.replace(/\/$/, "") !== "/courses") return;
      const href = courseCatalogueHref(url.href, next);
      if (href !== `${url.pathname}${url.search}${url.hash}`) window.history.replaceState(window.history.state, "", href);
    } catch { /* Filters still work if browser history is unavailable. */ }
  };
  const clearFilters = () => updateFilters(emptyCourseCatalogueFilters());
  const term = courseCatalogueSearchTerm(filters.query);
  const visible = courses.map((course) => ({ course, score: scoreCourseForLearner(course, profile) }))
    .filter(({ course }) => !term || courseSearchText(course).includes(term))
    .filter(({ course }) => filters.level === "all" || course.level === filters.level)
    .filter(({ course }) => filters.access === "all" || course.accessModel === filters.access)
    .filter(({ course }) => filters.publisher === "all" || course.publisherKind === filters.publisher)
    .sort((a, b) => b.score - a.score || (b.course.publishedAt ?? "").localeCompare(a.course.publishedAt ?? "") || a.course.title.localeCompare(b.course.title));
  const personalised = Boolean(profile?.onboardingStatus === "complete" && profile.interests.length);
  return <>
    <section className="course-discovery-controls" id="course-catalogue" aria-label="Course catalogue filters"><div className="course-search-field"><label htmlFor="course-query">Search courses</label><input ref={searchInput} id="course-query" type="search" maxLength={160} value={filters.query} onChange={(event) => updateFilters({ ...filters, query: cleanCourseCatalogueQuery(event.target.value) })} placeholder="Anatomy, CT, pathology, neuro…" /></div><label><span>Level</span><select value={filters.level} onChange={(event) => updateFilters({ ...filters, level: event.target.value })}><option value="all">All levels</option>{levels.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span>Access</span><select value={filters.access} onChange={(event) => updateFilters({ ...filters, access: event.target.value as CourseCatalogueFilters["access"] })}><option value="all">All access</option><option value="free">Free</option><option value="invitation">Invitation</option><option value="institution">Institution</option><option value="paid">Paid later</option></select></label><label><span>Publisher</span><select value={filters.publisher} onChange={(event) => updateFilters({ ...filters, publisher: event.target.value as CourseCatalogueFilters["publisher"] })}><option value="all">All publishers</option><option value="official">Visible Medicine official</option><option value="institution">Institutions</option></select></label><button type="button" onClick={clearFilters}>Clear filters</button></section>
    <div className="catalogue-result-summary"><span role="status" aria-live="polite" aria-atomic="true">{visible.length} matching {visible.length === 1 ? "course" : "courses"}</span><p>{personalised ? "Courses matching your learner-profile interests are shown first." : "Complete your learner profile to personalise the catalogue."}</p></div>
    <section className="course-catalogue">
      {visible.map(({ course, score }, index) => <Link className={`large-course-card${course.enrolled && course.liveWorkbookId ? " live" : ""}`} href={`/courses/${course.slug}`} key={course.id}><div className="course-card-top"><span>{String(index + 1).padStart(2, "0")}</span><small>{course.enrolled && course.liveWorkbookId ? "Live teaching now" : score > 0 ? "Recommended for your interests" : course.publisherKind === "official" ? "Visible Medicine official course" : "Institution course"}</small></div><h2>{course.title}</h2><p>{course.summary}</p><div className="course-card-footer"><span>{course.level}</span><span>{course.workbookCount} {course.workbookCount === 1 ? "workbook" : "workbooks"}</span><span>{course.duration}</span><span>{accessLabel(course.accessModel, course.priceMinor, course.currency)}</span><b>{course.enrolled && course.liveWorkbookId ? "Join live teaching" : course.enrolled ? "Continue course" : "View course"} ↗</b></div></Link>)}
      {!visible.length && <div className="catalogue-empty"><span>Filters applied</span><h2>No course releases match.</h2><p>Clear one or more filters or browse the complete catalogue.</p><button type="button" onClick={() => { searchInput.current?.focus({ preventScroll: true }); clearFilters(); }}>Show all courses</button></div>}
      <Link className="large-course-card host-card" href="/studio"><div className="course-card-top"><span>+</span><small>For educators</small></div><h2>Build and host your own imaging course</h2><p>Compose radiology or pathology workbooks, complete independent review and publish a controlled course release through Visible Medicine Studio.</p><div className="course-card-footer"><span>Private or public release</span><span>Live teaching</span><span>Assessments</span><b>Explore Studio ↗</b></div></Link>
    </section>
  </>;
}
