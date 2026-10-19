import { EducationRuntime } from "@/components/EducationRuntime";
import "../runtime.css";
import "./workspace.css";
import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import { ClinicalReviewAccessError } from '@/lib/clinical-review-access';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fracture review | Didanix Education', robots: { index: false, follow: false }, openGraph: { images: [] }, twitter: { images: [] } };

export default async function FractureReviewPage() {
  try { await authorizeClinicalReview(); }
  catch (error) {
    const known = error instanceof ClinicalReviewAccessError;
    return <main className="inner-page"><h1>Fracture review</h1><p role="alert">{known ? error.message : 'Private review is temporarily unavailable.'}</p>
      {known && error.status === 401 && <a href={chatGPTSignInPath('/learn/fracture-review')} target="_top">Sign in with ChatGPT</a>}
      <p><a href="/workspace">Return to workspace</a></p></main>;
  }
  return <EducationRuntime accessMode="fracture-review" />;
}
