"use client";

import Link from "next/link";

export default function StudioError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="not-found"><p className="section-index">Studio access</p><h1>This workspace needs an educator role.</h1><p>If you were invited by an institution, accept that invitation using the same email address. Learner accounts can continue from My Learning.</p><div className="hero-actions"><Link className="primary-button" href="/my-learning">Open My Learning <span>→</span></Link><button className="outline-button" onClick={reset}>Try again</button></div></main>;
}
