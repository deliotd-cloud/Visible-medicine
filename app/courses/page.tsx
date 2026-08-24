import type { Metadata } from "next";
import Link from "next/link";
import { getChatGPTUser } from "../chatgpt-auth";
import { listCatalogueCourses } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", description: "Official and institutional radiology and pathology learning in Elivion Education." };

function accessLabel(accessModel: string, priceMinor: number, currency: string) {
  if (accessModel === "free") return "Free enrolment";
  if (accessModel === "invitation") return "Invitation required";
  if (accessModel === "institution") return "Institution access";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(priceMinor / 100);
}

export default async function CoursesPage() {
  const user = await getChatGPTUser();
  const auth = user ? { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName } : null;
  const courses = await listCatalogueCourses(auth);
  return (
    <main className="inner-page courses-page">
      <section className="page-hero course-page-hero">
        <p className="eyebrow"><span /> Elivion Education courses</p>
        <h1>Learn by looking,<br />answering and revisiting.</h1>
        <p>Browse governed Elivion and institution-published imaging courses. Enrolments, workbooks and progress now connect directly to your personal learning space.</p>
        <div className="hero-actions"><Link className="primary-button" href={user ? "/my-learning" : "/join"}>{user ? "Open My Learning" : "Create learner profile"} <span>→</span></Link><Link className="text-button" href="/studio">Teach with Studio</Link></div>
      </section>
      <section className="catalogue-status"><div><span>{courses.length}</span><p>Published course {courses.length === 1 ? "release" : "releases"}</p></div><p>Catalogue entries are created from approved Studio releases. A published workbook does not become public until a separate course-release review is complete.</p></section>
      <section className="course-catalogue">
        {courses.map((course, index) => (
          <Link className="large-course-card" href={`/courses/${course.slug}`} key={course.id}>
            <div className="course-card-top"><span>{String(index + 1).padStart(2, "0")}</span><small>{course.publisherKind === "official" ? "Elivion official course" : "Institution course"}</small></div>
            <h2>{course.title}</h2><p>{course.summary}</p>
            <div className="course-card-footer"><span>{course.level}</span><span>{course.workbookCount} {course.workbookCount === 1 ? "workbook" : "workbooks"}</span><span>{course.duration}</span><span>{accessLabel(course.accessModel, course.priceMinor, course.currency)}</span><b>{course.enrolled ? "Continue course" : "View course"} ↗</b></div>
          </Link>
        ))}
        {!courses.length && <div className="catalogue-empty"><span>Publication register clear</span><h2>No public course releases yet.</h2><p>Approved private and institution releases remain available only to their intended learners.</p></div>}
        <Link className="large-course-card host-card" href="/studio">
          <div className="course-card-top"><span>+</span><small>For educators</small></div>
          <h2>Build and host your own imaging course</h2><p>Compose radiology or pathology workbooks, complete independent review and publish a controlled course release through Elivion Studio.</p>
          <div className="course-card-footer"><span>Private or public release</span><span>Live teaching</span><span>Assessments</span><b>Explore Studio ↗</b></div>
        </Link>
      </section>
      <section className="course-boundary"><b>Official, institutional and private courses remain clearly identified.</b><p>Institution-created content cannot be mistaken for Elivion-reviewed Atlas material. Public visibility is an explicit, reviewed release decision.</p></section>
    </main>
  );
}
