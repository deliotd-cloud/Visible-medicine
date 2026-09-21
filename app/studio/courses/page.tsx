import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { CreateCourseForm, CreateCourseFromTemplateForm } from "@/components/StudioForms";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio courses", robots: { index: false, follow: false } };

export default async function StudioCoursesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const creating = (await searchParams).new === "1";
  const user = await requireChatGPTUser("/studio/courses");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Courses" title={creating ? "New course" : "Your courses"} description={creating ? "Give your course a title and short description. Add the content next." : "Open a course to continue editing or review its content."} actions={<Link className={creating ? "outline-button" : "primary-button"} href={creating ? "/studio/courses" : "/studio/courses?new=1"}>{creating ? "Back to courses" : "New course"}</Link>}>
    {creating ? <section className="course-editor-panel course-create-panel"><p>Your course stays private until its release is reviewed and explicitly published.</p><CreateCourseForm /><details className="studio-create-choice"><summary>Or start from a template</summary><CreateCourseFromTemplateForm /></details></section> : <section className="course-editor-panel"><div className="course-list">{snapshot.courses.map((course) => <Link className="course-list-item" href={`/studio/courses/${encodeURIComponent(course.id)}`} key={course.id}><div><h2>{course.title}</h2><p>{course.description}</p><small>{course.workbookCount} content items · {course.code}</small></div><span>Open →</span></Link>)}{!snapshot.courses.length && <p>No courses yet. Select New course to begin.</p>}</div></section>}
  </StudioShell>;
}
