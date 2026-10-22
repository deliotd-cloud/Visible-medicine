/** Generic loading only: no records, approvals, account details or side effects. */
export default function ClinicalReviewLoading() {
  return <main className="inner-page">
    <div role="status" aria-live="polite" aria-busy="true">
      <h1>Opening Clinical Review…</h1>
      <p>The protected workspace is still opening.</p>
    </div>
    <p>If this screen persists, <a href="/workspace/clinical-review-inbox" target="_blank" rel="noopener noreferrer">open the Review inbox in another tab ↗</a>.</p>
    <p>Keep the original tab open if it may contain unsaved notes. This screen does not reload or discard an existing review.</p>
  </main>;
}
