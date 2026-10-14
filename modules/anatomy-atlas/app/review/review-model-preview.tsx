'use client';

import { useState } from 'react';
import './review-model-preview.css';

/** The caller supplies its verified worksheet link, never a guessed model ID.
 * The website importer adapts that link to the existing authenticated inspector. */
export function ReviewModelPreview({ href, name, revision }: {
  href: string | null;
  name: string;
  revision: string;
}) {
  const [visible, setVisible] = useState(true);
  const local = !!href && href.startsWith('/') && !href.startsWith('//') && !/[\\\u0000-\u0020]/.test(href);
  return <aside className="review-visual" aria-label={`${name} model inspection`}>
    <header><strong>Inspect anatomy</strong>
      {local && <button type="button" aria-expanded={visible} onClick={() => setVisible(value => !value)}>
        {visible ? 'Hide model' : 'Show model'}
      </button>}
    </header>
    <p><strong>Worksheet: {name}</strong><br />Model selection changes inspection only; this worksheet stays on {name}. Inspection does not record approval.</p>
    <details><summary>Worksheet revision</summary><code>{revision}</code></details>
    {local ? <>
      {visible && <iframe key={`${revision}:${href}`} title={`${name} · review model`} src={href!} loading="lazy" allowFullScreen />}
      <a href={href!} target="_blank" rel="noopener noreferrer">Open larger model ↗</a>
    </> : <p>No source-bound model is available for this worksheet.</p>}
  </aside>;
}
