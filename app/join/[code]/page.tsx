import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { CourseEnrolmentControl } from "@/components/CourseEnrolmentControl";
import { LearnerOnboardingForm } from "@/components/LearnerOnboardingForm";
import { getInvitationCourse, getLearnerProfile } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course invitation", description: "Accept a controlled Visible Medicine course invitation.", robots: { index: false, follow: false } };

export default async function CourseInvitationPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const user = await getChatGPTUser();
  const auth = user ? { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName } : null;
  const course = await getInvitationCourse(code, auth); if (!course) notFound();
  const profile = auth ? await getLearnerProfile(auth) : null;
  return <main className="inner-page invitation-page"><section className="invitation-hero"><div><p className="eyebrow"><span /> Controlled course invitation</p><h1>{course.title}</h1><p>{course.summary}</p><div className="module-facts"><span>{course.publisher}</span><span>{course.level}</span><span>{course.duration}</span><span>{course.workbookCount} workbooks</span></div></div><aside><span>Invitation verified</span><b>Education access only</b><p>This invitation cannot grant clinical Didanix access or expose patient data.</p></aside></section>
    {!user ? <section className="join-signin"><h2>Sign in to accept this invitation.</h2><p>Your invitation remains tied to this controlled course release.</p><Link className="primary-button" href={chatGPTSignInPath(`/join/${code}`)}>Sign in to continue <span>→</span></Link></section> : profile?.onboardingStatus !== "complete" ? <section className="onboarding-shell"><header><span>Complete your profile</span><h2>{user.displayName}</h2><p>One education-only profile is used across your courses.</p></header><LearnerOnboardingForm profile={profile!} returnTo={`/join/${code}`} /></section> : <section className="invitation-accept"><div><p className="section-index">Ready to join</p><h2>{user.displayName}</h2><p>The publisher will be recorded alongside this release, and its published workbooks will appear in My Learning.</p></div><CourseEnrolmentControl releaseId={course.id} slug={course.slug} accessModel="invitation" enrolled={course.enrolled} firstWorkbookId={course.firstWorkbookId} signedIn enrolmentOpen={course.enrolmentOpen} invitationCode={code} /></section>}
  </main>;
}
