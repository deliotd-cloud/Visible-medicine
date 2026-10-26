import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {resolveHeadGuidedComparison} from '../../../../lib/head-guided-comparison.ts';
import {resolveHeadGuidedComparisonNavigation} from '../../../../lib/head-guided-comparison-navigation.ts';
import './compare.css';

export const metadata:Metadata={title:'Compare head views',description:'Draft guided comparison of exact mapped head views for education.',robots:{index:false,follow:false}};

export default async function HeadGuidedComparisonPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams;
  const activity=resolveHeadGuidedComparison(query);
  if(!activity)notFound();
  const steps=resolveHeadGuidedComparisonNavigation(query);
  return <main className="head-compare-page">
    <div className="head-compare-shell">
      <nav aria-label="Guided learning return"><a href="/atlas/guided-learning">← Back to linked tours</a></nav>
      <header><span className="head-compare-kicker">Visible Medicine · Draft activity</span><h1>Compare views: {activity.label}</h1><p>{activity.sequence.label} · Step {activity.position.index+1} of {activity.sequence.total}</p></header>
      {steps&&<nav className="head-compare-steps" aria-label="Compare tour steps">
        {steps.previous?<a href={steps.previous.href} aria-label={`Previous structure: ${steps.previous.label}, step ${steps.previous.step} of ${steps.previous.total}`}><span>← Previous structure</span><strong>{steps.previous.label}</strong></a>:<span className="head-compare-boundary">{steps.atStart?'Start of tour':'Previous comparison unavailable'}</span>}
        {steps.next?<a href={steps.next.href} aria-label={`Next structure: ${steps.next.label}, step ${steps.next.step} of ${steps.next.total}`}><span>Next structure →</span><strong>{steps.next.label}</strong></a>:<span className="head-compare-boundary">{steps.atEnd?'End of tour':'Next comparison unavailable'}</span>}
      </nav>}
      <section aria-labelledby="head-compare-how"><h2 id="head-compare-how">Study across views</h2><p>Open each mapped view in a separate tab. Find the named structure, then compare what each view makes visible. Return here to reflect. These views show separate, unregistered subjects; positions and boundaries do not align patient to patient.</p></section>
      <section aria-labelledby="head-compare-views"><h2 id="head-compare-views">Available views</h2><div className="head-compare-grid">{activity.availableViews.map(view=><article key={view.name} className="head-compare-card"><h3>{view.name}</h3><p>Exact mapped source view for this tour step.</p><a href={view.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${activity.label} in ${view.name} (opens in a new tab)`}>Open {view.name} ↗</a></article>)}</div></section>
      <section aria-labelledby="head-compare-reflect"><h2 id="head-compare-reflect">Reflect as you compare</h2><ul><li>What features let you identify the same named structure in each view?</li><li>What can you see clearly in one view that is less clear in another?</li><li>Where does partial coverage or a different subject limit the comparison?</li></ul><p>Use these prompts for your own study. This activity does not record answers, scores or progress.</p></section>
      <details><summary>Source and access limitations</summary><p>{activity.scopeNote}</p><p>Source revision: <code>{activity.sourceRevision}</code>. This identifies the mapped source; it is not clinical approval or a complete coverage claim. Local masks are checked by each destination when opened. Each destination applies its own access rules. No scan, image or 3D view loads on this page.</p></details>
    </div>
  </main>;
}
