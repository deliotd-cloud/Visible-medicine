import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import { LearnerOnboardingForm } from "@/components/LearnerOnboardingForm";
import { getLearnerProfile } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join", description: "Create your education-only Visible Medicine learner profile and join available imaging courses.", robots: { index: false, follow: false } };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const course = (await searchParams).course?.replace(/[^a-z0-9-]/g, "") ?? "";
  const returnTo = course ? `/courses/${course}` : "/my-learning";
  const user = await getChatGPTUser();
  return <main className="inner-page onboarding-page">
    <section className="onboarding-hero"><div><p className="eyebrow"><span /> Visible Medicine learner account</p><h1>Learn imaging with a profile that stays educational.</h1><p>Create a personal learning space for course enrolments, saved progress, review notes and completion records. It never grants access to clinical Didanix.</p></div><div className="account-boundary-card"><span>Account boundary</span><b>Education identity only</b><p>No PACS access · no patient records · no clinical reporting · no diagnostic use</p></div></section>
    {user ? <section className="onboarding-shell"><header><span>Signed in as</span><h2>{user.displayName}</h2><p>{user.email}</p></header><LearnerOnboardingForm profile={await getLearnerProfile({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName })} returnTo={returnTo} /></section> : <section className="join-signin"><p className="section-index">Secure sign-in</p><h2>Start your learner profile.</h2><p>The private preview uses the hosting platform’s authenticated identity. Visible Medicine’s production education identity adapter will replace it before external launch.</p><Link className="primary-button" href={chatGPTSignInPath(`/join${course ? `?course=${course}` : ""}`)}>Sign in to continue <span>→</span></Link></section>}
  </main>;
}
