import type { Metadata } from "next";
import Link from "next/link";
import { courses } from "../../lib/catalog";

export const metadata: Metadata = { title: "Courses", description: "Official and institutional radiology and pathology learning in Elivion Education." };

export default function CoursesPage() {
  return (
    <main className="inner-page courses-page">
      <section className="page-hero course-page-hero">
        <p className="eyebrow"><span /> Elivion Education courses</p>
        <h1>Learn by looking,<br />answering and revisiting.</h1>
        <p>Follow official Elivion courses or join a private institutional workbook. Every course keeps its imaging, questions and results inside the education boundary.</p>
      </section>
      <section className="course-catalogue">
        {courses.map((course, index) => (
          <Link className="large-course-card" href={`/courses/${course.slug}`} key={course.slug}>
            <div className="course-card-top"><span>0{index + 1}</span><small>{course.type === "official" ? "Official course" : "Institution demonstration"}</small></div>
            <h2>{course.title}</h2><p>{course.summary}</p>
            <div className="course-card-footer"><span>{course.level}</span><span>{course.lessons} lessons</span><span>{course.duration}</span><b>View course ↗</b></div>
          </Link>
        ))}
        <Link className="large-course-card host-card" href="/studio">
          <div className="course-card-top"><span>+</span><small>For educators</small></div>
          <h2>Build and host your own imaging course</h2><p>Author radiology or pathology workbooks, link Atlas scenes, teach live and assess learners through Elivion Studio.</p>
          <div className="course-card-footer"><span>Private publishing</span><span>Live teaching</span><span>Assessments</span><b>Explore Studio ↗</b></div>
        </Link>
      </section>
      <section className="course-boundary"><b>Official, institutional and private courses remain clearly identified.</b><p>Institution-created content cannot be mistaken for Elivion-reviewed Atlas material. Open public publishing is deliberately outside the initial release.</p></section>
    </main>
  );
}
