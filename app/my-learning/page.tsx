import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { listProgress } from "../../db/progress";
import { findAtlasModule, findCourse } from "../../lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My learning", description: "Your saved Elivion Atlas modules and course progress." };

export default async function MyLearningPage() {
  const user = await requireChatGPTUser("/my-learning");
  const progress = await listProgress(user.userId);
  return (
    <main className="inner-page learning-page">
      <section className="learning-heading"><div><p className="eyebrow"><span /> Personal learning space</p><h1>Welcome back.</h1><p>{user.displayName}</p></div><a href={chatGPTSignOutPath("/")}>Sign out</a></section>
      <section className="learning-grid">
        <div className="learning-main"><div className="section-heading compact"><div><p className="section-index">Continue</p><h2>Your saved learning</h2></div></div>
          {progress.length ? progress.map((item) => {
            const resource = item.resourceType === "atlas" ? findAtlasModule(item.resourceSlug) : findCourse(item.resourceSlug);
            return <Link className="progress-card" href={`/${item.resourceType === "atlas" ? "atlas" : "courses"}/${item.resourceSlug}`} key={`${item.resourceType}-${item.resourceSlug}`}><div><span>{item.resourceType}</span><h3>{resource?.title ?? item.resourceSlug}</h3><p>Last position {item.lastPosition}</p></div><div className="progress-ring" style={{ "--progress": `${item.progress * 3.6}deg` } as React.CSSProperties}><b>{item.progress}%</b></div></Link>;
          }) : <div className="empty-learning"><span>◎</span><h3>No saved modules yet</h3><p>Open the CT head demonstration and choose “Save position” to begin your learning history.</p><Link className="primary-button" href="/atlas/ct-head">Explore CT head <span>→</span></Link></div>}
        </div>
        <aside className="learning-aside"><p className="section-index">Account boundary</p><h2>Your learner identity is not a clinical identity.</h2><p>This private preview uses the hosting platform’s sign-in. A production Elivion Education identity provider will replace this adapter before external launch.</p><div><span>Saved state</span><b>Atlas and course progress only</b><span>Clinical access</span><b>None</b><span>Patient data</span><b>Not accepted</b></div></aside>
      </section>
    </main>
  );
}
