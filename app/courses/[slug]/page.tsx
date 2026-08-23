import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCourse } from "../../../lib/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = findCourse((await params).slug);
  if (!course) return {};
  return { title: course.title, description: course.summary, openGraph: { title: course.title, description: course.summary, images: [] }, twitter: { title: course.title, description: course.summary, images: [] } };
}

export default async function CourseDetail({ params }: PageProps) {
  const course = findCourse((await params).slug);
  if (!course) notFound();
  return (
    <main className="inner-page course-detail">
      <section className="course-detail-hero">
        <div><p className="eyebrow"><span /> {course.type === "official" ? "Didanix official course" : "Institution demonstration"}</p><h1>{course.title}</h1><p>{course.summary}</p><div className="module-facts"><span>{course.level}</span><span>{course.lessons} lessons</span><span>{course.duration}</span><span>{course.publisher}</span></div></div>
        <div className="course-launch-card"><span>Course preview</span><b>Begin with normal anatomy</b><p>Launches the linked atlas module at the first guided scene.</p><a className="primary-button" href={`/atlas/${course.moduleSlug}`}>Start course <span>→</span></a></div>
      </section>
      <section className="course-detail-grid">
        <div><p className="section-index">Learning outcomes</p><h2>What you will be able to do</h2><ol>{course.outcomes.map((outcome, index) => <li key={outcome}><span>0{index + 1}</span>{outcome}</li>)}</ol></div>
        <div className="lesson-plan"><p className="section-index">Course map</p>{["Orientation and windows", "Surface and skull landmarks", "Ventricles and deep grey nuclei", "Cisterns and compartments", "Image-based practice", "Review and next steps"].slice(0, course.lessons).map((lesson, index) => <div key={lesson}><span>{String(index + 1).padStart(2, "0")}</span><b>{lesson}</b><small>{index === 0 ? "Atlas scene + guided explanation" : "Saved scenes + knowledge check"}</small></div>)}</div>
      </section>
      <section className="course-platform-note"><p className="section-index">Didanix Education</p><h2>Courses are a separate learning domain.</h2><p>Course enrolments, attempts, answers and educator workflows remain separate from the Atlas editorial database and from every clinical Didanix environment.</p><a href="/teach">How course hosting works →</a></section>
    </main>
  );
}
