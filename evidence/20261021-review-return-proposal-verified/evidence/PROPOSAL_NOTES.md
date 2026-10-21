# Clinical Review return context proposal — 21 October 2026

Source: `F:/VisibleMedicine/staging/20261021-source190-website/website`, HEAD `b953ff3f5f1891599cb6e91cb91311d9d6006270`. Source and canonical component preimage SHA-256: `59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd`.

Proposed install paths: `components/ClinicalReviewInbox.tsx` (SHA-256 `f7324e4be67bb1027c403c89a85cb84579fa9f5fcf99a8944b27b11b8537642d`) and new `tests/clinical-review-inbox-return-context.test.mjs` (SHA-256 `6d7e4d25b01ddb5a0576d6af8a23ffb527a98b70bce5ae72ebf71cd3c26d0e89`). These are proposal files only; neither real checkout was edited. Main's V2 isolated native run passes40/40/0skip across the new file and five byte-unchanged existing test files; the first8pass/32fail run remains preserved.

The URL carries bounded display controls (`q`, `area`, `status`, `change`, `page`) for this exact inbox pathname. It preserves other query keys, hash and history state, uses `replaceState` for typing and paging, and restores after mount and on `popstate`. Defaults stay compact; C0/DEL search input is rejected on restore and stripped from live input, with a 200-character cap in both state and URL. The requested row page is retained while a fresh scan accumulates rows; only the rendered page is clamped. Account/access scope, source/catalogue/material revisions, saved decisions and fetched row statuses are never read from the URL; `status` is a display filter only. Existing scan cancellation, invalidation, stale-control guards and explicit pagination focus behavior remain in place; stale handlers cannot write history after unmount, invalidation, route departure or a newer view epoch. Missing or throwing history APIs do not block controls.

Focused commands for main after the frozen full-suite slot releases (run from the source website checkout, after installing the proposed files into the integrated candidate):

```powershell
node --test tests/clinical-review-inbox-return-context.test.mjs
node --test tests/clinical-review-inbox-filter-recovery.test.mjs tests/clinical-review-inbox-scan-focus.test.mjs tests/clinical-review-inbox-pagination-focus.test.mjs tests/clinical-review-inbox-workbench.test.mjs tests/clinical-review-inbox-ui.test.mjs
```

The worker did not run tests because native full suite session37113 owns the heavy slot. Main's first focused run is retained at `F:/VisibleMedicine/staging/20261021-review-queue-return-native-proof/REVIEW_RETURN_CONTEXT.json`:8pass/32fail. The isolated harness omitted the source `tsconfig.json`, so31 original tests hit classic-JSX `React is not defined`; this was not an application regression. The new partial-scan test incorrectly expected a pager for one visible page; it now checks the exact results summary and absent pager while retaining the requested URL page. A fresh V2 harness copies the unchanged real TypeScript configuration. No original tests or application assertions were relaxed.

Browser Back/reopen of the corrected component and1280×720 accessibility checks remain for main. The portable focused test reads its sibling component path and resolves React/TypeScript from the process working directory. It covers deferred mount effects, a windowless render, partial scan pagination, stale handlers and history failure; it is not a browser, real-authentication or full-React-lifecycle acceptance test.
