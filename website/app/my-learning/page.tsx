import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { listProgress } from "../../db/progress";
import { findAtlasModule, findCourse } from "../../lib/catalog";
import { getLearnerPortfolio } from "../../lib/platform-governance";
import { LearnerPortfolio } from "../../components/LearnerPortfolio";
import { BrowserAtlasResume } from "../../components/BrowserAtlasResume";
import { getLearnerEnrolments, getLearnerProfile } from "../../lib/education-platform";
import { courseDetailsHref, courseWorkbookHref, savedLearningHref } from "@/lib/saved-learning-navigation";
import { atlasLearningResources } from "../../lib/atlas-learning-resources";
import "../../components/learner-portfolio-navigation.css";
import { optionalLearningRead } from "../../lib/optional-learning-read";
import "./learning-availability.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My learning", description: "Your saved Visible Medicine Atlas modules and course progress." };

export default async function MyLearningPage() {
  const user = await requireChatGPTUser("/my-learning");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  const [progress, portfolio, profile, enrolments] = await Promise.all([
    optionalLearningRead(() => listProgress(user.userId)),
    optionalLearningRead(() => getLearnerPortfolio(auth)),
    optionalLearningRead(() => getLearnerProfile(auth)),
    optionalLearningRead(() => getLearnerEnrolments(auth)),
  ]);
  const resources = atlasLearningResources(progress ?? [], enrolments ?? []);
  const unavailable = [!progress && "saved learning", !portfolio && "notes, revision and completions", !profile && "profile", !enrolments && "courses"].filter(Boolean);
  return (
    <main className="inner-page learning-page">
      <section className="learning-heading"><div><p className="eyebrow"><span /> Personal learning space</p><h1>Your learning.</h1><p>Welcome back, {user.displayName}.</p></div><div className="learning-account-actions"><Link href={!profile || profile.onboardingStatus === "complete" ? "/onboarding" : "/join"}>{!profile ? "Profile" : profile.onboardingStatus === "complete" ? "Edit profile" : "Complete profile"}</Link><Link href="/account">Account &amp; data</Link><a href={chatGPTSignOutPath("/")}>Sign out</a></div></section>
      {unavailable.length > 0 && <aside className="learning-availability-notice" role="status"><strong>Some learning information could not load.</strong><p>Unavailable: {unavailable.join("; ")}. Loaded sections remain available.</p><a href="/my-learning">Reload learning page</a><small>Reloading retries these sections. Save open notes or revision drafts first.</small></aside>}
      <nav className="learning-subnav" aria-label="My Learning sections"><a href="#browser-atlas-resume">Atlas</a><a href="#courses">Courses</a><a href="#saved-learning">Saved</a>{portfolio ? <><a href="#notes">Notes</a><a href="#revision">Revision</a><a href="#completions">Completions</a></> : <a href="#portfolio-unavailable">Notes, revision &amp; completions</a>}</nav>
      <section className="learning-overview-metrics" aria-label="Learning overview"><div><span>Courses</span><b>{enrolments?.length ?? "Unavailable"}</b></div><div><span>Saved modules</span><b>{progress?.length ?? "Unavailable"}</b></div><div><span>Reviews</span><b>{portfolio ? <>{portfolio.reviews.length}{portfolio.reviewsNextCursor ? "+" : ""}</> : "Unavailable"}</b></div><div><span>Completions</span><b>{portfolio?.completions.length ?? "Unavailable"}</b></div></section>
      <BrowserAtlasResume />
      <section className="learning-grid" id="courses">
        <div className="learning-main"><div className="section-heading compact"><div><p className="section-index">Continue</p><h2>Your saved learning</h2></div></div>
          {!enrolments ? <div className="learning-availability-section"><h3>Courses unavailable</h3><p>Your course enrolments could not load.</p><Link href="/courses">Browse the course catalogue</Link></div> : enrolments.length ? <div className="enrolled-course-grid">{enrolments.map((course) => {
            const launchHref = courseWorkbookHref(course.slug, course.resumeWorkbookId) ?? courseWorkbookHref(course.slug, course.firstWorkbookId);
            const liveHref = courseWorkbookHref(course.slug, course.liveWorkbookId);
            const available = course.availableWorkbookCount;
            return <article className={`enrolled-course-card${liveHref ? " live" : ""}`} key={course.id}>
              {liveHref && <div className="course-live-status"><i aria-hidden="true" /><span><b>Live teaching now</b>{course.liveStartedAt ? `Started ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(course.liveStartedAt))}` : "An instructor is presenting"}</span></div>}
              <div className="course-card-copy"><span>{course.level} · {available} {available === 1 ? "workbook" : "workbooks"} available now</span><h3>{course.title}</h3><p>{course.summary}</p></div>
              {available > 0 && <div className="enrolled-progress"><span>Progress on available workbooks · <b>{course.availableProgress}%</b></span><i><b style={{ width: `${course.availableProgress}%` }} /></i></div>}
              <div>{liveHref ? <Link className="primary-button live-course-button" href={`${liveHref}?view=teaching&video=1`}>Join live classroom <span>→</span></Link> : launchHref ? <Link className="primary-button" href={launchHref}>{course.availableProgress ? "Resume latest workbook" : "Start course"} <span>→</span></Link> : <small>No workbooks available now</small>}{liveHref && launchHref && <Link href={launchHref}>Continue independently</Link>}<Link href={courseDetailsHref(course.slug) ?? "/courses"}>Course details</Link></div>
            </article>;
          })}</div> : <div className="runtime-resume-card"><div><span>Course catalogue</span><h3>No course enrolments yet</h3><p>Browse published Visible Medicine and institutional releases, then enrol through the access route chosen by the educator.</p></div><Link className="primary-button" href="/courses">Browse courses <span>→</span></Link></div>}
          <div id="saved-learning">{!progress ? <div className="learning-availability-section"><h3>Saved learning unavailable</h3><p>Your saved modules could not load.</p><Link href="/atlas">Browse the Atlas</Link></div> : progress.length ? progress.map((item) => {
            const resource = item.resourceType === "atlas" ? findAtlasModule(item.resourceSlug) : findCourse(item.resourceSlug);
            const enrolledCourse = item.resourceType === "course" ? enrolments?.find((course) => course.slug === item.resourceSlug) : null;
            const noAvailableWorkbooks = enrolledCourse?.availableWorkbookCount === 0;
            return <Link className="progress-card" href={savedLearningHref(item, { knownAtlas: item.resourceType === "atlas" && Boolean(resource), knownCourse: item.resourceType === "course" && Boolean(resource), enrolments: enrolments ?? [] })} key={`${item.resourceType}-${item.resourceSlug}`}><div><span>{item.resourceType}</span><h3>{resource?.title ?? item.resourceSlug}</h3><p>{noAvailableWorkbooks ? "No workbooks available now. View course details." : "Open learning resource"}</p></div><div className="progress-ring" style={{ "--progress": `${item.progress * 3.6}deg` } as React.CSSProperties}><b>{item.progress}%</b></div></Link>;
          }) : <div className="empty-learning"><span>◎</span><h3>No saved modules yet</h3><p>Explore an Atlas module or browse courses to get started. Saved resources appear here; exact scan steps remain in the viewer’s revision-bound study tools.</p><Link className="primary-button" href="/atlas/ct-head">Explore CT head <span>→</span></Link></div>}</div>
        </div>
        <aside className="learning-aside"><p className="section-index">Account status</p><h2>{!profile ? "Profile unavailable." : profile.onboardingStatus === "complete" ? "Your learning profile is ready." : "Complete your learner profile."}</h2><p>Visible Medicine stores education progress only. This account provides no clinical access and does not accept patient data.</p><div><span>Profile</span><b>{!profile ? "Unavailable" : profile.onboardingStatus === "complete" ? `${profile.trainingStage} · ${profile.discipline}` : "Setup required"}</b><span>Saved state</span><b>Education progress only</b></div><Link className="learning-trust-link" href="/trust">Read the account boundary →</Link></aside>
      </section>
      {portfolio ? <>{(!progress || !enrolments) && <p className="learning-availability-section">Some saved or enrolled resource choices are unavailable. Loaded notes, revision items and completions remain below.</p>}<LearnerPortfolio initialPortfolio={portfolio} resources={resources} /></> : <section className="learning-availability-section" id="portfolio-unavailable"><h2>Notes, revision and completions unavailable</h2><p>These records could not load. Reload the learning page to try again.</p></section>}
    </main>
  );
}
