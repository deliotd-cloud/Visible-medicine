import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getChatGPTUser } from "../../chatgpt-auth";
import { CourseEnrolmentControl } from "@/components/CourseEnrolmentControl";
import { CourseProgressControl } from "@/components/CourseProgressControl";
import { getCatalogueCourse } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await getCatalogueCourse((await params).slug);
  if (!course) return {};
  return { title: course.title, description: course.summary, openGraph: { title: `${course.title} | Elivion Education`, description: course.summary, images: [] }, twitter: { title: `${course.title} | Elivion Education`, description: course.summary, images: [] } };
}

function accessDescription(accessModel: string, priceMinor: number, currency: string) {
  if (accessModel === "free") return "Free self-enrolment";
  if (accessModel === "invitation") return "Course invitation required";
  if (accessModel === "institution") return "Active institution membership required";
  return `${new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(priceMinor / 100)} · checkout activates after private evaluation`;
}

export default async function CourseDetail({ params }: PageProps) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  const auth = user ? { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName } : null;
  const course = await getCatalogueCourse(slug, auth);
  if (!course) notFound();
  return (
    <main className="inner-page course-detail">
      <section className="course-detail-hero">
        <div><p className="eyebrow"><span /> {course.publisherKind === "official" ? "Elivion official course" : "Institution-published course"}</p><h1>{course.title}</h1><p>{course.summary}</p><div className="module-facts"><span>{course.level}</span><span>{course.workbookCount} {course.workbookCount === 1 ? "workbook" : "workbooks"}</span><span>{course.duration}</span><span>{course.publisher}</span></div></div>
        <div className="course-launch-card"><span>{course.enrolled ? "Your course" : "Course enrolment"}</span><b>{accessDescription(course.accessModel, course.priceMinor, course.currency)}</b><p>{course.enrolled ? "Continue in the course-specific teaching workspace. Your allocated workbooks and progress are also available from My Learning." : "Create an education-only learner profile, then enrol through the access route chosen by the publisher."}</p><CourseEnrolmentControl releaseId={course.id} slug={course.slug} accessModel={course.accessModel} enrolled={course.enrolled} firstWorkbookId={course.firstWorkbookId} signedIn={Boolean(user)} enrolmentOpen={course.enrolmentOpen} />{course.enrolled && <CourseProgressControl courseSlug={course.slug} />}</div>
      </section>
      <section className="course-detail-grid">
        <div><p className="section-index">Learning outcomes</p><h2>What you will be able to do</h2><ol>{course.outcomes.map((outcome, index) => <li key={outcome}><span>{String(index + 1).padStart(2, "0")}</span>{outcome}</li>)}</ol></div>
        <div className="release-facts"><p className="section-index">Governed release</p><h2>Know who published what.</h2><dl><div><dt>Publisher</dt><dd>{course.publisher}</dd></div><div><dt>Release</dt><dd>Version {course.version}</dd></div><div><dt>Visibility</dt><dd>{course.visibility}</dd></div><div><dt>Access</dt><dd>{course.accessModel}</dd></div></dl><Link href="/trust">Read the education trust model →</Link></div>
      </section>
      <section className="course-platform-note"><p className="section-index">Elivion Education</p><h2>Courses remain a separate learning domain.</h2><p>Course enrolments, attempts, answers and educator workflows remain separate from the Atlas editorial database and every clinical Didanix environment.</p><Link href="/studio">How course hosting works →</Link></section>
    </main>
  );
}
