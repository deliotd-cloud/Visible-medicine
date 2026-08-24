import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { LearnerOnboardingForm } from "@/components/LearnerOnboardingForm";
import { getLearnerProfile } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learner profile", description: "Set up your Elivion Education learner profile.", robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const user = await requireChatGPTUser("/onboarding");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  return <main className="inner-page onboarding-page"><section className="onboarding-hero compact"><div><p className="eyebrow"><span /> Account settings</p><h1>Your learner profile.</h1><p>Personalise course discovery and keep your education identity separate from every clinical Elivion and Didanix product.</p></div></section><section className="onboarding-shell"><header><span>Education account</span><h2>{user.displayName}</h2><p>{user.email}</p></header><LearnerOnboardingForm profile={await getLearnerProfile(auth)} /></section></main>;
}
