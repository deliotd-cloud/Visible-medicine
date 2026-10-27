import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { CreateCourseForm, CreateCourseFromTemplateForm } from "@/components/StudioForms";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";
import { getStudioCourseDirectory } from "@/lib/studio-course-directory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio courses", robots: { index: false, follow: false } };

export default async function StudioCoursesPage({ searchParams }: { searchParams: Promise<{ new?: string; q?: unknown; page?: unknown }> }) {
  const params = await searchParams;
  const creating = params.new === "1";
  const user = await requireChatGPTUser("/studio/courses");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const recoveryScope = { actorId: `edu:${user.userId}`, organizationId: snapshot.organization.id };
  const directory = getStudioCourseDirectory(snapshot.courses, params.q, params.page);
  const { query, matchingCount, totalCount, page, pageCount, firstItem, lastItem, pageCourses, previousHref, nextHref } = directory;
  return <StudioShell snapshot={snapshot} eyebrow="Courses" title={creating ? "New course" : "Your courses"} description={creating ? "Give your course a title and short description. Add the content next." : "Open a course to continue editing or review its content."} actions={<Link className={creating ? "outline-button" : "primary-button"} href={creating ? "/studio/courses" : "/studio/courses?new=1"}>{creating ? "Back to courses" : "New course"}</Link>}>
    {creating ? <section className="course-editor-panel course-create-panel"><p>Your course stays private until its release is reviewed and explicitly published.</p><CreateCourseForm recoveryScope={recoveryScope} /><details className="studio-create-choice"><summary>Or start from a template</summary><CreateCourseFromTemplateForm recoveryScope={recoveryScope} /></details></section> : <section className="course-editor-panel"><div className="studio-course-search"><form role="search" method="get" action="/studio/courses"><label htmlFor="studio-course-search-input">Search courses</label><div><input id="studio-course-search-input" type="search" name="q" defaultValue={query} maxLength={80} placeholder="Title, code or description" /><button type="submit">Search</button>{query && <Link href="/studio/courses">Clear search</Link>}</div></form><p role="status">{pageCount > 1 ? `Showing ${firstItem}–${lastItem} of ${matchingCount}${query ? ` matching courses (${totalCount} total)` : " courses"}` : query ? `${matchingCount} of ${totalCount} courses` : `${totalCount} courses`}</p></div>{pageCount > 1 && <nav className="studio-workbook-pager" aria-label="Course pages">{previousHref && <Link className="outline-button" style={{ marginTop: 0 }} href={previousHref}>Previous</Link>}<span>Page {page} of {pageCount}</span>{nextHref && <Link className="outline-button" style={{ marginTop: 0 }} href={nextHref}>Next</Link>}</nav>}<div className="course-list">{pageCourses.map((course) => <Link className="course-list-item" href={`/studio/courses/${encodeURIComponent(course.id)}`} key={course.id}><div><h2>{course.title}</h2><p>{course.description}</p><small>{course.workbookCount} content items · {course.code}</small></div><span>Open →</span></Link>)}{!totalCount ? <p>No courses yet. Select New course to begin.</p> : query && !matchingCount ? <p>No courses match this search. Try another term or clear the search.</p> : null}</div></section>}
  </StudioShell>;
}
