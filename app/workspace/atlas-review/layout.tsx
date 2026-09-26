import type { ReactNode } from 'react';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import { ClinicalReviewAccessError } from '@/lib/clinical-review-access';
import './website-review.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function ClinicalReviewLayout({ children }: { children: ReactNode }) {
  try { await authorizeClinicalReview(); }
  catch (error) {
    const known = error instanceof ClinicalReviewAccessError;
    return <main className="inner-page"><h1>Clinical Review</h1>
      <p role="alert">{known ? error.message : 'Clinical Review is temporarily unavailable.'}</p>
      {known && error.status === 401 && <a href={chatGPTSignInPath('/workspace/atlas-review')} target="_top">Sign in with ChatGPT</a>}
      <p><a href="/workspace">Return to workspace</a></p></main>;
  }
  return <section className="website-clinical-review">
    <p className="review-account-scope">Personal reviews within your authorized institution. Saved decisions do not publish content or grant institution sign-off.</p>
    {children}
  </section>;
}
