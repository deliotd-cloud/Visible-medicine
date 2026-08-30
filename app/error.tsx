"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="inner-page route-error"><span>Visible Medicine</span><h1>This education view could not be prepared.</h1><p>No learner response or medical content was changed. Try the page again or return to your learning space.</p><div><button className="primary-button" onClick={reset}>Try again <span>→</span></button><Link className="outline-button" href="/my-learning">Open My Learning</Link></div></main>; }
