import type { Metadata } from "next";
import Link from "next/link";
import { getChatGPTUser } from "../chatgpt-auth";
import { getLearnerProfile, listCatalogueCourses } from "@/lib/education-platform";
import { CourseCatalogue } from "@/components/CourseCatalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", description: "Official and institutional radiology and pathology learning in Elivion Education." };

export default async function CoursesPage() {
  const user = await getChatGPTUser();
  const auth = user ? { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName } : null;
  const courses = await listCatalogueCourses(auth);
  const profile = auth ? await getLearnerProfile(auth) : null;
  return (
    <main className="inner-page courses-page">
      <section className="page-hero course-page-hero">
        <p className="eyebrow"><span /> Elivion Education courses</p>
        <h1>Learn by looking,<br />answering and revisiting.</h1>
        <p>Browse governed Elivion and institution-published imaging courses. Enrolments, workbooks and progress now connect directly to your personal learning space.</p>
        <div className="hero-actions"><Link className="primary-button" href={user ? "/my-learning" : "/join"}>{user ? "Open My Learning" : "Create learner profile"} <span>→</span></Link><Link className="text-button" href="/studio">Teach with Studio</Link></div>
      </section>
      <section className="catalogue-status"><div><span>{courses.length}</span><p>Published course {courses.length === 1 ? "release" : "releases"}</p></div><p>Catalogue entries are created from approved Studio releases. A published workbook does not become public until a separate course-release review is complete.</p></section>
      <CourseCatalogue courses={courses} profile={profile} />
      <section className="course-boundary"><b>Official, institutional and private courses remain clearly identified.</b><p>Institution-created content cannot be mistaken for Elivion-reviewed Atlas material. Public visibility is an explicit, reviewed release decision.</p></section>
    </main>
  );
}
