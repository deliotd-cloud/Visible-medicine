import type { Metadata } from "next";
import { courses } from "../../lib/catalog";

export const metadata: Metadata = { title: "Courses", description: "Guided radiology and pathology learning powered by Didanix Education." };

export default function CoursesPage() {
  return (
    <main className="inner-page courses-page">
      <section className="page-hero course-page-hero">
        <p className="eyebrow"><span /> Powered by Didanix Education</p>
        <h1>Learn by looking,<br />answering and revisiting.</h1>
        <p>Follow official Didanix courses or join a private institutional workbook. Every course keeps its imaging, questions and results inside the education boundary.</p>
      </section>
      <section className="course-catalogue">
        {courses.map((course, index) => (
          <a className="large-course-card" href={`/courses/${course.slug}`} key={course.slug}>
            <div className="course-card-top"><span>0{index + 1}</span><small>{course.type === "official" ? "Official course" : "Institution demonstration"}</small></div>
            <h2>{course.title}</h2><p>{course.summary}</p>
            <div className="course-card-footer"><span>{course.level}</span><span>{course.lessons} lessons</span><span>{course.duration}</span><b>View course ↗</b></div>
          </a>
        ))}
        <a className="large-course-card host-card" href="/teach">
          <div className="course-card-top"><span>+</span><small>For educators</small></div>
          <h2>Build and host your own imaging course</h2><p>Author radiology or pathology workbooks, link atlas scenes, teach live and assess learners through Didanix Education.</p>
          <div className="course-card-footer"><span>Private publishing</span><span>Live teaching</span><span>Assessments</span><b>Explore Studio ↗</b></div>
        </a>
      </section>
      <section className="course-boundary"><b>Official, institutional and private courses remain clearly identified.</b><p>Third-party content cannot be mistaken for Didanix-reviewed atlas material. Open public publishing is deliberately outside this initial release.</p></section>
    </main>
  );
}
