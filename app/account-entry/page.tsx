import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in or create an account",
  description: "Access your Visible Medicine education account.",
  robots: { index: false, follow: false },
};

export default async function AccountEntryPage() {
  if (await getChatGPTUser()) redirect("/my-learning");
  return (
    <main className="inner-page onboarding-page account-entry-page">
      <section className="onboarding-hero compact">
        <div>
          <p className="eyebrow"><span /> Visible Medicine account</p>
          <h1>Your learning starts here.</h1>
          <p>Use one education-only identity for courses, progress, notes and completion records. This account never grants access to clinical Didanix systems.</p>
        </div>
      </section>
      <section className="account-entry-grid" aria-label="Account options">
        <article>
          <span>New learner</span>
          <h2>Create your learner account</h2>
          <p>Sign in securely, accept the education terms and privacy notice, then choose your learning interests.</p>
          <Link className="primary-button" href={chatGPTSignInPath("/join")}>Create learner account <span>→</span></Link>
        </article>
        <article>
          <span>Returning learner or educator</span>
          <h2>Continue to your workspace</h2>
          <p>Resume enrolled courses or open the workspace associated with your institution role.</p>
          <Link className="outline-button" href={chatGPTSignInPath("/my-learning")}>Sign in <span>→</span></Link>
        </article>
      </section>
      <p className="account-entry-note">Authentication is provided by the private hosting identity during evaluation. No password is stored by Visible Medicine.</p>
    </main>
  );
}
