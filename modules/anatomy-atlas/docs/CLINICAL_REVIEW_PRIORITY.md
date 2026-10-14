# Private review change reasons

The existing `getClinicalReviewQueue` status response, request parameters,
identity boundary and read-only storage behavior are unchanged. Trusted website
code may call `getClinicalReviewQueueWithReasons`; there is no new HTTP route
or query parameter. Its exact `vm-clinical-priority-1` response contains only
the canonical key, two existing statuses and nullable change reasons. The parser
rejects unknown fields, duplicate selections and reasons on non-re-review rows.

Reasons describe recorded revision metadata, not clinical urgency, an old text
diff, anatomical accuracy, approval or patient-space registration:

- `source-or-teaching`: the scoped saved source or teaching hash differs.
- `other-review-material`: recorded checklist or other review material differs.
- `viewer-only`: a geometry review has the same source, teaching and checklist;
  the renderer differs, and both the saved track revision and material binding
  can be reconstructed using that renderer and the current exact identity.
- `unavailable`: the reason cannot safely be classified; inspect the worksheet.

Body, nested and independent-specimen reasons use their existing scoped
comparison validators. A merely formatted hash or stale revision is not proof
of a viewer-only change. Shoulder remains unclassified. No extra database reads,
decision writes, approval migration or fallback to superseded approvals occurs.
Teaching whose own revision is current does not acquire a renderer-only reason.

Run `node --test scripts/test-clinical-review-priority.mjs` and the existing
`scripts/test-clinical-review-queue.mjs` test. The focused checks use synthetic
in-memory SQLite histories, never private saved reviews. They cover scoped
historical renderer reconstruction, malformed latest records, account isolation,
legacy projection, equal reads and exclusion of notes and reviewer identities.
Website integration must use the normal versioned import, binding and verification
pipeline; do not edit generated copies or migrate existing decisions.
