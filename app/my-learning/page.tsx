import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { listProgress } from "../../db/progress";
import { findAtlasModule, findCourse } from "../../lib/catalog";
import { getLearnerPortfolio } from "../../lib/platform-governance";
import { LearnerPortfolio } from "../../components/LearnerPortfolio";
import { getLearnerEnrolments, getLearnerProfile } from "../../lib/education-platform";
import { liveClassroomHref } from "@/lib/live-classroom-links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My learning", description: "Your saved Visible Medicine Atlas modules and course progress." };

export default async function MyLearningPage() {
  const user = await requireChatGPTUser("/my-learning");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  const [progress, portfolio, profile, enrolments] = await Promise.all([
    listProgress(user.userId),
    getLearnerPortfolio(auth),
    getLearnerProfile(auth),
    getLearnerEnrolments(auth),
  ]);
  const resources = new Map<string, { resourceType: "atlas" | "course"; resourceId: string; label: string }>();
  resources.set("atlas:ct-head", { resourceType: "atlas", resourceId: "ct-head", label: "Atlas · CT head" });
  for (const item of progress) {
    if (item.resourceType !== "atlas" && item.resourceType !== "course") continue;
    const resource = item.resourceType === "atlas" ? findAtlasModule(item.resourceSlug) : findCourse(item.resourceSlug);
    resources.set(`${item.resourceType}:${item.resourceSlug}`, { resourceType: item.resourceType, resourceId: item.resourceSlug, label: `${item.resourceType === "atlas" ? "Atlas" : "Course"} · ${resource?.title ?? item.resourceSlug}` });
  }
  for (const course of enrolments) resources.set(`course:${course.slug}`, { resourceType: "course", resourceId: course.slug, label: `Course · ${course.title}` });
  return (
    <main className="inner-page learning-page">
      <section className="learning-heading"><div><p className="eyebrow"><span /> Personal learning space</p><h1>Your learning.</h1><p>Welcome back, {user.displayName}.</p></div><div className="learning-account-actions"><Link href={profile.onboardingStatus === "complete" ? "/onboarding" : "/join"}>{profile.onboardingStatus === "complete" ? "Edit profile" : "Complete profile"}</Link><Link href="/account">Account &amp; data</Link><a href={chatGPTSignOutPath("/")}>Sign out</a></div></section>
      <nav className="learning-subnav" aria-label="My Learning sections"><a href="#courses">Courses</a><a href="#saved-learning">Saved</a><a href="#learning-record">Review &amp; notes</a><a href="#learning-record">Certificates</a></nav>
      <section className="learning-overview-metrics" aria-label="Learning overview"><div><span>Courses</span><b>{enrolments.length}</b></div><div><span>Saved modules</span><b>{progress.length}</b></div><div><span>Reviews</span><b>{portfolio.reviews.length}</b></div><div><span>Completions</span><b>{portfolio.completions.length}</b></div></section>
      <section className="learning-grid" id="courses">
        <div className="learning-main"><div className="section-heading compact"><div><p className="section-index">Continue</p><h2>Your saved learning</h2></div></div>
          {enrolments.length ? <div className="enrolled-course-grid">{enrolments.map((course) => { const launchWorkbookId = course.resumeWorkbookId ?? course.firstWorkbookId; return <article className={`enrolled-course-card${course.liveWorkbookId ? " live" : ""}`} key={course.id}>{course.liveWorkbookId && <div className="course-live-status"><i aria-hidden="true" /><span><b>Live teaching now</b>{course.liveStartedAt ? `Started ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(course.liveStartedAt))}` : "An instructor is presenting"}</span></div>}<div className="course-card-copy"><span>{course.level} · {course.workbookCount} {course.workbookCount === 1 ? "workbook" : "workbooks"}</span><h3>{course.title}</h3><p>{course.summary}</p></div><div className="enrolled-progress"><span><b>{course.progress}%</b> complete</span><i><b style={{ width: `${course.progress}%` }} /></i></div><div>{course.liveWorkbookId ? <Link className="primary-button live-course-button" href={liveClassroomHref(course.slug, course.liveWorkbookId)}>Join live classroom <span>→</span></Link> : launchWorkbookId ? <Link className="primary-button" href={`/learn/${course.slug}/${encodeURIComponent(launchWorkbookId)}`}>{course.progress ? "Resume latest workbook" : "Start course"} <span>→</span></Link> : <small>Workbook allocation pending</small>}{course.liveWorkbookId && launchWorkbookId && <Link href={`/learn/${course.slug}/${encodeURIComponent(launchWorkbookId)}`}>Continue independently</Link>}<Link href={`/courses/${course.slug}`}>Course details</Link></div></article>; })}</div> : <div className="runtime-resume-card"><div><span>Course catalogue</span><h3>No course enrolments yet</h3><p>Browse published Visible Medicine and institutional releases, then enrol through the access route chosen by the educator.</p></div><Link className="primary-button" href="/courses">Browse courses <span>→</span></Link></div>}
          <div id="saved-learning">{progress.length ? progress.map((item) => {
            const resource = item.resourceType === "atlas" ? findAtlasModule(item.resourceSlug) : findCourse(item.resourceSlug);
            return <Link className="progress-card" href={item.resourceType === "atlas" ? `/atlas/${item.resourceSlug}` : "/courses"} key={`${item.resourceType}-${item.resourceSlug}`}><div><span>{item.resourceType}</span><h3>{resource?.title ?? item.resourceSlug}</h3><p>Last position {item.lastPosition}</p></div><div className="progress-ring" style={{ "--progress": `${item.progress * 3.6}deg` } as React.CSSProperties}><b>{item.progress}%</b></div></Link>;
          }) : <div className="empty-learning"><span>◎</span><h3>No saved modules yet</h3><p>Open the CT head demonstration and choose “Save position” to begin your learning history.</p><Link className="primary-button" href="/atlas/ct-head">Explore CT head <span>→</span></Link></div>}</div>
        </div>
        <aside className="learning-aside"><p className="section-index">Account status</p><h2>{profile.onboardingStatus === "complete" ? "Your learning profile is ready." : "Complete your learner profile."}</h2><p>Visible Medicine stores education progress only. This account provides no clinical access and does not accept patient data.</p><div><span>Profile</span><b>{profile.onboardingStatus === "complete" ? `${profile.trainingStage} · ${profile.discipline}` : "Setup required"}</b><span>Saved state</span><b>Education progress only</b></div><Link className="learning-trust-link" href="/trust">Read the account boundary →</Link></aside>
      </section>
      <LearnerPortfolio initialPortfolio={portfolio} resources={[...resources.values()]} />
    </main>
  );
}
