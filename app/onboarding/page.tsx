import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { LearnerOnboardingForm } from "@/components/LearnerOnboardingForm";
import { getLearnerProfile } from "@/lib/education-platform";
import { safeReturnPath } from "@/lib/pilot-readiness";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learner profile", description: "Set up your Visible Medicine learner profile.", robots: { index: false, follow: false } };

export default function OnboardingPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  return <OnboardingContent searchParams={searchParams} />;
}

async function OnboardingContent({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = safeReturnPath((await searchParams).returnTo, "/my-learning");
  const protectedReturn = `/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
  const user = await requireChatGPTUser(protectedReturn);
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  return <main className="inner-page onboarding-page"><section className="onboarding-hero compact"><div><p className="eyebrow"><span /> Account settings</p><h1>Your learner profile.</h1><p>Personalise course discovery and keep your education identity separate from every Elivion clinical product—including Didanix.</p></div></section><section className="onboarding-shell"><header><span>Education account</span><h2>{user.displayName}</h2><p>{user.email}</p></header><LearnerOnboardingForm profile={await getLearnerProfile(auth)} returnTo={returnTo} /></section></main>;
}
