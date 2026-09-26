import { Brand } from '../../brand';
import Link from 'next/link';
import {
  clinicalReviewEntries,
  clinicalReviewScopes,
  clinicalReviewHref,
  findClinicalReviewEntries,
} from '@/lib/clinical-review-index';
import renderer from '@/content/body-renderer-revision.json';
import { ClinicalReviewResults } from './results';
import './overview.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clinical Review | Visible Medicine' };

export default async function ClinicalReviewPage({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; scope?: string | string[]; page?: string | string[] }>;
}) {
  const result = findClinicalReviewEntries(await searchParams);
  return (
    <div className="clinical-review">
      <a className="clinical-review-skip" href="#review-results">Skip to review selections</a>
      <header className="clinical-review-header">
        <Brand />
        <Link href="/">Back to Atlas</Link>
      </header>
      <main className="clinical-review-main">
        <div className="clinical-review-heading">
          <p className="clinical-review-eyebrow">Visible Medicine · reviewer workspace</p>
          <h1>Clinical review</h1>
          <p>Find a structure, open its review workspace, then record your decision for the exact material shown.</p>
        </div>
        <aside className="clinical-review-notice" aria-label="Review scope">
          This index lists reviewable selections, not pending approvals. Your saved status is loaded privately; open a workspace to record or change a decision.
          This source Atlas may be newer than the published website; approvals do not transfer between revisions or models.
        </aside>
        <nav className="clinical-review-scopes" aria-label="Review areas">
          {clinicalReviewScopes.map(scope => (
            <Link key={scope.id} href={clinicalReviewHref({ q: '', scope: scope.id, page: 1 })}
              aria-current={result.scope === scope.id ? 'page' : undefined}>
              <strong>{scope.label}</strong>
              <span>{scope.description}</span>
              <small>{clinicalReviewEntries.filter(entry => entry.scope === scope.id).length.toLocaleString()} review selections</small>
            </Link>
          ))}
        </nav>
        <p><Link href="/review/candidates/skin">Inspect the skin candidate (read-only)</Link> — separate from approval-ready selections.</p>
        <search aria-label="Find review material">
        <form action="/review/overview" method="get" className="clinical-review-search">
          <div>
            <label htmlFor="clinical-review-query">Find anatomy</label>
            <input id="clinical-review-query" name="q" type="search" defaultValue={result.q}
              maxLength={160} placeholder="Name, side or anatomical ID" />
          </div>
          <div>
            <label htmlFor="clinical-review-scope">Review area</label>
            <select id="clinical-review-scope" name="scope" defaultValue={result.scope}>
              <option value="all">All review areas</option>
              {clinicalReviewScopes.map(scope => <option key={scope.id} value={scope.id}>{scope.label}</option>)}
            </select>
          </div>
          <button type="submit">Search</button>
          <Link href="/review/overview">Clear</Link>
        </form>
        </search>
        <section id="review-results" aria-labelledby="review-results-heading" tabIndex={-1}>
          <div className="clinical-review-results-heading">
            <h2 id="review-results-heading">{result.total.toLocaleString()} matching selections</h2>
            <span>Separate models remain separate reviews</span>
          </div>
          {result.entries.length ? <ClinicalReviewResults key={clinicalReviewHref(result)} entries={result.entries}
            query={clinicalReviewHref(result).slice('/review/overview'.length)} />
            : <p className="clinical-review-empty">No matches. Try a shorter name, an anatomical ID or another review area.</p>}
          {result.pageCount > 1 && <nav className="clinical-review-pagination" aria-label="Review results pages">
            {result.page > 1 ? <Link href={`${clinicalReviewHref({ ...result, page: result.page - 1 })}#review-results`}>Previous</Link> : <span aria-disabled="true">Previous</span>}
            <span>Page {result.page} of {result.pageCount}</span>
            {result.page < result.pageCount ? <Link href={`${clinicalReviewHref({ ...result, page: result.page + 1 })}#review-results`}>Next</Link> : <span aria-disabled="true">Next</span>}
          </nav>}
        </section>
        <details className="clinical-review-guide">
          <summary>How sign-off works</summary>
          <ol>
            <li>Open the exact structure and source model. Sign in to its review workspace to load your private saved decisions.</li>
            <li>Review 3D anatomy and teaching separately. Record corrections and evidence; approve only the scope you have checked.</li>
            <li>Save or discard edits before switching workspaces. Changed material requires revision-specific re-review.</li>
            <li>CT/MRI/X-ray/ultrasound wording is not acquired-image approval. Cleared images, validated mapping and separate case rights are required.</li>
          </ol>
          <p>Detailed anatomy uses its exact parent and source; independent specimens do not inherit whole-body approval. The interactive question bank also needs separate review.</p>
          <p className="clinical-review-revision">Source renderer fingerprint: <code>{renderer.sha256}</code>. This is not a deployment receipt or clinical approval.</p>
        </details>
      </main>
    </div>
  );
}
